// Dashboard Vue组件
const Dashboard = {
    template: `
        <div class="dashboard">
            <div class="dashboard-header">
                <h2>仪表板</h2>
                <button class="btn btn-primary" @click="refresh">
                    <i class="fas fa-sync-alt"></i> 刷新数据
                </button>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-cogs"></i>
                    </div>
                    <div class="stat-info">
                        <h3 id="skills-count">{{ stats.skills }}</h3>
                        <p>技能总数</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-project-diagram"></i>
                    </div>
                    <div class="stat-info">
                        <h3 id="projects-count">{{ stats.projects }}</h3>
                        <p>项目总数</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-trophy"></i>
                    </div>
                    <div class="stat-info">
                        <h3 id="awards-count">{{ stats.awards }}</h3>
                        <p>获奖总数</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <div class="stat-info">
                        <h3 id="avg-skill-level">{{ stats.avgLevel }}%</h3>
                        <p>平均技能水平</p>
                    </div>
                </div>
            </div>
            
            <div class="dashboard-content">
                <div class="row">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h4>最近活动</h4>
                            </div>
                            <div class="card-body">
                                <div class="activity-list">
                                    <div class="activity-item">
                                        <i class="fas fa-plus-circle text-success"></i>
                                        <span>添加了新技能: React</span>
                                        <small class="text-muted">2小时前</small>
                                    </div>
                                    <div class="activity-item">
                                        <i class="fas fa-edit text-primary"></i>
                                        <span>更新了项目: 技术展示网站</span>
                                        <small class="text-muted">5小时前</small>
                                    </div>
                                    <div class="activity-item">
                                        <i class="fas fa-trophy text-warning"></i>
                                        <span>添加了获奖记录</span>
                                        <small class="text-muted">1天前</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h4>系统状态</h4>
                            </div>
                            <div class="card-body">
                                <div class="system-status">
                                    <div class="status-item">
                                        <span class="status-label">API服务</span>
                                        <span class="status-badge status-online">
                                            <i class="fas fa-circle"></i> 正常
                                        </span>
                                    </div>
                                    <div class="status-item">
                                        <span class="status-label">数据库</span>
                                        <span class="status-badge status-online">
                                            <i class="fas fa-circle"></i> 正常
                                        </span>
                                    </div>
                                    <div class="status-item">
                                        <span class="status-label">存储服务</span>
                                        <span class="status-badge status-online">
                                            <i class="fas fa-circle"></i> 正常
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,

    data() {
        return {
            stats: {
                skills: 0,
                projects: 0,
                awards: 0,
                avgLevel: 0
            },
            refreshInterval: null
        };
    },

    async mounted() {
        await this.loadStats();
        this.setupRefreshInterval();
    },

    beforeUnmount() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    },

    methods: {
        async loadStats() {
            try {
                // 并行加载所有统计数据
                const promises = [
                    this.fetchSkillsStats(),
                    this.fetchProjectsStats(),
                    this.fetchAwardsStats(),
                    this.fetchTimelineStats()
                ];

                const results = await Promise.allSettled(promises);

                // 处理结果
                results.forEach((result, index) => {
                    if (result.status === 'fulfilled') {
                        switch (index) {
                            case 0: // 技能统计
                                this.updateSkillsStats(result.value);
                                break;
                            case 1: // 项目统计
                                this.updateProjectsStats(result.value);
                                break;
                            case 2: // 获奖统计
                                this.updateAwardsStats(result.value);
                                break;
                            case 3: // 时间线统计
                                this.updateTimelineStats(result.value);
                                break;
                        }
                    }
                });

                this.$nextTick(() => {
                    this.animateCounters();
                });
            } catch (error) {
                console.error('Load dashboard stats error:', error);
                this.utils.showMessage('加载统计数据失败', 'error');
            }
        },

        async fetchSkillsStats() {
            try {
                const response = await axios.get('/skills/stats/summary');
                if (response.data.success) {
                    return response.data.data;
                }
            } catch (error) {
                console.error('Fetch skills stats error:', error);
            }
            return null;
        },

        async fetchProjectsStats() {
            try {
                const response = await axios.get('/projects?page=1&limit=1');
                if (response.data.success) {
                    return { total: response.data.data.pagination?.total || 0 };
                }
            } catch (error) {
                console.error('Fetch projects stats error:', error);
            }
            return null;
        },

        async fetchAwardsStats() {
            try {
                const response = await axios.get('/awards?page=1&limit=1');
                if (response.data.success) {
                    return { total: response.data.data.pagination?.total || 0 };
                }
            } catch (error) {
                console.error('Fetch awards stats error:', error);
            }
            return null;
        },

        async fetchTimelineStats() {
            try {
                const response = await axios.get('/timeline?page=1&limit=1');
                if (response.data.success) {
                    return { total: response.data.data.pagination?.total || 0 };
                }
            } catch (error) {
                console.error('Fetch timeline stats error:', error);
            }
            return null;
        },

        updateSkillsStats(data) {
            if (data) {
                this.stats.skills = data.total || 0;
                this.stats.avgLevel = Math.round(data.averageLevel || 0);
            }
        },

        updateProjectsStats(data) {
            if (data) {
                this.stats.projects = data.total || 0;
            }
        },

        updateAwardsStats(data) {
            if (data) {
                this.stats.awards = data.total || 0;
            }
        },

        updateTimelineStats(data) {
            if (data) {
                // 可以添加时间线相关的统计
            }
        },

        animateCounters() {
            const counters = [
                { element: document.getElementById('skills-count'), target: this.stats.skills },
                { element: document.getElementById('projects-count'), target: this.stats.projects },
                { element: document.getElementById('awards-count'), target: this.stats.awards },
                { element: document.getElementById('avg-skill-level'), target: this.stats.avgLevel }
            ];

            counters.forEach(counter => {
                if (counter.element) {
                    this.animateCounter(counter.element, counter.target);
                }
            });
        },

        animateCounter(element, target) {
            const duration = 1000; // 1秒动画
            const start = parseInt(element.textContent) || 0;
            const increment = (target - start) / (duration / 16); // 60fps
            let current = start;

            const updateCounter = () => {
                current += increment;
                if ((increment > 0 && current >= target) || (increment < 0 && current <= target)) {
                    element.textContent = target;
                } else {
                    element.textContent = Math.floor(current);
                    requestAnimationFrame(updateCounter);
                }
            };

            if (target !== start) {
                updateCounter();
            }
        },

        setupRefreshInterval() {
            // 每5分钟刷新一次统计数据
            this.refreshInterval = setInterval(() => {
                this.loadStats();
            }, 5 * 60 * 1000);
        },

        // 手动刷新统计数据
        async refresh() {
            await this.loadStats();
            this.utils.showMessage('数据已刷新', 'success');
        }
    }
};