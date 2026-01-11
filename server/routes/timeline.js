const express = require('express');
const StorageFactory = require('../services/storageFactory');
const { authenticateToken } = require('./auth');

const router = express.Router();
const edgeStorage = StorageFactory.createStorageService();

// 获取时间线事件
router.get('/', async (req, res) => {
    try {
        const { status, type, year, page = 1, limit = 20 } = req.query;

        const timelineResult = await edgeStorage.get('timeline:list');

        if (!timelineResult.success) {
            return res.status(500).json({
                success: false,
                message: '获取时间线失败'
            });
        }

        let events = timelineResult.data || [];

        // 按状态筛选
        if (status && status !== 'all') {
            events = events.filter(event => event.status === status);
        }

        // 按类型筛选
        if (type && type !== 'all') {
            events = events.filter(event => event.type === type);
        }

        // 按年份筛选
        if (year) {
            events = events.filter(event => {
                const eventYear = new Date(event.date).getFullYear();
                return eventYear === parseInt(year);
            });
        }

        // 按日期排序
        events.sort((a, b) => new Date(a.date) - new Date(b.date));

        // 分页
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedEvents = events.slice(startIndex, endIndex);

        res.json({
            success: true,
            data: {
                events: paginatedEvents,
                pagination: {
                    current: parseInt(page),
                    pageSize: parseInt(limit),
                    total: events.length,
                    totalPages: Math.ceil(events.length / limit)
                }
            }
        });
    } catch (error) {
        console.error('Get timeline error:', error);
        res.status(500).json({
            success: false,
            message: '获取时间线失败'
        });
    }
});

// 获取时间线统计 - 必须在 /:id 路由之前
router.get('/stats/summary', async (req, res) => {
    try {
        const timelineResult = await edgeStorage.get('timeline:list');
        const events = timelineResult.data || [];

        // 按状态统计
        const statusStats = events.reduce((stats, event) => {
            const status = event.status || 'unknown';
            stats[status] = (stats[status] || 0) + 1;
            return stats;
        }, {});

        // 按类型统计
        const typeStats = events.reduce((stats, event) => {
            const type = event.type || 'unknown';
            stats[type] = (stats[type] || 0) + 1;
            return stats;
        }, {});

        // 按年份统计
        const yearStats = events.reduce((stats, event) => {
            const year = new Date(event.date).getFullYear();
            stats[year] = (stats[year] || 0) + 1;
            return stats;
        }, {});

        // 即将到来的事件
        const now = new Date();
        const upcomingEvents = events
            .filter(event => event.status === 'upcoming' && new Date(event.date) > now)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 5);

        // 最近完成的事件
        const recentCompleted = events
            .filter(event => event.status === 'completed')
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);

        res.json({
            success: true,
            data: {
                total: events.length,
                statusStats,
                typeStats,
                yearStats,
                upcomingEvents,
                recentCompleted
            }
        });
    } catch (error) {
        console.error('Get timeline stats error:', error);
        res.status(500).json({
            success: false,
            message: '获取时间线统计失败'
        });
    }
});

// 获取单个时间线事件
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const eventResult = await edgeStorage.get(`timeline:${id}`);

        if (!eventResult.success) {
            return res.status(500).json({
                success: false,
                message: '获取时间线事件失败'
            });
        }

        if (!eventResult.data) {
            return res.status(404).json({
                success: false,
                message: '时间线事件不存在'
            });
        }

        res.json({
            success: true,
            data: eventResult.data
        });
    } catch (error) {
        console.error('Get timeline event error:', error);
        res.status(500).json({
            success: false,
            message: '获取时间线事件失败'
        });
    }
});

// 创建时间线事件
router.post('/', authenticateToken, async (req, res) => {
    try {
        const {
            title,
            description,
            date,
            type,
            status,
            location,
            organizer,
            participants,
            result,
            links,
            tags
        } = req.body;

        if (!title || !description || !date || !type || !status) {
            return res.status(400).json({
                success: false,
                message: '标题、描述、日期、类型和状态不能为空'
            });
        }

        const eventId = Date.now().toString();
        const event = {
            id: eventId,
            title,
            description,
            date,
            type, // competition, award, project, conference, workshop
            status, // completed, ongoing, upcoming, cancelled
            location: location || '',
            organizer: organizer || '',
            participants: participants || [],
            result: result || '',
            links: links || [],
            tags: tags || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: req.user.username
        };

        // 保存时间线事件详情
        const eventResult = await edgeStorage.put(`timeline:${eventId}`, event);

        if (!eventResult.success) {
            return res.status(500).json({
                success: false,
                message: '创建时间线事件失败'
            });
        }

        // 更新时间线事件列表
        const timelineListResult = await edgeStorage.get('timeline:list');
        const timelineList = timelineListResult.data || [];
        timelineList.push({
            id: eventId,
            title,
            date,
            type,
            status,
            createdAt: event.createdAt
        });

        await edgeStorage.put('timeline:list', timelineList);

        res.json({
            success: true,
            message: '时间线事件创建成功',
            data: event
        });
    } catch (error) {
        console.error('Create timeline event error:', error);
        res.status(500).json({
            success: false,
            message: '创建时间线事件失败'
        });
    }
});

