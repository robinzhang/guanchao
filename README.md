# TikTok 达人私信工具

三种发送 TikTok 达人私信的方法，从简单到复杂，适合不同需求的用户。

---

## 方法一览

| 方法 | 难度 | 防检测 | 需要设备 | 推荐指数 |
|------|------|--------|---------|---------|
| 方法三：浏览器插件 | ⭐ 简单 | ⭐⭐⭐ 难检测 | 电脑 + Chrome | ⭐⭐⭐⭐⭐ |
| 方法二：手机自动化 | ⭐⭐⭐ 中等 | ⭐⭐⭐⭐ 很稳 | 电脑 + 安卓手机 | ⭐⭐⭐⭐ |
| 方法一：浏览器自动化 | ⭐⭐ 较简单 | ⭐⭐ 易被拦 | 电脑 + Chrome | ⭐⭐⭐ |

---

## 方法三：浏览器插件（最简单，推荐小白）

### 安装步骤

1. 打开 Chrome，输入 `chrome://extensions/`
2. 右上角开启「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择 `tiktok-dm-extension` 文件夹

### 使用步骤

1. 用 Chrome 打开 https://www.tiktok.com 并登录
2. 进入达人主页
3. 点击 Chrome 右上角的 📩 图标
4. 输入私信内容，点击发送

👉 **详细教程请看：[TIKTOK_DM教程.md](./TIKTOK_DM教程.md)**

---

## 方法二：手机自动化（最稳定，推荐有安卓手机的用户）

### 准备工作

- 安卓手机一台（红米、华为、三星等均可）
- 手机和电脑在同一 WiFi 网络

### 配置步骤

1. 手机开启开发者模式（连续点击版本号 7 次）
2. 手机开启 USB 调试
3. 手机连接电脑，运行 `adb tcpip 5555`
4. 查看手机 IP 地址（设置 → WLAN → 已连接网络）
5. 电脑运行 `adb connect 手机IP:5555`
6. 手机上安装并登录 TikTok

### 使用

```bash
# 交互式（一步步输入）
python tiktok_dm_mobile.py

# 直接指定参数
python tiktok_dm_mobile.py https://www.tiktok.com/@用户名 私信内容
```

👉 **详细教程请看：[TIKTOK_DM教程.md](./TIKTOK_DM教程.md)**

---

## 方法一：浏览器自动化（较简单，但容易被检测）

### 安装依赖

```bash
pip install playwright playwright-stealth
playwright install chromium
```

### 配置 Chrome

```cmd
# Windows
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222

# macOS
open -a "Google Chrome" --args --remote-debugging-port=9222
```

### 使用

```bash
python tiktok_dm_stealth.py https://www.tiktok.com/@用户名 私信内容
```

---

## 详细教程

👉 **[TIKTOK_DM教程.md](./TIKTOK_DM教程.md)** - 包含三种方法的完整图文教程，适合小白用户

---

## 批量发送的最佳实践

| 场景 | 推荐方法 |
|------|---------|
| 每天发 20-50 条 | 方法三（插件）+ 手动操作 |
| 每天发 50-200 条 | 方法二（手机自动化） |
| 每天发 200+ 条 | 方法二 + 多台手机 |

### 降低被检测的技巧

1. **间隔要随机**：25-60 秒随机，不要固定
2. **内容要变化**：避免发完全相同的文字
3. **不要连发**：每发 5-10 条后休息 10-15 分钟
4. **用老账号**：新账号更容易被风控
5. **有条件优先用手机方案**：方法二最稳

---

## 文件结构

```
guanchao/
├── tiktok_dm_stealth.py      # 方法一：浏览器自动化
├── tiktok_dm_mobile.py        # 方法二：手机自动化
├── tiktok-dm-extension/       # 方法三：浏览器插件
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.js
│   ├── content.js
│   └── icons/
├── TIKTOK_DM教程.md           # 详细使用教程（小白必看）
├── install.sh                  # Linux/Mac 一键安装
└── install_tiktok_dm.bat       # Windows 一键安装
```

---

## 技术支持

遇到问题请提供：
1. 使用的方法（方法一/二/三）
2. 电脑系统（Windows/Mac）
3. 手机型号（如果用了方法二）
4. 具体的错误信息或截图
