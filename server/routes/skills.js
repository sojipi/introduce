const express = require('express');
const StorageFactory = require('../services/storageFactory');
const { authenticateToken } = require('./auth');

const router = express.Router();
const edgeStorage = StorageFactory.createStorageService();

// 获取所有技能
router.get('/', async (req, res) => {
    try {
        const { category, level, page = 1, limit = 20, format = 'list' } = req.query;

        const skillsResult = await edgeStorage.get('skills:list');

        if (!skillsResult.success) {
            return res.status(500).json({
                success: false,
                message: '获取技能列表失败'
            });
        }

        let skills = skillsResult.data || [];

        // 如果没有数据，返回默认数据
        if (skills.length === 0) {
            skills = getDefaultSkillsData();
        }

        // 按分类筛选
        if (category && category !== 'all') {
            skills = skills.filter(skill => skill.category === category);
        }

        // 按等级筛选
        if (level) {
            const minLevel = parseInt(level);
            skills = skills.filter(skill => skill.level >= minLevel);
        }

        // 按等级排序（高到低）
        skills.sort((a, b) => b.level - a.level);

        // 根据格式返回不同的数据结构
        if (format === 'grouped') {
            // 按分类分组的格式，用于前端展示
            const groupedSkills = groupSkillsByCategory(skills);
            return res.json({
                success: true,
                data: {
                    skills: groupedSkills
                }
            });
        }

        // 分页
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedSkills = skills.slice(startIndex, endIndex);

        res.json({
            success: true,
            data: {
                skills: paginatedSkills,
                pagination: {
                    current: parseInt(page),
                    pageSize: parseInt(limit),
                    total: skills.length,
                    totalPages: Math.ceil(skills.length / limit)
                }
            }
        });
    } catch (error) {
        console.error('Get skills error:', error);
        res.status(500).json({
            success: false,
            message: '获取技能列表失败'
        });
    }
});

// 获取默认技能数据
function getDefaultSkillsData() {
    return [
        // 前端技术
        { id: '1', name: 'React', category: 'frontend', level: 95, icon: 'fab fa-react', color: '#61DAFB' },
        { id: '2', name: 'Vue.js', category: 'frontend', level: 90, icon: 'fab fa-vuejs', color: '#4FC08D' },
        { id: '3', name: 'JavaScript', category: 'frontend', level: 98, icon: 'fab fa-js', color: '#F7DF1E' },
        { id: '4', name: 'TypeScript', category: 'frontend', level: 88, icon: 'fab fa-js-square', color: '#3178C6' },
        { id: '5', name: 'CSS3/SCSS', category: 'frontend', level: 95, icon: 'fab fa-css3', color: '#1572B6' },
        { id: '6', name: 'HTML5', category: 'frontend', level: 98, icon: 'fab fa-html5', color: '#E34F26' },

        // 后端技术
        { id: '7', name: 'Node.js', category: 'backend', level: 88, icon: 'fab fa-node-js', color: '#339933' },
        { id: '8', name: 'Python', category: 'backend', level: 85, icon: 'fab fa-python', color: '#3776AB' },
        { id: '9', name: 'Java', category: 'backend', level: 82, icon: 'fab fa-java', color: '#ED8B00' },
        { id: '10', name: 'Express', category: 'backend', level: 90, icon: 'fas fa-server', color: '#000000' },
        { id: '11', name: 'MongoDB', category: 'backend', level: 80, icon: 'fas fa-database', color: '#47A248' },
        { id: '12', name: 'PostgreSQL', category: 'backend', level: 75, icon: 'fas fa-database', color: '#336791' },

        // 开发工具
        { id: '13', name: 'Git', category: 'tools', level: 92, icon: 'fab fa-git-alt', color: '#F05032' },
        { id: '14', name: 'Docker', category: 'tools', level: 78, icon: 'fab fa-docker', color: '#2496ED' },
        { id: '15', name: 'AWS', category: 'tools', level: 70, icon: 'fab fa-aws', color: '#FF9900' },
        { id: '16', name: 'Webpack', category: 'tools', level: 85, icon: 'fas fa-cube', color: '#8DD6F9' },
        { id: '17', name: 'Vite', category: 'tools', level: 88, icon: 'fas fa-bolt', color: '#646CFF' },

        // 移动开发
        { id: '18', name: 'React Native', category: 'mobile', level: 80, icon: 'fab fa-react', color: '#61DAFB' },
        { id: '19', name: 'Flutter', category: 'mobile', level: 75, icon: 'fas fa-mobile-alt', color: '#02569B' },
        { id: '20', name: 'Ionic', category: 'mobile', level: 70, icon: 'fas fa-mobile', color: '#3880FF' }
    ];
}

