// content.js - TikTok 私信发送插件 (Codex 优化版)
// 适配 TikTok 动态文本框和发送按钮
(function() {
  'use strict';

  // ========================================
  // 工具函数
  // ========================================
  
  // 从 URL 提取用户名
  function getUsername() {
    const match = window.location.pathname.match(/^\/@([^\/]+)/);
    return match ? match[1] : null;
  }

  // 随机延迟（秒）
  function delay(sec) {
    const actual = sec || (5 + Math.random() * 5);
    console.log('[DM] 等待', actual.toFixed(1), '秒...');
    return new Promise(resolve => setTimeout(resolve, actual * 1000));
  }

  // 查找单个元素（支持 XPath）
  function $(selector, ctx = document) {
    if (!selector) return null;
    if (selector.startsWith('//')) {
      const result = document.evaluate(selector, ctx, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      return result.singleNodeValue;
    }
    return ctx.querySelector(selector);
  }

  // 查找所有匹配元素
  function $$(selector, ctx = document) {
    if (selector.startsWith('//')) {
      const result = document.evaluate(selector, ctx, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      const items = [];
      for (let i = 0; i < result.snapshotLength; i++) {
        items.push(result.snapshotItem(i));
      }
      return items;
    }
    return Array.from(ctx.querySelectorAll(selector));
  }

  // 点击元素
  function click(el) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return false;
    el.click();
    return true;
  }

  // 安全点击（带事件派发）
  function safeClick(el) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return false;
    
    // 优先使用 click()
    el.click();
    
    // 如果 click() 无效，尝试 dispatchEvent
    if (!el.disabled && el.offsetParent !== null) {
      el.dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      }));
    }
    return true;
  }

  // ========================================
  // 动态检测工具
  // ========================================
  
  // 等待元素出现
  async function waitForElement(selector, timeout = 10000, interval = 500) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const el = $(selector);
      if (el && el.offsetParent !== null) return el;
      await delay(interval / 1000);
    }
    return null;
  }

  // 等待函数返回 true
  async function waitFor(fn, timeout = 10000, interval = 500) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      if (await fn()) return true;
      await delay(interval / 1000);
    }
    return false;
  }

  // ========================================
  // 关注功能
  // ========================================
  
  // 检查是否已关注
  async function checkFollowing() {
    await delay();
    
    // 方法1: 检查已关注按钮 (data-e2e)
    const followingBtn = $('[data-e2e="following-button"]');
    if (followingBtn && followingBtn.offsetParent !== null) {
      console.log('[DM] 已关注 (方法1: data-e2e)');
      return true;
    }
    
    // 方法2: 检查关注按钮是否存在
    const followBtn = $('[data-e2e="follow-button"], [data-e2e="follow-user-button"]');
    if (followBtn && followBtn.offsetParent !== null) {
      console.log('[DM] 未关注 (方法2: 关注按钮存在)');
      return false;
    }
    
    // 方法3: 检查按钮文字
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
    console.log('[DM] 执行关注...');
    await delay();
    
    // 方法1: data-e2e 选择器
    const followBtn = $('[data-e2e="follow-button"], [data-e2e="follow-user-button"]');
    if (followBtn && click(followBtn)) {
      console.log('[DM] 点击关注按钮成功 (方法1)');
      await delay();
      return true;
    }
    
    // 方法2: 按文字找按钮
    const buttons = $$('button');
    for (const btn of buttons) {
      if (btn.innerText?.trim().toLowerCase() === 'follow' && btn.offsetParent !== null) {
        if (click(btn)) {
          console.log('[DM] 按文字点击关注成功 (方法2)');
          await delay();
          return true;
        }
      }
    }
    
    console.log('[DM] 未找到关注按钮');
    return false;
  }

  // ========================================
  // 私信功能 - 核心修复
  // ========================================
  
  // 点击消息按钮
  async function clickMessage() {
    console.log('[DM] 查找消息按钮...');
    await delay();
    
    // 构建所有可能的消息按钮选择器
    const selectors = [
      // data-e2e 属性
      '[data-e2e="contact-msg-btn"]',
      '[data-e2e="message-button"]',
      '[data-e2e="dm-tab-btn"]',
      // aria 属性
      '[aria-label*="message" i]',
      '[aria-label*="消息" i]',
      '[aria-label*="Message" i]',
      // a 标签链接
      'a[href*="/message/"]',
      'a[href*="/messages/"]',
      // 通用
      '[class*="message"][class*="btn"]',
      '[class*="msg"][class*="btn"]',
    ];
    
    for (const sel of selectors) {
      const el = $(sel);
      if (el && click(el)) {
        console.log('[DM] 点击消息按钮成功:', sel);
        await delay();
        return true;
      }
    }
    
    // 方法2: 按文字找
    const links = $$('a');
    for (const a of links) {
      const text = a.innerText?.trim().toLowerCase();
      if (text === 'message' || text === '发消息' || text === '私信') {
        if (click(a)) {
          console.log('[DM] 按文字点击消息按钮成功');
          await delay();
          return true;
        }
      }
    }
    
    console.log('[DM] 未找到消息按钮');
    return false;
  }

  // 等待私信对话框出现
  async function waitForMessageDialog() {
    console.log('[DM] 等待私信对话框...');
    
    // 方法1: 等待 DM 特定元素出现
    const dialogSelectors = [
      // 常见 DM 输入区属性
      '[data-e2e="message-input-area"]',
      '[data-e2e="dm-new-input-editor"]',
      '[data-e2e="dm-editor"]',
      '[data-e2e="message-textarea"]',
      // contenteditable
      'div[contenteditable="true"][aria-label*="message" i]',
      'div[contenteditable="true"][aria-label*="消息" i]',
      'div[contenteditable="true"][aria-label*="发送" i]',
      // 可能的容器
      '[class*="dm-editor"]',
      '[class*="message-editor"]',
      '[class*="compose-editor"]',
    ];
    
    for (let i = 0; i < 20; i++) {
      await delay(0.5);
      
      for (const sel of dialogSelectors) {
        const el = $(sel);
        if (el && el.offsetParent !== null) {
          console.log('[DM] 私信对话框已出现:', sel);
          return true;
        }
      }
      
      // 也检查 body 中是否有 DM 相关的 URL
      if (window.location.pathname.includes('/messages/') || 
          window.location.hash.includes('#/messages')) {
        console.log('[DM] 检测到 messages URL');
        await delay(1);
        return true;
      }
    }
    
    console.log('[DM] 私信对话框未出现');
    return false;
  }

  // ========================================
  // 输入框定位与输入 - 核心修复
  // ========================================
  
  // 深度查找输入框（递归搜索 Shadow DOM 和 iframe）
  function deepFindInput(root = document) {
    // 直接检查 contenteditable
    const editable = root.querySelector('div[contenteditable="true"]');
    if (editable) {
      const label = editable.getAttribute('aria-label') || '';
      if (/message|消息|send|发送/i.test(label)) {
        return { type: 'contenteditable', el: editable };
      }
    }
    
    // 检查 textarea
    const textarea = root.querySelector('textarea[placeholder*="message" i], textarea[placeholder*="消息" i]');
    if (textarea) {
      return { type: 'textarea', el: textarea };
    }
    
    // 检查 input
    const input = root.querySelector('input[placeholder*="message" i], input[placeholder*="消息" i]');
    if (input) {
      return { type: 'input', el: input };
    }
    
    // 搜索所有可能包含输入框的容器
    const containers = root.querySelectorAll('[data-e2e*="input"], [data-e2e*="editor"], [data-e2e*="compose"]');
    for (const container of containers) {
      const editable = container.querySelector('div[contenteditable="true"]');
      if (editable) {
        return { type: 'contenteditable', el: editable };
      }
      const textarea = container.querySelector('textarea');
      if (textarea) {
        return { type: 'textarea', el: textarea };
      }
    }
    
    return null;
  }

  // 找到私信输入框
  async function findInput() {
    console.log('[DM] 查找输入框...');
    await delay();
    
    // 先尝试等待对话框稳定
    await waitFor(() => !!deepFindInput(), 5000, 300);
    
    // 方法1: deepFindInput 智能查找
    const found = deepFindInput();
    if (found) {
      console.log('[DM] 找到输入框类型:', found.type);
      return found.el;
    }
    
    // 方法2: 直接查询各种可能的选择器
    const selectors = [
      // data-e2e
      '[data-e2e="message-input-area"]',
      '[data-e2e="dm-new-input-editor"]',
      '[data-e2e="dm-editor"]',
      '[data-e2e="message-textarea"]',
      '[data-e2e="new-message-input"]',
      // contenteditable
      'div[contenteditable="true"][aria-label*="message"]',
      'div[contenteditable="true"][aria-label*="消息"]',
      'div[contenteditable="true"][aria-label*="发送"]',
      'div[contenteditable="true"][aria-label*="Send"]',
      // textarea
      'textarea[class*="message"]',
      'textarea[class*="dm-"]',
      'textarea[class*="compose"]',
      // input
      'input[class*="message"]',
      'input[class*="dm-"]',
    ];
    
    for (const sel of selectors) {
      const el = $(sel);
      if (el && el.offsetParent !== null) {
        console.log('[DM] 找到输入框:', sel);
        return el;
      }
    }
    
    // 方法3: 搜索 body 中所有的 contenteditable
    const allEditable = $$('div[contenteditable="true"]');
    for (const el of allEditable) {
      const label = el.getAttribute('aria-label') || '';
      const role = el.getAttribute('role') || '';
      if (/message|消息|send|发送/i.test(label) || role === 'textbox') {
        console.log('[DM] 从所有 contenteditable 中找到:', label);
        return el;
      }
    }
    
    console.log('[DM] 未找到输入框');
    return null;
  }

  // 输入文字 - 多种策略
  async function typeMessage(text) {
    console.log('[DM] 输入私信:', text);
    
    const input = await findInput();
    if (!input) {
      console.log('[DM] 未找到输入框');
      return false;
    }
    
    await delay();
    
    // 根据输入框类型采用不同策略
    const tagName = input.tagName.toLowerCase();
    const isContentEditable = input.isContentEditable;
    
    console.log('[DM] 输入框类型:', tagName, 'contenteditable:', isContentEditable);
    
    if (isContentEditable) {
      return await typeInContentEditable(input, text);
    } else if (tagName === 'textarea' || tagName === 'input') {
      return await typeInInput(input, text);
    }
    
    return false;
  }

  // contenteditable 输入策略
  async function typeInContentEditable(editor, text) {
    console.log('[DM] 使用 contenteditable 策略...');
    
    // 聚焦
    editor.focus();
    await delay(0.3);
    
    // 清除现有内容（如果有）
    editor.innerHTML = '';
    await delay(0.2);
    
    // 方法1: 直接设置文本（适用于 Draft.js/React）
    // 先清空
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
    
    // 删除现有内容
    document.execCommand('delete', false, null);
    await delay(0.2);
    
    // 方法2: 模拟每个字符输入（最可靠）
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      // 方法2.1: execCommand insertText（Draft.js 通常支持）
      const inserted = document.execCommand('insertText', false, char);
      
      if (!inserted) {
        // 方法2.2: 手动 DOM 操作
        const currentContent = editor.innerText || '';
        editor.innerText = currentContent + char;
      }
      
      // 触发 input 事件
      editor.dispatchEvent(new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertText',
        data: char
      }));
      
      // 触发 beforeinput 事件（某些框架需要）
      editor.dispatchEvent(new InputEvent('beforeinput', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertText',
        data: char
      }));
      
      await delay(0.02); // 模拟打字速度
    }
    
    await delay(0.3);
    
    // 验证输入
    const result = editor.innerText || editor.textContent || '';
    console.log('[DM] 输入结果:', result.substring(0, 50));
    
    if (result.includes(text.substring(0, 10))) {
      console.log('[DM] 输入成功');
      return true;
    }
    
    // 备选：直接设置 innerText
    editor.innerText = text;
    editor.dispatchEvent(new InputEvent('input', {
      bubbles: true,
      cancelable: true,
      inputType: 'insertFromPaste'
    }));
    
    return true;
  }

  // input/textarea 输入策略
  async function typeInInput(input, text) {
    console.log('[DM] 使用 input/textarea 策略...');
    
    // 聚焦
    input.focus();
    await delay(0.3);
    
    // 清除现有内容
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await delay(0.2);
    
    // 方法1: 直接设置 value（React/Angular 触发）
    input.value = text;
    input.dispatchEvent(new InputEvent('input', {
      bubbles: true,
      cancelable: true,
      inputType: 'insertText',
      data: text
    }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    
    await delay(0.3);
    
    // 方法2: 模拟键盘输入
    if (!input.value) {
      // 模拟每个字符
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        
        // 触发 keydown
        input.dispatchEvent(new KeyboardEvent('keydown', {
          bubbles: true,
          cancelable: true,
          key: char,
          keyCode: char.charCodeAt(0)
        }));
        
        // 触发 keypress
        input.dispatchEvent(new KeyboardEvent('keypress', {
          bubbles: true,
          cancelable: true,
          key: char,
          keyCode: char.charCodeAt(0)
        }));
        
        // 更新 value
        input.value = input.value + char;
        
        // 触发 input
        input.dispatchEvent(new InputEvent('input', {
          bubbles: true,
          cancelable: true,
          inputType: 'insertText',
          data: char
        }));
        
        await delay(0.02);
      }
    }
    
    await delay(0.3);
    
    console.log('[DM] 输入值:', input.value.substring(0, 30));
    return !!input.value;
  }

  // ========================================
  // 发送按钮定位 - 核心修复
  // ========================================
  
  // 深度查找发送按钮
  function deepFindSendButton() {
    // 方法1: 查找包含 "send" 相关文本的按钮
    const allButtons = $$('button');
    for (const btn of allButtons) {
      if (btn.offsetParent === null) continue;
      
      const text = btn.innerText?.trim().toLowerCase() || '';
      const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
      
      // 匹配关键词
      if (text === 'send' || text === '发送' || text === 'send message' ||
          ariaLabel.includes('send') || ariaLabel.includes('发送')) {
        console.log('[DM] 找到发送按钮 (文字匹配):', text || ariaLabel);
        return btn;
      }
    }
    
    // 方法2: 查找 DM 相关的 data-e2e
    const dmSelectors = [
      '[data-e2e="dm-new-send-btn"]',
      '[data-e2e="send-message-button"]',
      '[data-e2e="dm-send-btn"]',
      '[data-e2e="message-send-btn"]',
      '[data-e2e="new-dm-send"]',
      '[data-e2e="chat-send-btn"]',
    ];
    
    for (const sel of dmSelectors) {
      const btn = $(sel);
      if (btn && btn.offsetParent !== null) {
        console.log('[DM] 找到发送按钮 (data-e2e):', sel);
        return btn;
      }
    }
    
    // 方法3: 查找粉色/红色图标按钮（TikTok 品牌色 #FE2C55）
    for (const btn of allButtons) {
      if (btn.offsetParent === null) continue;
      
      const svg = btn.querySelector('svg');
      if (svg) {
        const fill = svg.getAttribute('fill') || '';
        const color = svg.getAttribute('color') || '';
        
        // TikTok 粉色
        if (fill.includes('FE2C55') || fill.includes('fe2c55') ||
            color.includes('FE2C55') || color.includes('fe2c55')) {
          console.log('[DM] 找到发送按钮 (粉色图标)');
          return btn;
        }
      }
    }
    
    // 方法4: 查找 icon 类型的按钮（通常是发送图标）
    for (const btn of allButtons) {
      if (btn.offsetParent === null) continue;
      if (btn.className && btn.className.includes && 
          (btn.className.includes('send') || btn.className.includes('submit'))) {
        console.log('[DM] 找到发送按钮 (class)');
        return btn;
      }
    }
    
    // 方法5: 查找 DM 编辑器区域的按钮
    const editorArea = $('[data-e2e*="input-editor"], [data-e2e*="dm-editor"], [class*="dm-editor"]');
    if (editorArea) {
      const buttons = editorArea.querySelectorAll('button');
      for (const btn of buttons) {
        if (btn.offsetParent !== null && btn.innerText?.trim()) {
          // 有文字的按钮
          const text = btn.innerText.trim().toLowerCase();
          if (text === 'send' || text === '发送') {
            console.log('[DM] 找到发送按钮 (编辑器内)');
            return btn;
          }
        }
      }
    }
    
    // 方法6: 查找 div[role="button"] 类型的发送按钮
    const roleButtons = $$('div[role="button"]');
    for (const btn of roleButtons) {
      if (btn.offsetParent === null) continue;
      const text = btn.innerText?.trim().toLowerCase() || '';
      if (text === 'send' || text === '发送') {
        console.log('[DM] 找到发送按钮 (role=button)');
        return btn;
      }
    }
    
    return null;
  }

  // 找到发送按钮
  async function findSendButton() {
    console.log('[DM] 查找发送按钮...');
    
    // 先等一下让按钮出现
    await waitFor(() => !!deepFindSendButton(), 3000, 300);
    
    const btn = deepFindSendButton();
    if (btn) return btn;
    
    // 备选：在整个页面范围搜索
    console.log('[DM] 尝试全页面搜索...');
    await delay(1);
    
    // 搜索所有可能包含 Send 文字的元素
    const sendElements = $$('*');
    for (const el of sendElements) {
      if (el.offsetParent === null) continue;
      
      const text = el.innerText?.trim().toLowerCase() || '';
      if (text === 'send' || text === '发送') {
        // 检查是否是可点击的
        const tag = el.tagName.toLowerCase();
        if (tag === 'button' || tag === 'div' || tag === 'span') {
          console.log('[DM] 全页面搜索找到发送元素:', tag, text);
          return el;
        }
      }
    }
    
    console.log('[DM] 未找到发送按钮');
    return null;
  }

  // 点击发送按钮
  async function clickSend() {
    console.log('[DM] 点击发送按钮...');
    
    const sendBtn = await findSendButton();
    if (!sendBtn) {
      console.log('[DM] 未找到发送按钮');
      return false;
    }
    
    // 聚焦并点击
    sendBtn.focus();
    await delay(0.2);
    
    // 方法1: 直接 click
    if (click(sendBtn)) {
      console.log('[DM] click() 点击成功');
      await delay(1);
      return true;
    }
    
    // 方法2: dispatchEvent
    sendBtn.dispatchEvent(new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    }));
    console.log('[DM] dispatchEvent 点击成功');
    await delay(1);
    return true;
  }

  // ========================================
  // 主流程
  // ========================================
  
  async function sendDM(message) {
    const username = getUsername();
    console.log('[DM] ===== 开始私信流程 =====');
    console.log('[DM] 用户:', username);
    console.log('[DM] 消息:', message);
    
    if (!username) {
      return { success: false, error: '无法获取用户名，请在达人主页使用' };
    }

    try {
      // 步骤1: 检查并关注
      console.log('[DM] 步骤1: 检查关注状态');
      const isFollowing = await checkFollowing();
      
      if (!isFollowing) {
        console.log('[DM] 步骤2: 执行关注');
        const followed = await doFollow();
        if (!followed) {
          console.log('[DM] 关注失败，但继续尝试发送私信');
        }
      } else {
        console.log('[DM] 步骤2: 已关注，跳过');
      }

      // 步骤3: 点击消息按钮
      console.log('[DM] 步骤3: 点击消息按钮');
      const msgClicked = await clickMessage();
      if (!msgClicked) {
        return { success: false, error: '未找到消息按钮', step: '消息按钮' };
      }

      // 步骤4: 等待对话框
      console.log('[DM] 步骤4: 等待私信对话框');
      const dialogAppeared = await waitForMessageDialog();
      if (!dialogAppeared) {
        return { success: false, error: '私信对话框未出现', step: '等待对话框' };
      }

      // 步骤5: 输入文字
      console.log('[DM] 步骤5: 输入私信内容');
      const typed = await typeMessage(message);
      if (!typed) {
        return { success: false, error: '输入框输入失败', step: '输入框' };
      }

      // 步骤6: 点击发送
      console.log('[DM] 步骤6: 点击发送');
      const sent = await clickSend();
      if (!sent) {
        return { success: false, error: '发送按钮未找到', step: '发送按钮' };
      }

      console.log('[DM] ===== 私信流程完成 =====');
      return { success: true, username };

    } catch (err) {
      console.error('[DM] 私信流程出错:', err);
      return { success: false, error: err.message };
    }
  }

  // ========================================
  // 消息监听
  // ========================================
  
  chrome.runtime.onMessage.addListener((req, res) => {
    console.log('[DM] 收到消息:', req.action);

    if (req.action === 'test') {
      res({ success: true, username: getUsername() || '未知' });
    } 
    else if (req.action === 'sendDM') {
      sendDM(req.message).then(result => res(result));
      return true; // 异步响应
    }
    else if (req.action === 'debug') {
      // 调试信息
      const debugInfo = {
        username: getUsername(),
        url: window.location.href,
        path: window.location.pathname,
        // 输入框状态
        inputCandidates: [],
        // 按钮状态
        buttonCandidates: [],
      };
      
      // 收集可能的输入框
      const inputs = $$('div[contenteditable="true"]');
      inputs.forEach(el => {
        debugInfo.inputCandidates.push({
          ariaLabel: el.getAttribute('aria-label'),
          className: el.className,
          hasContent: !!el.innerText
        });
      });
      
      // 收集可能的按钮
      const btns = $$('button');
      btns.forEach(el => {
        if (el.offsetParent !== null) {
          debugInfo.buttonCandidates.push({
            text: el.innerText?.trim().substring(0, 30),
            ariaLabel: el.getAttribute('aria-label'),
            dataE2e: el.getAttribute('data-e2e')
          });
        }
      });
      
      res(debugInfo);
    }
  });

  console.log('[DM] TikTok DM 插件已加载 (Codex 优化版), 用户:', getUsername());
})();
