// content.js - TikTok 私信发送插件
(function() {
  'use strict';

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

  // 查找单个元素
  function $(selector) {
    if (!selector) return null;
    if (selector.startsWith('//')) {
      const result = document.evaluate(selector, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      return result.singleNodeValue;
    }
    return document.querySelector(selector);
  }

  // 查找所有匹配元素
  function $$(selector) {
    if (selector.startsWith('//')) {
      const result = document.evaluate(selector, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      const items = [];
      for (let i = 0; i < result.snapshotLength; i++) {
        items.push(result.snapshotItem(i));
      }
      return items;
    }
    return Array.from(document.querySelectorAll(selector));
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
  // 关注功能
  // ========================================
  
  // 检查是否已关注
  async function checkFollowing() {
    await delay(6);
    
    // 方法1: 检查已关注按钮
    const followingBtn = $('[data-e2e="following-button"]');
    if (followingBtn && followingBtn.offsetParent !== null) {
      console.log('[DM] 已关注');
      return true;
    }
    
    // 方法2: 检查关注按钮是否存在
    const followBtn = $('[data-e2e="follow-button"], [data-e2e="follow-user-button"]');
    if (followBtn && followBtn.offsetParent !== null) {
      console.log('[DM] 未关注，需要关注');
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
    await delay(6);
    
    // 方法1: data-e2e 选择器
    const followBtn = $('[data-e2e="follow-button"], [data-e2e="follow-user-button"]');
    if (followBtn && click(followBtn)) {
      console.log('[DM] 点击关注按钮成功');
      await delay(6);
      return true;
    }
    
    // 方法2: 按文字找按钮
    const buttons = $$('button');
    for (const btn of buttons) {
      if (btn.innerText?.trim().toLowerCase() === 'follow' && btn.offsetParent !== null) {
        if (click(btn)) {
          console.log('[DM] 按文字点击关注成功');
          await delay(6);
          return true;
        }
      }
    }
    
    console.log('[DM] 未找到关注按钮');
    return false;
  }

  // ========================================
  // 私信功能
  // ========================================
  
  // 点击消息按钮
  async function clickMessage() {
    console.log('[DM] 查找消息按钮...');
    await delay(6);
    
    // 方法1: data-e2e 选择器
    const msgBtn = $('[data-e2e="contact-msg-btn"], [data-e2e="message-button"]');
    if (msgBtn && click(msgBtn)) {
      console.log('[DM] 点击消息按钮成功');
      await delay(6);
      return true;
    }
    
    // 方法2: 按文字找
    const links = $$('a');
    for (const a of links) {
      const text = a.innerText?.trim().toLowerCase();
      if (text === 'message' || text === '发消息') {
        if (click(a)) {
          console.log('[DM] 按文字点击消息按钮成功');
          await delay(6);
          return true;
        }
      }
    }
    
    // 方法3: 找 message 相关的 href
    const msgLinks = $$('a[href*="/message/"]');
    if (msgLinks.length > 0 && click(msgLinks[0])) {
      console.log('[DM] 点击 message 链接成功');
      await delay(6);
      return true;
    }
    
    console.log('[DM] 未找到消息按钮');
    return false;
  }

  // 等待私信对话框出现
  async function waitForMessageDialog() {
    console.log('[DM] 等待私信对话框...');
    await delay(6);
    
    for (let i = 0; i < 10; i++) {
      await delay(1);
      
      // 检查是否有输入框出现
      const inputArea = $('[data-e2e="message-input-area"]');
      if (inputArea) {
        console.log('[DM] 私信对话框已出现');
        return true;
      }
      
      // 检查是否有 dm 相关的 input
      const dmEditor = $('[data-e2e="dm-new-input-editor"]');
      if (dmEditor) {
        console.log('[DM] DM编辑器已出现');
        return true;
      }
    }
    
    console.log('[DM] 私信对话框未出现');
    return false;
  }

  // 找到私信输入框
  async function findInput() {
    console.log('[DM] 查找输入框...');
    await delay(6);
    
    // 方法1: message-input-area
    const inputArea = $('[data-e2e="message-input-area"]');
    if (inputArea) {
      console.log('[DM] 找到 message-input-area');
      return inputArea;
    }
    
    // 方法2: dm-new-input-editor
    const dmEditor = $('[data-e2e="dm-new-input-editor"]');
    if (dmEditor) {
      console.log('[DM] 找到 dm-new-input-editor');
      return dmEditor;
    }
    
    // 方法3: contenteditable
    const contenteditable = $('div[contenteditable="true"][aria-label="发送消息..."]');
    if (contenteditable) {
      console.log('[DM] 找到 contenteditable 输入框');
      return contenteditable;
    }
    
    // 方法4: DraftEditor
    const draftEditor = $('.public-DraftEditor-content');
    if (draftEditor) {
      console.log('[DM] 找到 DraftEditor');
      return draftEditor;
    }
    
    console.log('[DM] 未找到输入框');
    return null;
  }

  // 输入文字到私信框 - 直接 DOM 操作
  async function typeMessage(text) {
    console.log('[DM] 输入私信:', text);
    await delay(6); // 5-10秒等待
    
    // 找到整个输入区域
    const inputArea = $('div[data-e2e="message-input-area"]');
    if (!inputArea) {
      console.log('[DM] 未找到 message-input-area');
      return false;
    }
    
    // 聚焦到输入区域
    const contenteditable = $('div[contenteditable="true"][aria-label="发送消息..."]', inputArea);
    if (contenteditable) {
      contenteditable.focus();
      console.log('[DM] 已聚焦到 contenteditable');
    }
    
    await delay(1);
    
    // 找到 br[data-text="true"] 并替换为 span
    const br = $('br[data-text="true"]', inputArea);
    if (br) {
      console.log('[DM] 找到 br[data-text], 准备替换');
      
      // 创建 span 元素
      const span = document.createElement('span');
      span.setAttribute('data-text', 'true');
      span.textContent = text;
      
      // 替换 br
      br.parentNode.replaceChild(span, br);
      console.log('[DM] 已替换 br 为 span');
      
      // 触发必要的事件
      span.dispatchEvent(new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertText',
        data: text
      }));
      
      // 触发 compositionend
      span.dispatchEvent(new CompositionEvent('compositionend', {
        bubbles: true,
        cancelable: true,
        data: text
      }));
      
      // 触发 keydown/keyup Enter
      span.dispatchEvent(new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key: 'Enter',
        keyCode: 13
      }));
      
      await delay(1);
      
      console.log('[DM] 输入完成，当前内容:', span.textContent);
      return true;
    } else {
      console.log('[DM] 未找到 br[data-text], 尝试其他方式');
      
      // 尝试直接在 innerHTML 里操作
      const contents = $('[data-contents="true"]', inputArea);
      if (contents) {
        console.log('[DM] 找到 data-contents, 替换内容');
        contents.innerHTML = `<div data-block="true" data-editor="xxx"><div class="public-DraftStyleDefault-block"><span data-text="true">${text}</span></div></div>`;
        
        const newSpan = $('span[data-text="true"]', inputArea);
        if (newSpan) {
          newSpan.dispatchEvent(new InputEvent('input', {
            bubbles: true,
            cancelable: true
          }));
        }
        return true;
      }
    }
    
    return false;
  }

  // 找到发送按钮
  async function findSendButton() {
    console.log('[DM] 查找发送按钮...');
    
    // 方法1: data-e2e 选择器（用户提供的）
    const sendBtn = $('[data-e2e="dm-new-send-btn"]');
    if (sendBtn && sendBtn.offsetParent !== null) {
      console.log('[DM] 找到发送按钮 dm-new-send-btn');
      return sendBtn;
    }
    
    // 方法2: 其他 data-e2e
    const sendBtn2 = $('[data-e2e="send-message-button"]');
    if (sendBtn2 && sendBtn2.offsetParent !== null) {
      console.log('[DM] 找到发送按钮 send-message-button');
      return sendBtn2;
    }
    
    // 方法3: submit 类型
    const submitBtn = $('button[type="submit"]');
    if (submitBtn && submitBtn.offsetParent !== null) {
      console.log('[DM] 找到 submit 按钮');
      return submitBtn;
    }
    
    // 方法4: 按文字找
    const buttons = $$('button');
    for (const btn of buttons) {
      const text = btn.innerText?.trim().toLowerCase();
      if ((text === 'send' || text === '发送') && btn.offsetParent !== null) {
        console.log('[DM] 按文字找到发送按钮:', text);
        return btn;
      }
    }
    
    // 方法5: 找消息区域内的按钮
    const inputArea = $('[data-e2e="message-input-area"]');
    if (inputArea) {
      const areaBtns = inputArea.querySelectorAll('button, [role="button"]');
      for (const btn of areaBtns) {
        if (btn.offsetParent !== null) {
          const svg = btn.querySelector('svg');
          if (svg) {
            console.log('[DM] 找到输入区域内的 SVG 按钮');
            return btn;
          }
        }
      }
    }
    
    // 方法6: 找所有可见按钮
    for (const btn of buttons) {
      const svg = btn.querySelector('svg');
      if (svg && btn.offsetParent !== null) {
        const fill = svg.getAttribute('fill');
        if (fill && fill.includes('#FE2C55')) {
          console.log('[DM] 找到粉红色 SVG 按钮（发送按钮）');
          return btn;
        }
      }
    }
    
    console.log('[DM] 未找到发送按钮');
    return null;
  }

  // 点击发送按钮
  async function clickSend() {
    console.log('[DM] 点击发送按钮...');
    await delay(6);
    
    const sendBtn = await findSendButton();
    if (!sendBtn) {
      console.log('[DM] 未找到发送按钮');
      return false;
    }
    
    if (click(sendBtn)) {
      console.log('[DM] 点击发送按钮成功');
      await delay(1);
      return true;
    }
    
    // 备选：dispatchEvent
    sendBtn.dispatchEvent(new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    }));
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
    
    if (!username) {
      return { success: false, error: '无法获取用户名，请在达人主页使用' };
    }

    try {
      // 步骤1: 检查并关注
      console.log('[DM] 步骤1: 检查关注状态');
      const isFollowing = await checkFollowing();
      
      if (!isFollowing) {
        console.log('[DM] 步骤2: 执行关注');
        await doFollow();
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
      const inputFound = await findInput();
      if (!inputFound) {
        return { success: false, error: '未找到输入框', step: '输入框' };
      }
      await typeMessage(message);

      // 步骤6: 点击发送
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
      return true; // 异步响应
    }
  });

  console.log('[DM] TikTok DM 插件已加载, 用户:', getUsername());
})();
