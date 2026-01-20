// 技能管理组件
const Skills = {
    template: `
        <div>
            <div class="page-header">
                <h1><i class="fas fa-cogs"></i> 技能管理</h1>
                <p>管理您的技术技能和能力</p>
            </div>
            
            <!-- 操作栏 -->
            <div class="card" style="margin-bottom: 2rem;">
                <div class="card-body">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                        <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
                            <el-select v-model="filters.category" placeholder="技能分类" clearable style="width: 150px;">
                                <el-option label="全部" value="all"></el-option>
                                <el-option label="前端开发" value="frontend"></el-option>
                                <el-option label="后端开发" value="backend"></el-option>
                                <el-option label="数据库" value="database"></el-option>
                                <el-option label="运维部署" value="devops"></el-option>
                                <el-option label="移动开发" value="mobile"></el-option>
                                <el-option label="人工智能" value="ai"></el-option>
                                <el-option label="设计" value="design"></el-option>
                                <el-option label="其他" value="other"></el-option>
                            </el-select>
                            
                            <el-slider
                                v-model="filters.minLevel"
                                :min="0"
                                :max="100"
                                :step="10"
                                show-input
                                style="width: 200px;"
                                @change="loadSkills"
                            />
                            <span style="font-size: 0.9rem; color: #666;">最低等级</span>
                            
                            <el-button @click="loadSkills">
                                <i class="fas fa-sync-alt"></i> 刷新
                            </el-button>
                        </div>
                        
                        <div>
                            <el-button @click="showImportDialog">
                                <i class="fas fa-upload"></i> 批量导入
                            </el-button>
                            <el-button type="primary" @click="showSkillDialog()">
                                <i class="fas fa-plus"></i> 新建技能
                            </el-button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 技能统计 -->
            <div class="stats-grid" style="margin-bottom: 2rem;">
                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #e74c3c, #c0392b);">
                        <i class="fas fa-star"></i>
                    </div>
                    <div class="stat-info">
                        <h3>{{ stats.expert || 0 }}</h3>
                        <p>专家级 (90+)</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #f39c12, #e67e22);">
                        <i class="fas fa-fire"></i>
                    </div>
                    <div class="stat-info">
                        <h3>{{ stats.advanced || 0 }}</h3>
                        <p>高级 (70-89)</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #3498db, #2980b9);">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <div class="stat-info">
                        <h3>{{ stats.intermediate || 0 }}</h3>
                        <p>中级 (30-69)</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #27ae60, #2ecc71);">
                        <i class="fas fa-seedling"></i>
                    </div>
                    <div class="stat-info">
                        <h3>{{ stats.beginner || 0 }}</h3>
                        <p>初级 (0-29)</p>
                    </div>
                </div>
            </div>
            
            <!-- 技能列表 -->
            <div class="card">
                <div class="card-header">
                    <h3><i class="fas fa-list"></i> 技能列表</h3>
                    <div>
                        <span style="margin-right: 1rem; color: #666;">平均等级: {{ stats.averageLevel || 0 }}</span>
                        <el-button size="small" @click="showBatchUpdateDialog">
                            批量更新等级
                        </el-button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="skills-grid">
                        <div 
                            v-for="skill in skills" 
                            :key="skill.id"
                            class="skill-card"
                            @click="showSkillDialog(skill)"
                        >
                            <div class="skill-header">
                                <div class="skill-icon" :style="{ backgroundColor: skill.color || '#667eea' }">
                                    {{ skill.icon || '⚡' }}
                                </div>
                                <div class="skill-info">
                                    <h4>{{ skill.name }}</h4>
                                    <p>{{ getCategoryName(skill.category) }}</p>
                                </div>
                                <div class="skill-level">
                                    <span class="level-number">{{ skill.level }}%</span>
                                </div>
                            </div>
                            
                            <div class="skill-progress">
                                <div 
                                    class="skill-progress-bar" 
                                    :style="{ 
                                        width: skill.level + '%',
                                        backgroundColor: skill.color || '#667eea'
                                    }"
                                ></div>
                            </div>
                            
                            <div class="skill-description">
                                {{ skill.description || '暂无描述' }}
                            </div>
                            
                            <div class="skill-meta">
                                <div class="skill-experience" v-if="skill.experience">
                                    <i class="fas fa-clock"></i>
                                    {{ skill.experience }}
                                </div>
                                <div class="skill-projects" v-if="skill.projects && skill.projects.length > 0">
                                    <i class="fas fa-project-diagram"></i>
                                    {{ skill.projects.length }} 个项目
                                </div>
                            </div>
                            
                            <div class="skill-actions">
                                <el-button size="small" @click.stop="showSkillDialog(skill)">
                                    <i class="fas fa-edit"></i> 编辑
                                </el-button>
                                <el-button size="small" type="danger" @click.stop="deleteSkill(skill)">
                                    <i class="fas fa-trash"></i> 删除
                                </el-button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 分页 -->
                    <div style="margin-top: 2rem; text-align: center;">
                        <el-pagination
                            v-model:current-page="pagination.current"
                            v-model:page-size="pagination.pageSize"
                            :page-sizes="[12, 24, 48, 96]"
                            :total="pagination.total"
                            layout="total, sizes, prev, pager, next, jumper"
                            @size-change="loadSkills"
                            @current-change="loadSkills"
                        />
                    </div>
                </div>
            </div>
            
            <!-- 技能编辑对话框 -->
            <el-dialog 
                v-model="dialogVisible" 
                :title="editingSkill ? '编辑技能' : '新建技能'"
                width="600px"
                @close="resetForm"
            >
                <el-form 
                    :model="form" 
                    :rules="rules" 
                    ref="skillForm"
                    label-width="100px"
                >
                    <el-row :gutter="20">
                        <el-col :span="16">
                            <el-form-item label="技能名称" prop="name">
                                <el-input v-model="form.name" placeholder="请输入技能名称" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="8">
                            <el-form-item label="图标">
                                <el-input v-model="form.icon" placeholder="emoji图标" />
                            </el-form-item>
                        </el-col>
                    </el-row>
                    
                    <el-row :gutter="20">
                        <el-col :span="12">
                            <el-form-item label="分类" prop="category">
                                <el-select v-model="form.category" placeholder="选择分类" style="width: 100%;">
                                    <el-option label="前端开发" value="frontend"></el-option>
                                    <el-option label="后端开发" value="backend"></el-option>
                                    <el-option label="数据库" value="database"></el-option>
                                    <el-option label="运维部署" value="devops"></el-option>
                                    <el-option label="移动开发" value="mobile"></el-option>
                                    <el-option label="人工智能" value="ai"></el-option>
                                    <el-option label="设计" value="design"></el-option>
                                    <el-option label="其他" value="other"></el-option>
                                </el-select>
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="颜色">
                                <el-color-picker v-model="form.color" />
                            </el-form-item>
                        </el-col>
                    </el-row>
                    
                    <el-form-item label="技能等级" prop="level">
                        <el-slider
                            v-model="form.level"
                            :min="0"
                            :max="100"
                            :step="5"
                            show-input
                            style="width: 100%;"
                        />
                    </el-form-item>
                    
                    <el-form-item label="技能描述">
                        <el-input 
                            v-model="form.description" 
                            type="textarea" 
                            :rows="3"
                            placeholder="请输入技能描述"
                        />
                    </el-form-item>
                    
                    <el-form-item label="经验描述">
                        <el-input v-model="form.experience" placeholder="如：3年经验、熟练使用等" />
                    </el-form-item>
                    
                    <el-form-item label="相关项目">
                        <el-select
                            v-model="form.projects"
                            multiple
                            filterable
                            allow-create
                            placeholder="输入相关项目名称"
                            style="width: 100%;"
                        >
                        </el-select>
                    </el-form-item>
                    
                    <el-form-item label="相关认证">
                        <el-select
                            v-model="form.certifications"
                            multiple
                            filterable
                            allow-create
                            placeholder="输入相关认证"
                            style="width: 100%;"
                        >
                        </el-select>
                    </el-form-item>
                </el-form>
                
                <template #footer>
                    <el-button @click="dialogVisible = false">取消</el-button>
                    <el-button type="primary" :loading="saving" @click="saveSkill">
                        {{ saving ? '保存中...' : '保存' }}
                    </el-button>
                </template>
            </el-dialog>
            
            <!-- 批量更新对话框 -->
            <el-dialog 
                v-model="batchUpdateVisible" 
                title="批量更新技能等级"
                width="500px"
            >
                <div v-for="skill in selectedSkills" :key="skill.id" style="margin-bottom: 1rem;">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <span style="flex: 1;">{{ skill.name }}</span>
                        <el-slider
                            v-model="skill.newLevel"
                            :min="0"
                            :max="100"
                            :step="5"
                            show-input
                            style="flex: 2;"
                        />
                    </div>
                </div>
                
                <template #footer>
                    <el-button @click="batchUpdateVisible = false">取消</el-button>
                    <el-button type="primary" :loading="batchUpdating" @click="batchUpdateLevels">
                        {{ batchUpdating ? '更新中...' : '批量更新' }}
                    </el-button>
                </template>
            </el-dialog>
            
            <!-- 导入对话框 -->
            <el-dialog 
                v-model="importVisible" 
                title="批量导入技能"
                width="600px"
            >
                <div style="margin-bottom: 1rem;">
                    <p style="color: #666; margin-bottom: 0.5rem;">支持JSON格式导入，格式示例：</p>
                    <pre style="background: #f5f5f5; padding: 1rem; border-radius: 5px; font-size: 0.9rem;">
[
  {
    "name": "JavaScript",
    "category": "frontend",
    "level": 90,
    "description": "熟练掌握ES6+语法",
    "icon": "🚀",
    "color": "#f7df1e"
  }
]</pre>
                </div>
                
                <el-form>
                    <el-form-item label="导入数据">
                        <el-input 
                            v-model="importData" 
                            type="textarea" 
                            :rows="10"
                            placeholder="请粘贴JSON格式的技能数据"
                        />
                    </el-form-item>
                    
                    <el-form-item>
                        <el-checkbox v-model="importOverwrite">
                            覆盖已存在的技能
                        </el-checkbox>
                    </el-form-item>
                </el-form>
                
                <template #footer>
                    <el-button @click="importVisible = false">取消</el-button>
                    <el-button type="primary" :loading="importing" @click="importSkills">
                        {{ importing ? '导入中...' : '开始导入' }}
                    </el-button>
                </template>
            </el-dialog>
        </div>
    `,

    data() {
        return {
            skills: [],
            loading: false,
            saving: false,
            dialogVisible: false,
            batchUpdateVisible: false,
            importVisible: false,
            batchUpdating: false,
            importing: false,
            editingSkill: null,
            selectedSkills: [],

            stats: {
                expert: 0,
                advanced: 0,
                intermediate: 0,
                beginner: 0,
                averageLevel: 0
            },

            filters: {
                category: 'all',
                minLevel: 0
            },

            pagination: {
                current: 1,
                pageSize: 12,
                total: 0
            },

            form: {
                name: '',
                category: '',
                level: 50,
                description: '',
                icon: '⚡',
                color: '#667eea',
                experience: '',
                projects: [],
                certifications: []
            },

            rules: {
                name: [
                    { required: true, message: '请输入技能名称', trigger: 'blur' }
                ],
                category: [
                    { required: true, message: '请选择技能分类', trigger: 'change' }
                ],
                level: [
                    { required: true, message: '请设置技能等级', trigger: 'blur' },
                    { type: 'number', min: 0, max: 100, message: '等级必须在0-100之间', trigger: 'blur' }
                ]
            },

            importData: '',
            importOverwrite: false
        };
    },

    async mounted() {
        await this.loadSkills();
        await this.loadStats();
    },

    watch: {
        'filters.category'() {
            this.pagination.current = 1;
            this.loadSkills();
        }
    },

    methods: {
        async loadSkills() {
            try {
                this.loading = true;

                const params = {
                    page: this.pagination.current,
                    limit: this.pagination.pageSize
                };

                if (this.filters.category && this.filters.category !== 'all') {
                    params.category = this.filters.category;
                }

                if (this.filters.minLevel > 0) {
                    params.level = this.filters.minLevel;
                }

                const response = await axios.get('/skills', { params });

                if (response.data.success) {
                    this.skills = response.data.data.skills;
                    this.pagination = response.data.data.pagination;
                }
            } catch (error) {
                console.error('Load skills error:', error);
                utils.showMessage('加载技能列表失败', 'error');
            } finally {
                this.loading = false;
            }
        },

        async loadStats() {
            try {
                const response = await axios.get('/skills/stats/summary');
                if (response.data.success) {
                    const data = response.data.data;
                    this.stats = {
                        expert: data.levelDistribution.expert || 0,
                        advanced: data.levelDistribution.advanced || 0,
                        intermediate: data.levelDistribution.intermediate || 0,
                        beginner: data.levelDistribution.beginner || 0,
                        averageLevel: data.averageLevel || 0
                    };
                }
            } catch (error) {
                console.error('Load skill stats error:', error);
            }
        },

        showSkillDialog(skill = null) {
            this.editingSkill = skill;
            if (skill) {
                this.form = { ...skill };
            } else {
                this.resetForm();
            }
            this.dialogVisible = true;
        },

        resetForm() {
            this.form = {
                name: '',
                category: '',
                level: 50,
                description: '',
                icon: '⚡',
                color: '#667eea',
                experience: '',
                projects: [],
                certifications: []
            };
            this.editingSkill = null;
            if (this.$refs.skillForm) {
                this.$refs.skillForm.resetFields();
            }
        },

        async saveSkill() {
            try {
                const valid = await this.$refs.skillForm.validate();
                if (!valid) return;

                this.saving = true;

                let response;
                if (this.editingSkill) {
                    response = await axios.put(`/skills/${this.editingSkill.id}`, this.form);
                } else {
                    response = await axios.post('/skills', this.form);
                }

                if (response.data.success) {
                    utils.showMessage(
                        this.editingSkill ? '技能更新成功' : '技能创建成功',
                        'success'
                    );
                    this.dialogVisible = false;
                    await this.loadSkills();
                    await this.loadStats();
                }
            } catch (error) {
                console.error('Save skill error:', error);
                const message = error.response?.data?.message || '保存技能失败';
                utils.showMessage(message, 'error');
            } finally {
                this.saving = false;
            }
        },

        async deleteSkill(skill) {
            try {
                await utils.showConfirm(`确定要删除技能 "${skill.name}" 吗？`, '删除确认');

                const response = await axios.delete(`/skills/${skill.id}`);

                if (response.data.success) {
                    utils.showMessage('技能删除成功', 'success');
                    await this.loadSkills();
                    await this.loadStats();
                }
            } catch (error) {
                if (error === 'cancel') return;
                console.error('Delete skill error:', error);
                const message = error.response?.data?.message || '删除技能失败';
                utils.showMessage(message, 'error');
            }
        },

        showBatchUpdateDialog() {
            this.selectedSkills = this.skills.map(skill => ({
                ...skill,
                newLevel: skill.level
            }));
            this.batchUpdateVisible = true;
        },

        async batchUpdateLevels() {
            try {
                this.batchUpdating = true;

                const updates = this.selectedSkills
                    .filter(skill => skill.newLevel !== skill.level)
                    .map(skill => ({
                        id: skill.id,
                        level: skill.newLevel
                    }));

                if (updates.length === 0) {
                    utils.showMessage('没有需要更新的技能', 'warning');
                    return;
                }

                const response = await axios.patch('/skills/batch/level', { updates });

                if (response.data.success) {
                    utils.showMessage(`成功更新 ${updates.length} 个技能等级`, 'success');
                    this.batchUpdateVisible = false;
                    await this.loadSkills();
                    await this.loadStats();
                }
            } catch (error) {
                console.error('Batch update error:', error);
                const message = error.response?.data?.message || '批量更新失败';
                utils.showMessage(message, 'error');
            } finally {
                this.batchUpdating = false;
            }
        },

        showImportDialog() {
            this.importData = '';
            this.importOverwrite = false;
            this.importVisible = true;
        },

        async importSkills() {
            try {
                if (!this.importData.trim()) {
                    utils.showMessage('请输入导入数据', 'warning');
                    return;
                }

                this.importing = true;

                let skills;
                try {
                    skills = JSON.parse(this.importData);
                } catch (e) {
                    utils.showMessage('JSON格式错误，请检查数据格式', 'error');
                    return;
                }

                if (!Array.isArray(skills)) {
                    utils.showMessage('数据格式错误，应为数组格式', 'error');
                    return;
                }

                const response = await axios.post('/skills/import', {
                    skills,
                    overwrite: this.importOverwrite
                });

                if (response.data.success) {
                    utils.showMessage(response.data.message, 'success');
                    this.importVisible = false;
                    await this.loadSkills();
                    await this.loadStats();
                }
            } catch (error) {
                console.error('Import skills error:', error);
                const message = error.response?.data?.message || '导入技能失败';
                utils.showMessage(message, 'error');
            } finally {
                this.importing = false;
            }
        },

        getCategoryName(category) {
            const names = {
                frontend: '前端开发',
                backend: '后端开发',
                database: '数据库',
                devops: '运维部署',
                mobile: '移动开发',
                ai: '人工智能',
                design: '设计',
                other: '其他'
            };
            return names[category] || category;
        }
    }
};