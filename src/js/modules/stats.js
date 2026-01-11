export class StatsManager {
    constructor() {
        this.stats = {
            skillsCount: 15,
            projectsCount: 8,
            awardsCount: 12,
            avgSkillLevel: 85
        };
        this.allData = null;
        this.init();
    }

    async init() {
        await this.loadAllData();
        this.updateStatsDisplay();
    }

    // 从统一接口或缓存获取数据
    async loadAllData() {
        try {
            console.log('🔄 统计模块：获取数据...');

            // 检查是否已有缓存数据
            if (window.skillsManager && window.skillsManager.allData) {
                console.log('✅ 统计模块：使用已缓存的数据');
                this.allData = window.skillsManager.allData;
                this.stats = this.allData.stats;
                return;
            }

            // 如果没有缓存数据，使用默认统计
            console.log('📦 统计模块：使用默认统计数据');
            this.stats = {
                skillsCount: 15,
                projectsCount: 8,
                awardsCount: 12,
                avgSkillLevel: 85
            };
        } catch (error) {
            console.warn('统计模块：加载数据失败，使用默认数据:', error);
        }
    }

    updateStatsDisplay() {
        // 更新英雄区域的统计数字
        this.updateStatElement('[data-count="15"]', this.stats.skillsCount);
        this.updateStatElement('[data-count="8"]', this.stats.projectsCount);
        this.updateStatElement('[data-count="12"]', this.stats.awardsCount);
    }

    updateStatElement(selector, value) {
        const element = document.querySelector(selector);
        if (element) {
            element.setAttribute('data-count', value);
            // 如果元素已经显示，立即更新文本
            if (element.textContent !== '0') {
                element.textContent = value;
            }
        }
    }

    // 获取当前统计数据
    getStats() {
        return { ...this.stats };
    }

    // 更新统计数据
    updateStats(newStats) {
        this.stats = { ...this.stats, ...newStats };
        this.updateStatsDisplay();
    }

    // 计算技能平均等级
    calculateSkillsAverage(skills) {
        let totalSkills = 0;
        let totalLevel = 0;

        Object.values(skills).forEach(category => {
            if (category.skills) {
                totalSkills += category.skills.length;
                category.skills.forEach(skill => {
                    totalLevel += skill.level || 0;
                });
            }
        });

        return totalSkills > 0 ? Math.round(totalLevel / totalSkills) : 0;
    }

    // 计算项目总数
    calculateProjectsCount(projects) {
        let count = 0;
        Object.values(projects).forEach(category => {
            if (Array.isArray(category)) {
                count += category.length;
            }
        });
        return count;
    }

    // 从数据重新计算统计信息
    recalculateStats(allData) {
        if (!allData) return;

        const newStats = {
            skillsCount: 0,
            projectsCount: 0,
            awardsCount: 0,
            avgSkillLevel: 0
        };

        // 计算技能统计
        if (allData.skills) {
            Object.values(allData.skills).forEach(category => {
                if (category.skills) {
                    newStats.skillsCount += category.skills.length;
                }
            });
            newStats.avgSkillLevel = this.calculateSkillsAverage(allData.skills);
        }

        // 计算项目统计
        if (allData.projects) {
            newStats.projectsCount = this.calculateProjectsCount(allData.projects);
        }

        // 计算获奖统计
        if (allData.awards && Array.isArray(allData.awards)) {
            newStats.awardsCount = allData.awards.length;
        }

        this.updateStats(newStats);
        return newStats;
    }
}