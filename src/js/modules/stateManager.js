/**
 * 轻量级状态管理系统
 * 展示架构设计能力、观察者模式、响应式编程
 */
export class StateManager {
    constructor(initialState = {}) {
        this.state = this.createReactiveState(initialState);
        this.listeners = new Map();
        this.middleware = [];
        this.history = [];
        this.maxHistorySize = 50;
        this.devMode = true;
    }

    /**
     * 创建响应式状态
     */
    createReactiveState(obj, path = '') {
        const self = this;

        return new Proxy(obj, {
            get(target, property) {
                const value = target[property];
                const fullPath = path ? `${path}.${property}` : property;

                // 如果是对象，递归创建代理
                if (value && typeof value === 'object' && !Array.isArray(value)) {
                    return self.createReactiveState(value, fullPath);
                }

                return value;
            },

            set(target, property, value) {
                const fullPath = path ? `${path}.${property}` : property;
                const oldValue = target[property];

                // 检查值是否真的改变
                if (oldValue === value) {
                    return true;
                }

                // 执行中间件
                const action = {
                    type: 'SET',
                    path: fullPath,
                    oldValue,
                    newValue: value,
                    timestamp: Date.now()
                };

                const shouldContinue = self.runMiddleware(action);
                if (!shouldContinue) {
                    return false;
                }

                // 更新值
                target[property] = value;

                // 记录历史
                self.addToHistory(action);

                // 通知监听器
                self.notify(fullPath, value, oldValue);

                // 开发模式日志
                if (self.devMode) {
                    console.log(`[StateManager] ${fullPath}:`, oldValue, '→', value);
                }

                return true;
            }
        });
    }

    /**
     * 订阅状态变化
     */
    subscribe(path, callback) {
        if (!this.listeners.has(path)) {
            this.listeners.set(path, new Set());
        }

        this.listeners.get(path).add(callback);

        // 返回取消订阅函数
        return () => {
            const callbacks = this.listeners.get(path);
            if (callbacks) {
                callbacks.delete(callback);
                if (callbacks.size === 0) {
                    this.listeners.delete(path);
                }
            }
        };
    }

    /**
     * 通知监听器
     */
    notify(path, newValue, oldValue) {
        // 精确匹配
        const exactListeners = this.listeners.get(path);
        if (exactListeners) {
            exactListeners.forEach(callback => {
                try {
                    callback(newValue, oldValue, path);
                } catch (error) {
                    console.error(`[StateManager] 监听器执行错误 (${path}):`, error);
                }
            });
        }

        // 通配符匹配 (例如: user.* 匹配 user.name, user.age 等)
        this.listeners.forEach((callbacks, listenerPath) => {
            if (listenerPath.includes('*')) {
                const pattern = new RegExp('^' + listenerPath.replace(/\*/g, '.*') + '$');
                if (pattern.test(path)) {
                    callbacks.forEach(callback => {
                        try {
                            callback(newValue, oldValue, path);
                        } catch (error) {
                            console.error(`[StateManager] 通配符监听器执行错误 (${listenerPath}):`, error);
                        }
                    });
                }
            }
        });
    }

    /**
     * 获取状态值
     */
    get(path) {
        if (!path) return this.state;

        const keys = path.split('.');
        let value = this.state;

        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return undefined;
            }
        }

        return value;
    }

    /**
     * 设置状态值
     */
    set(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        let target = this.state;

        // 导航到目标对象
        for (const key of keys) {
            if (!(key in target)) {
                target[key] = {};
            }
            target = target[key];
        }

        // 设置值（会触发 Proxy 的 set）
        target[lastKey] = value;
    }

    /**
     * 批量更新
     */
    batch(updates) {
        const actions = [];

        Object.entries(updates).forEach(([path, value]) => {
            actions.push({ path, value });
        });

        // 暂时禁用通知
        const originalNotify = this.notify;
        const notifications = [];

        this.notify = (path, newValue, oldValue) => {
            notifications.push({ path, newValue, oldValue });
        };

        // 执行所有更新
        actions.forEach(({ path, value }) => {
            this.set(path, value);
        });

        // 恢复通知并批量发送
        this.notify = originalNotify;
        notifications.forEach(({ path, newValue, oldValue }) => {
            this.notify(path, newValue, oldValue);
        });
    }

    /**
     * 添加中间件
     */
    use(middleware) {
        this.middleware.push(middleware);
    }

    /**
     * 运行中间件
     */
    runMiddleware(action) {
        for (const middleware of this.middleware) {
            try {
                const result = middleware(action, this.state);
                if (result === false) {
                    if (this.devMode) {
                        console.log('[StateManager] 中间件阻止了操作:', action);
                    }
                    return false;
                }
            } catch (error) {
                console.error('[StateManager] 中间件执行错误:', error);
            }
        }
        return true;
    }

    /**
     * 添加到历史记录
     */
    addToHistory(action) {
        this.history.push(action);

        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        }
    }

    /**
     * 获取历史记录
     */
    getHistory(limit = 10) {
        return this.history.slice(-limit);
    }

    /**
     * 计算派生状态
     */
    computed(path, computeFn, dependencies = []) {
        const compute = () => {
            const value = computeFn(this.state);
            this.set(path, value);
        };

        // 初始计算
        compute();

        // 监听依赖变化
        dependencies.forEach(dep => {
            this.subscribe(dep, compute);
        });

        return () => this.get(path);
    }

    /**
     * 重置状态
     */
    reset(initialState = {}) {
        Object.keys(this.state).forEach(key => {
            delete this.state[key];
        });

        Object.assign(this.state, initialState);
        this.history = [];
        this.notify('*', this.state, {});
    }

    /**
     * 导出状态快照
     */
    snapshot() {
        return JSON.parse(JSON.stringify(this.state));
    }

    /**
     * 从快照恢复
     */
    restore(snapshot) {
        this.reset(snapshot);
    }

    /**
     * 调试工具
     */
    debug() {
        return {
            state: this.snapshot(),
            listeners: Array.from(this.listeners.keys()),
            history: this.getHistory(),
            middleware: this.middleware.length
        };
    }
}

/**
 * 创建全局状态管理实例
 */
export function createStore(initialState = {}) {
    return new StateManager(initialState);
}

/**
 * 常用中间件
 */
export const middleware = {
    // 日志中间件
    logger: (action, state) => {
        console.group(`[Action] ${action.type} - ${action.path}`);
        console.log('旧值:', action.oldValue);
        console.log('新值:', action.newValue);
        console.log('时间:', new Date(action.timestamp).toLocaleTimeString());
        console.groupEnd();
        return true;
    },

    // 验证中间件
    validator: (rules) => (action, state) => {
        const rule = rules[action.path];
        if (rule && !rule(action.newValue)) {
            console.warn(`[Validator] 验证失败: ${action.path}`, action.newValue);
            return false;
        }
        return true;
    },

    // 持久化中间件
    persistence: (key = 'app-state') => {
        return (action, state) => {
            try {
                localStorage.setItem(key, JSON.stringify(state));
            } catch (error) {
                console.error('[Persistence] 保存失败:', error);
            }
            return true;
        };
    },

    // 性能监控中间件
    performance: (action, state) => {
        const start = performance.now();
        const result = true;
        const duration = performance.now() - start;

        if (duration > 16) { // 超过一帧的时间
            console.warn(`[Performance] 慢操作: ${action.path} (${duration.toFixed(2)}ms)`);
        }

        return result;
    }
};
