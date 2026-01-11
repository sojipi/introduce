/**
 * Service Worker
 * 实现离线支持、缓存策略、后台同步
 */

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `tech-showcase-${CACHE_VERSION}`;

// 需要缓存的静态资源
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/src/styles/main.css',
    '/src/js/main.js',
    '/favicon.ico'
];

// 缓存策略
const CACHE_STRATEGIES = {
    CACHE_FIRST: 'cache-first',
    NETWORK_FIRST: 'network-first',
    STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
    NETWORK_ONLY: 'network-only',
    CACHE_ONLY: 'cache-only'
};

// 安装事件 - 预缓存静态资源
self.addEventListener('install', (event) => {
    console.log('[Service Worker] 安装中...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] 缓存静态资源');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[Service Worker] 安装完成');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[Service Worker] 安装失败:', error);
            })
    );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] 激活中...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('[Service Worker] 删除旧缓存:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[Service Worker] 激活完成');
                return self.clients.claim();
            })
    );
});

// 拦截请求
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // 跳过非 HTTP(S) 请求
    if (!url.protocol.startsWith('http')) {
        return;
    }

    // 根据资源类型选择缓存策略
    const strategy = getStrategyForRequest(request);

    event.respondWith(
        handleRequest(request, strategy)
    );
});

// 根据请求选择缓存策略
function getStrategyForRequest(request) {
    const url = new URL(request.url);

    // API 请求 - 网络优先
    if (url.pathname.startsWith('/api/')) {
        return CACHE_STRATEGIES.NETWORK_FIRST;
    }

    // 静态资源 - 缓存优先
    if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/)) {
        return CACHE_STRATEGIES.CACHE_FIRST;
    }

    // HTML 页面 - 网络优先，同时更新缓存
    if (request.mode === 'navigate' || url.pathname.endsWith('.html')) {
        return CACHE_STRATEGIES.STALE_WHILE_REVALIDATE;
    }

    // 默认策略
    return CACHE_STRATEGIES.NETWORK_FIRST;
}

// 处理请求
async function handleRequest(request, strategy) {
    switch (strategy) {
        case CACHE_STRATEGIES.CACHE_FIRST:
            return cacheFirst(request);

        case CACHE_STRATEGIES.NETWORK_FIRST:
            return networkFirst(request);

        case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
            return staleWhileRevalidate(request);

        case CACHE_STRATEGIES.NETWORK_ONLY:
            return fetch(request);

        case CACHE_STRATEGIES.CACHE_ONLY:
            return caches.match(request);

        default:
            return networkFirst(request);
    }
}

// 缓存优先策略
async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
        return cachedResponse;
    }

    try {
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.error('[Service Worker] 网络请求失败:', error);
        return new Response('离线模式', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

// 网络优先策略
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.log('[Service Worker] 网络失败，使用缓存');
        const cachedResponse = await caches.match(request);

        if (cachedResponse) {
            return cachedResponse;
        }

        return new Response('离线且无缓存', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

// 陈旧内容重新验证策略
async function staleWhileRevalidate(request) {
    const cachedResponse = await caches.match(request);

    const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse.ok) {
            const cache = caches.open(CACHE_NAME);
            cache.then((c) => c.put(request, networkResponse.clone()));
        }
        return networkResponse;
    });

    return cachedResponse || fetchPromise;
}

// 后台同步
self.addEventListener('sync', (event) => {
    console.log('[Service Worker] 后台同步:', event.tag);

    if (event.tag === 'sync-data') {
        event.waitUntil(syncData());
    }
});

async function syncData() {
    try {
        // 同步离线时保存的数据
        const data = await getOfflineData();

        if (data.length > 0) {
            await fetch('/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            await clearOfflineData();
            console.log('[Service Worker] 数据同步成功');
        }
    } catch (error) {
        console.error('[Service Worker] 数据同步失败:', error);
        throw error;
    }
}

// 推送通知
self.addEventListener('push', (event) => {
    console.log('[Service Worker] 收到推送通知');

    const options = {
        body: event.data ? event.data.text() : '新消息',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            { action: 'explore', title: '查看详情' },
            { action: 'close', title: '关闭' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('技术展示', options)
    );
});

// 通知点击
self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] 通知被点击:', event.action);

    event.notification.close();

    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// 消息通信
self.addEventListener('message', (event) => {
    console.log('[Service Worker] 收到消息:', event.data);

    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_VERSION });
    }

    if (event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.delete(CACHE_NAME).then(() => {
                event.ports[0].postMessage({ success: true });
            })
        );
    }
});

// 辅助函数
async function getOfflineData() {
    // 从 IndexedDB 获取离线数据
    return [];
}

async function clearOfflineData() {
    // 清除 IndexedDB 中的离线数据
}
