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
        console.log('🔐 Login attempt:', { username, passwordLength: password?.length });

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: '用户名和密码不能为空'
            });
        }

        // 从边缘存储获取用户信息
        const userResult = await edgeStorage.get(`user:${username}`);
        console.log('📦 User result:', { success: userResult.success, hasData: !!userResult.data });

        if (!userResult.success) {
            return res.status(500).json({
                success: false,
                message: '获取用户信息失败'
            });
        }

        let user = userResult.data;
        if (!user) {
            console.log('❌ User not found');
            return res.status(401).json({
                success: false,
                message: '用户名或密码错误'
            });
        }

        // 如果返回的是字符串，需要解析为对象
        if (typeof user === 'string') {
            try {
                user = JSON.parse(user);
                console.log('✅ User data parsed successfully');
            } catch (error) {
                console.error('Failed to parse user data:', error);
                return res.status(500).json({
                    success: false,
                    message: '用户数据格式错误'
                });
            }
        }

        // 验证密码
        console.log('🔑 Validating password...');
        const isValidPassword = await bcrypt.compare(password, user.password);
        console.log('🔑 Password valid:', isValidPassword);

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

        // 更新最后登录时间 (只有超过1小时才更新)
        const now = new Date();
        const lastLogin = user.lastLogin ? new Date(user.lastLogin) : new Date(0);
        const hoursSinceLastLogin = (now - lastLogin) / (1000 * 60 * 60);

        if (hoursSinceLastLogin > 1) {
            await edgeStorage.put(`user:${username}`, JSON.stringify({
                ...user,
                lastLogin: now.toISOString()
            }));
        }

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

        let user = userResult.data;

        // 如果返回的是字符串，需要解析为对象
        if (typeof user === 'string') {
            try {
                user = JSON.parse(user);
            } catch (error) {
                console.error('Failed to parse user data:', error);
                return res.status(500).json({
                    success: false,
                    message: '用户数据格式错误'
                });
            }
        }

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