/**
 * 手势识别和高级交互系统
 * 展示事件处理、算法设计、用户体验优化
 */
export class GestureRecognizer {
    constructor(element = document.body) {
        this.element = element;
        this.gestures = new Map();
        this.activeGesture = null;
        this.touchPoints = [];
        this.gestureHistory = [];
        this.config = {
            swipeThreshold: 50,
            swipeVelocity: 0.3,
            pinchThreshold: 10,
            rotateThreshold: 15,
            longPressDelay: 500,
            doubleTapDelay: 300
        };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.registerDefaultGestures();
    }

    setupEventListeners() {
        // 触摸事件
        this.element.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.element.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.element.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        this.element.addEventListener('touchcancel', (e) => this.handleTouchEnd(e), { passive: false });

        // 鼠标事件（用于桌面端测试）
        this.element.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.element.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.element.addEventListener('mouseup', (e) => this.handleMouseUp(e));

        // 指针事件（现代浏览器）
        if (window.PointerEvent) {
            this.element.addEventListener('pointerdown', (e) => this.handlePointerDown(e));
            this.element.addEventListener('pointermove', (e) => this.handlePointerMove(e));
            this.element.addEventListener('pointerup', (e) => this.handlePointerUp(e));
        }
    }

    registerDefaultGestures() {
        // 滑动手势
        this.register('swipe', {
            start: (data) => data.touches === 1,
            move: (data) => {
                const dx = data.currentX - data.startX;
                const dy = data.currentY - data.startY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const velocity = distance / data.duration;

                return distance > this.config.swipeThreshold && velocity > this.config.swipeVelocity;
            },
            end: (data) => {
                const dx = data.currentX - data.startX;
                const dy = data.currentY - data.startY;
                const angle = Math.atan2(dy, dx) * 180 / Math.PI;

                let direction;
                if (angle > -45 && angle <= 45) direction = 'right';
                else if (angle > 45 && angle <= 135) direction = 'down';
                else if (angle > -135 && angle <= -45) direction = 'up';
                else direction = 'left';

                return { direction, distance: Math.sqrt(dx * dx + dy * dy), velocity: data.velocity };
            }
        });

        // 捏合手势
        this.register('pinch', {
            start: (data) => data.touches === 2,
            move: (data) => {
                if (data.touches !== 2) return false;

                const currentDistance = this.getDistance(data.touchPoints[0], data.touchPoints[1]);
                const startDistance = data.startDistance || currentDistance;
                const scale = currentDistance / startDistance;

                return Math.abs(scale - 1) > 0.1;
            },
            end: (data) => {
                const currentDistance = this.getDistance(data.touchPoints[0], data.touchPoints[1]);
                const scale = currentDistance / data.startDistance;

                return { scale, type: scale > 1 ? 'zoom-in' : 'zoom-out' };
            }
        });

        // 旋转手势
        this.register('rotate', {
            start: (data) => data.touches === 2,
            move: (data) => {
                if (data.touches !== 2) return false;

                const currentAngle = this.getAngle(data.touchPoints[0], data.touchPoints[1]);
                const startAngle = data.startAngle || currentAngle;
                const rotation = currentAngle - startAngle;

                return Math.abs(rotation) > this.config.rotateThreshold;
            },
            end: (data) => {
                const currentAngle = this.getAngle(data.touchPoints[0], data.touchPoints[1]);
                const rotation = currentAngle - data.startAngle;

                return { rotation, direction: rotation > 0 ? 'clockwise' : 'counter-clockwise' };
            }
        });

        // 长按手势
        this.register('longpress', {
            start: (data) => {
                data.longPressTimer = setTimeout(() => {
                    this.emit('longpress', {
                        x: data.startX,
                        y: data.startY,
                        duration: Date.now() - data.startTime
                    });
                }, this.config.longPressDelay);
                return true;
            },
            move: (data) => {
                const dx = data.currentX - data.startX;
                const dy = data.currentY - data.startY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance > 10) {
                    clearTimeout(data.longPressTimer);
                    return false;
                }
                return true;
            },
            end: (data) => {
                clearTimeout(data.longPressTimer);
                return null;
            }
        });

