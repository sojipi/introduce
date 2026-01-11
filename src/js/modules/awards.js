export class AwardsManager {
    constructor() {
        this.awards = [];
        this.isLoaded = false;
        this.isLoading = false;
    }

    async init() {
        if (this.isLoading || this.isLoaded) {
            return;
        }
        this.showLoadingState();
        await this.loadAwards();
        this.renderAwardsList();
    }

    async loadAwards() {
        if (this.isLoading || this.isLoaded) {
            return;
        }

        this.isLoading = true;

        try {
            console.log('🏆 Awards模块：获取获奖数据...');

            const response = await fetch('/api/frontend/awards');

            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    this.awards = result.data;
                    this.isLoaded = true;
                    console.log('✅ Awards模块：成功获取获奖数据', this.awards.length, '条');
                } else {
                    console.log('⚠️ Awards模块：API返回空数据');
                    this.awards = [];
                    this.isLoaded = true;
                }
            } else {
                console.log('⚠️ Awards模块：API请求失败');
                this.awards = [];
                this.isLoaded = true;
            }
        } catch (error) {
            console.log('⚠️ Awards模块：网络错误:', error.message);
            this.awards = [];
            this.isLoaded = true;
        } finally {
            this.isLoading = false;
        }
    }

    renderAwardsList() {
        const awardListContainer = document.querySelector('.award-list');
        if (!awardListContainer) {
            console.warn('Awards模块：找不到award-list容器');
            return;
        }

        // 隐藏loading状态
        this.hideLoadingState();

        // 清空现有内容
        awardListContainer.innerHTML = '';

        // 如果没有数据，显示提示信息
        if (!this.awards || this.awards.length === 0) {
            awardListContainer.innerHTML = `
                <div class="no-data-message">
                    <p>暂无获奖数据</p>
                </div>
            `;
            return;
        }

        // 渲染真实数据
        this.awards.slice(0, 6).forEach(award => {
            const awardElement = this.createAwardElement(award);
            awardListContainer.appendChild(awardElement);
        });

        console.log('✅ Awards模块：渲染完成', this.awards.length, '条获奖记录');
    }

    createAwardElement(award) {
        const awardItem = document.createElement('div');
        awardItem.className = 'award-item';

        const iconClass = this.getAwardIconClass(award.type);
        const iconType = this.getAwardIconType(award.type);

        // 优先显示competition作为主标题，title作为副标题
        const mainTitle = award.competition || award.title || '未知比赛';
        const subTitle = award.title && award.competition ? award.title : '';

        awardItem.innerHTML = `
            <div class="award-icon ${iconClass}">
                <i class="fas ${iconType}"></i>
            </div>
            <div class="award-info">
                <h4>${mainTitle}</h4>
                ${subTitle ? `<h5 class="award-project">${subTitle}</h5>` : ''}
                <p>${this.getLevelText(award.type)} - ${this.formatDate(award.date)}</p>
                <span class="award-tech">${this.formatTechnologies(award.technologies)}</span>
            </div>
        `;

        return awardItem;
    }

    getAwardIconClass(level) {
        const levelMap = {
            'gold': 'gold',
            'silver': 'silver',
            'bronze': 'bronze',
            'first': 'gold',
            'second': 'silver',
            'third': 'bronze'
        };
        return levelMap[level] || 'bronze';
    }

    getAwardIconType(level) {
        const iconMap = {
            'gold': 'fa-trophy',
            'silver': 'fa-medal',
            'bronze': 'fa-award',
            'first': 'fa-trophy',
            'second': 'fa-medal',
            'third': 'fa-award'
        };
        return iconMap[level] || 'fa-award';
    }

    getLevelText(level) {
        const levelMap = {
            'gold': '金奖',
            'silver': '银奖',
            'bronze': '铜奖',
            'first': '一等奖',
            'second': '二等奖',
            'third': '三等奖'
        };
        return levelMap[level] || '获奖';
    }

    formatDate(dateStr) {
        if (!dateStr) return '未知年份';

        try {
            const date = new Date(dateStr);
            return date.getFullYear() + '年';
        } catch (error) {
            return '未知年份';
        }
    }

    formatTechnologies(technologies) {
        if (!technologies) return '技术应用';

        if (Array.isArray(technologies)) {
            return technologies.join(' | ');
        }

        if (typeof technologies === 'string') {
            return technologies;
        }

        return '技术应用';
    }

    // 获取统计数据
    getStats() {
        return {
            total: this.awards.length,
            byLevel: this.getAwardsByLevel()
        };
    }

    getAwardsByLevel() {
        const counts = {
            gold: 0,
            silver: 0,
            bronze: 0,
            other: 0
        };

        this.awards.forEach(award => {
            const type = award.type || 'other';
            if (type === 'first') {
                counts.gold++;
            } else if (type === 'second') {
                counts.silver++;
            } else if (type === 'third') {
                counts.bronze++;
            } else if (counts[type] !== undefined) {
                counts[type]++;
            } else {
                counts.other++;
            }
        });

        return counts;
    }

    // 显示加载状态
    showLoadingState() {
        const awardListContainer = document.querySelector('.award-list');
        if (!awardListContainer) {
            return;
        }

        awardListContainer.innerHTML = `
            <div class="section-loading">
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <p>正在加载获奖数据...</p>
                </div>
            </div>
        `;
    }

    // 隐藏加载状态
    hideLoadingState() {
        const awardListContainer = document.querySelector('.award-list');
        if (!awardListContainer) {
            return;
        }

        const loadingElement = awardListContainer.querySelector('.section-loading');
        if (loadingElement) {
            loadingElement.remove();
        }
    }
}