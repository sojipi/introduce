module.exports = {
    apps: [{
        name: 'tech-showcase-admin',
        script: 'server.js',
        instances: 'max',
        exec_mode: 'cluster',
        env: {
            NODE_ENV: 'development',
            PORT: 3001
        },
        env_production: {
            NODE_ENV: 'production',
            PORT: 3001
        },
        // 日志配置
        log_file: './logs/combined.log',
        out_file: './logs/out.log',
        error_file: './logs/error.log',
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

        // 监控配置
        monitoring: false,

        // 重启配置
        max_restarts: 10,
        min_uptime: '10s',
        max_memory_restart: '1G',

        // 自动重启
        watch: false,
        ignore_watch: ['node_modules', 'logs', 'uploads'],

        // 进程管理
        kill_timeout: 5000,
        wait_ready: true,
        listen_timeout: 8000,

        // 环境变量
        env_file: '.env'
    }],

    deploy: {
        production: {
            user: 'deploy',
            host: 'your-server.com',
            ref: 'origin/main',
            repo: 'git@github.com:username/tech-showcase-admin.git',
            path: '/var/www/tech-showcase-admin',
            'pre-deploy-local': '',
            'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
            'pre-setup': ''
        }
    }
};