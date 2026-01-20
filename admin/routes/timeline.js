const express = require('express');
const StorageFactory = require('../services/storageFactory');
const { authenticateToken } = require('./auth');

const router = express.Router();
const edgeStorage = StorageFactory.createStorageService();

// 获取时间线事件
router.get('/', async (req, res) => {
    try {
        console.log('🔍 Getting timeline list...');
        const timelineResult = await edgeStorage.get('timeline:list');
        console.log('📅 Timeline result:', timelineResult);

        // 如果获取失败或数据不存在，返回空数组
        let events = [];
        if (timelineResult.success && timelineResult.data) {
            // 如果返回的是字符串，需要解析为对象
            if (typeof timelineResult.data === 'string') {
                try {
                    events = JSON.parse(timelineResult.data);
                } catch (error) {
                    console.error('Failed to parse timeline data:', error);
                    events = [];
                }
            } else {
                events = timelineResult.data;
            }
        }

        console.log('📊 Found events:', events.length);

        res.json({
            success: true,
            data: {
                events,
                pagination: {
                    current: 1,
                    pageSize: events.length,
                    total: events.length,
                    totalPages: 1
                }
            }
        });
    } catch (error) {
        console.error('❌ Get timeline error:', error);
        res.status(500).json({
            success: false,
            message: '获取时间线失败',
            error: error.message
        });
    }
});

