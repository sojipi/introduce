// 登录组件
const Login = {
    template: `
        <div class="login-container">
            <div class="login-form">
                <div class="login-header">
                    <h1><i class="fas fa-bolt"></i> 技术展示后台</h1>
                    <p>管理您的项目、获奖和技能数据</p>
                </div>
                
                <el-form 
                    :model="form" 
                    :rules="rules" 
                    ref="loginForm"
                    @submit.prevent="handleLogin"
                >
                    <el-form-item prop="username">
                        <el-input
                            v-model="form.username"
                            placeholder="用户名"
                            prefix-icon="User"
                            size="large"
                        />
                    </el-form-item>
                    
                    <el-form-item prop="password">
                        <el-input
                            v-model="form.password"
                            type="password"
                            placeholder="密码"
                            prefix-icon="Lock"
                            size="large"
                            show-password
                            @keyup.enter="handleLogin"
                        />
                    </el-form-item>
                    
                    <el-form-item>
                        <el-checkbox v-model="form.remember">
                            记住我
                        </el-checkbox>
                    </el-form-item>
                    
                    <el-form-item>
                        <el-button 
                            type="primary" 
                            size="large" 
                            style="width: 100%"
                            :loading="loading"
                            @click="handleLogin"
                        >
                            <i class="fas fa-sign-in-alt"></i>
                            {{ loading ? '登录中...' : '登录' }}
                        </el-button>
                    </el-form-item>
                </el-form>
                
                <div style="text-align: center; margin-top: 1rem; color: #666; font-size: 0.9rem;">
                    <p>默认账号: admin / admin123</p>
                </div>
            </div>
        </div>
    `,

    data() {
        return {
            form: {
                username: '',
                password: '',
                remember: false
            },
            rules: {
                username: [
                    { required: true, message: '请输入用户名', trigger: 'blur' }
                ],
                password: [
                    { required: true, message: '请输入密码', trigger: 'blur' },
                    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
                ]
            },
            loading: false
        };
    },

    mounted() {
        // 如果已经登录，直接跳转到仪表板
        if (store.isAuthenticated()) {
            this.$router.push('/dashboard');
        }

        // 从本地存储恢复记住的用户名
        const rememberedUsername = localStorage.getItem('remembered_username');
        if (rememberedUsername) {
            this.form.username = rememberedUsername;
            this.form.remember = true;
        }
    },

    methods: {
        async handleLogin() {
            try {
                const valid = await this.$refs.loginForm.validate();
                if (!valid) return;

                this.loading = true;

                const response = await axios.post('/api/auth/login', {
                    username: this.form.username,
                    password: this.form.password
                });

                if (response.data.success) {
                    const { user, token } = response.data.data;

                    // 保存认证信息
                    store.setAuth(user, token);

                    // 处理记住用户名
                    if (this.form.remember) {
                        localStorage.setItem('remembered_username', this.form.username);
                    } else {
                        localStorage.removeItem('remembered_username');
                    }

                    utils.showMessage('登录成功', 'success');

                    // 跳转到仪表板
                    this.$router.push('/dashboard');
                } else {
                    utils.showMessage(response.data.message || '登录失败', 'error');
                }
            } catch (error) {
                console.error('Login error:', error);
                const message = error.response?.data?.message || '登录失败，请检查网络连接';

                // 直接调用 ElementPlus.ElMessage，设置更高的 z-index
                if (typeof ElementPlus !== 'undefined' && ElementPlus.ElMessage) {
                    ElementPlus.ElMessage({
                        message: message,
                        type: 'error',
                        duration: 5000,
                        showClose: true,
                      offset: 20,
                        customClass: 'login-error-message'
                    });
                } else {
                    alert(message);
                }
            } finally {
                this.loading = false;
            }
        }
    }
};