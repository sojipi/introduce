# 前端 API 部署指南

## 问题说明

部署到 ESA 后，前端调用 `/api/frontend/*` 接口会返回 404 错误。

### 原因分析

```
本地开发环境：
前端 JS → /api/frontend/skills → admin-server.js → server/routes/frontend.js → https://kv.zenmb.com/kv/

ESA 生产环境：
前端 JS → /api/frontend/skills → ❌ 404 (ESA 上没有这个路由)
```

ESA 只能托管静态文件，无法运行 Node.js 服务器（admin-server.js），所以 `/api/frontend/*` 路由不存在。

---

## 解决方案

有 **3 种方案** 可以解决这个问题：

### 方案 A：在 ESA 配置路由代理（推荐 ⭐）

在阿里云 ESA 控制台配置边缘规则，将 `/api/frontend/*` 代理到云函数。

#### 步骤：

1. **部署云函数**

   将 `cloudfunction/frontend-api-simple.js` 部署到阿里云函数计算：

   ```bash
   # 1. 进入云函数目录
   cd cloudfunction

   # 2. 创建函数（使用阿里云 CLI 或控制台）
   # 函数名称: frontend-api
   # 运行时: Node.js 18
   # 入口函数: index.handler
   ```

   配置环境变量：
   ```
   KV_NAMESPACE=tech-showcase
   ```

   部署后会得到一个 URL，例如：
   ```
   https://1234567890.cn-hangzhou.fc.aliyuncs.com/2016-08-15/proxy/frontend-api/
   ```

