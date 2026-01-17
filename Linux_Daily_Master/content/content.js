// content/content.js - 修复版本
console.log('=== Linux学习插件内容脚本加载 ===');

// 等待页面加载
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM加载完成，初始化插件');
  initPlugin();
});

// 或者如果DOM已经加载完成
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  console.log('DOM已就绪，立即初始化');
  initPlugin();
}

async function initPlugin() {
  console.log('开始初始化插件...');
  
  try {
    // 检查是否是新标签页
    const isNewTab = window.location.href.includes('chrome://newtab/') || 
                     window.location.href.includes('edge://newtab/') ||
                     window.location.href === 'about:blank' ||
                     window.location.href === '';
    
    console.log('当前页面:', window.location.href, '是新标签页:', isNewTab);
    
    if (isNewTab) {
      // 注入样式
      injectStyles();
      
      // 创建卡片
      createCard();
      
      // 延迟加载命令并显示
      setTimeout(async () => {
        await loadCommand();
        showCard();
      }, 800);
    }
    
    // 设置消息监听
    setupMessageListener();
    
    console.log('插件初始化完成');
    
  } catch (error) {
    console.error('初始化失败:', error);
  }
}

// 注入样式
function injectStyles() {
  if (document.getElementById('linux-card-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'linux-card-styles';
  style.textContent = getCardStyles();
  document.head.appendChild(style);
}

function getCardStyles() {
  return `
    #linux-daily-card {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    #linux-daily-card.hidden {
      display: none !important;
    }
    
    .card-container {
      width: 340px;
      max-width: 90%;
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
      animation: cardAppear 0.3s ease;
    }
    
    @keyframes cardAppear {
      from { opacity: 0; transform: scale(0.9); }
      to { opacity: 1; transform: scale(1); }
    }
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
    }
    
    .badge-container {
      display: flex;
      gap: 8px;
    }
    
    .badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      background: rgba(255,255,255,0.2);
    }
    
    #closeBtn {
      background: rgba(255,255,255,0.2);
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      color: white;
      cursor: pointer;
      font-size: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    #closeBtn:hover {
      background: rgba(255,255,255,0.3);
    }
    
    .card-body {
      padding: 20px;
    }
    
    #commandText {
      font-family: 'Consolas', monospace;
      font-size: 18px;
      font-weight: bold;
      color: #2d3748;
      margin-bottom: 16px;
      word-break: break-all;
    }
    
    #commandDescription {
      background: #f8fafc;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 16px;
      line-height: 1.5;
      color: #4a5568;
    }
    
    #commandExample {
      background: #2d3748;
      color: #e2e8f0;
      padding: 12px;
      border-radius: 8px;
      font-family: 'Consolas', monospace;
      margin-bottom: 20px;
      word-break: break-all;
    }
    
    .action-buttons {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
    }
    
    .action-btn {
      flex: 1;
      padding: 14px;
      border: none;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .action-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    
    #rememberBtn {
      background: linear-gradient(135deg, #48bb78, #38a169);
      color: white;
    }
    
    #reviewBtn {
      background: linear-gradient(135deg, #e2e8f0, #cbd5e0);
      color: #4a5568;
    }
    
    .progress-info {
      background: white;
      padding: 12px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    
    .progress-bar {
      height: 8px;
      background: #e2e8f0;
      border-radius: 4px;
      overflow: hidden;
      margin-top: 8px;
    }
    
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #4299e1, #667eea);
      width: 0%;
      transition: width 0.5s ease;
    }
  `;
}

// 创建卡片
function createCard() {
  // 移除旧的卡片
  const oldCard = document.getElementById('linux-daily-card');
  if (oldCard) oldCard.remove();
  
  // 创建新卡片
  const card = document.createElement('div');
  card.id = 'linux-daily-card';
  card.className = 'hidden';
  
  card.innerHTML = `
    <div class="card-container">
      <div class="card-header">
        <div class="badge-container">
          <span class="badge" id="categoryBadge">文件操作</span>
          <span class="badge" id="difficultyBadge">初级</span>
        </div>
        <button id="closeBtn">×</button>
      </div>
      
      <div class="card-body">
        <div id="commandText">正在加载命令...</div>
        
        <div id="commandDescription">
          命令描述加载中...
        </div>
        
        <div id="commandExample">
          $ 示例代码加载中...
        </div>
        
        <div class="action-buttons">
          <button class="action-btn" id="rememberBtn">
            ✓ 记住
          </button>
          <button class="action-btn" id="reviewBtn">
            ↻ 明天再来
          </button>
        </div>
        
        <div class="progress-info">
          <div>已掌握: <span id="progressText">0</span>/<span id="totalText">5</span></div>
          <div class="progress-bar">
            <div class="progress-fill" id="progressFill"></div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(card);
  
  // 绑定事件
  bindCardEvents(card);
  
  // 保存引用
  window.linuxCard = card;
  console.log('卡片创建完成');
}

// 绑定卡片事件
function bindCardEvents(card) {
  console.log('绑定卡片事件...');
  
  // 关闭按钮
  const closeBtn = card.querySelector('#closeBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      console.log('关闭按钮被点击');
      hideCard();
    });
  }
  
  // 记住按钮
  const rememberBtn = card.querySelector('#rememberBtn');
  if (rememberBtn) {
    rememberBtn.addEventListener('click', async () => {
      console.log('记住按钮被点击');
      await handleRemember(true);
    });
  }
  
  // 复习按钮
  const reviewBtn = card.querySelector('#reviewBtn');
  if (reviewBtn) {
    reviewBtn.addEventListener('click', async () => {
      console.log('复习按钮被点击');
      await handleRemember(false);
    });
  }
  
  // 点击外部关闭
  card.addEventListener('click', (e) => {
    if (e.target === card) {
      hideCard();
    }
  });
  
  // ESC键关闭
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideCard();
    }
  });
  
  console.log('事件绑定完成');
}

// 显示卡片
function showCard() {
  const card = document.getElementById('linux-daily-card');
  if (card) {
    card.classList.remove('hidden');
    console.log('卡片显示');
  }
}

// 隐藏卡片
function hideCard() {
  const card = document.getElementById('linux-daily-card');
  if (card) {
    card.classList.add('hidden');
    console.log('卡片隐藏');
  }
}

// 加载命令
async function loadCommand() {
  console.log('开始加载命令...');
  
  try {
    const response = await chrome.runtime.sendMessage({ 
      action: 'getTodaysCommand' 
    });
    
    console.log('收到命令响应:', response);
    
    if (response && response.command) {
      updateCardContent(response.command);
      await updateProgress();
    } else {
      console.error('未收到命令数据');
      showMessage('无法加载命令');
    }
  } catch (error) {
    console.error('加载命令失败:', error);
    showMessage('加载失败: ' + error.message);
  }
}

// 更新卡片内容
function updateCardContent(command) {
  const card = document.getElementById('linux-daily-card');
  if (!card || !command) return;
  
  console.log('更新卡片内容:', command.command);
  
  // 更新文本
  const elements = {
    commandText: command.command,
    commandDescription: command.description,
    commandExample: '$ ' + command.example,
    categoryBadge: command.category,
    difficultyBadge: command.difficulty
  };
  
  Object.entries(elements).forEach(([id, text]) => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = text;
    }
  });
}

// 处理记住/复习
async function handleRemember(remembered) {
  try {
    const commandText = document.getElementById('commandText')?.textContent;
    if (!commandText || commandText === '正在加载命令...') {
      showMessage('请等待命令加载完成');
      return;
    }
    
    console.log(remembered ? '记住命令:' : '复习命令:', commandText);
    
    const action = remembered ? 'markAsLearned' : 'markForReview';
    const response = await chrome.runtime.sendMessage({
      action: action,
      commandText: commandText
    });
    
    if (response && response.success) {
      const message = remembered ? '✓ 已记住该命令' : '↻ 已加入复习列表';
      showMessage(message);
      
      // 更新进度
      await updateProgress();
      
      // 延迟隐藏
      setTimeout(() => {
        hideCard();
      }, 1500);
    }
  } catch (error) {
    console.error('处理失败:', error);
    showMessage('操作失败: ' + error.message);
  }
}

// 更新进度
async function updateProgress() {
  try {
    const response = await chrome.runtime.sendMessage({ 
      action: 'getProgress' 
    });
    
    if (response && response.progress) {
      const progress = response.progress;
      const progressText = document.getElementById('progressText');
      const totalText = document.getElementById('totalText');
      const progressFill = document.getElementById('progressFill');
      
      if (progressText) progressText.textContent = progress.learned;
      if (totalText) totalText.textContent = progress.total;
      if (progressFill) progressFill.style.width = `${progress.percentage}%`;
    }
  } catch (error) {
    console.error('更新进度失败:', error);
  }
}

// 显示消息
function showMessage(text) {
  // 移除旧消息
  const oldMsg = document.querySelector('.linux-message');
  if (oldMsg) oldMsg.remove();
  
  const msg = document.createElement('div');
  msg.className = 'linux-message';
  msg.textContent = text;
  msg.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #48bb78;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    z-index: 1000000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  `;
  
  document.body.appendChild(msg);
  
  setTimeout(() => {
    msg.remove();
  }, 2000);
}

// 设置消息监听器
function setupMessageListener() {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('收到消息:', request.action);
    
    const actions = {
      forceShowCard: () => {
        showCard();
        sendResponse({ success: true });
      },
      refreshCard: async () => {
        await loadCommand();
        showCard();
        sendResponse({ success: true });
      }
    };
    
    if (actions[request.action]) {
      actions[request.action]();
    } else {
      sendResponse({ success: false, error: '未知操作' });
    }
    
    return true;
  });
}

// 暴露调试接口
window.debugLinuxPlugin = {
  showCard,
  hideCard,
  loadCommand,
  test: () => console.log('调试接口工作正常')
};

console.log('=== 内容脚本加载完成 ===');