# 技术实力展示项目

一个现代化的个人技术作品集网站，展示全栈开发能力、项目经验和竞赛获奖情况。包含前端展示页面和后台管理系统。

## 🚀 项目特色

### 前端展示
- **动态技能展示**: 技能数据从后台API动态加载，支持实时更新
- **3D可视化**: 使用Three.js创建交互式3D技能展示
- **粒子系统**: 动态粒子背景和交互效果
- **GSAP动画**: 流畅的页面过渡和元素动画
- **Chart.js图表**: 数据可视化展示获奖情况
- **响应式设计**: 完美适配各种设备尺寸

### 后台管理
- **技能管理**: 动态添加、编辑、删除技能，支持分类管理和等级调整
- **项目管理**: 创建、编辑、删除技术项目
- **获奖管理**: 记录竞赛获奖情况
- **时间线管理**: 管理参赛和活动日程
- **数据存储**: 基于阿里云边缘存储
- **实时同步**: 后台修改的数据实时同步到前端展示

## 🛠️ 技术栈

### 前端技术
- **HTML5**: 语义化标签、无障碍设计
- **SCSS**: 模块化样式、变量系统、响应式设计
- **JavaScript ES6+**: 模块化开发、异步处理
- **Three.js**: 3D图形渲染
- **GSAP**: 高性能动画库
- **Chart.js**: 数据图表

### 后端技术
- **Node.js**: 服务器运行环境
- **Express**: Web应用框架
- **阿里云边缘存储**: 数据存储服务
- **JWT**: 身份认证
- **bcryptjs**: 密码加密

### 管理后台
- **Vue 3**: 渐进式JavaScript框架
- **Element Plus**: Vue 3组件库
- **Vue Router**: 路由管理
- **Axios**: HTTP客户端

## 📁 项目结构

```
tech-showcase-portfolio/
├── index.html              # 前端主页面
├── admin-server.js         # 服务器入口
├── package.json            # 项目配置
├── .env.example           # 环境变量模板
├── start.bat              # Windows启动脚本
├── start.sh               # Linux/Mac启动脚本
├── src/                   # 前端源码
│   ├── styles/
│   │   ├── main.scss      # 主样式文件
│   │   └── variables.scss # SCSS变量
│   └── js/
│       ├── main.js        # 主入口文件
│       └── modules/       # 功能模块
└── admin/                 # 后台管理系统
    ├── public/            # 管理后台前端
    ├── routes/            # API路由
    ├── services/          # 服务层
    └── scripts/           # 脚本文件
```

## 🚀 快速开始

### 环境要求
- Node.js 16+
- npm 或 yarn
- 阿里云账户（用于边缘存储服务）

### 1. 克隆项目
```bash
git clone <repository-url>
cd tech-showcase-portfolio
```

### 2. 安装依赖
```bash
npm install
```

### 3. 环境配置
复制环境变量模板：
```bash
cp .env.example .env
```

编辑 `.env` 文件，配置阿里云边缘存储参数：
```env
# 阿里云边缘存储配置
ALIYUN_ACCESS_KEY_ID=your-access-key-id
ALIYUN_ACCESS_KEY_SECRET=your-access-key-secret
ALIYUN_ESA_ENDPOINT=https://esa.cn-hangzhou.aliyuncs.com
ALIYUN_ESA_NAMESPACE=tech-showcase

# JWT密钥
JWT_SECRET=your-super-secret-jwt-key-here
```

### 4. 启动项目

**Windows:**
```bash
start.bat
```

**Linux/Mac:**
```bash
chmod +x start.sh
./start.sh
```

**或者手动启动:**
```bash
# 初始化管理员账户
npm run init-admin

# 启动服务器
npm start
```

### 5. 访问项目
- **前端展示**: http://localhost:3001
- **管理后台**: http://localhost:3001/admin
- **默认账户**: admin / admin123

## 🔧 阿里云边缘存储配置

### 1. 开通服务
1. 登录阿里云控制台
2. 开通边缘安全加速(ESA)服务
3. 创建边缘存储空间

### 2. 获取访问密钥
1. 访问RAM控制台
2. 创建AccessKey
3. 配置ESA服务权限

### 3. 配置存储空间
1. 在ESA控制台创建NameSpace
2. 记录NameSpace名称
3. 配置访问策略

## 📱 功能说明

