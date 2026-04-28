#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TikTok 私信自动化脚本 - Android 手机版
使用 Appium + uiautomator2 控制手机 TikTok App

依赖安装:
  pip install uiautomator2
  # 或者
  pip install appium-python-client

手机设置:
  1. 开启开发者模式 -> USB调试
  2. 连接电脑，执行: adb tcpip 5555
  3. 确认电脑和手机在同一 WiFi
  4. 手机上打开 TikTok 并登录

用法:
  python3 tiktok_dm_mobile.py <tiktok_url> <message>
"""

import sys
import time
import random
import argparse
import subprocess
import os

# ============================================================
# 配置
# ============================================================
DEVICE_IP = os.getenv("DEVICE_IP", "192.168.1.100")  # 手机 IP
DEVICE_PORT = os.getenv("DEVICE_PORT", "5555")
PACKAGE_NAME = "com.zhiliaoapp.musically"  # TikTok APK 包名

# ============================================================
# ADB 工具
# ============================================================

def adb(command):
    """执行 ADB 命令"""
    result = subprocess.run(
        f"adb {command}".split(),
        capture_output=True,
        text=True
    )
    return result.stdout.strip(), result.returncode


def connect_device():
    """连接手机"""
    print(f"🔌 连接手机 {DEVICE_IP}:{DEVICE_PORT}...")
    output, code = adb(f"connect {DEVICE_IP}:{DEVICE_PORT}")
    if code == 0:
        print(f"   ✅ {output}")
    else:
        print(f"   ⚠️ {output}")


def start_app(package):
    """启动 App"""
    print(f"📱 启动 {package}...")
    adb(f"shell am start -n {package}/.MainActivity")
    time.sleep(3)


def tap(x, y):
    """点击坐标"""
    adb(f"shell input tap {x} {y}")
    time.sleep(random.uniform(0.3, 0.8))


def swipe(x1, y1, x2, y2, duration=500):
    """滑动"""
    adb(f"shell input swipe {x1} {y1} {x2} {y2} {duration}")
    time.sleep(random.uniform(0.5, 1.5))


def input_text(text):
    """输入文本"""
    # 先清空
    adb("shell input keyevent KEYCODE_CTRL_A")
    adb("shell input keyevent KEYCODE_DEL")
    # 输入
    adb(f'shell input text "{text}"')
    time.sleep(random.uniform(0.3, 0.8))


def wait_and_check(label, seconds=5):
    """等待若干秒"""
    print(f"   🤖 等待 {seconds} 秒 ({label})...")
    time.sleep(seconds)


def get_screen_size():
    """获取屏幕分辨率"""
    output, _ = adb("shell wm size")
    # 输出格式: Physical size: 1080x2400
    size = output.split(":")[-1].strip()
    w, h = map(int, size.split("x"))
    return w, h


# ============================================================
# TikTok 自动化流程
# ============================================================

def navigate_to_profile(url):
    """导航到达人主页"""
    print(f"\n📍 步骤1: 打开达人主页...")
    # 从 URL 提取用户名
    username = url.split("@")[-1].split("?")[0].split("/")[0]
    print(f"   👤 用户名: {username}")

    # 点击搜索按钮
    w, h = get_screen_size()

    # 搜索入口通常在底部导航栏或顶部
    # 先尝试点击首页顶部的搜索图标
    tap(w // 2, h // 8)  # 中顶部区域
    wait_and_check("进入搜索", 2)

    # 输入用户名
    tap(w // 2, h // 3)  # 点击搜索框
    wait_and_check("搜索框", 1)

    input_text(username)
    wait_and_check("输入完成", 2)

    # 点击搜索按钮
    tap(w * 14 // 15, h // 3)  # 右侧搜索图标
    wait_and_check("搜索结果", 3)

    # 点击第一个结果（用户）
    tap(w // 2, h // 4)  # 第一个用户结果
    wait_and_check("进入主页", 3)


def browse_videos():
    """浏览几个视频"""
    print(f"\n📍 步骤2: 浏览视频...")
    w, h = get_screen_size()

    # 模拟刷视频
    for i in range(random.randint(3, 6)):
        swipe(w // 2, h * 3 // 4, w // 2, h // 4)  # 上滑
        wait_and_check(f"观看第{i+1}个视频", random.uniform(2, 4))
        print(f"   👀 浏览第 {i+1} 个视频")


def click_follow():
    """点击关注"""
    print(f"\n📍 步骤3: 点击关注...")
    w, h = get_screen_size()

    # 关注按钮通常在主页顶部区域
    # 具体位置需要根据实际手机分辨率调整
    # 尝试点击头像右侧的关注按钮
    tap(w * 4 // 5, h // 6)  # 右上角区域
    wait_and_check("关注后", 3)


def scroll_and_wait_before_message():
    """滚动并等待"""
    print(f"\n📍 步骤4: 滚动并等待...")
    w, h = get_screen_size()

    # 向上滚动一点
    swipe(w // 2, h // 2, w // 2, h // 4)
    wait_and_check("滚动后", random.uniform(1, 2))

    # 等待 5-10 秒
    wait_time = random.uniform(5, 10)
    print(f"   🤖 等待 {wait_time:.1f} 秒...")
    time.sleep(wait_time)


def click_message_button():
    """点击消息按钮"""
    print(f"\n📍 步骤5: 点击消息...")
    w, h = get_screen_size()

    # 消息按钮在关注按钮旁边
    # 通常在头像右侧，紧跟关注按钮
    tap(w * 3 // 5, h // 6)  # 消息按钮位置
    wait_and_check("消息弹窗", random.uniform(2, 3))


def open_message_dialog():
    """打开消息对话框"""
    print(f"\n📍 步骤6: 打开消息对话框...")
    w, h = get_screen_size()

    # 等待消息列表出现
    wait_and_check("消息列表", 3)

    # 点击第一个对话
    tap(w // 6, h // 4)  # 通常第一个对话的位置
    wait_and_check("对话打开", random.uniform(2, 3))


def wait_before_send():
    """发送前等待"""
    print(f"\n📍 步骤7: 等待 5-10 秒...")
    wait_time = random.uniform(5, 10)
    print(f"   🤖 等待 {wait_time:.1f} 秒...")
    time.sleep(wait_time)


def type_and_send_message(message):
    """输入并发送消息"""
    print(f"\n📍 步骤8: 输入并发送消息...")
    print(f"   ✍️ 内容: {message}")
    w, h = get_screen_size()

    # 点击消息输入框
    tap(w // 2, h * 7 // 8)
    wait_and_check("输入框", 1)

    # 输入消息
    input_text(message)
    wait_and_check("输入完成", 1)

    # 点击发送按钮
    tap(w * 14 // 15, h * 7 // 8)
    wait_and_check("发送后", 2)

    print("   ✅ 消息已发送")


def run_dm_task(tiktok_url, message):
    """执行完整 DM 流程"""
    print("\n" + "="*50)
    print(f"📋 TikTok 手机私信任务")
    print(f"👤 达人: {tiktok_url}")
    print(f"💬 私信: {message}")
    print("="*50)

    # 确保手机已连接
    connect_device()

    # 启动 TikTok
    start_app(PACKAGE_NAME)
    wait_and_check("TikTok 启动", 5)

    try:
        # 流程
        navigate_to_profile(tiktok_url)
        browse_videos()
        click_follow()
        scroll_and_wait_before_message()
        click_message_button()
        open_message_dialog()
        wait_before_send()
        type_and_send_message(message)

        print("\n✅ 任务完成！")

    except Exception as e:
        print(f"\n❌ 任务失败: {e}")
        # 截图
        subprocess.run("adb shell screencap -p /sdcard/screenshot.png".split())
        subprocess.run("adb pull /sdcard/screenshot.png tiktok_error.png".split())
        print("   📸 截图已保存: tiktok_error.png")
        raise


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
    parser = argparse.ArgumentParser(description="TikTok 手机私信脚本 - Android 版")
    parser.add_argument("url", nargs="?", help="达人 TikTok 主页 URL")
    parser.add_argument("message", nargs="?", help="私信内容")
    parser.add_argument("--ip", default=DEVICE_IP, help=f"手机 IP 地址 (默认: {DEVICE_IP})")
    parser.add_argument("--port", default=DEVICE_PORT, help=f"ADB 端口 (默认: {DEVICE_PORT})")
    args = parser.parse_args()

    global DEVICE_IP, DEVICE_PORT
    DEVICE_IP = args.ip
    DEVICE_PORT = args.port

    if args.url:
        run_dm_task(args.url, args.message or input("私信内容: ").strip())
    else:
        interactive_mode()


if __name__ == "__main__":
    main()
