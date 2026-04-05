// LocalStorage 存储
const STORAGE_KEYS = {
  categories: 'sip_categories',
  funds: 'sip_funds',
  futurePlans: 'sip_futurePlans'
};

function normalizeFunds(funds) {
  return funds.map(f => ({
    ...f,
    currentAmount: Number(f.currentAmount) || 0,
    targetAmount: Number(f.targetAmount) || 0,
    investmentAmount: Number(f.investmentAmount) || 0
  }));
}

function loadData() {
  const data = {
    categories: JSON.parse(localStorage.getItem(STORAGE_KEYS.categories) || '[]'),
    funds: JSON.parse(localStorage.getItem(STORAGE_KEYS.funds) || '[]'),
    futurePlans: JSON.parse(localStorage.getItem(STORAGE_KEYS.futurePlans) || '[]')
  };

  data.funds = normalizeFunds(data.funds);
  return data;
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(data.categories));
  localStorage.setItem(STORAGE_KEYS.funds, JSON.stringify(data.funds));
  localStorage.setItem(STORAGE_KEYS.futurePlans, JSON.stringify(data.futurePlans));
}

// 导出函数和常量
window.STORAGE_KEYS = STORAGE_KEYS;
window.normalizeFunds = normalizeFunds;
window.loadData = loadData;
window.saveData = saveData;