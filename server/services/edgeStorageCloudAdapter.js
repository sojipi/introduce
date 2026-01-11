/**
 * EdgeStorage云函数适配器
 * 将原有的EdgeStorageService接口适配到云函数KV存储
 */

const CloudKvClient = require('./cloudKvClient');

class EdgeStorageCloudAdapter {
    constructor() {
        // 使用云函数KV客户端
        this.kvClient = new CloudKvClient({
            namespace: process.env.ALIYUN_ESA_NAMESPACE || 'tech-showcase'
        });
    }

    // 存储数据 - 完全兼容原有接口
    async put(key, value, options = {}) {
        try {
            const result = await this.kvClient.put(key, value, options);
            return result;
        } catch (error) {
            console.error('EdgeStorage put error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 获取数据 - 完全兼容原有接口
    async get(key, type = 'json') {
        try {
            const result = await this.kvClient.get(key, type);
            return result;
        } catch (error) {
            console.error('EdgeStorage get error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 删除数据 - 完全兼容原有接口
    async delete(key) {
        try {
            const result = await this.kvClient.delete(key);
            return result;
        } catch (error) {
            console.error('EdgeStorage delete error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 列出所有键 - 完全兼容原有接口
    async list(prefix = '', limit = 100) {
        try {
            const result = await this.kvClient.list(prefix, limit);
            return result;
        } catch (error) {
            console.error('EdgeStorage list error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 批量操作 - 完全兼容原有接口
    async batchPut(items) {
        try {
            const results = await this.kvClient.batchPut(items);
            return results;
        } catch (error) {
            console.error('EdgeStorage batchPut error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 数据备份 - 完全兼容原有接口
    async backup(keys) {
        try {
            const result = await this.kvClient.backup(keys);
            return result.backup;
        } catch (error) {
            console.error('EdgeStorage backup error:', error);
            return {};
        }
    }

    // 数据恢复 - 完全兼容原有接口
    async restore(backup) {
        try {
            const results = await this.kvClient.restore(backup);
            return results.restored;
        } catch (error) {
            console.error('EdgeStorage restore error:', error);
            return [];
        }
    }

    // 健康检查
    async healthCheck() {
        try {
            const result = await this.kvClient.health();
            return result;
        } catch (error) {
            console.error('EdgeStorage health check error:', error);
            return {
                success: false,
                healthy: false,
                error: error.message
            };
        }
    }
}

module.exports = EdgeStorageCloudAdapter;