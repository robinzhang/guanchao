@echo off
chcp 65001 >nul
title TikTok 私信工具 - 安装程序

echo ========================================
echo    TikTok 私信工具 - 一键安装
echo ========================================
echo.

:: ========================================
:: 第一步：检查 Python
:: ========================================
echo [1/4] 检查 Python 环境...

python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✅ Python 已安装: 
    python --version
) else (
    echo    ❌ Python 未安装
    echo.
    echo    请先安装 Python 3.9+:
    echo    1. 打开 https://www.python.org/downloads/
    echo    2. 下载 Python 3.9 或更高版本
    echo    3. 安装时勾选 "Add Python to PATH"
    echo.
    pause
    exit /b 1
)

:: ========================================
:: 第二步：安装依赖
:: ========================================
echo.
echo [2/4] 安装 Python 依赖（playwright, playwright-stealth）...
echo    这可能需要几分钟，请耐心等待...

pip install playwright playwright-stealth -q
if %errorlevel% neq 0 (
    echo    ❌ pip 安装失败，尝试使用 python -m pip...
    python -m pip install playwright playwright-stealth -q
)

:: ========================================
:: 第三步：安装浏览器
:: ========================================
echo.
echo [3/4] 安装 Chromium 浏览器...
echo    这可能需要几分钟，请耐心等待...

python -m playwright install chromium
if %errorlevel% neq 0 (
    echo    ❌ 浏览器安装失败
    pause
    exit /b 1
)

:: ========================================
:: 第四步：下载脚本
:: ========================================
echo.
echo [4/4] 检查脚本文件...

set SCRIPT_URL=https://raw.githubusercontent.com/robinzhang/guanchao/main/tiktok_dm_stealth.py
set SCRIPT_PATH=%USERPROFILE%\Desktop\TikTok私信工具
mkdir "%SCRIPT_PATH%" 2>nul

where tiktok_dm_stealth.py >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✅ 脚本已在当前目录
    set SCRIPT_DIR=%CD%
) else (
    echo    📥 正在下载脚本...
    powershell -Command "Invoke-WebRequest -Uri '%SCRIPT_URL%' -OutFile '%SCRIPT_PATH%\tiktok_dm_stealth.py'"
    if %errorlevel% equ 0 (
        echo    ✅ 脚本已下载到: %SCRIPT_PATH%
    ) else (
        echo    ⚠️ 自动下载失败，请手动下载:
        echo    https://github.com/robinzhang/guanchao
        echo    仓库中的 tiktok_dm_stealth.py 文件，保存到桌面
    )
)

:: ========================================
:: 完成
:: ========================================
echo.
echo ========================================
echo    ✅ 安装完成！
echo ========================================
echo.
echo 接下来请按以下步骤操作：
echo.
echo 【第一步】打开 Chrome，创建专属 Profile
echo    1. 点击右上角头像 → 添加
echo    2. 创建新 Profile，起名如"自动化"
echo    3. 用这个 Profile 登录 TikTok
echo.
echo 【第二步】关闭所有 Chrome 窗口
echo.
echo 【第三步】启动 Chrome（开启调试模式）
echo    按 Win+R，输入以下命令，回车：
echo.
echo "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --profile-directory="Profile 2"
echo.
echo 【第四步】运行私信脚本
echo    1. 打开 %SCRIPT_PATH%
echo    2. 双击运行 tiktok_dm_stealth.py
echo.
echo ========================================
echo.
pause
