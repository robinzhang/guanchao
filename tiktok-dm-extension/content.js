// content.js - TikTok 页面内的私信发送逻辑
(function() {
  'use strict';

  // 从 URL 提取用户名
  function getUsername() {
    const match = window.location.pathname.match(/^\/@([^\/]+)/);
    return match ? match[1] : null;
  }

  // 等待元素出现
  function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver(() => {
        const el = document.querySelector(selector);
        if (el) {
          observer.disconnect();
          resolve(el);
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error('Element not found: ' + selector));
      }, timeout);
    });
  }

  // 随机延迟
  function randomDelay(min, max) {
    const delay = Math.random() * (max - min) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  // 查找"消息"按钮
  async function findMessageButton() {
    // TikTok 的消息按钮可能有多种选择器
    const selectors = [
      // 主要选择器
      '[data-e2e="contact-msg-btn"]',
      '[data-e2e="message-button"]',
      // 备选选择器
      'a[href*="message"]',
      'div[class*="message"]',
      // 图标选择器（消息图标）
      'svg[class*="message"] + *',
      // 文字选择器
      'span:has-text("消息")',
      'div:has-text("发消息")',
      // 关注按钮旁边的消息按钮
      '[data-e2e="follow-user-button"] + *',
      // 更通用的
      'a[href*="/message/"]',
      'button[class*="Message"]'
    ];

    for (const selector of selectors) {
      try {
        const element = document.querySelector((selector.includes(':has-text')) ? selector : selector);
        if (element) {
          console.log('Found message button with selector:', selector);
          return element;
        }
      } catch (e) {
        // 某些选择器可能无效
      }
    }

    // 尝试 XPath 查找包含"消息"文字的元素
    const textSelectors = [
      '//span[contains(text(), "消息")]',
      '//div[contains(text(), "发消息")]',
      '//a[contains(text(), "消息")]',
      '//button[contains(text(), "消息")]'
    ];

    for (const xpath of textSelectors) {
      const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      if (result.singleNodeValue) {
        console.log('Found message button via XPath:', xpath);
        return result.singleNodeValue;
      }
    }

    return null;
  }

  // 查找私信输入框
  async function findMessageInput() {
    const selectors = [
      'div[contenteditable="true"][data-lexical-editor="true"]',
      'div[contenteditable="true"]',
      'textarea[id*="message"]',
      'input[id*="message"]',
      'div[class*="msg-input"]',
      'div[class*="message-input"]',
      'div[class*="ComposerInput"]'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        console.log('Found message input with selector:', selector);
        return element;
      }
    }
    return null;
  }

  // 查找发送按钮
  async function findSendButton() {
    const selectors = [
      'button[type="submit"]',
      'button[class*="send"]',
      'button[class*="Send"]',
      'div[role="button"][class*="send"]',
      'span:has-text("发送")',
      'button:has-text("发送")'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.offsetParent !== null) { // 确保可见
        console.log('Found send button with selector:', selector);
        return element;
      }
    }

    // XPath 方式
    const xpaths = [
      '//button[contains(text(), "发送")]',
      '//span[contains(text(), "发送")]',
      '//div[contains(text(), "发送")]'
    ];

    for (const xpath of xpaths) {
      const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      if (result.singleNodeValue && result.singleNodeValue.offsetParent !== null) {
        return result.singleNodeValue;
      }
    }

    return null;
  }

  // 主发送流程
  async function sendDirectMessage(message) {
    const username = getUsername();
    if (!username) {
      return { success: false, error: '无法获取用户名，请在达人主页使用' };
    }

    try {
      // 步骤1：查找并点击消息按钮
      console.log('Step 1: 查找消息按钮...');
      const msgButton = await findMessageButton();
      if (!msgButton) {
        return { success: false, error: '未找到消息按钮，请确认在达人主页', step: '1/4: 查找消息按钮' };
      }

      await randomDelay(0.5, 1.5);
      msgButton.click();
      console.log('已点击消息按钮');

      // 步骤2：等待消息对话框出现
      console.log('Step 2: 等待消息对话框...');
      await randomDelay(1, 2);
      
      // 等待输入框出现
      let inputField = null;
      for (let i = 0; i < 10; i++) {
        inputField = await findMessageInput();
        if (inputField) break;
        await randomDelay(0.5, 1);
      }

      if (!inputField) {
        return { success: false, error: '未找到私信输入框', step: '2/4: 等待输入框' };
      }
      console.log('已找到输入框');

      // 步骤3：输入私信内容
      console.log('Step 3: 输入私信内容...');
      await randomDelay(0.3, 0.8);
      
      // 清空输入框
      inputField.focus();
      document.execCommand('selectAll', false, null);
      document.execCommand('delete', false, null);
      
      // 逐字输入，模拟真人
      await randomDelay(0.2, 0.5);
      inputField.focus();
      
      // 使用 execCommand 输入文字
      document.execCommand('insertText', false, message);
      
      // 备选方案：如果上面的不行，尝试直接设置 innerText
      if (inputField.innerText === '' || inputField.innerText === undefined) {
        inputField.innerText = message;
        // 触发 input 事件
        inputField.dispatchEvent(new InputEvent('input', {
          bubbles: true,
          cancelable: true,
          inputType: 'insertText',
          data: message
        }));
      }

      await randomDelay(0.5, 1);
      console.log('已输入私信内容:', message.substring(0, 20) + '...');

      // 步骤4：查找并点击发送按钮
      console.log('Step 4: 查找发送按钮...');
      await randomDelay(0.5, 1);
      
      const sendBtn = await findSendButton();
      if (sendBtn) {
        sendBtn.click();
        console.log('已点击发送按钮');
      } else {
        // 备选：尝试按 Enter 键发送
        const enterEvent = new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          keyCode: 13,
          which: 13,
          bubbles: true
        });
        inputField.dispatchEvent(enterEvent);
        console.log('已发送 Enter 键');
      }

      await randomDelay(1, 2);

      return { success: true, username: username };

    } catch (error) {
      console.error('发送失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 监听来自 popup 的消息
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log('收到消息:', request.action);

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

  console.log('TikTok DM Extension loaded, username:', getUsername());
})();
