# KV云函数部署指南

这是一个通用的KV存储云函数，支持多个云平台部署，部署后你的现有代码可以通过HTTP请求调用。

## 支持的云平台

- ✅ Cloudflare Workers
- ✅ 阿里云函数计算
- ✅ 腾讯云函数
- ✅ 其他支持标准HTTP的云平台

## 快速开始

### 1. Cloudflare Workers 部署

```bash
# 安装 Wrangler CLI
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 创建 KV 命名空间
wrangler kv:namespace create "KV"

# 更新 wrangler.toml 中的 namespace id

# 部署
wrangler publish
```

### 2. 阿里云函数计算部署

```bash
# 安装 Fun CLI
npm install -g @alicloud/fun

# 配置阿里云凭证
fun config

# 部署
fun deploy
```

### 3. 腾讯云函数部署

```bash
# 安装 Serverless CLI
npm install -g serverless

# 配置腾讯云凭证
export TENCENT_SECRET_ID=your_secret_id
export TENCENT_SECRET_KEY=your_secret_key

# 部署
serverless deploy
```

## API 使用说明

部署成功后，你会得到一个HTTP端点，可以通过以下方式调用：

### 基础操作

```javascript
// 获取值
GET https://your-function-url?action=get&key=mykey

// 设置值 (GET方式)
GET https://your-function-url?action=set&key=mykey&value=myvalue

// 设置值 (POST方式)
POST https://your-function-url?action=set&key=mykey
Content-Type: application/json
{"value": "myvalue"}

// 删除值
GET https://your-function-url?action=delete&key=mykey

// 检查存在
GET https://your-function-url?action=exists&key=mykey

// 黑名单检查（你的原始需求）
GET https://your-function-url?action=blacklist&key=user123
```

### 高级操作

```javascript
// 批量操作
POST https://your-function-url?action=batch
Content-Type: application/json
[
  {"action": "get", "key": "key1"},
  {"action": "set", "key": "key2", "value": "value2"},
  {"action": "delete", "key": "key3"}
]

// 健康检查
GET https://your-function-url?action=health

// 使用缓存
GET https://your-function-url?action=get&key=mykey&cache=true

// 设置TTL
GET https://your-function-url?action=set&key=mykey&value=myvalue&ttl=3600
```

## 在你的项目中使用

### 1. 创建KV客户端

```javascript
// server/services/kvClient.js
class KVClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    async get(key, options = {}) {
        const url = new URL(this.baseUrl);
        url.searchParams.set('action', 'get');
        url.searchParams.set('key', key);
        
        if (options.cache !== undefined) {
            url.searchParams.set('cache', options.cache);
        }

        const response = await fetch(url.toString());
        return await response.json();
    }

    async set(key, value, options = {}) {
        const url = new URL(this.baseUrl);
        url.searchParams.set('action', 'set');
        url.searchParams.set('key', key);
        
        if (options.ttl) {
            url.searchParams.set('ttl', options.ttl);
        }

        const response = await fetch(url.toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ value })
        });
        
        return await response.json();
    }

    async delete(key) {
        const url = new URL(this.baseUrl);
        url.searchParams.set('action', 'delete');
        url.searchParams.set('key', key);

        const response = await fetch(url.toString());
        return await response.json();
    }

    async exists(key) {
        const url = new URL(this.baseUrl);
        url.searchParams.set('action', 'exists');
        url.searchParams.set('key', key);

        const response = await fetch(url.toString());
        return await response.json();
    }

    async checkBlacklist(key) {
        const url = new URL(this.baseUrl);
        url.searchParams.set('action', 'blacklist');
        url.searchParams.set('key', key);

        const response = await fetch(url.toString());
        
        if (response.status === 403) {
            return { blacklisted: true };
        }
        
        return await response.json();
    }

    async batch(operations) {
        const url = new URL(this.baseUrl);
        url.searchParams.set('action', 'batch');

        const response = await fetch(url.toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(operations)
        });
        
        return await response.json();
    }
}

module.exports = KVClient;
```

### 2. 在你的代码中使用

```javascript
const KVClient = require('./server/services/kvClient');

// 初始化客户端
const kvClient = new KVClient('https://your-deployed-function-url');

// 使用示例
async function example() {
    // 检查黑名单（你的原始需求）
    const blacklistResult = await kvClient.checkBlacklist('user123');
    if (blacklistResult.blacklisted) {
        console.log('用户被禁止访问');
        return;
    }

    // 存储数据
    await kvClient.set('user:123:profile', {
        name: 'John',
        email: 'john@example.com'
    });

    // 获取数据
    const profile = await kvClient.get('user:123:profile');
    console.log(profile.value);

    // 检查存在
    const exists = await kvClient.exists('user:123:profile');
    console.log('Profile exists:', exists.exists);
}
```

### 3. 替换现有的EdgeStorageService

```javascript
// 在你的现有代码中
const KVClient = require('./server/services/kvClient');

class EdgeStorageService {
    constructor() {
        // 使用云函数替代直接调用
        this.kvClient = new KVClient(process.env.KV_FUNCTION_URL);
    }

    async get(key, type = 'json') {
        const result = await this.kvClient.get(key);
        return {
            success: result.success,
            data: result.value
        };
    }

    async put(key, value, options = {}) {
        const result = await this.kvClient.set(key, value, options);
        return {
            success: result.success,
            data: result
        };
    }

    async delete(key) {
        const result = await this.kvClient.delete(key);
        return {
            success: result.success,
            data: result
        };
    }
}
```

## 环境变量配置

在你的项目中添加：

```bash
# .env
KV_FUNCTION_URL=https://your-deployed-function-url
```

## 响应格式

所有API调用都返回统一的JSON格式：

```javascript
// 成功响应
{
  "success": true,
  "timestamp": 1640995200000,
  "key": "mykey",
  "value": "myvalue",
  "exists": true
}

// 错误响应
{
  "success": false,
  "error": "错误信息",
  "timestamp": 1640995200000
}

// 黑名单检查（被禁止时返回403状态码）
HTTP 403 Forbidden
"Forbidden: Key is blacklisted"
```

## 注意事项

1. **平台差异**: 不同云平台的KV存储特性可能不同
2. **性能**: 云函数调用会有网络延迟，建议使用缓存
3. **限制**: 注意各平台的请求频率和数据大小限制
4. **安全**: 生产环境建议添加API密钥验证

选择适合你的云平台进行部署，部署完成后就可以在现有项目中使用了！