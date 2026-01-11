// 主要功能模块
import { ParticleSystem } from './modules/particles.js';
import { AnimationController } from './modules/animations.js';
import { LazyLoader } from './modules/lazyLoader.js';
import { PerformanceMonitor } from './modules/performanceMonitor.js';
import { WebGLParticleSystem } from './modules/webglParticles.js';
import { createStore, middleware } from './modules/stateManager.js';
import { GestureRecognizer, AdvancedInteractions } from './modules/gestureRecognizer.js';
import { PWAManager } from './modules/pwaManager.js';

class TechShowcase {
    constructor() {
        // 初始化全局状态管理
        this.store = createStore({
            performance: {
                fps: 60,
                memory: 0
            },
            ui: {
                theme: 'dark',
                sidebarOpen: false
            },
            user: {
                preferences: {}
            }
        });

        // 添加中间件
        const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (isDevelopment) {
            this.store.use(middleware.logger);
        }
        this.store.use(middleware.performance);

        this.init();
    }

    init() {
        // 等待DOM加载完成
        document.addEventListener('DOMContentLoaded', async () => {
            try {
                await this.waitForLibraries();
                this.setupNavigation();
                await this.initializeModules();
                this.setupEventListeners();
                this.startAnimations();
            } catch (error) {
                console.warn('某些库加载失败，使用降级方案:', error);
                this.initializeFallback();
            }
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

        // 初始化统计数据管理器（即使在降级模式下也需要）
        this.statsManager = new StatsManager();

        // 初始化技能管理器（降级模式）
        this.skillsManager = new SkillsManager();

        // 使用CSS动画替代JS动画
        document.body.classList.add('fallback-mode');

        // 简化的初始化
        this.animateCounters();
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

    async initializeModules() {
        console.log('🚀 初始化模块（懒加载模式）...');

        // 初始化性能监控（高级功能）
        this.performanceMonitor = new PerformanceMonitor();
        console.log('✅ 性能监控已启动');

        // 初始化 WebGL 粒子系统（替代 particles.js）
        try {
            this.webglParticles = new WebGLParticleSystem();
            console.log('✅ WebGL 粒子系统已启动');
        } catch (error) {
            console.warn('⚠️ WebGL 不可用，使用降级方案');
            this.particleSystem = new ParticleSystem();
        }

        // 初始化手势识别
        this.gestureRecognizer = new GestureRecognizer();
        this.setupGestureHandlers();
        console.log('✅ 手势识别已启动');

        // 初始化高级交互
        this.advancedInteractions = new AdvancedInteractions();
        console.log('✅ 高级交互已启动');

        // 初始化 PWA
        this.pwaManager = new PWAManager();
        console.log('✅ PWA 功能已启动');

        // 初始化懒加载管理器（核心功能）
        this.lazyLoader = new LazyLoader();
        window.lazyLoader = this.lazyLoader;

        // 初始化动画控制器（立即加载）
        this.animationController = new AnimationController();

        console.log('✅ 核心模块初始化完成，数据模块将按需加载');
    }

    setupEventListeners() {
        // 统计数字动画
        this.animateCounters();

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

    setupCTAButtons() {
        const primaryCTA = document.querySelector('.cta-button.primary');
        const secondaryCTA = document.querySelector('.cta-button.secondary');

        primaryCTA.addEventListener('click', () => {
            document.getElementById('projects').scrollIntoView({
                behavior: 'smooth'
            });
        });

        // secondaryCTA.addEventListener('click', () => {
        //     // 模拟下载简历
        //     const link = document.createElement('a');
        //     link.href = '#';
        //     link.download = 'resume.pdf';
        //     link.click();

        //     // 显示提示
        //     this.showNotification('简历下载已开始');
        // });
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

        // 启动代码打字机效果
        this.startCodeTyping();
    }

    startCodeTyping() {
        const codeElement = document.getElementById('typing-code');
        if (!codeElement) return;

        const codeSnippets = [
            `<span class="keyword">const</span> <span class="function">createWebGLParticles</span> = () => {
  <span class="keyword">const</span> gl = canvas.<span class="function">getContext</span>(<span class="string">'webgl'</span>);
  <span class="keyword">const</span> shader = <span class="function">compileShader</span>(gl, vertexSrc, fragmentSrc);

  <span class="comment">// GPU 加速粒子渲染</span>
  gl.<span class="function">useProgram</span>(shader);
  gl.<span class="function">drawArrays</span>(gl.POINTS, <span class="number">0</span>, particleCount);

  <span class="keyword">return</span> { render, update };
};`,
            `<span class="keyword">class</span> <span class="function">StateManager</span> {
  <span class="function">constructor</span>() {
    <span class="keyword">this</span>.state = <span class="keyword">new</span> <span class="function">Proxy</span>({}, {
      <span class="function">set</span>(target, key, value) {
        <span class="comment">// 响应式状态更新</span>
        target[key] = value;
        <span class="function">notify</span>(key, value);
        <span class="keyword">return</span> <span class="keyword">true</span>;
      }
    });
  }
}`,
            `<span class="keyword">async function</span> <span class="function">registerServiceWorker</span>() {
  <span class="keyword">if</span> (<span class="string">'serviceWorker'</span> <span class="keyword">in</span> navigator) {
    <span class="keyword">const</span> registration = <span class="keyword">await</span> navigator.serviceWorker
      .<span class="function">register</span>(<span class="string">'/sw.js'</span>);

    <span class="comment">// PWA 离线支持</span>
    console.<span class="function">log</span>(<span class="string">'✅ Service Worker 已注册'</span>);
  }
}`,
            `<span class="keyword">const</span> <span class="function">recognizeGesture</span> = (touches) => {
  <span class="keyword">const</span> distance = <span class="function">calculateDistance</span>(touches);
  <span class="keyword">const</span> angle = <span class="function">calculateAngle</span>(touches);

  <span class="keyword">if</span> (distance > threshold) {
    <span class="keyword">return</span> { type: <span class="string">'swipe'</span>, direction };
  }

  <span class="comment">// 支持 8+ 种手势识别</span>
  <span class="keyword">return</span> <span class="function">detectGesture</span>(touches);
};`
        ];

        let snippetIndex = 0;
        let charIndex = 0;
        let currentSnippet = '';

        const typeCode = () => {
            if (charIndex < codeSnippets[snippetIndex].length) {
                currentSnippet += codeSnippets[snippetIndex][charIndex];
                codeElement.innerHTML = currentSnippet;
                charIndex++;
                setTimeout(typeCode, 20);
            } else {
                setTimeout(() => {
                    charIndex = 0;
                    currentSnippet = '';
                    snippetIndex = (snippetIndex + 1) % codeSnippets.length;
                    codeElement.innerHTML = '';
                    setTimeout(typeCode, 500);
                }, 3000);
            }
        };

        typeCode();
    }

    setupGestureHandlers() {
        // 滑动手势
        this.gestureRecognizer.on('swipe', (data) => {
            console.log('滑动手势:', data.direction);

            // 根据滑动方向切换页面
            if (data.direction === 'left') {
                // 下一页
            } else if (data.direction === 'right') {
                // 上一页
            }
        });

        // 捏合手势
        this.gestureRecognizer.on('pinch', (data) => {
            console.log('捏合手势:', data.type, data.scale);
        });

        // 双击手势
        this.gestureRecognizer.on('doubletap', (data) => {
            console.log('双击:', data);
        });

        // 长按手势
        this.gestureRecognizer.on('longpress', (data) => {
            console.log('长按:', data);
        });
    }
}

// 启动应用
new TechShowcase();