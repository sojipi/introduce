const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.ADMIN_PORT || 3002;

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务 - 主项目前端
app.use('/', express.static(path.join(__dirname)));

// 静态文件服务 - 管理后台
app.use('/admin', express.static(path.join(__dirname, 'admin/public')));

// API路由
app.use('/api/auth', require('./admin/routes/auth'));
app.use('/api/projects', require('./admin/routes/projects'));
app.use('/api/awards', require('./admin/routes/awards'));
app.use('/api/timeline', require('./admin/routes/timeline'));
app.use('/api/skills', require('./admin/routes/skills'));
app.use('/api/storage', require('./admin/routes/storage'));
app.use('/api/frontend', require('./server/routes/frontend'));

// 健康检查路由
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0'
    });
});

// 管理后台路由 - 必须在静态文件之后，但在404之前
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin/public', 'index.html'));
});

app.get('/admin/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin/public', 'index.html'));
});

// 主项目路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404处理
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: '页面不存在'
    });
});

app.listen(PORT, async () => {
    console.log(`🚀 技术展示项目启动成功！`);
    console.log(`📱 前端展示: http://localhost:${PORT}`);
    console.log(`⚙️  管理后台: http://localhost:${PORT}/admin`);
    console.log(`🔗 API接口: http://localhost:${PORT}/api`);

    // 初始化默认管理员账户
    try {
        const { initDefaultAdmin } = require('./admin/scripts/init-admin');
        await initDefaultAdmin();
    } catch (error) {
        console.error('❌ 初始化管理员账户失败:', error);
    }
});