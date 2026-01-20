// 存储管理组件
const Storage = {
    template: `
        <div>
            <div class="page-header">
                <h1><i class="fas fa-database"></i> 存储管理</h1>
                <p>管理阿里云边缘存储数据</p>
            </div>
            
            <!-- 存储统计 -->
            <div class="stats-grid" style="margin-bottom: 2rem;">
                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #667eea, #764ba2);">
                        <i class="fas fa-key"></i>
                    </div>
                    <div class="stat-info">
                        <h3>{{ storageStats.totalKeys || 0 }}</h3>
                        <p>数据键总数</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb, #f5576c);">
                        <i class="fas fa-hdd"></i>
                    </div>
                    <div class="stat-info">
                        <h3>{{ utils.formatFileSize(storageStats.estimatedSize || 0) }}</h3>
                        <p>估计大小</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe, #00f2fe);">
                        <i class="fas fa-folder"></i>
                    </div>
                    <div class="stat-info">
                        <h3>{{ Object.keys(storageStats.typeStats || {}).length }}</h3>
                        <p>数据类型</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b, #38f9d7);">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div class="stat-info">
                        <h3>{{ utils.formatDate(storageStats.lastUpdated) }}</h3>
                        <p>最后更新</p>
                    </div>
                </div>
            </div>
            
            <!-- 操作面板 -->
            <div class="card" style="margin-bottom: 2rem;">
                <div class="card-header">
                    <h3><i class="fas fa-tools"></i> 存储操作</h3>
                </div>
                <div class="card-body">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                        <el-button type="primary" @click="showBackupDialog">
                            <i class="fas fa-download"></i> 数据备份
                        </el-button>
                        <el-button type="success" @click="showRestoreDialog">
                            <i class="fas fa-upload"></i> 数据恢复
                        </el-button>
                        <el-button type="warning" @click="showCleanupDialog">
                            <i class="fas fa-broom"></i> 数据清理
                        </el-button>
                        <el-button @click="refreshStats">
                            <i class="fas fa-sync-alt"></i> 刷新统计
                        </el-button>
                    </div>
                </div>
            </div>
            
            <!-- 数据类型统计 -->
            <div class="card" style="margin-bottom: 2rem;">
                <div class="card-header">
                    <h3><i class="fas fa-chart-pie"></i> 数据类型分布</h3>
                </div>
                <div class="card-body">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
                        <div 
                            v-for="(count, type) in storageStats.typeStats" 
                            :key="type"
                            class="type-stat-item"
                        >
                            <div class="type-icon">
                                <i :class="getTypeIcon(type)"></i>
                            </div>
                            <div class="type-info">
                                <h4>{{ count }}</h4>
                                <p>{{ getTypeName(type) }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 数据浏览器 -->
            <div class="card">
                <div class="card-header">
                    <h3><i class="fas fa-search"></i> 数据浏览器</h3>
                    <div style="display: flex; gap: 1rem; align-items: center;">
                        <el-input
                            v-model="keyFilter"
                            placeholder="过滤键名..."
                            prefix-icon="Search"
                            style="width: 200px;"
                            @input="filterKeys"
                        />
                        <el-button @click="loadKeys">
                            <i class="fas fa-sync-alt"></i> 刷新
                        </el-button>
                        <el-button type="primary" @click="showAddKeyDialog">
                            <i class="fas fa-plus"></i> 新建键值
                        </el-button>
                    </div>
                </div>
                <div class="card-body">
                    <el-table 
                        :data="filteredKeys" 
                        v-loading="keysLoading"
                        style="width: 100%"
                        @selection-change="handleKeySelection"
                    >
                        <el-table-column type="selection" width="55"></el-table-column>
                        
                        <el-table-column prop="key" label="键名" min-width="200">
                            <template #default="scope">
                                <div style="font-family: monospace;">{{ scope.row }}</div>
                            </template>
                        </el-table-column>
                        
                        <el-table-column prop="type" label="类型" width="120">
                            <template #default="scope">
                                <el-tag size="small">{{ getKeyType(scope.row) }}</el-tag>
                            </template>
                        </el-table-column>
                        
                        <el-table-column label="操作" width="200" fixed="right">
                            <template #default="scope">
                                <el-button size="small" @click="viewKeyData(scope.row)">
                                    <i class="fas fa-eye"></i> 查看
                                </el-button>
                                <el-button size="small" @click="editKeyData(scope.row)">
                                    <i class="fas fa-edit"></i> 编辑
                                </el-button>
                                <el-button 
                                    size="small" 
                                    type="danger" 
                                    @click="deleteKey(scope.row)"
                                >
                                    <i class="fas fa-trash"></i> 删除
                                </el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                    
                    <!-- 批量操作 -->
                    <div v-if="selectedKeys.length > 0" style="margin-top: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 5px;">
                        <span style="margin-right: 1rem;">已选择 {{ selectedKeys.length }} 个键</span>
                        <el-button size="small" type="danger" @click="batchDeleteKeys">
                            <i class="fas fa-trash"></i> 批量删除
                        </el-button>
                    </div>
                </div>
            </div>
            
            <!-- 键值编辑对话框 -->
            <el-dialog 
                v-model="keyDialogVisible" 
                :title="editingKey ? '编辑键值' : '新建键值'"
                width="800px"
                @close="resetKeyForm"
            >
                <el-form :model="keyForm" label-width="80px">
                    <el-form-item label="键名">
                        <el-input 
                            v-model="keyForm.key" 
                            placeholder="请输入键名"
                            :disabled="!!editingKey"
                        />
                    </el-form-item>
                    
                    <el-form-item label="数据类型">
                        <el-radio-group v-model="keyForm.dataType">
                            <el-radio label="json">JSON</el-radio>
                            <el-radio label="text">文本</el-radio>
                        </el-radio-group>
                    </el-form-item>
                    
                    <el-form-item label="数据内容">
                        <el-input 
                            v-model="keyForm.value" 
                            type="textarea" 
                            :rows="15"
                            placeholder="请输入数据内容"
                        />
                    </el-form-item>
                </el-form>
                
                <template #footer>
                    <el-button @click="keyDialogVisible = false">取消</el-button>
                    <el-button type="primary" :loading="keyOperating" @click="saveKeyData">
                        {{ keyOperating ? '保存中...' : '保存' }}
                    </el-button>
                </template>
            </el-dialog>
            
            <!-- 数据查看对话框 -->
            <el-dialog 
                v-model="viewDialogVisible" 
                title="查看数据"
                width="800px"
            >
                <div style="margin-bottom: 1rem;">
                    <strong>键名：</strong>
                    <span style="font-family: monospace;">{{ viewingKey }}</span>
                </div>
                
                <div style="margin-bottom: 1rem;">
                    <strong>数据大小：</strong>
                    {{ utils.formatFileSize(viewingData ? JSON.stringify(viewingData).length : 0) }}
                </div>
                
                <div>
                    <strong>数据内容：</strong>
                    <pre style="background: #f5f5f5; padding: 1rem; border-radius: 5px; max-height: 400px; overflow-y: auto; font-size: 0.9rem;">{{ formatViewData(viewingData) }}</pre>
                </div>
                
                <template #footer>
                    <el-button @click="viewDialogVisible = false">关闭</el-button>
                    <el-button type="primary" @click="copyToClipboard(formatViewData(viewingData))">
                        <i class="fas fa-copy"></i> 复制数据
                    </el-button>
                </template>
            </el-dialog>
            
            <!-- 备份对话框 -->
            <el-dialog 
                v-model="backupDialogVisible" 
                title="数据备份"
                width="600px"
            >
                <el-form label-width="100px">
                    <el-form-item label="备份范围">
                        <el-radio-group v-model="backupOptions.scope">
                            <el-radio label="all">全部数据</el-radio>
                            <el-radio label="prefix">按前缀</el-radio>
                            <el-radio label="selected">选中的键</el-radio>
                        </el-radio-group>
                    </el-form-item>
                    
                    <el-form-item v-if="backupOptions.scope === 'prefix'" label="键前缀">
                        <el-input v-model="backupOptions.prefix" placeholder="如：projects:" />
                    </el-form-item>
                </el-form>
                
                <template #footer>
                    <el-button @click="backupDialogVisible = false">取消</el-button>
                    <el-button type="primary" :loading="backupOperating" @click="performBackup">
                        {{ backupOperating ? '备份中...' : '开始备份' }}
                    </el-button>
                </template>
            </el-dialog>
            
            <!-- 恢复对话框 -->
            <el-dialog 
                v-model="restoreDialogVisible" 
                title="数据恢复"
                width="600px"
            >
                <el-form label-width="100px">
                    <el-form-item label="备份文件">
                        <el-upload
                            ref="uploadRef"
                            :auto-upload="false"
                            :show-file-list="false"
                            accept=".json"
                            @change="handleBackupFile"
                        >
                            <el-button>
                                <i class="fas fa-upload"></i> 选择备份文件
                            </el-button>
                        </el-upload>
                        <div v-if="restoreFile" style="margin-top: 0.5rem; color: #666;">
                            已选择：{{ restoreFile.name }}
                        </div>
                    </el-form-item>
                    
                    <el-form-item>
                        <el-checkbox v-model="restoreOptions.overwrite">
                            覆盖已存在的数据
                        </el-checkbox>
                    </el-form-item>
                </el-form>
                
                <template #footer>
                    <el-button @click="restoreDialogVisible = false">取消</el-button>
                    <el-button 
                        type="primary" 
                        :loading="restoreOperating" 
                        :disabled="!restoreFile"
                        @click="performRestore"
                    >
                        {{ restoreOperating ? '恢复中...' : '开始恢复' }}
                    </el-button>
                </template>
            </el-dialog>
            
            <!-- 清理对话框 -->
            <el-dialog 
                v-model="cleanupDialogVisible" 
                title="数据清理"
                width="600px"
            >
                <el-form label-width="120px">
                    <el-form-item label="清理条件">
                        <el-date-picker
                            v-model="cleanupOptions.olderThan"
                            type="datetime"
                            placeholder="清理此时间之前的数据"
                            style="width: 100%;"
                        />
                    </el-form-item>
                    
                    <el-form-item>
                        <el-checkbox v-model="cleanupOptions.dryRun">
                            预览模式（不实际删除）
                        </el-checkbox>
                    </el-form-item>
                </el-form>
                
                <template #footer>
                    <el-button @click="cleanupDialogVisible = false">取消</el-button>
                    <el-button 
                        type="warning" 
                        :loading="cleanupOperating" 
                        @click="performCleanup"
                    >
                        {{ cleanupOperating ? '清理中...' : '开始清理' }}
                    </el-button>
                </template>
            </el-dialog>
        </div>
    `,

    data() {
        return {
            storageStats: {},
            keys: [],
            filteredKeys: [],
            selectedKeys: [],
            keysLoading: false,
            keyFilter: '',

            // 对话框状态
            keyDialogVisible: false,
            viewDialogVisible: false,
            backupDialogVisible: false,
            restoreDialogVisible: false,
            cleanupDialogVisible: false,

            // 操作状态
            keyOperating: false,
            backupOperating: false,
            restoreOperating: false,
            cleanupOperating: false,

            // 编辑状态
            editingKey: null,
            viewingKey: '',
            viewingData: null,

            // 表单数据
            keyForm: {
                key: '',
                value: '',
                dataType: 'json'
            },

            // 操作选项
            backupOptions: {
                scope: 'all',
                prefix: ''
            },

            restoreOptions: {
                overwrite: false
            },

            restoreFile: null,

            cleanupOptions: {
                olderThan: null,
                dryRun: true
            }
        };
    },

    async mounted() {
        await this.refreshStats();
        await this.loadKeys();
    },

    methods: {
        async refreshStats() {
            try {
                const response = await axios.get('/storage/stats');
                if (response.data.success) {
                    this.storageStats = response.data.data;
                }
            } catch (error) {
                console.error('Load storage stats error:', error);
                utils.showMessage('加载存储统计失败', 'error');
            }
        },

        async loadKeys() {
            try {
                this.keysLoading = true;
                const response = await axios.get('/storage/keys', {
                    params: { limit: 1000 }
                });

                if (response.data.success) {
                    this.keys = response.data.data.keys;
                    this.filterKeys();
                }
            } catch (error) {
                console.error('Load keys error:', error);
                utils.showMessage('加载键列表失败', 'error');
            } finally {
                this.keysLoading = false;
            }
        },

        filterKeys() {
            if (!this.keyFilter.trim()) {
                this.filteredKeys = this.keys;
            } else {
                const filter = this.keyFilter.toLowerCase();
                this.filteredKeys = this.keys.filter(key =>
                    key.toLowerCase().includes(filter)
                );
            }
        },

        handleKeySelection(selection) {
            this.selectedKeys = selection;
        },

        async viewKeyData(key) {
            try {
                const response = await axios.get(`/storage/data/${encodeURIComponent(key)}`);
                if (response.data.success) {
                    this.viewingKey = key;
                    this.viewingData = response.data.data.value;
                    this.viewDialogVisible = true;
                }
            } catch (error) {
                console.error('View key data error:', error);
                utils.showMessage('获取数据失败', 'error');
            }
        },

        async editKeyData(key) {
            try {
                const response = await axios.get(`/storage/data/${encodeURIComponent(key)}`);
                if (response.data.success) {
                    this.editingKey = key;
                    this.keyForm = {
                        key,
                        value: typeof response.data.data.value === 'string'
                            ? response.data.data.value
                            : JSON.stringify(response.data.data.value, null, 2),
                        dataType: typeof response.data.data.value === 'string' ? 'text' : 'json'
                    };
                    this.keyDialogVisible = true;
                }
            } catch (error) {
                console.error('Edit key data error:', error);
                utils.showMessage('获取数据失败', 'error');
            }
        },

        showAddKeyDialog() {
            this.resetKeyForm();
            this.keyDialogVisible = true;
        },

        resetKeyForm() {
            this.keyForm = {
                key: '',
                value: '',
                dataType: 'json'
            };
            this.editingKey = null;
        },

        async saveKeyData() {
            try {
                if (!this.keyForm.key.trim()) {
                    utils.showMessage('请输入键名', 'warning');
                    return;
                }

                if (!this.keyForm.value.trim()) {
                    utils.showMessage('请输入数据内容', 'warning');
                    return;
                }

                this.keyOperating = true;

                let value = this.keyForm.value;
                if (this.keyForm.dataType === 'json') {
                    try {
                        value = JSON.parse(this.keyForm.value);
                    } catch (e) {
                        utils.showMessage('JSON格式错误', 'error');
                        return;
                    }
                }

                const response = await axios.put(
                    `/storage/data/${encodeURIComponent(this.keyForm.key)}`,
                    { value }
                );

                if (response.data.success) {
                    utils.showMessage('保存成功', 'success');
                    this.keyDialogVisible = false;
                    await this.loadKeys();
                    await this.refreshStats();
                }
            } catch (error) {
                console.error('Save key data error:', error);
                const message = error.response?.data?.message || '保存失败';
                utils.showMessage(message, 'error');
            } finally {
                this.keyOperating = false;
            }
        },

        async deleteKey(key) {
            try {
                await utils.showConfirm(`确定要删除键 "${key}" 吗？`, '删除确认');

                const response = await axios.delete(`/storage/data/${encodeURIComponent(key)}`);

                if (response.data.success) {
                    utils.showMessage('删除成功', 'success');
                    await this.loadKeys();
                    await this.refreshStats();
                }
            } catch (error) {
                if (error === 'cancel') return;
                console.error('Delete key error:', error);
                const message = error.response?.data?.message || '删除失败';
                utils.showMessage(message, 'error');
            }
        },

        async batchDeleteKeys() {
            try {
                await utils.showConfirm(`确定要删除选中的 ${this.selectedKeys.length} 个键吗？`, '批量删除确认');

                const operations = this.selectedKeys.map(key => ({
                    action: 'delete',
                    key
                }));

                const response = await axios.post('/storage/batch', { operations });

                if (response.data.success) {
                    const successCount = response.data.data.filter(r => r.success).length;
                    utils.showMessage(`成功删除 ${successCount}/${this.selectedKeys.length} 个键`, 'success');
                    await this.loadKeys();
                    await this.refreshStats();
                }
            } catch (error) {
                if (error === 'cancel') return;
                console.error('Batch delete error:', error);
                utils.showMessage('批量删除失败', 'error');
            }
        },

        showBackupDialog() {
            this.backupOptions = {
                scope: 'all',
                prefix: ''
            };
            this.backupDialogVisible = true;
        },

        async performBackup() {
            try {
                this.backupOperating = true;

                const params = {};

                if (this.backupOptions.scope === 'prefix' && this.backupOptions.prefix) {
                    params.prefix = this.backupOptions.prefix;
                } else if (this.backupOptions.scope === 'selected' && this.selectedKeys.length > 0) {
                    params.keys = this.selectedKeys;
                }

                const response = await axios.post('/storage/backup', params);

                if (response.data.success) {
                    const backupData = response.data.data;

                    // 下载备份文件
                    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
                        type: 'application/json'
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                    URL.revokeObjectURL(url);

                    utils.showMessage(`备份成功，包含 ${backupData.totalKeys} 个键`, 'success');
                    this.backupDialogVisible = false;
                }
            } catch (error) {
                console.error('Backup error:', error);
                const message = error.response?.data?.message || '备份失败';
                utils.showMessage(message, 'error');
            } finally {
                this.backupOperating = false;
            }
        },

        showRestoreDialog() {
            this.restoreFile = null;
            this.restoreOptions = {
                overwrite: false
            };
            this.restoreDialogVisible = true;
        },

        handleBackupFile(file) {
            this.restoreFile = file.raw;
        },

        async performRestore() {
            try {
                if (!this.restoreFile) {
                    utils.showMessage('请选择备份文件', 'warning');
                    return;
                }

                this.restoreOperating = true;

                const fileContent = await this.readFileAsText(this.restoreFile);
                let backupData;

                try {
                    backupData = JSON.parse(fileContent);
                } catch (e) {
                    utils.showMessage('备份文件格式错误', 'error');
                    return;
                }

                const response = await axios.post('/storage/restore', {
                    backupData,
                    overwrite: this.restoreOptions.overwrite
                });

                if (response.data.success) {
                    const result = response.data.data;
                    utils.showMessage(`恢复成功，处理 ${result.successCount}/${result.totalCount} 个键`, 'success');
                    this.restoreDialogVisible = false;
                    await this.loadKeys();
                    await this.refreshStats();
                }
            } catch (error) {
                console.error('Restore error:', error);
                const message = error.response?.data?.message || '恢复失败';
                utils.showMessage(message, 'error');
            } finally {
                this.restoreOperating = false;
            }
        },

        showCleanupDialog() {
            this.cleanupOptions = {
                olderThan: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30天前
                dryRun: true
            };
            this.cleanupDialogVisible = true;
        },

        async performCleanup() {
            try {
                if (!this.cleanupOptions.olderThan) {
                    utils.showMessage('请选择清理时间', 'warning');
                    return;
                }

                this.cleanupOperating = true;

                const response = await axios.post('/storage/cleanup', {
                    olderThan: this.cleanupOptions.olderThan.toISOString(),
                    dryRun: this.cleanupOptions.dryRun
                });

                if (response.data.success) {
                    const result = response.data.data;
                    if (this.cleanupOptions.dryRun) {
                        utils.showMessage(`预览完成，将清理 ${result.totalKeys} 个键`, 'info');
                    } else {
                        utils.showMessage(`清理完成，删除 ${result.successCount}/${result.totalCount} 个键`, 'success');
                        await this.loadKeys();
                        await this.refreshStats();
                    }
                    this.cleanupDialogVisible = false;
                }
            } catch (error) {
                console.error('Cleanup error:', error);
                const message = error.response?.data?.message || '清理失败';
                utils.showMessage(message, 'error');
            } finally {
                this.cleanupOperating = false;
            }
        },

        // 工具方法
        getTypeIcon(type) {
            const icons = {
                projects: 'fas fa-project-diagram',
                awards: 'fas fa-trophy',
                timeline: 'fas fa-calendar-alt',
                skills: 'fas fa-cogs',
                user: 'fas fa-user'
            };
            return icons[type] || 'fas fa-file';
        },

        getTypeName(type) {
            const names = {
                projects: '项目',
                awards: '获奖',
                timeline: '时间线',
                skills: '技能',
                user: '用户'
            };
            return names[type] || type;
        },

        getKeyType(key) {
            return key.split(':')[0] || 'unknown';
        },

        formatViewData(data) {
            if (typeof data === 'string') {
                return data;
            }
            return JSON.stringify(data, null, 2);
        },

        async copyToClipboard(text) {
            try {
                await navigator.clipboard.writeText(text);
                utils.showMessage('已复制到剪贴板', 'success');
            } catch (error) {
                console.error('Copy to clipboard error:', error);
                utils.showMessage('复制失败', 'error');
            }
        },

        readFileAsText(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = e => resolve(e.target.result);
                reader.onerror = reject;
                reader.readAsText(file);
            });
        }
    }
};