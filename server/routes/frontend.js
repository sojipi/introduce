const express = require('express');
const StorageFactory = require('../../admin/services/storageFactory');

const router = express.Router();
const edgeStorage = StorageFactory.createStorageService();

// 分段API - 只获取技能数据
router.get('/skills', async (req, res) => {
    try {
        console.log('🎯 获取技能数据...');
        const skillsResult = await getSkillsFromKV();

        const skills = skillsResult.success ? skillsResult.data : getDefaultSkillsData();

        res.json({
            success: true,
            data: skills
        });
    } catch (error) {
        console.error('获取技能数据失败:', error);
        res.status(500).json({
            success: false,
            message: '获取技能数据失败',
            data: getDefaultSkillsData()
        });
    }
});

// 分段API - 只获取项目数据
router.get('/projects', async (req, res) => {
    try {
        console.log('🚀 获取项目数据...');
        const projectsResult = await getProjectsFromKV();

        const projects = projectsResult.success ? projectsResult.data : getDefaultProjectsData();

        res.json({
            success: true,
            data: projects
        });
    } catch (error) {
        console.error('获取项目数据失败:', error);
        res.status(500).json({
            success: false,
            message: '获取项目数据失败',
            data: getDefaultProjectsData()
        });
    }
});

// 分段API - 只获取获奖数据
router.get('/awards', async (req, res) => {
    try {
        console.log('🏆 获取获奖数据...');
        const awardsResult = await getAwardsFromKV();

        const awards = awardsResult.success ? awardsResult.data : [];

        res.json({
            success: true,
            data: awards
        });
    } catch (error) {
        console.error('获取获奖数据失败:', error);
        res.status(500).json({
            success: false,
            message: '获取获奖数据失败',
            data: []
        });
    }
});

// 分段API - 只获取时间线数据
router.get('/timeline', async (req, res) => {
    try {
        console.log('📅 获取时间线数据...');
        const timelineResult = await getTimelineFromKV();

        const timeline = timelineResult.success ? timelineResult.data : getDefaultTimelineData();

        res.json({
            success: true,
            data: timeline
        });
    } catch (error) {
        console.error('获取时间线数据失败:', error);
        res.status(500).json({
            success: false,
            message: '获取时间线数据失败',
            data: getDefaultTimelineData()
        });
    }
});

// 分段API - 只获取统计数据（轻量级，页面加载时立即获取）
router.get('/stats', async (req, res) => {
    try {
        console.log('📊 获取统计数据...');

        // 快速获取基本统计信息，不需要完整数据
        const [skillsListResult, projectsListResult, awardsListResult, timelineListResult] = await Promise.allSettled([
            edgeStorage.get('skills:list'),
            edgeStorage.get('projects:list'),
            edgeStorage.get('awards:list'),
            edgeStorage.get('timeline:list')
        ]);

        const skillsCount = skillsListResult.status === 'fulfilled' && skillsListResult.value.success
            ? skillsListResult.value.data?.length || 0 : 20;
        const projectsCount = projectsListResult.status === 'fulfilled' && projectsListResult.value.success
            ? projectsListResult.value.data?.length || 0 : 8;
        const awardsCount = awardsListResult.status === 'fulfilled' && awardsListResult.value.success
            ? awardsListResult.value.data?.length || 0 : 5;
        const timelineCount = timelineListResult.status === 'fulfilled' && timelineListResult.value.success
            ? timelineListResult.value.data?.length || 0 : 10;

        const stats = {
            skillsCount,
            projectsCount,
            awardsCount,
            experienceYears: 15,
            timelineCount
        };

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('获取统计数据失败:', error);
        res.status(500).json({
            success: false,
            message: '获取统计数据失败',
            data: {
                skillsCount: 20,
                projectsCount: 8,
                awardsCount: 5,
                experienceYears: 15,
                timelineCount: 10
            }
        });
    }
});

