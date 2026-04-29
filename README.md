# TikTok 达人私信工具

TikTok 自动化私信脚本，支持防检测，可连接员工机器 Chrome 执行私信发送。

## 功能

- ✅ 防检测（playwright-stealth + 人类行为模拟）
- ✅ 连接远程 Chrome（员工机器）
- ✅ 关注 + 私信发送
- ✅ 随机延迟，降低风控风险

---

## 快速安装（推荐）

员工电脑上只需安装 Python（3分钟），然后一行命令搞定一切：

### macOS / Linux

```bash
curl -fsSL https://raw.githubusercontent.com/robinzhang/guanchao/main/install.sh | bash
```

### Windows

下载 [install_tiktok_dm.bat](https://raw.githubusercontent.com/robinzhang/guanchao/main/install_tiktok_dm.bat)，双击运行即可。

---

安装脚本会自动完成：
1. 检查并安装 Python 依赖（playwright、playwright-stealth）
2. 安装 Chromium 浏览器
3. 下载私信脚本到桌面

---

## 快速使用

### 第一步：启动 Chrome

**macOS：**
```bash
open -a "Google Chrome" --args --remote-debugging-port=9222
```

**Windows：**
```cmd
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --profile-directory="Profile 2"
```

**Linux：**
```bash
google-chrome --remote-debugging-port=9222
```

### 第二步：发送私信

```bash
python tiktok_dm_stealth.py https://www.tiktok.com/@username "你好，欢迎关注！"
```

参数说明：
- `tiktok_dm_stealth.py` → 脚本文件名
- 第一个参数 → TikTok 主页链接
- 第二个参数 → 私信内容

---

## 使用方法（详细）

### 方式一：一键安装 EXE（待作者发布 Release）

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

### 方式三：一键安装脚本（macOS / Linux）

一行命令自动安装所有依赖和脚本：

```bash
curl -fsSL https://raw.githubusercontent.com/robinzhang/guanchao/main/install.sh | bash
```

### 方式四：一键安装脚本（Windows）

下载 [install_tiktok_dm.bat](https://raw.githubusercontent.com/robinzhang/guanchao/main/install_tiktok_dm.bat) 双击运行，自动完成安装。

---

## 员工机器配置

### 创建独立的 Chrome Profile（重要）

建议专门创建一个 Chrome 配置文件用于自动化操作：
1. 打开 Chrome → 点击右上角头像 → 添加 → 新建配置文件
2. 命名为如「自动化」，登录 TikTok 账号
3. 使用该 Profile 启动调试模式

### 启动 Chrome 调试模式

**Windows：**
```cmd
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --profile-directory="Profile 2"
```

**macOS：**
```bash
open -a "Google Chrome" --args --remote-debugging-port=9222
```

**Linux：**
```bash
google-chrome --remote-debugging-port=9222
```

### 连接远程 Chrome

当 Chrome 运行在另一台员工机器上时：

```bash
TikTokDM.exe --cdp http://员工IP:9222 https://www.tiktok.com/@username "私信内容"
```

---

## 防风控建议

- 使用老账号（活跃时间长的账号）
- 每天发送不超过 **30 条**
- 私信内容多样化，避免明显广告语
- 控制发送频率，间隔至少 **1 分钟**以上
