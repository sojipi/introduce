/**
 * KV云函数客户端
 * 用于在你的现有项目中调用部署的KV云函数
 */

const fetch = require('node-fetch');

class KVClient {
    constructor(baseUrl, options = {}) {
        this.baseUrl = baseUrl;
        this.timeout = options.timeout || 10000;
        this.retries = options.retries || 3;
        this.apiKey = options.apiKey || process.env.KV_API_KEY;
    }

    // 基础请求方法
    async request(params, options = {}) {
        const url = new URL(this.baseUrl);

        // 添加查询参数
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                url.searchParams.set(key, params[key]);
            }
        });

        const requestOptions = {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'KVClient/1.0',
                ...options.headers
            },
            timeout: this.timeout
        };

        // 添加API密钥
        if (this.apiKey) {
            requestOptions.headers['X-API-Key'] = this.apiKey;
        }

        // 添加请求体
        if (options.body) {
            requestOptions.body = typeof options.body === 'string'
                ? options.body
                : JSON.stringify(options.body);
        }

        // 重试机制
        for (let i = 0; i < this.retries; i++) {
            try {
                const response = await fetch(url.toString(), requestOptions);

                // 处理特殊状态码
                if (response.status === 403) {
                    return {
                        success: false,
                        blacklisted: true,
                        status: 403,
                        message: 'Forbidden: Key is blacklisted'
                    };
                }

                const result = await response.json();
                result.status = response.status;
                return result;

            } catch (error) {
                console.error(`KV request attempt ${i + 1} failed:`, error.message);

                if (i === this.retries - 1) {
                    return {
                        success: false,
                        error: error.message,
                        retries: i + 1
                    };
                }

                // 等待后重试
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }
    }

    // 获取值
    async get(key, options = {}) {
        const params = {
            action: 'get',
            key,
            type: options.type || 'text',
            cache: options.cache !== false ? 'true' : 'false',
            namespace: options.namespace
        };

        return await this.request(params);
    }

    // 设置值
    async set(key, value, options = {}) {
        const params = {
            action: 'set',
            key,
            namespace: options.namespace
        };

        if (options.ttl) {
            params.ttl = options.ttl;
        }

        const requestOptions = {
            method: 'POST',
            body: { value }
        };

        return await this.request(params, requestOptions);
    }

    // 删除值
    async delete(key, options = {}) {
        const params = {
            action: 'delete',
            key,
            namespace: options.namespace
        };

        return await this.request(params);
    }

    // 检查存在
    async exists(key, options = {}) {
        const params = {
            action: 'exists',
            key,
            namespace: options.namespace
        };

        return await this.request(params);
    }

    // 黑名单检查
    async checkBlacklist(key, options = {}) {
        const params = {
            action: 'blacklist',
            key,
            namespace: options.namespace
        };

        const result = await this.request(params);

        // 兼容原始的黑名单检查逻辑
        if (result.status === 403 || result.blacklisted) {
            return {
                success: true,
                blacklisted: true,
                key,
                message: 'Key is blacklisted'
            };
        }

        return {
            success: true,
            blacklisted: false,
            key,
            message: 'Key is not blacklisted'
        };
    }

    // 列出键
    async list(options = {}) {
        const params = {
            action: 'list',
            prefix: options.prefix || '',
            limit: options.limit || 100,
            namespace: options.namespace
        };

        return await this.request(params);
    }

    // 批量操作
    async batch(operations, options = {}) {
        const params = {
            action: 'batch',
            namespace: options.namespace
        };

        const requestOptions = {
            method: 'POST',
            body: operations
        };

        return await this.request(params, requestOptions);
    }

    // 健康检查
    async health() {
        const params = {
            action: 'health'
        };

        return await this.request(params);
    }

    // 兼容原有EdgeStorageService接口的方法
    async put(key, value, options = {}) {
        return await this.set(key, value, options);
    }

    // 批量获取
    async batchGet(keys, options = {}) {
        const operations = keys.map(key => ({
            action: 'get',
            key,
            type: options.type || 'text'
        }));

        return await this.batch(operations, options);
    }

    // 批量设置
    async batchSet(items, options = {}) {
        const operations = items.map(item => ({
            action: 'set',
            key: item.key,
            value: item.value,
            options: item.options || {}
        }));

        return await this.batch(operations, options);
    }

    // 批量删除
    async batchDelete(keys, options = {}) {
        const operations = keys.map(key => ({
            action: 'delete',
            key
        }));

        return await this.batch(operations, options);
    }

    // 数据备份（通过批量获取实现）
    async backup(keys, options = {}) {
        const result = await this.batchGet(keys, options);

        if (!result.success) {
            return result;
        }

        const backup = {};
        result.operations.forEach(op => {
            if (op.success && op.result !== null) {
                backup[op.key] = op.result;
            }
        });

        return {
            success: true,
            backup,
            keys: Object.keys(backup),
            count: Object.keys(backup).length
        };
    }

    // 数据恢复（通过批量设置实现）
    async restore(backupData, options = {}) {
        const items = Object.entries(backupData).map(([key, value]) => ({
            key,
            value
        }));

        return await this.batchSet(items, options);
    }

    // 设置默认命名空间
    setNamespace(namespace) {
        this.defaultNamespace = namespace;
    }

    // 设置API密钥
    setApiKey(apiKey) {
        this.apiKey = apiKey;
    }

    // 获取统计信息
    async getStats() {
        // 通过健康检查获取基本信息
        const health = await this.health();

        return {
            success: health.success,
            platform: health.platform || 'unknown',
            timestamp: health.timestamp,
            baseUrl: this.baseUrl,
            timeout: this.timeout,
            retries: this.retries
        };
    }
}

module.exports = KVClient;