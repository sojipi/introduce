# 阿里云 ESA 部署指南

## 🎯 项目架构说明

你的项目是**纯静态前端 + 云函数 API**的架构，非常适合 ESA 部署：

```
┌─────────────────────────────────────┐
│         阿里云 ESA (边缘加速)        │
├─────────────────────────────────────┤
│  前端页面 (index.html)              │
│  Admin 后台 (admin/index.html)      │
│  静态资源 (CSS, JS, 图片)           │
└─────────────────────────────────────┘
              ↓ API 请求
┌─────────────────────────────────────┐
│      阿里云函数计算 (已部署)         │
├─────────────────────────────────────┤
│  /api/awards                        │
│  /api/projects                      │
│  /api/timeline                      │
│  /api/skills                        │
└─────────────────────────────────────┘
              ↓ 数据存储
┌─────────────────────────────────────┐
│      阿里云 KV 存储 (已配置)         │
└─────────────────────────────────────┘
```

**`admin-server.js` 只是本地开发服务器，生产环境不需要！**

---

## 🚀 快速部署步骤

### 1. 准备部署文件

```bash
# 运行部署准备脚本
npm run deploy:esa
```

这会：
- ✅ 构建前端 (`npm run build`)
- ✅ 复制所有静态文件到 `deploy/` 目录
- ✅ 生成部署说明文档

### 2. 上传到 ESA

#### 方式 A: 通过 ESA 控制台（推荐）

