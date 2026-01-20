/**
 * ESA 边缘路由函数
 * 处理 /admin 路由，将其指向 admin/index.html
 */

export default {
    async fetch(request) {
        const url = new URL(request.url);
        const path = url.pathname;

        // 处理 /admin 路由
        if (path === '/admin' || path.startsWith('/admin/')) {
            // 修改路径指向 admin/index.html
            url.pathname = '/admin/index.html';
            return fetch(url);
        }

        // 其他请求正常处理
        return fetch(request);
    }
};
