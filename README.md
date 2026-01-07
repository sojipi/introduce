# 技术实力展示项目

一个现代化的个人技术作品集网站，展示全栈开发能力、项目经验和竞赛获奖情况。

## 🚀 项目特色

### 技术炫技展示
- **3D可视化**: 使用Three.js创建交互式3D技能展示
- **粒子系统**: 动态粒子背景和交互效果
- **GSAP动画**: 流畅的页面过渡和元素动画
- **Chart.js图表**: 数据可视化展示获奖情况
- **响应式设计**: 完美适配各种设备尺寸

### 功能模块
- **英雄区域**: 打字机效果、统计数字动画、3D背景
- **技能展示**: 技能条动画、3D技能方块、雷达图
- **项目展示**: 分类展示、项目详情弹窗、悬停效果
- **获奖展示**: 饼图统计、获奖详情、时间轴
- **参赛日程**: 交互式时间线、状态筛选、数据导出
- **联系表单**: 表单验证、提交动画、通知系统

## 🛠️ 技术栈

### 前端技术
- **HTML5**: 语义化标签、无障碍设计
- **SCSS**: 模块化样式、变量系统、响应式设计
- **JavaScript ES6+**: 模块化开发、异步处理
- **Vite**: 现代化构建工具、热重载

### 动画和可视化
- **Three.js**: 3D图形渲染、WebGL
- **GSAP**: 高性能动画库
- **Particles.js**: 粒子系统
- **Chart.js**: 数据图表
- **AOS**: 滚动动画

### 开发工具
- **Vite**: 快速开发服务器
- **SCSS**: CSS预处理器
- **ES6 Modules**: 模块化架构

## 📁 项目结构

```
tech-showcase-portfolio/
├── index.html              # 主页面
├── package.json            # 项目配置
├── vite.config.js          # Vite配置
├── README.md              # 项目说明
├── src/
│   ├── styles/
│   │   ├── main.scss      # 主样式文件
│   │   └── variables.scss  # SCSS变量
│   └── js/
│       ├── main.js        # 主入口文件
│       └── modules/
│           ├── particles.js    # 粒子系统
│           ├── skills3d.js     # 3D技能展示
│           ├── projects.js     # 项目展示
│           ├── timeline.js     # 时间线管理
│           ├── animations.js   # 动画控制
│           └── charts.js       # 图表管理
```

## 🚀 快速开始

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

### 预览生产版本
```bash
npm run preview
```

## 🎨 自定义配置

### 修改个人信息
编辑 `src/js/modules/` 下的相关文件：

1. **项目数据** - `projects.js`
2. **时间线数据** - `timeline.js`
3. **技能数据** - `skills3d.js`
4. **获奖数据** - `charts.js`

### 样式定制
修改 `src/styles/variables.scss` 中的变量：

```scss
// 主题颜色
$primary-color: #00d4ff;
$secondary-color: #ff6b6b;
$accent-color: #4ecdc4;

// 背景色
$dark-bg: #0a0a0a;
$darker-bg: #000000;
```

### 动画配置
在 `src/js/modules/animations.js` 中调整动画参数：

```javascript
// 修改动画持续时间
const defaults = {
    duration: 1000,  // 毫秒
    ease: 'power2.out'
};
```

## 📱 响应式设计

项目采用移动优先的响应式设计：

- **移动端** (< 768px): 单列布局、简化导航
- **平板端** (768px - 1024px): 双列布局、适中间距
- **桌面端** (> 1024px): 多列布局、完整功能

## 🎯 性能优化

- **代码分割**: 模块化加载
- **图片优化**: WebP格式支持
- **CSS优化**: 关键路径CSS内联
- **JavaScript优化**: 懒加载和防抖节流
- **缓存策略**: 静态资源缓存

## 🔧 浏览器支持

- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 联系方式

- 邮箱: your.email@example.com
- GitHub: github.com/yourusername
- LinkedIn: linkedin.com/in/yourprofile

---

**展示你的技术实力，让作品为你发声！** 🚀