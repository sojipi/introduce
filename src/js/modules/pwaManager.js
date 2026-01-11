/**
 * PWA 管理器
 * 处理 Service Worker 注册、更新、离线支持
 */
export class PWAManager {
    constructor() {
        this.registration = null;
        this.isOnline = navigator.onLine;
        this.updateAvailable = false;
        this.deferredPrompt = null;

        this.init();
    }

    async init() {
        // 检查浏览器支持
        if (!('serviceWorker' in navigator)) {
            console.warn('[PWA] Service Worker 不支持');
            return;
        }

        // 注册 Service Worker
        await this.registerServiceWorker();

        // 监听在线/离线状态
        this.setupOnlineOfflineListeners();

        // 监听安装提示
        this.setupInstallPrompt();

        // 检查更新
        this.checkForUpdates();
    }

    async registerServiceWorker() {
        try {
            this.registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            });

            console.log('[PWA] Service Worker 注册成功:', this.registration.scope);

            // 监听更新
            this.registration.addEventListener('updatefound', () => {
                const newWorker = this.registration.installing;

                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        this.updateAvailable = true;
                        this.showUpdateNotification();
                    }
                });
            });

            // 监听控制器变化
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                console.log('[PWA] Service Worker 已更新');
                window.location.reload();
            });

        } catch (error) {
            console.error('[PWA] Service Worker 注册失败:', error);
        }
    }

    setupOnlineOfflineListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.showNotification('网络已连接', 'success');
            console.log('[PWA] 网络已连接');
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showNotification('网络已断开，进入离线模式', 'warning');
            console.log('[PWA] 网络已断开');
        });
    }

    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton();
            console.log('[PWA] 可以安装应用');
        });

        window.addEventListener('appinstalled', () => {
            this.deferredPrompt = null;
            this.showNotification('应用已安装成功！', 'success');
            console.log('[PWA] 应用已安装');
        });
    }

    async promptInstall() {
        if (!this.deferredPrompt) {
            console.log('[PWA] 安装提示不可用');
            return false;
        }

        this.deferredPrompt.prompt();

        const { outcome } = await this.deferredPrompt.userChoice;
        console.log('[PWA] 用户选择:', outcome);

        this.deferredPrompt = null;
        return outcome === 'accepted';
    }

    showInstallButton() {
        const installBtn = document.createElement('button');
        installBtn.className = 'pwa-install-btn';
        installBtn.innerHTML = `
            <i class="fas fa-download"></i>
            <span>安装应用</span>
        `;
        installBtn.addEventListener('click', () => {
            this.promptInstall();
            installBtn.remove();
        });

        document.body.appendChild(installBtn);

        // 添加样式
        this.injectInstallButtonStyles();
    }

    injectInstallButtonStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .pwa-install-btn {
                position: fixed;
                bottom: 80px;
                right: 20px;
                padding: 12px 24px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 50px;
                font-size: 14px;
                font-weight: bold;
                cursor: pointer;
                box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
                z-index: 9997;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: all 0.3s ease;
                animation: slideInUp 0.5s ease;
            }

            .pwa-install-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 24px rgba(102, 126, 234, 0.6);
            }

            .pwa-install-btn i {
                font-size: 16px;
            }

            @keyframes slideInUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `;
        document.head.appendChild(style);
    }

    showUpdateNotification() {
        const notification = document.createElement('div');
        notification.className = 'pwa-update-notification';
        notification.innerHTML = `
            <div class="update-content">
                <i class="fas fa-sync-alt"></i>
                <span>发现新版本</span>
            </div>
            <button class="update-btn">更新</button>
            <button class="dismiss-btn">×</button>
        `;

        document.body.appendChild(notification);

        // 更新按钮
        notification.querySelector('.update-btn').addEventListener('click', () => {
            this.applyUpdate();
            notification.remove();
        });

        // 关闭按钮
        notification.querySelector('.dismiss-btn').addEventListener('click', () => {
            notification.remove();
        });

        // 添加样式
        this.injectUpdateNotificationStyles();
    }

    injectUpdateNotificationStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .pwa-update-notification {
                position: fixed;
                top: 80px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.95);
                border: 1px solid rgba(0, 212, 255, 0.3);
                border-radius: 12px;
                padding: 16px 20px;
                display: flex;
                align-items: center;
                gap: 16px;
                z-index: 10000;
                backdrop-filter: blur(10px);
                box-shadow: 0 8px 32px rgba(0, 212, 255, 0.2);
                animation: slideInDown 0.5s ease;
            }

            .update-content {
                display: flex;
                align-items: center;
                gap: 12px;
                color: #00d4ff;
                font-size: 14px;
            }

            .update-content i {
                font-size: 18px;
                animation: rotate 2s linear infinite;
            }

            .update-btn {
                padding: 8px 16px;
                background: #00d4ff;
                color: #000;
                border: none;
                border-radius: 6px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .update-btn:hover {
                background: #4ecdc4;
                transform: scale(1.05);
            }

            .dismiss-btn {
                background: none;
                border: none;
                color: #888;
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
            }

            .dismiss-btn:hover {
                color: #00d4ff;
                transform: rotate(90deg);
            }

            @keyframes slideInDown {
                from {
                    opacity: 0;
                    transform: translate(-50%, -20px);
                }
                to {
                    opacity: 1;
                    transform: translate(-50%, 0);
                }
            }

            @keyframes rotate {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }

    applyUpdate() {
        if (!this.registration || !this.registration.waiting) {
            return;
        }

        this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }

    async checkForUpdates() {
        if (!this.registration) return;

        try {
            await this.registration.update();
            console.log('[PWA] 检查更新完成');
        } catch (error) {
            console.error('[PWA] 检查更新失败:', error);
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `pwa-notification pwa-notification-${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);

        // 添加样式
        this.injectNotificationStyles();
    }

    injectNotificationStyles() {
        if (document.getElementById('pwa-notification-styles')) return;

        const style = document.createElement('style');
        style.id = 'pwa-notification-styles';
        style.textContent = `
            .pwa-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 16px 24px;
                background: rgba(0, 0, 0, 0.95);
                border-radius: 8px;
                color: white;
                font-size: 14px;
                z-index: 10001;
                opacity: 0;
                transform: translateX(100px);
                transition: all 0.3s ease;
                backdrop-filter: blur(10px);
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
            }

            .pwa-notification.show {
                opacity: 1;
                transform: translateX(0);
            }

            .pwa-notification-success {
                border-left: 4px solid #4ecdc4;
            }

            .pwa-notification-warning {
                border-left: 4px solid #ffd93d;
            }

            .pwa-notification-error {
                border-left: 4px solid #ff6b6b;
            }

            .pwa-notification-info {
                border-left: 4px solid #00d4ff;
            }
        `;
        document.head.appendChild(style);
    }

    // 获取缓存大小
    async getCacheSize() {
        if (!('storage' in navigator && 'estimate' in navigator.storage)) {
            return null;
        }

        const estimate = await navigator.storage.estimate();
        return {
            usage: estimate.usage,
            quota: estimate.quota,
            percentage: (estimate.usage / estimate.quota * 100).toFixed(2)
        };
    }

    // 清除缓存
    async clearCache() {
        if (!this.registration) return;

        const messageChannel = new MessageChannel();

        return new Promise((resolve) => {
            messageChannel.port1.onmessage = (event) => {
                resolve(event.data.success);
            };

            this.registration.active.postMessage(
                { type: 'CLEAR_CACHE' },
                [messageChannel.port2]
            );
        });
    }

    // 获取版本信息
    async getVersion() {
        if (!this.registration || !this.registration.active) return null;

        const messageChannel = new MessageChannel();

        return new Promise((resolve) => {
            messageChannel.port1.onmessage = (event) => {
                resolve(event.data.version);
            };

            this.registration.active.postMessage(
                { type: 'GET_VERSION' },
                [messageChannel.port2]
            );
        });
    }

    // 请求通知权限
    async requestNotificationPermission() {
        if (!('Notification' in window)) {
            console.warn('[PWA] 浏览器不支持通知');
            return false;
        }

        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    // 显示推送通知
    async showPushNotification(title, options = {}) {
        if (!this.registration) return;

        const permission = await this.requestNotificationPermission();
        if (!permission) return;

        await this.registration.showNotification(title, {
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            ...options
        });
    }
}
