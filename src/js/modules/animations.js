export class AnimationController {
    constructor() {
        this.init();
    }

    init() {
        this.setupHeroCanvas();
        this.setupScrollAnimations();
        this.setupParallaxEffects();
        this.setupHoverAnimations();
    }

    setupHeroCanvas() {
        const canvas = document.getElementById('hero-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let animationId;

        // 设置画布大小
        const resizeCanvas = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // 粒子系统
        class Particle {
            constructor() {
                this.reset();
                this.y = Math.random() * canvas.height;
            }

            reset() {
                this.x = Math.random() * canvas.width;
                this.y = -10;
                this.speed = Math.random() * 3 + 1;
                this.size = Math.random() * 3 + 1;
                this.opacity = Math.random() * 0.5 + 0.3;
                this.color = this.getRandomColor();
            }

            getRandomColor() {
                const colors = ['#00d4ff', '#ff6b6b', '#4ecdc4', '#45b7d1'];
                return colors[Math.floor(Math.random() * colors.length)];
            }

            update() {
                this.y += this.speed;
                if (this.y > canvas.height + 10) {
                    this.reset();
                }
            }

            draw() {
                ctx.save();
                ctx.globalAlpha = this.opacity;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }

        // 创建粒子
        const particles = [];
        for (let i = 0; i < 50; i++) {
            particles.push(new Particle());
        }

        // 动画循环
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 绘制连接线
            ctx.strokeStyle = 'rgba(0, 212, 255, 0.1)';
            ctx.lineWidth = 1;

            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 100) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }

            // 更新和绘制粒子
            particles.forEach(particle => {
                particle.update();
                particle.draw();
            });

            animationId = requestAnimationFrame(animate);
        };

        animate();

        // 鼠标交互
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            particles.forEach(particle => {
                const dx = mouseX - particle.x;
                const dy = mouseY - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 100) {
                    particle.x += dx * 0.02;
                    particle.y += dy * 0.02;
                }
            });
        });
    }

    setupScrollAnimations() {
        // 滚动视差效果
        const parallaxElements = document.querySelectorAll('[data-parallax]');

        const handleScroll = () => {
            const scrolled = window.pageYOffset;

            parallaxElements.forEach(element => {
                const rate = scrolled * -0.5;
                element.style.transform = `translateY(${rate}px)`;
            });
        };

        window.addEventListener('scroll', this.throttle(handleScroll, 16));
    }

    setupParallaxEffects() {
        // 鼠标视差效果
        document.addEventListener('mousemove', (e) => {
            const mouseX = e.clientX / window.innerWidth;
            const mouseY = e.clientY / window.innerHeight;

            // 背景元素视差
            const parallaxElements = document.querySelectorAll('.parallax-bg');
            parallaxElements.forEach((element, index) => {
                const speed = (index + 1) * 0.5;
                const x = (mouseX - 0.5) * speed * 50;
                const y = (mouseY - 0.5) * speed * 50;

                element.style.transform = `translate(${x}px, ${y}px)`;
            });
        });
    }

    setupHoverAnimations() {
        // 卡片悬停效果
        const cards = document.querySelectorAll('.project-card, .award-item, .skill-category');

        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                gsap.to(card, {
                    duration: 0.3,
                    y: -10,
                    scale: 1.02,
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                    ease: 'power2.out'
                });
            });

            card.addEventListener('mouseleave', () => {
                gsap.to(card, {
                    duration: 0.3,
                    y: 0,
                    scale: 1,
                    boxShadow: '0 0 0 rgba(0, 0, 0, 0)',
                    ease: 'power2.out'
                });
            });
        });

        // 按钮悬停效果
        const buttons = document.querySelectorAll('.cta-button, .tab-btn');

        buttons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                gsap.to(button, {
                    duration: 0.2,
                    scale: 1.05,
                    ease: 'power2.out'
                });
            });

            button.addEventListener('mouseleave', () => {
                gsap.to(button, {
                    duration: 0.2,
                    scale: 1,
                    ease: 'power2.out'
                });
            });
        });
    }

    // 创建浮动动画
    createFloatingAnimation(element, options = {}) {
        const defaults = {
            duration: 3,
            y: 20,
            ease: 'power1.inOut',
            repeat: -1,
            yoyo: true
        };

        const config = { ...defaults, ...options };

        gsap.to(element, config);
    }

    // 创建脉冲动画
    createPulseAnimation(element, options = {}) {
        const defaults = {
            duration: 2,
            scale: 1.1,
            ease: 'power2.inOut',
            repeat: -1,
            yoyo: true
        };

        const config = { ...defaults, ...options };

        gsap.to(element, config);
    }

    // 创建打字机效果
    createTypewriterEffect(element, text, options = {}) {
        const defaults = {
            speed: 100,
            cursor: true,
            cursorChar: '|'
        };

        const config = { ...defaults, ...options };

        let i = 0;
        element.textContent = '';

        const typeWriter = () => {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(typeWriter, config.speed);
            } else if (config.cursor) {
                this.addCursorBlink(element, config.cursorChar);
            }
        };

        typeWriter();
    }

    addCursorBlink(element, cursorChar) {
        const cursor = document.createElement('span');
        cursor.textContent = cursorChar;
        cursor.style.animation = 'blink 1s infinite';
        element.appendChild(cursor);

        // 添加闪烁CSS
        if (!document.getElementById('cursor-blink-style')) {
            const style = document.createElement('style');
            style.id = 'cursor-blink-style';
            style.textContent = `
                @keyframes blink {
                    0%, 50% { opacity: 1; }
                    51%, 100% { opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // 创建数字计数动画
    animateNumber(element, target, options = {}) {
        const defaults = {
            duration: 2000,
            easing: 'easeOutCubic'
        };

        const config = { ...defaults, ...options };

        let start = 0;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / config.duration, 1);

            // 缓动函数
            const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
            const easedProgress = easeOutCubic(progress);

            const current = Math.floor(start + (target - start) * easedProgress);
            element.textContent = current;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.textContent = target;
            }
        };

        requestAnimationFrame(animate);
    }

    // 工具函数：节流
    throttle(func, limit) {
        let inThrottle;
        return function () {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // 工具函数：防抖
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // 创建路径动画
    createPathAnimation(path, options = {}) {
        const defaults = {
            duration: 2,
            ease: 'power2.inOut',
            drawSVG: '0% 100%'
        };

        const config = { ...defaults, ...options };

        gsap.fromTo(path,
            { drawSVG: '0% 0%' },
            { drawSVG: config.drawSVG, duration: config.duration, ease: config.ease }
        );
    }

    // 创建粒子爆炸效果
    createParticleExplosion(x, y, options = {}) {
        const defaults = {
            particleCount: 20,
            colors: ['#00d4ff', '#ff6b6b', '#4ecdc4'],
            size: 3,
            speed: 5
        };

        const config = { ...defaults, ...options };

        for (let i = 0; i < config.particleCount; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: fixed;
                width: ${config.size}px;
                height: ${config.size}px;
                background: ${config.colors[Math.floor(Math.random() * config.colors.length)]};
                border-radius: 50%;
                pointer-events: none;
                z-index: 10000;
                left: ${x}px;
                top: ${y}px;
            `;

            document.body.appendChild(particle);

            const angle = (Math.PI * 2 * i) / config.particleCount;
            const velocity = config.speed + Math.random() * config.speed;

            gsap.to(particle, {
                duration: 1,
                x: Math.cos(angle) * velocity * 20,
                y: Math.sin(angle) * velocity * 20,
                opacity: 0,
                scale: 0,
                ease: 'power2.out',
                onComplete: () => {
                    document.body.removeChild(particle);
                }
            });
        }
    }
}