const axios = require('axios');
const fs = require('fs');

// Configuration
const API_BASE_URL = 'http://localhost:3002/api';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

let authToken = null;

// Login to get authentication token
async function login() {
    try {
        console.log('🔐 Logging in...');
        const response = await axios.post(`${API_BASE_URL}/auth/login`, {
            username: ADMIN_USERNAME,
            password: ADMIN_PASSWORD
        });

        if (response.data.success) {
            authToken = response.data.data.token;
            console.log('✅ Login successful');
            console.log('🔑 Token:', authToken.substring(0, 50) + '...');
            return true;
        } else {
            console.error('❌ Login failed:', response.data.message);
            return false;
        }
    } catch (error) {
        console.error('❌ Login error:', error.response?.data || error.message);
        return false;
    }
}

// Helper function to make authenticated API calls
async function apiCall(method, endpoint, data = null) {
    try {
        const config = {
            method,
            url: `${API_BASE_URL}${endpoint}`,
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        };

        if (data) {
            config.data = data;
        }

        const response = await axios(config);
        return response.data;
    } catch (error) {
        console.error(`❌ API call failed [${method} ${endpoint}]:`, error.response?.data || error.message);
        throw error;
    }
}

// Skills data extracted from resume
const skillsData = [
    // Programming Languages
    { name: 'Java', category: 'Programming Languages', level: 95, description: '15年经验，Spring Cloud微服务架构专家', icon: 'fab fa-java', color: '#f89820' },
    { name: 'Android', category: 'Mobile Development', level: 95, description: '资深Android开发，多年项目经验', icon: 'fab fa-android', color: '#3ddc84' },
    { name: 'JavaScript', category: 'Programming Languages', level: 90, description: 'Node.js后端开发，前端框架经验', icon: 'fab fa-js-square', color: '#f7df1e' },
    { name: 'Python', category: 'Programming Languages', level: 85, description: 'Django框架，数据分析', icon: 'fab fa-python', color: '#3776ab' },
    { name: 'C#', category: 'Programming Languages', level: 80, description: '自助售票机软件开发', icon: 'fas fa-code', color: '#239120' },
    { name: 'Go', category: 'Programming Languages', level: 85, description: '微服务架构，高性能后端开发', icon: 'fas fa-code', color: '#00add8' },

    // Frameworks & Technologies
    { name: 'Spring Cloud', category: 'Backend Frameworks', level: 95, description: '微服务架构，分布式系统专家', icon: 'fas fa-leaf', color: '#6db33f' },
    { name: 'Unity', category: 'Game Development', level: 90, description: '游戏开发，Timeline动画制作', icon: 'fas fa-gamepad', color: '#000000' },
    { name: 'React', category: 'Frontend Frameworks', level: 85, description: '前端开发，后台管理系统', icon: 'fab fa-react', color: '#61dafb' },
    { name: 'Vue.js', category: 'Frontend Frameworks', level: 85, description: '前端开发，响应式布局', icon: 'fab fa-vuejs', color: '#4fc08d' },
    { name: 'Node.js', category: 'Backend Frameworks', level: 85, description: '后端API开发，实时应用', icon: 'fab fa-node-js', color: '#339933' },
    { name: 'Docker', category: 'DevOps', level: 85, description: '容器化部署，微服务架构', icon: 'fab fa-docker', color: '#2496ed' },

    // Databases
    { name: 'MySQL', category: 'Databases', level: 90, description: '主从备份，读写分离', icon: 'fas fa-database', color: '#4479a1' },
    { name: 'MongoDB', category: 'Databases', level: 80, description: 'NoSQL数据库，文档存储', icon: 'fas fa-leaf', color: '#47a248' },
    { name: 'Redis', category: 'Databases', level: 85, description: '缓存系统，高性能存储', icon: 'fas fa-memory', color: '#dc382d' },

    // Cloud & DevOps
    { name: '阿里云', category: 'Cloud Platforms', level: 90, description: 'SAE部署，函数计算，OSS存储', icon: 'fas fa-cloud', color: '#ff6a00' },
    { name: 'Nginx', category: 'DevOps', level: 85, description: '负载均衡，反向代理', icon: 'fas fa-server', color: '#009639' },

    // Game Development
    { name: 'Cocos Creator', category: 'Game Development', level: 85, description: '小游戏开发，H5游戏', icon: 'fas fa-gamepad', color: '#35495e' },
    { name: 'Godot', category: 'Game Development', level: 75, description: '小游戏开发维护', icon: 'fas fa-gamepad', color: '#478cbf' },

    // Mobile Development
    { name: 'UniApp', category: 'Mobile Development', level: 85, description: '跨平台移动应用开发', icon: 'fas fa-mobile-alt', color: '#2b9939' },

    // Architecture & Design
    { name: '微服务架构', category: 'Architecture', level: 95, description: 'Spring Cloud，分布式系统设计', icon: 'fas fa-sitemap', color: '#6c757d' },
    { name: '系统架构', category: 'Architecture', level: 90, description: '技术选型，架构设计，团队管理', icon: 'fas fa-project-diagram', color: '#495057' }
];

