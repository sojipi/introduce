const express = require('express');
const StorageFactory = require('../services/storageFactory');
const { authenticateToken } = require('./auth');

const router = express.Router();
const edgeStorage = StorageFactory.createStorageService();

// 获取所有项目 (公开访问)
router.get('/', async (req, res) => {
    try {
        const { category, page = 1, limit = 10 } = req.query;

        console.log('🔍 Getting projects list...');
        const projectsResult = await edgeStorage.get('projects:list');
        console.log('📋 Projects result:', projectsResult);

        if (!projectsResult.success) {
            console.error('❌ Failed to get projects list:', projectsResult.error);
            return res.status(500).json({
                success: false,
                message: '获取项目列表失败',
                error: projectsResult.error
            });
        }

        let projects = projectsResult.data || [];
        console.log('📊 Found projects:', projects.length);

        // 获取完整的项目详情
        const fullProjects = [];
        for (const projectSummary of projects) {
            try {
                const projectDetailResult = await edgeStorage.get(`project:${projectSummary.id}`);
                if (projectDetailResult.success && projectDetailResult.data) {
                    fullProjects.push(projectDetailResult.data);
                } else {
                    // 如果获取详情失败，使用基本信息并添加默认值
                    fullProjects.push({
                        ...projectSummary,
                        description: projectSummary.description || '',
                        tech: projectSummary.tech || [],
                        icon: projectSummary.icon || '🚀'
                    });
                }
            } catch (error) {
                console.error(`Error fetching project ${projectSummary.id}:`, error);
                // 添加默认值以防止前端错误
                fullProjects.push({
                    ...projectSummary,
                    description: '',
                    tech: [],
                    icon: '🚀'
                });
            }
        }

        // 按分类筛选
        if (category && category !== 'all') {
            const filteredProjects = fullProjects.filter(project => project.category === category);
            projects = filteredProjects;
        } else {
            projects = fullProjects;
        }

        // 分页
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedProjects = projects.slice(startIndex, endIndex);

        res.json({
            success: true,
            data: {
                projects: paginatedProjects,
                pagination: {
                    current: parseInt(page),
                    pageSize: parseInt(limit),
                    total: projects.length,
                    totalPages: Math.ceil(projects.length / limit)
                }
            }
        });
    } catch (error) {
        console.error('❌ Get projects error:', error);
        res.status(500).json({
            success: false,
            message: '获取项目失败',
            error: error.message
        });
    }
});

// 获取单个项目
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const projectResult = await edgeStorage.get(`project:${id}`);

        if (!projectResult.success) {
            return res.status(500).json({
                success: false,
                message: '获取项目失败'
            });
        }

        if (!projectResult.data) {
            return res.status(404).json({
                success: false,
                message: '项目不存在'
            });
        }

        res.json({
            success: true,
            data: projectResult.data
        });
    } catch (error) {
        console.error('Get project error:', error);
        res.status(500).json({
            success: false,
            message: '获取项目失败'
        });
    }
});

// 创建项目
router.post('/', authenticateToken, async (req, res) => {
    try {
        const {
            title,
            description,
            category,
            tech,
            icon,
            status = 'active'
        } = req.body;

        if (!title || !description || !category) {
            return res.status(400).json({
                success: false,
                message: '标题、描述和分类不能为空'
            });
        }

        const projectId = Date.now().toString();
        const project = {
            id: projectId,
            title,
            description,
            category,
            tech: tech || [],
            icon: icon || '🚀',
            status,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: req.user.username
        };

        // 保存项目详情
        const projectResult = await edgeStorage.put(`project:${projectId}`, project);

        if (!projectResult.success) {
            return res.status(500).json({
                success: false,
                message: '创建项目失败'
            });
        }

        // 更新项目列表
        const projectsListResult = await edgeStorage.get('projects:list');
        const projectsList = projectsListResult.data || [];
        projectsList.push({
            id: projectId,
            title,
            category,
            status,
            createdAt: project.createdAt
        });

        await edgeStorage.put('projects:list', projectsList);

        res.json({
            success: true,
            message: '项目创建成功',
            data: project
        });
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({
            success: false,
            message: '创建项目失败'
        });
    }
});

