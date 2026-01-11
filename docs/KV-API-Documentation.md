# KV云函数API文档

## 基础信息

**API地址**: `https://kv.zenmb.com/kv/`

**支持的数据类型**:
- `text`: 文本字符串
- `json`: JSON对象
- `arrayBuffer`: 二进制数据
- `stream`: 流数据

## API接口

### 1. 存储数据 (SET)

#### 文本存储
```http
GET https://kv.zenmb.com/kv/set?key=mykey&value=hello&namespace=default
```

#### JSON存储
```http
POST https://kv.zenmb.com/kv/set?key=config&namespace=default
Content-Type: application/json

{"name": "test", "value": 123}
```

#### 二进制存储
```http
POST https://kv.zenmb.com/kv/set?key=image&namespace=default
Content-Type: application/octet-stream

[binary data]
```

**响应格式**:
```json
{
  "success": true,
  "key": "mykey",
  "valueType": "text",
  "message": "Successfully set mykey"
}
```

### 2. 读取数据 (GET)

#### 读取文本
```http
GET https://kv.zenmb.com/kv/get?key=mykey&type=text&namespace=default
```

#### 读取JSON
```http
GET https://kv.zenmb.com/kv/get?key=config&type=json&namespace=default
```

#### 读取二进制
```http
GET https://kv.zenmb.com/kv/get?key=image&type=arrayBuffer&namespace=default
```

#### 读取流
```http
GET https://kv.zenmb.com/kv/get?key=data&type=stream&namespace=default
```

**响应格式**:
```json
{
  "success": true,
  "key": "mykey",
  "value": "hello",
  "type": "text"
}
```

**二进制/流响应**: 直接返回数据，响应头包含:
- `X-KV-Key`: 键名
- `X-KV-Type`: 数据类型
- `Content-Type`: `application/octet-stream`

### 3. 删除数据 (DELETE)

```http
GET https://kv.zenmb.com/kv/delete?key=mykey&namespace=default
```

**响应格式**:
```json
{
  "success": true,
  "key": "mykey",
  "message": "Successfully deleted"
}
```

### 4. 检查存在 (EXISTS)

```http
GET https://kv.zenmb.com/kv/exists?key=mykey&namespace=default
```

**响应格式**:
```json
{
  "success": true,
  "key": "mykey",
  "exists": true
}
```

## 参数说明

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| key | string | 是 | - | 存储键名，最大512字节 |
| value | string | 否 | - | 存储值（GET请求时使用） |
| type | string | 否 | text | 读取类型：text/json/arrayBuffer/stream |
| namespace | string | 否 | default | 命名空间名称 |

## 错误响应

```json
{
  "success": false,
  "key": "mykey",
  "message": "Key not found"
}
```

**常见错误码**:
- `400`: 参数错误
- `404`: 键不存在
- `500`: 服务器内部错误

## 使用限制

- 键名最大512字节
- 值最大1.8MB
- 键名只能包含字母、数字、连字符(-)和下划线(_)
- 不支持空格、斜杠(/)、问号(?)等特殊字符

## JavaScript客户端示例

```javascript
// 基础请求函数
async function kvRequest(action, key, options = {}) {
    const url = new URL(`https://kv.zenmb.com/kv/${action}`);
    url.searchParams.set('key', key);
    
    if (options.namespace) {
        url.searchParams.set('namespace', options.namespace);
    }
    
    if (options.type) {
        url.searchParams.set('type', options.type);
    }
    
    const requestOptions = {
        method: options.method || 'GET',
        headers: options.headers || {}
    };
    
    if (options.body) {
        requestOptions.body = options.body;
    }
    
    const response = await fetch(url.toString(), requestOptions);
    
    if (options.type === 'arrayBuffer' || options.type === 'stream') {
        return response.arrayBuffer();
    }
    
    return response.json();
}

// 存储文本
await kvRequest('set', 'mykey', {
    method: 'GET',
    value: 'hello'
});

// 存储JSON
await kvRequest('set', 'config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'test' })
});

// 读取数据
const result = await kvRequest('get', 'mykey', { type: 'text' });

// 删除数据
await kvRequest('delete', 'mykey');

// 检查存在
const exists = await kvRequest('exists', 'mykey');
```

## Node.js客户端示例

```javascript
const fetch = require('node-fetch');

class KVClient {
    constructor(baseUrl = 'https://kv.zenmb.com/kv/') {
        this.baseUrl = baseUrl;
    }
    
    async set(key, value, options = {}) {
        const url = new URL(`${this.baseUrl}set`);
        url.searchParams.set('key', key);
        
        if (options.namespace) {
            url.searchParams.set('namespace', options.namespace);
        }
        
        let requestOptions = { method: 'GET' };
        
        if (typeof value === 'string') {
            url.searchParams.set('value', value);
        } else {
            requestOptions = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(value)
            };
        }
        
        const response = await fetch(url.toString(), requestOptions);
        return response.json();
    }
    
    async get(key, options = {}) {
        const url = new URL(`${this.baseUrl}get`);
        url.searchParams.set('key', key);
        url.searchParams.set('type', options.type || 'text');
        
        if (options.namespace) {
            url.searchParams.set('namespace', options.namespace);
        }
        
        const response = await fetch(url.toString());
        
        if (options.type === 'arrayBuffer' || options.type === 'stream') {
            return response.buffer();
        }
        
        return response.json();
    }
    
    async delete(key, options = {}) {
        const url = new URL(`${this.baseUrl}delete`);
        url.searchParams.set('key', key);
        
        if (options.namespace) {
            url.searchParams.set('namespace', options.namespace);
        }
        
        const response = await fetch(url.toString());
        return response.json();
    }
    
    async exists(key, options = {}) {
        const url = new URL(`${this.baseUrl}exists`);
        url.searchParams.set('key', key);
        
        if (options.namespace) {
            url.searchParams.set('namespace', options.namespace);
        }
        
        const response = await fetch(url.toString());
        return response.json();
    }
}

// 使用示例
const kv = new KVClient();

// 存储和读取
await kv.set('user:123', { name: 'John', age: 30 });
const user = await kv.get('user:123', { type: 'json' });
console.log(user.value); // { name: 'John', age: 30 }
```