const crypto = require('crypto');
const fetch = require('node-fetch');

class EdgeStorageService {
    constructor() {
        this.accessKeyId = process.env.ALIYUN_ACCESS_KEY_ID;
        this.accessKeySecret = process.env.ALIYUN_ACCESS_KEY_SECRET;
        this.endpoint = process.env.ALIYUN_ESA_ENDPOINT || 'https://esa.cn-hangzhou.aliyuncs.com';
        this.namespace = process.env.ALIYUN_ESA_NAMESPACE || 'tech-showcase';
        this.version = '2024-09-10';
    }

    // 生成签名
    generateSignature(method, uri, query, headers, body) {
        const canonicalRequest = this.buildCanonicalRequest(method, uri, query, headers, body);
        const stringToSign = this.buildStringToSign(canonicalRequest);
        return this.sign(stringToSign);
    }

    buildCanonicalRequest(method, uri, query, headers, body) {
        const canonicalHeaders = Object.keys(headers)
            .sort()
            .map(key => `${key.toLowerCase()}:${headers[key]}`)
            .join('\n');

        const signedHeaders = Object.keys(headers)
            .sort()
            .map(key => key.toLowerCase())
            .join(';');

        const canonicalQueryString = Object.keys(query || {})
            .sort()
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`)
            .join('&');

        const hashedPayload = crypto.createHash('sha256').update(body || '').digest('hex');

        return [
            method,
            uri,
            canonicalQueryString,
            canonicalHeaders,
            '',
            signedHeaders,
            hashedPayload
        ].join('\n');
    }

    buildStringToSign(canonicalRequest) {
        const algorithm = 'ACS3-HMAC-SHA256';
        const timestamp = new Date().toISOString().replace(/[:\-]|\.\d{3}/g, '');
        const hashedCanonicalRequest = crypto.createHash('sha256').update(canonicalRequest).digest('hex');

        return [
            algorithm,
            timestamp,
            hashedCanonicalRequest
        ].join('\n');
    }

    sign(stringToSign) {
        return crypto.createHmac('sha256', this.accessKeySecret).update(stringToSign).digest('hex');
    }

    // 构建请求头
    buildHeaders(method, uri, query, body) {
        const timestamp = new Date().toISOString().replace(/[:\-]|\.\d{3}/g, '');
        const nonce = crypto.randomBytes(16).toString('hex');

        const headers = {
            'Content-Type': 'application/json',
            'x-acs-action': 'PutEdgeKv',
            'x-acs-version': this.version,
            'x-acs-date': timestamp,
            'x-acs-signature-nonce': nonce,
            'Host': new URL(this.endpoint).host
        };

        const signature = this.generateSignature(method, uri, query, headers, body);
        headers['Authorization'] = `ACS3-HMAC-SHA256 Credential=${this.accessKeyId},SignedHeaders=${Object.keys(headers).sort().map(k => k.toLowerCase()).join(';')},Signature=${signature}`;

        return headers;
    }

    // 存储数据
    async put(key, value, options = {}) {
        try {
            const body = JSON.stringify({
                Namespace: this.namespace,
                Key: key,
                Value: typeof value === 'string' ? value : JSON.stringify(value),
                ...options
            });

            const headers = this.buildHeaders('POST', '/', {}, body);

            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers,
                body
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(`EdgeKV put failed: ${result.Message || response.statusText}`);
            }

            return {
                success: true,
                data: result
            };
        } catch (error) {
            console.error('EdgeKV put error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 获取数据
    async get(key, type = 'json') {
        try {
            const body = JSON.stringify({
                Namespace: this.namespace,
                Key: key
            });

            const headers = this.buildHeaders('POST', '/', {}, body);
            headers['x-acs-action'] = 'GetEdgeKv';

            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers,
                body
            });

            const result = await response.json();

            if (!response.ok) {
                if (result.Code === 'NotFound') {
                    return {
                        success: true,
                        data: null
                    };
                }
                throw new Error(`EdgeKV get failed: ${result.Message || response.statusText}`);
            }

            let data = result.Value;
            if (type === 'json' && typeof data === 'string') {
                try {
                    data = JSON.parse(data);
                } catch (e) {
                    // 如果解析失败，返回原始字符串
                }
            }

            return {
                success: true,
                data
            };
        } catch (error) {
            console.error('EdgeKV get error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 删除数据
    async delete(key) {
        try {
            const body = JSON.stringify({
                Namespace: this.namespace,
                Key: key
            });

            const headers = this.buildHeaders('POST', '/', {}, body);
            headers['x-acs-action'] = 'DeleteEdgeKv';

            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers,
                body
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(`EdgeKV delete failed: ${result.Message || response.statusText}`);
            }

            return {
                success: true,
                data: result
            };
        } catch (error) {
            console.error('EdgeKV delete error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 列出所有键
    async list(prefix = '', limit = 100) {
        try {
            const body = JSON.stringify({
                Namespace: this.namespace,
                Prefix: prefix,
                Limit: limit
            });

            const headers = this.buildHeaders('POST', '/', {}, body);
            headers['x-acs-action'] = 'ListEdgeKv';

            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers,
                body
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(`EdgeKV list failed: ${result.Message || response.statusText}`);
            }

            return {
                success: true,
                data: result.Keys || []
            };
        } catch (error) {
            console.error('EdgeKV list error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 批量操作
    async batchPut(items) {
        const results = [];
        for (const item of items) {
            const result = await this.put(item.key, item.value, item.options);
            results.push({
                key: item.key,
                ...result
            });
        }
        return results;
    }

    // 数据备份
    async backup(keys) {
        const backup = {};
        for (const key of keys) {
            const result = await this.get(key);
            if (result.success && result.data !== null) {
                backup[key] = result.data;
            }
        }
        return backup;
    }

    // 数据恢复
    async restore(backup) {
        const results = [];
        for (const [key, value] of Object.entries(backup)) {
            const result = await this.put(key, value);
            results.push({
                key,
                ...result
            });
        }
        return results;
    }
}

module.exports = EdgeStorageService;