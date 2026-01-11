const fs = require('fs').promises;
const path = require('path');

class LocalFileStorage {
    constructor() {
        this.dataDir = path.join(__dirname, '../../data');
        this.ensureDataDir();
    }

    async ensureDataDir() {
        try {
            await fs.mkdir(this.dataDir, { recursive: true });
        } catch (error) {
            // 目录已存在，忽略错误
        }
    }

    getFilePath(key) {
        // 将key中的冒号替换为下划线，避免文件名问题
        const safeKey = key.replace(/:/g, '_');
        return path.join(this.dataDir, `${safeKey}.json`);
    }

    async put(key, value, options = {}) {
        try {
            await this.ensureDataDir();
            const filePath = this.getFilePath(key);
            const data = JSON.stringify(value, null, 2);
            await fs.writeFile(filePath, data, 'utf8');

            return {
                success: true,
                data: { key, value }
            };
        } catch (error) {
            console.error('LocalFileStorage put error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async get(key, type = 'json') {
        try {
            const filePath = this.getFilePath(key);

            try {
                const data = await fs.readFile(filePath, 'utf8');
                const parsedData = JSON.parse(data);

                return {
                    success: true,
                    data: parsedData
                };
            } catch (readError) {
                if (readError.code === 'ENOENT') {
                    // 文件不存在
                    return {
                        success: true,
                        data: null
                    };
                }
                throw readError;
            }
        } catch (error) {
            console.error('LocalFileStorage get error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async delete(key) {
        try {
            const filePath = this.getFilePath(key);
            await fs.unlink(filePath);

            return {
                success: true,
                data: { key }
            };
        } catch (error) {
            if (error.code === 'ENOENT') {
                // 文件不存在，认为删除成功
                return {
                    success: true,
                    data: { key }
                };
            }

            console.error('LocalFileStorage delete error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async list(prefix = '', limit = 100) {
        try {
            await this.ensureDataDir();
            const files = await fs.readdir(this.dataDir);

            const keys = files
                .filter(file => file.endsWith('.json'))
                .map(file => file.replace('.json', '').replace(/_/g, ':'))
                .filter(key => key.startsWith(prefix))
                .slice(0, limit);

            return {
                success: true,
                data: keys
            };
        } catch (error) {
            console.error('LocalFileStorage list error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async batchPut(items) {
        const results = [];
        for (const item of items) {
            const result = await this.put(item.key, item.value, item.options);
            results.push({
                key: item.key,
                ...result
            });
        }
        return results;
    }

    async backup(keys) {
        const backup = {};
        for (const key of keys) {
            const result = await this.get(key);
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
            results.push({
                key,
                ...result
            });
        }
        return results;
    }

    async healthCheck() {
        try {
            await this.ensureDataDir();
            return {
                success: true,
                healthy: true,
                storage: 'local-file',
                dataDir: this.dataDir
            };
        } catch (error) {
            return {
                success: false,
                healthy: false,
                error: error.message
            };
        }
    }
}

module.exports = LocalFileStorage;