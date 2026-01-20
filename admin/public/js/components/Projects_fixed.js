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
                                        {{ scope.row.description.substring(0, 50) }}...
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
                                        v-for="tech in scope.row.tech.slice(0, 3)" 
                                        :key="tech"
                                        size="small"
                                        effect="plain"
                                    >
                                        {{ tech }}
                                    </el-tag>
                                    <el-tag 
                                        v-if="scope.row.tech.length > 3"
                                        size="small"
                                        type="info"
                                        effect="plain"
                                    >
                                        +{{ scope.row.tech.length - 3 }}
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
                                    @click="deleteProject(scope.row)"
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
                            @size-change="loadProjects"
                            @current-change="loadProjects"
                        />
                    </div>
                </div>
            </div>