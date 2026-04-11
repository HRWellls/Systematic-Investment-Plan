// 全局变量初始化
window.isBatchEditMode = false;

// 渲染函数
function renderStatsPanel() {
  const totalTargetAmount = state.funds.reduce((sum, f) => sum + f.targetAmount, 0);
  const totalCurrentAmount = state.funds.reduce((sum, f) => sum + f.currentAmount, 0);
  const totalMonthlyInvestment = state.funds.reduce((sum, f) => {
    return sum + f.investmentAmount * frequencyMultiplier[f.frequency];
  }, 0);
  const progress = totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0;

  return `
    <div class="stats-panel">
      <h2 class="section-title">
        <span class="icon icon-trending-up"></span>
        定投概览
      </h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon target">
            <span class="icon icon-target icon-lg"></span>
          </div>
          <div class="stat-content">
            <span class="stat-label">预计持仓总金额</span>
            <span class="stat-value">${formatCurrency(totalTargetAmount)}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon current">
            <span class="icon icon-wallet icon-lg"></span>
          </div>
          <div class="stat-content">
            <span class="stat-label">当前持仓金额</span>
            <span class="stat-value">${formatCurrency(totalCurrentAmount)}</span>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${Math.min(progress, 100)}%"></div>
            </div>
            <span class="progress-text">${progress.toFixed(1)}%</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon monthly">
            <span class="icon icon-trending-up icon-lg"></span>
          </div>
          <div class="stat-content">
            <span class="stat-label">每月定投金额</span>
            <span class="stat-value">${formatCurrency(totalMonthlyInvestment)}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon calendar">
            <span class="icon icon-piggy-bank icon-lg"></span>
          </div>
          <div class="stat-content">
            <span class="stat-label">基金数量</span>
            <span class="stat-value">${state.funds.length} 只</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderCategoryManager() {
  let categoryFormHtml = '';
  if (isAddingCategory) {
    categoryFormHtml = `
      <div class="category-form">
        <input type="text" id="newCategoryName" placeholder="分类名称" class="input" autofocus>
        <div class="color-picker">
          ${presetColors.map(color => `
            <button type="button" class="color-option" style="background-color: ${color}" onclick="selectColor('${color}')"></button>
          `).join('')}
        </div>
        <div class="form-actions">
          <button class="btn btn-primary" onclick="submitCategory()">
            <span class="icon icon-check icon-sm"></span> 确认
          </button>
          <button class="btn btn-secondary" onclick="cancelCategory()">
            <span class="icon icon-x icon-sm"></span> 取消
          </button>
        </div>
      </div>
    `;
  }

  let selectedColor = presetColors[0];
  window.selectColor = (color) => {
    selectedColor = color;
    document.querySelectorAll('.color-option').forEach(btn => {
      btn.classList.toggle('selected', btn.style.backgroundColor === color || 
        btn.getAttribute('onclick').includes(color));
    });
  };

  window.submitCategory = () => {
    const name = document.getElementById('newCategoryName').value.trim();
    if (name) {
      addCategory(name, selectedColor);
      isAddingCategory = false;
      render();
    }
  };

  window.cancelCategory = () => {
    isAddingCategory = false;
    editingCategoryId = null;
    render();
  };

  window.startEditCategory = (id) => {
    editingCategoryId = id;
    render();
  };

  window.submitEditCategory = (id) => {
    const name = document.getElementById('editCategoryName').value.trim();
    if (name) {
      updateCategory(id, { name });
      editingCategoryId = null;
      render();
    }
  };

  return `
    <div class="category-manager">
      <div class="section-header">
        <h2 class="section-title">
          <span class="icon icon-folder"></span>
          基金分类
        </h2>
        ${!isAddingCategory ? `
          <button class="btn-icon" onclick="isAddingCategory=true;render()" title="添加分类">
            <span class="icon icon-plus"></span>
          </button>
        ` : ''}
      </div>
      ${categoryFormHtml}
      <div class="category-list">
        ${state.categories.length === 0 ? 
          '<div class="empty-state">暂无分类，点击右上角添加</div>' :
          state.categories.map(category => {
            // 计算该分类下的基金总金额
            const categoryFunds = state.funds.filter(f => f.categoryId === category.id);
            const totalTargetAmount = categoryFunds.reduce((sum, f) => sum + f.targetAmount, 0);
            const totalCurrentAmount = categoryFunds.reduce((sum, f) => sum + f.currentAmount, 0);
            const fundCount = categoryFunds.length;
            
            // 计算该分类下的每日定投总额
            let dailyInvestmentTotal = 0;
            categoryFunds.forEach(fund => {
              switch(fund.frequency) {
                case 'daily':
                  dailyInvestmentTotal += fund.investmentAmount;
                  break;
                case 'weekly':
                  dailyInvestmentTotal += fund.investmentAmount / 7;
                  break;
                case 'biweekly':
                  dailyInvestmentTotal += fund.investmentAmount / 14;
                  break;
                case 'monthly':
                  dailyInvestmentTotal += fund.investmentAmount / 30.44;
                  break;
              }
            });
            
            // 计算最近完成日期
            let nearestCompletionDate = null;
            categoryFunds.forEach(fund => {
              const completionDate = calculateFundCompletionDate(fund);
              if (completionDate && completionDate !== '已完成') {
                const dateObj = new Date(completionDate);
                if (!nearestCompletionDate || dateObj < new Date(nearestCompletionDate)) {
                  nearestCompletionDate = completionDate;
                }
              }
            });
            
            if (editingCategoryId === category.id) {
              return `
                <div class="category-item">
                  <div class="category-form inline">
                    <input type="text" id="editCategoryName" value="${category.name}" class="input" autofocus>
                    <div class="form-actions">
                      <button class="btn-icon" onclick="submitEditCategory('${category.id}')">
                        <span class="icon icon-check icon-sm"></span>
                      </button>
                      <button class="btn-icon" onclick="cancelCategory()">
                        <span class="icon icon-x icon-sm"></span>
                      </button>
                    </div>
                  </div>
                </div>
              `;
            }
            return `
              <div class="category-item">
                <div class="category-info" style="flex: 1;">
                  <span class="category-color" style="background-color: ${category.color}"></span>
                  <div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                      <span class="category-name">${category.name}</span>
                      <span style="font-size: 0.75rem; color: var(--text-secondary)">(${fundCount}只)</span>
                    </div>
                    ${fundCount > 0 ? `
                      <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem;">
                        目标: ${formatCurrency(totalTargetAmount)}
                      </div>
                      <div style="font-size: 0.75rem; color: var(--text-secondary);">
                        当前: ${formatCurrency(totalCurrentAmount)}
                      </div>
                      <div style="font-size: 0.75rem; color: var(--text-secondary);">
                        每日定投总额: ${formatCurrency(dailyInvestmentTotal)}
                      </div>
                      ${nearestCompletionDate ? `
                        <div style="font-size: 0.75rem; color: var(--text-secondary);">
                          下个完成日: ${nearestCompletionDate}
                        </div>
                      ` : ''}
                      ${totalTargetAmount > 0 ? `
                        <div style="margin-top: 0.25rem; display: flex; align-items: center; gap: 0.5rem;">
                          <div style="flex: 1; height: 4px; background: var(--border-color); border-radius: 2px; overflow: hidden;">
                            <div style="height: 100%; width: ${Math.min((totalCurrentAmount / totalTargetAmount) * 100, 100)}%; background: ${category.color}; border-radius: 2px; transition: width 0.3s ease;"></div>
                          </div>
                          <div style="font-size: 0.625rem; color: var(--text-secondary); min-width: 30px; text-align: right;">
                            ${Math.round((totalCurrentAmount / totalTargetAmount) * 100)}%
                          </div>
                        </div>
                      ` : ''}
                    ` : ''}
                  </div>
                </div>
                <div class="category-actions">
                  <button class="btn-icon" onclick="startEditCategory('${category.id}')" title="编辑">
                    <span class="icon icon-edit icon-sm"></span>
                  </button>
                  <button class="btn-icon danger" onclick="deleteCategory('${category.id}')" title="删除">
                    <span class="icon icon-trash icon-sm"></span>
                  </button>
                </div>
              </div>
            `;
          }).join('')
        }
      </div>

      <!-- 分类持仓占比图表 -->
      ${renderCategoryPieChart()}

      <!-- 数据管理 -->
      <div class="data-manager">
        <h2 class="section-title">
          <span class="icon icon-save"></span>
          数据管理
        </h2>
        <div class="data-actions">
          <button class="data-action-btn export" onclick="exportData()">
            <span class="icon icon-save icon-sm"></span>
            <div>
              <div style="font-weight: 500;">导出备份</div>
              <div style="font-size: 0.75rem; color: var(--text-secondary);">将数据保存为JSON文件</div>
            </div>
          </button>

          <div class="file-input-wrapper">
            <input type="file" id="importFile" accept=".json" onchange="handleFileSelect(event)">
            <label for="importFile" class="data-action-btn import" style="margin: 0; cursor: pointer;">
              <span class="icon icon-refresh icon-sm"></span>
              <div>
                <div style="font-weight: 500;">导入恢复</div>
                <div style="font-size: 0.75rem; color: var(--text-secondary);">从JSON文件恢复数据</div>
              </div>
            </label>
          </div>

          <button class="data-action-btn clear" onclick="clearAllData()">
            <span class="icon icon-trash icon-sm"></span>
            <div>
              <div style="font-weight: 500;">清空数据</div>
              <div style="font-size: 0.75rem; color: var(--text-secondary);">删除所有数据（谨慎操作）</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderFundList() {
  if (state.categories.length === 0) {
    return `
      <div class="fund-list">
        <div class="section-header">
          <h2 class="section-title">
            <span class="icon icon-pie-chart"></span>
            基金列表
          </h2>
        </div>
        <div class="empty-state">请先添加基金分类</div>
      </div>
    `;
  }

  let fundFormHtml = '';
  if (isAddingFund) {
    fundFormHtml = renderFundForm();
  }

  const fundsByCategory = state.categories.map(category => ({
    category,
    funds: state.funds.filter(f => f.categoryId === category.id)
  })).filter(group => group.funds.length > 0 || isAddingFund);

  window.toggleCategory = (categoryId) => {
    const index = expandedCategory.indexOf(categoryId);
    if (index > -1) {
      expandedCategory.splice(index, 1);
    } else {
      expandedCategory.push(categoryId);
    }
    render();
  };

  window.startAddFund = () => {
    isAddingFund = true;
    render();
  };

  window.startEditFund = (id) => {
    editingFundId = id;
    render();
  };
  


  window.sortFundsByCompletionDate = () => {
          state.funds.sort((a, b) => {
            const getTime = (fund) => {
              const date = calculateFundCompletionDate(fund);
              if (!date) return Infinity;        // 无计划 → 最后
              if (date === '已完成') return Infinity;    // 已完成 → 最后
              return new Date(date).getTime();  // 正常日期
            };
            return getTime(a) - getTime(b);
          });
          
          saveData(state);
          render();
          showToast('已按预计完成日期排序', 'success');
  };

  window.sortFundsByCurrentAmount = () => {
          // 获取当前排序方向
          const currentOrder = isCurrentAmountDescending ? '降序' : '升序';
          
          state.funds.sort((a, b) => {
            if (isCurrentAmountDescending) {
              // 降序排序（从大到小）
              return b.currentAmount - a.currentAmount;
            } else {
              // 升序排序（从小到大）
              return a.currentAmount - b.currentAmount;
            }
          });
          
          // 切换排序方向
          isCurrentAmountDescending = !isCurrentAmountDescending;
          
          saveData(state);
          render();
          
          // 显示相应的提示信息
          showToast(`已按持仓金额${currentOrder}排序`, 'success');
  };

  window.openPlanModal = (fundId) => {
    selectedFundId = fundId;
    planModalOpen = true;
    render();
  };

  window.toggleBatchEditMode = () => {
    window.isBatchEditMode = !window.isBatchEditMode;
    render();
  };

  window.toggleSelectAllFunds = () => {
    const checkboxes = document.querySelectorAll('.fund-checkbox');
    const selectAllCheckbox = document.getElementById('selectAllFunds');
    checkboxes.forEach(checkbox => {
      checkbox.checked = selectAllCheckbox.checked;
    });
  };

  window.batchDeleteFunds = () => {
    const selectedCheckboxes = document.querySelectorAll('.fund-checkbox:checked');
    if (selectedCheckboxes.length === 0) {
      showToast('请先选择要删除的基金', 'warning');
      return;
    }
    
    if (!confirm(`确定要删除选中的 ${selectedCheckboxes.length} 只基金吗？`)) return;
    
    selectedCheckboxes.forEach(checkbox => {
      const fundId = checkbox.dataset.fundId;
      deleteFund(fundId);
    });
    
    window.isBatchEditMode = false;
    render();
    showToast(`已删除 ${selectedCheckboxes.length} 只基金`, 'success');
  };

  return `
    <div class="fund-list">
      <div class="section-header">
        <h2 class="section-title">
          <span class="icon icon-pie-chart"></span>
          基金列表
        </h2>
        ${!isAddingFund ? `
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            ${window.isBatchEditMode ? `
              <div style="display: flex; align-items: center; gap: 0.25rem;">
                <input type="checkbox" id="selectAllFunds" onclick="toggleSelectAllFunds()" title="全选">
                <button class="btn-icon danger" onclick="batchDeleteFunds()" title="批量删除">
                  <span class="icon icon-trash"></span>
                </button>
                <button class="btn-icon" onclick="toggleBatchEditMode()" title="取消批量删除">
                  <span class="icon icon-x"></span>
                </button>
              </div>
            ` : `
              <button class="btn-icon" onclick="toggleBatchEditMode()" title="批量删除">
                <span class="icon icon-trash"></span>
              </button>
            `}
            <button class="btn-icon" onclick="sortFundsByCurrentAmount()" title="${isCurrentAmountDescending ? '按持仓金额降序排序' : '按持仓金额升序排序'}">
              <span class="icon icon-wallet"></span>
            </button>
            <button class="btn-icon" onclick="sortFundsByCompletionDate()" title="按预计完成日期排序">
              <span class="icon icon-calendar"></span>
            </button>
            <button class="btn-icon" onclick="startAddFund()" title="添加基金">
              <span class="icon icon-plus"></span>
            </button>
          </div>
        ` : ''}
      </div>
      ${fundFormHtml}
      <div class="fund-categories">
        ${fundsByCategory.length === 0 && !isAddingFund ? 
          '<div class="empty-state">暂无基金，点击右上角添加</div>' :
          fundsByCategory.map(({ category, funds: categoryFunds }) => `
            <div class="fund-category-section">
              <div class="category-header" onclick="toggleCategory('${category.id}')" style="display: flex; align-items: center; cursor: pointer;">
                <span class="category-dot" style="background-color: ${category.color}"></span>
                <span class="category-title">${category.name}</span>
                <span class="fund-count">(${categoryFunds.length})</span>
                <span style="margin-left: auto; transition: transform 0.3s ease;">
                  <span class="icon ${expandedCategory.includes(category.id) ? 'icon-chevron-down' : 'icon-chevron-right'}"></span>
                </span>
              </div>
              ${expandedCategory.includes(category.id) ? `
                <div class="fund-items">
                  ${categoryFunds.map(fund => {
                    if (editingFundId === fund.id) {
                      return renderFundForm(fund);
                    }
                    const plan = getFuturePlanByFundId(fund.id);
                    return `
                      <div class="fund-item">
                        <div class="fund-header">
                          <div class="fund-info" style="display: flex; align-items: center; gap: 0.5rem;">
                            ${window.isBatchEditMode ? `
                              <input type="checkbox" class="fund-checkbox" data-fund-id="${fund.id}" style="margin: 0;">
                            ` : ''}
                            <span class="fund-name">${fund.name}</span>
                            <span class="fund-code">${fund.code}</span>
                          </div>
                          <div class="fund-actions">
                            <button class="btn-icon" onclick="openPlanModal('${fund.id}')" title="未来计划">
                              <span class="icon icon-file-text icon-sm"></span>
                            </button>
                            <button class="btn-icon" onclick="startEditFund('${fund.id}')" title="编辑">
                              <span class="icon icon-edit icon-sm"></span>
                            </button>
                            <button class="btn-icon danger" onclick="deleteFund('${fund.id}')" title="删除">
                              <span class="icon icon-trash icon-sm"></span>
                            </button>
                          </div>
                        </div>
                        <div class="fund-details">
                          <div class="detail-item">
                            <span class="detail-label">目标金额</span>
                            <span class="detail-value">${formatCurrency(fund.targetAmount)}</span>
                          </div>
                          <div class="detail-item">
                            <span class="detail-label">持仓金额</span>
                            <span class="detail-value">${formatCurrency(fund.currentAmount)}</span>
                          </div>
                          <div class="detail-item">
                            <span class="detail-label">定投金额</span>
                            <span class="detail-value">${formatCurrency(fund.investmentAmount)} / ${frequencyLabels[fund.frequency]}</span>
                          </div>
                          <div class="detail-item">
                            <span class="detail-label">预计完成日期</span>
                            <span class="detail-value completion-date">
                              <span class="icon icon-calendar icon-sm"></span>
                              ${calculateFundCompletionDate(fund) || '暂无定投计划'}
                            </span>
                          </div>
                        </div>
                        ${fund.notes ? `<div class="fund-notes">备注: ${fund.notes}</div>` : ''}
                        ${plan ? `
                          <div class="future-plan-badge">
                            <span class="icon icon-file-text icon-sm"></span>
                            已有未来计划
                          </div>
                        ` : ''}
                      </div>
                    `;
                  }).join('')}
                </div>
              ` : ''}
            </div>
          `).join('')
        }
      </div>
    </div>
  `;
}

function renderFundForm(fund = null) {
  const isEdit = !!fund;
  const formId = isEdit ? 'edit' : 'add';
  const fundData = fund || {
    categoryId: state.categories[0]?.id || '',
    name: '',
    code: '',
    targetAmount: '',
    initialAmount: '',
    initialDate: new Date().toISOString().split('T')[0],
    investmentAmount: '',
    frequency: 'monthly',
    notes: ''
  };

  window.submitFundForm = () => {
    const data = {
      categoryId: document.getElementById(`${formId}CategoryId`).value,
      name: document.getElementById(`${formId}Name`).value.trim(),
      code: document.getElementById(`${formId}Code`).value.trim(),
      targetAmount: Number(document.getElementById(`${formId}Target`).value) || 0,
      initialAmount: Number(document.getElementById(`${formId}Initial`).value) || 0,
      initialDate: document.getElementById(`${formId}InitialDate`).value,
      investmentAmount: Number(document.getElementById(`${formId}Investment`).value) || 0,
      frequency: document.getElementById(`${formId}Frequency`).value,
      notes: document.getElementById(`${formId}Notes`).value.trim()
    };
    
    // 计算当前持仓金额
    const fundObject = {
      ...data,
      currentAmount: 0 // 临时值，后续会通过calculateSimulatedCurrentAmount计算
    };
    data.currentAmount = calculateSimulatedCurrentAmount(fundObject);

    if (!data.name || !data.categoryId) return;

    if (isEdit) {
      updateFund(fund.id, data);
      editingFundId = null;
      render();
    } else {
      addFund(data);
      isAddingFund = false;
      render();
    }
  };

  window.cancelFundForm = () => {
    isAddingFund = false;
    editingFundId = null;
    render();
  };

  return `
    <div class="fund-form">
      <div class="form-row">
        <select id="${formId}CategoryId" class="input">
          <option value="">选择分类</option>
          ${state.categories.map(c => `
            <option value="${c.id}" ${fundData.categoryId === c.id ? 'selected' : ''}>${c.name}</option>
          `).join('')}
        </select>
        <input type="text" id="${formId}Name" placeholder="基金名称" class="input" value="${fundData.name}">
        <input type="text" id="${formId}Code" placeholder="基金代码" class="input" value="${fundData.code}">
      </div>
      <div class="form-row">
        <input type="number" id="${formId}Target" placeholder="目标金额" class="input" value="${fundData.targetAmount}">
        <input type="number" id="${formId}Initial" placeholder="建仓金额" class="input" value="${fundData.initialAmount}">
        <input type="number" id="${formId}Investment" placeholder="定投金额" class="input" value="${fundData.investmentAmount}">
      </div>
      <div class="form-row" style="gap: 1rem;">
        <select id="${formId}Frequency" class="input" style="width: 288px;">
          ${Object.entries(frequencyLabels).map(([value, label]) => `
            <option value="${value}" ${fundData.frequency === value ? 'selected' : ''}>${label}</option>
          `).join('')}
        </select>
        <div style="display: flex; align-items: center; gap: 0.5rem; flex: 1;">
          <span style="font-size: 0.875rem; color: var(--text-secondary); white-space: nowrap;">建仓日期：</span>
          <input type="date" id="${formId}InitialDate" class="input" style="flex: 1; min-width: 150px;" value="${fundData.initialDate}">
        </div>
      </div>
      <textarea id="${formId}Notes" placeholder="备注" class="input textarea" rows="2">${fundData.notes}</textarea>
      <div class="form-actions">
        <button class="btn btn-primary" onclick="submitFundForm()">
          <span class="icon icon-check icon-sm"></span> 确认
        </button>
        <button class="btn btn-secondary" onclick="cancelFundForm()">
          <span class="icon icon-x icon-sm"></span> 取消
        </button>
      </div>
    </div>
  `;
}

function renderPlanModal() {
  if (!planModalOpen || !selectedFundId) return '';

  const fund = state.funds.find(f => f.id === selectedFundId);
  if (!fund) return '';

  const category = state.categories.find(c => c.id === fund.categoryId);
  const plan = getFuturePlanByFundId(selectedFundId);

  window.closePlanModal = () => {
    planModalOpen = false;
    selectedFundId = null;
    render();
  };

  window.savePlan = () => {
    const content = document.getElementById('planContent').value.trim();
    addFuturePlan(selectedFundId, content);
    planModalOpen = false;
    selectedFundId = null;
  };

  return `
    <div class="modal-overlay" onclick="closePlanModal()">
      <div class="modal-content" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h3>
            <span class="icon icon-file-text"></span>
            未来定投计划
          </h3>
          <button class="btn-icon" onclick="closePlanModal()">
            <span class="icon icon-x"></span>
          </button>
        </div>
        <div class="modal-body">
          <div class="fund-info-header">
            <span class="category-dot" style="background-color: ${category?.color || '#ccc'}"></span>
            <span class="fund-name">${fund.name}</span>
            <span class="fund-code">${fund.code}</span>
          </div>
          <textarea id="planContent" placeholder="记录未来定投计划的调整，例如：
- 下个月增加定投金额到 XXX 元
- 从每周改为每月定投
- 达到目标后暂停定投" class="plan-textarea" rows="8" autofocus>${plan?.content || ''}</textarea>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closePlanModal()">取消</button>
          <button class="btn btn-primary" onclick="savePlan()">
            <span class="icon icon-save icon-sm"></span> 保存
          </button>
        </div>
      </div>
    </div>
  `;
}

// 主题切换功能
function toggleTheme() {
  const isDarkMode = document.body.classList.toggle('dark-mode');
  localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  render();
}

function loadTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
  }
}

