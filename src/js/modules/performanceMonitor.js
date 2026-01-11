/**
 * 性能监控面板
 * 展示 FPS、内存使用、网络性能等关键指标
 */
export class PerformanceMonitor {
    constructor() {
        this.isVisible = false;
        this.metrics = {
            fps: 0,
            memory: { used: 0, total: 0 },
            loadTime: 0,
            resources: [],
            interactions: []
        };

        this.fpsHistory = [];
        this.maxHistoryLength = 60;

        this.init();
    }

    init() {
        this.createPanel();
        this.startMonitoring();
        this.setupToggle();
        this.measurePageLoad();
    }

    createPanel() {
        const panel = document.createElement('div');
        panel.id = 'performance-monitor';
        panel.className = 'performance-monitor hidden';
        panel.innerHTML = `
            <div class="perf-header">
                <h3>⚡ 性能监控</h3>
                <button class="perf-close" title="关闭">×</button>
            </div>
            <div class="perf-content">
                <div class="perf-metric">
                    <span class="perf-label">FPS</span>
                    <span class="perf-value" id="perf-fps">60</span>
                    <canvas id="fps-chart" width="200" height="40"></canvas>
                </div>
                <div class="perf-metric">
                    <span class="perf-label">内存使用</span>
                    <span class="perf-value" id="perf-memory">0 MB</span>
                    <div class="perf-bar">
                        <div class="perf-bar-fill" id="memory-bar"></div>
                    </div>
                </div>
                <div class="perf-metric">
                    <span class="perf-label">页面加载</span>
                    <span class="perf-value" id="perf-load">0 ms</span>
                </div>
                <div class="perf-metric">
                    <span class="perf-label">DOM节点</span>
                    <span class="perf-value" id="perf-dom">0</span>
                </div>
                <div class="perf-metric">
                    <span class="perf-label">资源数量</span>
                    <span class="perf-value" id="perf-resources">0</span>
                </div>
                <div class="perf-metric">
                    <span class="perf-label">交互延迟</span>
                    <span class="perf-value" id="perf-interaction">0 ms</span>
                </div>
            </div>
        `;

        document.body.appendChild(panel);
        this.panel = panel;

        // 关闭按钮
        panel.querySelector('.perf-close').addEventListener('click', () => {
            this.hide();
        });

        // 添加样式
        this.injectStyles();
    }

    injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .performance-monitor {
                position: fixed;
                top: 80px;
                right: 20px;
                width: 280px;
                background: rgba(0, 0, 0, 0.95);
                border: 1px solid rgba(0, 212, 255, 0.3);
                border-radius: 12px;
                padding: 16px;
                z-index: 9999;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                color: #00d4ff;
                backdrop-filter: blur(10px);
                box-shadow: 0 8px 32px rgba(0, 212, 255, 0.2);
                transition: all 0.3s ease;
            }

            .performance-monitor.hidden {
                opacity: 0;
                pointer-events: none;
                transform: translateX(100px);
            }

