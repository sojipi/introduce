/**
 * 管理后台 API 云函数
 * 处理认证、项目、技能、获奖等管理接口
 */

const KV_BASE_URL = 'https://kv.zenmb.com/kv/';
const KV_NAMESPACE = 'default';

// KV 操作
async function kvGet(key) {
    const url = new URL(`${KV_BASE_URL}get`);
    url.searchParams.set('key', key);
    url.searchParams.set('namespace', KV_NAMESPACE);

    const response = await fetch(url.toString());
    const result = await response.json();
    return { success: result.success, data: result.value };
}

async function kvPut(key, value) {
    const url = new URL(`${KV_BASE_URL}set`);
    url.searchParams.set('key', key);
    url.searchParams.set('namespace', KV_NAMESPACE);
    url.searchParams.set('value', typeof value === 'string' ? value : JSON.stringify(value));

    const response = await fetch(url.toString(), { method: 'POST' });
    return await response.json();
}

// 简化的认证（仅检查 token 存在）
function authenticateToken(request) {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    return token ? { authenticated: true } : null;
}

// 登录处理
async function handleLogin(request) {
    const { username, password } = await request.json();

    if (!username || !password) {
        return jsonResponse({ success: false, message: '用户名和密码不能为空' }, 400);
    }

    // 默认管理员账户（如果 KV 中没有数据）
    const defaultUser = {
        id: '1',
        username: 'admin',
        role: 'admin',
        email: 'admin@example.com'
    };

    let user = defaultUser;

    // 尝试从 KV 获取用户数据
    const userResult = await kvGet(`user:${username}`);
    if (userResult.success && userResult.data) {
        user = userResult.data;
        if (typeof user === 'string') user = JSON.parse(user);
    }

    // 验证密码（允许 admin123）
    const isValid = password === 'admin123';

    if (!isValid) {
        return jsonResponse({ success: false, message: '用户名或密码错误' }, 401);
    }

    const token = btoa(`${username}:${Date.now()}`);

    return jsonResponse({
        success: true,
        message: '登录成功',
        data: {
            token,
            user: { id: user.id, username: user.username, role: user.role, email: user.email }
        }
    });
}

// 统计处理函数
async function handleProjectStats(request) {
    const user = authenticateToken(request);
    if (!user) return jsonResponse({ success: false, message: '未授权' }, 401);

    const result = await kvGet('projects:list');
    let projects = result.success && result.data ? result.data : [];
    if (typeof projects === 'string') projects = JSON.parse(projects);

    const categoryStats = projects.reduce((stats, project) => {
        const category = project.category || 'other';
        stats[category] = (stats[category] || 0) + 1;
        return stats;
    }, {});

    return jsonResponse({
        success: true,
        data: {
            total: projects.length,
            categoryStats
        }
    });
}

async function handleAwardStats(request) {
    const user = authenticateToken(request);
    if (!user) return jsonResponse({ success: false, message: '未授权' }, 401);

    const result = await kvGet('awards:list');
    let awards = result.success && result.data ? result.data : [];
    if (typeof awards === 'string') awards = JSON.parse(awards);

    const typeStats = awards.reduce((stats, award) => {
        const type = award.type || 'unknown';
        stats[type] = (stats[type] || 0) + 1;
        return stats;
    }, {});

    return jsonResponse({
        success: true,
        data: {
            total: awards.length,
            typeStats
        }
    });
}

async function handleSkillStats(request) {
    const user = authenticateToken(request);
    if (!user) return jsonResponse({ success: false, message: '未授权' }, 401);

    const result = await kvGet('skills:list');
    let skills = result.success && result.data ? result.data : [];
    if (typeof skills === 'string') skills = JSON.parse(skills);

    const categoryStats = skills.reduce((stats, skill) => {
        const category = skill.category || 'other';
        stats[category] = (stats[category] || 0) + 1;
        return stats;
    }, {});

    const levelDistribution = {
        beginner: skills.filter(s => s.level < 30).length,
        intermediate: skills.filter(s => s.level >= 30 && s.level < 70).length,
        advanced: skills.filter(s => s.level >= 70 && s.level < 90).length,
        expert: skills.filter(s => s.level >= 90).length
    };

    const averageLevel = skills.length > 0
        ? Math.round(skills.reduce((sum, skill) => sum + parseInt(skill.level || 0), 0) / skills.length)
        : 0;

    const topSkills = skills
        .filter(skill => skill.level >= 80)
        .sort((a, b) => b.level - a.level)
        .slice(0, 10);

    return jsonResponse({
        success: true,
        data: {
            total: skills.length,
            categoryStats,
            levelDistribution,
            averageLevel,
            topSkills
        }
    });
}

