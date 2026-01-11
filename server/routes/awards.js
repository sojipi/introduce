const express = require('express');
const StorageFactory = require('../services/storageFactory');
const { authenticateToken } = require('./auth');

const router = express.Router();
const edgeStorage = StorageFactory.createStorageService();

// 获取所有获奖记录
router.get('/', async (req, res) => {
    try {
        const { type, year, page = 1, limit = 10 } = req.query;

        const awardsResult = await edgeStorage.get('awards:list');

        if (!awardsResult.success) {
            return res.status(500).json({
                success: false,
                message: '获取获奖记录失败'
            });
        }

        let awards = awardsResult.data || [];

        // 按类型筛选
        if (type && type !== 'all') {
            awards = awards.filter(award => award.type === type);
        }

        // 按年份筛选
        if (year) {
            awards = awards.filter(award => {
                const awardYear = new Date(award.date).getFullYear();
                return awardYear === parseInt(year);
            });
        }

        // 按日期排序（最新的在前）
        awards.sort((a, b) => new Date(b.date) - new Date(a.date));

        // 分页
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedAwards = awards.slice(startIndex, endIndex);

        res.json({
            success: true,
            data: {
                awards: paginatedAwards,
                pagination: {
                    current: parseInt(page),
                    pageSize: parseInt(limit),
                    total: awards.length,
                    totalPages: Math.ceil(awards.length / limit)
                }
            }
        });
    } catch (error) {
        console.error('Get awards error:', error);
        res.status(500).json({
            success: false,
            message: '获取获奖记录失败'
        });
    }
});

// 获取获奖统计 - 必须在 /:id 路由之前
router.get('/stats/summary', async (req, res) => {
    try {
        const awardsResult = await edgeStorage.get('awards:list');
        const awards = awardsResult.data || [];

        // 按类型统计
        const typeStats = awards.reduce((stats, award) => {
            const type = award.type || 'unknown';
            stats[type] = (stats[type] || 0) + 1;
            return stats;
        }, {});

        // 按等级统计
        const levelStats = awards.reduce((stats, award) => {
            const level = award.level || 'unknown';
            stats[level] = (stats[level] || 0) + 1;
            return stats;
        }, {});

        // 按年份统计
        const yearStats = awards.reduce((stats, award) => {
            const year = new Date(award.date).getFullYear();
            stats[year] = (stats[year] || 0) + 1;
            return stats;
        }, {});

        // 最近获奖
        const recentAwards = awards
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);

        res.json({
            success: true,
            data: {
                total: awards.length,
                typeStats,
                levelStats,
                yearStats,
                recentAwards
            }
        });
    } catch (error) {
        console.error('Get award stats error:', error);
        res.status(500).json({
            success: false,
            message: '获取获奖统计失败'
        });
    }
});

// 获取年度获奖趋势 - 必须在 /:id 路由之前
router.get('/stats/trend', async (req, res) => {
    try {
        const { startYear, endYear } = req.query;

        const awardsResult = await edgeStorage.get('awards:list');
        const awards = awardsResult.data || [];

        const currentYear = new Date().getFullYear();
        const start = startYear ? parseInt(startYear) : currentYear - 5;
        const end = endYear ? parseInt(endYear) : currentYear;

        const trendData = [];

        for (let year = start; year <= end; year++) {
            const yearAwards = awards.filter(award => {
                const awardYear = new Date(award.date).getFullYear();
                return awardYear === year;
            });

            const typeBreakdown = yearAwards.reduce((breakdown, award) => {
                const type = award.type || 'unknown';
                breakdown[type] = (breakdown[type] || 0) + 1;
                return breakdown;
            }, {});

            trendData.push({
                year,
                total: yearAwards.length,
                breakdown: typeBreakdown
            });
        }

        res.json({
            success: true,
            data: trendData
        });
    } catch (error) {
        console.error('Get award trend error:', error);
        res.status(500).json({
            success: false,
            message: '获取获奖趋势失败'
        });
    }
});

// 获取单个获奖记录
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const awardResult = await edgeStorage.get(`award:${id}`);

        if (!awardResult.success) {
            return res.status(500).json({
                success: false,
                message: '获取获奖记录失败'
            });
        }

        if (!awardResult.data) {
            return res.status(404).json({
                success: false,
                message: '获奖记录不存在'
            });
        }

        res.json({
            success: true,
            data: awardResult.data
        });
    } catch (error) {
        console.error('Get award error:', error);
        res.status(500).json({
            success: false,
            message: '获取获奖记录失败'
        });
    }
});

