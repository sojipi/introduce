/**
 * 存储服务工厂 (Admin版本)
 * 根据环境配置选择使用云函数KV存储、直接ESA存储或本地文件存储
 */

const EdgeStorageService = require('./edgeStorage');
const LocalFileStorage = require('../../server/services/localFileStorage');

// 云函数适配器 (简化版，直接在这里定义)
class EdgeStorageCloudAdapter {
    constructor() {
        this.baseUrl = 'https://kv.zenmb.com/kv/';
        this.namespace = process.env.KV_NAMESPACE || 'default';
    }

    async request(action, params = {}, options = {}) {
        // 使用 Node.js 内置的 fetch (Node.js 18+)
        const url = new URL(`${this.baseUrl}${action}`);

        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                url.searchParams.set(key, params[key]);
            }
        });

        const requestOptions = {
            method: options.method || 'GET',
            headers: { 'User-Agent': 'AdminKvClient/1.0', ...options.headers },
            timeout: 10000
        };

        if (options.body) {
            requestOptions.body = options.body;
        }

        try {
            const response = await fetch(url.toString(), requestOptions);

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
            return { success: false, error: error.message };
        }
    }

    async get(key, type = 'json') {
        const result = await this.request('get', { key, type, namespace: this.namespace });
        return {
            success: result.success,
            data: result.success ? result.value : null,
            error: result.message
        };
    }

    async put(key, value, options = {}) {
        let requestOptions = { method: 'GET' };
        const params = { key, namespace: this.namespace };

        // 简化处理：所有数据都转换为字符串通过URL参数发送
        if (typeof value === 'string') {
            params.value = value;
        } else {
            params.value = JSON.stringify(value);
        }

        console.log('🔍 Admin CloudKV PUT Debug:', {
            key,
            namespace: this.namespace,
            valueLength: params.value.length,
            valuePreview: params.value.substring(0, 100) + '...'
        });

        const result = await this.request('set', params, requestOptions);
        return {
            success: result.success,
            data: result,
            error: result.error
        };
    }

    async delete(key) {
        const result = await this.request('delete', { key, namespace: this.namespace });
        return {
            success: result.success,
            data: result,
            error: result.message
        };
    }

    async list(prefix = '', limit = 100) {
        return {
            success: true,
            data: [],
            message: 'List operation not supported by cloud function'
        };
    }

    async batchPut(items) {
        const results = [];
        for (const item of items) {
            const result = await this.put(item.key, item.value, item.options || {});
            results.push({ key: item.key, ...result });
        }
        return results;
    }

    async backup(keys) {
        const backup = {};
        for (const key of keys) {
            const result = await this.get(key, 'json');
            if (result.success && result.data !== null) {
                backup[key] = result.data;
            }
        }
        return backup;
    }

    async restore(backup) {
        const results = [];
        for (const [key, value] of Object.entries(backup)) {
            const result = await this.put(key, value);
            results.push({ key, ...result });
        }
        return results;
    }
}

class StorageFactory {
    static createStorageService() {
        const storageMode = process.env.KV_STORAGE_MODE || 'cloud';

        switch (storageMode) {
            case 'cloud':
                console.log('Admin: Using Cloud Function KV Storage');
                return new EdgeStorageCloudAdapter();

            case 'direct':
                console.log('Admin: Using Direct Aliyun ESA Storage');
                return new EdgeStorageService();

            case 'local':
                console.log('Admin: Using Local File Storage');
                return new LocalFileStorage();

            default:
                console.warn(`Admin: Unknown storage mode: ${storageMode}, falling back to local`);
                return new LocalFileStorage();
        }
    }
}

module.exports = StorageFactory;