// 获取前端展示页面所需的所有数据（保留原接口用于兼容）
router.get('/showcase', async (req, res) => {
    try {
        console.log('📊 获取前端展示数据...');

        // 并行获取所有数据
        const [skillsResult, projectsResult, awardsResult, timelineResult] = await Promise.allSettled([
            getSkillsFromKV(),
            getProjectsFromKV(),
            getAwardsFromKV(),
            getTimelineFromKV()
        ]);

        // 处理技能数据
        const skills = skillsResult.status === 'fulfilled' && skillsResult.value.success
            ? skillsResult.value.data
            : getDefaultSkillsData();

        // 处理项目数据
        const projects = projectsResult.status === 'fulfilled' && projectsResult.value.success
            ? projectsResult.value.data
            : getDefaultProjectsData();

        // 处理获奖数据
        const awards = awardsResult.status === 'fulfilled' && awardsResult.value.success
            ? awardsResult.value.data
            : getDefaultAwardsData();

        // 处理时间线数据
        const timeline = timelineResult.status === 'fulfilled' && timelineResult.value.success
            ? timelineResult.value.data
            : getDefaultTimelineData();

        // 计算统计数据
        const stats = calculateStats(skills, projects, awards, timeline);

        // 返回整合的数据
        res.json({
            success: true,
            data: {
                skills,
                projects,
                awards,
                timeline,
                stats
            },
            timestamp: new Date().toISOString(),
            source: 'kv-storage'
        });

    } catch (error) {
        console.error('Get showcase data error:', error);

        // 返回默认数据，确保前端能正常显示
        res.json({
            success: true,
            data: {
                skills: getDefaultSkillsData(),
                projects: getDefaultProjectsData(),
                awards: getDefaultAwardsData(),
                timeline: getDefaultTimelineData(),
                stats: {
                    skillsCount: 20,
                    projectsCount: 12,
                    awardsCount: 8,
                    avgSkillLevel: 85
                }
            },
            timestamp: new Date().toISOString(),
            fallback: true,
            source: 'default-data'
        });
    }
});

// 从KV存储获取技能数据
async function getSkillsFromKV() {
    try {
        console.log('🔍 从KV获取技能数据...');
        const skillsListResult = await edgeStorage.get('skills:list');
        console.log('⚡ 技能列表结果:', skillsListResult);

        if (!skillsListResult.success || !skillsListResult.data) {
            console.log('📦 技能数据不存在，使用默认数据');
            return {
                success: true,
                data: getDefaultSkillsData()
            };
        }

        let skills = skillsListResult.data;

        // 如果返回的是字符串，需要解析为对象
        if (typeof skills === 'string') {
            try {
                skills = JSON.parse(skills);
            } catch (error) {
                console.error('Failed to parse skills data:', error);
                return {
                    success: true,
                    data: getDefaultSkillsData()
                };
            }
        }

        console.log('📊 找到技能:', skills.length, '个');

        // 获取完整的技能详情
        const fullSkills = [];
        for (const skillSummary of skills) {
            try {
                const skillDetailResult = await edgeStorage.get(`skill:${skillSummary.id}`);
                if (skillDetailResult.success && skillDetailResult.data) {
                    let skillData = skillDetailResult.data;

                    // 如果返回的是字符串，需要解析为对象
                    if (typeof skillData === 'string') {
                        try {
                            skillData = JSON.parse(skillData);
                        } catch (error) {
                            console.error('Failed to parse skill detail:', error);
                            skillData = {
                                ...skillSummary,
                                icon: skillSummary.icon || 'fas fa-code',
                                color: skillSummary.color || '#00d4ff',
                                description: skillSummary.description || ''
                            };
                        }
                    }

                    fullSkills.push(skillData);
                } else {
                    // 如果获取详情失败，使用基本信息
                    fullSkills.push({
                        ...skillSummary,
                        icon: skillSummary.icon || 'fas fa-code',
                        color: skillSummary.color || '#00d4ff',
                        description: skillSummary.description || ''
                    });
                }
            } catch (error) {
                console.error(`获取技能详情失败 ${skillSummary.id}:`, error);
                fullSkills.push({
                    ...skillSummary,
                    icon: 'fas fa-code',
                    color: '#00d4ff',
                    description: ''
                });
            }
        }

        // 按分类分组
        const groupedSkills = groupSkillsByCategory(fullSkills);

        return {
            success: true,
            data: groupedSkills
        };
    } catch (error) {
        console.error('从KV获取技能数据失败:', error);
        return { success: false, error: error.message };
    }
}