// 创建获奖记录
router.post('/', authenticateToken, async (req, res) => {
    try {
        const {
            title,
            competition,
            type,
            level,
            date,
            description,
            certificate,
            teamMembers,
            technologies,
            projectUrl
        } = req.body;

        if (!title || !competition || !type || !level || !date) {
            return res.status(400).json({
                success: false,
                message: '标题、比赛名称、奖项类型、等级和日期不能为空'
            });
        }

        const awardId = Date.now().toString();
        const award = {
            id: awardId,
            title,
            competition,
            type, // gold, silver, bronze, excellence, participation
            level, // national, provincial, municipal, school
            date,
            description: description || '',
            certificate: certificate || '',
            teamMembers: teamMembers || [],
            technologies: technologies || [],
            projectUrl: projectUrl || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: req.user.username
        };

        // 保存获奖记录详情
        const awardResult = await edgeStorage.put(`award:${awardId}`, award);

        if (!awardResult.success) {
            return res.status(500).json({
                success: false,
                message: '创建获奖记录失败'
            });
        }

        // 更新获奖记录列表
        const awardsListResult = await edgeStorage.get('awards:list');
        const awardsList = awardsListResult.data || [];
        awardsList.push({
            id: awardId,
            title,
            competition,
            type,
            level,
            date,
            createdAt: award.createdAt
        });

        await edgeStorage.put('awards:list', awardsList);

        res.json({
            success: true,
            message: '获奖记录创建成功',
            data: award
        });
    } catch (error) {
        console.error('Create award error:', error);
        res.status(500).json({
            success: false,
            message: '创建获奖记录失败'
        });
    }
});

// 更新获奖记录
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // 获取现有获奖记录
        const existingAwardResult = await edgeStorage.get(`award:${id}`);

        if (!existingAwardResult.success) {
            return res.status(500).json({
                success: false,
                message: '获取获奖记录失败'
            });
        }

        if (!existingAwardResult.data) {
            return res.status(404).json({
                success: false,
                message: '获奖记录不存在'
            });
        }

        const existingAward = existingAwardResult.data;

        // 合并更新数据
        const updatedAward = {
            ...existingAward,
            ...updateData,
            id, // 确保ID不被修改
            updatedAt: new Date().toISOString(),
            updatedBy: req.user.username
        };

        // 保存更新后的获奖记录
        const result = await edgeStorage.put(`award:${id}`, updatedAward);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: '更新获奖记录失败'
            });
        }

        // 更新获奖记录列表中的基本信息
        const awardsListResult = await edgeStorage.get('awards:list');
        const awardsList = awardsListResult.data || [];
        const awardIndex = awardsList.findIndex(a => a.id === id);

        if (awardIndex !== -1) {
            awardsList[awardIndex] = {
                ...awardsList[awardIndex],
                title: updatedAward.title,
                competition: updatedAward.competition,
                type: updatedAward.type,
                level: updatedAward.level,
                date: updatedAward.date,
                updatedAt: updatedAward.updatedAt
            };
            await edgeStorage.put('awards:list', awardsList);
        }

        res.json({
            success: true,
            message: '获奖记录更新成功',
            data: updatedAward
        });
    } catch (error) {
        console.error('Update award error:', error);
        res.status(500).json({
            success: false,
            message: '更新获奖记录失败'
        });
    }
});

// 删除获奖记录
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // 检查获奖记录是否存在
        const existingAwardResult = await edgeStorage.get(`award:${id}`);

        if (!existingAwardResult.success) {
            return res.status(500).json({
                success: false,
                message: '获取获奖记录失败'
            });
        }

        if (!existingAwardResult.data) {
            return res.status(404).json({
                success: false,
                message: '获奖记录不存在'
            });
        }

        // 删除获奖记录详情
        const deleteResult = await edgeStorage.delete(`award:${id}`);

        if (!deleteResult.success) {
            return res.status(500).json({
                success: false,
                message: '删除获奖记录失败'
            });
        }

        // 从获奖记录列表中移除
        const awardsListResult = await edgeStorage.get('awards:list');
        const awardsList = awardsListResult.data || [];
        const filteredList = awardsList.filter(a => a.id !== id);
        await edgeStorage.put('awards:list', filteredList);

        res.json({
            success: true,
            message: '获奖记录删除成功'
        });
    } catch (error) {
        console.error('Delete award error:', error);
        res.status(500).json({
            success: false,
            message: '删除获奖记录失败'
        });
    }
});

module.exports = router;