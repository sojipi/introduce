const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use('/admin', express.static(path.join(__dirname, 'public')));

// API路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/awards', require('./routes/awards'));
app.use('/api/timeline', require('./routes/timeline'));
app.use('/api/skills', require('./routes/skills'));
app.use('/api/storage', require('./routes/storage'));

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

// 管理后台路由
app.get('/admin/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 根路径重定向到管理后台
app.get('/', (req, res) => {
    res.redirect('/admin');
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
        message: '接口不存在'
    });
});

app.listen(PORT, () => {
    console.log(`🚀 后台管理系统启动成功！`);
    console.log(`📱 管理后台: http://localhost:${PORT}/admin`);
    console.log(`🔗 API接口: http://localhost:${PORT}/api`);
});