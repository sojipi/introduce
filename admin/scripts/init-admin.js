// 初始化管理员账户脚本
const bcrypt = require('bcryptjs');
const StorageFactory = require('../services/storageFactory');

async function initDefaultAdmin() {
    try {
        const edgeStorage = StorageFactory.createStorageService();

        // 检查是否已存在管理员账户
        const existingAdmin = await edgeStorage.get('user:admin');

        if (existingAdmin.success && existingAdmin.data) {
            console.log('✅ 管理员账户已存在');
        } else {
            // 创建默认管理员账户
            const hashedPassword = await bcrypt.hash('admin123', 10);

            // 创建简化的管理员用户对象
            const adminUser = {
                username: 'admin',
                password: hashedPassword,
                role: 'admin',
            createdAt: new Date().toISOString()
            };

            console.log('🔄 尝试存储管理员账户...');

            // 将对象转换为字符串存储
            const result = await edgeStorage.put('user:admin', JSON.stringify(adminUser));

            if (result.success) {
                console.log('✅ 默认管理员账户创建成功');
                console.log('📧 用户名: admin');
           console.log('🔑 密码: admin123');
                console.log('⚠️  请在首次登录后修改密码');
            } else {
                console.error('❌ 创建管理员账户失败:', result.error || result);
                console.log('🔍 尝试测试网络连接...');

                // 测试网络连接
                try {
                    const testResponse = await fetch('https://kv.zenmb.com/kv/exists?key=test');
                    console.log('🌐 网络连接状态:', testResponse.status);
                    const testResult = await testResponse.json();
                    console.log('📡 云函数响应:', testResult);
                } catch (networkError) {
            console.error('🚫 网络连接失败:', networkError.message);
            console.log('💡 建议: 检查网络连接或切换到直连模式');
                    console.log('💡 切换方法: 在.env中设置 KV_STORAGE_MODE=direct');
                }
            }
        }

        // 不再初始化任何示例数据
        // 所有数据应该通过 populate-resume-data.js 或管理后台手动添加
        console.log('✅ 管理员账户检查完成');
        console.log('💡 提示：使用 populate-resume-data.js 导入真实数据');

    } catch (error) {
        console.error('❌ 初始化失败:', error);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    initDefaultAdmin();
}

module.exports = { initDefaultAdmin };
