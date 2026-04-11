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

function countWorkdays(startDate, endDate) {
  let count = 0;
  const currentDate = new Date(startDate);
  const end = new Date(endDate);
  
  while (currentDate <= end) {
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5) { // 周一到周五
      count++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return count;
}

function calculateSimulatedCurrentAmount(fund) {
  // 使用建仓日期作为计算起点
  const initialDateStr = fund.initialDate;
  if (!initialDateStr) return fund.currentAmount || 0;
  
  const initialDate = new Date(initialDateStr);
  const today = new Date();
  
  // 计算工作日数量
  const workdays = countWorkdays(initialDate, today);
  
  // 计算建仓金额和定投金额
  const initialAmount = fund.initialAmount || 0;
  const investmentAmount = fund.investmentAmount || 0;
  
  // 计算当前持仓金额：建仓金额 + 工作日数量 * 定投金额
  const currentAmount = initialAmount + (workdays * investmentAmount);
  
  return Math.round(currentAmount);
}

// 导出常量和函数
window.frequencyLabels = frequencyLabels;
window.frequencyMultiplier = frequencyMultiplier;
window.presetColors = presetColors;
window.generateId = generateId;
window.formatCurrency = formatCurrency;
window.calculateFundCompletionDate = calculateFundCompletionDate;
window.calculateSimulatedCurrentAmount = calculateSimulatedCurrentAmount;