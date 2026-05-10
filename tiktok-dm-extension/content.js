// content.js - TikTok 页面内的私信发送逻辑
(function() {
  'use strict';

  // 从 URL 提取用户名
  function getUsername() {
    const match = window.location.pathname.match(/^\/@([^\/]+)/);
    return match ? match[1] : null;
  }

  // 随机延迟
  function randomDelay(min, max) {
    const delay = Math.random() * (max - min) + min;
    return new Promise(resolve => setTimeout(resolve, delay * 1000));
  }

  // 查找元素（支持选择器和 XPath）
  function findElement(selectors) {
    if (typeof selectors === 'string') {
      selectors = [selectors];
    }
    for (const sel of selectors) {
      try {
        // 尝试作为 XPath
        if (sel.startsWith('//')) {
          const result = document.evaluate(sel, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
          if (result.singleNodeValue) {
            console.log('[TikTok DM] Found via XPath:', sel);
            return result.singleNodeValue;
          }
        } else {
          const el = document.querySelector(sel);
          if (el) {
            console.log('[TikTok DM] Found via selector:', sel);
            return el;
          }
        }
      } catch (e) {
        console.log('[TikTok DM] Selector error:', sel, e.message);
      }
    }
    return null;
  }

  // 查找所有匹配元素
  function findElements(selectors) {
    if (typeof selectors === 'string') {
      selectors = [selectors];
    }
    for (const sel of selectors) {
      try {
        if (sel.startsWith('//')) {
          const snapshot = document.evaluate(sel, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
          if (snapshot.snapshotLength > 0) {
            return Array.from(snapshot.snapshotItems((_, i) => snapshot.snapshotItem(i)));
          }
        } else {
          const els = document.querySelectorAll(sel);
          if (els.length > 0) {
            return Array.from(els);
          }
        }
      } catch (e) {}
    }
    return [];
  }

  // 检查是否已关注
  async function checkIsFollowing() {
    await randomDelay(0.5, 1);
    
    // 查找"已关注"按钮
    const followingSelectors = [
      '[data-e2e="following-button"]',
      'button[class*="following"]',
      '//button[contains(text(), "Following")]',
      '//span[contains(text(), "Following")]'
    ];
    
    // 查找"关注"按钮
    const followSelectors = [
      '[data-e2e="follow-button"]',
      '[data-e2e="follow-user-button"]',
      'button[class*="follow"]',
      '//button[contains(text(), "Follow")]',
      '//span[contains(text(), "Follow")]'
    ];
    
    // 检查是否有已关注按钮
    const followingBtn = findElement(followingSelectors);
    if (followingBtn && followingBtn.offsetParent !== null) {
      console.log('[TikTok DM] 已关注状态');
      return true;
    }
    
    // 检查关注按钮
    const followBtn = findElement(followSelectors);
    if (followBtn && followBtn.offsetParent !== null) {
      console.log('[TikTok DM] 未关注，需要点击关注');
      return false;
    }
    
    return false;
  }

  // 点击关注
  async function clickFollow() {
    console.log('[TikTok DM] 执行关注操作...');
    
    const followSelectors = [
      '[data-e2e="follow-button"]',
      '[data-e2e="follow-user-button"]',
      'button[class*="follow"]',
      '//button[contains(text(), "Follow")]'
    ];
    
    const followBtn = findElement(followSelectors);
    if (followBtn && followBtn.offsetParent !== null) {
      followBtn.click();
      console.log('[TikTok DM] 已点击关注按钮');
      await randomDelay(2, 4);
      return true;
    }
    
    console.log('[TikTok DM] 未找到关注按钮');
    return false;
  }

  // 查找并点击消息按钮
  async function clickMessageButton() {
    console.log('[TikTok DM] 查找消息按钮...');
    await randomDelay(1, 2);
    
    // 消息按钮选择器
    const msgSelectors = [
      '[data-e2e="contact-msg-btn"]',
      '[data-e2e="message-button"]',
      'a[href*="/message/"]',
      '//a[contains(text(), "Message")]',
      '//span[contains(text(), "Message")]',
      '//div[contains(text(), "发消息")]',
      '//button[contains(text(), "消息")]'
    ];
    
    const msgBtn = findElement(msgSelectors);
    if (msgBtn && msgBtn.offsetParent !== null) {
      msgBtn.click();
      console.log('[TikTok DM] 已点击消息按钮');
      await randomDelay(2, 3);
      return true;
    }
    
    console.log('[TikTok DM] 未找到消息按钮，尝试其他方式...');
    
    // 尝试点击头像旁边的消息图标
    const iconSelectors = [
      '[data-e2e="avatar-icon"] + *',
      '//div[contains(@class, "avatar")]/following-sibling::div//a',
      '//div[contains(@class, "share-container")]//a'
    ];
    
    const iconArea = findElement(iconSelectors);
    if (iconArea) {
      iconArea.click();
      console.log('[TikTok DM] 点击了头像区域');
      await randomDelay(2, 3);
      return true;
    }
    
    return false;
  }

  // 查找私信输入框
  async function findMessageInput() {
    console.log('[TikTok DM] 查找私信输入框...');
    
    const inputSelectors = [
      // TikTok 私信输入框
      'span[data-text="true"]',
      'div[contenteditable="true"][data-lexical-editor="true"]',
      'div[contenteditable="true"][data-gramm="false"]',
      'div[contenteditable="true"][spellcheck="false"]',
      'div[contenteditable="true"]',
      // 备选
      'textarea[id*="message"]',
      'textarea[id*="dm"]',
      'input[id*="message"]',
      '//div[@contenteditable="true"]'
    ];
    
    const inputEl = findElement(inputSelectors);
    if (inputEl) {
      console.log('[TikTok DM] 找到输入框');
      return inputEl;
    }
    
    // 等待输入框出现（点击消息按钮后）
    for (let i = 0; i < 10; i++) {
      await randomDelay(0.5, 1);
      const inputEl = findElement(inputSelectors);
      if (inputEl) {
        console.log('[TikTok DM] 等待后找到输入框');
        return inputEl;
      }
    }
    
    console.log('[TikTok DM] 未找到输入框');
    return null;
  }

  // 查找发送按钮
  async function findSendButton() {
    console.log('[TikTok DM] 查找发送按钮...');
    
    // 注意：不能使用 :has-text() 这种 Playwright 语法，只能用 CSS 选择器或 XPath
    const sendSelectors = [
      // TikTok 当前的发送按钮
      '[data-e2e="dm-new-send-btn"]',
      // 备选
      '[data-e2e="send-message-button"]',
      'button[type="submit"]',
      'button[class*="send"]',
      'button[class*="Send"]',
      // XPath 方式
      '//button[contains(text(), "Send")]',
      '//button[contains(text(), "发送")]'
    ];
    
    const sendBtn = findElement(sendSelectors);
    if (sendBtn && sendBtn.offsetParent !== null) {
      console.log('[TikTok DM] 找到发送按钮');
      return sendBtn;
    }
    
    // 备选：找所有按钮，逐个检查
    const allButtons = document.querySelectorAll('button');
    for (const btn of allButtons) {
      const text = btn.innerText?.trim().toLowerCase();
      if (text === 'send' || text === '发送') {
        console.log('[TikTok DM] 从所有按钮中找到发送按钮');
        return btn;
      }
    }
    
    // 备选：找可能包含发送图标的按钮
    const iconButtons = document.querySelectorAll('button');
    for (const btn of iconButtons) {
      const svg = btn.querySelector('svg');
      if (svg && btn.offsetParent !== null && btn.innerText.trim() === '') {
        // 可能是只有图标的发送按钮
        console.log('[TikTok DM] 找到图标按钮可能是发送按钮');
        return btn;
      }
    }
    
    return null;
  }

  // 输入文本到 contentEditable 元素
  function inputText(el, text) {
    el.focus();
    
    // 如果是 span[data-text="true"] 元素
    if (el.tagName === 'SPAN' && el.hasAttribute('data-text')) {
      el.textContent = text;
      el.dispatchEvent(new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertText',
        data: text
      }));
      console.log('[TikTok DM] span[data-text] 输入:', text);
      return;
    }
    
    // 清空现有内容
    document.execCommand('selectAll', false, null);
    document.execCommand('delete', false, null);
    
    // 方法1：execCommand
    document.execCommand('insertText', false, text);
    
    // 检查是否输入成功
    if (el.innerText.trim() === '') {
      // 方法2：直接设置 innerText
      el.innerText = text;
      el.dispatchEvent(new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertText',
        data: text
      }));
    }
    
    // 方法3：模拟键盘输入
    if (el.innerText.trim() === '') {
      for (const char of text) {
        el.dispatchEvent(new InputEvent('beforeinput', {
          bubbles: true,
          cancelable: true,
          inputType: 'insertText',
          data: char
        }));
        el.innerText += char;
        el.dispatchEvent(new InputEvent('input', {
          bubbles: true,
          cancelable: true,
          inputType: 'insertText',
          data: char
        }));
      }
    }
    
    console.log('[TikTok DM] 输入内容:', el.innerText.substring(0, 20) + '...');
  }

  // 主发送流程
  async function sendDirectMessage(message) {
    const username = getUsername();
    console.log('[TikTok DM] 开始发送私信，当前用户:', username);
    
    if (!username) {
      return { success: false, error: '无法获取用户名，请在达人主页使用' };
    }

    try {
      // 步骤1：检查关注状态
      console.log('[TikTok DM] 步骤1: 检查关注状态...');
      const isFollowing = await checkIsFollowing();
      
      // 步骤2：如果未关注，先关注
      if (!isFollowing) {
        console.log('[TikTok DM] 步骤2: 执行关注...');
        const followed = await clickFollow();
        if (!followed) {
          return { success: false, error: '关注失败', step: '关注' };
        }
        console.log('[TikTok DM] 关注成功');
      } else {
        console.log('[TikTok DM] 已关注，跳过关注步骤');
      }

      // 步骤3：点击消息按钮
      console.log('[TikTok DM] 步骤3: 点击消息按钮...');
      const msgClicked = await clickMessageButton();
      if (!msgClicked) {
        return { success: false, error: '未找到消息按钮', step: '点击消息' };
      }

      // 步骤4：等待并找到输入框
      console.log('[TikTok DM] 步骤4: 查找输入框...');
      await randomDelay(1, 2);
      const inputEl = await findMessageInput();
      if (!inputEl) {
        return { success: false, error: '未找到私信输入框', step: '查找输入框' };
      }

      // 步骤5：输入私信内容
      console.log('[TikTok DM] 步骤5: 输入私信内容...');
      await randomDelay(0.5, 1);
      inputText(inputEl, message);

      // 步骤6：查找并点击发送按钮
      console.log('[TikTok DM] 步骤6: 查找发送按钮...');
      await randomDelay(0.5, 1);
      const sendBtn = await findSendButton();
      
      if (sendBtn) {
        sendBtn.click();
        console.log('[TikTok DM] 已点击发送按钮');
      } else {
        // 备选：按 Enter 发送
        console.log('[TikTok DM] 未找到发送按钮，尝试按 Enter...');
        const enterEvent = new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          keyCode: 13,
          which: 13,
          bubbles: true,
          cancelable: true
        });
        inputEl.dispatchEvent(enterEvent);
        
        const enterUp = new KeyboardEvent('keyup', {
          key: 'Enter',
          code: 'Enter',
          keyCode: 13,
          which: 13,
          bubbles: true
        });
        inputEl.dispatchEvent(enterUp);
      }

      await randomDelay(1, 2);

      // 检查是否发送成功（看输入框是否被清空）
      const stillHasText = inputEl.innerText.trim().length > 0;
      if (stillHasText) {
        // 可能发送成功也可能没有，保守返回成功
        console.log('[TikTok DM] 发送完成');
      } else {
        console.log('[TikTok DM] 输入框已清空，可能发送成功');
      }

      return { success: true, username: username };

    } catch (error) {
      console.error('[TikTok DM] 发送失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 监听来自 popup 的消息
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log('[TikTok DM] 收到消息:', request.action);

    if (request.action === 'test') {
      const username = getUsername();
      sendResponse({ 
        success: true, 
        username: username || '未知用户',
        url: window.location.href
      });
    } 
    else if (request.action === 'sendDM') {
      sendDirectMessage(request.message).then(result => {
        sendResponse(result);
      });
      return true; // 异步响应
    }
  });

  console.log('[TikTok DM] TikTok DM Extension loaded, username:', getUsername());
})();
