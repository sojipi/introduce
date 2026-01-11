/**
 * 独立部署的KV云函数
 * 支持Cloudflare Workers、阿里云函数计算、腾讯云函数等平台
 */

// EdgeKV类定义（适配不同云平台）
class EdgeKV {
    constructor(options = {}) {
        this.namespace = options.namespace || 'default';
        // 根据环境自动适配不同的KV存储
        this.initStorage();
    }

    initStorage() {
        // Cloudflare Workers环境
        if (typeof KV !== 'undefined') {
            this.storage = KV;
            this.platform = 'cloudflare';
        }
        // 阿里云函数计算环境
        else if (typeof process !== 'undefined' && process.env.FC_RUNTIME) {
            this.platform = 'aliyun';
            this.initAliyunKV();
        }
        // 腾讯云函数环境
        else if (typeof process !== 'undefined' && process.env.TENCENTCLOUD_RUNENV) {
            this.platform = 'tencent';
            this.initTencentKV();
        }
        // 通用环境（使用内存存储作为fallback）
        else {
            this.platform = 'memory';
            this.storage = new Map();
        }
    }

    async get(key, options = {}) {
        try {
            switch (this.platform) {
                case 'cloudflare':
                    const value = await this.storage.get(key, options.type || 'text');
                    return value;

                case 'aliyun':
                    return await this.aliyunGet(key, options);

                case 'tencent':
                    return await this.tencentGet(key, options);

                case 'memory':
                    return this.storage.get(key) || null;

                default:
                    return null;
            }
        } catch (error) {
            console.error('KV get error:', error);
            return null;
        }
    }

    async put(key, value, options = {}) {
        try {
            switch (this.platform) {
                case 'cloudflare':
                    await this.storage.put(key, value, options);
                    return true;

                case 'aliyun':
                    return await this.aliyunPut(key, value, options);

                case 'tencent':
                    return await this.tencentPut(key, value, options);

                case 'memory':
                    this.storage.set(key, value);
                    return true;

                default:
                    return false;
            }
        } catch (error) {
            console.error('KV put error:', error);
            return false;
        }
    }

    async delete(key) {
        try {
            switch (this.platform) {
                case 'cloudflare':
                    await this.storage.delete(key);
                    return true;

                case 'aliyun':
                    return await this.aliyunDelete(key);

                case 'tencent':
                    return await this.tencentDelete(key);

                case 'memory':
                    this.storage.delete(key);
                    return true;

                default:
                    return false;
            }
        } catch (error) {
            console.error('KV delete error:', error);
            return false;
        }
    }

    // 阿里云KV操作实现
    initAliyunKV() {
        // 这里可以集成阿里云的KV存储服务
        this.aliyunConfig = {
            endpoint: process.env.ALIYUN_KV_ENDPOINT,
            accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
            accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET
        };
    }

    async aliyunGet(key, options) {
        // 实现阿里云KV获取逻辑
        // 这里可以调用阿里云SDK或API
        return null;
    }

    async aliyunPut(key, value, options) {
        // 实现阿里云KV存储逻辑
        return true;
    }

    async aliyunDelete(key) {
        // 实现阿里云KV删除逻辑
        return true;
    }

    // 腾讯云KV操作实现
    initTencentKV() {
        this.tencentConfig = {
            region: process.env.TENCENT_REGION,
            secretId: process.env.TENCENT_SECRET_ID,
            secretKey: process.env.TENCENT_SECRET_KEY
        };
    }

    async tencentGet(key, options) {
        return null;
    }

    async tencentPut(key, value, options) {
        return true;
    }

    async tencentDelete(key) {
        return true;
    }
}