1. 登录 [阿里云 ESA 控制台](https://esa.console.aliyun.com/)
2. 选择你的站点
3. 进入 **Pages** 功能
4. 点击 **上传文件**
5. 上传 `deploy/` 目录下的所有文件

#### 方式 B: 通过 CLI（如果有）

```bash
# 安装 ESA CLI（如果阿里云提供）
npm install -g @alicloud/esa-cli

# 登录
esa login

# 部署
esa deploy deploy/
```

### 3. 配置路由规则（⚠️ 重要！必须配置）

**访问 `/admin` 返回 404 的原因**：ESA 默认只查找对应路径的文件，访问 `/admin` 时会查找 `admin` 文件（而不是 `admin/index.html`），导致 404。

在 ESA 控制台 → **边缘规则** → **添加规则**，配置以下路由：

#### 规则 1：主页路由
```
规则名称: 主页路由
匹配条件: 路径等于 /
执行动作: 重写 URL
目标路径: /index.html
```

#### 规则 2：Admin 后台入口
```
规则名称: Admin 后台入口
匹配条件: 路径等于 /admin
执行动作: 重写 URL
目标路径: /admin/index.html
```

#### 规则 3：Admin 子路由
```
规则名称: Admin 子路由
匹配条件: 路径匹配 /admin/*
执行动作: 重写 URL
目标路径: /admin/index.html
```

**配置完成后**：
1. 保存并发布规则
2. 清除 ESA 缓存
3. 访问 `https://me.zenmb.com/admin` 应该能正常显示

详细配置说明请参考：[docs/ESA_ROUTING_CONFIG.md](./ESA_ROUTING_CONFIG.md)

### 4. 配置 API 代理（⚠️ 重要！必须配置）

**部署到 ESA 后，前端调用 `/api/frontend/*` 会返回 404**，因为 ESA 只能托管静态文件，无法运行 Node.js 服务器。

你需要配置 API 路由代理，将前端 API 请求转发到云函数。

#### 方案 A：部署云函数 + ESA 路由代理（推荐 ⭐）

1. **部署前端 API 云函数**

   将 `cloudfunction/frontend-api.js` 部署到阿里云 ESA 边缘函数：

   - 函数名称：`frontend-api`
   - 运行环境：JavaScript (ES Module)
   - 配置：代码中已配置 `KV_NAMESPACE=tech-showcase`

   部署后获得 URL，例如：
   ```
   https://your-domain.com/api/frontend/
   ```

   或者部署到 Cloudflare Workers 也可以。

2. **在 ESA 配置路由规则**

   在 ESA 控制台 → 边缘规则 → 添加规则：

   ```
   规则类型: URL 重写 或 反向代理
   匹配条件: 路径匹配 /api/frontend/*
   目标地址: https://你的云函数URL/$1
   ```

   配置示例：
   ```
   /api/frontend/skills → https://1234567890.cn-hangzhou.fc.aliyuncs.com/.../skills
   /api/frontend/projects → https://1234567890.cn-hangzhou.fc.aliyuncs.com/.../projects
   /api/frontend/awards → https://1234567890.cn-hangzhou.fc.aliyuncs.com/.../awards
   /api/frontend/timeline → https://1234567890.cn-hangzhou.fc.aliyuncs.com/.../timeline
   ```

#### 方案 B：修改前端代码直接调用云函数

如果不想配置 ESA 路由，可以修改前端代码：

1. 编辑 `src/js/utils/kvClient.js`，更新云函数 URL
2. 修改前端模块使用新的 API 客户端
3. 重新构建：`npm run build`
4. 重新部署：`npm run deploy:esa`

详细步骤请参考：[docs/API_DEPLOYMENT.md](./API_DEPLOYMENT.md)

**⚠️ 如果不配置 API 路由，前端将无法获取数据！**

### 5. 配置 HTTPS 和域名

1. 在 ESA 控制台绑定自定义域名
2. 启用 HTTPS
3. 配置 SSL 证书（ESA 可以自动申请）

---

## ⚙️ 配置检查清单

### 前端配置

确保前端代码中的 API 地址正确：

```javascript
// 检查这些文件
src/js/modules/awards.js
src/js/modules/projects.js
src/js/modules/timeline.js
src/js/modules/skills.js

// API 地址应该指向你的云函数
const API_BASE = 'https://your-cloudfunction-url.com/api';
```

### 云函数配置

确保云函数配置了 CORS：

```javascript
// 云函数中添加 CORS 头
res.setHeader('Access-Control-Allow-Origin', 'https://your-domain.com');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
```

### 环境变量

确保云函数中配置了：
- ✅ `KV_NAMESPACE_ID` - KV 存储命名空间 ID
- ✅ `KV_API_TOKEN` - KV API Token
- ✅ `ADMIN_TOKEN` - 管理员令牌
- ✅ `JWT_SECRET` - JWT 密钥

---

## 📁 部署文件结构

```
deploy/
├── index.html              # 主页
├── assets/                 # 前端资源
│   ├── main-[hash].js
│   ├── main-[hash].css
│   └── ...
├── admin/                  # Admin 后台
│   ├── index.html
│   └── assets/
├── sw.js                   # Service Worker
├── manifest.json           # PWA 配置
├── qrcode.jpg              # 微信二维码
├── favicon.ico             # 网站图标
└── icons/                  # PWA 图标
```

---

## 🔧 本地测试

部署前可以本地测试部署文件：

```bash
# 安装 http-server
npm install -g http-server

# 进入部署目录
cd deploy

# 启动服务器
http-server -p 8080 --cors

# 访问 http://localhost:8080
```

---

## 🎨 ESA 优势

部署到 ESA 后，你的网站会自动获得：

- ✅ **全球 CDN 加速** - 边缘节点分发
- ✅ **HTTPS 加密** - 自动 SSL 证书
- ✅ **DDoS 防护** - 安全防护
- ✅ **智能缓存** - 自动缓存优化
- ✅ **HTTP/2** - 更快的加载速度
- ✅ **GZIP 压缩** - 自动压缩
- ✅ **边缘计算** - Service Worker 支持

---

## 🐛 常见问题

### 1. API 请求失败（CORS 错误）

**问题**: 浏览器控制台显示 CORS 错误

**解决**:
- 方案 A: 在云函数中配置 CORS 头
- 方案 B: 在 ESA 配置 API 代理

### 2. Admin 后台 404

**问题**: 访问 `/admin` 返回 404

**解决**: 在 ESA 配置路由规则，将 `/admin` 和 `/admin/*` 指向 `admin/index.html`

### 3. Service Worker 不工作

**问题**: PWA 功能不生效

**解决**:
- 确保使用 HTTPS
- 检查 `sw.js` 文件是否正确上传
- 清除浏览器缓存重试

### 4. 静态资源 404

**问题**: CSS/JS 文件加载失败

**解决**:
- 检查 `index.html` 中的资源路径是否正确
- 确保 `assets/` 目录已上传
- 检查 ESA 缓存设置

### 5. 更新后看不到变化

**问题**: 部署新版本后，网站没有更新

**解决**:
- 在 ESA 控制台清除缓存
- 更新 Service Worker 版本号
- 使用强制刷新 (Ctrl+Shift+R)

---

## 📊 性能监控

部署后，可以通过以下方式监控性能：

1. **ESA 控制台** - 查看流量、带宽、请求数
2. **浏览器 DevTools** - 查看加载时间、资源大小
3. **性能监控面板** - 网站右下角的 ⚡ 按钮

---

## 🔄 更新部署

当你修改代码后，重新部署：

```bash
# 1. 准备新的部署文件
npm run deploy:esa

# 2. 上传到 ESA（覆盖旧文件）

# 3. 清除 ESA 缓存

# 4. 访问网站验证更新
```

---

## 💰 成本估算

ESA 按流量计费，对于个人网站：

- **流量**: ~¥0.24/GB
- **请求数**: ~¥0.01/万次
- **预估**: 月访问 1000 次，约 ¥5-10/月

**比 ECS 服务器便宜很多！**

---

## 🎉 部署完成

部署完成后：

1. ✅ 访问你的域名查看网站
2. ✅ 测试 Admin 后台功能
3. ✅ 检查 API 请求是否正常
4. ✅ 测试 PWA 功能（安装到桌面）
5. ✅ 查看性能监控面板

---

## 📞 需要帮助？

如果遇到问题：

1. 查看 ESA 控制台的日志
2. 检查浏览器控制台的错误信息
3. 参考阿里云 ESA 文档
4. 联系阿里云技术支持

---

**祝部署顺利！🚀**
