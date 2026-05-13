@echo off
chcp 65001
echo 正在关闭所有Chrome进程...
taskkill /f /im chrome.exe 2>nul

echo 正在复制Chrome原始配置到独立目录...
robocopy "C:\Users\%USERNAME%\AppData\Local\Google\Chrome\User Data" "D:\ChromeDebugProfile" /E /ZB /R:3 /W:5 /NFL /NDL

echo 正在启动Chrome 9222远程调试...
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" ^
--remote-debugging-port=9222 ^
--remote-allow-origins=* ^
--user-data-dir="D:\ChromeDebugProfile" ^
--no-first-run --no-default-browser-check

echo 启动完成，调试地址：http://localhost:9222
pause