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

// 获取所有存储的键列表 (需要认证)
router.get('/keys', authenticateToken, async (req, res) => {
    try {
        const { limit = 1000, prefix = '' } = req.query;

        const listResult = await edgeStorage.list(prefix, parseInt(limit));

        if (!listResult.success) {
            return res.status(500).json({
                success: false,
                message: '获取键列表失败',
                error: listResult.error
            });
        }

        const keys = listResult.data || [];

        // 按类型分组
        const groupedKeys = keys.reduce((groups, key) => {
            const type = key.split(':')[0];
            if (!groups[type]) {
                groups[type] = [];
            }
            groups[type].push(key);
            return groups;
        }, {});

        res.json({
            success: true,
            data: {
                keys,
                groupedKeys,
                total: keys.length
            }
        });
    } catch (error) {
        console.error('Get storage keys error:', error);
        res.status(500).json({
            success: false,
            message: '获取键列表失败',
            error: error.message
        });
    }
});

// 获取单个键的值 (需要认证)
router.get('/key/:key', authenticateToken, async (req, res) => {
    try {
        const { key } = req.params;

        const result = await edgeStorage.get(key);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: '获取键值失败',
                error: result.error
            });
        }

        res.json({
            success: true,
            data: {
                key,
                value: result.data
            }
        });
    } catch (error) {
        console.error('Get storage key error:', error);
        res.status(500).json({
            success: false,
            message: '获取键值失败',
            error: error.message
        });
    }
});

// 删除键 (需要认证)
router.delete('/key/:key', authenticateToken, async (req, res) => {
    try {
        const { key } = req.params;

        const result = await edgeStorage.delete(key);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: '删除键失败',
                error: result.error
            });
        }

        res.json({
            success: true,
            message: '键删除成功',
            data: { key }
        });
    } catch (error) {
        console.error('Delete storage key error:', error);
        res.status(500).json({
            success: false,
            message: '删除键失败',
            error: error.message
        });
    }
});

module.exports = router;