2. **在 ESA 配置路由规则**

   登录 [阿里云 ESA 控制台](https://esa.console.aliyun.com/)，配置边缘规则：

   ```
   规则类型: URL 重写
   匹配条件: 路径匹配 /api/frontend/*
   目标地址: https://1234567890.cn-hangzhou.fc.aliyuncs.com/2016-08-15/proxy/frontend-api/$1
   ```

   或者使用反向代理：

   ```
   规则类型: 反向代理
   源路径: /api/frontend/*
   目标地址: https://1234567890.cn-hangzhou.fc.aliyuncs.com/2016-08-15/proxy/frontend-api/
   ```

3. **测试**

   部署完成后，访问：
   ```
   https://your-domain.com/api/frontend/skills
   ```

   应该返回技能数据。

---

### 方案 B：修改前端代码，直接调用云函数

修改前端 JS 代码，让它根据环境自动选择 API 地址。

#### 步骤：

1. **部署云函数**（同方案 A）

2. **修改前端模块**

   在每个前端模块中，修改 API 调用地址：

   ```javascript
   // src/js/modules/skills.js
   async loadAllData() {
       try {
           // 根据环境选择 API 地址
           const isLocal = window.location.hostname === 'localhost';
           const apiBase = isLocal
               ? '/api/frontend'  // 本地开发
               : 'https://1234567890.cn-hangzhou.fc.aliyuncs.com/2016-08-15/proxy/frontend-api';  // 生产环境

           const response = await fetch(`${apiBase}/skills`);
           // ...
       }
   }
   ```

   需要修改的文件：
   - `src/js/modules/skills.js:25`
   - `src/js/modules/projects.js:28`
   - `src/js/modules/awards.js:27`
   - `src/js/modules/timeline.js:25`

3. **重新构建和部署**

   ```bash
   npm run build
   npm run deploy:esa
   ```

---

### 方案 C：使用统一的 API 配置文件（最佳实践 ⭐⭐）

创建一个统一的 API 配置模块，所有前端模块都使用它。

#### 步骤：

1. **创建 API 配置文件**

   已创建：`src/js/utils/kvClient.js`

   这个文件会自动检测环境：
   - 本地开发：使用 `/api/frontend`
   - 生产环境：使用云函数 URL

2. **修改前端模块使用新的客户端**

   例如修改 `src/js/modules/skills.js`：

   ```javascript
   import { kvClient } from '../utils/kvClient.js';

   async loadAllData() {
       try {
           const data = await kvClient.getSkills();
           if (data.success) {
               this.skills = data.data;
           }
       } catch (error) {
           console.error('加载技能数据失败:', error);
       }
   }
   ```

3. **更新 kvClient.js 中的生产环境 URL**

   编辑 `src/js/utils/kvClient.js`，将云函数 URL 替换为实际地址：

   ```javascript
   if (isLocal) {
       this.baseUrl = '/api/frontend';
   } else {
       // 替换为你的云函数 URL
       this.baseUrl = 'https://1234567890.cn-hangzhou.fc.aliyuncs.com/2016-08-15/proxy/frontend-api';
   }
   ```

4. **重新构建和部署**

   ```bash
   npm run build
   npm run deploy:esa
   ```

---

## 推荐方案对比

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| **方案 A：ESA 路由代理** | 前端代码无需修改，配置简单 | 需要在 ESA 控制台配置 | ⭐⭐⭐⭐⭐ |
| **方案 B：直接调用云函数** | 不依赖 ESA 配置 | 需要修改多个文件，维护困难 | ⭐⭐ |
| **方案 C：统一 API 配置** | 代码结构清晰，易于维护 | 需要重构前端代码 | ⭐⭐⭐⭐ |

**最终推荐**：
- **快速上线**：使用方案 A（ESA 路由代理）
- **长期维护**：使用方案 C（统一 API 配置）

---

## 云函数部署详细步骤

### 使用阿里云控制台部署

1. 登录 [阿里云函数计算控制台](https://fc.console.aliyun.com/)

2. 创建服务：
   - 服务名称：`tech-showcase`
   - 日志配置：启用日志服务（可选）

3. 创建函数：
   - 函数名称：`frontend-api`
   - 运行环境：`Node.js 18`
   - 函数入口：`index.handler`
   - 函数代码：上传 `cloudfunction/frontend-api-simple.js`（重命名为 `index.js`）

4. 配置环境变量：
   ```
   KV_NAMESPACE=tech-showcase
   ```

5. 配置触发器：
   - 触发器类型：HTTP 触发器
   - 请求方法：GET, POST, OPTIONS
   - 认证方式：anonymous（匿名访问）

6. 获取函数 URL：
   ```
   https://1234567890.cn-hangzhou.fc.aliyuncs.com/2016-08-15/proxy/tech-showcase/frontend-api/
   ```

### 使用 Serverless Devs 部署

1. 安装 Serverless Devs：
   ```bash
   npm install -g @serverless-devs/s
   ```

2. 配置密钥：
   ```bash
   s config add
   ```

3. 创建 `s.yaml` 配置文件：
   ```yaml
   edition: 1.0.0
   name: tech-showcase
   access: default

   services:
     frontend-api:
       component: fc
       props:
         region: cn-hangzhou
         service:
           name: tech-showcase
         function:
           name: frontend-api
           runtime: nodejs18
           codeUri: ./cloudfunction
           handler: frontend-api-simple.handler
           memorySize: 512
           timeout: 10
           environmentVariables:
             KV_NAMESPACE: tech-showcase
         triggers:
           - name: httpTrigger
             type: http
             config:
               authType: anonymous
               methods:
                 - GET
                 - POST
                 - OPTIONS
   ```

4. 部署：
   ```bash
   s deploy
   ```

---

## 测试 API

部署完成后，测试各个接口：

```bash
# 测试技能接口
curl https://your-function-url/skills

# 测试项目接口
curl https://your-function-url/projects

# 测试获奖接口
curl https://your-function-url/awards

# 测试时间线接口
curl https://your-function-url/timeline

# 测试统计接口
curl https://your-function-url/stats
```

---

## 常见问题

### 1. 云函数返回 CORS 错误

**问题**：浏览器控制台显示 CORS 错误

**解决**：确保云函数返回了正确的 CORS 头：
```javascript
headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
}
```

### 2. ESA 路由代理不生效

**问题**：配置了路由规则，但仍然 404

**解决**：
1. 检查规则优先级，确保规则在最前面
2. 检查路径匹配是否正确
3. 清除 ESA 缓存后重试

### 3. 云函数超时

**问题**：请求超时，返回 504

**解决**：
1. 增加云函数超时时间（默认 3 秒，建议 10 秒）
2. 优化 KV 查询，减少串行请求
3. 添加缓存机制

### 4. KV 数据获取失败

**问题**：云函数日志显示 KV 获取失败

**解决**：
1. 检查 `KV_NAMESPACE` 环境变量是否正确
2. 确认 `https://kv.zenmb.com/kv/` 接口可访问
3. 检查 KV 中是否有数据

---

## 性能优化建议

1. **启用缓存**：在云函数中添加内存缓存，减少 KV 查询次数

2. **并行请求**：使用 `Promise.all()` 并行获取多个 KV 数据

3. **CDN 缓存**：在 ESA 配置 API 响应缓存（TTL 5-10 分钟）

4. **预加载数据**：在页面加载时预先获取所有数据

---

## 总结

部署到 ESA 后，前端 API 404 的问题本质是：**ESA 只能托管静态文件，无法运行 Node.js 服务器**。

解决方案是将 API 逻辑部署为云函数，然后通过以下方式之一让前端访问：
1. **ESA 路由代理**（推荐）
2. **前端直接调用云函数**
3. **统一 API 配置模块**（最佳实践）

选择适合你的方案，快速上线！🚀
