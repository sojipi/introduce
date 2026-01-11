// 辅助函数定义
async function handleSet(request, url) {
    try {
        const key = url.searchParams.get('key');
        const namespace = url.searchParams.get('namespace') || 'default';

        if (!key) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Missing key parameter'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const edgeKv = new EdgeKV({ namespace });
        let value;
        let valueType = 'string';

        // 根据请求方法和Content-Type确定数据类型
        if (request.method === 'POST') {
            const contentType = request.headers.get('Content-Type') || '';

            if (contentType.includes('application/json')) {
                // JSON数据
                value = await request.text(); // 存储为字符串，读取时转换为JSON
                valueType = 'json';
            } else if (contentType.includes('application/octet-stream') || contentType.includes('binary')) {
                // 二进制数据
                value = await request.arrayBuffer();
                valueType = 'arrayBuffer';
            } else {
                // 文本数据
                value = await request.text();
                valueType = 'text';
            }
        } else {
            // GET请求，从URL参数获取
            value = url.searchParams.get('value');
            if (value === null) {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Missing value parameter'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            valueType = 'text';
        }

        // 执行存储操作，添加错误处理
        await edgeKv.put(key, value);

        return new Response(JSON.stringify({
            success: true,
            key,
            valueType,
            message: `Successfully set ${key}`
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('handleSet error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: `Failed to set key: ${error.message}`
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

async function handleGet(request, url) {
    try {
        const key = url.searchParams.get('key');
        const type = url.searchParams.get('type') || 'text';
        const namespace = url.searchParams.get('namespace') || 'default';

        if (!key) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Missing key parameter'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 验证type参数
        const validTypes = ['text', 'json', 'arrayBuffer', 'stream'];
        if (!validTypes.includes(type)) {
            return new Response(JSON.stringify({
                success: false,
                error: `Invalid type. Must be one of: ${validTypes.join(', ')}`
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const edgeKv = new EdgeKV({ namespace });
        const result = await edgeKv.get(key, { type });

        if (result === null || result === undefined) {
            return new Response(JSON.stringify({
                success: false,
                key,
                message: 'Key not found'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 根据类型返回不同格式的响应
        switch (type) {
            case 'json':
                return new Response(JSON.stringify({
                    success: true,
                    key,
                    value: result,
                    type: 'json'
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });

            case 'arrayBuffer':
                return new Response(result, {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/octet-stream',
                        'X-KV-Key': key,
                        'X-KV-Type': 'arrayBuffer'
                    }
                });

            case 'stream':
                return new Response(result, {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/octet-stream',
                        'X-KV-Key': key,
                        'X-KV-Type': 'stream'
                    }
                });

            case 'text':
            default:
                return new Response(JSON.stringify({
                    success: true,
                    key,
                    value: result,
                    type: 'text'
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
        }

    } catch (error) {
        console.error('handleGet error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: `Failed to get key: ${error.message}`
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

async function handleDelete(request, url) {
    try {
        const key = url.searchParams.get('key');
        const namespace = url.searchParams.get('namespace') || 'default';

        if (!key) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Missing key parameter'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const edgeKv = new EdgeKV({ namespace });
        const result = await edgeKv.delete(key);

        return new Response(JSON.stringify({
            success: result !== false,
            key,
            message: result !== false ? 'Successfully deleted' : 'Delete failed'
        }), {
            status: result !== false ? 200 : 500,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('handleDelete error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: `Failed to delete key: ${error.message}`
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

async function handleExists(request, url) {
    try {
        const key = url.searchParams.get('key');
        const namespace = url.searchParams.get('namespace') || 'default';

        if (!key) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Missing key parameter'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const edgeKv = new EdgeKV({ namespace });
        const result = await edgeKv.get(key, { type: 'text' });

        return new Response(JSON.stringify({
            success: true,
            key,
            exists: result !== null && result !== undefined
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('handleExists error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: `Failed to check key existence: ${error.message}`
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

async function handleDebug(request, url) {
    try {
        const namespace = url.searchParams.get('namespace') || 'default';

        return new Response(JSON.stringify({
            success: true,
            debug: {
                timestamp: new Date().toISOString(),
                namespace: namespace,
                edgeKvAvailable: typeof EdgeKV !== 'undefined',
                requestMethod: request.method,
                requestUrl: request.url,
                userAgent: request.headers.get('User-Agent'),
                contentType: request.headers.get('Content-Type')
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({
            success: false,
            error: `Debug failed: ${error.message}`
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export default {
    async fetch(request) {
        // 解析请求路径，用于决定操作类型
        const url = new URL(request.url);
        const path = url.pathname;

        try {
            if (path === '/kv/set') {
                return await handleSet(request, url);
            }

            if (path === '/kv/get') {
                return await handleGet(request, url);
            }

            if (path === '/kv/delete') {
                return await handleDelete(request, url);
            }

            if (path === '/kv/exists') {
                return await handleExists(request, url);
            }

            if (path === '/kv/debug') {
                return await handleDebug(request, url);
            }

            return new Response(JSON.stringify({
                success: false,
                error: 'Invalid endpoint',
                availableEndpoints: ['/kv/set', '/kv/get', '/kv/delete', '/kv/exists', '/kv/debug']
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            console.error('KV operation error:', error);
            return new Response(`Internal Server Error: ${error.message}`, { status: 500 });
        }
    }
};