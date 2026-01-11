/**
 * 云函数KV客户端
 * 专门用于调用 https://kv.zenmb.com/kv/ 的KV云函数
 */

const fetch = require('node-fetch');

class CloudKvClient {
    constructor(options = {}) {
        this.baseUrl = 'https://kv.zenmb.com/kv/';
        this.timeout = options.timeout || 10000;
        this.retries = options.retries || 3;
        this.defaultNamespace = options.namespace || 'default';
    }

    // 基础请求方法
    async request(action, params = {}, options = {}) {
        const url = new URL(`${this.baseUrl}${action}`);

        // 添加查询参数
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                url.searchParams.set(key, params[key]);
            }
        });

        const requestOptions = {
            method: options.method || 'GET',
            headers: {
                'User-Agent': 'CloudKvClient/1.0',
                ...options.headers
            },
            timeout: this.timeout
        };

        // 添加请求体
        if (options.body) {
            requestOptions.body = options.body;
        }

        // 重试机制
        for (let i = 0; i < this.retries; i++) {
            try {
                const response = await fetch(url.toString(), requestOptions);

                // 处理二进制响应
                if (params.type === 'arrayBuffer' || params.type === 'stream') {
                    const buffer = await response.buffer();
                    return {
                        success: response.ok,
                        data: buffer,
                        key: params.key,
                        type: params.type
                    };
                }

                // 检查响应状态
                if (!response.ok) {
                    const errorText = await response.text();
                    return {
                        success: false,
                        error: `HTTP ${response.status}: ${errorText}`
                    };
                }

                // 检查响应是否为JSON
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const result = await response.json();
                    return result;
                } else {
                    // 非JSON响应，可能是错误信息
                    const text = await response.text();
                    console.error('Non-JSON response:', text);
                    return {
                        success: false,
                        error: `Server returned non-JSON response: ${text.substring(0, 100)}...`
                    };
                }

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

    // 获取值 - 兼容原有EdgeStorageService接口
    async get(key, type = 'text') {
        const params = {
            key,
            type,
            namespace: this.defaultNamespace
        };

        const result = await this.request('get', params);

        let data = null;
        if (result.success && result.value !== null && result.value !== undefined) {
            if (type === 'json' || (type === 'text' && typeof result.value === 'string' && (result.value.startsWith('{') || result.value.startsWith('[')))) {
                // 尝试解析JSON
                try {
                    data = typeof result.value === 'string' ? JSON.parse(result.value) : result.value;
                } catch (e) {
                    console.warn('Failed to parse JSON, returning as text:', e.message);
                    data = result.value;
                }
            } else {
                data = result.value;
            }
        }

        // 兼容原有接口格式
        return {
            success: result.success,
            data: data,
            error: result.message
        };
    }

    // 设置值 - 兼容原有EdgeStorageService接口
    async put(key, value, options = {}) {
        const namespace = options.namespace || this.defaultNamespace;

        let requestOptions = {
            method: 'GET'
        };

        const params = { key, namespace };

        // 简化处理：所有非字符串数据都转换为字符串通过URL参数发送
        if (typeof value === 'string') {
            // 字符串直接通过URL参数
            params.value = value;
        } else {
            // 其他类型都转换为JSON字符串，通过URL参数发送
            params.value = JSON.stringify(value);
        }

        console.log('🔍 CloudKV PUT Debug:', { key, namespace, valueLength: params.value.length });

        const result = await this.request('set', params, requestOptions);

        // 兼容原有接口格式
        return {
            success: result.success,
            data: result,
            error: result.message
        };
    }

    // 删除值 - 兼容原有EdgeStorageService接口
    async delete(key) {
        const params = {
            key,
            namespace: this.defaultNamespace
        };

        const result = await this.request('delete', params);

        // 兼容原有接口格式
        return {
            success: result.success,
            data: result,
            error: result.message
        };
    }

    // 检查存在
    async exists(key) {
        const params = {
            key,
            namespace: this.defaultNamespace
        };

        const result = await this.request('exists', params);

        return {
            success: result.success,
            exists: result.exists,
            data: result
        };
    }

    // 列出键（云函数暂不支持，返回空数组）
    async list(prefix = '', limit = 100) {
        return {
            success: true,
            data: [],
            message: 'List operation not supported by cloud function'
        };
    }

    // 批量操作（通过多个单独请求实现）
    async batchPut(items) {
        const results = [];

        for (const item of items) {
            const result = await this.put(item.key, item.value, item.options || {});

            results.push({
                key: item.key,
                success: result.success,
                data: result.data,
                error: result.error
            });
        }

        return results;
    }

    // 数据备份
    async backup(keys) {
        const backup = {};

        for (const key of keys) {
            const result = await this.get(key, 'json');
            if (result.success && result.data !== null) {
                backup[key] = result.data;
            }
        }

        return {
            success: true,
            backup,
            keys: Object.keys(backup),
            count: Object.keys(backup).length
        };
    }

    // 数据恢复
    async restore(backupData) {
        const results = [];

        for (const [key, value] of Object.entries(backupData)) {
            const result = await this.put(key, value);
            results.push({
                key,
                success: result.success,
                error: result.error
            });
        }

        return {
            success: true,
            restored: results,
            total: results.length,
            successful: results.filter(r => r.success).length
        };
    }

    // 设置默认命名空间
    setNamespace(namespace) {
        this.defaultNamespace = namespace;
    }

    // 健康检查
    async health() {
        try {
            // 尝试一个简单的存在检查
            const result = await this.exists('__health_check__');
            return {
                success: true,
                healthy: true,
                baseUrl: this.baseUrl,
                timestamp: Date.now()
            };
        } catch (error) {
            return {
                success: false,
                healthy: false,
                error: error.message,
                baseUrl: this.baseUrl,
                timestamp: Date.now()
            };
        }
    }
}

module.exports = CloudKvClient;