// 从KV存储获取项目数据
async function getProjectsFromKV() {
    try {
        console.log('🔍 从KV获取项目数据...');
        const projectsListResult = await edgeStorage.get('projects:list');
        console.log('📋 项目列表结果:', projectsListResult);

        if (!projectsListResult.success || !projectsListResult.data) {
            console.log('📦 项目数据不存在，使用默认数据');
            return {
                success: true,
                data: getDefaultProjectsData()
            };
        }

        let projects = projectsListResult.data;

        // 如果返回的是字符串，需要解析为对象
        if (typeof projects === 'string') {
            try {
                projects = JSON.parse(projects);
            } catch (error) {
                console.error('Failed to parse projects data:', error);
                return {
                    success: true,
                    data: getDefaultProjectsData()
                };
            }
        }

        console.log('📊 找到项目:', projects.length, '个');

        // 获取完整的项目详情
        const fullProjects = [];
        for (const projectSummary of projects) {
            try {
                const projectDetailResult = await edgeStorage.get(`project:${projectSummary.id}`);
                if (projectDetailResult.success && projectDetailResult.data) {
                    let projectData = projectDetailResult.data;

                    // 如果返回的是字符串，需要解析为对象
                    if (typeof projectData === 'string') {
                        try {
                            projectData = JSON.parse(projectData);
                        } catch (error) {
                            console.error('Failed to parse project detail:', error);
                            projectData = {
                                ...projectSummary,
                                description: projectSummary.description || '暂无描述',
                                tech: projectSummary.tech || [],
                                icon: projectSummary.icon || '🚀'
                            };
                        }
                    }

                    fullProjects.push(projectData);
                } else {
                    // 如果获取详情失败，使用基本信息
                    fullProjects.push({
                        ...projectSummary,
                        description: projectSummary.description || '暂无描述',
                        tech: projectSummary.tech || [],
                        icon: projectSummary.icon || '🚀'
                    });
                }
            } catch (error) {
                console.error(`获取项目详情失败 ${projectSummary.id}:`, error);
                fullProjects.push({
                    ...projectSummary,
                    description: '暂无描述',
                    tech: [],
                    icon: '🚀'
                });
            }
        }

        // 按分类分组
        const groupedProjects = groupProjectsByCategory(fullProjects);

        return {
            success: true,
            data: groupedProjects
        };
    } catch (error) {
        console.error('从KV获取项目数据失败:', error);
        return { success: false, error: error.message };
    }
}

// 从KV存储获取获奖数据
async function getAwardsFromKV() {
    try {
        console.log('🔍 从KV获取获奖数据...');
        const awardsListResult = await edgeStorage.get('awards:list');
        console.log('🏆 获奖列表结果:', awardsListResult);

        if (!awardsListResult.success || !awardsListResult.data) {
            console.log('📦 获奖数据不存在，使用默认数据');
            return {
                success: true,
                data: getDefaultAwardsData()
            };
        }

        let awards = awardsListResult.data;

        // 如果返回的是字符串，需要解析为对象
        if (typeof awards === 'string') {
            try {
                awards = JSON.parse(awards);
            } catch (error) {
                console.error('Failed to parse awards data:', error);
                return {
                    success: true,
                    data: getDefaultAwardsData()
                };
            }
        }

        console.log('📊 找到获奖:', awards.length, '个');

        // 获取完整的获奖详情
        const fullAwards = [];
        for (const awardSummary of awards) {
            try {
                const awardDetailResult = await edgeStorage.get(`award:${awardSummary.id}`);
                if (awardDetailResult.success && awardDetailResult.data) {
                    let awardData = awardDetailResult.data;

                    // 如果返回的是字符串，需要解析为对象
                    if (typeof awardData === 'string') {
                        try {
                            awardData = JSON.parse(awardData);
                        } catch (error) {
                            console.error('Failed to parse award detail:', error);
                            awardData = {
                                ...awardSummary,
                                description: awardSummary.description || '',
                                tech: awardSummary.tech || []
                            };
                        }
                    }

                    fullAwards.push(awardData);
                } else {
                    // 如果获取详情失败，使用基本信息
                    fullAwards.push({
                        ...awardSummary,
                        description: awardSummary.description || '',
                        tech: awardSummary.tech || []
                    });
                }
            } catch (error) {
                console.error(`获取获奖详情失败 ${awardSummary.id}:`, error);
                fullAwards.push({
                    ...awardSummary,
                    description: '',
                    tech: []
                });
            }
        }

        return {
            success: true,
            data: fullAwards
        };
    } catch (error) {
        console.error('从KV获取获奖数据失败:', error);
        return { success: false, error: error.message };
    }
}