function render() {
  const isDarkMode = document.body.classList.contains('dark-mode');
  document.getElementById('root').innerHTML = `
    <div class="app">
      <header class="app-header">
        <div class="header-content">
          <span class="icon icon-trending-up icon-xl"></span>
          <h1>定投统计助手</h1>
          <button class="btn-icon" onclick="toggleTheme()" title="切换主题">
            <span class="icon ${isDarkMode ? 'icon-sun' : 'icon-moon'}"></span>
          </button>
        </div>
      </header>
      <main class="app-main">
        ${renderStatsPanel()}
        <div class="content-grid">
          <div class="left-panel">
            ${renderCategoryManager()}
          </div>
          <div class="right-panel">
            ${renderFundList()}
          </div>
        </div>
      </main>
      ${renderPlanModal()}
    </div>
  `;
}

function renderCategoryPieChart() {
  // 计算每个分类的当前持仓金额
  const categoryAmounts = state.categories.map(category => {
    const categoryFunds = state.funds.filter(f => f.categoryId === category.id);
    const totalCurrentAmount = categoryFunds.reduce((sum, f) => sum + f.currentAmount, 0);
    return {
      category,
      amount: totalCurrentAmount
    };
  }).filter(item => item.amount > 0);

  // 计算总金额
  const totalAmount = categoryAmounts.reduce((sum, item) => sum + item.amount, 0);

  if (totalAmount === 0) {
    return `
      <div class="category-pie-chart">
        <h2 class="section-title">
          <span class="icon icon-pie-chart"></span>
          分类持仓占比
        </h2>
        <div class="empty-state">暂无持仓数据</div>
      </div>
    `;
  }

  // 计算每个分类的占比和角度
  let currentAngle = 0;
  const chartItems = categoryAmounts.map(item => {
    const percentage = (item.amount / totalAmount) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    // 计算路径
    const radius = 60;
    const centerX = 80;
    const centerY = 80;
    const startX = centerX + radius * Math.cos((startAngle - 90) * Math.PI / 180);
    const startY = centerY + radius * Math.sin((startAngle - 90) * Math.PI / 180);
    const endX = centerX + radius * Math.cos((endAngle - 90) * Math.PI / 180);
    const endY = centerY + radius * Math.sin((endAngle - 90) * Math.PI / 180);
    const largeArcFlag = angle > 180 ? 1 : 0;

    const path = `M ${centerX} ${centerY} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;

    return {
      category: item.category,
      amount: item.amount,
      percentage: percentage,
      path: path
    };
  });

  return `
    <div class="category-pie-chart">
      <h2 class="section-title">
        <span class="icon icon-pie-chart"></span>
        分类持仓占比
      </h2>
      <div class="chart-container">
        <svg width="160" height="160" class="pie-chart">
          ${chartItems.map(item => `
            <path d="${item.path}" fill="${item.category.color}" />
          `).join('')}
          <circle cx="80" cy="80" r="40" fill="white" />
          <text x="80" y="75" text-anchor="middle" font-size="14" font-weight="bold">总持仓</text>
          <text x="80" y="95" text-anchor="middle" font-size="12">${formatCurrency(totalAmount)}</text>
        </svg>
        <div class="chart-legend">
          ${chartItems.map(item => `
            <div class="legend-item" style="display: flex; align-items: center; width: 100%;">
              <span class="legend-color" style="background-color: ${item.category.color}"></span>
              <span class="legend-name">${item.category.name}</span>
              <div style="flex: 1; text-align: center;">
                <span style="display: inline-block; text-align: left;">${formatCurrency(item.amount)}</span>
              </div>
              <span style="color: var(--text-secondary);">${item.percentage.toFixed(1)}%</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// 导出函数
window.renderStatsPanel = renderStatsPanel;
window.renderCategoryManager = renderCategoryManager;
window.renderFundList = renderFundList;
window.renderFundForm = renderFundForm;
window.renderPlanModal = renderPlanModal;
window.renderCategoryPieChart = renderCategoryPieChart;
window.render = render;
window.toggleTheme = toggleTheme;
window.loadTheme = loadTheme;