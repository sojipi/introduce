/**
 * ESA 边缘路由函数
 * 处理路由重写和 SPA 回退
 */

export default {
    async fetch(request) {
        const url = new URL(request.url);
        const path = url.pathname;

        // 1. 如果访问 /admin (无斜杠)，重定向到 /admin/
        // 这是为了确保相对路径资源 (如 ./css/style.css) 能正确加载
        if (path === '/admin') {
            return new Response(null, {
                status: 301,
                headers: { 'Location': '/admin/' }
            });
        }

        // 2. 如果访问 /admin/，内部重写到 /admin/index.html
        if (path === '/admin/') {
            url.pathname = '/admin/index.html';
            return fetch(url);
        }

        // 3. 尝试获取原始请求的资源
        const response = await fetch(request);

        // 4. 处理 404 情况 (SPA 回退)
        if (response.status === 404) {
            // 检查是否为导航请求 (通常浏览器请求页面会包含 text/html)
            const accept = request.headers.get('Accept');
            const isNavigate = accept && accept.includes('text/html');
            
            if (isNavigate) {
                // 如果不是 /admin 下的请求，回退到主页 index.html (支持主应用 SPA)
                if (!path.startsWith('/admin/')) {
                    const homeUrl = new URL(request.url);
                    homeUrl.pathname = '/index.html';
                    return fetch(homeUrl);
                }
            }
        }

        return response;
    }
};