// Projects data extracted from resume
const projectsData = [
    {
        title: 'hi校友挑战平台',
        description: '兼职任务平台，包含接任务、提交任务、后台审核、打款、提现等完整流程。支持自然用户、社团用户和渠道用户多种结算方式。',
        category: 'Web Application',
        tech: ['Spring Cloud', 'Vue.js', 'UniApp', '微信小程序'],
        icon: '🎯',
        status: 'completed'
    },
    {
        title: '高校社团管理系统',
        description: 'SAAS平台，包含总后台、学校后台、小程序。基于SpringCloud构建，采用微服务架构，支持多租户、权限管理、审批流程等功能。',
        category: 'Enterprise Software',
        tech: ['Spring Cloud', 'Vue.js', 'Element UI', 'UniApp', 'Docker', 'Nacos', 'Gateway'],
        icon: '🏫',
        status: 'completed'
    },
    {
        title: '会学习教学辅助SAAS系统',
        description: '以学生课后错题采集自动生成错题本为切入点，全面分析学生错题数据，提供给老师个性化布置作业的教学辅助系统。',
        category: 'Education Technology',
        tech: ['Golang', 'React', 'Taro', '阿里云函数计算', 'Dubbo'],
        icon: '📚',
        status: 'completed'
    },
    {
        title: '魔数精灵可可APP',
        description: '针对5-7岁儿童的数学思维训练线上产品。Unity开发的游戏化学习平台，支持课程热更新、学习数据分析、家长报告推送。',
        category: 'Education Game',
        tech: ['Unity', 'Timeline', 'Spine', 'XLua', 'AssetBundle', 'ThinkPHP', 'Django'],
        icon: '🧮',
        status: 'completed'
    },
    {
        title: '洞头智慧旅游导览系统',
        description: '包含手绘地图展示、设施位置、语音播放、详情页展示，以及微信摇一摇周边功能，通过iBeacon设备实现语音导览服务。',
        category: 'Tourism Technology',
        tech: ['微信公众号', 'iBeacon', 'Google Maps API', 'PHP'],
        icon: '🗺️',
        status: 'completed'
    },
    {
        title: '麦票向导平台',
        description: '类似滴滴雇导游的平台，导游发布信息，用户自助租导游。集成微信支付、退款、提现、通知等完整功能。',
        category: 'Service Platform',
        tech: ['PHP', '微信公众号', '微信支付'],
        icon: '🧭',
        status: 'completed'
    },
    {
        title: '景区自助售取票机软件',
        description: '类似电影院取票机，用户扫码支付购买景区门票，专用打印机打印二维码门票，支持闸机验证进入。',
        category: 'Hardware Integration',
        tech: ['C#', '支付宝API', '微信支付', '打印机接口'],
        icon: '🎫',
        status: 'completed'
    },
    {
        title: '就要K歌Android客户端',
        description: 'K歌游戏Android版本，实现演唱评分、闯关、猜歌、PK、成就等游戏玩法。基于Cocos2d-x引擎开发。',
        category: 'Entertainment App',
        tech: ['Android', 'Cocos2d-x', 'FFmpeg', 'JNI'],
        icon: '🎤',
        status: 'completed'
    },
    {
        title: '微游手机旅游导游软件',
        description: '基于三维地图的旅游导游软件，支持景区定位、路线规划、用户分享、360全景展示、语音导航等功能。',
        category: 'Tourism App',
        tech: ['Android', 'Google Maps API', 'Canvas', 'JNI', 'GPS定位'],
        icon: '📱',
        status: 'completed'
    }
];

