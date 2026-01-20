// 时间线管理组件
const Timeline = {
    template: `
        <div>
            <div class="page-header">
                <h1><i class="fas fa-calendar-alt"></i> 时间线管理</h1>
                <p>管理您的参赛和活动日程</p>
            </div>
            
            <!-- 操作栏 -->
            <div class="card" style="margin-bottom: 2rem;">
                <div class="card-body">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                        <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
                            <el-select v-model="filters.status" placeholder="状态" clearable style="width: 120px;">
                                <el-option label="全部" value="all"></el-option>
                                <el-option label="已完成" value="completed"></el-option>
                                <el-option label="进行中" value="ongoing"></el-option>
                                <el-option label="即将开始" value="upcoming"></el-option>
                                <el-option label="已取消" value="cancelled"></el-option>
                            </el-select>
                            
                            <el-select v-model="filters.type" placeholder="类型" clearable style="width: 120px;">
                                <el-option label="全部" value="all"></el-option>
                                <el-option label="竞赛" value="competition"></el-option>
                                <el-option label="获奖" value="award"></el-option>
                                <el-option label="项目" value="project"></el-option>
                                <el-option label="会议" value="conference"></el-option>
                                <el-option label="培训" value="workshop"></el-option>
                            </el-select>
                            
                            <el-date-picker
                                v-model="filters.dateRange"
                                type="daterange"
                                range-separator="至"
                                start-placeholder="开始日期"
                                end-placeholder="结束日期"
                                style="width: 240px;"
                                @change="loadEvents"
                            />
                            
                            <el-button @click="loadEvents">
                                <i class="fas fa-sync-alt"></i> 刷新
                            </el-button>
                        </div>
                        
                        <div>
                            <el-button type="primary" @click="showEventDialog()">
                                <i class="fas fa-plus"></i> 新建事件
                            </el-button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 统计卡片 -->
            <div class="stats-grid" style="margin-bottom: 2rem;">
                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #27ae60, #2ecc71);">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="stat-info">
                        <h3>{{ stats.completed || 0 }}</h3>
                        <p>已完成</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #f39c12, #e67e22);">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div class="stat-info">
                        <h3>{{ stats.ongoing || 0 }}</h3>
                        <p>进行中</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #3498db, #2980b9);">
                        <i class="fas fa-calendar-plus"></i>
                    </div>
                    <div class="stat-info">
                        <h3>{{ stats.upcoming || 0 }}</h3>
                        <p>即将开始</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #667eea, #764ba2);">
                        <i class="fas fa-list"></i>
                    </div>
                    <div class="stat-info">
                        <h3>{{ stats.total || 0 }}</h3>
                        <p>总事件数</p>
                    </div>
                </div>
            </div>
            
            <!-- 时间线视图切换 -->
            <div class="card" style="margin-bottom: 2rem;">
                <div class="card-header">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h3><i class="fas fa-timeline"></i> 时间线视图</h3>
                        <el-radio-group v-model="viewMode" @change="renderTimeline">
                            <el-radio-button label="timeline">时间线</el-radio-button>
                            <el-radio-button label="table">表格</el-radio-button>
                        </el-radio-group>
                    </div>
                </div>
                <div class="card-body">
                    <!-- 时间线视图 -->
                    <div v-if="viewMode === 'timeline'" class="timeline-view">
                        <div class="timeline-container">
                            <div class="timeline-line"></div>
                            <div 
                                v-for="(event, index) in events" 
                                :key="event.id"
                                class="timeline-item"
                                :class="{ 'timeline-item-right': index % 2 === 1 }"
                            >
                                <div class="timeline-dot" :class="getStatusClass(event.status)">
                                    <i :class="getTypeIcon(event.type)"></i>
                                </div>
                                <div class="timeline-content">
                                    <div class="timeline-date">{{ utils.formatDate(event.date) }}</div>
                                    <h4>{{ event.title }}</h4>
                                    <p>{{ event.description }}</p>
                                    <div class="timeline-meta">
                                        <el-tag :type="getStatusType(event.status)" size="small">
                                            {{ getStatusName(event.status) }}
                                        </el-tag>
                                        <el-tag type="info" size="small" style="margin-left: 0.5rem;">
                                            {{ getTypeName(event.type) }}
                                        </el-tag>
                                    </div>
                                    <div class="timeline-actions" style="margin-top: 0.5rem;">
                                        <el-button size="small" @click="showEventDialog(event)">
                                            编辑
                                        </el-button>
                                        <el-button size="small" type="danger" @click="deleteEvent(event)">
                                            删除
                                        </el-button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 表格视图 -->
                    <div v-else>
                        <el-table 
                            :data="events" 
                            v-loading="loading"
                            style="width: 100%"
                        >
                            <el-table-column prop="title" label="事件名称" min-width="200">
                                <template #default="scope">
                                    <div>
                                        <strong>{{ scope.row.title }}</strong>
                                        <div style="color: #666; font-size: 0.9rem; margin-top: 0.25rem;">
                                            {{ (scope.row.description || '').substring(0, 50) }}{{ (scope.row.description || '').length > 50 ? '...' : '' }}
                                        </div>
                                    </div>
                                </template>
                            </el-table-column>
                            
                            <el-table-column prop="type" label="类型" width="100">
                                <template #default="scope">
                                    <el-tag type="info" size="small">
                                        {{ getTypeName(scope.row.type) }}
                                    </el-tag>
                                </template>
                            </el-table-column>
                            
                            <el-table-column prop="status" label="状态" width="100">
                                <template #default="scope">
                                    <el-tag :type="getStatusType(scope.row.status)" size="small">
                                        {{ getStatusName(scope.row.status) }}
                                    </el-tag>
                                </template>
                            </el-table-column>
                            
                            <el-table-column prop="date" label="日期" width="180">
                                <template #default="scope">
                                    {{ utils.formatDate(scope.row.date) }}
                                </template>
                            </el-table-column>
                            
                            <el-table-column prop="location" label="地点" width="150">
                                <template #default="scope">
                                    {{ scope.row.location || '-' }}
                                </template>
                            </el-table-column>
                            
                            <el-table-column label="操作" width="200" fixed="right">
                                <template #default="scope">
                                    <el-button size="small" @click="showEventDialog(scope.row)">
                                        <i class="fas fa-edit"></i> 编辑
                                    </el-button>
                                    <el-button 
                                        size="small" 
                                        type="danger" 
                                        @click="deleteEvent(scope.row)"
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
                                @size-change="loadEvents"
                                @current-change="loadEvents"
                            />
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 事件编辑对话框 -->
            <el-dialog 
                v-model="dialogVisible" 
                :title="editingEvent ? '编辑事件' : '新建事件'"
                width="800px"
                @close="resetForm"
            >
                <el-form 
                    :model="form" 
                    :rules="rules" 
                    ref="eventForm"
                    label-width="100px"
                >
                    <el-row :gutter="20">
                        <el-col :span="12">
                            <el-form-item label="事件名称" prop="title">
                                <el-input v-model="form.title" placeholder="请输入事件名称" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="事件类型" prop="type">
                                <el-select v-model="form.type" placeholder="选择事件类型" style="width: 100%;">
                                    <el-option label="竞赛" value="competition"></el-option>
                                    <el-option label="获奖" value="award"></el-option>
                                    <el-option label="项目" value="project"></el-option>
                                    <el-option label="会议" value="conference"></el-option>
                                    <el-option label="培训" value="workshop"></el-option>
                                </el-select>
                            </el-form-item>
                        </el-col>
                    </el-row>
                    
                    <el-form-item label="事件描述" prop="description">
                        <el-input 
                            v-model="form.description" 
                            type="textarea" 
                            :rows="3"
                            placeholder="请输入事件描述"
                        />
                    </el-form-item>
                    
                    <el-row :gutter="20">
                        <el-col :span="12">
                            <el-form-item label="事件日期" prop="date">
                                <el-date-picker
                                    v-model="form.date"
                                    type="datetime"
                                    placeholder="选择事件日期"
                                    style="width: 100%;"
                                />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="事件状态" prop="status">
                                <el-select v-model="form.status" placeholder="选择事件状态" style="width: 100%;">
                                    <el-option label="已完成" value="completed"></el-option>
                                    <el-option label="进行中" value="ongoing"></el-option>
                                    <el-option label="即将开始" value="upcoming"></el-option>
                                    <el-option label="已取消" value="cancelled"></el-option>
                                </el-select>
                            </el-form-item>
                        </el-col>
                    </el-row>
                    
                    <el-row :gutter="20">
                        <el-col :span="12">
                            <el-form-item label="地点">
                                <el-input v-model="form.location" placeholder="事件地点" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="主办方">
                                <el-input v-model="form.organizer" placeholder="主办方名称" />
                            </el-form-item>
                        </el-col>
                    </el-row>
                    
                    <el-form-item label="参与者">
                        <el-select
                            v-model="form.participants"
                            multiple
                            filterable
                            allow-create
                            placeholder="输入参与者姓名"
                            style="width: 100%;"
                        >
                        </el-select>
                    </el-form-item>
                    
                    <el-form-item label="结果/成果">
                        <el-input 
                            v-model="form.result" 
                            type="textarea" 
                            :rows="2"
                            placeholder="事件结果或成果描述"
                        />
                    </el-form-item>
                    
                    <el-form-item label="相关链接">
                        <el-input 
                            v-model="form.links" 
                            type="textarea" 
                            :rows="2"
                            placeholder="相关链接，每行一个"
                        />
                    </el-form-item>
                    
                    <el-form-item label="标签">
                        <el-select
                            v-model="form.tags"
                            multiple
                            filterable
                            allow-create
                            placeholder="添加标签"
                            style="width: 100%;"
                        >
                            <el-option v-for="tag in commonTags" :key="tag" :label="tag" :value="tag"></el-option>
                        </el-select>
                    </el-form-item>
                </el-form>
                
                <template #footer>
                    <el-button @click="dialogVisible = false">取消</el-button>
                    <el-button type="primary" :loading="saving" @click="saveEvent">
                        {{ saving ? '保存中...' : '保存' }}
                    </el-button>
                </template>
            </el-dialog>
        </div>
    `,

    data() {
        return {
            events: [],
            loading: false,
            saving: false,
            dialogVisible: false,
            editingEvent: null,
            viewMode: 'timeline',

            stats: {
                completed: 0,
                ongoing: 0,
                upcoming: 0,
                total: 0
            },

            filters: {
                status: 'all',
                type: 'all',
                dateRange: null
            },

            pagination: {
                current: 1,
                pageSize: 20,
                total: 0
            },

            form: {
                title: '',
                description: '',
                date: '',
                type: '',
                status: '',
                location: '',
                organizer: '',
                participants: [],
                result: '',
                links: '',
                tags: []
            },

            rules: {
                title: [
                    { required: true, message: '请输入事件名称', trigger: 'blur' }
                ],
                description: [
                    { required: true, message: '请输入事件描述', trigger: 'blur' }
                ],
                date: [
                    { required: true, message: '请选择事件日期', trigger: 'change' }
                ],
                type: [
                    { required: true, message: '请选择事件类型', trigger: 'change' }
                ],
                status: [
                    { required: true, message: '请选择事件状态', trigger: 'change' }
                ]
            },

            commonTags: [
                '编程竞赛', '算法', '前端', '后端', '全栈', '移动开发',
                'AI/ML', '数据科学', '区块链', '游戏开发', '开源项目',
                '团队合作', '个人项目', '创新', '技术分享'
            ]
        };
    },

    async mounted() {
        await this.loadEvents();
        await this.loadStats();
    },

    watch: {
        'filters.status'() {
            this.pagination.current = 1;
            this.loadEvents();
        },
        'filters.type'() {
            this.pagination.current = 1;
            this.loadEvents();
        }
    },

    methods: {
        async loadEvents() {
            try {
                this.loading = true;

                const params = {
                    page: this.pagination.current,
                    limit: this.pagination.pageSize
                };

                if (this.filters.status && this.filters.status !== 'all') {
                    params.status = this.filters.status;
                }

                if (this.filters.type && this.filters.type !== 'all') {
                    params.type = this.filters.type;
                }

                const response = await axios.get('/timeline', { params });

                if (response.data.success) {
                    this.events = response.data.data.timeline; // 修复：后端返回的 key 是 timeline，不是 events
                    this.pagination = response.data.data.pagination;
                }
            } catch (error) {
                console.error('Load events error:', error);
                utils.showMessage('加载时间线事件失败', 'error');
            } finally {
                this.loading = false;
            }
        },

        async loadStats() {
            try {
                const response = await axios.get('/timeline/stats/summary');
                if (response.data.success) {
                    const data = response.data.data;
                    this.stats = {
                        completed: data.statusStats.completed || 0,
                        ongoing: data.statusStats.ongoing || 0,
                        upcoming: data.statusStats.upcoming || 0,
                        total: data.total || 0
                    };
                }
            } catch (error) {
                console.error('Load timeline stats error:', error);
            }
        },

        renderTimeline() {
            // 时间线渲染逻辑
            this.$nextTick(() => {
                if (this.viewMode === 'timeline') {
                    // 可以在这里添加时间线动画效果
                }
            });
        },

        showEventDialog(event = null) {
            this.editingEvent = event;
            if (event) {
                this.form = {
                    ...event,
                    date: event.date ? new Date(event.date) : '',
                    links: Array.isArray(event.links) ? event.links.join('\\n') : (event.links || '')
                };
            } else {
                this.resetForm();
            }
            this.dialogVisible = true;
        },

        resetForm() {
            this.form = {
                title: '',
                description: '',
                date: '',
                type: '',
                status: '',
                location: '',
                organizer: '',
                participants: [],
                result: '',
                links: '',
                tags: []
            };
            this.editingEvent = null;
            if (this.$refs.eventForm) {
                this.$refs.eventForm.resetFields();
            }
        },

        async saveEvent() {
            try {
                const valid = await this.$refs.eventForm.validate();
                if (!valid) return;

                this.saving = true;

                const formData = {
                    ...this.form,
                    date: this.form.date ? this.form.date.toISOString() : '',
                    links: this.form.links ? this.form.links.split('\\n').filter(link => link.trim()) : []
                };

                let response;
                if (this.editingEvent) {
                    response = await axios.put(`/timeline/${this.editingEvent.id}`, formData);
                } else {
                    response = await axios.post('/timeline', formData);
                }

                if (response.data.success) {
                    utils.showMessage(
                        this.editingEvent ? '事件更新成功' : '事件创建成功',
                        'success'
                    );
                    this.dialogVisible = false;
                    await this.loadEvents();
                    await this.loadStats();
                }
            } catch (error) {
                console.error('Save event error:', error);
                const message = error.response?.data?.message || '保存事件失败';
                utils.showMessage(message, 'error');
            } finally {
                this.saving = false;
            }
        },

        async deleteEvent(event) {
            try {
                await utils.showConfirm(`确定要删除事件 "${event.title}" 吗？`, '删除确认');

                const response = await axios.delete(`/timeline/${event.id}`);

                if (response.data.success) {
                    utils.showMessage('事件删除成功', 'success');
                    await this.loadEvents();
                    await this.loadStats();
                }
            } catch (error) {
                if (error === 'cancel') return;
                console.error('Delete event error:', error);
                const message = error.response?.data?.message || '删除事件失败';
                utils.showMessage(message, 'error');
            }
        },

        getStatusClass(status) {
            const classes = {
                completed: 'status-completed',
                ongoing: 'status-ongoing',
                upcoming: 'status-upcoming',
                cancelled: 'status-cancelled'
            };
            return classes[status] || '';
        },

        getStatusType(status) {
            const types = {
                completed: 'success',
                ongoing: 'warning',
                upcoming: 'primary',
                cancelled: 'danger'
            };
            return types[status] || '';
        },

        getStatusName(status) {
            const names = {
                completed: '已完成',
                ongoing: '进行中',
                upcoming: '即将开始',
                cancelled: '已取消'
            };
            return names[status] || status;
        },

        getTypeIcon(type) {
            const icons = {
                competition: 'fas fa-trophy',
                award: 'fas fa-medal',
                project: 'fas fa-code',
                conference: 'fas fa-users',
                workshop: 'fas fa-chalkboard-teacher'
            };
            return icons[type] || 'fas fa-calendar';
        },

        getTypeName(type) {
            const names = {
                competition: '竞赛',
                award: '获奖',
                project: '项目',
                conference: '会议',
                workshop: '培训'
            };
            return names[type] || type;
        }
    }
};