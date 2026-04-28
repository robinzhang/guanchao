@echo off
chcp 65001 >nul
title TikTok DM Tool - Installer

echo ========================================
echo    TikTok DM Tool - One-Click Install
echo ========================================
echo.

:: ========================================
:: Step 1: Check Python
:: ========================================
echo [1/4] Checking Python...

python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo    [OK] Python found: 
    python --version
    goto :check_pip
) else (
    echo    [FAIL] Python not found
    echo.
    echo    Please install Python 3.9+ first:
    echo    1. Go to https://www.python.org/downloads/
    echo    2. Download Python 3.9 or higher
    echo    3. IMPORTANT: Check "Add Python to PATH"
    echo.
    pause
    exit /b 1
)

:check_pip
:: ========================================
:: Step 2: Install dependencies
:: ========================================
echo.
echo [2/4] Installing Python packages (playwright, playwright-stealth)...
echo    This may take a few minutes, please wait...

pip install playwright playwright-stealth -q
if %errorlevel% neq 0 (
    echo    Retrying with python -m pip...
    python -m pip install playwright playwright-stealth -q
)

:: ========================================
:: Step 3: Install browser
:: ========================================
echo.
echo [3/4] Installing Chromium browser...
echo    This may take a few minutes, please wait...

python -m playwright install chromium
if %errorlevel% neq 0 (
    echo    [FAIL] Browser installation failed
    pause
    exit /b 1
)

:: ========================================
:: Step 4: Download script
:: ========================================
echo.
echo [4/4] Checking script file...

set SCRIPT_URL=https://raw.githubusercontent.com/robinzhang/guanchao/main/tiktok_dm_stealth.py
set SCRIPT_PATH=%USERPROFILE%\Desktop\TikTok-DM-Tool
mkdir "%SCRIPT_PATH%" 2>nul

where tiktok_dm_stealth.py >nul 2>&1
if %errorlevel% equ 0 (
    echo    [OK] Script found in current directory
) else (
    echo    Downloading script...
    powershell -Command "Invoke-WebRequest -Uri '%SCRIPT_URL%' -OutFile '%SCRIPT_PATH%\tiktok_dm_stealth.py'"
    if %errorlevel% equ 0 (
        echo    [OK] Script saved to: %SCRIPT_PATH%
    ) else (
        echo    [FAIL] Download failed
        echo    Please manually download from:
        echo    https://github.com/robinzhang/guanchao
        echo    Save tiktok_dm_stealth.py to your Desktop
    )
)

:: ========================================
:: Done
:: ========================================
echo.
echo ========================================
echo    INSTALLATION COMPLETE!
echo ========================================
echo.
echo NEXT STEPS:
echo.
echo [Step 1] Create a new Chrome Profile for automation
echo    1. Click your avatar in Chrome top-right
echo    2. Click "Add"
echo    3. Create a new Profile, name it like "Automation"
echo    4. Login to TikTok with this Profile
echo.
echo [Step 2] Close ALL Chrome windows
echo.
echo [Step 3] Start Chrome in debug mode
echo    Press Win+R, paste and run this:
echo.
echo "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --profile-directory="Profile 2"
echo.
echo [Step 4] Run the DM script
echo    1. Go to %SCRIPT_PATH%
echo    2. Double-click tiktok_dm_stealth.py
echo    3. Enter TikTok URL and message
echo.
echo ========================================
echo.
pause
