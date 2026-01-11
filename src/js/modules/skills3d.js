export class SkillsVisualization {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.skills = [];
        this.skillsData = [];
        this.init();
    }

    async init() {
        await this.loadSkillsFromAPI();
        this.setupScene();
        this.createSkillObjects();
        this.setupLighting();
        this.setupControls();
        this.animate();
        this.handleResize();
    }

    // 从统一接口加载技能数据
    async loadSkillsFromAPI() {
        try {
            console.log('🔄 3D技能模块：从缓存获取数据...');

            // 使用技能管理器已经加载的数据
            if (window.skillsManager && window.skillsManager.allData) {
                console.log('✅ 3D技能模块：使用已缓存的数据');
                this.processSkillsData(window.skillsManager.allData.skills);
                return;
            }

            // 如果没有缓存数据，使用备用数据
            console.warn('3D技能模块：没有找到缓存数据，使用备用数据');
            this.loadFallbackSkills();
        } catch (error) {
            console.warn('3D技能模块：加载数据失败，使用静态数据:', error);
            this.loadFallbackSkills();
        }
    }

    // 处理技能数据，转换为3D可视化格式
    processSkillsData(skillsData) {
        const allSkills = [];

        // 从分组的技能数据中提取所有技能
        Object.entries(skillsData).forEach(([category, categoryData]) => {
            categoryData.skills.forEach(skill => {
                allSkills.push({
                    ...skill,
                    category: category
                });
            });
        });

        // 选择前6个技能进行3D展示
        const selectedSkills = allSkills.slice(0, 6);

        const positions = [
            [-2, 1, 0], [0, 1, 0], [2, 1, 0],
            [-2, -1, 0], [0, -1, 0], [2, -1, 0]
        ];

        this.skillsData = selectedSkills.map((skill, index) => ({
            name: skill.name,
            level: skill.level / 100, // 转换为0-1范围
            color: this.getSkillColorFromHex(skill.color) || this.getSkillColor(skill.category),
            position: positions[index] || [0, 0, 0]
        }));
    }

    // 从十六进制颜色转换为THREE.js颜色
    getSkillColorFromHex(hexColor) {
        if (!hexColor) return null;
        // 移除#号并转换为数字
        const hex = hexColor.replace('#', '');
        return parseInt(hex, 16);
    }

    // 根据技能分类获取颜色
    getSkillColor(category) {
        const colors = {
            frontend: 0x61dafb,
            backend: 0x339933,
            database: 0x47a248,
            devops: 0xff6b6b,
            mobile: 0x4fc08d,
            ai: 0x3776ab,
            design: 0xf7df1e,
            other: 0x667eea
        };
        return colors[category] || colors.other;
    }

    // 备用静态数据
    loadFallbackSkills() {
        console.log('📦 使用备用技能数据');
        this.skillsData = [
            { name: 'JavaScript', level: 0.95, color: 0xf7df1e, position: [-2, 1, 0] },
            { name: 'React', level: 0.90, color: 0x61dafb, position: [0, 1, 0] },
            { name: 'Node.js', level: 0.85, color: 0x339933, position: [2, 1, 0] },
            { name: 'Python', level: 0.80, color: 0x3776ab, position: [-2, -1, 0] },
            { name: 'Vue.js', level: 0.88, color: 0x4fc08d, position: [0, -1, 0] },
            { name: 'MongoDB', level: 0.75, color: 0x47a248, position: [2, -1, 0] }
        ];
    }

    setupScene() {
        const canvas = document.getElementById('skills-canvas');
        if (!canvas) return;

        // 创建场景
        this.scene = new THREE.Scene();

        // 创建相机 - 调整视野角度和位置以更好地显示文字
        this.camera = new THREE.PerspectiveCamera(
            60,  // 从75减少到60，让视野更聚焦
            canvas.clientWidth / canvas.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 0, 6);  // 稍微拉远相机距离

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
        if (!this.skillsData || this.skillsData.length === 0) {
            console.warn('没有技能数据可显示');
            return;
        }

        this.skillsData.forEach((skill, index) => {
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

            // 添加文字标签 - 调整位置让文字更明显
            this.createTextLabel(skill.name, [skill.position[0], skill.position[1] - 2.2, skill.position[2]]);
        });
    }

    createTextLabel(text, position) {
        // 创建文字纹理
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512;  // 增加画布宽度
        canvas.height = 128; // 增加画布高度

        // 设置更大的字体和更好的样式
        context.fillStyle = '#ffffff';
        context.font = 'bold 36px Arial, sans-serif';  // 增大字体到36px并加粗
        context.textAlign = 'center';
        context.textBaseline = 'middle';

        // 添加文字阴影效果
        context.shadowColor = '#000000';
        context.shadowBlur = 4;
        context.shadowOffsetX = 2;
        context.shadowOffsetY = 2;

        // 绘制文字
        context.fillText(text, 256, 64);

        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            alphaTest: 0.1
        });
        const sprite = new THREE.Sprite(material);

        sprite.position.set(position[0], position[1] - 1.8, position[2]);
        sprite.scale.set(2, 0.5, 1);  // 增大缩放比例

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