// 从KV存储获取时间线数据
async function getTimelineFromKV() {
    try {
        console.log('🔍 从KV获取时间线数据...');
        const timelineListResult = await edgeStorage.get('timeline:list');
        console.log('📅 时间线列表结果:', timelineListResult);

        if (!timelineListResult.success || !timelineListResult.data) {
            console.log('📦 时间线数据不存在，使用默认数据');
            return {
                success: true,
                data: getDefaultTimelineData()
            };
        }

        let timeline = timelineListResult.data;

        // 如果返回的是字符串，需要解析为对象
        if (typeof timeline === 'string') {
            try {
                timeline = JSON.parse(timeline);
            } catch (error) {
                console.error('Failed to parse timeline data:', error);
                return {
                    success: true,
                    data: getDefaultTimelineData()
                };
            }
        }

        console.log('📊 找到时间线事件:', timeline.length, '个');

        // 获取完整的时间线详情
        const fullTimeline = [];
        for (const timelineSummary of timeline) {
            try {
                const timelineDetailResult = await edgeStorage.get(`timeline:${timelineSummary.id}`);
                if (timelineDetailResult.success && timelineDetailResult.data) {
                    let timelineData = timelineDetailResult.data;

                    // 如果返回的是字符串，需要解析为对象
                    if (typeof timelineData === 'string') {
                        try {
                            timelineData = JSON.parse(timelineData);
                        } catch (error) {
                            console.error('Failed to parse timeline detail:', error);
                            timelineData = {
                                ...timelineSummary,
                                description: timelineSummary.description || '',
                                status: timelineSummary.status || 'upcoming'
                            };
                        }
                    }

                    fullTimeline.push(timelineData);
                } else {
                    // 如果获取详情失败，使用基本信息
                    fullTimeline.push({
                        ...timelineSummary,
                        description: timelineSummary.description || '',
                        status: timelineSummary.status || 'upcoming'
                    });
                }
            } catch (error) {
                console.error(`获取时间线详情失败 ${timelineSummary.id}:`, error);
                fullTimeline.push({
                    ...timelineSummary,
                    description: '',
                    status: 'upcoming'
                });
            }
        }

        // 按时间排序
        fullTimeline.sort((a, b) => new Date(b.date) - new Date(a.date));

        return {
            success: true,
            data: fullTimeline
        };
    } catch (error) {
        console.error('从KV获取时间线数据失败:', error);
        return { success: false, error: error.message };
    }
}