// 更新项目
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // 获取现有项目
        const existingProjectResult = await edgeStorage.get(`project:${id}`);

        if (!existingProjectResult.success) {
            return res.status(500).json({
                success: false,
                message: '获取项目失败'
            });
        }

        if (!existingProjectResult.data) {
            return res.status(404).json({
                success: false,
                message: '项目不存在'
            });
        }

        const existingProject = existingProjectResult.data;

        // 合并更新数据
        const updatedProject = {
            ...existingProject,
            ...updateData,
            id, // 确保ID不被修改
            updatedAt: new Date().toISOString(),
            updatedBy: req.user.username
        };

        // 保存更新后的项目
        const result = await edgeStorage.put(`project:${id}`, updatedProject);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: '更新项目失败'
            });
        }

        // 更新项目列表中的基本信息
        const projectsListResult = await edgeStorage.get('projects:list');
        const projectsList = projectsListResult.data || [];
        const projectIndex = projectsList.findIndex(p => p.id === id);

        if (projectIndex !== -1) {
            projectsList[projectIndex] = {
                ...projectsList[projectIndex],
                title: updatedProject.title,
                category: updatedProject.category,
                status: updatedProject.status,
                updatedAt: updatedProject.updatedAt
            };
            await edgeStorage.put('projects:list', projectsList);
        }

        res.json({
            success: true,
            message: '项目更新成功',
            data: updatedProject
        });
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({
            success: false,
            message: '更新项目失败'
        });
    }
});

// 删除项目
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        console.log(`🗑️ 开始删除项目: ${id}`);

        // 检查项目是否存在
        const existingProjectResult = await edgeStorage.get(`project:${id}`);

        if (!existingProjectResult.success) {
            console.log(`❌ 获取项目失败: ${id}`);
            return res.status(500).json({
                success: false,
                message: '获取项目失败'
            });
        }

        if (!existingProjectResult.data) {
            console.log(`❌ 项目不存在: ${id}`);
            return res.status(404).json({
                success: false,
                message: '项目不存在'
            });
        }

        // 先从项目列表中移除
        console.log(`📝 从项目列表中移除: ${id}`);
        const projectsListResult = await edgeStorage.get('projects:list');

        if (projectsListResult.success && projectsListResult.data) {
            const projectsList = projectsListResult.data;
            const filteredList = projectsList.filter(p => p.id !== id);

            console.log(`📊 原列表长度: ${projectsList.length}, 过滤后长度: ${filteredList.length}`);

            const updateListResult = await edgeStorage.put('projects:list', filteredList);
            if (!updateListResult.success) {
                console.log(`❌ 更新项目列表失败: ${id}`);
                return res.status(500).json({
                    success: false,
                    message: '更新项目列表失败'
                });
            }
        }

        // 删除项目详情
        console.log(`🗑️ 删除项目详情: ${id}`);
        const deleteResult = await edgeStorage.delete(`project:${id}`);

        if (!deleteResult.success) {
            console.log(`❌ 删除项目详情失败: ${id}`);
            return res.status(500).json({
                success: false,
                message: '删除项目失败'
            });
        }

        console.log(`✅ 项目删除成功: ${id}`);
        res.json({
            success: true,
            message: '项目删除成功'
        });
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({
            success: false,
            message: '删除项目失败'
        });
    }
});

// 获取项目分类统计
router.get('/stats/categories', async (req, res) => {
    try {
        const projectsResult = await edgeStorage.get('projects:list');
        const projects = projectsResult.data || [];

        const categoryStats = projects.reduce((stats, project) => {
            const category = project.category || 'unknown';
            stats[category] = (stats[category] || 0) + 1;
            return stats;
        }, {});

        res.json({
            success: true,
            data: categoryStats
        });
    } catch (error) {
        console.error('Get project category stats error:', error);
        res.status(500).json({
            success: false,
            message: '获取项目分类统计失败'
        });
    }
});

module.exports = router;