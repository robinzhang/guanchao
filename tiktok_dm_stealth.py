#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TikTok 达人私信脚本 - 深度防检测版
"""

import sys
import time
import random
import argparse
import os
import json

# ============================================================
# 配置区
# ============================================================
CDP_URL = os.getenv("TIKTOK_CDP_URL", "http://localhost:9222")
CONNECT_EXISTING_CHROME = True

# 防风控配置
MIN_DELAY_SECONDS = 90
MAX_DELAY_SECONDS = 300

# ============================================================
# 深度反检测工具
# ============================================================

try:
    from playwright_stealth.stealth import Stealth as StealthClass
    STEALTH_AVAILABLE = True
except ImportError:
    STEALTH_AVAILABLE = False
    print("⚠️ playwright-stealth 未安装，使用增强版手动反检测")


def apply_stealth(page):
    """应用深度反检测措施"""
    if STEALTH_AVAILABLE:
        try:
            stealth_instance = StealthClass()
            stealth_instance.apply_stealth_sync(page)
        except Exception as e:
            print(f"   ⚠️ stealth 应用失败: {e}")
    else:
        print("   ℹ️ 使用增强版手动反检测")
    
    # 应用增强的反检测措施
    _apply_enhanced_stealth(page)


def _apply_enhanced_stealth(page):
    """增强版手动反检测"""
    page.evaluate("""
        () => {
            // 1. 基础 WebDriver 隐藏
            Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
            
            // 2. 真实的插件列表
            Object.defineProperty(navigator, 'plugins', {
                get: () => [
                    { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format', version: '1.0' },
                    { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: '', version: '2.1' },
                    { name: 'Native Client', filename: 'internal-nacl-plugin', description: '', version: '' },
                    { name: 'Widevine Content Decryption Module', filename: 'widevinecdmadapter.dll', description: 'WidevineCDM', version: '4.10.2557.0' },
                    { name: 'Edge PDF Viewer', filename: 'internal-pdf-viewer', description: '', version: '' },
                    { name: 'Microsoft Edge PDF Viewer', filename: 'internal-pdf-viewer2', description: '', version: '' }
                ]
            });
            
            // 3. 真实的语言设置
            Object.defineProperty(navigator, 'languages', {
                get: () => ['zh-CN', 'zh', 'en-US', 'en', 'ja-JP', 'ja']
            });
            
            // 4. Chrome runtime 对象
            window.chrome = {
                runtime: {
                    id: null,
                    lastError: null,
                    connect: () => ({id: 1}),
                    sendMessage: () => ({})
                },
                app: {
                    isInstalled: false,
                    GetDetails: () => null,
                    installState: () => ({state: 'not installed'})
                },
                webstore: {
                    onNewRipple: { addListener: () => {} },
                    onRequestEligibility: { addListener: () => {} }
                },
                storage: {
                    local: {
                        get: (k, cb) => cb({}),
                        set: (o, cb) => cb(),
                        remove: (k, cb) => cb(),
                        clear: (cb) => cb()
                    },
                    managed: { get: (k, cb) => cb({}), set: () => {}, onChanged: { addListener: () => {} } },
                    session: { get: (k, cb) => cb({}), set: (o, cb) => cb(), onChanged: { addListener: () => {} } }
                },
                tabs: { query: () => new Promise(r => r([])), getCurrent: () => new Promise(r => r(null)) },
                runtime: {
                    onStartup: { addListener: () => {} },
                    onInstalled: { addListener: () => {} },
                    onSuspend: { addListener: () => {} },
                    onMessage: { addListener: () => {} },
                    sendMessage: () => Promise.resolve(),
                    connect: () => ({ onMessage: { addListener: () => {} }, onDisconnect: { addListener: () => {} } })
                }
            };
            
            // 5. Permissions
            const originalQuery = window.navigator.permissions.query;
            window.navigator.permissions.query = (parameters) => (
                parameters.name === 'notifications' ?
                    Promise.resolve({ state: Notification.permission }) :
                    originalQuery(parameters)
            );
            
            // 6. Hardware concurrency 和 device memory
            Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 });
            Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 });
            
            // 7. Platform 和 user agent data
            Object.defineProperty(navigator, 'platform', { get: () => 'MacIntel' });
            Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 0 });
            Object.defineProperty(navigator, 'vendor', { get: () => 'Google Inc.' });
            
            // 8. WebGL 指纹隐藏
            const getContext = HTMLCanvasElement.prototype.getContext;
            HTMLCanvasElement.prototype.getContext = function(type, attributes) {
                const context = getContext.call(this, type, attributes);
                if (type === 'webgl' || type === 'webgl2') {
                    const originalGetParameter = context.getParameter.bind(context);
                    context.getParameter = function(param) {
                        // 隐藏 WebGL 渲染器指纹
                        if (param === 37445) return 'Intel Inc.'; // UNMASKED_VENDOR
                        if (param === 37446) return 'Intel Iris OpenGL Engine'; // UNMASKED_RENDERER
                        return originalGetParameter(param);
                    };
                }
                return context;
            };
            
            // 9. AudioContext 指纹隐藏
            const audioContext = window.AudioContext || window.webkitAudioContext;
            if (audioContext) {
                const originalGetChannelData = audioContext.prototype.constructor.prototype.getChannelData;
                // 不做修改，只是确保不暴露异常
            }
            
            // 10. 移除 automation 检测
            delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
            delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
            delete window.cdc_adoQpoasnfa76pfcZLmcfl_String;
            delete window.__webdriver_evaluate;
            delete window.__selenium_evaluate;
            delete window.__webdriver_script_function;
            delete window.__webdriver_script_func;
            delete window.__webdriver_script_fn;
            delete window.__fxdriver_evaluate;
            delete window.__driver_unwrapped;
            delete window.__webdriver_unwrapped;
            delete window.__driver_evaluate;
            delete window.__selenium_unwrapped;
            delete window.__fxdriver_unwrapped;
            delete window.__dom_api__;
            delete window.__init_window_ref__;
            delete window.__clock_on;
            delete window.__Selenium_IDE_Recorder;
            delete window._selenium;
            delete window.BOT;
            
            // 11. Canvas 指纹随机化（轻微噪声）
            const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
            HTMLCanvasElement.prototype.toDataURL = function(...args) {
                const result = originalToDataURL.apply(this, args);
                // 稍微修改一点点像素添加不可见噪声
                try {
                    const imgData = result.split(',');
                    if (imgData[1]) {
                        const binary = atob(imgData[1]);
                        const array = [];
                        for (let i = 0; i < binary.length; i++) {
                            array.push(binary.charCodeAt(i));
                        }
                        // 只在特定位置添加微不可见变化
                        if (array.length > 100) {
                            array[100] = (array[100] + 1) % 256;
                        }
                    }
                } catch (e) {}
                return result;
            };
            
            // 12. connection type
            Object.defineProperty(navigator, 'connection', {
                get: () => ({
                    effectiveType: '4g',
                    downlink: 10,
                    rtt: 50,
                    downlinkMax: 100,
                    type: 'wifi'
                })
            });
            
            // 13. battery
            if ('getBattery' in navigator) {
                navigator.getBattery = () => Promise.resolve({
                    charging: true,
                    chargingTime: 0,
                    dischargingTime: Infinity,
                    level: 1.0
                });
            }
            
            // 14. mediaDevices
            if (navigator.mediaDevices) {
                navigator.mediaDevices.enumerateDevices = () => Promise.resolve([
                    { kind: 'audioinput', deviceId: 'default', groupId: 'group1', label: '' },
                    { kind: 'videoinput', deviceId: 'default', groupId: 'group2', label: '' }
                ]);
            }
        }
    """)
    
    # 额外设置：禁用自动化检测相关的事件
    page.evaluate("""
        () => {
            // 监听并拦截 automation 相关事件
            document.addEventListener('visibilitychange', e => {
                if (document.visibilityState === 'hidden') {
                    // 模拟真实用户行为
                }
            });
            
            // 防止检测到自动化
            Object.defineProperty(document, 'visibilityState', { get: () => 'visible' });
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
    
    # 获取当前鼠标位置
    current_x, current_y = page.mouse.position
    
    # 使用贝塞尔曲线模拟真实移动
    for i in range(steps):
        t = i / (steps - 1) if steps > 1 else 1
        
        # 添加随机抖动
        if i > 0 and i < steps - 1:
            jitter_x = random.uniform(-15, 15)
            jitter_y = random.uniform(-15, 15)
        else:
            jitter_x = 0
            jitter_y = 0
        
        # 使用缓动函数
        ease_t = 1 - ((1 - t) * (1 - t) * (1 - t))  # cubic ease-out
        
        cx = current_x + (x - current_x) * ease_t + jitter_x
        cy = current_y + (y - current_y) * ease_t + jitter_y
        
        # 添加微小的延迟变化
        delay = random.uniform(0.008, 0.02)
        page.mouse.move(int(cx), int(cy))
        time.sleep(delay)
    
    # 确保最终位置精确
    page.mouse.move(int(x), int(y))
    
    # 模拟悬停后的小抖动（真实用户不会完全静止）
    if random.random() < 0.3:
        for _ in range(random.randint(1, 3)):
            offset_x = random.randint(-2, 2)
            offset_y = random.randint(-2, 2)
            page.mouse.move(int(x + offset_x), int(y + offset_y))
            time.sleep(random.uniform(0.05, 0.15))


def human_scroll(page, direction='down', amount=None):
    """人性化滚动"""
    if amount is None:
        amount = random.randint(400, 1200)
    
    # 模拟鼠标滚轮事件
    page.mouse.wheel(0, amount if direction == 'down' else -amount)
    
    # 随机添加一些页面内微小滚动
    if random.random() < 0.4:
        time.sleep(random.uniform(0.1, 0.3))
        micro_scroll = random.randint(20, 80)
        page.evaluate(f"window.scrollBy(0, {micro_scroll * (1 if direction == 'down' else -1)})")


def scroll_and_watch(page, scroll_count=5):
    """滚动浏览视频"""
    for i in range(scroll_count):
        # 随机选择滚动方式
        scroll_method = random.choice(['wheel', 'js', 'keys'])
        
        if scroll_method == 'wheel':
            scroll_amount = random.randint(400, 1000)
            human_scroll(page, 'down', scroll_amount)
        elif scroll_method == 'js':
            scroll_amount = random.randint(500, 1200)
            # 添加随机偏移模拟真实用户
            page.evaluate(f"""
                window.scrollBy({{
                    top: {scroll_amount + random.randint(-50, 50)},
                    behavior: 'smooth'
                }})
            """)
        else:
            # 使用键盘滚动
            page.keyboard.press('PageDown')
        
        # 每个视频观看时间
        watch_time = random.uniform(3, 7)
        time.sleep(watch_time)
        
        # 模拟偶尔的回看行为（真实用户会这样）
        if random.random() < 0.2:
            back_scroll = random.randint(50, 200)
            page.evaluate(f"window.scrollBy(0, -{back_scroll})")
            time.sleep(random.uniform(0.5, 1.5))
            # 再滚回来
            page.evaluate(f"window.scrollBy(0, {back_scroll})")
            time.sleep(random.uniform(0.5, 1))
        
        print(f"   👀 浏览第 {i+1}/{scroll_count} 个视频 (~{watch_time:.1f}s)")


def human_typing(element, text, min_delay=80, max_delay=180):
    """人性化打字"""
    for char in text:
        # 随机延迟
        delay = random.uniform(min_delay, max_delay)
        
        # 偶尔添加暂停（模拟思考）
        if random.random() < 0.05:
            time.sleep(random.uniform(0.2, 0.5))
        
        element.type(char, delay=delay)


def click_element(page, selectors, element_name):
    """点击元素（人性化）"""
    for selector in selectors:
        try:
            locator = page.locator(selector).first
            if locator.is_visible(timeout=2000):
                # 获取元素位置
                box = locator.bounding_box()
                if box:
                    center_x = box["x"] + box["width"] / 2
                    center_y = box["y"] + box["height"] / 2
                    
                    # 人性化移动到元素
                    human_mouse_move(page, center_x, center_y)
                    
                    # 悬停一下（真实用户会这样）
                    time.sleep(random.uniform(0.3, 0.8))
                    
                    # 点击
                    locator.click()
                    print(f"   ✅ 已点击 {element_name}")
                    return True
        except Exception:
            continue
    print(f"   ⚠️ 未找到 {element_name}")
    return False


def find_and_type_message(page, message):
    """找到并输入消息"""
    # 尝试多种输入方式
    input_methods = [
        # 方法1: Draft.js contenteditable（TikTok 常用）
        {
            'selector': 'div[contenteditable="true"][aria-label*="消息"], div[contenteditable="true"][aria-label*="message"]',
            'type': 'contenteditable'
        },
        # 方法2: 直接 contenteditable
        {
            'selector': 'div[contenteditable="true"][role="textbox"]',
            'type': 'contenteditable'
        },
        # 方法3: textarea
        {
            'selector': 'textarea',
            'type': 'textarea'
        },
        # 方法4: data-e2e 输入框
        {
            'selector': '[data-e2e="message-input"], [data-e2e="dm-input"]',
            'type': 'input'
        },
        # 方法5: 通用 input
        {
            'selector': 'input[type="text"], input:not([type])',
            'type': 'input'
        },
    ]
    
    for method in input_methods:
        try:
            locator = page.locator(method['selector']).first
            if locator.is_visible(timeout=3000):
                locator.click()
                time.sleep(random.uniform(0.2, 0.5))
                
                # 清空现有内容
                locator.clear()
                time.sleep(random.uniform(0.1, 0.3))
                
                if method['type'] == 'contenteditable':
                    # 使用 type 模拟真实输入
                    for char in message:
                        locator.type(char, delay=random.uniform(80, 180))
                else:
                    locator.fill(message)
                
                print(f"   ✅ 文字已输入 ({method['selector']})")
                return True
        except Exception as e:
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
                user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            )
            page = context.new_page()

        # 应用反检测
        apply_stealth(page)

        try:
            # ========================================
            # 步骤1：打开首页，浏览视频
            # ========================================
            print("\n📍 步骤1: 打开首页，浏览视频...")
            page.goto(tiktok_url, wait_until="domcontentloaded", timeout=30000)
            time.sleep(random.uniform(1.5, 3))
            
            # 随机滚动浏览
            scroll_and_watch(page, scroll_count=random.randint(3, 8))

            # 等待 3-10 秒
            wait_time = random.uniform(3, 10)
            print(f"   🤖 浏览后等待 {wait_time:.1f} 秒...")
            time.sleep(wait_time)

            # ========================================
            # 步骤2：点击关注
            # ========================================
            print("\n📍 步骤2: 点击关注...")
            follow_selectors = [
                '[data-e2e="follow-user-button"]',
                '[data-e2e="follow-button"]',
                'button:has-text("关注")',
                '[class*="follow"]',
            ]
            click_element(page, follow_selectors, "关注")

            # ========================================
            # 步骤3：再滚动一下
            # ========================================
            print("\n📍 步骤3: 滚动页面...")
            human_scroll(page, 'down', random.randint(400, 800))
            time.sleep(random.uniform(1, 3))

            # ========================================
            # 步骤4：等待后点击消息
            # ========================================
            wait_time = random.uniform(5, 10)
            print(f"\n📍 步骤4: 等待 {wait_time:.1f} 秒后点击消息...")
            time.sleep(wait_time)

            print("\n📍 步骤5: 点击消息...")
            message_selectors = [
                '[data-e2e="contact-msg-btn"]',
                '[data-e2e="message-button"]',
                'a:has-text("发消息")',
                'button:has-text("发消息")',
            ]
            click_element(page, message_selectors, "消息")

            # ========================================
            # 步骤6：等待后输入
            # ========================================
            wait_time = random.uniform(5, 10)
            print(f"\n📍 步骤6: 等待 {wait_time:.1f} 秒后输入私信...")
            time.sleep(wait_time)

            print(f"   ✍️ 输入: {message}")
            find_and_type_message(page, message)

            # ========================================
            # 步骤7：点击发送
            # ========================================
            print("\n📍 步骤7: 点击发送...")
            time.sleep(random.uniform(0.8, 2.0))

            send_selectors = [
                'button:has-text("发送")',
                'button:has-text("Send")',
                '[data-e2e*="send"]',
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
    parser = argparse.ArgumentParser(description="TikTok 达人私信脚本 - 深度防检测版")
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
