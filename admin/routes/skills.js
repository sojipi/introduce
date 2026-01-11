const express = require('express');
const StorageFactory = require('../services/storageFactory');
const { authenticateToken } = require('./auth');

const router = express.Router();
const edgeStorage = StorageFactory.createStorageService();

// 获取所有技能
router.get('/', async (req, res) => {
    try {
        console.log('🔍 Getting skills list...');
        const skillsResult = await edgeStorage.get('skills:list');
        console.log('⚡ Skills result:', skillsResult);

        // 如果获取失败或数据不存在，返回空数组
        let skills = [];
        if (skillsResult.success && skillsResult.data) {
            skills = skillsResult.data;
        }

        console.log('📊 Found skills:', skills.length);

        res.json({
            success: true,
            data: {
                skills,
                pagination: {
                    current: 1,
                    pageSize: skills.length,
                    total: skills.length,
                    totalPages: 1
                }
            }
        });
    } catch (error) {
        console.error('❌ Get skills error:', error);
        res.status(500).json({
            success: false,
            message: '获取技能列表失败',
            error: error.message
        });
    }
});

// 获取单个技能
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const skillResult = await edgeStorage.get(`skill:${id}`);

        if (!skillResult.success) {
            return res.status(500).json({
                success: false,
                message: '获取技能失败'
            });
        }

        if (!skillResult.data) {
            return res.status(404).json({
                success: false,
                message: '技能不存在'
            });
        }

        res.json({
            success: true,
            data: skillResult.data
        });
    } catch (error) {
        console.error('Get skill error:', error);
        res.status(500).json({
            success: false,
            message: '获取技能失败'
        });
    }
});

// 创建技能
router.post('/', authenticateToken, async (req, res) => {
    try {
        const {
            name,
            category,
            level,
            description,
            icon,
            color
        } = req.body;

        if (!name || !category || level === undefined) {
            return res.status(400).json({
                success: false,
                message: '技能名称、分类和等级不能为空'
            });
        }

        if (level < 0 || level > 100) {
            return res.status(400).json({
                success: false,
                message: '技能等级必须在0-100之间'
            });
        }

        const skillId = Date.now().toString();
        const skill = {
            id: skillId,
            name,
            category,
            level,
            description: description || '',
            icon: icon || 'fas fa-code',
            color: color || '#00d4ff',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: req.user.username
        };

        // 保存技能详情
        const skillResult = await edgeStorage.put(`skill:${skillId}`, skill);

        if (!skillResult.success) {
            return res.status(500).json({
                success: false,
                message: '创建技能失败'
            });
        }

        // 更新技能列表
        const skillsListResult = await edgeStorage.get('skills:list');
        const skillsList = skillsListResult.data || [];
        skillsList.push({
            id: skillId,
            name,
            category,
            level,
            createdAt: skill.createdAt
        });

        await edgeStorage.put('skills:list', skillsList);

        res.json({
            success: true,
            message: '技能创建成功',
            data: skill
        });
    } catch (error) {
        console.error('Create skill error:', error);
        res.status(500).json({
            success: false,
            message: '创建技能失败'
        });
    }
});

// 更新技能
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // 验证等级范围
        if (updateData.level !== undefined && (updateData.level < 0 || updateData.level > 100)) {
            return res.status(400).json({
                success: false,
                message: '技能等级必须在0-100之间'
            });
        }

        // 获取现有技能
        const existingSkillResult = await edgeStorage.get(`skill:${id}`);

        if (!existingSkillResult.success) {
            return res.status(500).json({
                success: false,
                message: '获取技能失败'
            });
        }

        if (!existingSkillResult.data) {
            return res.status(404).json({
                success: false,
                message: '技能不存在'
            });
        }

        const existingSkill = existingSkillResult.data;

        // 合并更新数据
        const updatedSkill = {
            ...existingSkill,
            ...updateData,
            id, // 确保ID不被修改
            updatedAt: new Date().toISOString(),
            updatedBy: req.user.username
        };

        // 保存更新后的技能
        const result = await edgeStorage.put(`skill:${id}`, updatedSkill);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: '更新技能失败'
            });
        }

        // 更新技能列表中的基本信息
        const skillsListResult = await edgeStorage.get('skills:list');
        const skillsList = skillsListResult.data || [];
        const skillIndex = skillsList.findIndex(s => s.id === id);

        if (skillIndex !== -1) {
            skillsList[skillIndex] = {
                ...skillsList[skillIndex],
                name: updatedSkill.name,
                category: updatedSkill.category,
                level: updatedSkill.level,
                updatedAt: updatedSkill.updatedAt
            };
            await edgeStorage.put('skills:list', skillsList);
        }

        res.json({
            success: true,
            message: '技能更新成功',
            data: updatedSkill
        });
    } catch (error) {
        console.error('Update skill error:', error);
        res.status(500).json({
            success: false,
            message: '更新技能失败'
        });
    }
});

// 删除技能
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // 检查技能是否存在
        const existingSkillResult = await edgeStorage.get(`skill:${id}`);

        if (!existingSkillResult.success) {
            return res.status(500).json({
                success: false,
                message: '获取技能失败'
            });
        }

        if (!existingSkillResult.data) {
            return res.status(404).json({
                success: false,
                message: '技能不存在'
            });
        }

        // 删除技能详情
        const deleteResult = await edgeStorage.delete(`skill:${id}`);

        if (!deleteResult.success) {
            return res.status(500).json({
                success: false,
                message: '删除技能失败'
            });
        }

        // 从技能列表中移除
        const skillsListResult = await edgeStorage.get('skills:list');
        const skillsList = skillsListResult.data || [];
        const filteredList = skillsList.filter(s => s.id !== id);
        await edgeStorage.put('skills:list', filteredList);

        res.json({
            success: true,
            message: '技能删除成功'
        });
    } catch (error) {
        console.error('Delete skill error:', error);
        res.status(500).json({
            success: false,
            message: '删除技能失败'
        });
    }
});

module.exports = router;