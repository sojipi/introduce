/**
 * 修复 awards:list 中的 ID 格式
 * 将 ID 从 "1767873087124" 改为 "award-1767873087124"
 */

const StorageFactory = require('../services/storageFactory');
require('dotenv').config();

async function fixAwardIds() {
    const storage = StorageFactory.createStorageService();

    console.log('🔧 开始修复 award IDs...');
    console.log('📦 Storage mode:', process.env.KV_STORAGE_MODE || 'cloud (default)');
    console.log('🔑 Namespace:', process.env.KV_NAMESPACE || 'default');

    // 1. 获取当前的 awards:list
    console.log('🔍 正在获取 awards:list...');
    const listResult = await storage.get('awards:list');

    console.log('📊 获取结果:', {
        success: listResult.success,
        hasData: !!listResult.data,
        dataType: listResult.data ? typeof listResult.data : 'null',
        error: listResult.error
    });

    if (!listResult.success) {
        console.log('❌ 获取失败:', listResult.error);
        return;
    }

    if (!listResult.data) {
        console.log('❌ awards:list 为空或不存在');
        console.log('💡 提示: 请先通过 KV 管理界面手动设置 awards:list');
        return;
    }

    const awardsList = listResult.data;
    console.log(`📋 找到 ${awardsList.length} 个 awards`);

    // 2. 检查并修复每个 award
    for (const award of awardsList) {
        const oldId = award.id;

        // 如果 ID 不是以 "award-" 开头，需要修复
        if (!oldId.startsWith('award-')) {
            const newId = `award-${oldId}`;
            console.log(`\n🔄 修复 award: ${oldId} -> ${newId}`);

            // 检查旧 key 是否存在数据
            const oldKeyResult = await storage.get(`award:${oldId}`);

            if (oldKeyResult.success && oldKeyResult.data) {
                console.log(`  ✅ 找到数据在 award:${oldId}`);
                const awardData = oldKeyResult.data;

                // 更新 ID
                awardData.id = newId;

                // 保存到新 key
                console.log(`  💾 保存到 award:${newId}`);
                await storage.put(`award:${newId}`, awardData);

                // 删除旧 key
                console.log(`  🗑️  删除旧 key: award:${oldId}`);
                await storage.delete(`award:${oldId}`);

                // 更新列表中的 ID
                award.id = newId;
            } else {
                console.log(`  ⚠️  警告: award:${oldId} 中没有数据`);
                // 仍然更新列表中的 ID
                award.id = newId;
            }
        } else {
            console.log(`✓ ${oldId} 格式正确，无需修复`);
        }
    }

    // 3. 保存更新后的列表
    console.log('\n💾 保存更新后的 awards:list...');
    const updateResult = await storage.put('awards:list', awardsList);

    if (updateResult.success) {
        console.log('✅ awards:list 更新成功！');
        console.log('\n修复后的列表:');
        console.log(JSON.stringify(awardsList, null, 2));
    } else {
        console.log('❌ 更新 awards:list 失败:', updateResult.error);
    }
}

// 运行修复
fixAwardIds().catch(error => {
    console.error('❌ 修复过程出错:', error);
    process.exit(1);
});