// 计算统计数据
function calculateStats(skills, projects, awards, timeline) {
    // 技能统计
    let skillsCount = 0;
    let totalSkillLevel = 0;

    Object.values(skills).forEach(category => {
        skillsCount += category.skills.length;
        category.skills.forEach(skill => {
            totalSkillLevel += skill.level;
        });
    });

    const avgSkillLevel = skillsCount > 0 ? Math.round(totalSkillLevel / skillsCount) : 0;

    // 项目统计
    let projectsCount = 0;
    Object.values(projects).forEach(category => {
        projectsCount += category.length;
    });

    // 获奖统计
    const awardsCount = awards.length;

    return {
        skillsCount,
        projectsCount,
        awardsCount,
        avgSkillLevel
    };
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

// 按分类分组项目
function groupProjectsByCategory(projects) {
    const grouped = {};

    projects.forEach(project => {
        const category = project.category || 'other';
        if (!grouped[category]) {
            grouped[category] = [];
        }
        grouped[category].push({
            title: project.title,
            description: project.description || '暂无描述',
            icon: project.icon || '🚀',
            tech: project.tech || [],
            demoUrl: project.demoUrl,
            githubUrl: project.githubUrl
        });
    });

    return grouped;
}

// 默认技能数据
function getDefaultSkillsData() {
    return {
        frontend: {
            title: '前端技术',
            skills: [
                { name: 'React', icon: 'fab fa-react', level: 95, color: '#61DAFB' },
                { name: 'Vue.js', icon: 'fab fa-vuejs', level: 90, color: '#4FC08D' },
                { name: 'JavaScript', icon: 'fab fa-js', level: 98, color: '#F7DF1E' },
                { name: 'TypeScript', icon: 'fab fa-js-square', level: 88, color: '#3178C6' },
                { name: 'CSS3/SCSS', icon: 'fab fa-css3', level: 95, color: '#1572B6' },
                { name: 'HTML5', icon: 'fab fa-html5', level: 98, color: '#E34F26' }
            ]
        },
        backend: {
            title: '后端技术',
            skills: [
                { name: 'Node.js', icon: 'fab fa-node-js', level: 88, color: '#339933' },
                { name: 'Python', icon: 'fab fa-python', level: 85, color: '#3776AB' },
                { name: 'Java', icon: 'fab fa-java', level: 82, color: '#ED8B00' },
                { name: 'Express', icon: 'fas fa-server', level: 90, color: '#000000' },
                { name: 'MongoDB', icon: 'fas fa-database', level: 80, color: '#47A248' },
                { name: 'PostgreSQL', icon: 'fas fa-database', level: 75, color: '#336791' }
            ]
        },
        tools: {
            title: '开发工具',
            skills: [
                { name: 'Git', icon: 'fab fa-git-alt', level: 92, color: '#F05032' },
                { name: 'Docker', icon: 'fab fa-docker', level: 78, color: '#2496ED' },
                { name: 'AWS', icon: 'fab fa-aws', level: 70, color: '#FF9900' },
                { name: 'Webpack', icon: 'fas fa-cube', level: 85, color: '#8DD6F9' },
                { name: 'Vite', icon: 'fas fa-bolt', level: 88, color: '#646CFF' }
            ]
        },
        mobile: {
            title: '移动开发',
            skills: [
                { name: 'React Native', icon: 'fab fa-react', level: 80, color: '#61DAFB' },
                { name: 'Flutter', icon: 'fas fa-mobile-alt', level: 75, color: '#02569B' },
                { name: 'Ionic', icon: 'fas fa-mobile', level: 70, color: '#3880FF' }
            ]
        }
    };
}

// 默认项目数据
function getDefaultProjectsData() {
    return {
        web: [
            {
                title: '电商平台系统',
                description: '全栈电商解决方案，包含用户管理、商品管理、订单处理、支付集成等完整功能',
                icon: '🛒',
                tech: ['React', 'Node.js', 'MongoDB', 'Redis', 'Stripe']
            },
            {
                title: '实时协作工具',
                description: '支持多人实时协作的在线文档编辑器，具备版本控制和权限管理',
                icon: '📝',
                tech: ['Vue.js', 'Socket.io', 'Express', 'PostgreSQL']
            }
        ],
        mobile: [
            {
                title: '健身追踪应用',
                description: '个人健身数据追踪和分析应用，支持运动计划制定和社交分享',
                icon: '💪',
                tech: ['React Native', 'Firebase', 'Redux', 'Chart.js']
            }
        ],
        ai: [
            {
                title: '智能客服系统',
                description: '基于NLP的智能客服机器人，支持多轮对话和情感分析',
                icon: '🤖',
                tech: ['Python', 'TensorFlow', 'BERT', 'FastAPI', 'WebSocket']
            }
        ]
    };
}

// 默认获奖数据
function getDefaultAwardsData() {
    return [
        {
            id: '1',
            title: '全国大学生程序设计竞赛',
            level: 'gold',
            year: '2023',
            description: '算法优化与数据结构设计',
            tech: ['算法优化', '数据结构']
        },
        {
            id: '2',
            title: '互联网+创新创业大赛',
            level: 'silver',
            year: '2023',
            description: '全栈开发与商业模式创新',
            tech: ['全栈开发', '商业模式']
        },
        {
            id: '3',
            title: '蓝桥杯软件设计大赛',
            level: 'bronze',
            year: '2022',
            description: 'Java开发与算法设计',
            tech: ['Java开发', '算法设计']
        }
    ];
}

// 默认时间线数据
function getDefaultTimelineData() {
    return [
        {
            id: '1',
            date: '2024-03-15',
            title: 'ACM程序设计竞赛',
            description: '参加区域性程序设计竞赛，展示算法和编程能力',
            status: 'upcoming',
            type: 'competition'
        },
        {
            id: '2',
            date: '2023-11-20',
            title: '互联网+创业大赛决赛',
            description: '项目成功进入全国决赛阶段，获得银奖',
            status: 'completed',
            type: 'competition'
        },
        {
            id: '3',
            date: '2023-09-10',
            title: '技术分享会',
            description: '在学校举办前端技术分享会，分享React最佳实践',
            status: 'completed',
            type: 'event'
        }
    ];
}

module.exports = router;