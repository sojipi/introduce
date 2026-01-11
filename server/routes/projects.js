const express = require('express');
const StorageFactory = require('../services/storageFactory');
const { authenticateToken } = require('./auth');

const router = express.Router();
const edgeStorage = StorageFactory.createStorageService();

// 获取所有项目
router.get('/', async (req, res) => {
    try {
        const { category, page = 1, limit = 10 } = req.query;

        // 获取项目列表
        const projectsResult = await edgeStorage.get('projects:list');

        if (!projectsResult.success) {
            return res.status(500).json({
                success: false,
                message: '获取项目列表失败'
            });
        }

        let projects = projectsResult.data || [];

        // 按分类筛选
        if (category && category !== 'all') {
            projects = projects.filter(project => project.category === category);
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
        console.error('Get projects error:', error);
        res.status(500).json({
            success: false,
            message: '获取项目失败'
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
            images,
            demoUrl,
            githubUrl,
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
            images: images || [],
            demoUrl: demoUrl || '',
            githubUrl: githubUrl || '',
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

        // 检查项目是否存在
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

        // 删除项目详情
        const deleteResult = await edgeStorage.delete(`project:${id}`);

        if (!deleteResult.success) {
            return res.status(500).json({
                success: false,
                message: '删除项目失败'
            });
        }

        // 从项目列表中移除
        const projectsListResult = await edgeStorage.get('projects:list');
        const projectsList = projectsListResult.data || [];
        const filteredList = projectsList.filter(p => p.id !== id);
        await edgeStorage.put('projects:list', filteredList);

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
            const category = project.category || 'uncategorized';
            stats[category] = (stats[category] || 0) + 1;
            return stats;
        }, {});

        res.json({
            success: true,
            data: categoryStats
        });
    } catch (error) {
        console.error('Get category stats error:', error);
        res.status(500).json({
            success: false,
            message: '获取分类统计失败'
        });
    }
});

// 批量更新项目状态
router.patch('/batch/status', authenticateToken, async (req, res) => {
    try {
        const { projectIds, status } = req.body;

        if (!projectIds || !Array.isArray(projectIds) || !status) {
            return res.status(400).json({
                success: false,
                message: '项目ID列表和状态不能为空'
            });
        }

        const results = [];

        for (const id of projectIds) {
            try {
                const projectResult = await edgeStorage.get(`project:${id}`);
                if (projectResult.success && projectResult.data) {
                    const updatedProject = {
                        ...projectResult.data,
                        status,
                        updatedAt: new Date().toISOString(),
                        updatedBy: req.user.username
                    };

                    const updateResult = await edgeStorage.put(`project:${id}`, updatedProject);
                    results.push({
                        id,
                        success: updateResult.success,
                        message: updateResult.success ? '更新成功' : '更新失败'
                    });
                } else {
                    results.push({
                        id,
                        success: false,
                        message: '项目不存在'
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

        // 更新项目列表
        const projectsListResult = await edgeStorage.get('projects:list');
        const projectsList = projectsListResult.data || [];

        projectIds.forEach(id => {
            const projectIndex = projectsList.findIndex(p => p.id === id);
            if (projectIndex !== -1) {
                projectsList[projectIndex].status = status;
                projectsList[projectIndex].updatedAt = new Date().toISOString();
            }
        });

        await edgeStorage.put('projects:list', projectsList);

        res.json({
            success: true,
            message: '批量更新完成',
            data: results
        });
    } catch (error) {
        console.error('Batch update status error:', error);
        res.status(500).json({
            success: false,
            message: '批量更新失败'
        });
    }
});

module.exports = router;