        // 双击手势
        this.register('doubletap', {
            start: (data) => {
                const now = Date.now();
                const lastTap = data.lastTapTime || 0;

                if (now - lastTap < this.config.doubleTapDelay) {
                    return true;
                }

                data.lastTapTime = now;
                return false;
            },
            end: (data) => {
                return { x: data.currentX, y: data.currentY };
            }
        });
    }

    register(name, handlers) {
        this.gestures.set(name, handlers);
    }

    handleTouchStart(e) {
        this.touchPoints = Array.from(e.touches).map(touch => ({
            id: touch.identifier,
            x: touch.clientX,
            y: touch.clientY,
            startX: touch.clientX,
            startY: touch.clientY,
            startTime: Date.now()
        }));

        this.startGestureDetection({
            touches: e.touches.length,
            startX: this.touchPoints[0].x,
            startY: this.touchPoints[0].y,
            currentX: this.touchPoints[0].x,
            currentY: this.touchPoints[0].y,
            startTime: Date.now(),
            touchPoints: this.touchPoints,
            startDistance: this.touchPoints.length === 2 ? this.getDistance(this.touchPoints[0], this.touchPoints[1]) : 0,
            startAngle: this.touchPoints.length === 2 ? this.getAngle(this.touchPoints[0], this.touchPoints[1]) : 0
        });
    }

    handleTouchMove(e) {
        if (this.touchPoints.length === 0) return;

        this.touchPoints = Array.from(e.touches).map(touch => ({
            ...this.touchPoints.find(p => p.id === touch.identifier),
            x: touch.clientX,
            y: touch.clientY
        }));

        this.updateGestureDetection({
            currentX: this.touchPoints[0].x,
            currentY: this.touchPoints[0].y,
            touchPoints: this.touchPoints,
            duration: Date.now() - this.touchPoints[0].startTime
        });
    }

    handleTouchEnd(e) {
        if (this.touchPoints.length === 0) return;

        const endTime = Date.now();
        const duration = endTime - this.touchPoints[0].startTime;
        const velocity = this.calculateVelocity(this.touchPoints[0], duration);

        this.endGestureDetection({
            currentX: this.touchPoints[0].x,
            currentY: this.touchPoints[0].y,
            duration,
            velocity,
            touchPoints: this.touchPoints
        });

        this.touchPoints = [];
    }

    handleMouseDown(e) {
        this.mouseDown = true;
        this.startGestureDetection({
            touches: 1,
            startX: e.clientX,
            startY: e.clientY,
            currentX: e.clientX,
            currentY: e.clientY,
            startTime: Date.now()
        });
    }

    handleMouseMove(e) {
        if (!this.mouseDown) return;

        this.updateGestureDetection({
            currentX: e.clientX,
            currentY: e.clientY,
            duration: Date.now() - this.activeGesture.startTime
        });
    }

    handleMouseUp(e) {
        if (!this.mouseDown) return;

        this.mouseDown = false;
        const duration = Date.now() - this.activeGesture.startTime;

        this.endGestureDetection({
            currentX: e.clientX,
            currentY: e.clientY,
            duration,
            velocity: this.calculateVelocity({ startX: this.activeGesture.startX, startY: this.activeGesture.startY, x: e.clientX, y: e.clientY }, duration)
        });
    }

    handlePointerDown(e) {
        // 处理指针事件
    }

    handlePointerMove(e) {
        // 处理指针移动
    }

    handlePointerUp(e) {
        // 处理指针释放
    }

    startGestureDetection(data) {
        this.activeGesture = data;

        this.gestures.forEach((handlers, name) => {
            if (handlers.start && handlers.start(data)) {
                this.activeGesture.type = name;
            }
        });
    }

    updateGestureDetection(data) {
        if (!this.activeGesture) return;

        Object.assign(this.activeGesture, data);

        const handlers = this.gestures.get(this.activeGesture.type);
        if (handlers && handlers.move) {
            const result = handlers.move(this.activeGesture);
            if (result) {
                this.emit(`${this.activeGesture.type}-move`, result);
            }
        }
    }

    endGestureDetection(data) {
        if (!this.activeGesture) return;

        Object.assign(this.activeGesture, data);

        const handlers = this.gestures.get(this.activeGesture.type);
        if (handlers && handlers.end) {
            const result = handlers.end(this.activeGesture);
            if (result) {
                this.emit(this.activeGesture.type, result);
                this.addToHistory(this.activeGesture.type, result);
            }
        }

        this.activeGesture = null;
    }

    emit(eventName, data) {
        const event = new CustomEvent(`gesture:${eventName}`, {
            detail: data,
            bubbles: true,
            cancelable: true
        });

        this.element.dispatchEvent(event);
    }

    on(eventName, callback) {
        this.element.addEventListener(`gesture:${eventName}`, (e) => {
            callback(e.detail);
        });
    }

    getDistance(p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    getAngle(p1, p2) {
        return Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
    }

    calculateVelocity(point, duration) {
        const dx = point.x - point.startX;
        const dy = point.y - point.startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance / duration;
    }

    addToHistory(type, data) {
        this.gestureHistory.push({
            type,
            data,
            timestamp: Date.now()
        });

        if (this.gestureHistory.length > 50) {
            this.gestureHistory.shift();
        }
    }

    getHistory(limit = 10) {
        return this.gestureHistory.slice(-limit);
    }

    destroy() {
        // 清理事件监听器
        this.touchPoints = [];
        this.activeGesture = null;
        this.gestures.clear();
    }
}

