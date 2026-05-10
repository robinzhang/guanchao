// popup.js - 处理弹窗逻辑
document.addEventListener('DOMContentLoaded', function() {
  const sendBtn = document.getElementById('sendBtn');
  const testBtn = document.getElementById('testBtn');
  const messageInput = document.getElementById('message');
  const statusDiv = document.getElementById('status');
  const stepDiv = document.getElementById('step');

  // 状态更新
  function setStatus(msg, type) {
    statusDiv.textContent = msg;
    statusDiv.className = 'status ' + type;
  }

  function setStep(msg) {
    stepDiv.textContent = msg;
  }

  // 测试连接
  testBtn.addEventListener('click', function() {
    setStatus('正在检测 TikTok 页面...', 'info');
    setStep('');

    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (!tabs[0] || !tabs[0].url.includes('tiktok.com')) {
        setStatus('请先打开 TikTok 达人主页', 'error');
        return;
      }

      // 发送测试消息给 content script
      chrome.tabs.sendMessage(tabs[0].id, { action: 'test' }, function(response) {
        if (chrome.runtime.lastError) {
          setStatus('TikTok 页面未响应，请刷新页面', 'error');
        } else if (response && response.success) {
          setStatus('✅ 已连接到 TikTok 页面', 'success');
          setStep('当前页面: ' + response.username);
        } else {
          setStatus('连接失败，请确保在达人主页', 'error');
        }
      });
    });
  });

  // 发送私信
  sendBtn.addEventListener('click', function() {
    const message = messageInput.value.trim();
    
    if (!message) {
      setStatus('请输入私信内容', 'error');
      return;
    }

    setStatus('正在发送...', 'info');
    setStep('正在查找消息按钮...');
    sendBtn.disabled = true;

    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (!tabs[0] || !tabs[0].url.includes('tiktok.com')) {
        setStatus('请先打开 TikTok 达人主页', 'error');
        sendBtn.disabled = false;
        return;
      }

      // 发送私信指令给 content script
      chrome.tabs.sendMessage(tabs[0].id, { 
        action: 'sendDM',
        message: message
      }, function(response) {
        sendBtn.disabled = false;
        
        if (chrome.runtime.lastError) {
          setStatus('TikTok 页面未响应，请刷新页面后重试', 'error');
          setStep('');
          return;
        }

        if (response && response.success) {
          setStatus('✅ 私信发送成功！', 'success');
          setStep('已发送给: @' + response.username);
          messageInput.value = '';
        } else if (response && response.error) {
          setStatus('❌ ' + response.error, 'error');
          setStep(response.step || '');
        } else {
          setStatus('发送失败，请重试', 'error');
          setStep('');
        }
      });
    });
  });

  // 自动检测当前页面状态
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (tabs[0] && tabs[0].url && tabs[0].url.includes('tiktok.com')) {
      setStep('检测到 TikTok 页面');
    } else {
      setStep('请打开 TikTok 达人主页');
    }
  });
});
