export class LazyLoader {
    constructor() {
        this.observers = new Map();
        this.loadedSections = new Set();
        this.loadingPromises = new Map();
        this.init();
    }

    init() {
        // 首先加载统计数据（轻量级）
        this.loadStats();

        // 设置Intersection Observer来监听各个区域
        this.setupObservers();
    }

    // 加载统计数据（页面加载时立即执行）
    async loadStats() {
        try {
            console.log('📊 加载统计数据...');
            const response = await fetch('/api/frontend/stats');
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.updateStatsDisplay(data.data);
                    console.log('✅ 统计数据加载完成');
                }
            }
        } catch (error) {
            console.warn('统计数据加载失败:', error);
        }
    }

    // 更新页面上的统计数字
    updateStatsDisplay(stats) {
        // 更新英雄区域的统计数字
        const statElements = {
            'stat-experience': stats.experienceYears,
            'stat-projects': stats.projectsCount,
            'stat-skills': stats.skillsCount,
            'stat-awards': stats.awardsCount
        };

        Object.entries(statElements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.setAttribute('data-count', value);
            }
        });

        // 触发数字动画
        this.animateCounters();
    }

    // 数字动画
    animateCounters() {
        const counters = document.querySelectorAll('.stat-number');
        counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-count'));
            let current = 0;
            const increment = target / 50;

            const updateCounter = () => {
                if (current < target) {
                    current += increment;
                    counter.textContent = Math.ceil(current);
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.textContent = target;
                }
            };

            updateCounter();
        });
    }

    // 设置各个区域的观察器
    setupObservers() {
        const sections = [
            { id: 'skills', selector: '#skills', loader: () => this.loadSkills() },
            { id: 'projects', selector: '#projects', loader: () => this.loadProjects() },
            { id: 'timeline', selector: '#timeline', loader: () => this.loadTimeline() },
            { id: 'competitions', selector: '#competitions', loader: () => this.loadAwards() },
            { id: 'skills-3d', selector: '.skills-3d', loader: () => this.loadSkills3D() }
        ];

        const observerOptions = {
            root: null,
            rootMargin: '100px', // 提前100px开始加载
            threshold: 0.1
        };

        sections.forEach(section => {
            const element = document.querySelector(section.selector);
            if (element) {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting && !this.loadedSections.has(section.id)) {
                            console.log(`👀 ${section.id} 区域进入视口，开始加载数据...`);
                            this.loadSection(section.id, section.loader);
                        }
                    });
                }, observerOptions);

                observer.observe(element);
                this.observers.set(section.id, observer);
            }
        });
    }

    // 加载指定区域的数据
    async loadSection(sectionId, loader) {
        if (this.loadedSections.has(sectionId)) {
            return;
        }

        // 防止重复加载
        if (this.loadingPromises.has(sectionId)) {
            return this.loadingPromises.get(sectionId);
        }

        const loadingPromise = this.executeLoader(sectionId, loader);
        this.loadingPromises.set(sectionId, loadingPromise);

        try {
            await loadingPromise;
            this.loadedSections.add(sectionId);
            console.log(`✅ ${sectionId} 区域数据加载完成`);
        } catch (error) {
            console.error(`❌ ${sectionId} 区域数据加载失败:`, error);
        } finally {
            this.loadingPromises.delete(sectionId);
        }
    }

    // 执行加载器并显示加载状态
    async executeLoader(sectionId, loader) {
        // 显示加载状态
        this.showLoadingState(sectionId);

        try {
            await loader();
            this.hideLoadingState(sectionId);
        } catch (error) {
            this.showErrorState(sectionId);
            throw error;
        }
    }

    // 显示加载状态
    showLoadingState(sectionId) {
        const section = document.querySelector(`#${sectionId}`);
        if (section) {
            // 添加加载中的样式
            section.classList.add('loading');

            // 可以添加骨架屏或加载动画
            const loadingElement = document.createElement('div');
            loadingElement.className = 'section-loading';
            loadingElement.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <p>正在加载${this.getSectionName(sectionId)}数据...</p>
                </div>
            `;
            section.appendChild(loadingElement);
        }
    }

    // 隐藏加载状态
    hideLoadingState(sectionId) {
        const section = document.querySelector(`#${sectionId}`);
        if (section) {
            section.classList.remove('loading');
            const loadingElement = section.querySelector('.section-loading');
            if (loadingElement) {
                loadingElement.remove();
            }
        }
    }

    // 显示错误状态
    showErrorState(sectionId) {
        const section = document.querySelector(`#${sectionId}`);
        if (section) {
            section.classList.remove('loading');
            section.classList.add('error');

            const loadingElement = section.querySelector('.section-loading');
            if (loadingElement) {
                loadingElement.innerHTML = `
                    <div class="loading-error">
                        <p>❌ ${this.getSectionName(sectionId)}数据加载失败</p>
                        <button onclick="window.lazyLoader.retryLoad('${sectionId}')">重试</button>
                    </div>
                `;
            }
        }
    }

    // 获取区域名称
    getSectionName(sectionId) {
        const names = {
            'skills': '技能',
            'projects': '项目',
            'timeline': '时间线',
            'competitions': '获奖',
            'skills-3d': '3D技能'
        };
        return names[sectionId] || sectionId;
    }

    // 重试加载
    async retryLoad(sectionId) {
        this.loadedSections.delete(sectionId);
        const section = document.querySelector(`#${sectionId}`);
        if (section) {
            section.classList.remove('error');
        }

        // 重新触发加载
        const loaders = {
            'skills': () => this.loadSkills(),
            'projects': () => this.loadProjects(),
            'timeline': () => this.loadTimeline(),
            'competitions': () => this.loadAwards(),
            'skills-3d': () => this.loadSkills3D()
        };

        if (loaders[sectionId]) {
            await this.loadSection(sectionId, loaders[sectionId]);
        }
    }

    // 各个区域的加载方法
    async loadSkills() {
        if (!window.skillsManager) {
            const { SkillsManager } = await import('./skills.js');
            window.skillsManager = new SkillsManager();
        }
        await window.skillsManager.init();
    }

    async loadProjects() {
        if (!window.projectShowcase) {
            const { ProjectShowcase } = await import('./projects.js');
            window.projectShowcase = new ProjectShowcase();
        }
        await window.projectShowcase.init();
    }

    async loadTimeline() {
        if (!window.timelineManager) {
            const { TimelineManager } = await import('./timeline.js');
            window.timelineManager = new TimelineManager();
        }
        await window.timelineManager.init();
    }

    async loadSkills3D() {
        // 3D技能依赖于技能数据，确保技能数据已加载
        await this.loadSkills();

        if (!window.skillsViz) {
            const { SkillsVisualization } = await import('./skills3d.js');
            window.skillsViz = new SkillsVisualization();
        }
        await window.skillsViz.init();
    }

    async loadAwards() {
        // 先加载 AwardsManager
        if (!window.awardsManager) {
            const { AwardsManager } = await import('./awards.js');
            window.awardsManager = new AwardsManager();
        }

        // 确保 awards 数据已加载完成
        await window.awardsManager.init();

        // 然后加载图表管理器，它会自动检测并使用 awardsManager 的数据
        if (!window.chartManager) {
            const { ChartManager } = await import('./charts.js');
            window.chartManager = new ChartManager();
        }

        // 如果图表管理器还没有初始化，手动初始化
        if (!window.chartManager.isLoaded) {
            await window.chartManager.init();
        }
    }

    // 预加载下一个区域（可选的性能优化）
    preloadNextSection() {
        // 可以根据用户滚动方向预加载下一个可能访问的区域
        // 这里可以实现更智能的预加载逻辑
    }

    // 清理资源
    destroy() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
        this.loadedSections.clear();
        this.loadingPromises.clear();
    }
}