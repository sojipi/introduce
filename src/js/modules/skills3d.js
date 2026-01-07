export class SkillsVisualization {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.skills = [];
        this.init();
    }

    init() {
        this.setupScene();
        this.createSkillObjects();
        this.setupLighting();
        this.setupControls();
        this.animate();
        this.handleResize();
    }

    setupScene() {
        const canvas = document.getElementById('skills-canvas');
        if (!canvas) return;

        // 创建场景
        this.scene = new THREE.Scene();

        // 创建相机
        this.camera = new THREE.PerspectiveCamera(
            75,
            canvas.clientWidth / canvas.clientHeight,
            0.1,
            1000
        );
        this.camera.position.z = 5;

        // 创建渲染器
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            alpha: true,
            antialias: true
        });
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        this.renderer.setClearColor(0x000000, 0);
    }

    createSkillObjects() {
        const skillsData = [
            { name: 'JavaScript', level: 0.95, color: 0xf7df1e, position: [-2, 1, 0] },
            { name: 'React', level: 0.90, color: 0x61dafb, position: [0, 1, 0] },
            { name: 'Node.js', level: 0.85, color: 0x339933, position: [2, 1, 0] },
            { name: 'Python', level: 0.80, color: 0x3776ab, position: [-2, -1, 0] },
            { name: 'Vue.js', level: 0.88, color: 0x4fc08d, position: [0, -1, 0] },
            { name: 'MongoDB', level: 0.75, color: 0x47a248, position: [2, -1, 0] }
        ];

        skillsData.forEach((skill, index) => {
            // 创建几何体
            const geometry = new THREE.BoxGeometry(0.8, skill.level * 2, 0.8);

            // 创建材质
            const material = new THREE.MeshPhongMaterial({
                color: skill.color,
                transparent: true,
                opacity: 0.8
            });

            // 创建网格
            const cube = new THREE.Mesh(geometry, material);
            cube.position.set(...skill.position);
            cube.userData = {
                name: skill.name,
                level: skill.level,
                originalY: skill.position[1]
            };

            this.scene.add(cube);
            this.skills.push(cube);

            // 添加文字标签
            this.createTextLabel(skill.name, skill.position);
        });
    }

    createTextLabel(text, position) {
        // 创建文字纹理
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;

        context.fillStyle = '#ffffff';
        context.font = '20px Arial';
        context.textAlign = 'center';
        context.fillText(text, 128, 40);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);

        sprite.position.set(position[0], position[1] - 1.5, position[2]);
        sprite.scale.set(1, 0.25, 1);

        this.scene.add(sprite);
    }

    setupLighting() {
        // 环境光
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);

        // 点光源
        const pointLight = new THREE.PointLight(0x00d4ff, 1, 100);
        pointLight.position.set(0, 5, 5);
        this.scene.add(pointLight);

        // 另一个点光源
        const pointLight2 = new THREE.PointLight(0xff6b6b, 0.8, 100);
        pointLight2.position.set(-5, -5, 5);
        this.scene.add(pointLight2);
    }

    setupControls() {
        // 鼠标交互
        let mouseX = 0;
        let mouseY = 0;

        document.addEventListener('mousemove', (event) => {
            mouseX = (event.clientX / window.innerWidth) * 2 - 1;
            mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
        });

        // 更新相机位置
        this.updateCamera = () => {
            this.camera.position.x += (mouseX * 2 - this.camera.position.x) * 0.05;
            this.camera.position.y += (mouseY * 2 - this.camera.position.y) * 0.05;
            this.camera.lookAt(this.scene.position);
        };
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // 旋转技能方块
        this.skills.forEach((skill, index) => {
            skill.rotation.x += 0.01;
            skill.rotation.y += 0.01;

            // 浮动效果
            skill.position.y = skill.userData.originalY +
                Math.sin(Date.now() * 0.001 + index) * 0.2;
        });

        // 更新相机
        if (this.updateCamera) {
            this.updateCamera();
        }

        this.renderer.render(this.scene, this.camera);
    }

    handleResize() {
        window.addEventListener('resize', () => {
            const canvas = document.getElementById('skills-canvas');
            if (!canvas) return;

            this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        });
    }
}