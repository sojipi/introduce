const express = require('express');
const StorageFactory = require('../services/storageFactory');
const { authenticateToken } = require('./auth');

const router = express.Router();
const edgeStorage = StorageFactory.createStorageService();

// 获取存储统计信息
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        // 获取所有数据键
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

        // 计算总大小（估算）
        let totalSize = 0;
        const sampleKeys = keys.slice(0, 10); // 取样本计算平均大小

        for (const key of sampleKeys) {
            try {
                const result = await edgeStorage.get(key, 'text');
                if (result.success && result.data) {
                    totalSize += JSON.stringify(result.data).length;
                }
            } catch (error) {
                console.warn(`Failed to get size for key: ${key}`);
            }
        }

        const averageSize = sampleKeys.length > 0 ? totalSize / sampleKeys.length : 0;
        const estimatedTotalSize = Math.round(averageSize * keys.length);

        res.json({
            success: true,
            data: {
                totalKeys: keys.length,
                typeStats,
                estimatedSize: estimatedTotalSize,
                sizeUnit: 'bytes',
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

// 列出所有键
router.get('/keys', authenticateToken, async (req, res) => {
    try {
        const { prefix, limit = 100 } = req.query;

        const listResult = await edgeStorage.list(prefix, parseInt(limit));

        if (!listResult.success) {
            return res.status(500).json({
                success: false,
                message: '获取键列表失败'
            });
        }

        res.json({
            success: true,
            data: {
                keys: listResult.data,
                total: listResult.data.length,
                prefix: prefix || '',
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('List keys error:', error);
        res.status(500).json({
            success: false,
            message: '获取键列表失败'
        });
    }
});

// 获取指定键的值
router.get('/data/:key', authenticateToken, async (req, res) => {
    try {
        const { key } = req.params;
        const { type = 'json' } = req.query;

        const result = await edgeStorage.get(key, type);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: '获取数据失败'
            });
        }

        if (result.data === null) {
            return res.status(404).json({
                success: false,
                message: '数据不存在'
            });
        }

        res.json({
            success: true,
            data: {
                key,
                value: result.data,
                type,
                size: JSON.stringify(result.data).length
            }
        });
    } catch (error) {
        console.error('Get data error:', error);
        res.status(500).json({
            success: false,
            message: '获取数据失败'
        });
    }
});

// 设置键值
router.put('/data/:key', authenticateToken, async (req, res) => {
    try {
        const { key } = req.params;
        const { value, options = {} } = req.body;

        if (value === undefined) {
            return res.status(400).json({
                success: false,
                message: '值不能为空'
            });
        }

        const result = await edgeStorage.put(key, value, options);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: '设置数据失败'
            });
        }

        res.json({
            success: true,
            message: '数据设置成功',
            data: {
                key,
                size: JSON.stringify(value).length,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Set data error:', error);
        res.status(500).json({
            success: false,
            message: '设置数据失败'
        });
    }
});

// 删除键
router.delete('/data/:key', authenticateToken, async (req, res) => {
    try {
        const { key } = req.params;

        const result = await edgeStorage.delete(key);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: '删除数据失败'
            });
        }

        res.json({
            success: true,
            message: '数据删除成功',
            data: {
                key,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Delete data error:', error);
        res.status(500).json({
            success: false,
            message: '删除数据失败'
        });
    }
});

// 批量操作
router.post('/batch', authenticateToken, async (req, res) => {
    try {
        const { operations } = req.body; // [{ action: 'put|delete', key, value?, options? }]

        if (!operations || !Array.isArray(operations)) {
            return res.status(400).json({
                success: false,
                message: '操作列表格式错误'
            });
        }

        const results = [];

        for (const operation of operations) {
            const { action, key, value, options } = operation;

            try {
                let result;

                switch (action) {
                    case 'put':
                        if (value === undefined) {
                            results.push({
                                key,
                                action,
                                success: false,
                                message: '值不能为空'
                            });
                            continue;
                        }
                        result = await edgeStorage.put(key, value, options);
                        break;

                    case 'delete':
                        result = await edgeStorage.delete(key);
                        break;

                    default:
                        results.push({
                            key,
                            action,
                            success: false,
                            message: '不支持的操作类型'
                        });
                        continue;
                }

                results.push({
                    key,
                    action,
                    success: result.success,
                    message: result.success ? '操作成功' : result.error || '操作失败'
                });
            } catch (error) {
                results.push({
                    key,
                    action,
                    success: false,
                    message: error.message
                });
            }
        }

        const successCount = results.filter(r => r.success).length;

        res.json({
            success: true,
            message: `批量操作完成，成功 ${successCount}/${results.length} 个操作`,
            data: results
        });
    } catch (error) {
        console.error('Batch operations error:', error);
        res.status(500).json({
            success: false,
            message: '批量操作失败'
        });
    }
});

// 数据备份
router.post('/backup', authenticateToken, async (req, res) => {
    try {
        const { keys, prefix } = req.body;

        let keysToBackup = [];

        if (keys && Array.isArray(keys)) {
            keysToBackup = keys;
        } else if (prefix) {
            const listResult = await edgeStorage.list(prefix);
            if (listResult.success) {
                keysToBackup = listResult.data;
            }
        } else {
            // 备份所有数据
            const listResult = await edgeStorage.list();
            if (listResult.success) {
                keysToBackup = listResult.data;
            }
        }

        const backup = await edgeStorage.backup(keysToBackup);

        const backupData = {
            timestamp: new Date().toISOString(),
            version: '1.0',
            totalKeys: Object.keys(backup).length,
            data: backup
        };

        res.json({
            success: true,
            message: '数据备份成功',
            data: backupData
        });
    } catch (error) {
        console.error('Backup error:', error);
        res.status(500).json({
            success: false,
            message: '数据备份失败'
        });
    }
});

// 数据恢复
router.post('/restore', authenticateToken, async (req, res) => {
    try {
        const { backupData, overwrite = false } = req.body;

        if (!backupData || !backupData.data) {
            return res.status(400).json({
                success: false,
                message: '备份数据格式错误'
            });
        }

        const dataToRestore = backupData.data;

        // 如果不覆盖，检查冲突
        if (!overwrite) {
            const conflicts = [];
            for (const key of Object.keys(dataToRestore)) {
                const existingResult = await edgeStorage.get(key);
                if (existingResult.success && existingResult.data !== null) {
                    conflicts.push(key);
                }
            }

            if (conflicts.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: '存在数据冲突，请选择覆盖模式或手动处理冲突',
                    data: {
                        conflicts,
                        conflictCount: conflicts.length
                    }
                });
            }
        }

        const results = await edgeStorage.restore(dataToRestore);
        const successCount = results.filter(r => r.success).length;

        res.json({
            success: true,
            message: `数据恢复完成，成功 ${successCount}/${results.length} 个键`,
            data: {
                results,
                successCount,
                totalCount: results.length,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Restore error:', error);
        res.status(500).json({
            success: false,
            message: '数据恢复失败'
        });
    }
});

// 清理过期数据
router.post('/cleanup', authenticateToken, async (req, res) => {
    try {
        const { dryRun = true, olderThan } = req.body;

        if (!olderThan) {
            return res.status(400).json({
                success: false,
                message: '请指定清理时间阈值'
            });
        }

        const cutoffDate = new Date(olderThan);
        if (isNaN(cutoffDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: '时间格式错误'
            });
        }

        // 获取所有键
        const listResult = await edgeStorage.list();
        if (!listResult.success) {
            return res.status(500).json({
                success: false,
                message: '获取键列表失败'
            });
        }

        const keysToClean = [];

        // 检查每个键的创建时间
        for (const key of listResult.data) {
            try {
                const result = await edgeStorage.get(key);
                if (result.success && result.data) {
                    const data = result.data;
                    const createdAt = data.createdAt || data.timestamp;

                    if (createdAt && new Date(createdAt) < cutoffDate) {
                        keysToClean.push({
                            key,
                            createdAt,
                            size: JSON.stringify(data).length
                        });
                    }
                }
            } catch (error) {
                console.warn(`Failed to check key: ${key}`, error);
            }
        }

        if (dryRun) {
            res.json({
                success: true,
                message: '清理预览完成（未实际删除）',
                data: {
                    keysToClean,
                    totalKeys: keysToClean.length,
                    totalSize: keysToClean.reduce((sum, item) => sum + item.size, 0),
                    cutoffDate: cutoffDate.toISOString(),
                    dryRun: true
                }
            });
        } else {
            // 实际删除
            const deleteResults = [];

            for (const item of keysToClean) {
                const deleteResult = await edgeStorage.delete(item.key);
                deleteResults.push({
                    key: item.key,
                    success: deleteResult.success,
                    message: deleteResult.success ? '删除成功' : deleteResult.error || '删除失败'
                });
            }

            const successCount = deleteResults.filter(r => r.success).length;

            res.json({
                success: true,
                message: `清理完成，删除 ${successCount}/${deleteResults.length} 个键`,
                data: {
                    deleteResults,
                    successCount,
                    totalCount: deleteResults.length,
                    cutoffDate: cutoffDate.toISOString(),
                    dryRun: false
                }
            });
        }
    } catch (error) {
        console.error('Cleanup error:', error);
        res.status(500).json({
            success: false,
            message: '清理操作失败'
        });
    }
});

module.exports = router;