// 按分类分组技能
function groupSkillsByCategory(skills) {
    const categoryTitles = {
        frontend: '前端技术',
        backend: '后端技术',
        tools: '开发工具',
        mobile: '移动开发',
        database: '数据库',
        devops: 'DevOps',
        ai: '人工智能',
        design: '设计工具',
        other: '其他技能'
    };

    const grouped = {};

    skills.forEach(skill => {
        const category = skill.category || 'other';
        if (!grouped[category]) {
            grouped[category] = {
                title: categoryTitles[category] || category,
                skills: []
            };
        }
        grouped[category].skills.push({
            name: skill.name,
            icon: skill.icon || 'fas fa-code',
            level: skill.level,
            color: skill.color || '#00d4ff'
        });
    });

    return grouped;
}

// 获取技能统计（必须在 /:id 之前）
router.get('/stats/summary', async (req, res) => {
    try {
        const skillsResult = await edgeStorage.get('skills:list');
        const skills = skillsResult.data || [];

        // 按分类统计
        const categoryStats = skills.reduce((stats, skill) => {
            const category = skill.category || 'other';
            stats[category] = (stats[category] || 0) + 1;
            return stats;
        }, {});

        // 按等级分布统计
        const levelDistribution = {
            beginner: skills.filter(s => s.level < 30).length,
            intermediate: skills.filter(s => s.level >= 30 && s.level < 70).length,
            advanced: skills.filter(s => s.level >= 70 && s.level < 90).length,
            expert: skills.filter(s => s.level >= 90).length
        };

        // 平均等级
        const averageLevel = skills.length > 0
            ? Math.round(skills.reduce((sum, skill) => sum + skill.level, 0) / skills.length)
            : 0;

        // 顶级技能（等级>=80）
        const topSkills = skills
            .filter(skill => skill.level >= 80)
            .sort((a, b) => b.level - a.level)
            .slice(0, 10);

        res.json({
            success: true,
            data: {
                total: skills.length,
                categoryStats,
                levelDistribution,
                averageLevel,
                topSkills
            }
        });
    } catch (error) {
        console.error('Get skill stats error:', error);
        res.status(500).json({
            success: false,
            message: '获取技能统计失败'
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
            color,
            experience,
            projects,
            certifications,
            learningPath,
            resources
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
            category, // frontend, backend, database, devops, mobile, ai, design, other
            level, // 0-100
            description: description || '',
            icon: icon || '⚡',
            color: color || '#00d4ff',
            experience: experience || '', // 经验描述
            projects: projects || [], // 相关项目
            certifications: certifications || [], // 相关认证
            learningPath: learningPath || [], // 学习路径
            resources: resources || [], // 学习资源
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

// 删除技能的新方法 - 通过分类和名称
router.delete('/remove', authenticateToken, async (req, res) => {
    try {
        const { category, skillName } = req.body;

        if (!category || !skillName) {
            return res.status(400).json({
                success: false,
                message: '分类和技能名称不能为空'
            });
        }

        // 获取技能列表
        const skillsListResult = await edgeStorage.get('skills:list');
        const skillsList = skillsListResult.data || [];

        // 查找要删除的技能
        const skillToDelete = skillsList.find(s => s.category === category && s.name === skillName);

        if (!skillToDelete) {
            return res.status(404).json({
                success: false,
                message: '技能不存在'
            });
        }

        // 删除技能详情
        const deleteResult = await edgeStorage.delete(`skill:${skillToDelete.id}`);

        if (!deleteResult.success) {
            return res.status(500).json({
                success: false,
                message: '删除技能失败'
            });
        }

        // 从技能列表中移除
        const filteredList = skillsList.filter(s => s.id !== skillToDelete.id);
        await edgeStorage.put('skills:list', filteredList);

        res.json({
            success: true,
            message: '技能删除成功'
        });
    } catch (error) {
        console.error('Delete skill by name error:', error);
        res.status(500).json({
            success: false,
            message: '删除技能失败'
        });
    }
});

// 批量更新技能等级
router.patch('/batch/level', authenticateToken, async (req, res) => {
    try {
        const { updates } = req.body; // [{ id, level }, ...]

        if (!updates || !Array.isArray(updates)) {
            return res.status(400).json({
                success: false,
                message: '更新数据格式错误'
            });
        }

        const results = [];

        for (const update of updates) {
            const { id, level } = update;

            if (level < 0 || level > 100) {
                results.push({
                    id,
                    success: false,
                    message: '技能等级必须在0-100之间'
                });
                continue;
            }

            try {
                const skillResult = await edgeStorage.get(`skill:${id}`);
                if (skillResult.success && skillResult.data) {
                    const updatedSkill = {
                        ...skillResult.data,
                        level,
                        updatedAt: new Date().toISOString(),
                        updatedBy: req.user.username
                    };

                    const updateResult = await edgeStorage.put(`skill:${id}`, updatedSkill);
                    results.push({
                        id,
                        success: updateResult.success,
                        message: updateResult.success ? '更新成功' : '更新失败'
                    });
                } else {
                    results.push({
                        id,
                        success: false,
                        message: '技能不存在'
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

        // 更新技能列表
        const skillsListResult = await edgeStorage.get('skills:list');
        const skillsList = skillsListResult.data || [];

        updates.forEach(update => {
            const skillIndex = skillsList.findIndex(s => s.id === update.id);
            if (skillIndex !== -1) {
                skillsList[skillIndex].level = update.level;
                skillsList[skillIndex].updatedAt = new Date().toISOString();
            }
        });

        await edgeStorage.put('skills:list', skillsList);

        res.json({
            success: true,
            message: '批量更新完成',
            data: results
        });
    } catch (error) {
        console.error('Batch update skill levels error:', error);
        res.status(500).json({
            success: false,
            message: '批量更新失败'
        });
    }
});

// 导入技能数据
router.post('/import', authenticateToken, async (req, res) => {
    try {
        const { skills, overwrite = false } = req.body;

        if (!skills || !Array.isArray(skills)) {
            return res.status(400).json({
                success: false,
                message: '技能数据格式错误'
            });
        }

        const results = [];
        const skillsListResult = await edgeStorage.get('skills:list');
        const skillsList = skillsListResult.data || [];

        for (const skillData of skills) {
            try {
                const { name, category, level } = skillData;

                if (!name || !category || level === undefined) {
                    results.push({
                        name: name || 'unknown',
                        success: false,
                        message: '技能名称、分类和等级不能为空'
                    });
                    continue;
                }

                // 检查是否已存在
                const existingSkill = skillsList.find(s => s.name === name);

                if (existingSkill && !overwrite) {
                    results.push({
                        name,
                        success: false,
                        message: '技能已存在，使用覆盖模式可更新'
                    });
                    continue;
                }

                const skillId = existingSkill ? existingSkill.id : Date.now().toString() + Math.random().toString(36).substr(2, 9);
                const skill = {
                    id: skillId,
                    name,
                    category,
                    level,
                    description: skillData.description || '',
                    icon: skillData.icon || '⚡',
                    color: skillData.color || '#00d4ff',
                    experience: skillData.experience || '',
                    projects: skillData.projects || [],
                    certifications: skillData.certifications || [],
                    learningPath: skillData.learningPath || [],
                    resources: skillData.resources || [],
                    createdAt: existingSkill ? existingSkill.createdAt : new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    createdBy: existingSkill ? existingSkill.createdBy : req.user.username,
                    updatedBy: req.user.username
                };

                const saveResult = await edgeStorage.put(`skill:${skillId}`, skill);

                if (saveResult.success) {
                    // 更新列表
                    if (!existingSkill) {
                        skillsList.push({
                            id: skillId,
                            name,
                            category,
                            level,
                            createdAt: skill.createdAt
                        });
                    } else {
                        const index = skillsList.findIndex(s => s.id === skillId);
                        if (index !== -1) {
                            skillsList[index] = {
                                ...skillsList[index],
                                name,
                                category,
                                level,
                                updatedAt: skill.updatedAt
                            };
                        }
                    }

                    results.push({
                        name,
                        success: true,
                        message: existingSkill ? '技能更新成功' : '技能创建成功'
                    });
                } else {
                    results.push({
                        name,
                        success: false,
                        message: '保存失败'
                    });
                }
            } catch (error) {
                results.push({
                    name: skillData.name || 'unknown',
                    success: false,
                    message: error.message
                });
            }
        }

        // 保存更新后的技能列表
        await edgeStorage.put('skills:list', skillsList);

        const successCount = results.filter(r => r.success).length;

        res.json({
            success: true,
            message: `导入完成，成功 ${successCount}/${results.length} 个技能`,
            data: results
        });
    } catch (error) {
        console.error('Import skills error:', error);
        res.status(500).json({
            success: false,
            message: '导入技能失败'
        });
    }
});

module.exports = router;