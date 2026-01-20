// 主应用入口
const { createApp } = Vue;
const { createRouter, createWebHashHistory } = VueRouter;

// 路由配置
const routes = [
    {
        path: '/',
        redirect: '/dashboard'
    },
    {
        path: '/login',
        name: 'Login',
        component: Login,
        meta: { requiresGuest: true }
    },
    {
        path: '/dashboard',
        name: 'Dashboard',
        component: Dashboard,
        meta: { requiresAuth: true }
    },
    {
        path: '/projects',
        name: 'Projects',
        component: Projects,
        meta: { requiresAuth: true }
    },
    {
        path: '/awards',
        name: 'Awards',
        component: Awards,
        meta: { requiresAuth: true }
    },
    {
        path: '/timeline',
        name: 'Timeline',
        component: Timeline,
        meta: { requiresAuth: true }
    },
    {
        path: '/skills',
        name: 'Skills',
        component: Skills,
        meta: { requiresAuth: true }
    },
    {
        path: '/storage',
        name: 'Storage',
        component: Storage,
        meta: { requiresAuth: true }
    }
];

// 创建路由实例
const router = createRouter({
    history: createWebHashHistory(),
    routes
});

// 路由守卫
router.beforeEach((to, from, next) => {
    const isAuthenticated = store.isAuthenticated();

    if (to.meta.requiresAuth && !isAuthenticated) {
        next('/login');
    } else if (to.meta.requiresGuest && isAuthenticated) {
        next('/dashboard');
    } else {
        next();
    }
});

// 主应用组件
const App = {
    template: `
        <div id="app">
            <!-- 登录页面 -->
            <router-view v-if="$route.name === 'Login'" />
            
            <!-- 管理后台布局 -->
            <div v-else class="admin-layout">
                <!-- 侧边栏 -->
                <aside class="sidebar" :class="{ collapsed: sidebarCollapsed, show: sidebarShow }">
                    <div class="sidebar-header">
                        <i class="fas fa-bolt" style="color: #00d4ff;"></i>
                        <h2 v-show="!sidebarCollapsed">技术展示后台</h2>
                    </div>
                    
                    <ul class="sidebar-menu">
                        <li>
                            <router-link to="/dashboard" class="nav-link" @click="closeMobileSidebar">
                                <i class="fas fa-tachometer-alt"></i>
                                <span v-show="!sidebarCollapsed">仪表板</span>
                            </router-link>
                        </li>
                        <li>
                            <router-link to="/projects" class="nav-link" @click="closeMobileSidebar">
                                <i class="fas fa-project-diagram"></i>
                                <span v-show="!sidebarCollapsed">项目管理</span>
                            </router-link>
                        </li>
                        <li>
                            <router-link to="/awards" class="nav-link" @click="closeMobileSidebar">
                                <i class="fas fa-trophy"></i>
                                <span v-show="!sidebarCollapsed">获奖管理</span>
                            </router-link>
                        </li>
                        <li>
                            <router-link to="/timeline" class="nav-link" @click="closeMobileSidebar">
                                <i class="fas fa-calendar-alt"></i>
                                <span v-show="!sidebarCollapsed">时间线管理</span>
                            </router-link>
                        </li>
                        <li>
                            <router-link to="/skills" class="nav-link" @click="closeMobileSidebar">
                                <i class="fas fa-cogs"></i>
                                <span v-show="!sidebarCollapsed">技能管理</span>
                            </router-link>
                        </li>
                        <li>
                            <router-link to="/storage" class="nav-link" @click="closeMobileSidebar">
                                <i class="fas fa-database"></i>
                                <span v-show="!sidebarCollapsed">存储管理</span>
                            </router-link>
                        </li>
                    </ul>
                </aside>
                
                <!-- 主内容区域 -->
                <main class="main-content">
                    <!-- 顶部导航 -->
                    <header class="header">
                        <div class="header-left">
                            <button 
                                class="btn btn-secondary" 
                                @click="toggleSidebar"
                                style="margin-right: 1rem;"
                            >
                                <i class="fas fa-bars"></i>
                            </button>
                            <h1 style="margin: 0; font-size: 1.2rem; color: #2c3e50;">
                                {{ getPageTitle() }}
                            </h1>
                        </div>
                        
                        <div class="header-right">
                            <el-dropdown @command="handleUserCommand">
                                <div style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                    <i class="fas fa-user-circle" style="font-size: 1.5rem; color: #667eea;"></i>
                                    <span>{{ store.user?.username || 'Admin' }}</span>
                                    <i class="fas fa-chevron-down"></i>
                                </div>
                                <template #dropdown>
                                    <el-dropdown-menu>
                                        <el-dropdown-item command="profile">
                                            <i class="fas fa-user"></i> 个人资料
                                        </el-dropdown-item>
                                        <el-dropdown-item command="settings">
                                            <i class="fas fa-cog"></i> 设置
                                        </el-dropdown-item>
                                        <el-dropdown-item divided command="logout">
                                            <i class="fas fa-sign-out-alt"></i> 退出登录
                                        </el-dropdown-item>
                                    </el-dropdown-menu>
                                </template>
                            </el-dropdown>
                        </div>
                    </header>
                    
                    <!-- 页面内容 -->
                    <div class="content">
                        <router-view />
                    </div>
                </main>
            </div>
            
            <!-- 移动端遮罩 -->
            <div 
                v-if="sidebarShow && isMobile" 
                class="sidebar-overlay"
                @click="closeMobileSidebar"
                style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 999;"
            ></div>
        </div>
    `,

    data() {
        return {
            sidebarCollapsed: false,
            sidebarShow: false,
            isMobile: false
        };
    },

    mounted() {
        this.checkMobile();
        window.addEventListener('resize', this.checkMobile);
    },

    beforeUnmount() {
        window.removeEventListener('resize', this.checkMobile);
    },

    methods: {
        checkMobile() {
            this.isMobile = window.innerWidth <= 768;
            if (!this.isMobile) {
                this.sidebarShow = false;
            }
        },

        toggleSidebar() {
            if (this.isMobile) {
                this.sidebarShow = !this.sidebarShow;
            } else {
                this.sidebarCollapsed = !this.sidebarCollapsed;
            }
        },

        closeMobileSidebar() {
            if (this.isMobile) {
                this.sidebarShow = false;
            }
        },

        getPageTitle() {
            const titles = {
                Dashboard: '仪表板',
                Projects: '项目管理',
                Awards: '获奖管理',
                Timeline: '时间线管理',
                Skills: '技能管理',
                Storage: '存储管理'
            };
            return titles[this.$route.name] || '管理后台';
        },

        handleUserCommand(command) {
            switch (command) {
                case 'profile':
                    this.showProfile();
                    break;
                case 'settings':
                    this.showSettings();
                    break;
                case 'logout':
                    this.logout();
                    break;
            }
        },

        showProfile() {
            utils.showMessage('个人资料功能开发中', 'info');
        },

        showSettings() {
            utils.showMessage('设置功能开发中', 'info');
        },

        async logout() {
            try {
                await utils.showConfirm('确定要退出登录吗？', '退出确认');

                store.clearAuth();
                utils.showMessage('已退出登录', 'success');
                this.$router.push('/login');
            } catch (error) {
                // 用户取消
            }
        }
    }
};

// 创建应用实例
const app = createApp(App);

// 使用插件
app.use(router);
app.use(ElementPlus);

// 全局属性
app.config.globalProperties.store = store;
app.config.globalProperties.utils = utils;

// 挂载应用
app.mount('#app');