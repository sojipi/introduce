export class SkillsManager {
    constructor() {
        this.allData = null; // 存储从统一接口获取的所有数据
        this.skills = {};
        this.isLoaded = false;
        // 不在构造函数中调用init，改为懒加载
    }

    async init() {
        if (this.isLoaded) {
            console.log('✅ 技能数据已加载，跳过重复加载');
            return;
        }

        await this.loadAllData();
        this.renderSkills();
        this.setupSkillAnimations();
        this.isLoaded = true;
    }

    // 从分段接口加载技能数据
    async loadAllData() {
        try {
            console.log('🔄 从分段接口加载技能数据...');
            const response = await fetch('/api/frontend/skills');
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    console.log('✅ 成功获取技能数据');
                    this.skills = data.data;

                    // 将技能数据存储到全局，供其他模块使用
                    if (!window.showcaseData) {
                        window.showcaseData = {};
                    }
                    window.showcaseData.skills = data.data;

                    if (data.fallback) {
                        console.log('⚠️ 使用默认数据');
                    }
                } else {
                    console.warn('API返回数据格式错误');
                    this.loadFallbackData();
                }
            } else {
                console.warn('API请求失败，状态码:', response.status);
                this.loadFallbackData();
            }
        } catch (error) {
            console.warn('无法从API加载数据，使用静态数据:', error);
            this.loadFallbackData();
        }
    }

    // 更新页面统计数据
    updateStats(stats) {
        if (!stats) return;

        // 更新英雄区域的统计数字
        const skillsCountEl = document.querySelector('[data-count="15"]');
        const projectsCountEl = document.querySelector('[data-count="8"]');
        const experienceCountEl = document.querySelector('[data-count="12"]');

        if (skillsCountEl) {
            skillsCountEl.setAttribute('data-count', stats.skillsCount || 15);
        }
        if (projectsCountEl) {
            projectsCountEl.setAttribute('data-count', stats.projectsCount || 8);
        }
        if (experienceCountEl) {
            experienceCountEl.setAttribute('data-count', stats.awardsCount || 12);
        }
    }

    // 备用静态数据
    loadFallbackData() {
        console.log('📦 使用备用技能数据');
        this.skills = this.getStaticSkillsData();
    }

    getStaticSkillsData() {
        return {
            frontend: {
                title: '前端技术',
                skills: [
                    {
                        name: 'React',
                        icon: 'fab fa-react',
                        level: 95,
                        color: '#61DAFB'
                    },
                    {
                        name: 'Vue.js',
                        icon: 'fab fa-vuejs',
                        level: 90,
                        color: '#4FC08D'
                    },
                    {
                        name: 'JavaScript',
                        icon: 'fab fa-js',
                        level: 98,
                        color: '#F7DF1E'
                    },
                    {
                        name: 'TypeScript',
                        icon: 'fab fa-js-square',
                        level: 88,
                        color: '#3178C6'
                    },
                    {
                        name: 'CSS3/SCSS',
                        icon: 'fab fa-css3',
                        level: 95,
                        color: '#1572B6'
                    },
                    {
                        name: 'HTML5',
                        icon: 'fab fa-html5',
                        level: 98,
                        color: '#E34F26'
                    }
                ]
            },
            backend: {
                title: '后端技术',
                skills: [
                    {
                        name: 'Node.js',
                        icon: 'fab fa-node-js',
                        level: 88,
                        color: '#339933'
                    },
                    {
                        name: 'Python',
                        icon: 'fab fa-python',
                        level: 85,
                        color: '#3776AB'
                    },
                    {
                        name: 'Java',
                        icon: 'fab fa-java',
                        level: 82,
                        color: '#ED8B00'
                    },
                    {
                        name: 'Express',
                        icon: 'fas fa-server',
                        level: 90,
                        color: '#000000'
                    },
                    {
                        name: 'MongoDB',
                        icon: 'fas fa-database',
                        level: 80,
                        color: '#47A248'
                    },
                    {
                        name: 'PostgreSQL',
                        icon: 'fas fa-database',
                        level: 75,
                        color: '#336791'
                    }
                ]
            },
            tools: {
                title: '开发工具',
                skills: [
                    {
                        name: 'Git',
                        icon: 'fab fa-git-alt',
                        level: 92,
                        color: '#F05032'
                    },
                    {
                        name: 'Docker',
                        icon: 'fab fa-docker',
                        level: 78,
                        color: '#2496ED'
                    },
                    {
                        name: 'AWS',
                        icon: 'fab fa-aws',
                        level: 70,
                        color: '#FF9900'
                    },
                    {
                        name: 'Webpack',
                        icon: 'fas fa-cube',
                        level: 85,
                        color: '#8DD6F9'
                    },
                    {
                        name: 'Vite',
                        icon: 'fas fa-bolt',
                        level: 88,
                        color: '#646CFF'
                    }
                ]
            },
            mobile: {
                title: '移动开发',
                skills: [
                    {
                        name: 'React Native',
                        icon: 'fab fa-react',
                        level: 80,
                        color: '#61DAFB'
                    },
                    {
                        name: 'Flutter',
                        icon: 'fas fa-mobile-alt',
                        level: 75,
                        color: '#02569B'
                    },
                    {
                        name: 'Ionic',
                        icon: 'fas fa-mobile',
                        level: 70,
                        color: '#3880FF'
                    }
                ]
            }
        };
    }

    renderSkills() {
        const skillsGrid = document.querySelector('.skills-grid');
        if (!skillsGrid) return;

        // 清空现有内容
        skillsGrid.innerHTML = '';

        // 渲染每个技能分类
        Object.entries(this.skills).forEach(([categoryKey, category], index) => {
            const categoryElement = this.createSkillCategory(category, index);
            skillsGrid.appendChild(categoryElement);
        });
    }

    createSkillCategory(category, index) {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'skill-category';
        categoryDiv.setAttribute('data-aos', index % 2 === 0 ? 'fade-right' : 'fade-left');

        const skillsHTML = category.skills.map(skill => `
            <div class="skill-item" data-skill-level="${skill.level}">
                <i class="${skill.icon}" style="color: ${skill.color}"></i>
                <span class="skill-name">${skill.name}</span>
                <div class="skill-bar">
                    <div class="skill-progress" 
                         data-width="${skill.level}%" 
                         style="--skill-color: ${skill.color}"></div>
                </div>
                <span class="skill-percentage">${skill.level}%</span>
            </div>
        `).join('');

        categoryDiv.innerHTML = `
            <h3>${category.title}</h3>
            <div class="skill-items">
                ${skillsHTML}
            </div>
        `;

        return categoryDiv;
    }

    setupSkillAnimations() {
        const skillBars = document.querySelectorAll('.skill-progress');
        const observerOptions = {
            threshold: 0.5,
            rootMargin: '0px 0px -100px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const bar = entry.target;
                    const width = bar.getAttribute('data-width');

                    setTimeout(() => {
                        bar.style.width = width;

                        // 添加数字动画
                        const skillItem = bar.closest('.skill-item');
                        const percentage = skillItem.querySelector('.skill-percentage');
                        const targetValue = parseInt(width);

                        this.animateNumber(percentage, 0, targetValue, 1000);
                    }, 200);

                    observer.unobserve(bar);
                }
            });
        }, observerOptions);

        skillBars.forEach(bar => observer.observe(bar));
    }

    animateNumber(element, start, end, duration) {
        const startTime = performance.now();

        const updateNumber = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const current = Math.floor(start + (end - start) * progress);
            element.textContent = current + '%';

            if (progress < 1) {
                requestAnimationFrame(updateNumber);
            }
        };

        requestAnimationFrame(updateNumber);
    }

    // 添加新技能的方法
    async addSkill(category, skillData) {
        try {
            const response = await fetch('/api/skills', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    category,
                    skill: skillData
                })
            });

            if (response.ok) {
                // 更新本地数据
                if (!this.skills[category]) {
                    this.skills[category] = { title: category, skills: [] };
                }
                this.skills[category].skills.push(skillData);

                // 重新渲染
                this.renderSkills();
                this.setupSkillAnimations();

                return { success: true };
            } else {
                throw new Error('添加技能失败');
            }
        } catch (error) {
            console.error('添加技能时出错:', error);
            return { success: false, error: error.message };
        }
    }

    // 更新技能等级的方法
    async updateSkillLevel(category, skillName, newLevel) {
        try {
            const response = await fetch('/api/skills/update', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    category,
                    skillName,
                    level: newLevel
                })
            });

            if (response.ok) {
                // 更新本地数据
                const skill = this.skills[category]?.skills.find(s => s.name === skillName);
                if (skill) {
                    skill.level = newLevel;

                    // 重新渲染
                    this.renderSkills();
                    this.setupSkillAnimations();
                }

                return { success: true };
            } else {
                throw new Error('更新技能失败');
            }
        } catch (error) {
            console.error('更新技能时出错:', error);
            return { success: false, error: error.message };
        }
    }

    // 删除技能的方法
    async removeSkill(category, skillName) {
        try {
            const response = await fetch('/api/skills/remove', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    category,
                    skillName
                })
            });

            if (response.ok) {
                // 更新本地数据
                if (this.skills[category]) {
                    this.skills[category].skills = this.skills[category].skills.filter(
                        s => s.name !== skillName
                    );

                    // 重新渲染
                    this.renderSkills();
                    this.setupSkillAnimations();
                }

                return { success: true };
            } else {
                throw new Error('删除技能失败');
            }
        } catch (error) {
            console.error('删除技能时出错:', error);
            return { success: false, error: error.message };
        }
    }

    // 获取所有技能数据
    getAllSkills() {
        return this.skills;
    }

    // 获取特定分类的技能
    getSkillsByCategory(category) {
        return this.skills[category] || null;
    }
}