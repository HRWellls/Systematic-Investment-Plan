// 类型定义和工具函数
const frequencyLabels = {
  daily: '每日',
  weekly: '每周',
  biweekly: '每两周',
  monthly: '每月'
};

const frequencyMultiplier = {
  daily: 21.75,
  weekly: 4.33,
  biweekly: 2.17,
  monthly: 1
};

const presetColors = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

function calculateFundCompletionDate(fund) {
  // 首先检查是否已完成（持仓金额 >= 目标金额）
  const remainingAmount = fund.targetAmount - fund.currentAmount;
  if (remainingAmount <= 0) return '已完成';
  
  // 如果没有定投计划，显示暂无定投计划
  if (fund.investmentAmount <= 0) return null;
  
  const monthlyInvestment = fund.investmentAmount * frequencyMultiplier[fund.frequency];
  if (monthlyInvestment <= 0) return null;
  
  const monthsNeeded = remainingAmount / monthlyInvestment;
  const completionDate = new Date();
  completionDate.setMonth(completionDate.getMonth() + Math.ceil(monthsNeeded));
  return completionDate.toLocaleDateString('zh-CN');
}

function calculateSimulatedCurrentAmount(fund) {
      if (fund.investmentAmount <= 0) return fund.currentAmount; // 如果没有设置定投额，保持原金额不变，绝不清零

      // 使用上次计算/更新的日期，如果没有则退回使用 startDate
      const anchorDateStr = fund.lastCalcDate || fund.startDate;
      const anchorDate = new Date(anchorDateStr);
      const today = new Date();
      
      const daysDiff = Math.floor((today.getTime() - anchorDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= 0) return fund.currentAmount; // 时间没推进，保持原金额

      const monthsDiff = daysDiff / 30.44;
      const monthlyInvestment = fund.investmentAmount * frequencyMultiplier[fund.frequency];
      const increment = monthlyInvestment * monthsDiff;
      
      // 返回：原有金额 + 这段时间的新增定投
      return Math.round(fund.currentAmount + increment);
}

// 导出常量和函数
window.frequencyLabels = frequencyLabels;
window.frequencyMultiplier = frequencyMultiplier;
window.presetColors = presetColors;
window.generateId = generateId;
window.formatCurrency = formatCurrency;
window.calculateFundCompletionDate = calculateFundCompletionDate;
window.calculateSimulatedCurrentAmount = calculateSimulatedCurrentAmount;