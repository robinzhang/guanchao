#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TikTok 达人私信脚本 - 防检测版
支持 stealth 扩展，可连接员工机器 Chrome 或独立启动浏览器

用法:
  python3 tiktok_dm_stealth.py <tiktok_url> [message]

示例:
  python3 tiktok_dm_stealth.py https://www.tiktok.com/@username "你好，对合作感兴趣"
  python3 tiktok_dm_stealth.py https://www.tiktok.com/@username  # 交互式输入私信内容
"""

import sys
import time
import random
import argparse
import os

# ============================================================
# 配置区
# ============================================================
CDP_URL = os.getenv("TIKTOK_CDP_URL", "http://localhost:9222")
CONNECT_EXISTING_CHROME = True

# 防风控配置
MIN_DELAY_SECONDS = 60
MAX_DELAY_SECONDS = 300
DAILY_LIMIT = 30

# ============================================================
# 防检测工具
# ============================================================

try:
    from playwright_stealth.stealth import Stealth as StealthClass
    STEALTH_AVAILABLE = True
except ImportError:
    STEALTH_AVAILABLE = False
    print("⚠️ playwright-stealth 未安装，使用基础反检测")


def apply_stealth(page):
    """应用反检测补丁"""
    if STEALTH_AVAILABLE:
        try:
            stealth_instance = StealthClass()
            stealth_instance.apply_stealth_sync(page)
        except Exception as e:
            print(f"   ⚠️ stealth 应用失败: {e}")
            _apply_manual_stealth(page)
    else:
        _apply_manual_stealth(page)


def _apply_manual_stealth(page):
    """手动应用基础反检测补丁"""
    page.evaluate("""
        () => {
            Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
            Object.defineProperty(navigator, 'plugins', {
                get: () => [
                    { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
                    { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
                    { name: 'Native Client', filename: 'internal-nacl-plugin' }
                ]
            });
            Object.defineProperty(navigator, 'languages', {
                get: () => ['zh-CN', 'zh', 'en-US', 'en']
            });
            window.chrome = { runtime: {} };
            const originalQuery = navigator.permissions.query;
            navigator.permissions.query = (parameters) => (
                parameters.name === 'notifications' ?
                    Promise.resolve({ state: Notification.permission }) :
                    originalQuery(parameters)
            );
        }
    """)


def human_delay(min_sec=None, max_sec=None):
    """人类行为延迟"""
    if min_sec is None:
        min_sec = MIN_DELAY_SECONDS
    if max_sec is None:
        max_sec = MAX_DELAY_SECONDS
    delay = random.uniform(min_sec, max_sec)
    print(f"   🤖 等待 {delay:.0f} 秒...")
    time.sleep(delay)


def human_mouse_move(page, x, y):
    """模拟人类鼠标移动"""
    current_x, current_y = 0, 0
    steps = random.randint(8, 15)
    for i in range(steps):
        t = (i + 1) / steps
        cx = current_x + (x - current_x) * (t + random.uniform(-0.1, 0.15))
        cy = current_y + (y - current_y) * (t + random.uniform(-0.1, 0.15))
        page.mouse.move(int(cx), int(cy))
        time.sleep(random.uniform(0.01, 0.03))
    page.mouse.move(int(x), int(y))


def random_scroll(page):
    """随机滚动页面"""
    scroll_amount = random.randint(200, 600)
    page.evaluate(f"window.scrollBy(0, {scroll_amount})")
    time.sleep(random.uniform(0.5, 1.5))


def open_creator_page(page, url):
    """打开达人首页，模拟浏览视频"""
    print(f"   🌐 打开: {url}")
    page.goto(url, wait_until="domcontentloaded", timeout=30000)

    # 模拟人类浏览：滚动页面看几个视频
    print("   👀 模拟浏览视频...")
    scroll_count = random.randint(3, 8)  # 随机滚动3-8次
    for i in range(scroll_count):
        scroll_amount = random.randint(500, 1200)
        page.evaluate(f"window.scrollBy(0, {scroll_amount})")
        watch_time = random.uniform(1, 2.5)  # 每次看1-2.5秒
        time.sleep(watch_time)
        print(f"   👀 浏览第 {i+1}/{scroll_count} 个视频 (~{watch_time:.1f}s)")

    print(f"   ✅ 页面加载完成: {page.title()}")


def click_follow(page):
    """点击关注按钮"""
    print("   👤 检查关注按钮...")
    follow_selectors = [
        'button:has-text("关注")',
        '[class*="follow"]',
        '[data-e2e="follow-button"]',
        'button[class*="FollowButton"]',
        'div[class*="follow"] button',
    ]
    followed = False
    for selector in follow_selectors:
        try:
            if page.locator(selector).first.is_visible(timeout=2000):
                btn = page.locator(selector).first
                box = btn.bounding_box()
                if box:
                    human_mouse_move(page, box["x"] + box["width"]/2, box["y"] + box["height"]/2)
                    time.sleep(random.uniform(0.3, 0.8))
                    btn.click()
                    followed = True
                    print("   ✅ 已点击关注")
                    break
        except Exception:
            continue
    if not followed:
        print("   ⚠️ 未找到关注按钮（可能已关注）")
    # 关注后等待5-10秒再发私信
    wait_after_follow = random.uniform(5, 10)
    print(f"   🤖 关注后等待 {wait_after_follow:.1f} 秒...")
    time.sleep(wait_after_follow)
    return followed


def send_direct_message(page, message):
    """发送私信"""
    print("   💬 准备发送私信...")

    # 点击消息按钮
    message_selectors = [
        'a:has-text("发消息")',
        'a:has-text("消息")',
        '[class*="message"]',
        '[data-e2e="message-button"]',
        'button:has-text("发消息")',
        'button:has-text("Message")',
        '[data-e2e="contact-btn"]',
    ]

    msg_opened = False
    for selector in message_selectors:
        try:
            if page.locator(selector).first.is_visible(timeout=2000):
                btn = page.locator(selector).first
                box = btn.bounding_box()
                if box:
                    human_mouse_move(page, box["x"] + box["width"]/2, box["y"] + box["height"]/2)
                    time.sleep(random.uniform(0.3, 0.8))
                    btn.click()
                    msg_opened = True
                    print("   ✅ 消息窗口已打开")
                    break
        except Exception:
            continue

    if not msg_opened:
        print("   ⚠️ 无法打开消息窗口，尝试其他方式...")
        # 尝试直接导航到 DM 页面
        try:
            # 尝试点击达人页面上的消息图标
            page.click('svg[class*="message"]', timeout=3000)
            msg_opened = True
            print("   ✅ 消息窗口已打开（通过svg）")
        except Exception:
            pass

    if not msg_opened:
        print("   ⚠️ 无法自动打开消息窗口，请手动打开后再试")
        return

    # 打开消息窗口后等待5-10秒再输入
    wait_before_type = random.uniform(5, 10)
    print(f"   🤖 消息窗口打开，等待 {wait_before_type:.1f} 秒后开始输入...")
    time.sleep(wait_before_type)

    print(f"   ✍️ 输入私信: {message}")

    # 尝试多种方式找到输入框
    text_filled = False

    # 方法1： contenteditable div
    try:
        editor = page.locator('div[contenteditable="true"][role="textbox"]').first
        if editor.is_visible(timeout=3000):
            editor.click()
            time.sleep(random.uniform(0.3, 0.6))
            for char in message:
                editor.type(char, delay=random.uniform(50, 150))
            text_filled = True
            print("   ✅ 文字已输入 (contenteditable)")
    except Exception:
        pass

    # 方法2：直接找 textarea
    if not text_filled:
        for selector in [
            'textarea',
            'textarea[id]',
            'textarea[class]',
            '[data-e2e="message-input"]',
            '#message-input',
        ]:
            try:
                el = page.locator(selector).first
                if el.is_visible(timeout=2000):
                    el.click()
                    time.sleep(random.uniform(0.2, 0.5))
                    for char in message:
                        el.type(char, delay=random.uniform(50, 150))
                    text_filled = True
                    print(f"   ✅ 文字已输入 ({selector})")
                    break
            except Exception:
                continue

    # 方法3：找输入框并使用 fill
    if not text_filled:
        try:
            inputs = page.locator('input[type="text"]').all()
            for inp in inputs:
                try:
                    if inp.is_visible(timeout=1000):
                        inp.fill(message)
                        text_filled = True
                        print("   ✅ 文字已输入 (fill)")
                        break
                except Exception:
                    continue
        except Exception:
            pass

    # 方法4：直接在页面上执行 JS 输入
    if not text_filled:
        try:
            page.evaluate(f"""
                () => {{
                    const editors = document.querySelectorAll('div[contenteditable="true"]');
                    for (const editor of editors) {{
                        if (editor.offsetParent !== null) {{
                            editor.focus();
                            const text = "{message}";
                            editor.innerText = text;
                            editor.dispatchEvent(new Event('input', {{ bubbles: true }}));
                            editor.dispatchEvent(new Event('change', {{ bubbles: true }}));
                            break;
                        }}
                    }}
                }}
            """)
            text_filled = True
            print("   ✅ 文字已输入 (JS)")
        except Exception as e:
            print(f"   ⚠️ JS 输入失败: {e}")

    if not text_filled:
        print("   ⚠️ 无法自动填写输入框，请手动输入")
        # 截图保存当前状态
        try:
            page.screenshot(path="tiktok_dm_input_error.png")
            print("   📸 截图已保存: tiktok_dm_input_error.png")
        except:
            pass
        return

    # 等待一下再点发送
    time.sleep(random.uniform(0.8, 2.0))

    # 点击发送按钮
    sent = False
    send_selectors = [
        'button:has-text("发送")',
        'button:has-text("Send")',
        'button:has-text("send")',
        '[data-e2e="send-button"]',
        'button[class*="Send"]',
        'button[class*="send"]',
        '[class*="send-btn"]',
        'div[role="button"]:has-text("发送")',
    ]

    for selector in send_selectors:
        try:
            btn = page.locator(selector).first
            if btn.is_visible(timeout=2000):
                box = btn.bounding_box()
                if box:
                    human_mouse_move(page, box["x"] + box["width"]/2, box["y"] + box["height"]/2)
                    time.sleep(random.uniform(0.2, 0.5))
                    btn.click()
                    sent = True
                    print("   ✅ 私信已发送")
                    break
        except Exception:
            continue

    if not sent:
        print("   ⚠️ 找不到发送按钮，尝试按回车发送")
        page.keyboard.press("Enter")

    time.sleep(random.uniform(1, 2))


def run_dm_task(tiktok_url, message):
    """执行一个 DM 任务"""
    from playwright.sync_api import sync_playwright
    print("\n" + "="*50)
    print(f"📋 任务: {tiktok_url}")
    print(f"💬 私信: {message}")
    print("="*50)
    with sync_playwright() as p:
        if CONNECT_EXISTING_CHROME:
            print(f"🔗 连接 Chrome CDP: {CDP_URL}")
            browser = p.chromium.connect_over_cdp(CDP_URL)
            context = browser.contexts[0]
            page = context.new_page()
        else:
            print("🚀 启动独立 Chrome 浏览器")
            browser = p.chromium.launch(headless=False)
            context = browser.new_context(
                viewport={'width': 1920, 'height': 1080},
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            )
            page = context.new_page()
        apply_stealth(page)
        try:
            open_creator_page(page, tiktok_url)
            click_follow(page)
            send_direct_message(page, message)
            print("\n✅ 任务完成！")
        except Exception as e:
            print(f"\n❌ 任务失败: {e}")
            try:
                page.screenshot(path="tiktok_dm_error.png")
                print("   📸 截图已保存到 tiktok_dm_error.png")
            except:
                pass
            raise
        finally:
            browser.close()
    human_delay()


def interactive_mode():
    """交互式输入"""
    print("\n📝 交互式模式")
    print("-" * 40)
    url = input("达人 TikTok 主页 URL: ").strip()
    if not url:
        print("URL 不能为空")
        return
    message = input("私信内容: ").strip()
    if not message:
        print("私信内容不能为空")
        return
    run_dm_task(url, message)


def main():
    parser = argparse.ArgumentParser(description="TikTok 达人私信脚本 - 防检测版")
    parser.add_argument("url", nargs="?", help="达人 TikTok 主页 URL")
    parser.add_argument("message", nargs="?", help="私信内容")
    default_cdp = "http://localhost:9222"
    parser.add_argument("--cdp", default=default_cdp, help=f"Chrome CDP 地址 (默认: {default_cdp})")
    parser.add_argument("--no-connect", action="store_true", help="不连接已有 Chrome，独立启动")
    args = parser.parse_args()
    globals()['CDP_URL'] = args.cdp
    globals()['CONNECT_EXISTING_CHROME'] = not args.no_connect
    if args.url:
        message = args.message
        if not message:
            message = input("请输入私信内容: ").strip()
        run_dm_task(args.url, message)
    else:
        interactive_mode()


if __name__ == "__main__":
    main()
