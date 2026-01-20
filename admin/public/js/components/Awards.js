// 获奖管理组件
const Awards = {
    template: `
        <div>
            <div class="page-header">
                <h1><i class="fas fa-trophy"></i> 获奖管理</h1>
                <p>管理您的竞赛获奖记录</p>
            </div>
            
            <!-- 操作栏 -->
            <div class="card" style="margin-bottom: 2rem;">
                <div class="card-body">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                        <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
                            <el-select v-model="filters.type" placeholder="奖项类型" clearable style="width: 120px;">
                                <el-option label="全部" value="all"></el-option>
                                <el-option label="金奖" value="gold"></el-option>
                                <el-option label="银奖" value="silver"></el-option>
                                <el-option label="铜奖" value="bronze"></el-option>
                                <el-option label="优秀奖" value="excellence"></el-option>
                                <el-option label="参与奖" value="participation"></el-option>
                            </el-select>
                            
                            <el-select v-model="filters.level" placeholder="比赛级别" clearable style="width: 120px;">
                                <el-option label="全部" value="all"></el-option>
                                <el-option label="国家级" value="national"></el-option>
                                <el-option label="省级" value="provincial"></el-option>
                                <el-option label="市级" value="municipal"></el-option>
                                <el-option label="校级" value="school"></el-option>
                            </el-select>
                            
                            <el-date-picker
                                v-model="filters.year"
                                type="year"
                                placeholder="选择年份"
                                style="width: 120px;"
                                @change="loadAwards"
                            />
                            
                            <el-button @click="loadAwards">
                                <i class="fas fa-sync-alt"></i> 刷新
                            </el-button>
                        </div>
                        
                        <div>
                            <el-button type="primary" @click="showAwardDialog()">
                                <i class="fas fa-plus"></i> 新建获奖记录
                            </el-button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 获奖统计 -->
            <div class="stats-grid" style="margin-bottom: 2rem;">
                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #ffd700, #ffed4e);">
                        <i class="fas fa-trophy"></i>
                    </div>
                    <div class="stat-info">
                        <h3>{{ stats.gold || 0 }}</h3>
                        <p>金奖</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #c0c0c0, #e8e8e8);">
                        <i class="fas fa-medal"></i>
                    </div>
                    <div class="stat-info">
                        <h3>{{ stats.silver || 0 }}</h3>
                        <p>银奖</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #cd7f32, #daa520);">
                        <i class="fas fa-award"></i>
                    </div>
                    <div class="stat-info">
                        <h3>{{ stats.bronze || 0 }}</h3>
                        <p>铜奖</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #667eea, #764ba2);">
                        <i class="fas fa-star"></i>
                    </div>
                    <div class="stat-info">
                        <h3>{{ stats.total || 0 }}</h3>
                        <p>总获奖数</p>
                    </div>
                </div>
            </div>
            
            <!-- 获奖列表 -->
            <div class="card">
                <div class="card-body">
                    <el-table 
                        :data="awards" 
                        v-loading="loading"
                        style="width: 100%"
                    >
                        <el-table-column prop="type" label="奖项" width="100">
                            <template #default="scope">
                                <div style="display: flex; align-items: center; gap: 0.5rem;">
                                    <span :style="{ color: getAwardColor(scope.row.type) }">
                                        {{ getAwardIcon(scope.row.type) }}
                                    </span>
                                    <span>{{ getAwardName(scope.row.type) }}</span>
                                </div>
                            </template>
                        </el-table-column>
                        
                        <el-table-column prop="title" label="项目名称" min-width="200">
                            <template #default="scope">
                                <div>
                                    <strong>{{ scope.row.title }}</strong>
                                    <div style="color: #666; font-size: 0.9rem; margin-top: 0.25rem;">
                                        {{ scope.row.competition }}
                                    </div>
                                </div>
                            </template>
                        </el-table-column>
                        
                        <el-table-column prop="level" label="级别" width="100">
                            <template #default="scope">
                                <el-tag :type="getLevelType(scope.row.level)">
                                    {{ getLevelName(scope.row.level) }}
                                </el-tag>
                            </template>
                        </el-table-column>
                        
                        <el-table-column prop="date" label="获奖时间" width="120">
                            <template #default="scope">
                                {{ new Date(scope.row.date).toLocaleDateString('zh-CN') }}
                            </template>
                        </el-table-column>
                        
                        <el-table-column prop="technologies" label="技术栈" min-width="200">
                            <template #default="scope">
                                <div style="display: flex; flex-wrap: wrap; gap: 0.25rem;">
                                    <el-tag 
                                        v-for="tech in (scope.row.technologies || []).slice(0, 3)" 
                                        :key="tech"
                                        size="small"
                                        effect="plain"
                                    >
                                        {{ tech }}
                                    </el-tag>
                                    <el-tag 
                                        v-if="(scope.row.technologies || []).length > 3"
                                        size="small"
                                        type="info"
                                        effect="plain"
                                    >
                                        +{{ (scope.row.technologies || []).length - 3 }}
                                    </el-tag>
                                </div>
                            </template>
                        </el-table-column>
                        
                        <el-table-column prop="teamMembers" label="团队成员" width="120">
                            <template #default="scope">
                                <span v-if="scope.row.teamMembers && scope.row.teamMembers.length > 0">
                                    {{ scope.row.teamMembers.length }}人团队
                                </span>
                                <span v-else style="color: #999;">个人项目</span>
                            </template>
                        </el-table-column>
                        
                        <el-table-column label="操作" width="200" fixed="right">
                            <template #default="scope">
                                <el-button size="small" @click="showAwardDialog(scope.row)">
                                    <i class="fas fa-edit"></i> 编辑
                                </el-button>
                                <el-button 
                                    size="small" 
                                    type="danger" 
                                    @click="deleteAward(scope.row)"
                                >
                                    <i class="fas fa-trash"></i> 删除
                                </el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                    
                    <!-- 分页 -->
                    <div style="margin-top: 1rem; text-align: right;">
                        <el-pagination
                            v-model:current-page="pagination.current"
                            v-model:page-size="pagination.pageSize"
                            :page-sizes="[10, 20, 50, 100]"
                            :total="pagination.total"
                            layout="total, sizes, prev, pager, next, jumper"
                            @size-change="loadAwards"
                            @current-change="loadAwards"
                        />
                    </div>
                </div>
            </div>
            
            <!-- 获奖记录编辑对话框 -->
            <el-dialog 
                v-model="dialogVisible" 
                :title="editingAward ? '编辑获奖记录' : '新建获奖记录'"
                width="800px"
                @close="resetForm"
            >
                <el-form 
                    :model="form" 
                    :rules="rules" 
                    ref="awardForm"
                    label-width="100px"
                >
                    <el-row :gutter="20">
                        <el-col :span="12">
                            <el-form-item label="项目名称" prop="title">
                                <el-input v-model="form.title" placeholder="请输入项目名称" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="比赛名称" prop="competition">
                                <el-input v-model="form.competition" placeholder="请输入比赛名称" />
                            </el-form-item>
                        </el-col>
                    </el-row>
                    
                    <el-row :gutter="20">
                        <el-col :span="12">
                            <el-form-item label="奖项类型" prop="type">
                                <el-select v-model="form.type" placeholder="选择奖项类型" style="width: 100%;">
                                    <el-option label="金奖" value="gold"></el-option>
                                    <el-option label="银奖" value="silver"></el-option>
                                    <el-option label="铜奖" value="bronze"></el-option>
                                    <el-option label="优秀奖" value="excellence"></el-option>
                                    <el-option label="参与奖" value="participation"></el-option>
                                </el-select>
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="比赛级别" prop="level">
                                <el-select v-model="form.level" placeholder="选择比赛级别" style="width: 100%;">
                                    <el-option label="国家级" value="national"></el-option>
                                    <el-option label="省级" value="provincial"></el-option>
                                    <el-option label="市级" value="municipal"></el-option>
                                    <el-option label="校级" value="school"></el-option>
                                </el-select>
                            </el-form-item>
                        </el-col>
                    </el-row>
                    
                    <el-form-item label="获奖时间" prop="date">
                        <el-date-picker
                            v-model="form.date"
                            type="date"
                            placeholder="选择获奖时间"
                            style="width: 100%;"
                        />
                    </el-form-item>
                    
                    <el-form-item label="项目描述">
                        <el-input 
                            v-model="form.description" 
                            type="textarea" 
                            :rows="3"
                            placeholder="请输入项目描述"
                        />
                    </el-form-item>
                    
                    <el-form-item label="技术栈">
                        <el-select
                            v-model="form.technologies"
                            multiple
                            filterable
                            allow-create
                            placeholder="选择或输入技术栈"
                            style="width: 100%;"
                        >
                            <el-option v-for="tech in commonTech" :key="tech" :label="tech" :value="tech"></el-option>
                        </el-select>
                    </el-form-item>
                    
                    <el-form-item label="团队成员">
                        <el-select
                            v-model="form.teamMembers"
                            multiple
                            filterable
                            allow-create
                            placeholder="输入团队成员姓名"
                            style="width: 100%;"
                        >
                        </el-select>
                    </el-form-item>
                    
                    <el-row :gutter="20">
                        <el-col :span="12">
                            <el-form-item label="证书链接">
                                <el-input v-model="form.certificate" placeholder="证书图片或PDF链接" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="项目链接">
                                <el-input v-model="form.projectUrl" placeholder="项目展示或代码链接" />
                            </el-form-item>
                        </el-col>
                    </el-row>
                </el-form>
                
                <template #footer>
                    <el-button @click="dialogVisible = false">取消</el-button>
                    <el-button type="primary" :loading="saving" @click="saveAward">
                        {{ saving ? '保存中...' : '保存' }}
                    </el-button>
                </template>
            </el-dialog>
        </div>
    `,

    data() {
        return {
            awards: [],
            loading: false,
            saving: false,
            dialogVisible: false,
            editingAward: null,

            stats: {
                gold: 0,
                silver: 0,
                bronze: 0,
                total: 0
            },

            filters: {
                type: 'all',
                level: 'all',
                year: null
            },

            pagination: {
                current: 1,
                pageSize: 10,
                total: 0
            },

            form: {
                title: '',
                competition: '',
                type: '',
                level: '',
                date: '',
                description: '',
                certificate: '',
                teamMembers: [],
                technologies: [],
                projectUrl: ''
            },

            rules: {
                title: [
                    { required: true, message: '请输入项目名称', trigger: 'blur' }
                ],
                competition: [
                    { required: true, message: '请输入比赛名称', trigger: 'blur' }
                ],
                type: [
                    { required: true, message: '请选择奖项类型', trigger: 'change' }
                ],
                level: [
                    { required: true, message: '请选择比赛级别', trigger: 'change' }
                ],
                date: [
                    { required: true, message: '请选择获奖时间', trigger: 'change' }
                ]
            },

            commonTech: [
                'React', 'Vue.js', 'Angular', 'JavaScript', 'TypeScript',
                'Node.js', 'Express', 'Python', 'Django', 'Flask',
                'Java', 'Spring Boot', 'C#', '.NET', 'PHP',
                'MySQL', 'PostgreSQL', 'MongoDB', 'Redis',
                'Docker', 'Kubernetes', 'AWS', 'Azure'
            ]
        };
    },

    async mounted() {
        await this.loadAwards();
        await this.loadStats();
    },

    watch: {
        'filters.type'() {
            this.pagination.current = 1;
            this.loadAwards();
        },
        'filters.level'() {
            this.pagination.current = 1;
            this.loadAwards();
        }
    },

    methods: {
        async loadAwards() {
            try {
                this.loading = true;

                const params = {
                    page: this.pagination.current,
                    limit: this.pagination.pageSize
                };

                if (this.filters.type && this.filters.type !== 'all') {
                    params.type = this.filters.type;
                }

                if (this.filters.level && this.filters.level !== 'all') {
                    params.level = this.filters.level;
                }

                if (this.filters.year) {
                    params.year = this.filters.year.getFullYear();
                }

                const response = await axios.get('/awards', { params });

                if (response.data.success) {
                    this.awards = response.data.data.awards;
                    this.pagination = response.data.data.pagination;
                }
            } catch (error) {
                console.error('Load awards error:', error);
                utils.showMessage('加载获奖记录失败', 'error');
            } finally {
                this.loading = false;
            }
        },

        async loadStats() {
            try {
                const response = await axios.get('/awards/stats/summary');
                if (response.data.success) {
                    const data = response.data.data;
                    this.stats = {
                        gold: data.typeStats.gold || 0,
                        silver: data.typeStats.silver || 0,
                        bronze: data.typeStats.bronze || 0,
                        total: data.total || 0
                    };
                }
            } catch (error) {
                console.error('Load award stats error:', error);
            }
        },

        showAwardDialog(award = null) {
            this.editingAward = award;
            if (award) {
                this.form = {
                    ...award,
                    date: award.date ? new Date(award.date) : ''
                };
            } else {
                this.resetForm();
            }
            this.dialogVisible = true;
        },

        resetForm() {
            this.form = {
                title: '',
                competition: '',
                type: '',
                level: '',
                date: '',
                description: '',
                certificate: '',
                teamMembers: [],
                technologies: [],
                projectUrl: ''
            };
            this.editingAward = null;
            if (this.$refs.awardForm) {
                this.$refs.awardForm.resetFields();
            }
        },

        async saveAward() {
            try {
                const valid = await this.$refs.awardForm.validate();
                if (!valid) return;

                this.saving = true;

                const formData = {
                    ...this.form,
                    date: this.form.date ? this.form.date.toISOString().split('T')[0] : ''
                };

                let response;
                if (this.editingAward) {
                    response = await axios.put(`/awards/${this.editingAward.id}`, formData);
                } else {
                    response = await axios.post('/awards', formData);
                }

                if (response.data.success) {
                    utils.showMessage(
                        this.editingAward ? '获奖记录更新成功' : '获奖记录创建成功',
                        'success'
                    );
                    this.dialogVisible = false;
                    await this.loadAwards();
                    await this.loadStats();
                }
            } catch (error) {
                console.error('Save award error:', error);
                const message = error.response?.data?.message || '保存获奖记录失败';
                utils.showMessage(message, 'error');
            } finally {
                this.saving = false;
            }
        },

        async deleteAward(award) {
            try {
                await utils.showConfirm(`确定要删除获奖记录 "${award.title}" 吗？`, '删除确认');

                const response = await axios.delete(`/awards/${award.id}`);

                if (response.data.success) {
                    utils.showMessage('获奖记录删除成功', 'success');
                    await this.loadAwards();
                    await this.loadStats();
                }
            } catch (error) {
                if (error === 'cancel') return;
                console.error('Delete award error:', error);
                const message = error.response?.data?.message || '删除获奖记录失败';
                utils.showMessage(message, 'error');
            }
        },

        getAwardIcon(type) {
            const icons = {
                gold: '🏆',
                silver: '🥈',
                bronze: '🥉',
                excellence: '🎖️',
                participation: '🏅'
            };
            return icons[type] || '🏅';
        },

        getAwardName(type) {
            const names = {
                gold: '金奖',
                silver: '银奖',
                bronze: '铜奖',
                excellence: '优秀奖',
                participation: '参与奖'
            };
            return names[type] || type;
        },

        getAwardColor(type) {
            const colors = {
                gold: '#ffd700',
                silver: '#c0c0c0',
                bronze: '#cd7f32',
                excellence: '#667eea',
                participation: '#27ae60'
            };
            return colors[type] || '#666';
        },

        getLevelType(level) {
            const types = {
                national: 'danger',
                provincial: 'warning',
                municipal: 'primary',
                school: 'info'
            };
            return types[level] || '';
        },

        getLevelName(level) {
            const names = {
                national: '国家级',
                provincial: '省级',
                municipal: '市级',
                school: '校级'
            };
            return names[level] || level;
        }
    }
};