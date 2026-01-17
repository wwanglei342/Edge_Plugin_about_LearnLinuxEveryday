// background.js

chrome.runtime.onInstalled.addListener(() => {
  console.log('Linux Command Daily 插件已安装');
  
  // 初始化默认设置
  chrome.storage.local.get(['settings'], (result) => {
    if (!result.settings) {
      chrome.storage.local.set({
        settings: {
          dailyLimit: 5, // 每天建议学习数量（可选功能）
          showOnStartup: true
        },
        learnedCommands: [],
        pendingCommands: []
      });
    }
  });
});