### 前端展示页面
- **英雄区域**: 打字机效果、统计数字动画、3D背景
- **技能展示**: 技能条动画、3D技能方块展示
- **项目展示**: 分类展示、项目详情弹窗
- **获奖展示**: 饼图统计、获奖详情展示
- **参赛日程**: 交互式时间线展示
- **联系表单**: 表单验证、提交动画

### 后台管理系统
- **仪表板**: 数据统计概览、图表展示
- **技能管理**: 
  - 动态添加新技能，支持自定义图标和颜色
  - 按分类组织技能（前端、后端、工具、移动开发等）
  - 实时调整技能等级（0-100%）
  - 技能数据实时同步到前端展示页面
- **项目管理**: CRUD操作、分类管理、状态管理
- **获奖管理**: 获奖记录管理、统计分析
- **时间线管理**: 事件管理、状态跟踪
- **存储管理**: 数据浏览、备份恢复

## 🔒 安全特性

- **JWT认证**: 基于Token的身份验证
- **密码加密**: bcrypt加密存储密码
- **权限控制**: 基于角色的访问控制
- **数据验证**: 前后端双重数据验证
- **CORS配置**: 跨域请求安全控制

## 📊 开发指南

### 动态技能管理
现在技能展示已经完全动态化！你可以通过后台管理系统轻松管理技能：

1. **添加新技能**:
   - 访问后台管理 → 技能管理
   - 点击"添加技能"按钮
   - 填写技能名称、选择分类、设置等级
   - 自定义图标类名和颜色
   - 保存后前端页面会自动更新

2. **编辑现有技能**:
   - 在技能卡片上点击编辑按钮
   - 修改技能信息
   - 保存后立即生效

3. **技能分类**:
   - 前端技术 (frontend)
   - 后端技术 (backend)
   - 开发工具 (tools)
   - 移动开发 (mobile)
   - 数据库 (database)
   - DevOps (devops)
   - 人工智能 (ai)
   - 设计工具 (design)
   - 其他技能 (other)

### 添加新项目类型
1. 在 `src/js/modules/projects.js` 中添加新的项目数据
2. 在后台管理系统中创建对应的项目记录
3. 数据会自动同步到前端展示

### 自定义样式
修改 `src/styles/variables.scss` 中的变量：
```scss
$primary-color: #00d4ff;
$secondary-color: #ff6b6b;
$accent-color: #4ecdc4;
```

### API接口
- `GET /api/frontend/showcase` - **统一接口**：获取前端展示页面所需的所有数据（推荐）
- `GET /api/skills?format=grouped` - 获取按分类分组的技能数据
- `POST /api/skills` - 创建技能（需要认证）
- `PUT /api/skills/:id` - 更新技能（需要认证）
- `DELETE /api/skills/remove` - 删除技能（需要认证）
- `GET /api/projects` - 获取项目列表
- `POST /api/projects` - 创建项目（需要认证）
- `GET /api/awards` - 获取获奖记录
- `GET /api/timeline` - 获取时间线事件

### 性能优化
为了提升前端页面加载性能，我们实现了统一数据接口：

**优化前**: 前端需要调用5个不同的API接口
```javascript
// 多个API请求
GET /api/skills?format=grouped
GET /api/projects  
GET /api/awards
GET /api/timeline
GET /api/skills/stats/summary
```

**优化后**: 使用单一统一接口
```javascript
// 单个API请求获取所有数据
GET /api/frontend/showcase
```

**性能提升**:
- 🚀 减少80%的HTTP请求 (5个 → 1个)
- ⚡ 降低网络延迟和服务器负载
- 💾 提升数据缓存效率
- 🔄 改善用户体验

## 🚀 部署指南

### 生产环境部署
1. 设置环境变量 `NODE_ENV=production`
2. 配置正确的阿里云存储参数
3. 使用 PM2 或 Docker 部署
4. 配置 Nginx 反向代理

### Docker部署
```bash
# 构建镜像
docker build -t tech-showcase .

# 运行容器
docker run -d -p 3001:3001 --env-file .env tech-showcase
```

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 🌐 技术支持

本项目由阿里云ESA提供加速、计算和保护

![阿里云ESA](https://img.alicdn.com/imgextra/i3/O1CN01H1UU3i1Cti9lYtFrs_!!6000000000139-2-tps-7534-844.png)

---

**展示你的技术实力，让作品为你发声！** 🚀