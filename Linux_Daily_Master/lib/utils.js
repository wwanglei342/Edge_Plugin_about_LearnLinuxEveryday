// 工具函数库

// 格式化解释文本
export function formatExplanation(explanation) {
  if (!explanation) return '';
  
  // 按逗号分割，每部分单独显示
  const parts = explanation.split(/[,，]/);
  return parts.map(part => {
    const cleanPart = part.trim();
    if (cleanPart.includes(':')) {
      const [key, value] = cleanPart.split(':').map(s => s.trim());
      return `<div class="explanation-item"><span class="param">${key}</span>: ${value}</div>`;
    }
    return `<div class="explanation-item">${cleanPart}</div>`;
  }).join('');
}

// 获取难度颜色
export function getDifficultyColor(difficulty) {
  const colors = {
    '初级': '#48bb78',    // 绿色
    '中级': '#4299e1',    // 蓝色
    '高级': '#ed8936',    // 橙色
    '专家': '#e53e3e'     // 红色
  };
  return colors[difficulty] || colors['初级'];
}

// 获取分类颜色
export function getCategoryColor(category) {
  const colors = {
    '文件操作': '#4299e1',
    '文本处理': '#48bb78',
    '文件压缩': '#ed8936',
    '系统管理': '#9f7aea',
    '网络操作': '#ed64a6',
    '进程管理': '#38b2ac'
  };
  return colors[category] || '#4a5568';
}

// 生成用户ID
export function generateUserId() {
  return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 日期格式化
export function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}