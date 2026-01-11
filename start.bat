@echo off
chcp 65001 >nul
echo Starting Tech Showcase Project...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js not detected, please install Node.js first
    echo Download: https://nodejs.org/
    pause
    exit /b 1
)

REM Check if dependencies are installed
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo Error: Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Check environment configuration file
if not exist ".env" (
    echo Creating environment configuration file...
    copy .env.example .env
    echo.
    echo WARNING: Please edit .env file to configure Aliyun Edge Storage parameters
    echo Run this script again after configuration is complete
    pause
    exit /b 0
)

REM Initialize admin account
echo Initializing admin account...
node admin/scripts/init-admin.js

REM Check and kill processes on ports 3001 and 3002
echo Checking for processes on ports 3001 and 3002...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
    if not "%%a"=="0" (
        echo Killing process %%a on port 3001...
        taskkill /PID %%a /F >nul 2>&1
    )
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3002') do (
    if not "%%a"=="0" (
        echo Killing process %%a on port 3002...
        taskkill /PID %%a /F >nul 2>&1
    )
)

REM Start server
echo.
echo Starting server...
echo Frontend: http://localhost:3001
echo Admin Panel: http://localhost:3001/admin
echo Default Account: admin / admin123
echo.
echo Press Ctrl+C to stop server
echo.

npm start