// content.js - TikTok 私信发送插件 (Codex 完整修复版)
// 适配 TikTok 动态文本框和发送按钮
(function() {
  'use strict';

  // ========================================
  // 工具函数
  // ========================================
  
  function getUsername() {
    const match = window.location.pathname.match(/^\/@([^\/]+)/);
    return match ? match[1] : null;
  }

  function delay(sec) {
    const actual = sec || (5 + Math.random() * 5);
    console.log('[DM] 等待', actual.toFixed(1), '秒...');
    return new Promise(resolve => setTimeout(resolve, actual * 1000));
  }

  function $(selector, ctx = document) {
    if (!selector) return null;
    if (selector.startsWith('//')) {
      const result = document.evaluate(selector, ctx, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      return result.singleNodeValue;
    }
    return ctx.querySelector(selector);
  }

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

  function click(el) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return false;
    el.click();
    return true;
  }

  async function waitForElement(selector, timeout = 10000, interval = 500) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const el = $(selector);
      if (el && el.offsetParent !== null) return el;
      await delay(interval / 1000);
    }
    return null;
  }

  async function waitFor(fn, timeout = 10000, interval = 500) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      if (await fn()) return true;
      await delay(interval / 1000);
    }
    return false;
  }

  // ========================================
  // React 内部机制
  // ========================================
  
  // 获取 React fiber
  function getReactFiber(dom) {
    const keys = Object.keys(dom).filter(k => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$'));
    return keys.length ? dom[keys[0]] : null;
  }
  
  // 获取元素的最近 React 组件实例
  function getReactComponent(dom) {
    let current = dom;
    while (current) {
      const fiber = getReactFiber(current);
      if (fiber) return fiber;
      current = current.parentElement;
    }
    return null;
  }

  // ========================================
  // 核心输入函数 - 完整重写
  // ========================================
  
  // 安全的 contenteditable 输入
  async function typeInContentEditable(editor, text) {
    console.log('[DM] ===== contenteditable 输入开始 =====');
    console.log('[DM] 编辑器信息:', {
      tagName: editor.tagName,
      className: editor.className.substring(0, 80),
      ariaLabel: editor.getAttribute('aria-label'),
      contenteditable: editor.contentEditable,
      childCount: editor.children.length,
      innerHTML: editor.innerHTML.substring(0, 100)
    });
    
    // 聚焦
    editor.focus();
    await delay(0.3);
    
    // 清空现有内容
    editor.innerHTML = '';
    await delay(0.2);
    
    // ========== 策略A: execCommand insertText（最接近真实输入）==========
    console.log('[DM] 策略A: execCommand insertText');
    
    // 设置 Selection 到编辑器末尾
    const sel = window.getSelection();
    sel.selectAllChildren(editor);
    sel.collapseToEnd();
    
    // 尝试插入
    const inserted = document.execCommand('insertText', false, text);
    console.log('[DM] insertText 结果:', inserted);
    
    await delay(0.3);
    let result = editor.innerText || editor.textContent || '';
    console.log('[DM] 策略A 结果:', result.substring(0, 50), '| 长度:', result.length);
    
    if (result.trim().length >= text.length * 0.8) {
      console.log('[DM] 策略A 成功!');
      return true;
    }
    
    // ========== 策略B: 手动派发完整事件序列 ==========
    console.log('[DM] 策略B: 手动派发完整事件序列');
    editor.innerHTML = '';
    editor.focus();
    await delay(0.3);
    
    // 1. 设置 Selection
    const newSel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    newSel.removeAllRanges();
    newSel.addRange(range);
    
    // 2. 逐字符模拟
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      // beforeinput 事件
      const beforeInput = new InputEvent('beforeinput', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertText',
        data: char
      });
      editor.dispatchEvent(beforeInput);
      
      // 直接操作 DOM
      const textNode = document.createTextNode(char);
      editor.appendChild(textNode);
      
      // 更新 Selection
      const curSel = window.getSelection();
      const curRange = document.createRange();
      curRange.selectNodeContents(editor);
      curRange.collapse(false);
      curSel.removeAllRanges();
      curSel.addRange(curRange);
      
      // input 事件
      const inputEvt = new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertText',
        data: char
      });
      editor.dispatchEvent(inputEvt);
      
      await delay(0.01);
    }
    
    await delay(0.3);
    result = editor.innerText || editor.textContent || '';
    console.log('[DM] 策略B 结果:', result.substring(0, 50), '| 长度:', result.length);
    
    if (result.trim().length >= text.length * 0.8) {
      console.log('[DM] 策略B 成功!');
      return true;
    }
    
    // ========== 策略C: React synthetic event ==========
    console.log('[DM] 策略C: React synthetic event');
    editor.innerHTML = '';
    editor.focus();
    await delay(0.3);
    
    // 创建完整的 React 兼容事件
    const reactEvent = {
      target: editor,
      currentTarget: editor,
      nativeEvent: new Event('change'),
      bubbles: true,
      cancelable: true,
      defaultPrevented: false,
      isDefaultPrevented: function() { return false; },
      isPropagationStopped: function() { return false; },
      isTrusted: false,
      persist: function() {},
      preventDefault: function() {},
      stopPropagation: function() {},
      timeStamp: Date.now(),
      type: 'change'
    };
    
    // 派发事件到编辑器
    const evt = new Event('change', { bubbles: true, cancelable: true });
    editor.dispatchEvent(evt);
    
    // 模拟 React 的 onChange
    const fiber = getReactFiber(editor);
    if (fiber) {
      console.log('[DM] 找到 React fiber，尝试触发');
      try {
        // React 17+ 事件委托
        const key = Object.keys(editor).find(k => k.startsWith('__reactFiber'));
        if (key) {
          const f = editor[key];
          // 尝试调用 onChange
          if (f && f.memoizedProps && f.memoizedProps.onChange) {
            f.memoizedProps.onChange(reactEvent);
            console.log('[DM] 调用 fiber.memoizedProps.onChange 成功');
          }
        }
      } catch (e) {
        console.log('[DM] React fiber 调用失败:', e.message);
      }
    }
    
    // 直接设置文本
    editor.textContent = text;
    
    // 派发 input 事件
    editor.dispatchEvent(new InputEvent('input', {
      bubbles: true, cancelable: true, inputType: 'insertFromPaste', data: text
    }));
    
    await delay(0.3);
    result = editor.innerText || editor.textContent || '';
    console.log('[DM] 策略C 结果:', result.substring(0, 50));
    
    if (result.trim().length >= text.length * 0.8) {
      console.log('[DM] 策略C 成功!');
      return true;
    }
    
    // ========== 策略D: clipboard paste ==========
    console.log('[DM] 策略D: clipboard paste');
    editor.innerHTML = '';
    editor.focus();
    await delay(0.3);
    
    try {
      // 写入剪贴板
      await navigator.clipboard.writeText(text);
      console.log('[DM] 剪贴板已写入');
    } catch (e) {
      console.log('[DM] 剪贴板写入失败:', e.message);
    }
    
    // 尝试粘贴
    try {
      document.execCommand('paste', false, null);
    } catch (e) {
      console.log('[DM] execCommand paste 失败');
    }
    
    // 手动派发 paste 事件
    editor.dispatchEvent(new ClipboardEvent('paste', {
      bubbles: true,
      cancelable: true,
      clipboardData: new DataTransfer()
    }));
    
    await delay(0.3);
    result = editor.innerText || editor.textContent || '';
    console.log('[DM] 策略D 结果:', result.substring(0, 50));
    
    if (result.trim().length >= text.length * 0.8) {
      console.log('[DM] 策略D 成功!');
      return true;
    }
    
    // ========== 策略E: 最后备选 - 直接操作 ==========
    console.log('[DM] 策略E: 最后备选');
    editor.innerHTML = '';
    await delay(0.2);
    editor.textContent = text;
    editor.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true }));
    
    await delay(0.2);
    result = editor.innerText || editor.textContent || '';
    console.log('[DM] 策略E 结果:', result);
    
    console.log('[DM] ===== contenteditable 输入结束 =====');
    return result.trim().length > 0;
  }

  // textarea/input 输入
  async function typeInInput(input, text) {
    console.log('[DM] ===== input/textarea 输入开始 =====');
    console.log('[DM] 输入框信息:', {
      tagName: input.tagName,
      type: input.type,
      className: input.className.substring(0, 80),
      placeholder: input.placeholder
    });
    
    input.focus();
    await delay(0.3);
    
    // ========== 策略A: 原生 setter ==========
    console.log('[DM] 策略A: 原生 setter');
    try {
      const nativeSetter = Object.getOwnPropertyDescriptor(
        input.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype,
        'value'
      ).set;
      nativeSetter.call(input, text);
    } catch (e) {
      input.value = text;
    }
    
    // 派发事件
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    
    await delay(0.3);
    console.log('[DM] 策略A 结果:', input.value);
    
    if (input.value.includes(text.substring(0, 10))) {
      console.log('[DM] 策略A 成功!');
      return true;
    }
    
    // ========== 策略B: 逐字符输入 ==========
    console.log('[DM] 策略B: 逐字符输入');
    input.value = '';
    input.focus();
    await delay(0.2);
    
    for (let i = 0; i < text.length; i++) {
      // 触发 keydown
      input.dispatchEvent(new KeyboardEvent('keydown', {
        bubbles: true, cancelable: true,
        key: text[i], charCode: text.charCodeAt(i), keyCode: text.charCodeAt(i)
      }));
      
      // 设置值
      input.value = text.substring(0, i + 1);
      
      // 触发 input
      input.dispatchEvent(new InputEvent('input', {
        bubbles: true, cancelable: true, inputType: 'insertText', data: text[i]
      }));
      
      await delay(0.02);
    }
    
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await delay(0.3);
    console.log('[DM] 策略B 结果:', input.value);
    
    if (input.value.includes(text.substring(0, 10))) {
      console.log('[DM] 策略B 成功!');
      return true;
    }
    
    // ========== 策略C: React fiber ==========
    console.log('[DM] 策略C: React fiber');
    const fiber = getReactFiber(input);
    if (fiber) {
      console.log('[DM] 找到 React fiber');
      try {
        // React 16/17 内部机制
        const keys = Object.keys(input).filter(k => k.startsWith('__reactFiber'));
        if (keys.length > 0) {
          const f = input[keys[0]];
          // 尝试触发内部 setter
          if (f && f.memoizedProps) {
            const originalValueSetter = Object.getOwnPropertyDescriptor(
              input.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype,
              'value'
            ).set;
            originalValueSetter.call(input, text);
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
      } catch (e) {
        console.log('[DM] React fiber 策略失败:', e.message);
      }
    }
    
    await delay(0.3);
    console.log('[DM] 策略C 结果:', input.value);
    
    console.log('[DM] ===== input/textarea 输入结束 =====');
    return input.value.includes(text.substring(0, 10));
  }

  // 统一输入入口
  async function typeMessage(text) {
    console.log('[DM] ===== typeMessage 开始 =====');
    console.log('[DM] 目标文本:', text);
    
    // 等待输入框出现
    console.log('[DM] 等待输入框...');
    await delay(2);
    
    let input = null;
    
    // 多种可能的选择器
    const selectors = [
      // contenteditable
      'div[contenteditable="true"][aria-label*="message" i]',
      'div[contenteditable="true"][aria-label*="消息" i]',
      'div[contenteditable="true"][aria-label*="send" i]',
      'div[contenteditable="true"][aria-label*="发送" i]',
      'div[contenteditable="true"][aria-label*="Type a message" i]',
      'div[contenteditable="true"][role="textbox"]',
      // textarea
      'textarea[placeholder*="message" i]',
      'textarea[placeholder*="消息" i]',
      'textarea[placeholder*="send" i]',
      // input
      'input[placeholder*="message" i]',
      'input[placeholder*="消息" i]',
      // data-e2e
      '[data-e2e="message-input-area"]',
      '[data-e2e="dm-editor"]',
      '[data-e2e="dm-new-input-editor"]',
      '[data-e2e="message-textarea"]',
      '[data-e2e*="input"][contenteditable="true"]',
    ];
    
    for (const sel of selectors) {
      const el = $(sel);
      if (el && el.offsetParent !== null) {
        input = el;
        console.log('[DM] 找到输入框:', sel);
        console.log('[DM] 元素详情:', {
          tagName: el.tagName,
          className: el.className.substring(0, 80),
          ariaLabel: el.getAttribute('aria-label'),
          role: el.getAttribute('role'),
          dataE2e: el.getAttribute('data-e2e')
        });
        break;
      }
    }
    
    if (!input) {
      console.log('[DM] 未找到输入框');
      return false;
    }
    
    await delay(0.5);
    
    // 根据类型选择策略
    if (input.isContentEditable) {
      return await typeInContentEditable(input, text);
    } else {
      return await typeInInput(input, text);
    }
  }

  // ========================================
  // 关注功能
  // ========================================
  
  async function checkFollowing() {
    await delay();
    
    const followingBtn = $('[data-e2e="following-button"]');
    if (followingBtn && followingBtn.offsetParent !== null) {
      console.log('[DM] 已关注');
      return true;
    }
    
    const followBtn = $('[data-e2e="follow-button"], [data-e2e="follow-user-button"]');
    if (followBtn && followBtn.offsetParent !== null) {
      console.log('[DM] 未关注');
      return false;
    }
    
    const buttons = $$('button');
    for (const btn of buttons) {
      const text = btn.innerText?.trim().toLowerCase();
      if (text === 'following') return true;
      if (text === 'follow') return false;
    }
    
    return false;
  }

  async function doFollow() {
    console.log('[DM] 执行关注...');
    await delay();
    
    const followBtn = $('[data-e2e="follow-button"], [data-e2e="follow-user-button"]');
    if (followBtn && click(followBtn)) {
      console.log('[DM] 点击关注按钮成功');
      await delay();
      return true;
    }
    
    const buttons = $$('button');
    for (const btn of buttons) {
      if (btn.innerText?.trim().toLowerCase() === 'follow' && btn.offsetParent !== null) {
        if (click(btn)) {
          console.log('[DM] 按文字点击关注成功');
          await delay();
          return true;
        }
      }
    }
    
    console.log('[DM] 未找到关注按钮');
    return false;
  }

  // ========================================
  // 消息按钮
  // ========================================
  
  async function clickMessage() {
    console.log('[DM] 查找消息按钮...');
    await delay();
    
    const selectors = [
      '[data-e2e="contact-msg-btn"]',
      '[data-e2e="message-button"]',
      '[aria-label*="message" i]',
      '[aria-label*="消息" i]',
      'a[href*="/message/"]',
    ];
    
    for (const sel of selectors) {
      const el = $(sel);
      if (el && click(el)) {
        console.log('[DM] 点击消息按钮:', sel);
        await delay();
        return true;
      }
    }
    
    const links = $$('a');
    for (const a of links) {
      const text = a.innerText?.trim().toLowerCase();
      if (text === 'message' || text === '发消息') {
        if (click(a)) {
          console.log('[DM] 按文字点击消息按钮');
          await delay();
          return true;
        }
      }
    }
    
    console.log('[DM] 未找到消息按钮');
    return false;
  }

  async function waitForMessageDialog() {
    console.log('[DM] 等待私信对话框...');
    
    for (let i = 0; i < 20; i++) {
      await delay(0.5);
      
      const indicators = [
        '[data-e2e="message-input-area"]',
        '[data-e2e="dm-editor"]',
        '[data-e2e*="input-editor"]',
        'div[contenteditable="true"][role="textbox"]',
        'textarea[placeholder*="message" i]',
        '[class*="message-editor"]',
        '[class*="dm-editor"]',
      ];
      
      for (const sel of indicators) {
        const el = $(sel);
        if (el && el.offsetParent !== null) {
          console.log('[DM] 私信对话框已出现:', sel);
          return true;
        }
      }
    }
    
    console.log('[DM] 私信对话框未出现');
    return false;
  }

  // ========================================
  // 发送按钮
  // ========================================
  
  async function findSendButton() {
    console.log('[DM] 查找发送按钮...');
    
    // 先等一下
    await delay(1);
    
    const selectors = [
      // data-e2e
      '[data-e2e="dm-new-send-btn"]',
      '[data-e2e="send-message-button"]',
      '[data-e2e="dm-send-btn"]',
      '[data-e2e="message-send-btn"]',
      // 文字
      'button',
      'div[role="button"]',
    ];
    
    for (const sel of selectors) {
      const els = sel === 'button' || sel === 'div[role="button"]' ? $$(sel) : [$(sel)];
      
      for (const el of els) {
        if (!el || el.offsetParent === null) continue;
        
        const text = el.innerText?.trim().toLowerCase() || '';
        const ariaLabel = el.getAttribute('aria-label')?.toLowerCase() || '';
        const dataE2e = el.getAttribute('data-e2e') || '';
        
        // 匹配发送按钮
        if (text === 'send' || text === '发送' || text === 'send message' ||
            ariaLabel.includes('send') || ariaLabel.includes('发送') ||
            dataE2e.includes('send')) {
          console.log('[DM] 找到发送按钮:', { text, ariaLabel, dataE2e });
          return el;
        }
        
        // 粉色图标（Tiktok 品牌色）
        const svg = el.querySelector?.('svg');
        if (svg) {
          const fill = svg.getAttribute('fill') || '';
          if (fill.includes('FE2C55') || fill.includes('fe2c55')) {
            console.log('[DM] 找到粉色发送按钮');
            return el;
          }
        }
      }
    }
    
    console.log('[DM] 未找到发送按钮');
    return null;
  }

  async function clickSend() {
    console.log('[DM] 点击发送按钮...');
    
    const sendBtn = await findSendButton();
    if (!sendBtn) {
      console.log('[DM] 未找到发送按钮');
      return false;
    }
    
    sendBtn.focus();
    await delay(0.2);
    
    if (click(sendBtn)) {
      console.log('[DM] 点击发送成功');
      await delay(1);
      return true;
    }
    
    sendBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    console.log('[DM] dispatchEvent 点击发送');
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
      // 检查并关注
      console.log('[DM] 步骤1: 检查关注状态');
      const isFollowing = await checkFollowing();
      
      if (!isFollowing) {
        console.log('[DM] 步骤2: 执行关注');
        await doFollow();
      } else {
        console.log('[DM] 步骤2: 已关注，跳过');
      }

      // 点击消息按钮
      console.log('[DM] 步骤3: 点击消息按钮');
      const msgClicked = await clickMessage();
      if (!msgClicked) {
        return { success: false, error: '消息按钮未找到', step: '消息按钮' };
      }

      // 等待对话框
      console.log('[DM] 步骤4: 等待私信对话框');
      const dialogAppeared = await waitForMessageDialog();
      if (!dialogAppeared) {
        return { success: false, error: '私信对话框未出现', step: '等待对话框' };
      }

      // 输入消息
      console.log('[DM] 步骤5: 输入私信内容');
      const typed = await typeMessage(message);
      if (!typed) {
        return { success: false, error: '输入框输入失败', step: '输入框' };
      }

      // 发送
      console.log('[DM] 步骤6: 点击发送');
      await clickSend();

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
      return true;
    }
    else if (req.action === 'debug') {
      // 调试：收集页面信息
      const info = {
        username: getUsername(),
        url: window.location.href,
        path: window.location.pathname,
        inputs: [],
        buttons: [],
      };
      
      // 收集输入框
      $$('div[contenteditable="true"]').forEach(el => {
        info.inputs.push({
          class: el.className.substring(0, 80),
          ariaLabel: el.getAttribute('aria-label'),
          dataE2e: el.getAttribute('data-e2e')
        });
      });
      
      $$('textarea, input').forEach(el => {
        info.inputs.push({
          tagName: el.tagName,
          placeholder: el.placeholder,
          dataE2e: el.getAttribute('data-e2e')
        });
      });
      
      // 收集按钮
      $$('button').forEach(el => {
        if (el.offsetParent !== null) {
          info.buttons.push({
            text: el.innerText?.trim().substring(0, 30),
            ariaLabel: el.getAttribute('aria-label'),
            dataE2e: el.getAttribute('data-e2e')
          });
        }
      });
      
      res(info);
    }
  });

  console.log('[DM] TikTok DM 插件已加载 (Codex 完整修复版), 用户:', getUsername());
})();
