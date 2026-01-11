export class TimelineManager {
    constructor() {
        this.timeline = [];
        this.allData = null;
        this.isLoaded = false;
        // 不在构造函数中调用init，改为懒加载
    }

    async init() {
        if (this.isLoaded) {
            console.log('✅ 时间线数据已加载，跳过重复加载');
            return;
        }

        await this.loadAllData();
        this.renderTimeline();
        this.isLoaded = true;
    }

    // 从分段接口获取时间线数据
    async loadAllData() {
        try {
            console.log('🔄 时间线模块：从分段接口获取数据...');

            const response = await fetch('/api/frontend/timeline');
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    console.log('✅ 时间线模块：成功获取数据');
                    this.timeline = data.data;

                    // 将时间线数据存储到全局
                    if (!window.showcaseData) {
                        window.showcaseData = {};
                    }
                    window.showcaseData.timeline = data.data;
                } else {
                    console.warn('时间线模块：API返回数据格式错误');
                    this.timeline = this.getDefaultTimelineData();
                }
            } else {
                console.warn('时间线模块：API请求失败，状态码:', response.status);
                this.timeline = this.getDefaultTimelineData();
            }
        } catch (error) {
            console.warn('时间线模块：加载数据失败，使用默认数据:', error);
            this.timeline = this.getDefaultTimelineData();
        }
    }

    renderTimeline() {
        const container = document.querySelector('.timeline-items');
        if (!container) return;

        container.innerHTML = '';

        this.timeline.forEach((item, index) => {
            const timelineItem = this.createTimelineItem(item, index);
            container.appendChild(timelineItem);
        });

        // 添加动画
        this.animateTimelineItems();
    }

    createTimelineItem(item, index) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'timeline-item';
        itemDiv.style.opacity = '0';
        itemDiv.style.transform = 'translateY(30px)';

        const statusClass = this.getStatusClass(item.status);
        const statusText = this.getStatusText(item.status);

        itemDiv.innerHTML = `
            <div class="timeline-dot"></div>
            <div class="timeline-content">
                <div class="timeline-date">${this.formatDate(item.date)}</div>
                <h4>${item.title}</h4>
                <p>${item.description || '暂无描述'}</p>
                <span class="timeline-status ${statusClass}">${statusText}</span>
            </div>
        `;

        return itemDiv;
    }

    getStatusClass(status) {
        const statusMap = {
            completed: 'completed',
            ongoing: 'ongoing',
            upcoming: 'upcoming'
        };
        return statusMap[status] || 'upcoming';
    }

    getStatusText(status) {
        const statusMap = {
            completed: '已完成',
            ongoing: '进行中',
            upcoming: '即将开始'
        };
        return statusMap[status] || '即将开始';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    animateTimelineItems() {
        const items = document.querySelectorAll('.timeline-item');

        items.forEach((item, index) => {
            setTimeout(() => {
                item.style.transition = 'all 0.6s ease';
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, index * 200);
        });
    }

    getDefaultTimelineData() {
        return [
            {
                id: '1',
                date: '2024-03-15',
                title: 'ACM程序设计竞赛',
                description: '参加区域性程序设计竞赛，展示算法和编程能力',
                status: 'upcoming',
                type: 'competition'
            },
            {
                id: '2',
                date: '2023-11-20',
                title: '互联网+创业大赛决赛',
                description: '项目成功进入全国决赛阶段，获得银奖',
                status: 'completed',
                type: 'competition'
            },
            {
                id: '3',
                date: '2023-09-10',
                title: '技术分享会',
                description: '在学校举办前端技术分享会，分享React最佳实践',
                status: 'completed',
                type: 'event'
            },
            {
                id: '4',
                date: '2023-06-15',
                title: '蓝桥杯软件设计大赛',
                description: '参加蓝桥杯Java组比赛，获得省级一等奖',
                status: 'completed',
                type: 'competition'
            }
        ];
    }

    // 获取时间线数据
    getTimelineData() {
        return this.timeline;
    }

    // 添加新的时间线事件
    addTimelineItem(item) {
        this.timeline.unshift(item);
        this.renderTimeline();
    }

    // 更新时间线事件状态
    updateTimelineStatus(id, status) {
        const item = this.timeline.find(t => t.id === id);
        if (item) {
            item.status = status;
            this.renderTimeline();
        }
    }
}