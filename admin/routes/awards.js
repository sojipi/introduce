const express = require('express');
const StorageFactory = require('../services/storageFactory');
const { authenticateToken } = require('./auth');

const router = express.Router();
const edgeStorage = StorageFactory.createStorageService();

// 获取所有获奖记录
router.get('/', async (req, res) => {
    try {
        console.log('🔍 Getting awards list...');
        const awardsResult = await edgeStorage.get('awards:list');
        console.log('🏆 Awards result:', awardsResult);

        // 如果获取失败或数据不存在，返回空数组
        let awards = [];
        if (awardsResult.success && awardsResult.data) {
            awards = awardsResult.data;
        }

        console.log('📊 Found awards:', awards.length);

        res.json({
            success: true,
            data: {
                awards,
                pagination: {
                    current: 1,
                    pageSize: awards.length,
                    total: awards.length,
                    totalPages: 1
                }
            }
        });
    } catch (error) {
        console.error('❌ Get awards error:', error);
        res.status(500).json({
            success: false,
            message: '获取获奖记录失败',
            error: error.message
        });
    }
});

// 获取单个获奖记录
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`🔍 Getting award with ID: ${id}`);
        console.log(`🔑 Storage key: award:${id}`);

        const awardResult = await edgeStorage.get(`award:${id}`);
        console.log('📊 Award result:', {
            success: awardResult.success,
            hasData: !!awardResult.data,
            error: awardResult.error
        });

        if (!awardResult.success) {
            console.log('❌ Storage get failed:', awardResult.error);
            return res.status(500).json({
                success: false,
                message: '获取获奖记录失败'
            });
        }

        if (!awardResult.data) {
            console.log('❌ Award not found in storage');
            return res.status(404).json({
                success: false,
                message: '获奖记录不存在'
            });
        }

        console.log('✅ Award found:', awardResult.data.title);
        res.json({
            success: true,
            data: awardResult.data
        });
    } catch (error) {
        console.error('❌ Get award error:', error);
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

        console.log('📝 创建获奖记录，接收到的数据:', JSON.stringify(req.body, null, 2));

        if (!title || !competition || !type) {
            return res.status(400).json({
                success: false,
                message: '标题、比赛名称和奖项类型不能为空'
            });
        }

        const awardId = `award-${Date.now()}`;
        const award = {
            id: awardId,
            title: title || '',
            competition: competition || '',
            type: type || '',
            level: level || 'other',
            date: date || new Date().toISOString().split('T')[0],
            description: description || '',
            certificate: certificate || '',
            teamMembers: Array.isArray(teamMembers) ? teamMembers : [],
            technologies: Array.isArray(technologies) ? technologies : [],
            projectUrl: projectUrl || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: req.user.username
        };

        console.log('💾 准备保存的获奖记录:', JSON.stringify(award, null, 2));

        // 保存获奖详情
        const awardResult = await edgeStorage.put(`award:${awardId}`, award);

        if (!awardResult.success) {
            console.log('❌ 保存获奖详情失败:', awardResult.error);
            return res.status(500).json({
                success: false,
                message: '创建获奖记录失败'
            });
        }

        // 更新获奖列表
        const awardsListResult = await edgeStorage.get('awards:list');
        const awardsList = awardsListResult.data || [];
        awardsList.push({
            id: awardId,
            title: award.title,
            competition: award.competition,
            type: award.type,
            level: award.level,
            date: award.date,
            createdAt: award.createdAt
        });

        const updateListResult = await edgeStorage.put('awards:list', awardsList);

        if (!updateListResult.success) {
            console.log('❌ 更新获奖列表失败:', updateListResult.error);
        }

        console.log('✅ 获奖记录创建成功:', awardId);
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

        console.log(`🔄 开始更新获奖记录: ${id}`);
        console.log('📝 更新数据:', JSON.stringify(updateData, null, 2));
        console.log('🔧 Storage mode:', process.env.KV_STORAGE_MODE || 'cloud (default)');

        // 获取现有获奖记录
        console.log(`🔍 获取现有获奖记录: award:${id}`);
        const existingAwardResult = await edgeStorage.get(`award:${id}`);

        console.log('📊 获取结果:', {
            success: existingAwardResult.success,
            hasData: !!existingAwardResult.data,
            dataType: existingAwardResult.data ? typeof existingAwardResult.data : 'null',
            error: existingAwardResult.error
        });

        let updatedAward;

        if (!existingAwardResult.success) {
            // 如果获取记录失败，创建新的条目
            console.log('⚠️ 获取获奖记录失败，创建新条目');
            updatedAward = {
                id,
                title: updateData.title || '',
                competition: updateData.competition || '',
                type: updateData.type || '',
                level: updateData.level || 'other',
                date: updateData.date || new Date().toISOString().split('T')[0],
                description: updateData.description || '',
                certificate: updateData.certificate || '',
                teamMembers: Array.isArray(updateData.teamMembers) ? updateData.teamMembers : [],
                technologies: Array.isArray(updateData.technologies) ? updateData.technologies : [],
                projectUrl: updateData.projectUrl || '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: req.user.username,
                updatedBy: req.user.username
            };
        } else if (!existingAwardResult.data) {
            console.log('❌ 获奖记录不存在:', id);
            console.log('💡 提示: 请检查存储模式是否一致，以及数据是否在正确的存储中');
            return res.status(404).json({
                success: false,
                message: '获奖记录不存在'
            });
        } else {
            const existingAward = existingAwardResult.data;
            console.log('✅ 找到现有获奖记录:', existingAward.title);

            // 合并更新数据，确保所有字段都被正确处理
            updatedAward = {
                ...existingAward,
                title: updateData.title || existingAward.title || '',
                competition: updateData.competition || existingAward.competition || '',
                type: updateData.type || existingAward.type || '',
                level: updateData.level || existingAward.level || 'other',
                date: updateData.date || existingAward.date || new Date().toISOString().split('T')[0],
                description: updateData.description !== undefined ? updateData.description : (existingAward.description || ''),
                certificate: updateData.certificate !== undefined ? updateData.certificate : (existingAward.certificate || ''),
                teamMembers: Array.isArray(updateData.teamMembers) ? updateData.teamMembers : (existingAward.teamMembers || []),
                technologies: Array.isArray(updateData.technologies) ? updateData.technologies : (existingAward.technologies || []),
                projectUrl: updateData.projectUrl !== undefined ? updateData.projectUrl : (existingAward.projectUrl || ''),
                id, // 确保ID不被修改
                updatedAt: new Date().toISOString(),
                updatedBy: req.user.username,
                createdAt: existingAward.createdAt, // 保持原创建时间
                createdBy: existingAward.createdBy // 保持原创建者
            };
        }

        console.log('📝 合并后的数据:', JSON.stringify(updatedAward, null, 2));

        // 保存更新后的获奖记录
        console.log(`💾 保存更新后的获奖记录: award:${id}`);
        const result = await edgeStorage.put(`award:${id}`, updatedAward);

        if (!result.success) {
            console.log('❌ 保存获奖记录失败:', result.error);
            return res.status(500).json({
                success: false,
                message: '更新获奖记录失败'
            });
        }

        // 更新获奖列表中的基本信息
        console.log('📋 更新获奖列表...');
        const awardsListResult = await edgeStorage.get('awards:list');
        const awardsList = awardsListResult.data || [];
        const awardIndex = awardsList.findIndex(a => a.id === id);

        console.log(`📊 列表中找到索引: ${awardIndex}, 总数: ${awardsList.length}`);

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
            console.log('✅ 获奖列表更新成功');
        } else {
            // 如果列表中不存在该记录，添加到列表中
            console.log('📝 列表中不存在该记录，添加到列表');
            awardsList.push({
                id: updatedAward.id,
                title: updatedAward.title,
                competition: updatedAward.competition,
                type: updatedAward.type,
                level: updatedAward.level,
                date: updatedAward.date,
                createdAt: updatedAward.createdAt,
                updatedAt: updatedAward.updatedAt
            });
            await edgeStorage.put('awards:list', awardsList);
            console.log('✅ 获奖记录已添加到列表');
        }

        console.log('✅ 获奖记录更新完成');
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
            // 如果获取记录失败，只删除 awards:list 中的条目
            console.log('⚠️ 获取获奖记录失败，只删除列表中的条目');
            console.log('🔍 要删除的ID:', id);
            const awardsListResult = await edgeStorage.get('awards:list');
            const awardsList = awardsListResult.data || [];
            console.log('📋 删除前的列表:', awardsList.map(a => ({ id: a.id, title: a.title })));
            const filteredList = awardsList.filter(a => {
                const shouldKeep = a.id !== id;
                console.log(`  检查 ${a.id}: ${shouldKeep ? '保留' : '删除'}`);
                return shouldKeep;
            });
            console.log('📋 删除后的列表:', filteredList.map(a => ({ id: a.id, title: a.title })));
            const updateResult = await edgeStorage.put('awards:list', filteredList);
            console.log('💾 更新列表结果:', updateResult.success ? '成功' : '失败');

            return res.json({
                success: true,
                message: '获奖记录已从列表中删除'
            });
        }

        if (!existingAwardResult.data) {
            return res.status(404).json({
                success: false,
                message: '获奖记录不存在'
            });
        }

        // 删除获奖详情
        const deleteResult = await edgeStorage.delete(`award:${id}`);

        if (!deleteResult.success) {
            return res.status(500).json({
                success: false,
                message: '删除获奖记录失败'
            });
        }

        // 从获奖列表中移除
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

// 获取获奖统计
router.get('/stats/summary', async (req, res) => {
    try {
        const awardsResult = await edgeStorage.get('awards:list');
        const awards = awardsResult.data || [];

        const typeStats = awards.reduce((stats, award) => {
            const type = award.type || 'unknown';
            stats[type] = (stats[type] || 0) + 1;
            return stats;
        }, {});

        res.json({
            success: true,
            data: {
                total: awards.length,
                typeStats
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

module.exports = router;