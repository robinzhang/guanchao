#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TikTok 达人私信脚本 - 搜索流程 + 人机验证处理
流程：首页→搜索达人→进入主页→浏览→关注→私信
"""

import sys
import time
import random
import argparse
import os
import re

# ============================================================
# 配置区
# ============================================================
CDP_URL = os.getenv("TIKTOK_CDP_URL", "http://localhost:9222")
CONNECT_EXISTING_CHROME = True

# 防风控配置
MIN_DELAY_SECONDS = 90
MAX_DELAY_SECONDS = 300

# 人机验证等待配置
MAX_VERIFICATION_WAIT = 600  # 最大等待 10 分钟

# ============================================================
# 反检测工具
# ============================================================

try:
    from playwright_stealth.stealth import Stealth as StealthClass
    STEALTH_AVAILABLE = True
except ImportError:
    STEALTH_AVAILABLE = False
    print("⚠️ playwright-stealth 未安装，使用增强版手动反检测")


def apply_stealth(page):
    """应用反检测措施"""
    if STEALTH_AVAILABLE:
        try:
            stealth_instance = StealthClass()
            stealth_instance.apply_stealth_sync(page)
        except Exception as e:
            print(f"   ⚠️ stealth 应用失败: {e}")
    
    _apply_enhanced_stealth(page)


def _apply_enhanced_stealth(page):
    """增强版手动反检测"""
    page.evaluate("""
        () => {
            // 基础
            Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
            
            // 插件
            Object.defineProperty(navigator, 'plugins', {
                get: () => [
                    { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
                    { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
                    { name: 'Native Client', filename: 'internal-nacl-plugin' },
                    { name: 'Widevine Content Decryption Module', filename: 'widevinecdmadapter.dll' }
                ]
            });
            
            // 语言
            Object.defineProperty(navigator, 'languages', {
                get: () => ['zh-CN', 'zh', 'en-US', 'en']
            });
            
            // Chrome runtime
            window.chrome = {
                runtime: { id: null, lastError: null, connect: () => ({}), sendMessage: () => ({}) },
                app: { isInstalled: false },
                storage: {
                    local: { get: (k, cb) => cb({}), set: (o, cb) => cb(), remove: (k, cb) => cb() },
                    managed: { get: (k, cb) => cb({}) },
                    session: { get: (k, cb) => cb({}) }
                }
            };
            
            // 清除自动化检测变量
            delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
            delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
            delete window.cdc_adoQpoasnfa76pfcZLmcfl_String;
            delete window.__webdriver_evaluate;
            delete window.__selenium_evaluate;
            delete window.__webdriver_script_function;
            delete window.__fxdriver_evaluate;
            delete window.__driver_unwrapped;
            delete window.__webdriver_unwrapped;
            delete window.__driver_evaluate;
            delete window.__selenium_unwrapped;
            delete window.__fxdriver_unwrapped;
            delete window.BOT;
            delete window._selenium;
            
            // Hardware
            Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 });
            Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 });
            Object.defineProperty(navigator, 'platform', { get: () => 'MacIntel' });
            Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 0 });
        }
    """)


def human_delay(min_sec=None, max_sec=None):
    """人性化延迟"""
    if min_sec is None:
        min_sec = MIN_DELAY_SECONDS
    if max_sec is None:
        max_sec = MAX_DELAY_SECONDS
    delay = random.uniform(min_sec, max_sec)
    print(f"   🤖 等待 {delay:.0f} 秒...")
    time.sleep(delay)


def human_mouse_move(page, x, y, steps=None):
    """人性化鼠标移动"""
    if steps is None:
        steps = random.randint(12, 20)
    
    current_x, current_y = page.mouse.position
    
    for i in range(steps):
        t = i / (steps - 1) if steps > 1 else 1
        ease_t = 1 - ((1 - t) * (1 - t) * (1 - t))
        
        jitter_x = random.uniform(-10, 10) if i > 0 and i < steps - 1 else 0
        jitter_y = random.uniform(-10, 10) if i > 0 and i < steps - 1 else 0
        
        cx = current_x + (x - current_x) * ease_t + jitter_x
        cy = current_y + (y - current_y) * ease_t + jitter_y
        
        page.mouse.move(int(cx), int(cy))
        time.sleep(random.uniform(0.008, 0.02))
    
    page.mouse.move(int(x), int(y))


def human_scroll(page, direction='down', amount=None):
    """人性化滚动"""
    if amount is None:
        amount = random.randint(400, 1000)
    
    page.mouse.wheel(0, amount if direction == 'down' else -amount)
    
    if random.random() < 0.4:
        time.sleep(random.uniform(0.1, 0.3))
        page.evaluate(f"window.scrollBy(0, {random.randint(20, 80) * (1 if direction == 'down' else -1)})")


def scroll_and_watch(page, scroll_count=5):
    """滚动浏览"""
    for i in range(scroll_count):
        scroll_method = random.choice(['wheel', 'js', 'keys'])
        
        if scroll_method == 'wheel':
            human_scroll(page, 'down', random.randint(400, 1000))
        elif scroll_method == 'js':
            page.evaluate(f"window.scrollBy(0, {random.randint(500, 1200)})")
        else:
            page.keyboard.press('PageDown')
        
        watch_time = random.uniform(3, 7)
        time.sleep(watch_time)
        
        if random.random() < 0.2:
            page.evaluate(f"window.scrollBy(0, -{random.randint(50, 200)})")
            time.sleep(random.uniform(0.5, 1.5))
            page.evaluate(f"window.scrollBy(0, {random.randint(50, 200)})")
        
        print(f"   👀 浏览第 {i+1}/{scroll_count} 个视频")


def is_verification_page(page, debug=False):
    """检测是否有人机验证页面（极度保守版）
    
    只有在以下情况才返回 True:
    1. URL 明确包含 captcha/verify/challenge 且不是 login/signup
    2. 有明确包含验证文字的大尺寸模态框
    3. 找到 TikTok 滑块验证码容器
    """
    
    try:
        # 1. 检查 URL - 最可靠的方式
        url = page.url.lower()
        if debug:
            print(f"   🔍 [调试] 当前URL: {url}")
        
        # URL 必须包含 captcha/verify/challenge 且不含 login/signup
        url_indicators = ['captcha', 'verify/challenge', 'human/verify']
        url_blocklist = ['login', 'signup', 'auth', 'signin', 'register']
        
        if any(ind in url for ind in url_indicators):
            if not any(b in url for b in url_blocklist):
                print(f"   🔍 [调试] URL 匹配验证条件")
                return True
        
        # 2. 检查 TikTok 特定的验证码 iframe
        try:
            captcha_iframes = page.locator('iframe[src*="captcha"], iframe[src*="tcaptcha"], iframe[id*="captcha"]')
            if captcha_iframes.count() > 0:
                for i in range(captcha_iframes.count()):
                    iframe = captcha_iframes.nth(i)
                    if iframe.is_visible(timeout=500):
                        src = iframe.get_attribute('src') or ''
                        print(f"   🔍 [调试] 找到验证码 iframe: {src[:80]}")
                        return True
        except Exception:
            pass
        
        # 3. 检查 TikTok 滑块验证码容器
        try:
            slider_selectors = [
                'div[id*="tcaptcha"]',
                'div[class*="tcaptcha"]',
                'div[id*="captcha"][class*="slide"]',
                'div[class*="captcha"][id*="slider"]',
                '#tcaptcha',
                '.tcaptcha',
            ]
            for sel in slider_selectors:
                locator = page.locator(sel).first
                if locator.is_visible(timeout=500):
                    box = locator.bounding_box()
                    if box and box['width'] > 100 and box['height'] > 100:
                        print(f"   🔍 [调试] 找到滑块验证码容器: {sel}")
                        return True
        except Exception:
            pass
        
        # 4. 检查大尺寸模态框（需要同时满足：尺寸大 + 包含验证文字）
        try:
            dialogs = page.locator('div[role="dialog"]')
            for i in range(min(dialogs.count(), 3)):
                dialog = dialogs.nth(i)
                if dialog.is_visible(timeout=500):
                    box = dialog.bounding_box()
                    if box and box['width'] > 300 and box['height'] > 300:
                        text = dialog.inner_text().lower()
                        verify_keywords = ['验证', '验证失败', 'captcha', 'verify', '滑动', '拼图', '请在下方', '完成验证', '点击验证']
                        if any(kw in text for kw in verify_keywords):
                            print(f"   🔍 [调试] 找到验证对话框: {text[:80]}")
                            return True
                        if debug:
                            print(f"   🔍 [调试] 对话框无验证关键词: {text[:80]}")
        except Exception:
            pass
        
        if debug:
            print(f"   🔍 [调试] 未检测到人机验证")
        
    except Exception as e:
        print(f"   ⚠️ 验证检测出错: {e}")
    
    return False


def wait_for_verification(page, check_interval=5):
    """等待人机验证完成"""
    print("\n" + "="*50)
    print("⚠️ 检测到人机验证！")
    print("="*50)
    print("请在浏览器中完成验证...")
    print(f"最大等待时间: {MAX_VERIFICATION_WAIT} 秒")
    print("提示: 完成验证后此窗口会自动继续")
    print("="*50)
    
    start_time = time.time()
    check_count = 0
    last_status = "检测中"
    
    while time.time() - start_time < MAX_VERIFICATION_WAIT:
        try:
            # 检查是否还在验证页面
            still_verifying = is_verification_page(page)
            
            if not still_verifying:
                elapsed = int(time.time() - start_time)
                print(f"\n✅ 验证已完成！耗时: {elapsed} 秒")
                time.sleep(2)  # 额外等待页面稳定
                return True
            
            check_count += 1
            
            # 每分钟提示一次状态
            if check_count % 12 == 0:
                elapsed = int(time.time() - start_time)
                remaining = MAX_VERIFICATION_WAIT - elapsed
                # 尝试获取验证框的信息
                try:
                    dialog = page.locator('div[role="dialog"]').first
                    if dialog.is_visible():
                        text = dialog.inner_text()[:50]
                        status = f"验证框可见: {text}..."
                    else:
                        status = "验证框仍在"
                except:
                    status = "检测中"
                
                print(f"   ⏳ {status} ({elapsed}s 已过, 剩余 {remaining}s)")
            
            time.sleep(check_interval)
            
        except Exception as e:
            print(f"   ⚠️ 检查验证状态时出错: {e}")
            time.sleep(check_interval)
    
    print(f"\n❌ 验证等待超时 ({MAX_VERIFICATION_WAIT} 秒)")
    print("   脚本将继续执行，如需重试请手动刷新页面")
    return False


def check_and_handle_verification(page, force_check=False, debug=False):
    """检查并处理人机验证
    
    Args:
        page: Playwright page 对象
        force_check: 是否强制检查
        debug: 是否打印调试信息
    """
    result = is_verification_page(page, debug=debug)
    if result:
        print("   🔐 检测到可能的验证页面，开始监控...")
        return wait_for_verification(page)
    elif force_check:
        time.sleep(0.5)
    return True


def click_element(page, selectors, element_name, timeout=3000):
    """点击元素"""
    for selector in selectors:
        try:
            locator = page.locator(selector).first
            if locator.is_visible(timeout=timeout):
                box = locator.bounding_box()
                if box:
                    center_x = box["x"] + box["width"] / 2
                    center_y = box["y"] + box["height"] / 2
                    human_mouse_move(page, center_x, center_y)
                    time.sleep(random.uniform(0.3, 0.8))
                    locator.click()
                    print(f"   ✅ 已点击 {element_name}")
                    return True
        except Exception:
            continue
    print(f"   ⚠️ 未找到 {element_name}")
    return False


def search_creator(page, creator_id):
    """在搜索框搜索达人"""
    print(f"\n📍 搜索达人: @{creator_id}")
    
    # 方法1: 尝试直接使用搜索框输入
    search_selectors = [
        # TikTok 实际的搜索输入框
        'input[placeholder*="Search" i]',
        'input[placeholder*="搜索" i]',
        'input[data-e2e="search-user-input"]',
        'input[class*="SearchInput" i]',
        'input[class*="search-input" i]',
        'input[class*="search"][type="text"]',
        'input[type="search"]',
        'input[id*="search" i]',
        'input[name*="search" i]',
        # 备选：任意可能是搜索框的 input
        '#header-search input',
        'header input',
        '[class*="header"] input[class*="search"]',
    ]
    
    input_found = False
    for selector in search_selectors:
        try:
            inp = page.locator(selector).first
            if inp.is_visible(timeout=2000):
                # 获取元素信息用于调试
                placeholder = inp.get_attribute('placeholder') or ''
                class_name = inp.get_attribute('class') or ''
                print(f"   🔍 尝试选择器: {selector} | placeholder: {placeholder}")
                
                inp.click()
                time.sleep(random.uniform(0.3, 0.6))
                
                # 聚焦后清空并输入
                inp.clear()
                time.sleep(random.uniform(0.1, 0.2))
                inp.fill(creator_id)
                input_found = True
                print(f"   ✅ 在搜索框输入: @{creator_id}")
                break
        except Exception as e:
            continue
    
    # 方法2: 如果没找到搜索框，尝试点击搜索图标打开搜索框
    if not input_found:
        print("   ⚠️ 未找到搜索框，尝试点击搜索图标")
        search_icon_selectors = [
            '[data-e2e="search-icon"]',
            '[class*="search-icon"]',
            '[class*="search"] svg',
            'button[class*="search"]',
            'a[class*="search"]',
            '[aria-label*="Search" i]',
            '[aria-label*="搜索" i]',
        ]
        
        for selector in search_icon_selectors:
            try:
                icon = page.locator(selector).first
                if icon.is_visible(timeout=1000):
                    icon.click()
                    time.sleep(random.uniform(0.5, 1))
                    print(f"   ✅ 点击了搜索图标: {selector}")
                    
                    # 点击后再次尝试找搜索框
                    for sel in search_selectors:
                        try:
                            inp = page.locator(sel).first
                            if inp.is_visible(timeout=1000):
                                inp.fill(creator_id)
                                input_found = True
                                print(f"   ✅ 点击图标后在搜索框输入: @{creator_id}")
                                break
                        except:
                            continue
                    
                    if input_found:
                        break
            except:
                continue
    
    # 方法3: 直接导航到搜索页面
    if not input_found:
        print("   ⚠️ 未找到搜索框，直接导航到搜索页面")
        search_url = f"https://www.tiktok.com/search?q={creator_id}&t={int(time.time())}"
        page.goto(search_url, wait_until="domcontentloaded")
        time.sleep(random.uniform(3, 5))
        return check_and_handle_verification(page)
    
    # 按回车搜索
    time.sleep(random.uniform(0.5, 1.5))
    page.keyboard.press("Enter")
    print("   ✅ 按下回车搜索")
    time.sleep(random.uniform(3, 5))
    
    return check_and_handle_verification(page)


def click_search_result(page, creator_id):
    """点击搜索结果中的达人"""
    print(f"\n📍 查找达人 @{creator_id} 的搜索结果...")
    
    # 先等待搜索结果加载
    time.sleep(random.uniform(2, 3))
    
    # 方法1: 点击用户 tab
    try:
        user_tab_selectors = [
            'div[class*="tab"][class*="active"]',
            'div[class*="tab"]:has-text("用户")',
            'div[class*="tab"]:has-text("User")',
            'div[class*="tab"]:has-text("People")',
            '[class*="search-tab"]:has-text("用户")',
            '[class*="search-tab"]:has-text("People")',
            # TikTok 实际的 tab
            '[class*="Tab"]:has-text("用户")',
            '[class*="Tab"]:has-text("User")',
        ]
        for selector in user_tab_selectors:
            try:
                locator = page.locator(selector).first
                if locator.is_visible(timeout=2000):
                    locator.click()
                    print(f"   ✅ 点击用户 tab: {selector}")
                    time.sleep(random.uniform(2, 3))
                    break
            except:
                continue
    except Exception as e:
        print(f"   ⚠️ 点击用户 tab 出错: {e}")
    
    # 方法2: 直接在搜索结果中找达人
    # 搜索结果中的用户卡片 - TikTok 搜索结果结构
    user_card_selectors = [
        # 直接包含达人 ID 的链接
        f'a[href*="/@{creator_id}"]',
        # 搜索结果中的用户卡片
        f'div[class*="UserCard"] a[href*="/@{creator_id}"]',
        f'div[class*="UserItem"] a[href*="/@{creator_id}"]',
        f'div[class*="user-card"] a[href*="/@{creator_id}"]',
        # 泛用用户链接（带 @ 的）
        'a[href*="/@"][href*="follow"]',
        'a[href*="/@"][data-e2e*="user"]',
        # 任意包含达人名字的用户链接
        f'[class*="search"] a:has-text("{creator_id}")',
        f'[class*="result"] a:has-text("{creator_id}")',
        # 泛型用户卡片
        'div[class*="search"] a[href*="/@"]',
        'div[class*="user"] a[href*="/@"]',
    ]
    
    print(f"   🔍 开始查找达人 @{creator_id}...")
    
    for selector in user_card_selectors:
        try:
            locators = page.locator(selector).all()
            for locator in locators:
                if locator.is_visible(timeout=1000):
                    href = locator.get_attribute('href') or ''
                    text = locator.inner_text() or ''
                    print(f"   🔍 找到候选: {selector} | href: {href[:50]} | text: {text[:30]}")
                    
                    # 检查是否是达人主页链接
                    if creator_id in href and '/@' in href:
                        box = locator.bounding_box()
                        if box:
                            human_mouse_move(page, box["x"] + box["width"]/2, box["y"] + box["height"]/2)
                            time.sleep(random.uniform(0.3, 0.6))
                            locator.click()
                            print(f"   ✅ 点击达人主页: {href}")
                            time.sleep(random.uniform(2, 4))
                            return True
        except Exception as e:
            continue
    
    # 方法3: 如果以上都失败，直接导航
    print(f"   ⚠️ 未在搜索结果中找到达人，直接导航")
    return False


def navigate_to_creator_via_search(page, creator_id):
    """通过搜索流程导航到达人主页"""
    # 1. 首先确保在 TikTok 首页
    print("\n📍 步骤1: 打开 TikTok 首页...")
    page.goto("https://www.tiktok.com", wait_until="domcontentloaded", timeout=30000)
    time.sleep(random.uniform(2, 4))
    
    if not check_and_handle_verification(page, debug=True):
        return False
    
    # 2. 搜索达人
    if not search_creator(page, creator_id):
        return False
    
    if not check_and_handle_verification(page):
        return False
    
    # 3. 点击搜索结果
    if not click_search_result(page, creator_id):
        # 如果搜索结果点击失败，尝试直接导航
        print(f"   🔄 尝试直接导航到达人主页")
        direct_url = f"https://www.tiktok.com/@{creator_id}"
        page.goto(direct_url, wait_until="domcontentloaded", timeout=30000)
        time.sleep(random.uniform(2, 4))
        
        if not check_and_handle_verification(page):
            return False
    
    return True


def find_and_type_message(page, message):
    """找到并输入消息"""
    input_methods = [
        {'selector': 'div[contenteditable="true"][aria-label*="消息"], div[contenteditable="true"][aria-label*="message"]', 'type': 'contenteditable'},
        {'selector': 'div[contenteditable="true"][role="textbox"]', 'type': 'contenteditable'},
        {'selector': 'textarea', 'type': 'textarea'},
        {'selector': '[data-e2e="message-input"], [data-e2e="dm-input"]', 'type': 'input'},
        {'selector': 'input[type="text"], input:not([type])', 'type': 'input'},
    ]
    
    for method in input_methods:
        try:
            locator = page.locator(method['selector']).first
            if locator.is_visible(timeout=3000):
                locator.click()
                time.sleep(random.uniform(0.2, 0.5))
                locator.clear()
                time.sleep(random.uniform(0.1, 0.3))
                
                if method['type'] == 'contenteditable':
                    for char in message:
                        locator.type(char, delay=random.uniform(80, 180))
                else:
                    locator.fill(message)
                
                print(f"   ✅ 文字已输入 ({method['selector']})")
                return True
        except Exception:
            continue
    
    print("   ⚠️ 无法自动填写，请手动输入")
    page.wait_for_timeout(10000)
    return False


def run_dm_task(tiktok_url, message):
    """执行私信任务"""
    from playwright.sync_api import sync_playwright

    print("\n" + "="*50)
    print(f"📋 任务: {tiktok_url}")
    print(f"💬 私信: {message}")
    print("="*50)

    # 从 URL 提取达人 ID
    creator_id_match = re.search(r'/@([^/]+)', tiktok_url)
    creator_id = creator_id_match.group(1) if creator_id_match else None
    
    if not creator_id:
        print("❌ 无法从 URL 提取达人 ID")
        return False

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
            # 步骤0：通过搜索流程导航到达人主页
            # ========================================
            print(f"\n📍 步骤0: 通过搜索流程导航到 @{creator_id} 的主页...")
            
            if not navigate_to_creator_via_search(page, creator_id):
                print("❌ 导航到达人主页失败")
                return False
            
            # 检查人机验证
            if not check_and_handle_verification(page):
                print("❌ 人机验证未通过")
                return False
            
            # ========================================
            # 步骤1：浏览视频
            # ========================================
            print("\n📍 步骤1: 浏览视频...")
            scroll_and_watch(page, scroll_count=random.randint(3, 8))
            time.sleep(random.uniform(3, 8))

            # ========================================
            # 步骤2：滚动到顶部，点击头像右侧的关注
            # ========================================
            print("\n📍 步骤2: 点击头像右侧的关注按钮...")
            
            # 先滚动到页面顶部，确保看到 profile header
            page.evaluate("window.scrollTo(0, 0)")
            time.sleep(random.uniform(1, 2))
            
            # 检查是否已经关注
            try:
                following_btn = page.locator('[data-e2e="following-button"]')
                if following_btn.is_visible(timeout=2000):
                    print("   ℹ️ 已经关注该达人，跳过关注")
                else:
                    # 点击关注按钮
                    follow_selectors = [
                        # 达人主页头部的关注按钮
                        '[data-e2e="follow-user-button"]',
                        '[data-e2e="follow-button"]',
                        # 精确匹配关注文字
                        'button:has-text("关注")',
                        'div:has-text("关注") >> button',
                    ]
                    
                    follow_clicked = False
                    for selector in follow_selectors:
                        try:
                            locator = page.locator(selector).first
                            if locator.is_visible(timeout=2000):
                                box = locator.bounding_box()
                                if box:
                                    center_x = box["x"] + box["width"] / 2
                                    center_y = box["y"] + box["height"] / 2
                                    # 只在屏幕上部区域（profile header）
                                    if center_y < 500:
                                        human_mouse_move(page, center_x, center_y)
                                        time.sleep(random.uniform(0.3, 0.6))
                                        locator.click()
                                        print(f"   ✅ 已点击关注按钮: {selector}")
                                        follow_clicked = True
                                        break
                        except Exception:
                            continue
                    
                    if not follow_clicked:
                        print("   ⚠️ 未找到关注按钮或点击失败")
                        
            except Exception as e:
                print(f"   ⚠️ 检查关注状态出错: {e}")
            
            time.sleep(random.uniform(10, 30))

            # ========================================
            # 步骤3：再次检查人机验证
            # ========================================
            if not check_and_handle_verification(page):
                print("❌ 关注后触发了人机验证")
                return False

            # ========================================
            # 步骤4：点击头像右侧的消息按钮
            # ========================================
            print("\n📍 步骤3: 点击头像右侧的消息按钮...")
            
            # 再次确保在页面顶部
            page.evaluate("window.scrollTo(0, 0)")
            time.sleep(random.uniform(1, 2))
            
            # 消息按钮选择器（按优先级）
            message_selectors = [
                # TikTok 达人主页头部的消息按钮
                '[data-e2e="contact-msg-btn"]',
                '[data-e2e="message-button"]',
                # 精确匹配
                'a:has-text("发消息")',
                'button:has-text("发消息")',
                'a:has-text("Message")',
                'button:has-text("Message")',
            ]
            
            message_clicked = False
            for selector in message_selectors:
                try:
                    locator = page.locator(selector).first
                    if locator.is_visible(timeout=2000):
                        box = locator.bounding_box()
                        if box:
                            center_x = box["x"] + box["width"] / 2
                            center_y = box["y"] + box["height"] / 2
                            # 只在屏幕上部区域（profile header）
                            if center_y < 500:
                                human_mouse_move(page, center_x, center_y)
                                time.sleep(random.uniform(0.3, 0.6))
                                locator.click()
                                print(f"   ✅ 已点击消息按钮: {selector}")
                                message_clicked = True
                                break
                except Exception:
                    continue
            
            if not message_clicked:
                print("   ⚠️ 未找到消息按钮或点击失败")
                # 如果是直接进入消息页面的 URL，尝试直接导航
                print("   🔄 尝试直接进入消息页面...")
                page.goto(f"https://www.tiktok.com/@{creator_id}/messages", wait_until="domcontentloaded")
            
            time.sleep(random.uniform(10, 30))

            # ========================================
            # 步骤5：检查是否进入消息页面/DM页面
            # ========================================
            if not check_and_handle_verification(page):
                print("❌ 点击消息后触发了人机验证")
                return False
            
            # 检查 URL 是否已经变成消息页面
            current_url = page.url.lower()
            print(f"   🔍 当前URL: {current_url}")
            
            # 如果 URL 没有变化，尝试直接进入消息页面
            if '/messages' not in current_url and '/message' not in current_url:
                print("   🔄 URL 未变化，直接进入消息页面...")
                page.goto(f"https://www.tiktok.com/@{creator_id}/messages", wait_until="domcontentloaded")
                time.sleep(random.uniform(10, 30))
                
                if not check_and_handle_verification(page):
                    return False

            # ========================================
            # 步骤6：在消息页面查找并打开与该达人的对话
            # ========================================
            print("\n📍 步骤4: 在消息页面查找达人对话...")
            
            # 等待消息列表加载
            time.sleep(random.uniform(10, 30))
            
            # 查找达人的对话
            try:
                # 方法1: 直接点击与该达人的对话链接
                creator_link_selectors = [
                    f'a[href*="/@{creator_id}"]',
                    f'div[class*="conversation"]:has-text("{creator_id}")',
                    f'div[class*="user"]:has-text("{creator_id}")',
                    f'a[href*="messages"][href*="{creator_id}"]',
                ]
                
                conversation_found = False
                for selector in creator_link_selectors:
                    try:
                        locator = page.locator(selector).first
                        if locator.is_visible(timeout=3000):
                            locator.click()
                            print(f"   ✅ 已点击达人对话: {selector}")
                            conversation_found = True
                            break
                    except Exception:
                        continue
                
                if not conversation_found:
                    print("   ⚠️ 在消息列表中未找到达人对话")
            except Exception as e:
                print(f"   ⚠️ 查找对话出错: {e}")
            
            time.sleep(random.uniform(10, 30))

            # ========================================
            # 步骤7：输入私信
            # ========================================
            print("\n📍 步骤5: 输入私信...")
            print(f"   ✍️ 内容: {message}")
            
            # 输入前等待 10-30 秒
            time.sleep(random.uniform(10, 30))
            
            if not find_and_type_message(page, message):
                print("   ⚠️ 输入可能失败")

            # 输入后等待 10-30 秒再点击发送
            time.sleep(random.uniform(10, 30))

            # ========================================
            # 步骤7：点击发送
            # ========================================
            print("\n📍 步骤6: 点击发送...")

            send_selectors = [
                'button:has-text("发送")',
                'button:has-text("Send")',
                '[data-e2e*="send"]',
                '[class*="send"]',
            ]
            
            if not click_element(page, send_selectors, "发送"):
                print("   🔄 尝试按回车发送...")
                page.keyboard.press("Enter")

            time.sleep(random.uniform(10, 30))
            
            # ========================================
            # 步骤8：检查结果
            # ========================================
            # 等待一小段时间看是否有错误提示
            time.sleep(random.uniform(10, 30))
            
            # 再次检查人机验证（发送后可能触发）
            if not check_and_handle_verification(page):
                print("❌ 发送后触发了人机验证")
                return False
            
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

    # 发完一条后随机等待
    human_delay()
    return True


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
    parser = argparse.ArgumentParser(description="TikTok 达人私信脚本 - 搜索流程 + 人机验证处理")
    parser.add_argument("url", nargs="?", help="达人 TikTok 主页 URL")
    parser.add_argument("message", nargs="?", help="私信内容")
    parser.add_argument("--cdp", default="http://localhost:9222", help="Chrome CDP 地址")
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
