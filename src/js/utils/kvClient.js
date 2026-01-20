/**
 * 浏览器端 KV 客户端
 * 直接调用云函数 API: https://kv.zenmb.com/kv/
 */

class KVClient {
    constructor() {
        // 根据环境选择 API 地址
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

        if (isLocal) {
            // 本地开发：使用本地 API
            this.baseUrl = '/api/frontend';
        } else {
            // 生产环境：直接调用云函数
            this.baseUrl = 'https://kv.zenmb.com/api/frontend';
        }

        this.namespace = 'tech-showcase';
    }

    /**
     * 获取技能数据
     */
    async getSkills() {
        try {
            const response = await fetch(`${this.baseUrl}/skills`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('获取技能数据失败:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 获取项目数据
     */
    async getProjects() {
        try {
            const response = await fetch(`${this.baseUrl}/projects`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('获取项目数据失败:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 获取获奖数据
     */
    async getAwards() {
        try {
            const response = await fetch(`${this.baseUrl}/awards`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('获取获奖数据失败:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 获取时间线数据
     */
    async getTimeline() {
        try {
            const response = await fetch(`${this.baseUrl}/timeline`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('获取时间线数据失败:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 获取统计数据
     */
    async getStats() {
        try {
            const response = await fetch(`${this.baseUrl}/stats`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('获取统计数据失败:', error);
            return { success: false, error: error.message };
        }
    }
}

// 导出单例
export const kvClient = new KVClient();
