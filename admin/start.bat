@echo off
echo 启动技术展示后台管理系统...
echo.

REM 检查Node.js是否安装
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未检测到Node.js，请先安装Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

REM 检查是否已安装依赖
if not exist "node_modules" (
    echo 正在安装依赖包...
    npm install
    if %errorlevel% neq 0 (
        echo 错误: 依赖安装失败
        pause
        exit /b 1
    )
)

REM 检查环境配置文件
if not exist ".env" (
    echo 正在创建环境配置文件...
    copy .env.example .env
    echo.
    echo 警告: 请编辑 .env 文件配置阿里云边缘存储参数
    echo 配置完成后重新运行此脚本
    pause
    exit /b 0
)

REM 初始化管理员账户
echo 正在初始化管理员账户...
node scripts/init-admin.js

REM 启动服务器
echo.
echo 正在启动服务器...
echo 管理后台地址: http://localhost:3001/admin
echo 默认账户: admin / admin123
echo.
echo 按 Ctrl+C 停止服务器
echo.

npm start