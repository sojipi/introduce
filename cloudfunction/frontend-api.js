/**
 * 前端 API 云函数
 * 为前端提供数据接口，调用 https://kv.zenmb.com/kv/ 获取数据
 *
 * 部署到阿里云 ESA 边缘函数或 Cloudflare Workers
 */

// KV 客户端配置
const KV_BASE_URL = 'https://kv.zenmb.com/kv/';
const KV_NAMESPACE = 'intro';

// 辅助函数：调用 KV API
async function kvGet(key) {
    try {
        const url = new URL(`${KV_BASE_URL}get`);
        url.searchParams.set('key', key);
        url.searchParams.set('type', 'json');
        url.searchParams.set('namespace', KV_NAMESPACE);

        const response = await fetch(url.toString());

        if (!response.ok) {
            console.error(`KV get failed: ${response.status}`);
            return { success: false, data: null };
        }

        const result = await response.json();
        return {
            success: result.success,
            data: result.success ? result.value : null
        };
    } catch (error) {
        console.error('KV get error:', error);
        return { success: false, data: null };
    }
}

// 处理技能数据
async function handleSkills() {
    try {
        console.log('🎯 获取技能数据...');
        const skillsResult = await getSkillsFromKV();
        const skills = skillsResult.success ? skillsResult.data : getDefaultSkillsData();

        return new Response(JSON.stringify({
            success: true,
            data: skills
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (error) {
        console.error('获取技能数据失败:', error);
        return new Response(JSON.stringify({
            success: true,
            data: getDefaultSkillsData()
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

// 处理项目数据
async function handleProjects() {
    try {
        console.log('🚀 获取项目数据...');
        const projectsResult = await getProjectsFromKV();
        const projects = projectsResult.success ? projectsResult.data : getDefaultProjectsData();

        return new Response(JSON.stringify({
            success: true,
            data: projects
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (error) {
        console.error('获取项目数据失败:', error);
        return new Response(JSON.stringify({
            success: true,
            data: getDefaultProjectsData()
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

// 处理获奖数据
async function handleAwards() {
    try {
        console.log('🏆 获取获奖数据...');
        const awardsResult = await getAwardsFromKV();
        const awards = awardsResult.success ? awardsResult.data : [];

        return new Response(JSON.stringify({
            success: true,
            data: awards
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (error) {
        console.error('获取获奖数据失败:', error);
        return new Response(JSON.stringify({
            success: true,
            data: []
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

// 处理时间线数据
async function handleTimeline() {
    try {
        console.log('📅 获取时间线数据...');
        const timelineResult = await getTimelineFromKV();
        const timeline = timelineResult.success ? timelineResult.data : getDefaultTimelineData();

        return new Response(JSON.stringify({
            success: true,
            data: timeline
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (error) {
        console.error('获取时间线数据失败:', error);
        return new Response(JSON.stringify({
            success: true,
            data: getDefaultTimelineData()
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

// 处理统计数据
async function handleStats() {
    try {
        console.log('📊 获取统计数据...');

        const [skillsListResult, projectsListResult, awardsListResult, timelineListResult] = await Promise.allSettled([
            kvGet('skills:list'),
            kvGet('projects:list'),
            kvGet('awards:list'),
            kvGet('timeline:list')
        ]);

        const skillsCount = skillsListResult.status === 'fulfilled' && skillsListResult.value.success
            ? (skillsListResult.value.data?.length || 0) : 20;
        const projectsCount = projectsListResult.status === 'fulfilled' && projectsListResult.value.success
            ? (projectsListResult.value.data?.length || 0) : 8;
        const awardsCount = awardsListResult.status === 'fulfilled' && awardsListResult.value.success
            ? (awardsListResult.value.data?.length || 0) : 5;
        const timelineCount = timelineListResult.status === 'fulfilled' && timelineListResult.value.success
            ? (timelineListResult.value.data?.length || 0) : 10;

        const stats = {
            skillsCount,
            projectsCount,
            awardsCount,
            experienceYears: 15,
            timelineCount
        };

        return new Response(JSON.stringify({
            success: true,
            data: stats
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (error) {
        console.error('获取统计数据失败:', error);
        return new Response(JSON.stringify({
            success: true,
            data: {
                skillsCount: 20,
                projectsCount: 8,
                awardsCount: 5,
                experienceYears: 15,
                timelineCount: 10
            }
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

// 从 KV 获取技能数据
async function getSkillsFromKV() {
    try {
        const skillsListResult = await kvGet('skills:list');

        if (!skillsListResult.success || !skillsListResult.data) {
            return { success: true, data: getDefaultSkillsData() };
        }

        let skills = skillsListResult.data;
        if (typeof skills === 'string') {
            skills = JSON.parse(skills);
        }

        const fullSkills = [];
        for (const skillSummary of skills) {
            const skillDetailResult = await kvGet(`skill:${skillSummary.id}`);
            if (skillDetailResult.success && skillDetailResult.data) {
                let skillData = skillDetailResult.data;
                if (typeof skillData === 'string') {
                    skillData = JSON.parse(skillData);
                }
                fullSkills.push(skillData);
            } else {
                fullSkills.push({
                    ...skillSummary,
                    icon: skillSummary.icon || 'fas fa-code',
                    color: skillSummary.color || '#00d4ff'
                });
            }
        }

        return { success: true, data: groupSkillsByCategory(fullSkills) };
    } catch (error) {
        console.error('从KV获取技能数据失败:', error);
        return { success: false, error: error.message };
    }
}

// 从 KV 获取项目数据
async function getProjectsFromKV() {
    try {
        const projectsListResult = await kvGet('projects:list');

        if (!projectsListResult.success || !projectsListResult.data) {
            return { success: true, data: getDefaultProjectsData() };
        }

        let projects = projectsListResult.data;
        if (typeof projects === 'string') {
            projects = JSON.parse(projects);
        }

        const fullProjects = [];
        for (const projectSummary of projects) {
            const projectDetailResult = await kvGet(`project:${projectSummary.id}`);
            if (projectDetailResult.success && projectDetailResult.data) {
                let projectData = projectDetailResult.data;
                if (typeof projectData === 'string') {
                    projectData = JSON.parse(projectData);
                }
                fullProjects.push(projectData);
            } else {
                fullProjects.push({
                    ...projectSummary,
                    description: projectSummary.description || '暂无描述',
                    tech: projectSummary.tech || [],
                    icon: projectSummary.icon || '🚀'
                });
            }
        }

        return { success: true, data: groupProjectsByCategory(fullProjects) };
    } catch (error) {
        console.error('从KV获取项目数据失败:', error);
        return { success: false, error: error.message };
    }
}

// 从 KV 获取获奖数据
async function getAwardsFromKV() {
    try {
        const awardsListResult = await kvGet('awards:list');

        if (!awardsListResult.success || !awardsListResult.data) {
            return { success: true, data: [] };
        }

        let awards = awardsListResult.data;
        if (typeof awards === 'string') {
            awards = JSON.parse(awards);
        }

        const fullAwards = [];
        for (const awardSummary of awards) {
            const awardDetailResult = await kvGet(`award:${awardSummary.id}`);
            if (awardDetailResult.success && awardDetailResult.data) {
                let awardData = awardDetailResult.data;
                if (typeof awardData === 'string') {
                    awardData = JSON.parse(awardData);
                }
                fullAwards.push(awardData);
            } else {
                fullAwards.push(awardSummary);
            }
        }

        return { success: true, data: fullAwards };
    } catch (error) {
        console.error('从KV获取获奖数据失败:', error);
        return { success: false, error: error.message };
    }
}

// 从 KV 获取时间线数据
async function getTimelineFromKV() {
    try {
        const timelineListResult = await kvGet('timeline:list');

        if (!timelineListResult.success || !timelineListResult.data) {
            return { success: true, data: getDefaultTimelineData() };
        }

        let timeline = timelineListResult.data;
        if (typeof timeline === 'string') {
            timeline = JSON.parse(timeline);
        }

        const fullTimeline = [];
        for (const timelineSummary of timeline) {
            const timelineDetailResult = await kvGet(`timeline:${timelineSummary.id}`);
            if (timelineDetailResult.success && timelineDetailResult.data) {
                let timelineData = timelineDetailResult.data;
                if (typeof timelineData === 'string') {
                    timelineData = JSON.parse(timelineData);
                }
                fullTimeline.push(timelineData);
            } else {
                fullTimeline.push(timelineSummary);
            }
        }

        fullTimeline.sort((a, b) => new Date(b.date) - new Date(a.date));
        return { success: true, data: fullTimeline };
    } catch (error) {
        console.error('从KV获取时间线数据失败:', error);
        return { success: false, error: error.message };
    }
}

// 辅助函数：按分类分组技能
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

// 辅助函数：按分类分组项目
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
            tech: project.tech || []
        });
    });

    return grouped;
}

// 默认数据
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
                { name: 'Express', icon: 'fas fa-server', level: 90, color: '#000000' }
            ]
        }
    };
}

function getDefaultProjectsData() {
    return {
        web: [
            {
                title: '电商平台系统',
                description: '全栈电商解决方案',
                icon: '🛒',
                tech: ['React', 'Node.js', 'MongoDB']
            }
        ]
    };
}

function getDefaultTimelineData() {
    return [
        {
            id: '1',
            date: '2024-03-15',
            title: 'ACM程序设计竞赛',
            description: '参加区域性程序设计竞赛',
            status: 'upcoming'
        }
    ];
}

// 主入口
export default {
    async fetch(request) {
        const url = new URL(request.url);
        const path = url.pathname;

        try {
            // 处理 CORS 预检请求
            if (request.method === 'OPTIONS') {
                return new Response(null, {
                    status: 200,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type'
                    }
                });
            }

            // 路由处理
            if (path.includes('/skills')) {
                return await handleSkills();
            } else if (path.includes('/projects')) {
                return await handleProjects();
            } else if (path.includes('/awards')) {
                return await handleAwards();
            } else if (path.includes('/timeline')) {
                return await handleTimeline();
            } else if (path.includes('/stats')) {
                return await handleStats();
            } else {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Invalid endpoint',
                    availableEndpoints: ['/skills', '/projects', '/awards', '/timeline', '/stats']
                }), {
                    status: 404,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            }

        } catch (error) {
            console.error('云函数错误:', error);
            return new Response(JSON.stringify({
                success: false,
                error: `Internal Server Error: ${error.message}`
            }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }
    }
};