// 获取时间线统计（必须在 /:id 之前）
router.get('/stats/summary', async (req, res) => {
    try {
        const timelineResult = await edgeStorage.get('timeline:list');
        let events = [];

        if (timelineResult.success && timelineResult.data) {
            if (typeof timelineResult.data === 'string') {
                try {
                    events = JSON.parse(timelineResult.data);
                } catch (error) {
                    console.error('Failed to parse timeline data:', error);
                }
            } else {
                events = timelineResult.data;
            }
        }

        // 按状态统计
        const statusStats = {
            completed: events.filter(e => e.status === 'completed').length,
            ongoing: events.filter(e => e.status === 'ongoing').length,
            upcoming: events.filter(e => e.status === 'upcoming').length
        };

        // 按类型统计
        const typeStats = events.reduce((stats, event) => {
            const type = event.type || 'other';
            stats[type] = (stats[type] || 0) + 1;
            return stats;
        }, {});

        // 按年份统计
        const yearStats = events.reduce((stats, event) => {
            if (event.date) {
                const year = new Date(event.date).getFullYear();
                stats[year] = (stats[year] || 0) + 1;
            }
            return stats;
        }, {});

        // 最近的事件
        const recentEvents = events
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);

        res.json({
            success: true,
            data: {
                total: events.length,
                statusStats,
                typeStats,
                yearStats,
                recentEvents
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

        const timelineResult = await edgeStorage.get(`timeline:${id}`);

        if (!timelineResult.success) {
            return res.status(500).json({
                success: false,
                message: '获取时间线事件失败'
            });
        }

        if (!timelineResult.data) {
            return res.status(404).json({
                success: false,
                message: '时间线事件不存在'
            });
        }

        let timelineData = timelineResult.data;

        // 如果返回的是字符串，需要解析为对象
        if (typeof timelineData === 'string') {
            try {
                timelineData = JSON.parse(timelineData);
            } catch (error) {
                console.error('Failed to parse timeline data:', error);
                return res.status(500).json({
                    success: false,
                    message: '时间线数据格式错误'
                });
            }
        }

        res.json({
            success: true,
            data: timelineData
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
            type,
            status,
            date,
            location,
            organizer,
            participants,
            result
        } = req.body;

        if (!title || !type || !date) {
            return res.status(400).json({
                success: false,
                message: '标题、类型和日期不能为空'
            });
        }

        const timelineId = Date.now().toString();
        const timelineEvent = {
            id: timelineId,
            title,
            description: description || '',
            type,
            status: status || 'upcoming',
            date,
            location: location || '',
            organizer: organizer || '',
            participants: participants || '',
            result: result || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: req.user.username
        };

        // 保存时间线事件详情
        const timelineResult = await edgeStorage.put(`timeline:${timelineId}`, JSON.stringify(timelineEvent));

        if (!timelineResult.success) {
            return res.status(500).json({
                success: false,
                message: '创建时间线事件失败'
            });
        }

        // 更新时间线列表
        const timelineListResult = await edgeStorage.get('timeline:list');
        let timelineList = [];

        if (timelineListResult.success && timelineListResult.data) {
            if (typeof timelineListResult.data === 'string') {
                try {
                    timelineList = JSON.parse(timelineListResult.data);
                } catch (error) {
                    console.error('Failed to parse timeline list:', error);
                    timelineList = [];
                }
            } else {
                timelineList = timelineListResult.data;
            }
        }

        timelineList.push({
            id: timelineId,
            title,
            type,
            status,
            date,
            createdAt: timelineEvent.createdAt
        });

        await edgeStorage.put('timeline:list', JSON.stringify(timelineList));

        res.json({
            success: true,
            message: '时间线事件创建成功',
            data: timelineEvent
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
        const existingTimelineResult = await edgeStorage.get(`timeline:${id}`);

        if (!existingTimelineResult.success) {
            return res.status(500).json({
                success: false,
                message: '获取时间线事件失败'
            });
        }

        if (!existingTimelineResult.data) {
            return res.status(404).json({
                success: false,
                message: '时间线事件不存在'
            });
        }

        let existingTimeline = existingTimelineResult.data;

        // 如果返回的是字符串，需要解析为对象
        if (typeof existingTimeline === 'string') {
            try {
                existingTimeline = JSON.parse(existingTimeline);
            } catch (error) {
                console.error('Failed to parse timeline data:', error);
                return res.status(500).json({
                    success: false,
                    message: '时间线数据格式错误'
                });
            }
        }

        // 合并更新数据
        const updatedTimeline = {
            ...existingTimeline,
            ...updateData,
            id, // 确保ID不被修改
            updatedAt: new Date().toISOString(),
            updatedBy: req.user.username
        };

        // 保存更新后的时间线事件
        const result = await edgeStorage.put(`timeline:${id}`, JSON.stringify(updatedTimeline));

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: '更新时间线事件失败'
            });
        }

        // 更新时间线列表中的基本信息
        const timelineListResult = await edgeStorage.get('timeline:list');
        let timelineList = [];

        if (timelineListResult.success && timelineListResult.data) {
            if (typeof timelineListResult.data === 'string') {
                try {
                    timelineList = JSON.parse(timelineListResult.data);
                } catch (error) {
                    console.error('Failed to parse timeline list:', error);
                    timelineList = [];
                }
            } else {
                timelineList = timelineListResult.data;
            }
        }

        const timelineIndex = timelineList.findIndex(t => t.id === id);

        if (timelineIndex !== -1) {
            timelineList[timelineIndex] = {
                ...timelineList[timelineIndex],
                title: updatedTimeline.title,
                type: updatedTimeline.type,
                status: updatedTimeline.status,
                date: updatedTimeline.date,
                updatedAt: updatedTimeline.updatedAt
            };
            await edgeStorage.put('timeline:list', JSON.stringify(timelineList));
        }

        res.json({
            success: true,
            message: '时间线事件更新成功',
            data: updatedTimeline
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
        console.log('🗑️ Attempting to delete timeline:', id);

        // 检查时间线事件是否存在
        const existingTimelineResult = await edgeStorage.get(`timeline:${id}`);
        console.log('📋 Existing timeline result:', existingTimelineResult);

        if (!existingTimelineResult.success) {
            console.error('❌ Failed to get timeline:', existingTimelineResult.error);
            return res.status(500).json({
                success: false,
                message: '获取时间线事件失败',
                error: existingTimelineResult.error
            });
        }

        if (!existingTimelineResult.data) {
            console.warn('⚠️ Timeline not found:', id);
            return res.status(404).json({
                success: false,
                message: '时间线事件不存在'
            });
        }

        // 删除时间线事件详情
        console.log('🗑️ Deleting timeline detail...');
        const deleteResult = await edgeStorage.delete(`timeline:${id}`);
        console.log('📋 Delete result:', deleteResult);

        if (!deleteResult.success) {
            return res.status(500).json({
                success: false,
                message: '删除时间线事件失败'
            });
        }

        // 从时间线列表中移除
        console.log('📋 Updating timeline list...');
        const timelineListResult = await edgeStorage.get('timeline:list');
        let timelineList = [];

        if (timelineListResult.success && timelineListResult.data) {
            if (typeof timelineListResult.data === 'string') {
                try {
                    timelineList = JSON.parse(timelineListResult.data);
                } catch (error) {
                    console.error('Failed to parse timeline list:', error);
                    timelineList = [];
                }
            } else {
                timelineList = timelineListResult.data;
            }
        }

        console.log('📊 Timeline list before filter:', timelineList.length);
        const filteredList = timelineList.filter(t => t.id !== id);
        console.log('📊 Timeline list after filter:', filteredList.length);

        await edgeStorage.put('timeline:list', JSON.stringify(filteredList));

        res.json({
            success: true,
            message: '时间线事件删除成功'
        });
    } catch (error) {
        console.error('Delete timeline event error:', error);
        res.status(500).json({
            success: false,
            message: '删除时间线事件失败',
            error: error.message
        });
    }
});

module.exports = router;