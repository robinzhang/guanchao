#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TikTok 达人私信脚本 - 防检测版
流程：打开首页→浏览视频→关注→再滚动→等5-10秒→点消息→等5-10秒→发私信
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
        }
    """)


def human_delay(min_sec=None, max_sec=None):
    if min_sec is None:
        min_sec = MIN_DELAY_SECONDS
    if max_sec is None:
        max_sec = MAX_DELAY_SECONDS
    delay = random.uniform(min_sec, max_sec)
    print(f"   🤖 等待 {delay:.0f} 秒...")
    time.sleep(delay)


def human_mouse_move(page, x, y):
    current_x, current_y = 0, 0
    steps = random.randint(8, 15)
    for i in range(steps):
        t = (i + 1) / steps
        cx = current_x + (x - current_x) * (t + random.uniform(-0.1, 0.15))
        cy = current_y + (y - current_y) * (t + random.uniform(-0.1, 0.15))
        page.mouse.move(int(cx), int(cy))
        time.sleep(random.uniform(0.01, 0.03))
    page.mouse.move(int(x), int(y))


def scroll_and_watch(page, scroll_count=5):
    """滚动浏览视频"""
    for i in range(scroll_count):
        scroll_amount = random.randint(500, 1200)
        page.evaluate(f"window.scrollBy(0, {scroll_amount})")
        watch_time = random.uniform(2, 5)  # 每个视频 2-5 秒
        time.sleep(watch_time)
        print(f"   👀 浏览第 {i+1}/{scroll_count} 个视频 (~{watch_time:.1f}s)")


def click_element(page, selectors, element_name):
    """点击元素"""
    for selector in selectors:
        try:
            if page.locator(selector).first.is_visible(timeout=2000):
                btn = page.locator(selector).first
                box = btn.bounding_box()
                if box:
                    human_mouse_move(page, box["x"] + box["width"]/2, box["y"] + box["height"]/2)
                    time.sleep(random.uniform(0.3, 0.8))
                    btn.click()
                    print(f"   ✅ 已点击 {element_name}")
                    return True
        except Exception:
            continue
    print(f"   ⚠️ 未找到 {element_name}")
    return False


def run_dm_task(tiktok_url, message):
    """执行私信任务"""
    from playwright.sync_api import sync_playwright

    print("\n" + "="*50)
    print(f"📋 任务: {tiktok_url}")
    print(f"💬 私信: {message}")
    print("="*50)

    with sync_playwright() as p:
        if CONNECT_EXISTING_CHROME:
            print(f"🔗 连接 Chrome: {CDP_URL}")
            browser = p.chromium.connect_over_cdp(CDP_URL)
            context = browser.contexts[0]
            page = context.new_page()
        else:
            print("🚀 启动独立浏览器")
            browser = p.chromium.launch(headless=False)
            context = browser.new_context(
                viewport={'width': 1920, 'height': 1080},
            )
            page = context.new_page()

        apply_stealth(page)

        try:
            # ========================================
            # 步骤1：打开首页，浏览视频
            # ========================================
            print("\n📍 步骤1: 打开首页，浏览视频...")
            page.goto(tiktok_url, wait_until="domcontentloaded", timeout=30000)
            time.sleep(2)

            scroll_and_watch(page, scroll_count=random.randint(3, 8))

            # 等待 3-10 秒
            wait_time = random.uniform(3, 10)
            print(f"   🤖 浏览后等待 {wait_time:.1f} 秒...")
            time.sleep(wait_time)

            # ========================================
            # 步骤2：点击头像旁边的关注
            # ========================================
            print("\n📍 步骤2: 点击头像旁边的关注...")
            # 头像右侧/紧邻的关注按钮（达人主页头部）
            follow_selectors = [
                # TikTok 主页头部的关注按钮
                '[data-e2e="follow-user-button"]',
                # 头像容器的右侧按钮组
                'div[class*="share-container"] button:has-text("关注")',
                'div[class*="action"] button:has-text("关注")',
                'div[class*="button"] button:has-text("关注")',
                # 头像右侧横向排列的按钮
                '[class*="header-actions"] button:has-text("关注")',
                '[class*="author"] button:has-text("关注")',
                # 兜底：直接找关注按钮
                'button:has-text("关注")',
            ]
            click_element(page, follow_selectors, "关注")

            # ========================================
            # 步骤3：再滚动一下
            # ========================================
            print("\n📍 步骤3: 滚动页面...")
            scroll_amount = random.randint(500, 1000)
            page.evaluate(f"window.scrollBy(0, {scroll_amount})")
            time.sleep(random.uniform(1, 2))

            # ========================================
            # 步骤4：等待 5-10 秒后点击消息
            # ========================================
            wait_time = random.uniform(5, 10)
            print(f"\n📍 步骤4: 等待 {wait_time:.1f} 秒后点击消息...")
            time.sleep(wait_time)

            # ========================================
            # 步骤6：点击头像旁边的消息
            # ========================================
            print("\n📍 步骤6: 点击头像旁边的消息...")
            # 头像右侧/紧邻的消息按钮（达人主页头部）
            message_selectors = [
                # TikTok 主页头部的消息按钮
                '[data-e2e="contact-msg-btn"]',
                '[data-e2e="message-button"]',
                # 头像容器的右侧按钮组
                'div[class*="share-container"] a:has-text("发消息")',
                'div[class*="share-container"] button:has-text("发消息")',
                'div[class*="action"] a:has-text("发消息")',
                'div[class*="action"] button:has-text("发消息")',
                # 头像右侧横向排列的按钮
                '[class*="header-actions"] a:has-text("发消息")',
                '[class*="author"] a:has-text("发消息")',
                # 兜底
                'a:has-text("发消息")',
                'button:has-text("发消息")',
            ]
            click_element(page, message_selectors, "消息")

            # ========================================
            # 步骤5：等待 5-10 秒后输入
            # ========================================
            wait_time = random.uniform(5, 10)
            print(f"\n📍 步骤5: 等待 {wait_time:.1f} 秒后输入私信...")
            time.sleep(wait_time)

            print(f"   ✍️ 输入: {message}")

            # 多种方式找输入框
            text_filled = False

            # 方法1: contenteditable
            try:
                editor = page.locator('div[contenteditable="true"][role="textbox"]').first
                if editor.is_visible(timeout=3000):
                    editor.click()
                    time.sleep(random.uniform(0.3, 0.6))
                    for char in message:
                        editor.type(char, delay=random.uniform(50, 150))
                    text_filled = True
                    print("   ✅ 文字已输入 (contenteditable)")
            except:
                pass

            # 方法2: textarea
            if not text_filled:
                for selector in ['textarea', '[data-e2e="message-input"]', '#message-input']:
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
                    except:
                        continue

            # 方法3: fill
            if not text_filled:
                try:
                    inp = page.locator('input[type="text"]').first
                    if inp.is_visible(timeout=2000):
                        inp.fill(message)
                        text_filled = True
                        print("   ✅ 文字已输入 (fill)")
                except:
                    pass

            if not text_filled:
                print("   ⚠️ 无法自动填写，请手动输入")
                page.wait_for_timeout(10000)

            # ========================================
            # 步骤6：点击发送
            # ========================================
            print("\n📍 步骤6: 点击发送...")
            time.sleep(random.uniform(0.8, 2.0))

            send_selectors = [
                'button:has-text("发送")',
                'button:has-text("Send")',
                '[data-e2e="send-button"]',
                'button[class*="Send"]',
                '[class*="send"]',
            ]
            if not click_element(page, send_selectors, "发送"):
                print("   🔄 尝试按回车发送...")
                page.keyboard.press("Enter")

            time.sleep(2)
            print("\n✅ 任务完成！")

        except Exception as e:
            print(f"\n❌ 任务失败: {e}")
            try:
                page.screenshot(path="tiktok_dm_error.png")
                print("   📸 截图已保存: tiktok_dm_error.png")
            except:
                pass
            raise
        finally:
            browser.close()

    # 发完一条后随机等待再下一条
    human_delay()


def interactive_mode():
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
    parser.add_argument("--cdp", default=default_cdp, help=f"Chrome CDP 地址")
    parser.add_argument("--no-connect", action="store_true", help="不连接已有 Chrome")
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
