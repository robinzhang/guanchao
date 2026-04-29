#!/bin/bash

# ================================================
# guanchao TikTok DM Tool - One-Click Install
# ================================================
# 用法: curl -fsSL https://raw.githubusercontent.com/robinzhang/guanchao/main/install.sh | bash
# 或下载后: chmod +x install.sh && ./install.sh
# ================================================

set -e

echo "========================================"
echo "   guanchao TikTok 私信工具 - 一键安装"
echo "========================================"
echo ""

# ---- 颜色定义 ----
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ---- 检测操作系统 ----
detect_os() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
    else
        echo -e "${RED}[错误] 暂不支持该操作系统: $OSTYPE${NC}"
        exit 1
    fi
}

# ---- 检测 Python ----
check_python() {
    echo -e "${YELLOW}[1/5] 检查 Python...${NC}"
    if command -v python3 &> /dev/null; then
        PYTHON_CMD="python3"
    elif command -v python &> /dev/null; then
        PYTHON_CMD="python"
    else
        echo -e "${RED}[失败] 未找到 Python，请先安装 Python 3.9+${NC}"
        echo ""
        echo "安装方法:"
        echo "  macOS: brew install python3"
        echo "  Ubuntu/Debian: sudo apt install python3 python3-pip"
        echo "  CentOS/RHEL: sudo yum install python3 python3-pip"
        echo ""
        echo "安装完成后重新运行本脚本"
        exit 1
    fi
    PYTHON_VERSION=$($PYTHON_CMD --version 2>&1)
    echo -e "${GREEN}[OK] Python: $PYTHON_VERSION${NC}"
}

# ---- 检测 pip ----
check_pip() {
    echo ""
    echo -e "${YELLOW}[2/5] 检查 pip...${NC}"
    if ! command -v pip3 &> /dev/null && ! $PYTHON_CMD -m pip --version &> /dev/null; then
        echo -e "${RED}[失败] 未找到 pip，请先安装 pip${NC}"
        exit 1
    fi
    PIP_CMD="$PYTHON_CMD -m pip"
    echo -e "${GREEN}[OK] pip 可用${NC}"
}

# ---- 安装依赖 ----
install_deps() {
    echo ""
    echo -e "${YELLOW}[3/5] 安装 Python 依赖 (playwright, playwright-stealth)...${NC}"
    echo "  首次安装可能需要 3-5 分钟，请耐心等待..."
    echo ""

    $PIP_CMD install playwright playwright-stealth --quiet

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}[OK] 依赖安装成功${NC}"
    else
        echo -e "${RED}[失败] 依赖安装失败，请检查网络后重试${NC}"
        exit 1
    fi
}

# ---- 安装浏览器 ----
install_browser() {
    echo ""
    echo -e "${YELLOW}[4/5] 安装 Chromium 浏览器...${NC}"
    echo "  首次安装可能需要 5-10 分钟，请耐心等待..."
    echo ""

    $PYTHON_CMD -m playwright install chromium --with-deps 2>&1 | tail -5

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}[OK] Chromium 安装成功${NC}"
    else
        echo -e "${RED}[失败] 浏览器安装失败${NC}"
        exit 1
    fi
}

# ---- 下载脚本 ----
download_script() {
    echo ""
    echo -e "${YELLOW}[5/5] 下载 TikTok DM 脚本...${NC}"

    SCRIPT_URL="https://raw.githubusercontent.com/robinzhang/guanchao/main/tiktok_dm_stealth.py"
    INSTALL_DIR="$HOME/Desktop/guanchao-tiktok-dm"

    mkdir -p "$INSTALL_DIR"

    echo "  下载到: $INSTALL_DIR/"
    if command -v curl &> /dev/null; then
        curl -fsSL "$SCRIPT_URL" -o "$INSTALL_DIR/tiktok_dm_stealth.py"
    elif command -v wget &> /dev/null; then
        wget -q "$SCRIPT_URL" -O "$INSTALL_DIR/tiktok_dm_stealth.py"
    else
        echo -e "${RED}[失败] 系统中没有 curl 或 wget，请手动下载脚本${NC}"
        echo "  手动下载: $SCRIPT_URL"
        exit 1
    fi

    if [ -f "$INSTALL_DIR/tiktok_dm_stealth.py" ]; then
        echo -e "${GREEN}[OK] 脚本下载成功${NC}"
    else
        echo -e "${RED}[失败] 脚本下载失败，请检查网络后重试${NC}"
        exit 1
    fi
}

# ---- 完成 ----
show_done() {
    echo ""
    echo "========================================"
    echo -e "${GREEN}   安装完成！${NC}"
    echo "========================================"
    echo ""
    echo "下一步操作："
    echo ""
    echo "  1. 创建独立的 Chrome Profile（专门用于自动化）"
    echo "     - 打开 Chrome → 点击头像 → 添加 → 新建配置文件"
    echo "     - 命名为如 '自动化'，登录 TikTok 账号"
    echo ""
    echo "  2. 关闭所有 Chrome 窗口"
    echo ""
    echo "  3. 启动 Chrome 调试模式（按系统复制对应命令）:"
    echo ""

    if [ "$OS" == "macos" ]; then
        echo "    macOS:"
        echo "    open -a \"Google Chrome\" --args --remote-debugging-port=9222"
    else
        echo "    Linux (Ubuntu/Debian):"
        echo "    google-chrome --remote-debugging-port=9222"
        echo ""
        echo "    Linux (CentOS/RHEL):"
        echo "    /usr/bin/google-chrome --remote-debugging-port=9222"
    fi

    echo ""
    echo "  4. 运行私信脚本:"
    echo "     cd $INSTALL_DIR"
    echo "     python tiktok_dm_stealth.py <tiktok主页链接> <私信内容>"
    echo ""
    echo "  示例:"
    echo "     python tiktok_dm_stealth.py https://www.tiktok.com/@username \"你好，欢迎关注！\""
    echo ""
    echo "========================================"
    echo ""
}

# ---- 主流程 ----
main() {
    detect_os
    check_python
    check_pip
    install_deps
    install_browser
    download_script
    show_done
}

main "$@"
