const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const StorageFactory = require('../services/storageFactory');

const router = express.Router();
const edgeStorage = StorageFactory.createStorageService();

// 登录
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: '用户名和密码不能为空'
            });
        }

        // 从边缘存储获取用户信息
        const userResult = await edgeStorage.get(`user:${username}`);

        if (!userResult.success) {
            return res.status(500).json({
                success: false,
                message: '获取用户信息失败'
            });
        }

        const user = userResult.data;
        if (!user) {
            return res.status(401).json({
                success: false,
                message: '用户名或密码错误'
            });
        }

        // 验证密码
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: '用户名或密码错误'
            });
        }

        // 生成JWT token
        const token = jwt.sign(
            {
                userId: user.id,
                username: user.username,
                role: user.role
            },
            process.env.JWT_SECRET || 'tech-showcase-secret',
            { expiresIn: '24h' }
        );

        // 更新最后登录时间
        await edgeStorage.put(`user:${username}`, {
            ...user,
            lastLogin: new Date().toISOString()
        });
        res.json({
            success: true,
            message: '登录成功',
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    email: user.email
                }
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: '登录失败'
        });
    }
});

// 验证token中间件
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: '访问令牌缺失'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'tech-showcase-secret', (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: '访问令牌无效'
            });
        }
        req.user = user;
        next();
    });
}

// 获取当前用户信息
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const userResult = await edgeStorage.get(`user:${req.user.username}`);

        if (!userResult.success || !userResult.data) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        const user = userResult.data;
        res.json({
            success: true,
            data: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
                lastLogin: user.lastLogin
            }
        });
    } catch (error) {
        console.error('Get user info error:', error);
        res.status(500).json({
            success: false,
            message: '获取用户信息失败'
        });
    }
});

// 导出中间件
router.authenticateToken = authenticateToken;

module.exports = router;