# 存储迁移指南

## 概述

项目已成功迁移到云函数KV存储，现在支持两种存储模式：

1. **云函数模式** (推荐): 使用 `https://kv.zenmb.com/kv/` 云函数
2. **直连模式**: 直接使用阿里云ESA API

## 配置说明

### 环境变量配置

在 `.env` 文件中设置：

```bash
# 选择存储模式
KV_STORAGE_MODE=cloud

# 云函数配置 (推荐)
KV_CLOUD_FUNCTION_URL=https://kv.zenmb.com/kv/
KV_NAMESPACE=tech-showcase

# 直连配置 (备用)
ALIYUN_ACCESS_KEY_ID=your-access-key-id
ALIYUN_ACCESS_KEY_SECRET=your-access-key-secret
ALIYUN_ESA_ENDPOINT=https://esa.cn-hangzhou.aliyuncs.com
ALIYUN_ESA_NAMESPACE=tech-showcase
```

### 存储模式切换

通过修改 `KV_STORAGE_MODE` 环境变量来切换存储模式：

- `cloud`: 使用云函数KV存储 (默认，推荐)
- `direct`: 使用直连阿里云ESA存储

## 迁移完成的改动

### 1. 新增文件

```
server/services/
├── cloudKvClient.js           # 云函数KV客户端
├── edgeStorageCloudAdapter.js # 云函数适配器
└── storageFactory.js          # 存储服务工厂

admin/services/
└── storageFactory.js          # Admin存储服务工厂

docs/
├── KV-API-Documentation.md    # KV API文档
└── Storage-Migration-Guide.md # 本迁移指南
```

### 2. 修改的文件

所有路由文件已更新为使用 `StorageFactory.createStorageService()` 而不是直接实例化 `EdgeStorageService`：

- `server/routes/*.js`
- `admin/routes/*.js`
- `admin/scripts/init-admin.js`

### 3. 环境变量更新

`.env.example` 已更新，包含新的配置选项。

## 使用云函数的优势

### 🚀 **性能优势**
- 全球CDN加速
- 边缘计算，就近访问
- 无需管理服务器

### 🔒 **安全优势**
- 无需暴露阿里云密钥
- 统一的访问控制
- 自动HTTPS加密

### 💰 **成本优势**
- 按使用量计费
- 无固定成本
- 自动扩缩容

### 🛠 **维护优势**
- 无需维护基础设施
- 自动更新和修复
- 高可用性保证

## API兼容性

云函数适配器完全兼容原有的 `EdgeStorageService` 接口：

```javascript
// 原有代码无需修改
const result = await edgeStorage.get('user:123');
await edgeStorage.put('user:123', userData);
await edgeStorage.delete('user:123');
```

## 测试验证

### 1. 启动项目

```bash
# 设置环境变量
echo "KV_STORAGE_MODE=cloud" >> .env

# 启动服务
npm run admin-start
```

### 2. 验证存储功能

访问管理后台，测试以下功能：
- 用户登录/注册
- 项目数据管理
- 技能数据管理
- 时间线管理

### 3. 检查日志

启动时应该看到：
```
Using Cloud Function KV Storage
Admin: Using Cloud Function KV Storage
```

## 故障排除

### 1. 云函数无法访问

**症状**: 请求超时或连接失败

**解决方案**:
1. 检查网络连接
2. 验证云函数URL是否正确
3. 临时切换到直连模式：`KV_STORAGE_MODE=direct`

### 2. 数据不一致

**症状**: 新旧数据不匹配

**解决方案**:
1. 确认命名空间配置一致
2. 检查数据格式是否正确
3. 使用备份/恢复功能迁移数据

### 3. 性能问题

**症状**: 响应缓慢

**解决方案**:
1. 检查网络延迟
2. 考虑使用缓存
3. 优化数据结构

## 数据迁移

如果需要从直连模式迁移到云函数模式：

```javascript
// 迁移脚本示例
const EdgeStorageService = require('./server/services/edgeStorage');
const CloudKvClient = require('./server/services/cloudKvClient');

async function migrateData() {
    const oldStorage = new EdgeStorageService();
    const newStorage = new CloudKvClient();
    
    // 获取所有数据键
    const keys = ['users', 'projects', 'skills', 'timeline', 'awards'];
    
    for (const key of keys) {
        const result = await oldStorage.get(key);
        if (result.success && result.data) {
            await newStorage.put(key, result.data);
            console.log(`Migrated: ${key}`);
        }
    }
}
```

## 监控和日志

### 1. 健康检查

```javascript
const storageService = StorageFactory.createStorageService();
const health = await storageService.healthCheck();
console.log('Storage Health:', health);
```

### 2. 性能监控

云函数自带监控功能，可以查看：
- 请求量统计
- 响应时间
- 错误率
- 可用性

## 回滚方案

如果需要回滚到直连模式：

1. 修改环境变量：`KV_STORAGE_MODE=direct`
2. 确保阿里云密钥配置正确
3. 重启服务

## 总结

✅ **迁移完成**
- 所有代码已更新
- 支持两种存储模式
- 完全向后兼容

✅ **推荐配置**
- 使用云函数模式 (`KV_STORAGE_MODE=cloud`)
- 命名空间：`tech-showcase`
- 云函数URL：`https://kv.zenmb.com/kv/`

✅ **下一步**
- 测试所有功能
- 监控性能表现
- 根据需要调优配置

项目现在可以享受云函数KV存储带来的所有优势！