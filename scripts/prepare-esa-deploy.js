#!/usr/bin/env node

/**
 * ESA 部署准备脚本
 * 将项目打包为适合阿里云 ESA 部署的格式
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 开始准备 ESA 部署文件...\n');

// 1. 清理旧的部署目录
const deployDir = path.join(__dirname, '..', 'deploy');
if (fs.existsSync(deployDir)) {
    console.log('🧹 清理旧的部署目录...');
    try {
        if (fs.rmSync) {
            fs.rmSync(deployDir, { recursive: true, force: true });
        } else {
            // 旧版 Node 兼容
            deleteFolderRecursive(deployDir);
        }
    } catch (e) {
        console.warn('⚠️ 清理目录失败，尝试继续:', e.message);
    }
}
fs.mkdirSync(deployDir, { recursive: true });

// 2. 构建前端
console.log('📦 构建前端...');
try {
    // 显式检查 vite 是否可用
    try {
        execSync('npm list vite', { stdio: 'ignore' });
    } catch (e) {
        console.log('⚠️ 未检测到 vite，尝试安装依赖...');
        execSync('npm install --only=dev', { stdio: 'inherit' });
    }

    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ 前端构建完成\n');
} catch (error) {
    console.error('❌ 前端构建失败:', error.message);
    process.exit(1);
}

// 3. 复制构建产物
console.log('📁 复制文件到部署目录...');

// 复制 dist 目录内容到 deploy 根目录
const distDir = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distDir)) {
    copyDirectory(distDir, deployDir);
} else {
    console.error('❌ dist 目录不存在，构建可能失败');
    process.exit(1);
}

// 复制 admin 静态文件
const adminPublicDir = path.join(__dirname, '..', 'admin', 'public');
const deployAdminDir = path.join(deployDir, 'admin');
if (fs.existsSync(adminPublicDir)) {
    console.log('  -> 复制 admin 目录...');
    copyDirectory(adminPublicDir, deployAdminDir);
} else {
    console.warn('⚠️  admin/public 目录不存在，跳过');
}

// 复制其他静态资源
const staticFiles = [
    'favicon.ico',
    'qrcode.jpg',
    'sw.js',
    'manifest.json'
];

staticFiles.forEach(file => {
    const srcPath = path.join(__dirname, '..', file);
    const destPath = path.join(deployDir, file);

    if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`  ✓ ${file}`);
    }
});

// 复制 icons 目录（如果存在）
const iconsDir = path.join(__dirname, '..', 'icons');
const deployIconsDir = path.join(deployDir, 'icons');
if (fs.existsSync(iconsDir)) {
    copyDirectory(iconsDir, deployIconsDir);
}

// 4. 创建部署说明文件
const readme = `# ESA 部署文件

## 📁 目录结构

\`\`\`
deploy/
├── index.html          # 主页
├── assets/             # 前端资源
├── admin/              # 管理后台
│   └── index.html
├── sw.js              # Service Worker
├── manifest.json      # PWA 配置
├── qrpg         # 二维码
└── favicon.ico        # 图标
\`\`\`

## 🚀 部署步骤

### 1. 上传到 ESA

将 deploy 目录下的所有文件上传到阿里云 ESA：

\`\`\`bash
# 使用 ESA CLI（如果有）
esa deploy deploy/

# 或者通过控制台手动上传
\`\`\`

### 2. 配置路由规则

在 ESA 控制台配置以下路由：

\`\`\`
/          → index.html
/admin     → admin/index.html
/admin/*   → admin/index.html
\`\`\`

### 3. 配置 API 代理（可选）

如果需要代理 API 请求到云函数：

\`\`\`
/api/*     → https://your-cloudfunction-url.com/api/*
\`\`\`

### 4. 配置 HTTPS

- 启用 HTTPS
- 配置自定义域名
- 配置 SSL 证书

## ⚙️ 环境变量

确保云函数中配置了以下环境变量：

- \`KV_NAMESPACE_ID\` - KV 存储命名空间 ID
- \`KV_API_TOKEN\` - KV API Token
- \`ADMIN_TOKEN\` - 管理员令牌
- \`JWT_SECRET\` - JWT 密钥

## 📝 注意事项

1. **API 地址**: 确保前端代码中的 API 地址指向正确的云函数地址
2. **CORS**: 确保云函数配置了正确的 CORS 头
3. **缓存**: ESA 会缓存静态文件，更新后可能需要清除缓存
4. **Service Worker**: 首次部署后，Service Worker 可能需要一段时间才能生效

## 🔧 本地测试

部署前可以本地测试：

\`\`\`bash
# 安装 http-server
npm install -g http-server

# 在 deploy 目录启动服务器
cd deploy
http-server -p 8080

# 访问 http://localhost:8080
\`\`\`

## 📊 性能优化

ESA 已经提供了：
- ✅ CDN 加速
- ✅ 边缘缓存
- ✅ GZIP 压缩
- ✅ HTTP/2

无需额外配置。

## 🎉 部署完成

部署完成后，访问你的域名即可看到网站！
`;

fs.writeFileSync(path.join(deployDir, 'README.md'), readme);

// 5. 创建 .esaignore 文件（类似 .gitignore）
const esaignore = `# ESA 部署忽略文件

# 开发文件
*.map
*.log

# 文档
README.md

# 临时文件
.DS_Store
Thumbs.db
`;

fs.writeFileSync(path.join(deployDir, '.esaignore'), esaignore);

console.log('\n✅ 部署文件准备完成！\n');
console.log('📁 部署目录:', deployDir);
console.log('\n📖 请查看 deploy/README.md 了解部署步骤\n');

// 显示文件统计
const stats = getDirectoryStats(deployDir);
console.log('📊 文件统计:');
console.log(`  - 总文件数: ${stats.files}`);
console.log(`  - 总大小: ${formatBytes(stats.size)}`);
console.log('');

// 辅助函数
function copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDirectory(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

function deleteFolderRecursive(path) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach(function(file, index){
      var curPath = path + "/" + file;
      if (fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
}

function getDirectoryStats(dir) {
    let files = 0;
    let size = 0;

    function walk(directory) {
        const entries = fs.readdirSync(directory, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(directory, entry.name);

            if (entry.isDirectory()) {
                walk(fullPath);
            } else {
                files++;
                size += fs.statSync(fullPath).size;
            }
        }
    }

    walk(dir);
    return { files, size };
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