/**
 * 高级交互效果
 */
export class AdvancedInteractions {
    constructor() {
        this.effects = new Map();
        this.init();
    }

    init() {
        this.setupCursorFollower();
        this.setupMagneticButtons();
        this.setupParallaxEffect();
        this.setupSmoothScroll();
    }

    // 鼠标跟随效果
    setupCursorFollower() {
        const cursor = document.createElement('div');
        cursor.className = 'custom-cursor';
        cursor.innerHTML = '<div class="cursor-dot"></div><div class="cursor-ring"></div>';
        document.body.appendChild(cursor);

        const dot = cursor.querySelector('.cursor-dot');
        const ring = cursor.querySelector('.cursor-ring');

        let mouseX = 0, mouseY = 0;
        let dotX = 0, dotY = 0;
        let ringX = 0, ringY = 0;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        const animate = () => {
            // 平滑跟随
            dotX += (mouseX - dotX) * 0.8;
            dotY += (mouseY - dotY) * 0.8;
            ringX += (mouseX - ringX) * 0.15;
            ringY += (mouseY - ringY) * 0.15;

            dot.style.transform = `translate(${dotX}px, ${dotY}px)`;
            ring.style.transform = `translate(${ringX}px, ${ringY}px)`;

            requestAnimationFrame(animate);
        };

        animate();

        // 添加样式
        this.injectCursorStyles();
    }

    injectCursorStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .custom-cursor {
                position: fixed;
                top: 0;
                left: 0;
                pointer-events: none;
                z-index: 10000;
            }

            .cursor-dot {
                width: 8px;
                height: 8px;
                background: #00d4ff;
                border-radius: 50%;
                position: absolute;
                transform: translate(-50%, -50%);
                transition: width 0.2s, height 0.2s;
            }

            .cursor-ring {
                width: 40px;
                height: 40px;
                border: 2px solid rgba(0, 212, 255, 0.5);
                border-radius: 50%;
                position: absolute;
                transform: translate(-50%, -50%);
                transition: width 0.3s, height 0.3s;
            }

            a:hover ~ .custom-cursor .cursor-dot,
            button:hover ~ .custom-cursor .cursor-dot {
                width: 16px;
                height: 16px;
            }

            a:hover ~ .custom-cursor .cursor-ring,
            button:hover ~ .custom-cursor .cursor-ring {
                width: 60px;
                height: 60px;
            }
        `;
        document.head.appendChild(style);
    }

    // 磁性按钮效果
    setupMagneticButtons() {
        document.querySelectorAll('button, .cta-button').forEach(button => {
            button.addEventListener('mousemove', (e) => {
                const rect = button.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;

                button.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
            });

            button.addEventListener('mouseleave', () => {
                button.style.transform = 'translate(0, 0)';
            });
        });
    }

    // 视差滚动效果
    setupParallaxEffect() {
        const parallaxElements = document.querySelectorAll('[data-parallax]');

        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;

            parallaxElements.forEach(element => {
                const speed = element.dataset.parallax || 0.5;
                const yPos = -(scrollY * speed);
                element.style.transform = `translateY(${yPos}px)`;
            });
        });
    }

    // 平滑滚动
    setupSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));

                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }
}
