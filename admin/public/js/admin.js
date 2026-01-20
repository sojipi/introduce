class AdminApp {
    constructor() {
        this.currentPage = 'dashboard';
        this.isAuthenticated = false;
        this.skillsManager = null;
        this.init();
    }

    init() {
        this.checkAuthentication();
        this.setupEventListeners();
        this.initializeComponents();
    }

    checkAuthentication() {
        const token = localStorage.getItem('token');
        if (token) {
            // 验证token是否有效
            this.verifyToken(token);
        } else {
            this.showLoginModal();
        }
    }

    async verifyToken(token) {
        try {
            const response = await fetch('/api/auth/verify', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.isAuthenticated = true;
                    document.getElementById('username').textContent = data.user.username;
                    this.hideLoginModal();
                    this.loadDashboard();
                } else {
                    this.showLoginModal();
                }
            } else {
                this.showLoginModal();
            }
        } catch (error) {
            console.error('Token verification error:', error);
            this.showLoginModal();
        }
    }

    setupEventListeners() {
        // 侧边栏菜单
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                this.navigateToPage(page);
            });
        });

        // 登录表单
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // 退出登录
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.handleLogout();
        });

        // 侧边栏切换（移动端）
        document.querySelector('.sidebar-toggle').addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('show');
        });

        // 数据导出/导入
        document.getElementById('export-data-btn').addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('import-data-btn').addEventListener('click', () => {
            document.getElementById('import-file').click();
        });

        document.getElementById('import-file').addEventListener('change', (e) => {
            this.importData(e.target.files[0]);
        });
    }

    initializeComponents() {
        // 初始化技能管理器
        this.skillsManager = new SkillsManager();
    }

    navigateToPage(page) {
        // 更新菜单状态
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-page="${page}"]`).classList.add('active');

        // 更新页面内容
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });
        document.getElementById(`${page}-page`).classList.add('active');

        // 更新页面标题
        const titles = {
            dashboard: '仪表盘',
            skills: '技能管理',
            projects: '项目管理',
            awards: '获奖管理',
            timeline: '时间线管理',
            settings: '系统设置'
        };
        document.getElementById('page-title').textContent = titles[page];

        this.currentPage = page;

        // 加载页面数据
        this.loadPageData(page);
    }

    async loadPageData(page) {
        switch (page) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'skills':
                if (this.skillsManager) {
                    this.skillsManager.loadSkills();
                }
                break;
            case 'projects':
                this.loadProjects();
                break;
            case 'awards':
                this.loadAwards();
                break;
            case 'timeline':
                this.loadTimeline();
                break;
        }
    }

    async loadDashboard() {
        try {
            // 加载统计数据
            const [skillsStats, projectsStats, awardsStats] = await Promise.all([
                this.fetchStats('/api/skills/stats/summary'),
                this.fetchStats('/api/projects/stats/summary'),
                this.fetchStats('/api/awards/stats/summary')
            ]);

            // 更新统计卡片
            document.getElementById('skills-count').textContent = skillsStats.total || 0;
            document.getElementById('projects-count').textContent = projectsStats.total || 0;
            document.getElementById('awards-count').textContent = awardsStats.total || 0;
            document.getElementById('avg-skill-level').textContent = skillsStats.averageLevel || 0;

        } catch (error) {
            console.error('Load dashboard error:', error);
        }
    }

    async fetchStats(url) {
        try {
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                return data.success ? data.data : {};
            }
        } catch (error) {
            console.error('Fetch stats error:', error);
        }
        return {};
    }

    async loadProjects() {
        // 项目管理功能 - 待实现
        console.log('Loading projects...');
    }

    async loadAwards() {
        // 获奖管理功能 - 待实现
        console.log('Loading awards...');
    }

    async loadTimeline() {
        // 时间线管理功能 - 待实现
        console.log('Loading timeline...');
    }

    async handleLogin() {
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        if (!username || !password) {
            this.showError('请输入用户名和密码');
            return;
        }

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                localStorage.setItem('token', data.data.token);
                this.isAuthenticated = true;
                document.getElementById('username').textContent = data.data.user.username;
                this.hideLoginModal();
                this.loadDashboard();
                this.showSuccess('登录成功');
            } else {
                this.showError(data.message || '用户名或密码错误');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('登录失败，请检查网络连接');
        }
    }

    handleLogout() {
        localStorage.removeItem('token');
        this.isAuthenticated = false;
        this.showLoginModal();
        this.showSuccess('已退出登录');
    }

    showLoginModal() {
        const modal = document.getElementById('login-modal');
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }

    hideLoginModal() {
        const modal = document.getElementById('login-modal');
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }

    async exportData() {
        try {
            const response = await fetch('/api/export', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const blob = new Blob([JSON.stringify(data, null, 2)], {
                    type: 'application/json'
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `tech-showcase-data-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
                this.showSuccess('数据导出成功');
            } else {
                this.showError('数据导出失败');
            }
        } catch (error) {
            console.error('Export error:', error);
            this.showError('数据导出失败');
        }
    }

    async importData(file) {
        if (!file) return;

        try {
            const text = await file.text();
            const data = JSON.parse(text);

            const response = await fetch('/api/import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    this.showSuccess('数据导入成功');
                    this.loadPageData(this.currentPage); // 重新加载当前页面数据
                } else {
                    this.showError(result.message || '数据导入失败');
                }
            } else {
                this.showError('数据导入失败');
            }
        } catch (error) {
            console.error('Import error:', error);
            this.showError('数据导入失败，请检查文件格式');
        }
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 2rem;
            border-radius: 5px;
            color: white;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;

        if (type === 'success') {
            notification.style.background = '#28a745';
        } else if (type === 'error') {
            notification.style.background = '#dc3545';
        } else {
            notification.style.background = '#17a2b8';
        }

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// 等待DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.adminApp = new AdminApp();
});

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
@keyframes slideInRight {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes slideOutRight {
    from {
        transform: translateX(0);
        opacity: 1;
    }
    to {
        transform: translateX(100%);
        opacity: 0;
    }
}
`;
document.head.appendChild(style);