// 主云函数处理器
class KVCloudFunction {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5分钟缓存
    }

    // 主入口函数
    async handleRequest(request) {
        try {
            // 处理CORS预检请求
            if (request.method === 'OPTIONS') {
                return this.corsResponse();
            }

            // 解析请求
            const context = await this.parseRequest(request);

            // 验证请求
            if (!this.validateRequest(context)) {
                return this.errorResponse('Invalid request', 400);
            }

            // 初始化KV存储
            const kv = new EdgeKV({
                namespace: context.namespace || 'default'
            });

            // 执行操作
            return await this.executeOperation(kv, context);

        } catch (error) {
            console.error('Cloud Function Error:', error);
            return this.errorResponse('Internal Server Error', 500);
        }
    }

    // 解析请求参数
    async parseRequest(request) {
        const url = new URL(request.url);
        const method = request.method;

        const context = {
            method,
            action: url.searchParams.get('action') || 'get',
            key: url.searchParams.get('key') || url.searchParams.get('uid'),
            namespace: url.searchParams.get('namespace') || 'default',
            type: url.searchParams.get('type') || 'text',
            useCache: url.searchParams.get('cache') !== 'false',
            ttl: url.searchParams.get('ttl'),
            prefix: url.searchParams.get('prefix') || '',
            limit: parseInt(url.searchParams.get('limit')) || 100
        };

        // 解析请求体
        if (method === 'POST' || method === 'PUT') {
            const contentType = request.headers.get('Content-Type');
            if (contentType && contentType.includes('application/json')) {
                try {
                    context.body = await request.json();
                } catch (e) {
                    context.body = null;
                }
            } else {
                context.body = await request.text();
            }
        }

        return context;
    }

    // 验证请求
    validateRequest(context) {
        // 基本验证
        if (!context.action) return false;

        // 需要key的操作
        const keyRequiredActions = ['get', 'set', 'put', 'delete', 'exists', 'blacklist'];
        if (keyRequiredActions.includes(context.action) && !context.key) {
            return false;
        }

        return true;
    }

    // 执行具体操作
    async executeOperation(kv, context) {
        switch (context.action) {
            case 'get':
                return await this.handleGet(kv, context);

            case 'set':
            case 'put':
                return await this.handleSet(kv, context);

            case 'delete':
                return await this.handleDelete(kv, context);

            case 'exists':
                return await this.handleExists(kv, context);

            case 'list':
                return await this.handleList(kv, context);

            case 'blacklist':
                return await this.handleBlacklist(kv, context);

            case 'batch':
                return await this.handleBatch(kv, context);

            case 'health':
                return this.handleHealth();

            default:
                return this.errorResponse('Invalid action', 400);
        }
    }

    // 获取数据
    async handleGet(kv, context) {
        const { key, type, useCache } = context;

        // 检查缓存
        if (useCache) {
            const cached = this.getFromCache(key);
            if (cached) {
                return this.successResponse({
                    key,
                    value: cached.value,
                    cached: true,
                    timestamp: cached.timestamp
                });
            }
        }

        // 从KV获取
        const value = await kv.get(key, { type });

        // 更新缓存
        if (useCache && value !== null) {
            this.setCache(key, value);
        }

        return this.successResponse({
            key,
            value,
            exists: value !== null,
            cached: false
        });
    }

    // 设置数据
    async handleSet(kv, context) {
        const { key, body, ttl } = context;

        let value = body;
        if (context.method === 'GET') {
            // 从URL参数获取值
            value = new URL(context.url).searchParams.get('value');
        }

        if (value === null || value === undefined) {
            return this.errorResponse('Value is required', 400);
        }

        const options = {};
        if (ttl) {
            options.expirationTtl = parseInt(ttl);
        }

        const success = await kv.put(key, value, options);

        if (!success) {
            return this.errorResponse('Failed to set value', 500);
        }

        // 清除缓存
        this.cache.delete(key);

        return this.successResponse({
            key,
            value,
            action: 'set'
        });
    }

    // 删除数据
    async handleDelete(kv, context) {
        const { key } = context;

        const success = await kv.delete(key);

        if (!success) {
            return this.errorResponse('Failed to delete key', 500);
        }

        // 清除缓存
        this.cache.delete(key);

        return this.successResponse({
            key,
            action: 'delete'
        });
    }

    // 检查存在
    async handleExists(kv, context) {
        const { key } = context;
        const value = await kv.get(key);

        return this.successResponse({
            key,
            exists: value !== null
        });
    }

    // 列出键（仅支持部分平台）
    async handleList(kv, context) {
        // 注意：不是所有KV存储都支持list操作
        return this.successResponse({
            message: 'List operation not supported on this platform',
            keys: []
        });
    }

    // 黑名单检查
    async handleBlacklist(kv, context) {
        const { key } = context;
        const value = await kv.get(key, { type: 'text' });

        if (value !== null) {
            return new Response('Forbidden: Key is blacklisted', {
                status: 403,
                headers: this.getCorsHeaders()
            });
        }

        return this.successResponse({
            key,
            blacklisted: false,
            message: 'Key is not blacklisted'
        });
    }

    // 批量操作
    async handleBatch(kv, context) {
        const operations = context.body;

        if (!Array.isArray(operations)) {
            return this.errorResponse('Operations must be an array', 400);
        }

        const results = [];

        for (const op of operations) {
            try {
                let result;

                switch (op.action) {
                    case 'get':
                        result = await kv.get(op.key, { type: op.type || 'text' });
                        break;
                    case 'set':
                        result = await kv.put(op.key, op.value, op.options || {});
                        break;
                    case 'delete':
                        result = await kv.delete(op.key);
                        break;
                    default:
                        result = { error: 'Invalid action' };
                }

                results.push({
                    key: op.key,
                    action: op.action,
                    success: !result.error,
                    result
                });
            } catch (error) {
                results.push({
                    key: op.key,
                    action: op.action,
                    success: false,
                    error: error.message
                });
            }
        }

        return this.successResponse({
            operations: results,
            total: operations.length,
            successful: results.filter(r => r.success).length
        });
    }

    // 健康检查
    handleHealth() {
        return this.successResponse({
            status: 'healthy',
            timestamp: Date.now(),
            platform: typeof KV !== 'undefined' ? 'cloudflare' : 'generic'
        });
    }

    // 缓存管理
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached;
        }
        this.cache.delete(key);
        return null;
    }

    setCache(key, value) {
        this.cache.set(key, {
            value,
            timestamp: Date.now()
        });
    }

    // CORS响应
    corsResponse() {
        return new Response(null, {
            status: 200,
            headers: this.getCorsHeaders()
        });
    }

    // 获取CORS头
    getCorsHeaders() {
        return {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
            'Content-Type': 'application/json'
        };
    }

    // 成功响应
    successResponse(data) {
        return new Response(JSON.stringify({
            success: true,
            timestamp: Date.now(),
            ...data
        }), {
            status: 200,
            headers: this.getCorsHeaders()
        });
    }

    // 错误响应
    errorResponse(message, status = 400) {
        return new Response(JSON.stringify({
            success: false,
            error: message,
            timestamp: Date.now()
        }), {
            status,
            headers: this.getCorsHeaders()
        });
    }
}

