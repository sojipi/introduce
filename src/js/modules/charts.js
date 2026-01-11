export class ChartManager {
    constructor() {
        this.charts = {};
        this.allData = null;
        this.isLoading = false;
        this.isLoaded = false;
    }

    async init() {
        if (this.isLoading || this.isLoaded) {
            return;
        }

        // 如果已经有数据，直接初始化图表
        if (this.allData && this.allData.awards) {
            this.initializeCharts();
            this.isLoaded = true;
            return;
        }

        await this.loadAllData();
        this.initializeCharts();
        this.isLoaded = true;
    }

    // 从统一接口或缓存获取数据
    async loadAllData() {
        if (this.isLoading || this.isLoaded) {
            return;
        }

        this.isLoading = true;

        try {
            console.log('🔄 图表模块：获取数据...');

            // 检查是否已有缓存数据
            if (window.skillsManager && window.skillsManager.allData) {
                console.log('✅ 图表模块：使用已缓存的数据');
                this.allData = window.skillsManager.allData;
                return;
            }

            // 检查是否有AwardsManager的数据
            if (window.awardsManager && window.awardsManager.awards && window.awardsManager.isLoaded) {
                console.log('✅ 图表模块：使用AwardsManager的数据');
                this.allData = {
                    awards: window.awardsManager.awards,
                    skills: this.getDefaultSkillsData()
                };
                return;
            }

            // 从API获取awards数据
            console.log('🏆 图表模块：从API获取awards数据...');
            const awardsResponse = await fetch('/api/frontend/awards');
            let awards = [];

            if (awardsResponse.ok) {
                const awardsResult = await awardsResponse.json();
                if (awardsResult.success && awardsResult.data) {
                    awards = awardsResult.data;
                    console.log('✅ 图表模块：成功获取awards数据', awards.length, '条');
                } else {
                    console.log('⚠️ 图表模块：awards API返回空数据');
                }
            } else {
                console.log('⚠️ 图表模块：awards API请求失败');
            }

            this.allData = {
                awards: awards,
                skills: this.getDefaultSkillsData()
            };
        } catch (error) {
            console.log('⚠️ 图表模块：加载数据失败:', error.message);
            this.allData = {
                awards: [],
                skills: this.getDefaultSkillsData()
            };
        } finally {
            this.isLoading = false;
        }
    }

    initializeCharts() {
        // 等待Chart.js库加载完成
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js未加载，跳过图表初始化');
            return;
        }

        this.createAwardsChart();
    }

    createAwardsChart() {
        const canvas = document.getElementById('awards-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // 处理获奖数据
        const awardsData = this.processAwardsData();

        this.charts.awards = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: awardsData.labels,
                datasets: [{
                    data: awardsData.values,
                    backgroundColor: [
                        '#FFD700', // 金奖
                        '#C0C0C0', // 银奖
                        '#CD7F32', // 铜奖
                        '#4FACFE'  // 其他
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#fff',
                            padding: 20,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    duration: 2000
                }
            }
        });
    }

    processAwardsData() {
        if (!this.allData || !this.allData.awards || this.allData.awards.length === 0) {
            return {
                labels: ['暂无数据'],
                values: [1]
            };
        }

        const awards = this.allData.awards;
        const counts = {
            gold: 0,
            silver: 0,
            bronze: 0,
            other: 0
        };

        awards.forEach(award => {
            const level = award.level || 'other';
            counts[level] = (counts[level] || 0) + 1;
        });

        const labels = [];
        const values = [];

        if (counts.gold > 0) {
            labels.push('金奖');
            values.push(counts.gold);
        }
        if (counts.silver > 0) {
            labels.push('银奖');
            values.push(counts.silver);
        }
        if (counts.bronze > 0) {
            labels.push('铜奖');
            values.push(counts.bronze);
        }
        if (counts.other > 0) {
            labels.push('其他');
            values.push(counts.other);
        }

        return { labels, values };
    }

    // 更新图表数据
    updateChartsData(newData) {
        this.allData = newData;

        if (this.charts.awards) {
            const awardsData = this.processAwardsData();
            this.charts.awards.data.labels = awardsData.labels;
            this.charts.awards.data.datasets[0].data = awardsData.values;
            this.charts.awards.update();
        }
    }

    // 销毁所有图表
    destroyCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};
    }

    getDefaultSkillsData() {
        return {
            frontend: {
                title: '前端技术',
                skills: [
                    { name: 'React', level: 95 },
                    { name: 'Vue.js', level: 90 },
                    { name: 'JavaScript', level: 98 }
                ]
            },
            backend: {
                title: '后端技术',
                skills: [
                    { name: 'Node.js', level: 88 },
                    { name: 'Python', level: 85 }
                ]
            }
        };
    }
}