// 更新时间线事件
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // 获取现有时间线事件
        const existingEventResult = await edgeStorage.get(`timeline:${id}`);

        if (!existingEventResult.success) {
            return res.status(500).json({
                success: false,
                message: '获取时间线事件失败'
            });
        }

        if (!existingEventResult.data) {
            return res.status(404).json({
                success: false,
                message: '时间线事件不存在'
            });
        }

        const existingEvent = existingEventResult.data;

        // 合并更新数据
        const updatedEvent = {
            ...existingEvent,
            ...updateData,
            id, // 确保ID不被修改
            updatedAt: new Date().toISOString(),
            updatedBy: req.user.username
        };

        // 保存更新后的时间线事件
        const result = await edgeStorage.put(`timeline:${id}`, updatedEvent);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: '更新时间线事件失败'
            });
        }

        // 更新时间线事件列表中的基本信息
        const timelineListResult = await edgeStorage.get('timeline:list');
        const timelineList = timelineListResult.data || [];
        const eventIndex = timelineList.findIndex(e => e.id === id);

        if (eventIndex !== -1) {
            timelineList[eventIndex] = {
                ...timelineList[eventIndex],
                title: updatedEvent.title,
                date: updatedEvent.date,
                type: updatedEvent.type,
                status: updatedEvent.status,
                updatedAt: updatedEvent.updatedAt
            };
            await edgeStorage.put('timeline:list', timelineList);
        }

        res.json({
            success: true,
            message: '时间线事件更新成功',
            data: updatedEvent
        });
    } catch (error) {
        console.error('Update timeline event error:', error);
        res.status(500).json({
            success: false,
            message: '更新时间线事件失败'
        });
    }
});

// 删除时间线事件
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // 检查时间线事件是否存在
        const existingEventResult = await edgeStorage.get(`timeline:${id}`);

        if (!existingEventResult.success) {
            return res.status(500).json({
                success: false,
                message: '获取时间线事件失败'
            });
        }

        if (!existingEventResult.data) {
            return res.status(404).json({
                success: false,
                message: '时间线事件不存在'
            });
        }

        // 删除时间线事件详情
        const deleteResult = await edgeStorage.delete(`timeline:${id}`);

        if (!deleteResult.success) {
            return res.status(500).json({
                success: false,
                message: '删除时间线事件失败'
            });
        }

        // 从时间线事件列表中移除
        const timelineListResult = await edgeStorage.get('timeline:list');
        const timelineList = timelineListResult.data || [];
        const filteredList = timelineList.filter(e => e.id !== id);
        await edgeStorage.put('timeline:list', filteredList);

        res.json({
            success: true,
            message: '时间线事件删除成功'
        });
    } catch (error) {
        console.error('Delete timeline event error:', error);
        res.status(500).json({
            success: false,
            message: '删除时间线事件失败'
        });
    }
});

// 批量更新事件状态
router.patch('/batch/status', authenticateToken, async (req, res) => {
    try {
        const { eventIds, status } = req.body;

        if (!eventIds || !Array.isArray(eventIds) || !status) {
            return res.status(400).json({
                success: false,
                message: '事件ID列表和状态不能为空'
            });
        }

        const results = [];

        for (const id of eventIds) {
            try {
                const eventResult = await edgeStorage.get(`timeline:${id}`);
                if (eventResult.success && eventResult.data) {
                    const updatedEvent = {
                        ...eventResult.data,
                        status,
                        updatedAt: new Date().toISOString(),
                        updatedBy: req.user.username
                    };

                    const updateResult = await edgeStorage.put(`timeline:${id}`, updatedEvent);
                    results.push({
                        id,
                        success: updateResult.success,
                        message: updateResult.success ? '更新成功' : '更新失败'
                    });
                } else {
                    results.push({
                        id,
                        success: false,
                        message: '事件不存在'
                    });
                }
            } catch (error) {
                results.push({
                    id,
                    success: false,
                    message: error.message
                });
            }
        }

        // 更新时间线事件列表
        const timelineListResult = await edgeStorage.get('timeline:list');
        const timelineList = timelineListResult.data || [];

        eventIds.forEach(id => {
            const eventIndex = timelineList.findIndex(e => e.id === id);
            if (eventIndex !== -1) {
                timelineList[eventIndex].status = status;
                timelineList[eventIndex].updatedAt = new Date().toISOString();
            }
        });

        await edgeStorage.put('timeline:list', timelineList);

        res.json({
            success: true,
            message: '批量更新完成',
            data: results
        });
    } catch (error) {
        console.error('Batch update timeline status error:', error);
        res.status(500).json({
            success: false,
            message: '批量更新失败'
        });
    }
});

module.exports = router;