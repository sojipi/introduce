# ESA 配置快速参考

## 🚨 使用 esa.jsonc 自动配置路由（推荐）

### 方法 1：使用 esa.jsonc（最简单 ⭐⭐⭐）

项目根目录已包含 `esa.jsonc` 配置文件，会自动处理所有路由：

```jsonc
{
  "name": "tech-showcase",
  "installCommand": "npm install",
  "buildCommand": "npm run build",
  "assets": {
    "directory": "./dist",
    "notFoundStrategy": "singlePageApplication"
  }
}
```

**`notFoundStrategy: "singlePageApplication"`** 会自动：
- ✅ 将 `/admin` 路由到 `admin/index.html`
- ✅ 将 `/admin/*` 路由到 `admin/index.html`
- ✅ 处理所有 SPA 前端路由

**部署步骤**：
1. 将项目推送到 GitHub
2. 在 ESA 控制台连接 GitHub 仓库
3. ESA 会自动读取 `esa.jsonc` 并配置路由
4. 完成！无需手动配置边缘规则

---

## 🔧 方法 2：手动配置边缘规则（备选）

如果不使用 GitHub 集成，需要手动上传文件并配置边缘规则：

### 缓存配置（可选）

```
/assets/*           Cache-Control: public, max-age=31536000, immutable
/*.html             Cache-Control: no-cache
/api/*              Cache-Control: no-store
```

---

## ✅ 验证清单

配置完成后，测试以下 URL：

- [ ] `https://me.zenmb.com/` - 主页正常显示
- [ ] `https://me.zenmb.com/admin` - Admin 登录页面正常显示
- [ ] `https://me.zenmb.com/admin/dashboard` - Admin 后台正常显示
- [ ] 前端数据正常加载（技能、项目、获奖、时间线）
- [ ] 浏览器控制台无 404 错误

---

## 🔧 常见问题

### Q: 配置后仍然 404？
**A:** 清除 ESA 缓存，或浏览器强制刷新（Ctrl+Shift+R）

### Q: Admin 页面加载但样式丢失？
**A:** 检查 `admin/index.html` 中的资源路径是否使用绝对路径（`/admin/css/...`）

### Q: 前端数据不显示？
**A:**
1. 检查 API 代理规则是否配置
2. 检查云函数是否部署
3. 检查云函数 URL 是否正确
4. 检查 KV 存储中是否有数据

---

## 📚 详细文档

- [ESA_DEPLOYMENT.md](./ESA_DEPLOYMENT.md) - 完整部署指南
- [ESA_ROUTING_CONFIG.md](./ESA_ROUTING_CONFIG.md) - 路由配置详解
- [API_404_SOLUTION.md](./API_404_SOLUTION.md) - API 问题解决方案

---

## 🎯 快速操作步骤

1. **构建并准备部署文件**
   ```bash
   npm run deploy:esa
   ```

2. **上传到 ESA**
   - 将 `deploy/` 目录下所有文件上传到 ESA

3. **配置 ESA 边缘规则**
   - 添加 4 条路由规则（见上表）

4. **清除缓存**
   - ESA 控制台 → 缓存管理 → 清除全部缓存

5. **测试访问**
   - 访问 `https://me.zenmb.com/`
   - 访问 `https://me.zenmb.com/admin`

---

## 💡 提示

- 规则优先级很重要：API 代理 > 精确路由 > 通配符路由
- 每次修改规则后都要清除缓存
- 使用浏览器开发者工具查看网络请求，排查 404 问题
