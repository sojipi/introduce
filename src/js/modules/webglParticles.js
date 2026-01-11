/**
 * 自定义 WebGL 粒子交互系统
 * 展示 WebGL、着色器编程、性能优化等技术
 */
export class WebGLParticleSystem {
    constructor(canvas) {
        this.canvas = canvas || this.createCanvas();
        this.gl = null;
        this.program = null;
        this.particles = [];
        this.particleCount = 150;
        this.mouse = { x: 0, y: 0, radius: 150 };
        this.isRunning = false;

        this.init();
    }

    createCanvas() {
        let canvas = document.getElementById('particles-js');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'particles-js';
            canvas.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: -1;
                pointer-events: none;
            `;
            document.body.insertBefore(canvas, document.body.firstChild);
        }
        return canvas;
    }

    init() {
        // 初始化 WebGL 上下文
        this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');

        if (!this.gl) {
            console.warn('WebGL 不支持，使用 Canvas 2D 降级方案');
            this.useFallback();
            return;
        }

        this.resize();
        window.addEventListener('resize', () => this.resize());

        // 初始化着色器
        this.initShaders();

        // 初始化粒子
        this.initParticles();

        // 设置鼠标交互
        this.setupMouseInteraction();

        // 开始渲染
        this.start();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        if (this.gl) {
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    initShaders() {
        // 顶点着色器
        const vertexShaderSource = `
            attribute vec2 a_position;
            attribute float a_size;
            attribute float a_alpha;

            uniform vec2 u_resolution;

            varying float v_alpha;

            void main() {
                vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;
                gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
                gl_PointSize = a_size;
                v_alpha = a_alpha;
            }
        `;

        // 片段着色器
        const fragmentShaderSource = `
            precision mediump float;

            uniform vec3 u_color;
            varying float v_alpha;

            void main() {
                vec2 coord = gl_PointCoord - vec2(0.5);
                float dist = length(coord);

                if (dist > 0.5) {
                    discard;
                }

                float alpha = (1.0 - dist * 2.0) * v_alpha;
                gl_FragColor = vec4(u_color, alpha);
            }
        `;

        // 编译着色器
        const vertexShader = this.compileShader(vertexShaderSource, this.gl.VERTEX_SHADER);
        const fragmentShader = this.compileShader(fragmentShaderSource, this.gl.FRAGMENT_SHADER);

        // 创建程序
        this.program = this.gl.createProgram();
        this.gl.attachShader(this.program, vertexShader);
        this.gl.attachShader(this.program, fragmentShader);
        this.gl.linkProgram(this.program);

        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            console.error('着色器程序链接失败:', this.gl.getProgramInfoLog(this.program));
            return;
        }

        this.gl.useProgram(this.program);

        // 获取属性和uniform位置
        this.locations = {
            position: this.gl.getAttribLocation(this.program, 'a_position'),
            size: this.gl.getAttribLocation(this.program, 'a_size'),
            alpha: this.gl.getAttribLocation(this.program, 'a_alpha'),
            resolution: this.gl.getUniformLocation(this.program, 'u_resolution'),
            color: this.gl.getUniformLocation(this.program, 'u_color')
        };

        // 启用混合
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    }

    compileShader(source, type) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('着色器编译失败:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    initParticles() {
        this.particles = [];

        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 3 + 2,
                alpha: Math.random() * 0.5 + 0.3,
                baseAlpha: Math.random() * 0.5 + 0.3,
                connections: []
            });
        }
    }

    setupMouseInteraction() {
        const updateMouse = (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        };

        window.addEventListener('mousemove', updateMouse);
        window.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                updateMouse(e.touches[0]);
            }
        });
    }

    update() {
        const maxDistance = 120;

        this.particles.forEach((particle, i) => {
            // 更新位置
            particle.x += particle.vx;
            particle.y += particle.vy;

            // 边界检测
            if (particle.x < 0 || particle.x > this.canvas.width) {
                particle.vx *= -1;
                particle.x = Math.max(0, Math.min(this.canvas.width, particle.x));
            }
            if (particle.y < 0 || particle.y > this.canvas.height) {
                particle.vy *= -1;
                particle.y = Math.max(0, Math.min(this.canvas.height, particle.y));
            }

            // 鼠标交互
            const dx = this.mouse.x - particle.x;
            const dy = this.mouse.y - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.mouse.radius) {
                const force = (this.mouse.radius - distance) / this.mouse.radius;
                const angle = Math.atan2(dy, dx);
                particle.vx -= Math.cos(angle) * force * 0.2;
                particle.vy -= Math.sin(angle) * force * 0.2;
                particle.alpha = Math.min(1, particle.baseAlpha + force * 0.5);
            } else {
                particle.alpha = particle.baseAlpha;
            }

            // 速度衰减
            particle.vx *= 0.99;
            particle.vy *= 0.99;

            // 查找连接
            particle.connections = [];
            for (let j = i + 1; j < this.particles.length; j++) {
                const other = this.particles[j];
                const dx = other.x - particle.x;
                const dy = other.y - particle.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < maxDistance) {
                    particle.connections.push({
                        particle: other,
                        distance: dist,
                        alpha: (1 - dist / maxDistance) * 0.3
                    });
                }
            }
        });
    }

    render() {
        // 清空画布
        this.gl.clearColor(0, 0, 0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        // 设置分辨率
        this.gl.uniform2f(this.locations.resolution, this.canvas.width, this.canvas.height);

        // 准备粒子数据
        const positions = [];
        const sizes = [];
        const alphas = [];

        this.particles.forEach(particle => {
            positions.push(particle.x, particle.y);
            sizes.push(particle.size);
            alphas.push(particle.alpha);
        });

        // 创建缓冲区
        const positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);
        this.gl.enableVertexAttribArray(this.locations.position);
        this.gl.vertexAttribPointer(this.locations.position, 2, this.gl.FLOAT, false, 0, 0);

        const sizeBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, sizeBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(sizes), this.gl.STATIC_DRAW);
        this.gl.enableVertexAttribArray(this.locations.size);
        this.gl.vertexAttribPointer(this.locations.size, 1, this.gl.FLOAT, false, 0, 0);

        const alphaBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, alphaBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(alphas), this.gl.STATIC_DRAW);
        this.gl.enableVertexAttribArray(this.locations.alpha);
        this.gl.vertexAttribPointer(this.locations.alpha, 1, this.gl.FLOAT, false, 0, 0);

        // 设置颜色 (青色)
        this.gl.uniform3f(this.locations.color, 0, 0.831, 1);

        // 绘制粒子
        this.gl.drawArrays(this.gl.POINTS, 0, this.particles.length);

        // 绘制连接线
        this.renderConnections();
    }

    renderConnections() {
        const ctx = this.canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        // 保存 WebGL 状态
        this.gl.flush();

        this.particles.forEach(particle => {
            particle.connections.forEach(conn => {
                ctx.beginPath();
                ctx.moveTo(particle.x, particle.y);
                ctx.lineTo(conn.particle.x, conn.particle.y);
                ctx.strokeStyle = `rgba(0, 212, 255, ${conn.alpha})`;
                ctx.lineWidth = 1;
                ctx.stroke();
            });
        });
    }

    animate() {
        if (!this.isRunning) return;

        this.update();
        this.render();

        requestAnimationFrame(() => this.animate());
    }

    start() {
        this.isRunning = true;
        this.animate();
    }

    stop() {
        this.isRunning = false;
    }

    // Canvas 2D 降级方案
    useFallback() {
        const ctx = this.canvas.getContext('2d');
        this.resize();

        this.initParticles();
        this.setupMouseInteraction();

        const animate = () => {
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            this.update();

            // 绘制连接线
            this.particles.forEach(particle => {
                particle.connections.forEach(conn => {
                    ctx.beginPath();
                    ctx.moveTo(particle.x, particle.y);
                    ctx.lineTo(conn.particle.x, conn.particle.y);
                    ctx.strokeStyle = `rgba(0, 212, 255, ${conn.alpha})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                });
            });

            // 绘制粒子
            this.particles.forEach(particle => {
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0, 212, 255, ${particle.alpha})`;
                ctx.fill();
            });

            requestAnimationFrame(animate);
        };

        animate();
    }

    destroy() {
        this.stop();
        if (this.gl) {
            this.gl.deleteProgram(this.program);
        }
    }
}
