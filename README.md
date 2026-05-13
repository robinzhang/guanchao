# TikTok DM Tool

TikTok 达人私信自动化工具，支持防检测功能。

## 使用说明 / Usage

### 第一步：下载
Download: https://github.com/robinzhang/guanchao/releases/download/v1.0.0/TikTok-DM-Tool.zip

### 第二步：解压
解压到本地 Windows 电脑的一个自定义目录。

### 第三步：安装依赖并启动 Chrome 调试模式
双击运行 `install_tiktok_dm.bat`，等待自动安装 Python 依赖和 Chromium 浏览器。

安装完成后会自动打开 Chrome 调试端口。

验证 Chrome 调试是否正常：
1. 在新的 Chrome 浏览器中打开：http://localhost:9222/json
2. 如果出现正常响应文本（JSON格式），说明连接成功。

### 第四步：运行私信脚本
打开一个新的命令行窗口，运行：

```bash
python tiktok_dm_stealth.py --cdp http://localhost:9222 "达人主页地址" "私信内容"
```

### 命令行参数说明

| 参数 | 说明 |
|------|------|
| `--cdp` | Chrome 调试端口地址（默认 http://localhost:9222） |
| 第一个位置参数 | 达人 TikTok 主页 URL |
| 第二个位置参数 | 私信内容 |

### 示例

```bash
python tiktok_dm_stealth.py --cdp http://localhost:9222 "https://www.tiktok.com/@username" "你好，欢迎关注！"
```

### 交互模式

不传参数直接运行，进入交互模式：

```bash
python tiktok_dm_stealth.py
```

### 注意事项

1. 运行前请确保 TikTok 账号已登录 Chrome（通过 win_start.bat 启动的调试 Chrome）
2. 发送私信前请确保已关注该达人
3. 建议合理控制发送频率，避免账号风险
