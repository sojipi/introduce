const express = require('express');
const StorageFactory = require('../services/storageFactory');
const { authenticateToken } = require('./auth');

const router = express.Router();
const edgeStorage = StorageFactory.createStorageService();

// 获取存储统计信息 (公开访问)
router.get('/stats', async (req, res) => {
    try {
        const listResult = await edgeStorage.list();

        if (!listResult.success) {
            return res.status(500).json({
                success: false,
                message: '获取存储统计失败'
            });
        }

        const keys = listResult.data;

        // 按类型分组统计
        const typeStats = keys.reduce((stats, key) => {
            const type = key.split(':')[0];
            stats[type] = (stats[type] || 0) + 1;
            return stats;
        }, {});

        res.json({
            success: true,
            data: {
                totalKeys: keys.length,
                typeStats,
                estimatedSize: keys.length * 1024, // 估算大小
                lastUpdated: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Get storage stats error:', error);
        res.status(500).json({
            success: false,
            message: '获取存储统计失败'
        });
    }
});

module.exports = router;