// Timeline data extracted from resume (work history)
const timelineData = [
    {
        title: '开化其高信息技术有限公司 - 全栈工程师',
        description: '承接外包项目和远程技术支持，包括外卖商城平台、UniApp原生插件开发、旅游平台后台开发、游戏开发维护等。',
        type: 'work',
        status: 'current',
        date: '2023-12-01',
        location: '开化',
        organizer: '开化其高信息技术有限公司',
        result: '成功承接多个外包项目，提供专业技术支持'
    },
    {
        title: '杭州介子网络有限公司 - 技术总监',
        description: '负责新项目线技术架构设计，搭建开发测试环境，规范技术流程，搭建自动化平台。主导高校社团管理系统、兼职任务平台等项目开发。',
        type: 'work',
        status: 'completed',
        date: '2021-07-01',
        location: '杭州',
        organizer: '杭州介子网络有限公司',
        result: '成功开发多个SAAS平台，多家高校试用采购'
    },
    {
        title: '杭州华璋教育科技有限公司 - 技术经理',
        description: '维护基于Spring Cloud的微服务系统，重新组建团队重构系统，采用Go语言重写后端，使用MongoDB+TiDB集群。',
        type: 'work',
        status: 'completed',
        date: '2020-10-01',
        location: '杭州',
        organizer: '杭州华璋教育科技有限公司',
        result: '成功重构旧系统，提升系统性能和稳定性'
    },
    {
        title: '浙江魔数教育科技有限公司 - 技术总监',
        description: '完成《魔数精灵可可》从构思到上线运营全过程，包括技术选型、团队组建、架构设计、版本迭代等。',
        type: 'work',
        status: 'completed',
        date: '2017-04-01',
        location: '杭州',
        organizer: '浙江魔数教育科技有限公司',
        result: '产品成功上线运营1年多，无重大安全事故'
    },
    {
        title: '杭州麦票科技有限公司 - 技术合伙人',
        description: '为新公司提供全栈技术支持，开发自助售票机软件、微信公众号售票系统、租人系统、景区虚拟地图系统等。',
        type: 'work',
        status: 'completed',
        date: '2015-01-01',
        location: '杭州',
        organizer: '杭州麦票科技有限公司',
        result: '成功完成技术包装，虚拟地图项目获得融资'
    },
    {
        title: '开化其高信息技术有限公司 - 创业',
        description: '自主创业，为企业提供信息技术支持，用程序开发解决传统企业重复劳动，提高生产效率。',
        type: 'entrepreneurship',
        status: 'completed',
        date: '2013-03-01',
        location: '开化',
        organizer: '开化其高信息技术有限公司',
        result: '成功创办公司，为当地企业提供技术支持'
    },
    {
        title: '杭州凯歌科技有限公司 - 游戏开发工程师',
        description: '开发Android版K歌应用，完成基于Cocos2d-x的K歌游戏Android部分代码，涉及FFmpeg编译使用、音频处理等。',
        type: 'work',
        status: 'completed',
        date: '2011-04-01',
        location: '杭州',
        organizer: '杭州凯歌科技有限公司',
        result: '成功完成K歌应用开发，实现演唱评分功能'
    },
    {
        title: '杭州卓锐信息技术有限公司 - Android开发部门经理',
        description: '负责"微游"手机旅游导游软件Android客户端开发，领导团队完成版本迭代，设计三维地图位置转换算法。',
        type: 'work',
        status: 'completed',
        date: '2010-09-01',
        location: '杭州',
        organizer: '杭州卓锐信息技术有限公司',
        result: '成功开发微游应用，建设开发团队'
    },
    {
        title: '浙江大学软件工程专业毕业',
        description: '获得软件工程学士学位，毕业设计为政府机关绩效管理系统，获得校优秀毕业论文。',
        type: 'education',
        status: 'completed',
        date: '2011-06-01',
        location: '杭州',
        organizer: '浙江大学',
        result: '获得学士学位，优秀毕业论文'
    }
];