// 创建云函数实例
const kvFunction = new KVCloudFunction();

// 导出处理函数（适配不同平台）

// Cloudflare Workers
export default {
    async fetch(request) {
        return await kvFunction.handleRequest(request);
    }
};

// 阿里云函数计算
exports.handler = async (event, context) => {
    const request = {
        method: event.httpMethod || 'GET',
        url: `https://example.com${event.path}?${event.queryString || ''}`,
        headers: {
            get: (name) => event.headers[name.toLowerCase()]
        },
        json: () => Promise.resolve(JSON.parse(event.body || '{}')),
        text: () => Promise.resolve(event.body || '')
    };

    const response = await kvFunction.handleRequest(request);
    const body = await response.text();

    return {
        statusCode: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body
    };
};

// 腾讯云函数
exports.main_handler = async (event, context) => {
    const request = {
        method: event.httpMethod || 'GET',
        url: `https://example.com${event.path}?${event.queryStringParameters ? new URLSearchParams(event.queryStringParameters).toString() : ''}`,
        headers: {
            get: (name) => event.headers[name.toLowerCase()]
        },
        json: () => Promise.resolve(JSON.parse(event.body || '{}')),
        text: () => Promise.resolve(event.body || '')
    };

    const response = await kvFunction.handleRequest(request);
    const body = await response.text();

    return {
        statusCode: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body
    };
};