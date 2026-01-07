export class TimelineManager {
    constructor() {
        this.timelineData = this.getTimelineData();
        this.init();
    }

    init() {
        this.renderTimeline();
        this.setupScrollAnimation();
    }

    getTimelineData() {
        return [
            {
                date: '2024年3月',
                title: '全国大学生程序设计竞赛',
                description: '算法优化和数据结构设计竞赛，获得金奖',
                status: 'completed',
                type: 'award'
            },
            {
                date: '2024年5月',
                title: '互联网+创新创业大赛',
                description: '全栈开发项目展示，商业模式创新',
                status: 'completed',
                type: 'award'
            },
            {
                date: '2024年7月',
                title: 'Google Summer of Code',
                description: '参与开源项目开发，贡献核心功能模块',
                status: 'completed',
                type: 'project'
            },
            {
                date: '2024年9月',
                title: 'ACM-ICPC区域赛',
                description: '国际大学生程序设计竞赛区域选拔赛',
                status: 'completed',
                type: 'competition'
            },
            {
                date: '2024年11月',
                title: '蓝桥杯软件设计大赛',
                description: 'Java开发和算法设计竞赛，获得一等奖',
                status: 'completed',
                type: 'award'
            },
            {
                date: '2024年12月',
                title: 'Hackathon黑客马拉松',
                description: '48小时创新开发挑战，团队协作项目',
                status: 'ongoing',
                type: 'competition'
            },
            {
                date: '2025年2月',
                title: '全国软件设计大赛',
                description: '软件工程和系统设计竞赛报名准备中',
                status: 'upcoming',
                type: 'competition'
            },
            {
                date: '2025年4月',
                title: 'AI创新应用大赛',
                description: '人工智能和机器学习应用开发竞赛',
                status: 'upcoming',
                type: 'competition'
            },
            {
                date: '2025年6月',
                title: '开源贡献者大会',
                description: '开源项目展示和技术分享',
                status: 'upcoming',
                type: 'project'
            },
            {
                date: '2025年8月',
                title: '国际编程竞赛',
                description: '世界级编程竞赛，算法和数据结构挑战',
                status: 'upcoming',
                type: 'competition'
            }
        ];
    }

    renderTimeline() {
        const timelineContainer = document.querySelector('.timeline-items');

        this.timelineData.forEach((item, index) => {
            const timelineItem = this.createTimelineItem(item, index);
            timelineContainer.appendChild(timelineItem);
        });
    }

    createTimelineItem(item, index) {
        const timelineItem = document.createElement('div');
        timelineItem.className = 'timeline-item';
        timelineItem.setAttribute('data-aos', index % 2 === 0 ? 'fade-right' : 'fade-left');
        timelineItem.setAttribute('data-aos-delay', (index * 100).toString());

        // 获取状态样式
        const statusConfig = this.getStatusConfig(item.status);
        const typeIcon = this.getTypeIcon(item.type);

        timelineItem.innerHTML = `
            <div class="timeline-dot" style="background: ${statusConfig.color};">
                <i class="${typeIcon}" style="font-size: 0.8rem;"></i>
            </div>
            <div class="timeline-content">
                <div class="timeline-date">${item.date}</div>
                <h4>${item.title}</h4>
                <p>${item.description}</p>
                <span class="timeline-status ${item.status}">${statusConfig.text}</span>
            </div>
        `;

        // 添加悬停效果
        timelineItem.addEventListener('mouseenter', () => {
            timelineItem.style.transform = 'scale(1.02)';
            timelineItem.style.transition = 'transform 0.3s ease';
        });

        timelineItem.addEventListener('mouseleave', () => {
            timelineItem.style.transform = 'scale(1)';
        });

        return timelineItem;
    }

    getStatusConfig(status) {
        const configs = {
            completed: {
                text: '已完成',
                color: '#4caf50'
            },
            ongoing: {
                text: '进行中',
                color: '#ffc107'
            },
            upcoming: {
                text: '即将开始',
                color: '#2196f3'
            }
        };
        return configs[status] || configs.upcoming;
    }

    getTypeIcon(type) {
        const icons = {
            award: 'fas fa-trophy',
            competition: 'fas fa-medal',
            project: 'fas fa-code'
        };
        return icons[type] || 'fas fa-calendar';
    }

    setupScrollAnimation() {
        // 时间线滚动动画
        const timelineLine = document.querySelector('.timeline-line');
        const timelineItems = document.querySelectorAll('.timeline-item');

        const animateTimeline = () => {
            const scrollTop = window.pageYOffset;
            const windowHeight = window.innerHeight;
            const timelineTop = document.querySelector('.timeline').offsetTop;

            // 计算时间线可见程度
            const timelineProgress = Math.max(0, Math.min(1,
                (scrollTop + windowHeight - timelineTop) /
                (document.querySelector('.timeline').offsetHeight)
            ));

            // 更新时间线长度
            if (timelineLine) {
                timelineLine.style.height = `${timelineProgress * 100}%`;
            }

            // 激活可见的时间线项目
            timelineItems.forEach((item, index) => {
                const itemTop = item.offsetTop;
                const itemProgress = (scrollTop + windowHeight - itemTop) / windowHeight;

                if (itemProgress > 0.5) {
                    item.classList.add('active');

                    // 添加计数动画
                    const dot = item.querySelector('.timeline-dot');
                    if (dot && !dot.classList.contains('animated')) {
                        dot.classList.add('animated');
                        dot.style.animation = 'pulse 0.6s ease';
                    }
                }
            });
        };

        // 节流滚动事件
        let ticking = false;
        const handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    animateTimeline();
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', handleScroll);

        // 初始调用
        animateTimeline();
    }

    // 添加筛选功能
    filterByStatus(status) {
        const items = document.querySelectorAll('.timeline-item');

        items.forEach(item => {
            const itemStatus = item.querySelector('.timeline-status').classList;

            if (status === 'all' || itemStatus.contains(status)) {
                item.style.display = 'flex';
                item.style.opacity = '1';
            } else {
                item.style.opacity = '0.3';
            }
        });
    }

    // 添加搜索功能
    searchTimeline(query) {
        const items = document.querySelectorAll('.timeline-item');
        const searchTerm = query.toLowerCase();

        items.forEach(item => {
            const title = item.querySelector('h4').textContent.toLowerCase();
            const description = item.querySelector('p').textContent.toLowerCase();

            if (title.includes(searchTerm) || description.includes(searchTerm)) {
                item.style.display = 'flex';
                item.style.opacity = '1';
            } else {
                item.style.opacity = '0.3';
            }
        });
    }

    // 导出时间线数据
    exportTimeline() {
        const data = {
            timeline: this.timelineData,
            exportDate: new Date().toISOString(),
            totalEvents: this.timelineData.length,
            completedEvents: this.timelineData.filter(item => item.status === 'completed').length,
            upcomingEvents: this.timelineData.filter(item => item.status === 'upcoming').length
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'timeline-data.json';
        a.click();

        URL.revokeObjectURL(url);
    }
}