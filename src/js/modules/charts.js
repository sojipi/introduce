export class ChartManager {
    constructor() {
        this.charts = {};
        this.init();
    }

    init() {
        this.createAwardsChart();
        this.setupChartAnimations();
    }

    createAwardsChart() {
        const canvas = document.getElementById('awards-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // 获奖数据
        const awardsData = {
            labels: ['金奖', '银奖', '铜奖', '优秀奖', '参与奖'],
            datasets: [{
                label: '获奖数量',
                data: [3, 2, 4, 6, 3],
                backgroundColor: [
                    'rgba(255, 215, 0, 0.8)',      // 金色
                    'rgba(192, 192, 192, 0.8)',    // 银色
                    'rgba(205, 127, 50, 0.8)',     // 铜色
                    'rgba(0, 212, 255, 0.8)',      // 蓝色
                    'rgba(76, 175, 80, 0.8)'       // 绿色
                ],
                borderColor: [
                    'rgba(255, 215, 0, 1)',
                    'rgba(192, 192, 192, 1)',
                    'rgba(205, 127, 50, 1)',
                    'rgba(0, 212, 255, 1)',
                    'rgba(76, 175, 80, 1)'
                ],
                borderWidth: 2,
                hoverOffset: 10
            }]
        };

        const config = {
            type: 'doughnut',
            data: awardsData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#ffffff',
                            font: {
                                size: 12
                            },
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#00d4ff',
                        borderWidth: 1,
                        callbacks: {
                            label: function (context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 2000,
                    easing: 'easeOutCubic'
                },
                elements: {
                    arc: {
                        borderWidth: 2
                    }
                }
            }
        };

        this.charts.awards = new Chart(ctx, config);

        // 添加点击事件
        canvas.addEventListener('click', (event) => {
            const points = this.charts.awards.getElementsAtEventForMode(
                event, 'nearest', { intersect: true }, true
            );

            if (points.length) {
                const firstPoint = points[0];
                const label = this.charts.awards.data.labels[firstPoint.index];
                const value = this.charts.awards.data.datasets[firstPoint.datasetIndex].data[firstPoint.index];

                this.showAwardDetails(label, value);
            }
        });
    }

    showAwardDetails(awardType, count) {
        // 创建详情弹窗
        const modal = document.createElement('div');
        modal.className = 'award-details-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
            padding: 2rem;
            border-radius: 15px;
            color: white;
            text-align: center;
            border: 1px solid rgba(0, 212, 255, 0.3);
            transform: scale(0.8);
            transition: transform 0.3s ease;
        `;

        const awardDetails = this.getAwardDetails(awardType);

        content.innerHTML = `
            <div style="font-size: 3rem; margin-bottom: 1rem;">${awardDetails.icon}</div>
            <h3 style="color: #00d4ff; margin-bottom: 1rem;">${awardType}</h3>
            <p style="font-size: 2rem; font-weight: bold; margin-bottom: 1rem; color: ${awardDetails.color};">${count} 个</p>
            <div style="margin-bottom: 1.5rem;">
                ${awardDetails.competitions.map(comp =>
            `<div style="margin: 0.5rem 0; padding: 0.5rem; background: rgba(255,255,255,0.1); border-radius: 8px;">
                        ${comp}
                    </div>`
        ).join('')}
            </div>
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; padding: 10px 20px; border-radius: 25px; cursor: pointer;">
                关闭
            </button>
        `;

        modal.appendChild(content);
        document.body.appendChild(modal);

        // 显示动画
        setTimeout(() => {
            modal.style.opacity = '1';
            content.style.transform = 'scale(1)';
        }, 10);

        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    getAwardDetails(awardType) {
        const details = {
            '金奖': {
                icon: '🏆',
                color: '#ffd700',
                competitions: [
                    '全国大学生程序设计竞赛 - 2023年',
                    'ACM-ICPC国际赛 - 2023年',
                    '谷歌编程挑战赛 - 2024年'
                ]
            },
            '银奖': {
                icon: '🥈',
                color: '#c0c0c0',
                competitions: [
                    '互联网+创新创业大赛 - 2023年',
                    '全国软件设计大赛 - 2024年'
                ]
            },
            '铜奖': {
                icon: '🥉',
                color: '#cd7f32',
                competitions: [
                    '蓝桥杯软件设计大赛 - 2022年',
                    'Hackathon黑客马拉松 - 2023年',
                    'AI创新应用大赛 - 2023年',
                    '开源贡献者大会 - 2024年'
                ]
            },
            '优秀奖': {
                icon: '🎖️',
                color: '#00d4ff',
                competitions: [
                    '数学建模竞赛 - 2022年',
                    '创新创业训练计划 - 2023年',
                    '计算机设计大赛 - 2023年',
                    '电子设计竞赛 - 2024年',
                    '网络安全竞赛 - 2024年',
                    '数据挖掘竞赛 - 2024年'
                ]
            },
            '参与奖': {
                icon: '🏅',
                color: '#4caf50',
                competitions: [
                    '区域编程竞赛 - 2022年',
                    '校际算法竞赛 - 2023年',
                    '技术分享大会 - 2024年'
                ]
            }
        };

        return details[awardType] || {
            icon: '🏅',
            color: '#888888',
            competitions: ['暂无详细信息']
        };
    }

    setupChartAnimations() {
        // 图表进入视口时的动画
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const chartId = entry.target.id;
                    if (this.charts[chartId.replace('-chart', '')]) {
                        this.animateChart(chartId.replace('-chart', ''));
                    }
                }
            });
        }, { threshold: 0.5 });

        // 观察所有图表
        Object.keys(this.charts).forEach(chartKey => {
            const canvas = document.getElementById(`${chartKey}-chart`);
            if (canvas) {
                observer.observe(canvas);
            }
        });
    }

    animateChart(chartKey) {
        const chart = this.charts[chartKey];
        if (!chart) return;

        // 重新播放动画
        chart.reset();
        chart.update('active');
    }

    // 创建技能雷达图
    createSkillsRadarChart(canvasId, skillsData) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        const config = {
            type: 'radar',
            data: {
                labels: skillsData.labels,
                datasets: [{
                    label: '技能水平',
                    data: skillsData.values,
                    backgroundColor: 'rgba(0, 212, 255, 0.2)',
                    borderColor: 'rgba(0, 212, 255, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(0, 212, 255, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(0, 212, 255, 1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            color: '#888888',
                            backdropColor: 'transparent'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        angleLines: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        pointLabels: {
                            color: '#ffffff',
                            font: {
                                size: 12
                            }
                        }
                    }
                },
                animation: {
                    duration: 2000,
                    easing: 'easeOutCubic'
                }
            }
        };

        this.charts[canvasId.replace('-chart', '')] = new Chart(ctx, config);
    }

    // 创建时间线图表
    createTimelineChart(canvasId, timelineData) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        const config = {
            type: 'line',
            data: {
                labels: timelineData.dates,
                datasets: [{
                    label: '参赛活动',
                    data: timelineData.activities,
                    backgroundColor: 'rgba(0, 212, 255, 0.1)',
                    borderColor: 'rgba(0, 212, 255, 1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: 'rgba(0, 212, 255, 1)',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#00d4ff',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#888888'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
                        ticks: {
                            color: '#888888'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                },
                animation: {
                    duration: 2000,
                    easing: 'easeOutCubic'
                }
            }
        };

        this.charts[canvasId.replace('-chart', '')] = new Chart(ctx, config);
    }

    // 更新图表数据
    updateChartData(chartKey, newData) {
        const chart = this.charts[chartKey];
        if (!chart) return;

        chart.data = newData;
        chart.update('active');
    }

    // 销毁图表
    destroyChart(chartKey) {
        const chart = this.charts[chartKey];
        if (chart) {
            chart.destroy();
            delete this.charts[chartKey];
        }
    }

    // 导出图表为图片
    exportChart(chartKey, filename = 'chart.png') {
        const chart = this.charts[chartKey];
        if (!chart) return;

        const url = chart.toBase64Image();
        const link = document.createElement('a');
        link.download = filename;
        link.href = url;
        link.click();
    }
}