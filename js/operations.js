// 状态管理
let state = loadData();
let isAddingCategory = false;
let editingCategoryId = null;
let isAddingFund = false;
let editingFundId = null;
let expandedCategory = [];
let planModalOpen = false;
let selectedFundId = null;
let isCurrentAmountDescending = true;

// 操作函数
function addCategory(name, color) {
  const newCategory = {
    id: generateId(),
    name,
    color,
    createdAt: new Date().toISOString()
  };
  state.categories.push(newCategory);
  saveData(state);
  render();
}

function updateCategory(id, updates) {
  const index = state.categories.findIndex(c => c.id === id);
  if (index !== -1) {
    state.categories[index] = { ...state.categories[index], ...updates };
    saveData(state);
    render();
  }
}

function deleteCategory(id) {
  state.categories = state.categories.filter(c => c.id !== id);
  state.funds = state.funds.filter(f => f.categoryId !== id);
  saveData(state);
  render();
}

function addFund(fundData) {
  const newFund = {
    ...fundData,
    targetAmount: Number(fundData.targetAmount) || 0,
    initialAmount: Number(fundData.initialAmount) || 0,
    investmentAmount: Number(fundData.investmentAmount) || 0,
    id: generateId(),
    createdAt: new Date().toISOString()
  };
  state.funds.push(newFund);
  saveData(state);
  render();
}

function updateFund(id, updates) {
  const index = state.funds.findIndex(f => f.id === id);
  if (index !== -1) {
    state.funds[index] = { ...state.funds[index], ...updates };
    saveData(state);
    render();
  }
}

function deleteFund(id) {
  state.funds = state.funds.filter(f => f.id !== id);
  state.futurePlans = state.futurePlans.filter(p => p.fundId !== id);
  saveData(state);
  render();
}

function addFuturePlan(fundId, content) {
  state.futurePlans = state.futurePlans.filter(p => p.fundId !== fundId);
  state.futurePlans.push({
    id: generateId(),
    fundId,
    content,
    createdAt: new Date().toISOString()
  });
  saveData(state);
  render();
}

function getFuturePlanByFundId(fundId) {
  return state.futurePlans.find(p => p.fundId === fundId);
}

// 数据备份与恢复
function exportData() {
  const data = loadData();
  const exportObj = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    data: data
  };

  const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `定投数据备份_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('数据导出成功！', 'success');
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const importObj = JSON.parse(e.target.result);

      // 验证数据格式
      if (!importObj.data || !importObj.data.categories || !importObj.data.funds) {
        throw new Error('无效的数据格式');
      }

      // 显示确认对话框
      showImportConfirm(importObj.data);
    } catch (error) {
      showToast('导入失败：' + error.message, 'error');
    }
  };
  reader.readAsText(file);
}

function showImportConfirm(data) {
  const categoriesCount = data.categories.length;
  const fundsCount = data.funds.length;
  const plansCount = data.futurePlans?.length || 0;

  const modalHtml = `
    <div class="modal-overlay" id="importConfirmModal" onclick="closeImportModal()">
      <div class="modal-content" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h3>
            <span class="icon icon-file-text"></span>
            确认导入数据
          </h3>
          <button class="btn-icon" onclick="closeImportModal()">
            <span class="icon icon-x"></span>
          </button>
        </div>
        <div class="modal-body">
          <p>即将导入以下数据（将覆盖现有数据）：</p>
          <div class="import-preview">
            <div class="import-stat">
              <span>基金分类</span>
              <strong>${categoriesCount} 个</strong>
            </div>
            <div class="import-stat">
              <span>基金</span>
              <strong>${fundsCount} 只</strong>
            </div>
            <div class="import-stat">
              <span>未来计划</span>
              <strong>${plansCount} 条</strong>
            </div>
          </div>
          <p class="warning-text">
            <span class="icon icon-alert icon-sm"></span>
            警告：导入将覆盖当前所有数据，此操作不可撤销！
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeImportModal()">取消</button>
          <button class="btn btn-primary" onclick="confirmImport()" style="background: var(--danger-color);">
            <span class="icon icon-check icon-sm"></span> 确认导入
          </button>
        </div>
      </div>
    </div>
  `;

  // 保存待导入的数据
  window.pendingImportData = data;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function closeImportModal() {
  const modal = document.getElementById('importConfirmModal');
  if (modal) {
    modal.remove();
  }
  window.pendingImportData = null;
}

function confirmImport() {
  if (window.pendingImportData) {
    saveData(window.pendingImportData);
    state = window.pendingImportData;
    closeImportModal();
    render();
    showToast('数据导入成功！', 'success');
  }
}

function clearAllData() {
  if (confirm('确定要清空所有数据吗？此操作不可撤销！')) {
    state = { categories: [], funds: [], futurePlans: [] };
    saveData(state);
    render();
    showToast('所有数据已清空', 'success');
  }
}

function showToast(message, type = 'success') {
  // 移除已有的toast
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  // 触发显示动画
  setTimeout(() => toast.classList.add('show'), 10);

  // 3秒后移除
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// 文件选择处理
function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file) {
    importData(file);
  }
  // 重置input以便可以重复选择同一文件
  event.target.value = '';
}

// 导出变量和函数
window.state = state;
window.isAddingCategory = isAddingCategory;
window.editingCategoryId = editingCategoryId;
window.isAddingFund = isAddingFund;
window.editingFundId = editingFundId;
window.expandedCategory = expandedCategory;
window.planModalOpen = planModalOpen;
window.selectedFundId = selectedFundId;
window.isCurrentAmountDescending = isCurrentAmountDescending;
window.addCategory = addCategory;
window.updateCategory = updateCategory;
window.deleteCategory = deleteCategory;
window.addFund = addFund;
window.updateFund = updateFund;
window.deleteFund = deleteFund;
window.addFuturePlan = addFuturePlan;
window.getFuturePlanByFundId = getFuturePlanByFundId;
window.exportData = exportData;
window.importData = importData;
window.showImportConfirm = showImportConfirm;
window.closeImportModal = closeImportModal;
window.confirmImport = confirmImport;
window.clearAllData = clearAllData;
window.showToast = showToast;
window.handleFileSelect = handleFileSelect;