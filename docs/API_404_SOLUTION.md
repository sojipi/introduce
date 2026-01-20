# ESA 部署 API 404 问题解决方案

## 问题描述

部署到阿里云 ESA 后，前端调用 `/api/frontend/skills` 等接口返回 404 错误。

## 根本原因

你的项目架构是：

```
前端 JS (浏览器)
    ↓ fetch('/api/frontend/skills')
admin-server.js (本地开发服务器)
    ↓ server/routes/frontend.js
    ↓ EdgeStorageCloudAdapter
    ↓ 调用云函数 KV API
https://kv.zenmb.com/kv/get?key=skills:list
    ↓
阿里云 ESA KV 存储
```

**问题**：ESA 只能托管静态文件（HTML、CSS、JS），无法运行 Node.js 服务器（admin-server.js），所以 `/api/frontend/*` 路由不存在。

## 解决方案总结

### 🎯 推荐方案：部署云函数 + ESA 路由代理

这是最简单、最优雅的方案，前端代码无需修改。

#### 步骤：

1. **部署前端 API 云函数**

   文件：`cloudfunction/frontend-api.js`

   这个云函数的作用：
   - 接收前端的 `/api/frontend/*` 请求
   - 调用你已有的 `https://kv.zenmb.com/kv/` 接口
   - 返回数据给前端

   部署到阿里云 ESA 边缘函数或 Cloudflare Workers：
   ```
   函数名称: frontend-api
   运行环境: JavaScript (ES Module)
   配置: KV_NAMESPACE=tech-showcase (在代码中已配置)
   ```

   部署后得到 URL：
   ```
   https://1234567890.cn-hangzhou.fc.aliyuncs.com/2016-08-15/proxy/tech-showcase/frontend-api/
   ```

2. **在 ESA 配置路由代理**

   在 ESA 控制台配置边缘规则：
   ```
   匹配路径: /api/frontend/*
   目标地址: https://你的云函数URL/$1
   ```

   这样前端调用 `/api/frontend/skills` 时，ESA 会自动转发到云函数。

3. **完成！**

   前端代码无需修改，直接部署即可：
   ```bash
   npm run deploy:esa
   ```

### 架构对比

#### 本地开发环境：
```
前端 JS → /api/frontend/skills
    ↓
admin-server.js (localhost:3002)
    ↓
server/routes/frontend.js
    ↓
https://kv.zenmb.com/kv/
    ↓
阿里云 ESA KV 存储
```

#### ESA 生产环境（配置路由代理后）：
```
前端 JS → /api/frontend/skills
    ↓
ESA 路由代理
    ↓
云函数 (frontend-api-simple.js)
    ↓
https://kv.zenmb.com/kv/
    ↓
阿里云 ESA KV 存储
```

## 详细文档

- **API 部署完整指南**：[docs/API_DEPLOYMENT.md](./API_DEPLOYMENT.md)
- **ESA 部署指南**：[docs/ESA_DEPLOYMENT.md](./ESA_DEPLOYMENT.md)

## 文件说明

### 新增文件

1. **cloudfunction/frontend-api-simple.js**
   - 前端 API 云函数
   - 调用 `https://kv.zenmb.com/kv/` 接口
   - 处理 `/api/frontend/*` 请求

2. **src/js/utils/kvClient.js**
   - 浏览器端 KV 客户端（备用方案）
   - 自动检测环境（本地/生产）
   - 统一 API 调用接口

3. **docs/API_DEPLOYMENT.md**
   - API 部署完整指南
   - 包含 3 种解决方案
   - 云函数部署详细步骤

### 修改文件

1. **docs/ESA_DEPLOYMENT.md**
   - 添加 API 代理配置说明
   - 标注为必须配置项

## 快速开始

### 1. 部署云函数

```bash
# 进入云函数目录
cd cloudfunction

# 将 frontend-api-simple.js 重命名为 index.js
cp frontend-api-simple.js index.js

# 使用阿里云控制台或 CLI 部署
# 详见 docs/API_DEPLOYMENT.md
```

### 2. 配置 ESA 路由

登录 ESA 控制台，添加边缘规则：
```
/api/frontend/* → https://你的云函数URL/$1
```

### 3. 部署静态文件

```bash
npm run deploy:esa
```

### 4. 测试

访问你的网站，检查浏览器控制台是否有 404 错误。

## 常见问题

### Q: 为什么不直接在前端调用 `https://kv.zenmb.com/kv/`？

A: 因为：
1. 前端代码已经写好了，调用的是 `/api/frontend/*`
2. `https://kv.zenmb.com/kv/` 是底层 KV 操作接口，前端需要的是业务接口（skills、projects 等）
3. 云函数可以做数据聚合、格式转换、缓存等优化

### Q: 云函数会增加成本吗？

A: 成本很低：
- 阿里云函数计算有免费额度（每月 100 万次调用）
- 个人网站流量小，基本在免费额度内
- 即使超出，成本也很低（约 ¥0.0001/次）

### Q: 可以不部署云函数吗？

A: 可以，但需要修改前端代码：
1. 修改所有前端模块的 API 调用地址
2. 或者使用 `src/js/utils/kvClient.js` 统一管理
3. 详见 docs/API_DEPLOYMENT.md 方案 B 和方案 C

### Q: ESA 路由代理配置不生效怎么办？

A: 检查：
1. 规则优先级是否正确
2. 路径匹配是否准确
3. 清除 ESA 缓存后重试
4. 查看 ESA 日志排查问题

## 总结

**问题**：ESA 部署后 `/api/frontend/*` 返回 404

**原因**：ESA 只能托管静态文件，无法运行 Node.js 服务器

**解决**：部署云函数 + ESA 路由代理

**优势**：
- ✅ 前端代码无需修改
- ✅ 配置简单，维护方便
- ✅ 性能好，成本低
- ✅ 符合 Serverless 架构最佳实践

---

**需要帮助？** 查看详细文档：
- [API_DEPLOYMENT.md](./API_DEPLOYMENT.md) - API 部署完整指南
- [ESA_DEPLOYMENT.md](./ESA_DEPLOYMENT.md) - ESA 部署指南
