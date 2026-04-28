# TikTok 达人私信工具

TikTok 自动化私信脚本，支持防检测，可连接员工机器 Chrome 执行私信发送。

## 功能

- ✅ 防检测（playwright-stealth + 人类行为模拟）
- ✅ 连接远程 Chrome（员工机器）
- ✅ 关注 + 私信发送
- ✅ 随机延迟，降低风控风险

## 使用方法

### 方式一：直接下载 EXE（推荐）

1. 去 [Releases](https://github.com/robinzhang/guanchao/releases) 下载 `TikTokDM.exe`
2. 员工电脑上安装 Playwright 浏览器：`playwright install chromium`
3. 启动 Chrome 并开启调试端口
4. 双击运行 `TikTokDM.exe`

### 方式二：源码运行

```bash
pip install playwright playwright-stealth
playwright install chromium
python tiktok_dm_stealth.py <tiktok_url> <message>
```

## 员工机器配置

### Windows 启动 Chrome

```cmd
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --profile-directory="Profile 2"
```

### 连接远程 Chrome

```bash
TikTokDM.exe --cdp http://员工IP:9222 https://www.tiktok.com/@username "私信内容"
```

## 防风控建议

- 使用老账号（活跃时间长的账号）
- 每天发送不超过 30 条
- 私信内容多样化，避免明显广告语
- 控制发送频率，间隔至少 1 分钟以上
