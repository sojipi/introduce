/**
 * 存储服务工厂
 * 根据环境配置选择使用云函数KV存储、直接ESA存储或本地文件存储
 */

const EdgeStorageService = require('./edgeStorage');
const EdgeStorageCloudAdapter = require('./edgeStorageCloudAdapter');
const LocalFileStorage = require('./localFileStorage');

class StorageFactory {
    static createStorageService() {
        const storageMode = process.env.KV_STORAGE_MODE || 'local';

        switch (storageMode) {
            case 'cloud':
                console.log('Using Cloud Function KV Storage');
                return new EdgeStorageCloudAdapter();

            case 'direct':
                console.log('Using Direct Aliyun ESA Storage');
                return new EdgeStorageService();

            case 'local':
                console.log('Using Local File Storage');
                return new LocalFileStorage();

            default:
                console.warn(`Unknown storage mode: ${storageMode}, falling back to local`);
                return new LocalFileStorage();
        }
    }
}

module.exports = StorageFactory;