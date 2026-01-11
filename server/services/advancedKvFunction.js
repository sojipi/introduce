/**
 * 高级KV云函数
 * 支持更多功能：缓存、批量操作、权限控制等
 */

class AdvancedKvFunction {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5分钟缓存
    }

    async fetch(request) {
        try {
            const url = new URL(request.url);
            const method = request.method;

            // 解析参数
            const params = this.parseParams(url, method);

            // 权限验证
            if (!await this.validatePermissions(request, params)) {
                return new Response('Unauthorized', { status: 401 });
            }

            // 初始化EdgeKV
            const edgeKv = new EdgeKV({
                namespace: params.namespace || 'default'
            });

            // 路由处理
            return await this.handleRequest(edgeKv, params, request);

        } catch (error) {
            console.error('Advanced KV Function Error:', error);
            return this.errorResponse(error.message, 500);
        }
    }

    // 解析请求参数
    parseParams(url, method) {
        const params = {};

        // 从URL参数获取
        for (const [key, value] of url.searchParams) {
            params[key] = value;
        }

        // 从路径获取
        const pathParts = url.pathname.split('/').filter(Boolean);
        if (pathParts.length > 0) {
            params.action = pathParts[0];
        }
        if (pathParts.length > 1) {
            params.key = pathParts[1];
        }

        params.method = method;
        return params;
    }

    // 权限验证
    async validatePermissions(request, params) {
        const authHeader = request.headers.get('Authorization');
        const apiKey = request.headers.get('X-API-Key');

        // 简单的API密钥验证
        if (params.action !== 'get' && params.action !== 'exists') {
            return apiKey === process.env.KV_API_KEY;
        }

        return true; // 读取操作允许
    }

    // 请求处理路由
    async handleRequest(edgeKv, params, request) {
        switch (params.action) {
            case 'get':
                return await this.handleGet(edgeKv, params);
            case 'set':
                return await this.handleSet(edgeKv, params, request);
            case 'delete':
                return await this.handleDelete(edgeKv, params);
            case 'exists':
                return await this.handleExists(edgeKv, params);
            case 'list':
                return await this.handleList(edgeKv, params);
            case 'batch':
                return await this.handleBatch(edgeKv, params, request);
            case 'blacklist':
                return await this.handleBlacklist(edgeKv, params, request);
            default:
                return this.errorResponse('Invalid action', 400);
        }
    }

    // 获取值（带缓存）
    async handleGet(edgeKv, params) {
        const { key, useCache = 'true' } = params;

        if (!key) {
            return this.errorResponse('Key is required', 400);
        }

        // 检查缓存
        if (useCache === 'true') {
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
        const value = await edgeKv.get(key, { type: 'text' });

        // 更新缓存
        if (useCache === 'true' && value !== null) {
            this.setCache(key, value);
        }

        return this.successResponse({
            key,
            value,
            exists: value !== null,
            cached: false,
            timestamp: Date.now()
        });
    }

    // 设置值
    async handleSet(edgeKv, params, request) {
        const { key, ttl } = params;

        if (!key) {
            return this.errorResponse('Key is required', 400);
        }

        let value;
        const contentType = request.headers.get('Content-Type');

        if (contentType && contentType.includes('application/json')) {
            value = await request.json();
        } else {
            value = await request.text();
        }

        const options = {};
        if (ttl) {
            options.ttl = parseInt(ttl);
        }

        await edgeKv.put(key, value, options);

        // 清除缓存
        this.cache.delete(key);

        return this.successResponse({
            key,
            value,
            action: 'set',
            timestamp: Date.now()
        });
    }

    // 删除值
    async handleDelete(edgeKv, params) {
        const { key } = params;

        if (!key) {
            return this.errorResponse('Key is required', 400);
        }

        await edgeKv.delete(key);

        // 清除缓存
        this.cache.delete(key);

        return this.successResponse({
            key,
            action: 'delete',
            timestamp: Date.now()
        });
    }

    // 检查存在
    async handleExists(edgeKv, params) {
        const { key } = params;

        if (!key) {
            return this.errorResponse('Key is required', 400);
        }

        const value = await edgeKv.get(key, { type: 'text' });

        return this.successResponse({
            key,
            exists: value !== null,
            timestamp: Date.now()
        });
    }

    // 列出键
    async handleList(edgeKv, params) {
        const { prefix = '', limit = 100 } = params;

        const keys = await edgeKv.list(prefix, parseInt(limit));

        return this.successResponse({
            keys,
            prefix,
            limit: parseInt(limit),
            count: keys.length,
            timestamp: Date.now()
        });
    }

    // 批量操作
    async handleBatch(edgeKv, params, request) {
        const operations = await request.json();

        if (!Array.isArray(operations)) {
            return this.errorResponse('Operations must be an array', 400);
        }

        const results = [];

        for (const op of operations) {
            try {
                let result;
                switch (op.action) {
                    case 'get':
                        result = await edgeKv.get(op.key, { type: 'text' });
                        break;
                    case 'set':
                        await edgeKv.put(op.key, op.value, op.options || {});
                        result = { success: true };
                        break;
                    case 'delete':
                        await edgeKv.delete(op.key);
                        result = { success: true };
                        break;
                    default:
                        result = { error: 'Invalid action' };
                }

                results.push({
                    key: op.key,
                    action: op.action,
                    result,
                    success: !result.error
                });
            } catch (error) {
                results.push({
                    key: op.key,
                    action: op.action,
                    error: error.message,
                    success: false
                });
            }
        }

        return this.successResponse({
            operations: results,
            total: operations.length,
            successful: results.filter(r => r.success).length,
            timestamp: Date.now()
        });
    }

    // 黑名单检查
    async handleBlacklist(edgeKv, params, originalRequest) {
        const { key, uid } = params;
        const checkKey = key || uid;

        if (!checkKey) {
            return this.errorResponse('Key or uid is required', 400);
        }

        const isBlacklisted = await edgeKv.get(checkKey, { type: 'text' });

        if (isBlacklisted) {
            return new Response('Forbidden: Key is blacklisted', {
                status: 403,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }

        // 如果不在黑名单中，继续处理原始请求
        return await fetch(originalRequest);
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

    // 响应辅助方法
    successResponse(data) {
        return new Response(JSON.stringify({
            success: true,
            ...data
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }

    errorResponse(message, status = 400) {
        return new Response(JSON.stringify({
            success: false,
            error: message
        }), {
            status,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

// 导出实例
const kvFunction = new AdvancedKvFunction();
export default kvFunction;