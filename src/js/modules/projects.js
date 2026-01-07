export class ProjectShowcase {
    constructor() {
        this.projects = this.getProjectsData();
        this.currentCategory = 'web';
        this.init();
    }

    init() {
        this.setupTabs();
        this.renderProjects();
    }

    getProjectsData() {
        return {
            web: [
                {
                    title: '电商平台系统',
                    description: '全栈电商解决方案，包含用户管理、商品管理、订单处理、支付集成等完整功能',
                    icon: '🛒',
                    tech: ['React', 'Node.js', 'MongoDB', 'Redis', 'Stripe']
                },
                {
                    title: '实时协作工具',
                    description: '支持多人实时协作的在线文档编辑器，具备版本控制和权限管理',
                    icon: '📝',
                    tech: ['Vue.js', 'Socket.io', 'Express', 'PostgreSQL']
                },
                {
                    title: '数据可视化平台',
                    description: '企业级数据分析和可视化平台，支持多种图表类型和实时数据更新',
                    icon: '📊',
                    tech: ['Angular', 'D3.js', 'Python', 'FastAPI', 'ClickHouse']
                },
                {
                    title: '内容管理系统',
                    description: '灵活的CMS系统，支持多站点管理、SEO优化和内容发布工作流',
                    icon: '📰',
                    tech: ['Next.js', 'Strapi', 'GraphQL', 'MySQL']
                }
            ],
            mobile: [
                {
                    title: '健身追踪应用',
                    description: '个人健身数据追踪和分析应用，支持运动计划制定和社交分享',
                    icon: '💪',
                    tech: ['React Native', 'Firebase', 'Redux', 'Chart.js']
                },
                {
                    title: '智能记账应用',
                    description: '基于AI的智能记账应用，自动分类支出并提供财务分析报告',
                    icon: '💰',
                    tech: ['Flutter', 'TensorFlow Lite', 'SQLite', 'OCR']
                },
                {
                    title: '语言学习平台',
                    description: '互动式语言学习应用，包含语音识别、进度追踪和游戏化学习',
                    icon: '🗣️',
                    tech: ['Ionic', 'Angular', 'Speech API', 'PWA']
                }
            ],
            ai: [
                {
                    title: '智能客服系统',
                    description: '基于NLP的智能客服机器人，支持多轮对话和情感分析',
                    icon: '🤖',
                    tech: ['Python', 'TensorFlow', 'BERT', 'FastAPI', 'WebSocket']
                },
                {
                    title: '图像识别平台',
                    description: '计算机视觉平台，支持物体检测、人脸识别和图像分类',
                    icon: '👁️',
                    tech: ['PyTorch', 'OpenCV', 'YOLO', 'Flask', 'Docker']
                },
                {
                    title: '推荐系统引擎',
                    description: '个性化推荐系统，基于协同过滤和深度学习算法',
                    icon: '🎯',
                    tech: ['Spark', 'Kafka', 'Redis', 'Elasticsearch', 'MLflow']
                }
            ],
            game: [
                {
                    title: '3D塔防游戏',
                    description: '基于WebGL的3D塔防游戏，包含关卡编辑器和多人对战模式',
                    icon: '🏰',
                    tech: ['Three.js', 'WebGL', 'Socket.io', 'Cannon.js']
                },
                {
                    title: '2D平台跳跃游戏',
                    description: '像素风格的平台跳跃游戏，支持关卡编辑和成就系统',
                    icon: '🎮',
                    tech: ['Phaser.js', 'TypeScript', 'Tiled', 'Web Audio API']
                },
                {
                    title: '多人在线卡牌游戏',
                    description: '实时多人卡牌对战游戏，包含排位系统和卡牌收集',
                    icon: '🃏',
                    tech: ['Unity', 'C#', 'Photon', 'MySQL']
                }
            ],
            blockchain: [
                {
                    title: 'DeFi借贷平台',
                    description: '去中心化金融借贷平台，支持多种加密货币抵押和借贷',
                    icon: '🏦',
                    tech: ['Solidity', 'Web3.js', 'React', 'Hardhat', 'IPFS']
                },
                {
                    title: 'NFT交易市场',
                    description: '数字艺术品NFT交易平台，支持铸造、拍卖和版税分配',
                    icon: '🎨',
                    tech: ['Ethereum', 'OpenSea API', 'MetaMask', 'Pinata']
                },
                {
                    title: '供应链追溯系统',
                    description: '基于区块链的供应链透明度和产品溯源解决方案',
                    icon: '📦',
                    tech: ['Hyperledger Fabric', 'Go', 'CouchDB', 'Docker']
                }
            ]
        };
    }

    setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // 移除所有活动状态
                tabButtons.forEach(btn => btn.classList.remove('active'));

                // 添加当前活动状态
                button.classList.add('active');

                // 更新当前分类
                this.currentCategory = button.getAttribute('data-category');

                // 重新渲染项目
                this.renderProjects();
            });
        });
    }

    renderProjects() {
        const projectGrid = document.getElementById('project-grid');
        const projects = this.projects[this.currentCategory];

        // 清空现有内容
        projectGrid.innerHTML = '';

        // 渲染项目卡片
        projects.forEach((project, index) => {
            const projectCard = this.createProjectCard(project, index);
            projectGrid.appendChild(projectCard);
        });

        // 添加进入动画
        this.animateProjectCards();
    }

    createProjectCard(project, index) {
        const card = document.createElement('div');
        card.className = 'project-card';
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';

        card.innerHTML = `
            <div class="project-image">
                <span style="font-size: 3rem;">${project.icon}</span>
            </div>
            <div class="project-info">
                <h4>${project.title}</h4>
                <p>${project.description}</p>
                <div class="project-tech">
                    ${project.tech.map(tech =>
            `<span class="tech-tag">${tech}</span>`
        ).join('')}
                </div>
            </div>
        `;

        // 添加悬停效果
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-10px) scale(1.02)';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
        });

        // 添加点击事件
        card.addEventListener('click', () => {
            this.showProjectDetails(project);
        });

        return card;
    }

    animateProjectCards() {
        const cards = document.querySelectorAll('.project-card');

        cards.forEach((card, index) => {
            setTimeout(() => {
                card.style.transition = 'all 0.6s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    showProjectDetails(project) {
        // 创建模态框显示项目详情
        const modal = document.createElement('div');
        modal.className = 'project-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
            padding: 2rem;
            border-radius: 15px;
            max-width: 600px;
            width: 90%;
            color: white;
            border: 1px solid rgba(0, 212, 255, 0.3);
            transform: scale(0.8);
            transition: transform 0.3s ease;
        `;

        modalContent.innerHTML = `
            <div style="text-align: center; margin-bottom: 1.5rem;">
                <span style="font-size: 4rem;">${project.icon}</span>
                <h3 style="margin: 1rem 0; color: #00d4ff;">${project.title}</h3>
            </div>
            <p style="margin-bottom: 1.5rem; line-height: 1.6; color: #ccc;">
                ${project.description}
            </p>
            <div style="margin-bottom: 1.5rem;">
                <h4 style="margin-bottom: 0.5rem; color: #00d4ff;">技术栈:</h4>
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                    ${project.tech.map(tech =>
            `<span style="background: rgba(0, 212, 255, 0.2); color: #00d4ff; padding: 4px 12px; border-radius: 12px; font-size: 0.9rem;">${tech}</span>`
        ).join('')}
                </div>
            </div>
            <div style="text-align: center;">
                <button id="close-modal" style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; padding: 10px 20px; border-radius: 25px; cursor: pointer; font-size: 1rem;">
                    关闭
                </button>
            </div>
        `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // 显示动画
        setTimeout(() => {
            modal.style.opacity = '1';
            modalContent.style.transform = 'scale(1)';
        }, 10);

        // 关闭事件
        const closeModal = () => {
            modal.style.opacity = '0';
            modalContent.style.transform = 'scale(0.8)';
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        };

        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        document.getElementById('close-modal').addEventListener('click', closeModal);

        // ESC键关闭
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
    }
}