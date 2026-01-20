# ESA 路由配置指南

## 问题说明

部署到 ESA 后，访问 `https://me.zenmb.com/admin` 返回 404 错误。

### 原因

ESA 默认只会查找对应路径的文件。访问 `/admin` 时，ESA 会查找 `admin` 文件（而不是 `admin/index.html`），导致 404。

---

## 解决方案

需要在 ESA 控制台配置**边缘规则**或**重写规则**，将 `/admin` 和 `/admin/*` 路由到 `admin/index.html`。

---

## 方法 1：使用 ESA 边缘规则（推荐）

### 步骤

1. **登录阿里云 ESA 控制台**
   - 访问：https://esa.console.aliyun.com/

2. **选择你的站点**
   - 找到 `me.zenmb.com` 站点

3. **配置边缘规则**

   进入 **边缘规则** → **添加规则**

   #### 规则 1：主页路由
   ```
   规则名称: 主页路由
   匹配条件: 路径等于 /
   执行动作: 重写 URL
   目标路径: /index.html
   ```

   #### 规则 2：Admin 后台路由（精确匹配）
   ```
   规则名称: Admin 后台入口
   匹配条件: 路径等于 /admin
   执行动作: 重写 URL
   目标路径: /admin/index.html
   ```

   #### 规则 3：Admin 子路由（通配符匹配）
   ```
   规则名称: Admin 子路由
   匹配条件: 路径匹配 /admin/*
   执行动作: 重写 URL
   目标路径: /admin/index.html
   ```

4. **保存并发布规则**

---

## 方法 2：使用 _redirects 文件（如果 ESA 支持）

在 `deploy/` 目录创建 `_redirects` 文件：

```
# Admin 路由
/admin              /admin/index.html   200
/admin/*            /admin/index.html   200

# 主页
/                   /index.html         200

# API 代理（如果需要）
/api/frontend/*     https://your-cloudfunction-url/:splat  200
```

---

## 方法 3：使用 ESA 函数（EdgeRoutine）

如果 ESA 支持边缘函数，可以创建一个路由函数：

```javascript
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  const path = url.pathname

  // Admin 路由
  if (path === '/admin' || path.startsWith('/admin/')) {
    url.pathname = '/admin/index.html'
    return fetch(url)
  }

  // 主页
  if (path === '/') {
    url.pathname = '/index.html'
    return fetch(url)
  }

  // 其他请求正常处理
  return fetch(request)
}
```

---

## 方法 4：修改部署结构（不推荐）

如果 ESA 不支持路由配置，可以修改部署结构：

```bash
deploy/
├── index.html          # 主页
├── admin.html          # Admin 后台（重命名）
└── assets/
```

然后访问 `https://me.zenmb.com/admin.html`

**缺点**：URL 不美观，且需要修改所有链接。

---

## 验证配置

配置完成后，测试以下 URL：

```bash
# 主页
https://me.zenmb.com/
✅ 应该显示主页

# Admin 后台
https://me.zenmb.com/admin
✅ 应该显示 Admin 登录页面

# Admin 子路由（SPA 路由）
https://me.zenmb.com/admin/dashboard
✅ 应该显示 Admin 后台（由前端路由处理）
```

---

## 常见问题

### 1. 配置后仍然 404

**原因**：ESA 缓存未清除

**解决**：
1. 在 ESA 控制台清除缓存
2. 或者在浏览器中强制刷新（Ctrl+Shift+R）

### 2. Admin 页面加载但样式丢失

**原因**：静态资源路径错误

**解决**：检查 `admin/index.html` 中的资源路径是否使用绝对路径：

```html
<!-- ❌ 错误：相对路径 -->
<link rel="stylesheet" href="css/style.css">

<!-- ✅ 正确：绝对路径 -->
<link rel="stylesheet" href="/admin/css/style.css">
```

### 3. API 请求 404

**原因**：API 路由未配置

**解决**：参考 [API_404_SOLUTION.md](./API_404_SOLUTION.md) 配置 API 代理。

---

## 推荐配置（完整示例）

### ESA 边缘规则配置

| 优先级 | 规则名称 | 匹配条件 | 执行动作 | 目标路径 |
|--------|---------|---------|---------|---------|
| 1 | API 代理 | 路径匹配 `/api/frontend/*` | 反向代理 | `https://your-cloudfunction-url/$1` |
| 2 | Admin 入口 | 路径等于 `/admin` | 重写 URL | `/admin/index.html` |
| 3 | Admin 子路由 | 路径匹配 `/admin/*` | 重写 URL | `/admin/index.html` |
| 4 | 主页 | 路径等于 `/` | 重写 URL | `/index.html` |
| 5 | 静态资源 | 路径匹配 `/assets/*` | 直接访问 | - |

### 缓存配置

```
# 静态资源长缓存
/assets/*           Cache-Control: public, max-age=31536000, immutable

# HTML 文件不缓存
/*.html             Cache-Control: no-cache

# API 不缓存
/api/*              Cache-Control: no-store
```

---

## 测试本地部署

在上传到 ESA 之前，可以本地测试路由配置：

```bash
# 安装 http-server
npm install -g http-server

# 启动服务器（支持 SPA 路由）
cd deploy
http-server -p 8080 --proxy http://localhost:8080?

# 访问测试
open http://localhost:8080/admin
```

---

## 总结

**最简单的解决方案**：在 ESA 控制台配置 3 条边缘规则：

1. `/admin` → `/admin/index.html`
2. `/admin/*` → `/admin/index.html`
3. `/` → `/index.html`

配置完成后，清除缓存，即可正常访问 `https://me.zenmb.com/admin`。

---

## 相关文档

- [ESA_DEPLOYMENT.md](./ESA_DEPLOYMENT.md) - ESA 完整部署指南
- [API_404_SOLUTION.md](./API_404_SOLUTION.md) - API 404 问题解决方案