// Awards/Achievements data
const awardsData = [
   
    {
        title: '狼人杀agent挑战赛',
        competition: '狼人杀agent挑战赛',
        type: 'gold',
        level: 'national',
        date: '2025-12-24',
        description: 'AI狼人杀agent挑战赛获奖',
        technologies: 'AI, Agent, 游戏开发',
        teamMembers: '团队项目'
    },
    {
        title: '麻将贪食蛇',
        competition: 'AI+互动游戏挑战赛',
        type: 'silver',
        level: 'national',
        date: '2025-12-21',
        description: 'AI+互动游戏挑战赛获奖作品',
        technologies: 'AI, 游戏开发, 互动游戏',
        teamMembers: '团队项目'
    }
];

// Main population function
async function populateResumeData() {
    console.log('🚀 Starting resume data population...');

    // Login first
    const loginSuccess = await login();
    if (!loginSuccess) {
        console.error('❌ Failed to login, aborting...');
        return;
    }

    try {
        // Populate Skills
        console.log('\n📊 Populating skills...');
        for (const skill of skillsData) {
            try {
                const result = await apiCall('POST', '/skills', skill);
                console.log(`✅ Created skill: ${skill.name}`);
            } catch (error) {
                console.error(`❌ Failed to create skill: ${skill.name}`);
            }
        }

        // Populate Projects
        console.log('\n🚀 Populating projects...');
        for (const project of projectsData) {
            try {
                const result = await apiCall('POST', '/projects', project);
                console.log(`✅ Created project: ${project.title}`);
            } catch (error) {
                console.error(`❌ Failed to create project: ${project.title}`);
            }
        }

        // Populate Timeline
        console.log('\n📅 Populating timeline...');
        for (const event of timelineData) {
            try {
                const result = await apiCall('POST', '/timeline', event);
                console.log(`✅ Created timeline event: ${event.title}`);
            } catch (error) {
                console.error(`❌ Failed to create timeline event: ${event.title}`);
            }
        }

        // Populate Awards
        console.log('\n🏆 Populating awards...');
        for (const award of awardsData) {
            try {
                const result = await apiCall('POST', '/awards', award);
                console.log(`✅ Created award: ${award.title}`);
            } catch (error) {
                console.error(`❌ Failed to create award: ${award.title}`);
            }
        }

        console.log('\n🎉 Resume data population completed!');
        console.log('\n📈 Summary:');
        console.log(`- Skills: ${skillsData.length} items`);
        console.log(`- Projects: ${projectsData.length} items`);
        console.log(`- Timeline Events: ${timelineData.length} items`);
        console.log(`- Awards: ${awardsData.length} items`);

    } catch (error) {
        console.error('❌ Error during data population:', error);
    }
}

// Run the population
if (require.main === module) {
    populateResumeData().catch(console.error);
}

module.exports = { populateResumeData };