            .perf-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
                padding-bottom: 12px;
                border-bottom: 1px solid rgba(0, 212, 255, 0.2);
            }

            .perf-header h3 {
                margin: 0;
                font-size: 14px;
                font-weight: bold;
                color: #00d4ff;
            }

            .perf-close {
                background: none;
                border: none;
                color: #00d4ff;
                font-size: 20px;
                cursor: pointer;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                transition: all 0.2s ease;
            }

            .perf-close:hover {
                background: rgba(0, 212, 255, 0.1);
                transform: rotate(90deg);
            }

            .perf-content {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .perf-metric {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .perf-label {
                color: #888;
                font-size: 11px;
                text-transform: uppercase;
            }

            .perf-value {
                color: #00d4ff;
                font-size: 16px;
                font-weight: bold;
            }

            .perf-bar {
                width: 100%;
                height: 6px;
                background: rgba(0, 212, 255, 0.1);
                border-radius: 3px;
                overflow: hidden;
            }

            .perf-bar-fill {
                height: 100%;
                background: linear-gradient(90deg, #00d4ff, #4ecdc4);
                border-radius: 3px;
                transition: width 0.3s ease;
            }

            #fps-chart {
                width: 100%;
                height: 40px;
                margin-top: 4px;
            }

            .perf-toggle {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 48px;
                height: 48px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border: none;
                border-radius: 50%;
                color: white;
                font-size: 20px;
                cursor: pointer;
                z-index: 9998;
                box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .perf-toggle:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 24px rgba(102, 126, 234, 0.6);
            }

            .perf-toggle:active {
                transform: scale(0.95);
            }
        `;
        document.head.appendChild(style);
    }

    setupToggle() {
        const toggle = document.createElement('button');
        toggle.className = 'perf-toggle';
        toggle.innerHTML = '⚡';
        toggle.title = '性能监控';
        toggle.addEventListener('click', () => {
            this.toggle();
        });
        document.body.appendChild(toggle);
    }

    startMonitoring() {
        // FPS 监控
        let lastTime = performance.now();
        let frames = 0;

        const measureFPS = () => {
            frames++;
            const currentTime = performance.now();

            if (currentTime >= lastTime + 1000) {
                this.metrics.fps = Math.round((frames * 1000) / (currentTime - lastTime));
                this.fpsHistory.push(this.metrics.fps);

                if (this.fpsHistory.length > this.maxHistoryLength) {
                    this.fpsHistory.shift();
                }

                frames = 0;
                lastTime = currentTime;
                this.updateDisplay();
            }

            requestAnimationFrame(measureFPS);
        };

        requestAnimationFrame(measureFPS);

        // 内存监控（如果浏览器支持）
        if (performance.memory) {
            setInterval(() => {
                this.metrics.memory = {
                    used: Math.round(performance.memory.usedJSHeapSize / 1048576),
                    total: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
                };
                this.updateDisplay();
            }, 1000);
        }

        // DOM 节点监控
        setInterval(() => {
            this.metrics.domNodes = document.getElementsByTagName('*').length;
            this.updateDisplay();
        }, 2000);

        // 交互延迟监控
        this.monitorInteractions();
    }

    monitorInteractions() {
        let interactionStart = 0;

        ['click', 'keydown', 'touchstart'].forEach(eventType => {
            document.addEventListener(eventType, () => {
                interactionStart = performance.now();
            }, { passive: true });
        });

        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.entryType === 'event' && interactionStart) {
                    const delay = entry.processingStart - interactionStart;
                    this.metrics.interactions.push(delay);
                    if (this.metrics.interactions.length > 10) {
                        this.metrics.interactions.shift();
                    }
                }
            }
        });

        try {
            observer.observe({ entryTypes: ['event'] });
        } catch (e) {
            // 浏览器不支持 event timing
        }
    }

    measurePageLoad() {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                if (perfData) {
                    this.metrics.loadTime = Math.round(perfData.loadEventEnd - perfData.fetchStart);
                }

                const resources = performance.getEntriesByType('resource');
                this.metrics.resources = resources.length;

                this.updateDisplay();
            }, 0);
        });
    }

    updateDisplay() {
        if (!this.isVisible) return;

        // 更新 FPS
        const fpsElement = document.getElementById('perf-fps');
        if (fpsElement) {
            fpsElement.textContent = this.metrics.fps;
            fpsElement.style.color = this.metrics.fps >= 55 ? '#4ecdc4' :
                                     this.metrics.fps >= 30 ? '#ffd93d' : '#ff6b6b';
        }

        // 绘制 FPS 图表
        this.drawFPSChart();

        // 更新内存
        if (performance.memory) {
            const memoryElement = document.getElementById('perf-memory');
            const memoryBar = document.getElementById('memory-bar');
            if (memoryElement && memoryBar) {
                memoryElement.textContent = `${this.metrics.memory.used} / ${this.metrics.memory.total} MB`;
                const percentage = (this.metrics.memory.used / this.metrics.memory.total) * 100;
                memoryBar.style.width = `${percentage}%`;
            }
        }

        // 更新加载时间
        const loadElement = document.getElementById('perf-load');
        if (loadElement && this.metrics.loadTime) {
            loadElement.textContent = `${this.metrics.loadTime} ms`;
        }

        // 更新 DOM 节点
        const domElement = document.getElementById('perf-dom');
        if (domElement && this.metrics.domNodes) {
            domElement.textContent = this.metrics.domNodes;
        }

        // 更新资源数量
        const resourcesElement = document.getElementById('perf-resources');
        if (resourcesElement) {
            resourcesElement.textContent = this.metrics.resources;
        }

        // 更新交互延迟
        const interactionElement = document.getElementById('perf-interaction');
        if (interactionElement && this.metrics.interactions.length > 0) {
            const avgDelay = Math.round(
                this.metrics.interactions.reduce((a, b) => a + b, 0) / this.metrics.interactions.length
            );
            interactionElement.textContent = `${avgDelay} ms`;
        }
    }

    drawFPSChart() {
        const canvas = document.getElementById('fps-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // 清空画布
        ctx.clearRect(0, 0, width, height);

        if (this.fpsHistory.length < 2) return;

        // 绘制网格
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 3; i++) {
            const y = (height / 3) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // 绘制 FPS 曲线
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2;
        ctx.beginPath();

        const step = width / (this.maxHistoryLength - 1);
        const maxFPS = 60;

        this.fpsHistory.forEach((fps, index) => {
            const x = index * step;
            const y = height - (fps / maxFPS) * height;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // 绘制填充区域
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fillStyle = 'rgba(0, 212, 255, 0.1)';
        ctx.fill();
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    show() {
        this.isVisible = true;
        this.panel.classList.remove('hidden');
        this.updateDisplay();
    }

    hide() {
        this.isVisible = false;
        this.panel.classList.add('hidden');
    }

    // 获取性能报告
    getReport() {
        return {
            fps: {
                current: this.metrics.fps,
                average: Math.round(this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length),
                min: Math.min(...this.fpsHistory),
                max: Math.max(...this.fpsHistory)
            },
            memory: this.metrics.memory,
            loadTime: this.metrics.loadTime,
            domNodes: this.metrics.domNodes,
            resources: this.metrics.resources,
            interactions: {
                average: this.metrics.interactions.length > 0
                    ? Math.round(this.metrics.interactions.reduce((a, b) => a + b, 0) / this.metrics.interactions.length)
                    : 0
            }
        };
    }
}
