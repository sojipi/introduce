// 项目管理组件
const Projects = {
    template: `
        <div>
            <div class="page-header">
                <h1><i class="fas fa-project-diagram"></i> 项目管理</h1>
                <p>管理您的项目作品集</p>
            </div>
            
            <!-- 操作栏 -->
            <div class="card" style="margin-bottom: 2rem;">
                <div class="card-body">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                        <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
                            <el-select v-model="filters.category" placeholder="选择分类" clearable style="width: 150px;">
                                <el-option label="全部" value="all"></el-option>
                                <el-option label="Web应用" value="web"></el-option>
                                <el-option label="移动应用" value="mobile"></el-option>
                                <el-option label="AI/ML项目" value="ai"></el-option>
                                <el-option label="游戏开发" value="game"></el-option>
                                <el-option label="区块链" value="blockchain"></el-option>
                            </el-select>
                            
                            <el-input
                                v-model="filters.search"
                                placeholder="搜索项目..."
                                prefix-icon="Search"
                                style="width: 200px;"
                                @input="handleSearch"
                            />
                            
                            <el-button @click="loadProjects">
                                <i class="fas fa-sync-alt"></i> 刷新
                            </el-button>
                        </div>
                        
                        <div>
                            <el-button type="primary" @click="showProjectDialog()">
                                <i class="fas fa-plus"></i> 新建项目
                            </el-button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 项目列表 -->
            <div class="card">
                <div class="card-body">
                    <el-table 
                        :data="projects" 
                        v-loading="loading"
                        style="width: 100%"
                        @selection-change="handleSelectionChange"
                    >
                        <el-table-column type="selection" width="55"></el-table-column>
                        
                        <el-table-column prop="icon" label="图标" width="80">
                            <template #default="scope">
                                <span style="font-size: 1.5rem;">{{ scope.row.icon }}</span>
                            </template>
                        </el-table-column>
                        
                        <el-table-column prop="title" label="项目名称" min-width="200">
                            <template #default="scope">
                                <div>
                                    <strong>{{ scope.row.title }}</strong>
                                    <div style="color: #666; font-size: 0.9rem; margin-top: 0.25rem;">
                                        {{ (scope.row.description || '').substring(0, 50) }}{{ (scope.row.description || '').length > 50 ? '...' : '' }}
                                    </div>
                                </div>
                            </template>
                        </el-table-column>
                        
                        <el-table-column prop="category" label="分类" width="120">
                            <template #default="scope">
                                <el-tag :type="getCategoryType(scope.row.category)">
                                    {{ getCategoryName(scope.row.category) }}
                                </el-tag>
                            </template>
                        </el-table-column>
                        
                        <el-table-column prop="tech" label="技术栈" min-width="200">
                            <template #default="scope">
                                <div style="display: flex; flex-wrap: wrap; gap: 0.25rem;">
                                    <el-tag 
                                        v-for="tech in (scope.row.tech || []).slice(0, 3)" 
                                        :key="tech"
                                        size="small"
                                        effect="plain"
                                    >
                                        {{ tech }}
                                    </el-tag>
                                    <el-tag 
                                        v-if="(scope.row.tech || []).length > 3"
                                        size="small"
                                        type="info"
                                        effect="plain"
                                    >
                                        +{{ (scope.row.tech || []).length - 3 }}
                                    </el-tag>
                                </div>
                            </template>
                        </el-table-column>
                        
                        <el-table-column prop="status" label="状态" width="100">
                            <template #default="scope">
                                <el-tag :type="scope.row.status === 'active' ? 'success' : 'info'">
                                    {{ scope.row.status === 'active' ? '活跃' : '归档' }}
                                </el-tag>
                            </template>
                        </el-table-column>
                        
                        <el-table-column prop="createdAt" label="创建时间" width="180">
                            <template #default="scope">
                                {{ utils.formatDate(scope.row.createdAt) }}
                            </template>
                        </el-table-column>
                        
                        <el-table-column label="操作" width="200" fixed="right">
                            <template #default="scope">
                                <el-button size="small" @click="showProjectDialog(scope.row)">
                                    <i class="fas fa-edit"></i> 编辑
                                </el-button>
                                <el-button 
                                    size="small" 
                                    type="danger" 
                                    :loading="deleting"
                                    :disabled="deleting"
                                    @click="deleteProject(scope.row)"
                                >
                                    <i class="fas fa-trash"></i> {{ deleting ? '删除中...' : '删除' }}
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
                            @size-change="loadProjects"
                            @current-change="loadProjects"
                        />
                    </div>
                </div>
            </div>
            
            <!-- 项目编辑对话框 -->
            <el-dialog 
                v-model="dialogVisible" 
                :title="editingProject ? '编辑项目' : '新建项目'"
                width="800px"
                @close="resetForm"
            >
                <el-form 
                    :model="form" 
                    :rules="rules" 
                    ref="projectForm"
                    label-width="100px"
                >
                    <el-row :gutter="20">
                        <el-col :span="12">
                            <el-form-item label="项目名称" prop="title">
                                <el-input v-model="form.title" placeholder="请输入项目名称" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="分类" prop="category">
                                <el-select v-model="form.category" placeholder="选择分类" style="width: 100%;">
                                    <el-option label="Web应用" value="web"></el-option>
                                    <el-option label="移动应用" value="mobile"></el-option>
                                    <el-option label="AI/ML项目" value="ai"></el-option>
                                    <el-option label="游戏开发" value="game"></el-option>
                                    <el-option label="区块链" value="blockchain"></el-option>
                                </el-select>
                            </el-form-item>
                        </el-col>
                    </el-row>
                    
                    <el-form-item label="项目描述" prop="description">
                        <el-input 
                            v-model="form.description" 
                            type="textarea" 
                            :rows="3"
                            placeholder="请输入项目描述"
                        />
                    </el-form-item>
                    
                    <el-row :gutter="20">
                        <el-col :span="12">
                            <el-form-item label="图标">
                                <el-input v-model="form.icon" placeholder="项目图标 (emoji)" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="状态">
                                <el-select v-model="form.status" style="width: 100%;">
                                    <el-option label="活跃" value="active"></el-option>
                                    <el-option label="归档" value="archived"></el-option>
                                </el-select>
                            </el-form-item>
                        </el-col>
                    </el-row>
                    
                    <el-form-item label="技术栈">
                        <el-select
                            v-model="form.tech"
                            multiple
                            filterable
                            allow-create
                            placeholder="选择或输入技术栈"
                            style="width: 100%;"
                        >
                            <el-option v-for="tech in commonTech" :key="tech" :label="tech" :value="tech"></el-option>
                        </el-select>
                    </el-form-item>
                    
                    <el-row :gutter="20">
                        <el-col :span="12">
                            <el-form-item label="演示地址">
                                <el-input v-model="form.demoUrl" placeholder="项目演示地址" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="GitHub地址">
                                <el-input v-model="form.githubUrl" placeholder="GitHub仓库地址" />
                            </el-form-item>
                        </el-col>
                    </el-row>
                </el-form>
                
                <template #footer>
                    <el-button @click="dialogVisible = false">取消</el-button>
                    <el-button type="primary" :loading="saving" @click="saveProject">
                        {{ saving ? '保存中...' : '保存' }}
                    </el-button>
                </template>
            </el-dialog>
        </div>
    `,

    data() {
        return {
            projects: [],
            loading: false,
            saving: false,
            deleting: false,
            dialogVisible: false,
            editingProject: null,
            selectedProjects: [],

            filters: {
                category: 'all',
                search: ''
            },

            pagination: {
                current: 1,
                pageSize: 10,
                total: 0
            },

            form: {
                title: '',
                description: '',
                category: '',
                tech: [],
                icon: '🚀',
                status: 'active',
                demoUrl: '',
                githubUrl: ''
            },

            rules: {
                title: [
                    { required: true, message: '请输入项目名称', trigger: 'blur' }
                ],
                description: [
                    { required: true, message: '请输入项目描述', trigger: 'blur' }
                ],
                category: [
                    { required: true, message: '请选择项目分类', trigger: 'change' }
                ]
            },

            commonTech: [
                'React', 'Vue.js', 'Angular', 'JavaScript', 'TypeScript',
                'Node.js', 'Express', 'Koa', 'Python', 'Django', 'Flask',
                'Java', 'Spring Boot', 'C#', '.NET', 'PHP', 'Laravel',
                'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Docker',
                'Kubernetes', 'AWS', 'Azure', 'Git', 'Webpack', 'Vite'
            ]
        };
    },

    async mounted() {
        await this.loadProjects();
    },

    watch: {
        'filters.category'() {
            this.pagination.current = 1;
            this.loadProjects();
        }
    },

    methods: {
        async loadProjects() {
            try {
                this.loading = true;

                const params = {
                    page: this.pagination.current,
                    limit: this.pagination.pageSize
                };

                if (this.filters.category && this.filters.category !== 'all') {
                    params.category = this.filters.category;
                }

                const response = await axios.get('/projects', { params });

                if (response.data.success) {
                    this.projects = response.data.data.projects;
                    this.pagination = response.data.data.pagination;
                }
            } catch (error) {
                console.error('Load projects error:', error);
                utils.showMessage('加载项目列表失败', 'error');
            } finally {
                this.loading = false;
            }
        },

        handleSearch() {
            // 简单的前端搜索
            // 在实际应用中，应该发送到后端进行搜索
            this.pagination.current = 1;
            this.loadProjects();
        },

        handleSelectionChange(selection) {
            this.selectedProjects = selection;
        },

        showProjectDialog(project = null) {
            this.editingProject = project;
            if (project) {
                this.form = { ...project };
            } else {
                this.resetForm();
            }
            this.dialogVisible = true;
        },

        resetForm() {
            this.form = {
                title: '',
                description: '',
                category: '',
                tech: [],
                icon: '🚀',
                status: 'active',
                demoUrl: '',
                githubUrl: ''
            };
            this.editingProject = null;
            if (this.$refs.projectForm) {
                this.$refs.projectForm.resetFields();
            }
        },

        async saveProject() {
            try {
                const valid = await this.$refs.projectForm.validate();
                if (!valid) return;

                this.saving = true;

                let response;
                if (this.editingProject) {
                    response = await axios.put(`/projects/${this.editingProject.id}`, this.form);
                } else {
                    response = await axios.post('/projects', this.form);
                }

                if (response.data.success) {
                    utils.showMessage(
                        this.editingProject ? '项目更新成功' : '项目创建成功',
                        'success'
                    );
                    this.dialogVisible = false;
                    await this.loadProjects();
                }
            } catch (error) {
                console.error('Save project error:', error);
                const message = error.response?.data?.message || '保存项目失败';
                utils.showMessage(message, 'error');
            } finally {
                this.saving = false;
            }
        },

        async deleteProject(project) {
            // 防止重复删除
            if (this.deleting) {
                return;
            }

            try {
                await utils.showConfirm(`确定要删除项目 "${project.title}" 吗？`, '删除确认');

                this.deleting = true;
                console.log(`🗑️ 开始删除项目: ${project.id} - ${project.title}`);

                const response = await axios.delete(`/projects/${project.id}`);

                if (response.data.success) {
                    console.log(`✅ 项目删除成功: ${project.id}`);
                    utils.showMessage('项目删除成功', 'success');
                    await this.loadProjects();
                } else {
                    console.log(`❌ 项目删除失败: ${project.id}`, response.data);
                    utils.showMessage(response.data.message || '删除项目失败', 'error');
                }
            } catch (error) {
                if (error === 'cancel') return;
                console.error('Delete project error:', error);
                const message = error.response?.data?.message || '删除项目失败';
                utils.showMessage(message, 'error');
            } finally {
                this.deleting = false;
            }
        },

        getCategoryType(category) {
            const types = {
                web: 'primary',
                mobile: 'success',
                ai: 'warning',
                game: 'danger',
                blockchain: 'info'
            };
            return types[category] || '';
        },

        getCategoryName(category) {
            const names = {
                web: 'Web应用',
                mobile: '移动应用',
                ai: 'AI/ML',
                game: '游戏',
                blockchain: '区块链'
            };
            return names[category] || category;
        }
    }
};