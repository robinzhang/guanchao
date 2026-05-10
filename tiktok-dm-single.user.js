// ==UserScript==
// @name         TikTok 私信助手
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  TikTok达人私信助手，支持自动关注和发私信
// @author       You
// @match        https://*.tiktok.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // 配置
    const CONFIG = {
        delayMin: 5,      // 最小延迟（秒）
        delayMax: 10,      // 最大延迟（秒）
        retryTimes: 3,     // 重试次数
        retryDelay: 3       // 重试间隔（秒）
    };

    // 工具函数
    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
    
    const delay = (sec) => new Promise(r => setTimeout(r, (sec || (CONFIG.delayMin + Math.random() * (CONFIG.delayMax - CONFIG.delayMin))) * 1000));

    const log = (msg) => console.log(`[TikTok DM] ${msg}`);

    // 从 URL 获取用户名
    function getUsername() {
        const match = window.location.pathname.match(/^\/@([^\/]+)/);
        return match ? match[1] : null;
    }

    // 点击元素
    function click(el) {
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return false;
        el.click();
        return true;
    }

    // ========================================
    // 核心功能
    // ========================================

    // 检查是否已关注
    async function checkFollowing() {
        await delay();
        
        // 方法1: data-e2e
        const following = $('[data-e2e="following-button"]');
        if (following && following.offsetParent !== null) {
            log('已关注');
            return true;
        }

        // 方法2: 按钮文字
        const buttons = $$('button');
        for (const btn of buttons) {
            const text = btn.innerText?.trim().toLowerCase();
            if (text === 'following') return true;
            if (text === 'follow') return false;
        }
        return false;
    }

    // 点击关注
    async function doFollow() {
        log('执行关注...');
        await delay();
        
        const followBtn = $('[data-e2e="follow-button"], [data-e2e="follow-user-button"]');
        if (followBtn && click(followBtn)) {
            log('点击关注按钮成功');
            await delay();
            return true;
        }

        // 按文字
        const buttons = $$('button');
        for (const btn of buttons) {
            if (btn.innerText?.trim().toLowerCase() === 'follow' && btn.offsetParent !== null) {
                click(btn);
                log('按文字点击关注成功');
                await delay();
                return true;
            }
        }
        
        log('未找到关注按钮');
        return false;
    }

    // 点击消息按钮
    async function clickMessage() {
        log('查找消息按钮...');
        await delay();
        
        const msgBtn = $('[data-e2e="contact-msg-btn"], [data-e2e="message-button"]');
        if (msgBtn && click(msgBtn)) {
            log('点击消息按钮成功');
            await delay();
            return true;
        }

        // 按文字
        const links = $$('a');
        for (const a of links) {
            const text = a.innerText?.trim().toLowerCase();
            if (text === 'message' || text === '发消息') {
                click(a);
                log('按文字点击消息成功');
                await delay();
                return true;
            }
        }

        log('未找到消息按钮');
        return false;
    }

    // 等待私信对话框出现
    async function waitDialog() {
        log('等待私信对话框...');
        for (let i = 0; i < 10; i++) {
            await delay(1);
            const inputArea = $('[data-e2e="message-input-area"]');
            if (inputArea) {
                log('私信对话框已出现');
                return true;
            }
        }
        return false;
    }

    // 查找输入框
    async function findInput() {
        log('查找输入框...');
        await delay();
        
        const editor = $('div[contenteditable="true"][aria-label="发送消息..."]');
        if (editor) {
            log('找到 contenteditable 输入框');
            return editor;
        }
        
        const area = $('[data-e2e="message-input-area"]');
        if (area) {
            log('找到 message-input-area');
            return area;
        }
        
        log('未找到输入框');
        return null;
    }

    // 输入文字 - 使用模拟键盘输入
    async function typeMessage(text) {
        log('输入私信: ' + text);
        await delay();
        
        const editor = $('div[contenteditable="true"][aria-label="发送消息..."]');
        if (!editor) {
            log('未找到编辑器');
            return false;
        }
        
        // 聚焦
        editor.focus();
        log('已聚焦');
        await delay(0.5);
        
        // 找到 br[data-text] 并替换
        const br = $('br[data-text="true"]');
        if (br) {
            log('找到 br[data-text]');
            
            // 创建 span
            const span = document.createElement('span');
            span.setAttribute('data-text', 'true');
            span.textContent = text;
            
            // 替换
            br.parentNode.replaceChild(span, br);
            log('已替换 br 为 span');
            
            // 触发事件
            editor.dispatchEvent(new InputEvent('input', {
                bubbles: true, cancelable: true,
                inputType: 'insertText', data: text
            }));
            
            // 模拟回车
            setTimeout(() => {
                editor.dispatchEvent(new KeyboardEvent('keydown', {
                    bubbles: true, cancelable: true,
                    key: 'Enter', keyCode: 13, which: 13
                }));
            }, 100);
            
            return true;
        }
        
        // 备选：直接设置 span[data-text]
        const span = $('span[data-text="true"]');
        if (span) {
            span.textContent = text;
            editor.dispatchEvent(new InputEvent('input', {
                bubbles: true, cancelable: true,
                inputType: 'insertText', data: text
            }));
            log('直接设置 span 内容');
            return true;
        }
        
        log('输入失败');
        return false;
    }

    // 查找并点击发送按钮
    async function clickSend() {
        log('查找发送按钮...');
        await delay();
        
        // 方法1: data-e2e
        const sendBtn = $('[data-e2e="dm-new-send-btn"]');
        if (sendBtn && sendBtn.offsetParent !== null) {
            log('找到 dm-new-send-btn');
            click(sendBtn);
            await delay();
            return true;
        }

        // 方法2: 按文字
        const buttons = $$('button');
        for (const btn of buttons) {
            const text = btn.innerText?.trim().toLowerCase();
            if ((text === 'send' || text === '发送') && btn.offsetParent !== null) {
                click(btn);
                log('按文字点击发送');
                await delay();
                return true;
            }
        }

        // 方法3: 找粉红色图标的按钮
        for (const btn of buttons) {
            const svg = btn.querySelector('svg');
            if (svg) {
                const fill = svg.getAttribute('fill') || '';
                if (fill.includes('#FE2C55') && btn.offsetParent !== null) {
                    click(btn);
                    log('点击粉色图标按钮');
                    await delay();
                    return true;
                }
            }
        }

        log('未找到发送按钮');
        return false;
    }

    // 主流程
    async function sendDM(message) {
        const username = getUsername();
        if (!username) {
            alert('请在达人主页使用此脚本！');
            return { success: false, error: '请在达人主页使用' };
        }

        log('========== 开始私信流程 ==========');
        log('达人: @' + username);
        log('消息: ' + message);

        try {
            // 1. 检查关注
            log('步骤1: 检查关注状态');
            const isFollowing = await checkFollowing();

            if (!isFollowing) {
                log('步骤2: 执行关注');
                await doFollow();
            } else {
                log('步骤2: 已关注，跳过');
            }

            // 2. 点击消息
            log('步骤3: 点击消息按钮');
            const msgClicked = await clickMessage();
            if (!msgClicked) {
                return { success: false, error: '消息按钮未找到' };
            }

            // 3. 等待对话框
            log('步骤4: 等待对话框');
            const dialogAppeared = await waitDialog();
            if (!dialogAppeared) {
                return { success: false, error: '私信对话框未出现' };
            }

            // 4. 输入消息
            log('步骤5: 输入私信');
            const inputFound = await findInput();
            if (!inputFound) {
                return { success: false, error: '输入框未找到' };
            }
            await typeMessage(message);

            // 5. 发送
            log('步骤6: 点击发送');
            await clickSend();

            log('========== 私信流程完成 ==========');
            return { success: true, username };

        } catch (err) {
            log('流程出错: ' + err.message);
            return { success: false, error: err.message };
        }
    }

    // ========================================
    // 界面 - 创建操作面板
    // ========================================

    function createUI() {
        // 样式
        const style = document.createElement('style');
        style.textContent = `
            .tiktok-dm-panel {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 320px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                z-index: 999999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                overflow: hidden;
            }
            .tiktok-dm-panel * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
            }
            .tiktok-dm-header {
                background: linear-gradient(135deg, #fe2c55 0%, #ff6b8a 100%);
                color: white;
                padding: 16px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .tiktok-dm-header h3 {
                font-size: 16px;
                font-weight: 600;
            }
            .tiktok-dm-close {
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                width: 28px;
                height: 28px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 18px;
            }
            .tiktok-dm-close:hover {
                background: rgba(255,255,255,0.3);
            }
            .tiktok-dm-body {
                padding: 16px;
            }
            .tiktok-dm-input {
                width: 100%;
                height: 100px;
                border: 2px solid #eee;
                border-radius: 8px;
                padding: 12px;
                font-size: 14px;
                resize: none;
                outline: none;
                transition: border-color 0.2s;
            }
            .tiktok-dm-input:focus {
                border-color: #fe2c55;
            }
            .tiktok-dm-btn {
                width: 100%;
                padding: 14px;
                margin-top: 12px;
                background: linear-gradient(135deg, #fe2c55 0%, #ff6b8a 100%);
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 15px;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.2s, box-shadow 0.2s;
            }
            .tiktok-dm-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(254, 44, 85, 0.3);
            }
            .tiktok-dm-btn:disabled {
                background: #ccc;
                cursor: not-allowed;
                transform: none;
                box-shadow: none;
            }
            .tiktok-dm-log {
                margin-top: 12px;
                padding: 12px;
                background: #f5f5f5;
                border-radius: 8px;
                font-size: 12px;
                color: #666;
                max-height: 150px;
                overflow-y: auto;
                font-family: monospace;
            }
            .tiktok-dm-log div {
                margin-bottom: 4px;
            }
            .tiktok-dm-log .success {
                color: #00c853;
            }
            .tiktok-dm-log .error {
                color: #d50000;
            }
            .tiktok-dm-user {
                margin-top: 8px;
                padding: 8px 12px;
                background: #fff5f7;
                border-radius: 6px;
                font-size: 13px;
                color: #fe2c55;
            }
        `;
        document.head.appendChild(style);

        // DOM
        const panel = document.createElement('div');
        panel.className = 'tiktok-dm-panel';
        panel.innerHTML = `
            <div class="tiktok-dm-header">
                <h3>📩 TikTok 私信助手</h3>
                <button class="tiktok-dm-close" id="dmClose">×</button>
            </div>
            <div class="tiktok-dm-body">
                <div class="tiktok-dm-user" id="dmUser">当前达人: @--</div>
                <textarea class="tiktok-dm-input" id="dmMessage" placeholder="输入要发送的私信内容..."></textarea>
                <button class="tiktok-dm-btn" id="dmSend">发送私信</button>
                <div class="tiktok-dm-log" id="dmLog"></div>
            </div>
        `;
        document.body.appendChild(panel);

        // 事件
        const closeBtn = $('#dmClose');
        const sendBtn = $('#dmSend');
        const msgInput = $('#dmMessage');
        const logDiv = $('#dmLog');
        const userDiv = $('#dmUser');

        // 更新用户
        function updateUser() {
            const u = getUsername();
            userDiv.textContent = u ? '当前达人: @' + u : '当前页面不是达人主页';
        }
        updateUser();

        // 日志
        function addLog(msg, type = '') {
            const div = document.createElement('div');
            div.className = type;
            div.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
            logDiv.appendChild(div);
            logDiv.scrollTop = logDiv.scrollHeight;
        }

        // 关闭
        closeBtn.onclick = () => panel.remove();

        // 发送
        sendBtn.onclick = async () => {
            const message = msgInput.value.trim();
            if (!message) {
                alert('请输入私信内容');
                return;
            }
            if (!getUsername()) {
                alert('请在达人主页使用');
                return;
            }

            sendBtn.disabled = true;
            sendBtn.textContent = '发送中...';
            addLog('开始发送...');

            const result = await sendDM(message);

            if (result.success) {
                addLog('✅ 私信发送成功!', 'success');
                sendBtn.textContent = '发送成功 ✓';
                msgInput.value = '';
            } else {
                addLog('❌ 发送失败: ' + result.error, 'error');
                sendBtn.textContent = '发送失败，重试';
            }

            setTimeout(() => {
                sendBtn.disabled = false;
                sendBtn.textContent = '发送私信';
            }, 2000);
        };

        // URL 变化时更新
        const observer = new MutationObserver(() => updateUser());
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // 启动
    if (document.readyState === 'complete') {
        createUI();
    } else {
        window.addEventListener('load', createUI);
    }

})();
