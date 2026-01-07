// 主要功能模块
import { ParticleSystem } from './modules/particles.js';
import { SkillsVisualization } from './modules/skills3d.js';
import { ProjectShowcase } from './modules/projects.js';
import { TimelineManager } from './modules/timeline.js';
import { AnimationController } from './modules/animations.js';
import { ChartManager } from './modules/charts.js';

class TechShowcase {
    constructor() {
        this.init();
    }

    init() {
        // 等待DOM加载完成
        document.addEventListener('DOMContentLoaded', () => {
            this.waitForLibraries().then(() => {
                this.setupNavigation();
                this.initializeModules();
                this.setupEventListeners();
                this.startAnimations();
            }).catch(error => {
                console.warn('某些库加载失败，使用降级方案:', error);
                this.initializeFallback();
            });
        });
    }

    // 等待所有必要的库加载完成
    waitForLibraries() {
        return new Promise((resolve, reject) => {
            const checkLibraries = () => {
                const requiredLibs = {
                    'AOS': typeof AOS !== 'undefined',
                    'gsap': typeof gsap !== 'undefined',
                    'THREE': typeof THREE !== 'undefined',
                    'Chart': typeof Chart !== 'undefined'
                };

                const allLoaded = Object.values(requiredLibs).every(loaded => loaded);
                const particlesLoaded = typeof particlesJS !== 'undefined';

                if (allLoaded) {
                    resolve({ particlesLoaded });
                } else {
                    // 检查是否超时
                    if (Date.now() - startTime > 10000) {
                        reject(new Error('库加载超时'));
                    } else {
                        setTimeout(checkLibraries, 100);
                    }
                }
            };

            const startTime = Date.now();
            checkLibraries();
        });
    }

    // 降级方案
    initializeFallback() {
        this.setupNavigation();
        this.setupEventListeners();

        // 使用CSS动画替代JS动画
        document.body.classList.add('fallback-mode');

        // 简化的初始化
        this.animateCounters();
        this.animateSkillBars();
        this.setupContactForm();
        this.setupCTAButtons();
    }

    setupNavigation() {
        const navbar = document.getElementById('navbar');
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.querySelector('.nav-menu');

        // 滚动效果
        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });

        // 移动端菜单
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // 平滑滚动
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                const targetSection = document.querySelector(targetId);

                if (targetSection) {
                    targetSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }

                // 关闭移动端菜单
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }

    initializeModules() {
        // 初始化粒子系统
        this.particleSystem = new ParticleSystem();

        // 初始化3D技能可视化
        this.skillsViz = new SkillsVisualization();

        // 初始化项目展示
        this.projectShowcase = new ProjectShowcase();

        // 初始化时间线
        this.timelineManager = new TimelineManager();

        // 初始化动画控制器
        this.animationController = new AnimationController();

        // 初始化图表
        this.chartManager = new ChartManager();
    }

    setupEventListeners() {
        // 统计数字动画
        this.animateCounters();

        // 技能条动画
        this.animateSkillBars();

        // 表单提交
        this.setupContactForm();

        // CTA按钮事件
        this.setupCTAButtons();
    }

    animateCounters() {
        const counters = document.querySelectorAll('.stat-number');
        const observerOptions = {
            threshold: 0.5,
            rootMargin: '0px 0px -100px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const counter = entry.target;
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
                    observer.unobserve(counter);
                }
            });
        }, observerOptions);

        counters.forEach(counter => observer.observe(counter));
    }

    animateSkillBars() {
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
                    }, 200);

                    observer.unobserve(bar);
                }
            });
        }, observerOptions);

        skillBars.forEach(bar => observer.observe(bar));
    }

    setupContactForm() {
        const form = document.getElementById('contact-form');

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            // 模拟表单提交
            const button = form.querySelector('button');
            const originalText = button.textContent;

            button.textContent = '发送中...';
            button.disabled = true;

            setTimeout(() => {
                button.textContent = '发送成功!';
                form.reset();

                setTimeout(() => {
                    button.textContent = originalText;
                    button.disabled = false;
                }, 2000);
            }, 1500);
        });
    }

    setupCTAButtons() {
        const primaryCTA = document.querySelector('.cta-button.primary');
        const secondaryCTA = document.querySelector('.cta-button.secondary');

        primaryCTA.addEventListener('click', () => {
            document.getElementById('projects').scrollIntoView({
                behavior: 'smooth'
            });
        });

        secondaryCTA.addEventListener('click', () => {
            // 模拟下载简历
            const link = document.createElement('a');
            link.href = '#';
            link.download = 'resume.pdf';
            link.click();

            // 显示提示
            this.showNotification('简历下载已开始');
        });
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--gradient-accent);
            color: white;
            padding: 1rem 2rem;
            border-radius: 10px;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    startAnimations() {
        // 初始化AOS动画
        AOS.init({
            duration: 1000,
            once: true,
            offset: 100
        });

        // 启动打字机效果
        this.startTypingAnimation();
    }

    startTypingAnimation() {
        const typingElement = document.querySelector('.typing-text');
        const texts = [
            '全栈开发工程师',
            '技术创新者',
            '竞赛获奖者',
            '问题解决专家'
        ];

        let textIndex = 0;
        let charIndex = 0;
        let isDeleting = false;

        const typeSpeed = 100;
        const deleteSpeed = 50;
        const pauseTime = 2000;

        const type = () => {
            const currentText = texts[textIndex];

            if (isDeleting) {
                typingElement.textContent = currentText.substring(0, charIndex - 1);
                charIndex--;
            } else {
                typingElement.textContent = currentText.substring(0, charIndex + 1);
                charIndex++;
            }

            let speed = isDeleting ? deleteSpeed : typeSpeed;

            if (!isDeleting && charIndex === currentText.length) {
                speed = pauseTime;
                isDeleting = true;
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                textIndex = (textIndex + 1) % texts.length;
            }

            setTimeout(type, speed);
        };

        type();
    }
}

// 启动应用
new TechShowcase();