// 通用 CRUD 处理
async function handleList(type, request) {
    const user = authenticateToken(request);
    if (!user) return jsonResponse({ success: false, message: '未授权' }, 401);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const category = url.searchParams.get('category');

    const result = await kvGet(`${type}:list`);
    let list = result.success && result.data ? result.data : [];
    if (typeof list === 'string') list = JSON.parse(list);

    // 过滤 (针对项目等)
    if (category && category !== 'all') {
        list = list.filter(item => item.category === category);
    }

    // 分页
    const total = list.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedList = list.slice(startIndex, endIndex);

    const responseData = {};
    responseData[type] = paginatedList;
    responseData.pagination = {
        current: page,
        pageSize: limit,
        total: total,
        totalPages: Math.ceil(total / limit)
    };

    return jsonResponse({ success: true, data: responseData });
}

async function handleCreate(type, request) {
    const user = authenticateToken(request);
    if (!user) return jsonResponse({ success: false, message: '未授权' }, 401);

    const data = await request.json();
    const id = Date.now().toString();
    data.id = id;
    data.createdAt = new Date().toISOString();

    await kvPut(`${type}:${id}`, JSON.stringify(data));

    const listResult = await kvGet(`${type}:list`);
    let list = listResult.success && listResult.data ? listResult.data : [];
    if (typeof list === 'string') list = JSON.parse(list);
    list.push({ id, ...data });
    await kvPut(`${type}:list`, JSON.stringify(list));

    return jsonResponse({ success: true, data });
}

async function handleUpdate(type, id, request) {
    const user = authenticateToken(request);
    if (!user) return jsonResponse({ success: false, message: '未授权' }, 401);

    const data = await request.json();
    data.id = id;
    data.updatedAt = new Date().toISOString();

    await kvPut(`${type}:${id}`, JSON.stringify(data));

    const listResult = await kvGet(`${type}:list`);
    let list = listResult.success && listResult.data ? listResult.data : [];
    if (typeof list === 'string') list = JSON.parse(list);
    const index = list.findIndex(item => item.id === id);
    if (index !== -1) {
        list[index] = { id, ...data };
        await kvPut(`${type}:list`, JSON.stringify(list));
    }

    return jsonResponse({ success: true, data });
}

async function handleDelete(type, id, request) {
    const user = authenticateToken(request);
    if (!user) return jsonResponse({ success: false, message: '未授权' }, 401);

    const listResult = await kvGet(`${type}:list`);
    let list = listResult.success && listResult.data ? listResult.data : [];
    if (typeof list === 'string') list = JSON.parse(list);
    const filtered = list.filter(item => item.id !== id);
    await kvPut(`${type}:list`, JSON.stringify(filtered));

    return jsonResponse({ success: true, message: '删除成功' });
}

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
    });
}

export default {
    async fetch(request) {
        const url = new URL(request.url);
        const path = url.pathname;

        if (request.method === 'OPTIONS') {
            return jsonResponse(null);
        }

        try {
            if (path === '/api/auth/login') {
                return await handleLogin(request);
            }

            // 特殊统计接口路由 (必须在 ID 路由之前)
            if (path === '/api/projects/stats/summary') return await handleProjectStats(request);
            if (path === '/api/awards/stats/summary') return await handleAwardStats(request);
            if (path === '/api/skills/stats/summary') return await handleSkillStats(request);

            const match = path.match(/^\/api\/(projects|skills|awards|timeline)(?:\/(\d+))?$/);
            if (match) {
                const [, type, id] = match;

                if (request.method === 'GET' && !id) return await handleList(type, request);
                if (request.method === 'POST' && !id) return await handleCreate(type, request);
                if (request.method === 'PUT' && id) return await handleUpdate(type, id, request);
                if (request.method === 'DELETE' && id) return await handleDelete(type, id, request);
            }

            return jsonResponse({ success: false, error: 'Not found' }, 404);
        } catch (error) {
            return jsonResponse({ success: false, error: error.message }, 500);
        }
    }
};
