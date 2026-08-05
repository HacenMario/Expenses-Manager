// ===== عنوان API =====
const API = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api' 
    : 'https://expenses-manager-z2up.onrender.com/api';

let token = localStorage.getItem('token');
let transactions = [];
let categories = [];
let chartPie = null;
let chartTrend = null;
let currentUser = JSON.parse(localStorage.getItem('user') || '{}');

// ===== العملة الثابتة =====
const CURRENCY = 'DZD';

// ===== أيقونات الفئات الافتراضية =====
const DEFAULT_CATEGORY_ICONS = {
    'Food': '🍔',
    'Transport': '🚌',
    'Books': '📚',
    'Supplies': '🛒',
    'Entertainment': '🎮',
    'Rent': '🏠',
    'Utilities': '💡',
    'Healthcare': '🏥',
    'Other': '📁'
};

// ===== استرجاع أيقونة الفئة =====
function getIconForCategory(categoryName) {
    const customCat = categories.find(c => c.name === categoryName);
    if (customCat && customCat.icon) return customCat.icon;
    
    const defaultKeysMap = {
        'طعام': 'Food', 'مواصلات': 'Transport', 'كتب': 'Books',
        'مستلزمات': 'Supplies', 'ترفيه': 'Entertainment',
        'إيجار': 'Rent', 'فواتير': 'Utilities', 'صحة': 'Healthcare', 'أخرى': 'Other'
    };
    
    if (DEFAULT_CATEGORY_ICONS[categoryName]) return DEFAULT_CATEGORY_ICONS[categoryName];
    
    for (const [ar, en] of Object.entries(defaultKeysMap)) {
        if (categoryName === ar || categoryName === en) {
            if (DEFAULT_CATEGORY_ICONS[en]) return DEFAULT_CATEGORY_ICONS[en];
        }
    }
    
    for (const [en, translated] of Object.entries(t('defaultCategories'))) {
        if (categoryName === translated) {
            if (DEFAULT_CATEGORY_ICONS[en]) return DEFAULT_CATEGORY_ICONS[en];
        }
    }
    
    return '📁';
}

function getCategoryIcon(categoryName) {
    if (DEFAULT_CATEGORY_ICONS[categoryName]) {
        return DEFAULT_CATEGORY_ICONS[categoryName];
    }
    const cat = categories.find(c => c.name === categoryName);
    if (cat && cat.icon) {
        return cat.icon;
    }
    return '📁';
}

function getCurrencySymbol() {
    return CURRENCY;
}

// ===== دوال المصادقة =====
async function register() {
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    if (!name || !email || !password) return alert(t('fillAllFields'));
    try {
        const res = await fetch(`${API}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();
        if (data.success) {
            token = data.token;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(data.user));
            location.reload();
        } else alert('❌ ' + data.message);
    } catch { alert('❌ ' + t('serverError')); }
}

async function login() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    if (!email || !password) return alert(t('fillAllFields'));
    try {
        const res = await fetch(`${API}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (data.success) {
            token = data.token;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(data.user));
            location.reload();
        } else alert('❌ ' + data.message);
    } catch { alert('❌ ' + t('serverError')); }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    location.reload();
}

function showRegister() {
    document.getElementById('loginDiv').style.display = 'none';
    document.getElementById('registerDiv').style.display = 'block';
}
function showLogin() {
    document.getElementById('loginDiv').style.display = 'block';
    document.getElementById('registerDiv').style.display = 'none';
}

// ===== دوال الفئات =====
async function loadCategories() {
    try {
        const res = await fetch(`${API}/categories`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            categories = data.data;
            renderCategories();
            populateCategorySelects();
        }
    } catch (err) { console.error('خطأ في تحميل الفئات', err); }
}

function renderCategories() {
    const container = document.getElementById('categoriesList');
    if (categories.length === 0) {
        container.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:#999;">${t('noCategories')}</p>`;
        return;
    }
    container.innerHTML = categories.map(c => `
        <div class="category-item">
            <div class="cat-info">
                <span class="cat-color" style="background:${c.color || '#667eea'}"></span>
                <span>${c.icon || '📁'} ${c.name}</span>
                ${c.isDefault ? `<span style="font-size:11px;color:#999;">(${t('default')})</span>` : ''}
            </div>
            <div class="cat-actions">
                ${!c.isDefault ? `
                    <button class="edit-cat" onclick="editCategory('${c._id}')" title="${t('edit')}"><i class="fas fa-edit"></i></button>
                    <button class="delete-cat" onclick="deleteCategory('${c._id}')" title="${t('delete')}"><i class="fas fa-trash"></i></button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function populateCategorySelects() {
    const select = document.getElementById('category');
    const filterSelect = document.getElementById('filterCategory');
    const defaultKeys = ['Food', 'Transport', 'Books', 'Supplies', 'Entertainment', 'Rent', 'Utilities', 'Healthcare', 'Other'];
    
    // ===== تعبئة select إضافة المعاملة =====
    if (select) {
        const currentVal = select.value;
        select.innerHTML = `<option value="">${t('selectCategory')}</option>`;
        
        // الفئات المخصصة (من المستخدم)
        categories.forEach(c => {
            select.innerHTML += `<option value="${c.name}">${c.icon || '📁'} ${c.name}</option>`;
        });
        
        // الفئات الافتراضية - القيمة = المفتاح الإنجليزي، النص = الاسم المترجم
        defaultKeys.forEach(key => {
            const translatedName = t(`defaultCategories.${key}`);
            // نضيفها فقط إذا لم تكن موجودة في الفئات المخصصة
            if (!categories.some(c => c.name === translatedName) && !categories.some(c => c.name === key)) {
                const icon = DEFAULT_CATEGORY_ICONS[key] || '📁';
                // المفتاح الإنجليزي هو القيمة، والاسم المترجم هو النص المعروض
                select.innerHTML += `<option value="${key}">${icon} ${translatedName}</option>`;
            }
        });
        
        if (currentVal) select.value = currentVal;
    }

    // ===== تعبئة select التصفية =====
    if (filterSelect) {
        const filterVal = filterSelect.value;
        filterSelect.innerHTML = `<option value="">${t('allCategories')}</option>`;
        
        // الفئات المخصصة (من المستخدم)
        categories.forEach(c => {
            filterSelect.innerHTML += `<option value="${c.name}">${c.icon || '📁'} ${c.name}</option>`;
        });
        
        // الفئات الافتراضية - القيمة = المفتاح الإنجليزي، النص = الاسم المترجم
        defaultKeys.forEach(key => {
            const translatedName = t(`defaultCategories.${key}`);
            if (!categories.some(c => c.name === translatedName) && !categories.some(c => c.name === key)) {
                const icon = DEFAULT_CATEGORY_ICONS[key] || '📁';
                filterSelect.innerHTML += `<option value="${key}">${icon} ${translatedName}</option>`;
            }
        });
        
        if (filterVal) filterSelect.value = filterVal;
    }
}

async function addCategory() {
    const name = document.getElementById('newCategoryName').value.trim();
    const icon = document.getElementById('newCategoryIcon').value.trim() || '📁';
    const color = document.getElementById('newCategoryColor').value;
    if (!name) return alert(t('enterCategoryName'));
    try {
        const res = await fetch(`${API}/categories`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name, icon, color })
        });
        const data = await res.json();
        if (data.success) {
            document.getElementById('newCategoryName').value = '';
            document.getElementById('newCategoryIcon').value = '';
            await loadCategories();
            populateCategorySelects();
        } else alert('❌ ' + data.message);
    } catch { alert('❌ ' + t('serverError')); }
}

async function deleteCategory(id) {
    if (!confirm(t('deleteConfirm'))) return;
    try {
        const res = await fetch(`${API}/categories/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            await loadCategories();
            populateCategorySelects();
        } else alert('❌ ' + data.message);
    } catch { alert('❌ ' + t('serverError')); }
}

async function editCategory(id) {
    const cat = categories.find(c => c._id === id);
    if (!cat) return;
    const newName = prompt(t('editCategoryName'), cat.name);
    if (newName === null || newName.trim() === '') return;
    const newIcon = prompt(t('editIcon'), cat.icon || '📁');
    if (newIcon === null) return;
    const newColor = prompt(t('editColor'), cat.color || '#667eea');
    if (newColor === null) return;
    try {
        const res = await fetch(`${API}/categories/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name: newName.trim(), icon: newIcon.trim(), color: newColor.trim() })
        });
        const data = await res.json();
        if (data.success) {
            await loadCategories();
            populateCategorySelects();
        } else alert('❌ ' + data.message);
    } catch { alert('❌ ' + t('serverError')); }
}

// ===== دوال المعاملات =====
async function loadTransactions() {
    try {
        const res = await fetch(`${API}/transactions`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            transactions = data.data;
            renderTransactions(transactions);
        }
    } catch (err) { console.error('خطأ في تحميل المعاملات', err); }
}

async function loadSummary() {
    try {
        const res = await fetch(`${API}/transactions/summary`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            const summary = data.data;
            document.getElementById('totalIncome').textContent = summary.totalIncome.toFixed(0) + ' ' + CURRENCY;
            document.getElementById('totalExpenses').textContent = summary.totalExpenses.toFixed(0) + ' ' + CURRENCY;
            document.getElementById('remainingBudget').textContent = summary.remainingBudget.toFixed(0) + ' ' + CURRENCY;
            document.getElementById('monthlyBudgetDisplay').textContent = summary.monthlyBudget.toFixed(0) + ' ' + CURRENCY;
            document.getElementById('transactionCount').textContent = summary.transactionCount;

            updateBudgetProgress(summary);
            checkBudgetAlert(summary);
            updateCharts(summary.categoryTotals, transactions);
        } else {
            console.error('Error in summary:', data.message);
        }
    } catch (err) {
        console.error('Error loading summary:', err);
    }
}

function updateBudgetProgress(summaryData) {
    const { totalExpenses, monthlyBudget } = summaryData;

    document.getElementById('spentAmount').textContent = totalExpenses.toFixed(0) + ' ' + CURRENCY;
    document.getElementById('budgetAmount').textContent = monthlyBudget.toFixed(0) + ' ' + CURRENCY;

    let percentage = 0;
    if (monthlyBudget > 0) {
        percentage = Math.min((totalExpenses / monthlyBudget) * 100, 100);
    }
    percentage = Math.round(percentage);

    document.getElementById('budgetPercentage').textContent = percentage + '%';

    const progressBar = document.getElementById('budgetProgressBar');
    const progressText = document.getElementById('progressBarText');
    const statusDiv = document.getElementById('progressStatus');

    progressBar.style.width = percentage + '%';
    progressText.textContent = percentage + '%';

    progressBar.classList.remove('low', 'medium', 'high');
    
    if (percentage < 70) {
        progressBar.classList.add('low');
        statusDiv.className = 'progress-status';
        statusDiv.innerHTML = `<i class="fas fa-check-circle"></i> <span>${t('budgetStatusSafe') || 'ضمن الميزانية'}</span>`;
    } else if (percentage < 100) {
        progressBar.classList.add('medium');
        statusDiv.className = 'progress-status warning';
        statusDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> <span>${t('budgetStatusWarning') || 'اقتربت من الحد الأقصى'}</span>`;
    } else {
        progressBar.classList.add('high');
        statusDiv.className = 'progress-status danger';
        statusDiv.innerHTML = `<i class="fas fa-times-circle"></i> <span>${t('budgetStatusDanger') || 'تجاوزت الميزانية!'}</span>`;
    }
}

function checkBudgetAlert(summaryData) {
    const alertDiv = document.getElementById('budgetAlert');
    const alertMsg = document.getElementById('budgetAlertMessage');
    const { totalExpenses, monthlyBudget, isOverBudget } = summaryData;

    if (isOverBudget) {
        const overspent = (totalExpenses - monthlyBudget).toFixed(0);
        alertDiv.style.display = 'flex';
        alertDiv.className = 'budget-alert danger';
        alertMsg.textContent = t('overBudgetAlert', { amount: overspent + ' ' + CURRENCY });
    } else {
        const remaining = (monthlyBudget - totalExpenses).toFixed(0);
        if (remaining < monthlyBudget * 0.2) {
            alertDiv.style.display = 'flex';
            alertDiv.className = 'budget-alert warning';
            alertMsg.textContent = t('budgetWarning', { amount: remaining + ' ' + CURRENCY });
        } else {
            alertDiv.style.display = 'none';
        }
    }
}

async function updateBudget() {
    const current = document.getElementById('monthlyBudgetDisplay').textContent;
    const newBudget = prompt('أدخل الميزانية الشهرية الجديدة:', current);
    if (newBudget === null) return;
    if (newBudget.trim() === '' || isNaN(parseFloat(newBudget)) || parseFloat(newBudget) < 0) {
        return alert(t('enterValidNumber'));
    }
    const val = parseFloat(newBudget);
    try {
        const res = await fetch(`${API}/auth/settings`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ monthlyBudget: val })
        });
        const data = await res.json();
        if (data.success) {
            document.getElementById('monthlyBudgetDisplay').textContent = val.toFixed(0) + ' ' + CURRENCY;
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            user.monthlyBudget = val;
            localStorage.setItem('user', JSON.stringify(user));
            loadSummary();
            alert(t('budgetUpdated'));
        } else {
            alert('❌ ' + data.message);
        }
    } catch { alert('❌ ' + t('serverError')); }
}

async function addTransaction(e) {
    e.preventDefault();
    const desc = document.getElementById('desc').value.trim();
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;
    const type = document.getElementById('type').value;
    if (!desc || !amount || !category) return alert(t('fillAllFields'));

    const submitBtn = document.querySelector('#transactionForm button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '⏳ جاري الإضافة...';

    try {
        if (!navigator.onLine) {
            // ✅ وضع دون اتصال - تخزين محلياً
            const transaction = { description: desc, amount, category, type, date: new Date().toISOString() };
            saveTransactionOffline(transaction);
            alert('💾 تم حفظ المعاملة محلياً. سيتم مزامنتها عند استعادة الاتصال.');
            document.getElementById('transactionForm').reset();
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            return;
        }

        // ✅ وضع الاتصال العادي
        const res = await fetch(`${API}/transactions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ description: desc, amount, category, type })
        });

        const result = await res.json();
        if (result.success) {
            document.getElementById('transactionForm').reset();
            await loadTransactions();
            await loadSummary();
            await loadDashboard();

            if (result.isOverBudget) {
                const overspent = (result.totalExpenses - result.monthlyBudget).toFixed(0);
                const msg = t('overBudgetToast', {
                    budget: result.monthlyBudget.toFixed(0) + ' ' + CURRENCY,
                    amount: overspent + ' ' + CURRENCY
                });
                alert('⚠️ ' + msg);
            }
        } else {
            alert('❌ ' + (result.message || t('serverError')));
        }
    } catch (error) {
        console.error('Error adding transaction:', error);
        // حفظ المعاملة محلياً عند فشل الاتصال
        const transaction = { description: desc, amount, category, type, date: new Date().toISOString() };
        saveTransactionOffline(transaction);
        alert('💾 تم حفظ المعاملة محلياً. سيتم مزامنتها عند استعادة الاتصال.');
        document.getElementById('transactionForm').reset();
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

async function deleteTransaction(id) {
    if (!confirm(t('deleteConfirm'))) return;
    try {
        const res = await fetch(`${API}/transactions/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            await loadTransactions();
            await loadSummary();
        } else alert('❌ ' + data.message);
    } catch { alert('❌ ' + t('serverError')); }
}

function renderTransactions(list) {
    const tbody = document.getElementById('transactionsBody');
    if (!list || list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">${t('noTransactions')}</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(tx => {
        const icon = getIconForCategory(tx.category);
        let displayName = tx.category;
        
        const defaultKeysMap = {
            'طعام': 'Food',
            'مواصلات': 'Transport',
            'كتب': 'Books',
            'مستلزمات': 'Supplies',
            'ترفيه': 'Entertainment',
            'إيجار': 'Rent',
            'فواتير': 'Utilities',
            'صحة': 'Healthcare',
            'أخرى': 'Other'
        };
        let engKey = null;
        for (const [ar, en] of Object.entries(defaultKeysMap)) {
            if (tx.category === ar || tx.category === en) {
                engKey = en;
                break;
            }
        }
        if (!engKey) {
            for (const [en, translated] of Object.entries(t('defaultCategories'))) {
                if (tx.category === translated) {
                    engKey = en;
                    break;
                }
            }
        }
        if (engKey) {
            displayName = t(`defaultCategories.${engKey}`);
        }

        return `
        <tr>
            <td>${tx.description}</td>
            <td style="color:${tx.type === 'income' ? '#48bb78' : '#fc8181'};font-weight:600;">
                ${tx.type === 'income' ? '+' : '-'} ${tx.amount.toFixed(0)} ${CURRENCY}
            </td>
            <td>${icon} ${displayName}</td>
            <td>${tx.type === 'income' ? '💰 ' + t('income') : '💸 ' + t('expense')}</td>
            <td>${formatDate(tx.date)}</td>
            <td>
                <button class="btn btn-delete" onclick="deleteTransaction('${tx._id}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
        `;
    }).join('');
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${year}/${month}/${day} ${hours}:${mins}`;
}

// ===== الرسوم البيانية =====
function updateCharts(categoryTotals, allTransactions) {
    const ctxPie = document.getElementById('expenseChart').getContext('2d');
    if (chartPie) chartPie.destroy();

    const catNames = Object.keys(categoryTotals);
    const catValues = Object.values(categoryTotals);

    if (catNames.length > 0) {
        const translatedLabels = catNames.map(name => {
            const icon = getIconForCategory(name);
            let displayName = name;
            
            const defaultKeysMap = {
                'طعام': 'Food',
                'مواصلات': 'Transport',
                'كتب': 'Books',
                'مستلزمات': 'Supplies',
                'ترفيه': 'Entertainment',
                'إيجار': 'Rent',
                'فواتير': 'Utilities',
                'صحة': 'Healthcare',
                'أخرى': 'Other'
            };
            let engKey = null;
            for (const [ar, en] of Object.entries(defaultKeysMap)) {
                if (name === ar || name === en) {
                    engKey = en;
                    break;
                }
            }
            if (!engKey) {
                for (const [en, translated] of Object.entries(t('defaultCategories'))) {
                    if (name === translated) {
                        engKey = en;
                        break;
                    }
                }
            }
            if (engKey) {
                displayName = t(`defaultCategories.${engKey}`);
            }
            
            return `${icon} ${displayName}`;
        });

        chartPie = new Chart(ctxPie, {
            type: 'doughnut',
            data: {
                labels: translatedLabels,
                datasets: [{
                    data: catValues,
                    backgroundColor: ['#667eea','#48bb78','#fc8181','#f6ad55','#68d391','#9f7aea','#f687b3','#4fd1c5','#ed8936'],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: { size: 13 },
                            padding: 15,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    }
                }
            }
        });
    }

    const ctxTrend = document.getElementById('trendChart').getContext('2d');
    if (chartTrend) chartTrend.destroy();
    
    const today = new Date();
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        last7.push(d.toISOString().split('T')[0]);
    }
    
    const dailyTotals = last7.map(date => {
        const total = allTransactions
            .filter(t => t.type === 'expense' && t.date.startsWith(date))
            .reduce((sum, t) => sum + t.amount, 0);
        return total;
    });
    
    const labels = last7.map(d => {
        const parts = d.split('-');
        return `${parts[1]}/${parts[2]}`;
    });
    
    chartTrend = new Chart(ctxTrend, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: t('dailyExpenses'),
                data: dailyTotals,
                borderColor: '#fc8181',
                backgroundColor: 'rgba(252, 129, 129, 0.1)',
                tension: 0.3,
                fill: true,
                pointBackgroundColor: '#fc8181'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true, position: 'top' }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

// ===== أهداف الادخار =====
let goals = [];
let editingGoalId = null;

async function loadGoals() {
    try {
        const res = await fetch(`${API}/goals`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            goals = data.data;
            renderGoals();
        }
    } catch (err) {
        console.error('Error loading goals:', err);
    }
}

function renderGoals() {
    const container = document.getElementById('goalsList');
    if (!goals.length) {
        container.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:#999;">${t('noGoals') || 'لا توجد أهداف'}</p>`;
        return;
    }

    container.innerHTML = goals.map(g => {
        const progress = g.targetAmount > 0 ? Math.min((g.currentAmount / g.targetAmount) * 100, 100) : 0;
        const isCompleted = g.isCompleted || progress >= 100;
        const daysLeft = Math.ceil((new Date(g.deadline) - new Date()) / (1000 * 60 * 60 * 24));
        const deadlineStr = daysLeft > 0 ? `${daysLeft} ${t('daysLeft') || 'يوم متبقي'}` : t('deadlinePassed') || 'انتهى الموعد';

        return `
        <div class="goal-card ${isCompleted ? 'completed' : ''}" style="border-left-color: ${g.color || '#667eea'}">
            <div class="goal-header">
                <span class="goal-icon">${g.icon || '🎯'}</span>
                <span class="goal-name">${g.name}</span>
            </div>
            <div class="goal-amount">
                <strong>${g.currentAmount.toFixed(0)}</strong> / ${g.targetAmount.toFixed(0)} ${CURRENCY}
            </div>
            <div class="goal-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%; background: ${g.color || '#667eea'};"></div>
                </div>
                <div class="progress-text">
                    <span>${progress.toFixed(0)}%</span>
                    <span>${deadlineStr}</span>
                </div>
            </div>
            <div class="goal-actions">
                <button class="btn btn-add" onclick="addToGoal('${g._id}')">
                    <i class="fas fa-plus"></i> ${t('addAmount') || 'إضافة'}
                </button>
                <button class="btn btn-edit" onclick="editGoal('${g._id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-delete" onclick="deleteGoal('${g._id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        `;
    }).join('');
}

async function addToGoal(goalId) {
    const amount = prompt(t('enterAmount') || 'أدخل المبلغ المراد إضافته:');
    if (amount === null) return;
    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        alert(t('enterValidAmount') || 'يرجى إدخال مبلغ صحيح');
        return;
    }

    try {
        const res = await fetch(`${API}/goals/${goalId}/add-amount`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ amount: parseFloat(amount) })
        });
        const data = await res.json();
        if (data.success) {
            await loadGoals();
            if (data.isCompleted) {
                alert(`🎉 ${t('goalAchieved') || 'تهانينا! لقد حققت هدفك!'}`);
            }
        } else {
            alert('❌ ' + data.message);
        }
    } catch { alert('❌ ' + t('serverError')); }
}

async function createGoal(e) {
    e.preventDefault();
    const name = document.getElementById('goalName').value.trim();
    const targetAmount = parseFloat(document.getElementById('goalTarget').value);
    const deadline = document.getElementById('goalDeadline').value;
    const icon = document.getElementById('goalIcon').value.trim() || '🎯';
    const color = document.getElementById('goalColor').value;

    if (!name || !targetAmount || !deadline) {
        alert(t('fillAllFields') || 'يرجى ملء جميع الحقول');
        return;
    }

    try {
        const res = await fetch(`${API}/goals`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name, targetAmount, deadline, icon, color })
        });
        const data = await res.json();
        if (data.success) {
            closeGoalModal();
            await loadGoals();
            alert('✅ ' + (t('goalCreated') || 'تم إنشاء الهدف بنجاح'));
        } else {
            alert('❌ ' + data.message);
        }
    } catch { alert('❌ ' + t('serverError')); }
}

async function editGoal(goalId) {
    const goal = goals.find(g => g._id === goalId);
    if (!goal) return;

    document.getElementById('goalName').value = goal.name;
    document.getElementById('goalTarget').value = goal.targetAmount;
    document.getElementById('goalDeadline').value = goal.deadline.split('T')[0];
    document.getElementById('goalIcon').value = goal.icon || '🎯';
    document.getElementById('goalColor').value = goal.color || '#667eea';
    editingGoalId = goalId;
    document.getElementById('goalModal').style.display = 'flex';
}

async function deleteGoal(goalId) {
    if (!confirm(t('deleteConfirm') || 'هل أنت متأكد من حذف هذا الهدف؟')) return;
    try {
        const res = await fetch(`${API}/goals/${goalId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            await loadGoals();
        } else {
            alert('❌ ' + data.message);
        }
    } catch { alert('❌ ' + t('serverError')); }
}

function openGoalModal() {
    document.getElementById('goalForm').reset();
    editingGoalId = null;
    document.getElementById('goalModal').style.display = 'flex';
}

function closeGoalModal() {
    document.getElementById('goalModal').style.display = 'none';
}

// ===== تصدير CSV =====
function exportCSV() {
    if (!transactions.length) return alert(t('noDataToExport'));
    const BOM = '\uFEFF';
    let csv = BOM + `${t('description')},${t('amount')},${t('category')},${t('type')},${t('date')}\n`;
    transactions.forEach(tx => {
        const date = formatDate(tx.date);
        const type = tx.type === 'income' ? t('income') : t('expense');
        csv += `"${tx.description}",${tx.amount.toFixed(0)},"${tx.category}","${type}","${date}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ===== تحميل بيانات لوحة التحكم =====
async function loadDashboard() {
    try {
        const res = await fetch(`${API}/transactions/dashboard`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            const d = data.data;
            
            // 1. أعلى فئة إنفاق (مع الترجمة)
            let categoryName = d.topCategory.name || '-';
            if (categoryName !== '-') {
                // محاولة العثور على الترجمة
                const defaultKeysMap = {
                    'طعام': 'Food',
                    'مواصلات': 'Transport',
                    'كتب': 'Books',
                    'مستلزمات': 'Supplies',
                    'ترفيه': 'Entertainment',
                    'إيجار': 'Rent',
                    'فواتير': 'Utilities',
                    'صحة': 'Healthcare',
                    'أخرى': 'Other'
                };
                
                let engKey = null;
                for (const [ar, en] of Object.entries(defaultKeysMap)) {
                    if (categoryName === ar || categoryName === en) {
                        engKey = en;
                        break;
                    }
                }
                if (!engKey) {
                    for (const [en, translated] of Object.entries(t('defaultCategories'))) {
                        if (categoryName === translated) {
                            engKey = en;
                            break;
                        }
                    }
                }
                if (engKey) {
                    categoryName = t(`defaultCategories.${engKey}`);
                }
            }
            document.getElementById('topCategoryName').textContent = categoryName;
            document.getElementById('topCategoryAmount').textContent = 
                d.topCategory.amount > 0 ? `${d.topCategory.amount.toFixed(0)} ${CURRENCY} (${d.topCategory.percentage.toFixed(1)}%)` : `0 ${CURRENCY}`;
            
            // 2. متوسط الإنفاق اليومي
            document.getElementById('dailyAverage').textContent = `${d.dailyAverage.toFixed(0)} ${CURRENCY}`;
            
            // 3. نسبة الادخار
            document.getElementById('savingsRate').textContent = `${d.savingsRate.toFixed(1)}%`;
            const savingsAmount = d.thisMonthIncome - d.thisMonthExpenses;
            document.getElementById('savingsAmount').textContent = `${savingsAmount.toFixed(0)} ${CURRENCY}`;
            
            // 4. الأيام المتبقية
            document.getElementById('daysLeft').textContent = d.daysLeft;
            
            // 5. مقارنة بالشهر الماضي
            const comparisonEl = document.getElementById('comparison');
            const comparisonLabel = document.getElementById('comparisonLabel');
            if (d.comparison > 0) {
                comparisonEl.textContent = `+${d.comparison.toFixed(1)}%`;
                comparisonEl.style.color = '#fc8181';
                comparisonLabel.textContent = t('moreThanLastMonth') || 'أكثر من الشهر الماضي';
            } else if (d.comparison < 0) {
                comparisonEl.textContent = `${d.comparison.toFixed(1)}%`;
                comparisonEl.style.color = '#48bb78';
                comparisonLabel.textContent = t('lessThanLastMonth') || 'أقل من الشهر الماضي';
            } else {
                comparisonEl.textContent = '0%';
                comparisonEl.style.color = '#718096';
                comparisonLabel.textContent = t('sameAsLastMonth') || 'مثل الشهر الماضي';
            }
            
            // 6. أسرع هدف ادخار
            if (d.fastestGoal) {
                document.getElementById('fastestGoalName').textContent = d.fastestGoal.name;
                document.getElementById('fastestGoalProgress').textContent = 
                    `${d.fastestGoal.progress.toFixed(0)}% (${d.fastestGoal.currentAmount.toFixed(0)}/${d.fastestGoal.targetAmount.toFixed(0)} ${CURRENCY})`;
            } else {
                document.getElementById('fastestGoalName').textContent = t('noGoals') || 'لا توجد أهداف';
                document.getElementById('fastestGoalProgress').textContent = '-';
            }
        }
    } catch (err) {
        console.error('Error loading dashboard:', err);
    }
}

// ===== مزامنة دون اتصال =====
async function syncOfflineData() {
    if (navigator.onLine) {
        try {
            const res = await fetch(`${API}/transactions/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    pendingTransactions: JSON.parse(localStorage.getItem('pendingTransactions') || '[]')
                })
            });
            if (res.ok) {
                localStorage.removeItem('pendingTransactions');
                console.log('✅ Offline data synced successfully');
            }
        } catch (error) {
            console.error('❌ Sync failed:', error);
        }
    }
}

// ===== تخزين معاملة مؤقتاً (عند عدم وجود اتصال) =====
function saveTransactionOffline(transaction) {
    const pending = JSON.parse(localStorage.getItem('pendingTransactions') || '[]');
    pending.push({ ...transaction, _id: Date.now(), pending: true });
    localStorage.setItem('pendingTransactions', JSON.stringify(pending));
    console.log('💾 Transaction saved offline');
}

// ===== دالة مساعدة آمنة لـ toFixed =====
function safeToFixed(value, decimals = 0) {
    if (value === undefined || value === null || typeof value !== 'number' || !isFinite(value)) {
        return '0';
    }
    return value.toFixed(decimals);
}

// ===== تحميل التحليلات =====
async function loadAnalytics() {
    const container = document.getElementById('analyticsContainer');
    if (!container) return;

    container.innerHTML = `<p>⏳ جاري تحميل التحليلات...</p>`;

    try {
        const res = await fetch(`${API}/analytics/insights`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success) {
            renderAnalytics(data.data);
        } else {
            container.innerHTML = `
                <div class="analytics-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>${data.message || 'حدث خطأ أثناء تحميل التحليلات'}</p>
                </div>
            `;
        }
    } catch (err) {
        console.error('Error loading analytics:', err);
        container.innerHTML = `
            <div class="analytics-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>حدث خطأ في الاتصال بالخادم</p>
            </div>
        `;
    }
}

// ===== عرض التحليلات =====
function renderAnalytics(analytics) {
    const container = document.getElementById('analyticsContainer');
    if (!container) return;

    if (!analytics || typeof analytics !== 'object') {
        container.innerHTML = `<p style="color:#999;">لا توجد بيانات تحليلية متاحة</p>`;
        return;
    }

    // 1. التوصيات
    let insightsHtml = '';
    if (Array.isArray(analytics.insights) && analytics.insights.length > 0) {
        insightsHtml = analytics.insights.map(i => {
            const type = i.type || 'info';
            const title = i.title || 'توصية';
            const description = i.description || 'لا توجد تفاصيل';
            const action = i.action || 'لا يوجد إجراء مقترح';
            return `
                <div class="insight-card insight-${type}">
                    <div class="insight-header">
                        <span class="insight-icon">${title.split(' ')[0] || '💡'}</span>
                        <span class="insight-title">${title}</span>
                    </div>
                    <p class="insight-description">${description}</p>
                    <div class="insight-action">
                        <i class="fas fa-lightbulb"></i> ${action}
                    </div>
                </div>
            `;
        }).join('');
    } else {
        insightsHtml = `<p style="color:#999;">لا توجد توصيات حالياً</p>`;
    }

    // 2. التنبؤات
    let predictionsHtml = '';
    const predictions = analytics.predictions;
    if (predictions && typeof predictions === 'object') {
        const nextMonthTotal = predictions.nextMonthTotal;
        const confidence = predictions.confidence;
        if (typeof nextMonthTotal === 'number' && isFinite(nextMonthTotal)) {
            const conf = (typeof confidence === 'number' && isFinite(confidence)) ? confidence : 0;
            const trend = predictions.trend === 'increasing' ? '📈 صاعد' :
                          predictions.trend === 'decreasing' ? '📉 هابط' : 'متذبذب';
            predictionsHtml = `
                <div class="prediction-card">
                    <h4>📊 توقع المصروفات للشهر القادم</h4>
                    <div class="prediction-total">
                        <span class="prediction-amount">${safeToFixed(nextMonthTotal)} DZD</span>
                        <span class="prediction-confidence">دقة: ${safeToFixed(conf)}%</span>
                    </div>
                    <div class="prediction-trend">الاتجاه: ${trend}</div>
                </div>
            `;
        }
    }

    // 3. الشذوذ
    let anomaliesHtml = '';
    const anomalies = analytics.anomalies;
    if (Array.isArray(anomalies) && anomalies.length > 0) {
        anomaliesHtml = `
            <div class="anomalies-card">
                <h4>🚨 المعاملات غير الطبيعية</h4>
                ${anomalies.slice(0, 5).map(a => {
                    const desc = a.description || 'معاملة غير معروفة';
                    const amount = (typeof a.amount === 'number' && isFinite(a.amount)) ? a.amount : 0;
                    const reason = a.reason || 'غير محدد';
                    return `
                        <div class="anomaly-item">
                            <span>${desc}</span>
                            <span class="anomaly-amount">${safeToFixed(amount)} DZD</span>
                            <span class="anomaly-reason">${reason}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    // 4. الارتباطات
    let correlationsHtml = '';
    const correlations = analytics.correlations;
    if (Array.isArray(correlations) && correlations.length > 0) {
        correlationsHtml = `
            <div class="correlations-card">
                <h4>🔗 العلاقات بين الفئات</h4>
                ${correlations.slice(0, 3).map(c => {
                    const cat1 = c.category1 || '?';
                    const cat2 = c.category2 || '?';
                    const strength = c.strength || 'ضعيفة';
                    const type = c.type || 'غير معروف';
                    return `
                        <div class="correlation-item">
                            <span>${cat1} ↔ ${cat2}</span>
                            <span class="correlation-strength">${strength}</span>
                            <span class="correlation-type">${type}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    // 5. الملخص
    let summaryHtml = '';
    const summary = analytics.summary;
    if (summary && typeof summary === 'object') {
        const totalExpenses = (typeof summary.totalExpenses === 'number' && isFinite(summary.totalExpenses)) ? summary.totalExpenses : 0;
        const totalIncome = (typeof summary.totalIncome === 'number' && isFinite(summary.totalIncome)) ? summary.totalIncome : 0;
        const transactionCount = summary.transactionCount || 0;
        const avgExpense = (typeof summary.averageExpense === 'number' && isFinite(summary.averageExpense)) ? summary.averageExpense : 0;

        summaryHtml = `
            <div class="summary-card">
                <h4>📋 ملخص سريع</h4>
                <div class="summary-grid">
                    <div><span>المصروفات الكلية</span> <strong>${safeToFixed(totalExpenses)} DZD</strong></div>
                    <div><span>الدخل الكلي</span> <strong>${safeToFixed(totalIncome)} DZD</strong></div>
                    <div><span>عدد المعاملات</span> <strong>${transactionCount}</strong></div>
                    <div><span>متوسط الإنفاق</span> <strong>${safeToFixed(avgExpense)} DZD</strong></div>
                </div>
            </div>
        `;
    }

    container.innerHTML = `
        <div class="analytics-grid">
            <div class="insights-section">${insightsHtml}</div>
            <div class="predictions-section">${predictionsHtml}</div>
            <div class="anomalies-section">${anomaliesHtml}</div>
            <div class="correlations-section">${correlationsHtml}</div>
            <div class="summary-section">${summaryHtml}</div>
        </div>
    `;
}

// ===== التصفية والبحث =====
function filterTransactions() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const category = document.getElementById('filterCategory').value;
    const type = document.getElementById('filterType').value;
    let filtered = transactions;
    if (search) {
        filtered = filtered.filter(t => 
            t.description.toLowerCase().includes(search) ||
            (t.notes && t.notes.toLowerCase().includes(search))
        );
    }
    if (category) filtered = filtered.filter(t => t.category === category);
    if (type) filtered = filtered.filter(t => t.type === type);
    renderTransactions(filtered);
}

// ===== تغيير اللغة =====
function changeLanguage(lang) {
    setLang(lang);
    const html = document.documentElement;
    if (lang === 'ar') {
        html.setAttribute('dir', 'rtl');
        html.setAttribute('lang', 'ar');
    } else {
        html.setAttribute('dir', 'ltr');
        html.setAttribute('lang', lang);
    }
    if (token) {
        updateUserLanguage(lang);
    }
    window.location.reload();
}

// ===== تحميل الإعدادات =====
async function loadSettings() {
    try {
        const res = await fetch(`${API}/auth/settings`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            const settings = data.data;
            document.getElementById('monthlyBudgetDisplay').textContent = settings.monthlyBudget.toFixed(0) + ' ' + CURRENCY;
            if (settings.language && settings.language !== currentLang) {
                setLang(settings.language);
                document.getElementById('langSelector').value = settings.language;
                changeLanguage(settings.language);
            }
        } else {
            console.error('Error loading settings:', data.message);
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// ===== تحديث لغة المستخدم على الخادم =====
async function updateUserLanguage(lang) {
    try {
        const res = await fetch(`${API}/auth/language`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ language: lang })
        });
        const data = await res.json();
        if (data.success) {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            user.language = lang;
            localStorage.setItem('user', JSON.stringify(user));
            console.log(`✅ تم تحديث اللغة على الخادم إلى ${lang}`);
        } else {
            console.error('❌ فشل تحديث اللغة:', data.message);
        }
    } catch (error) {
        console.error('❌ خطأ في تحديث اللغة:', error);
    }
}

// ===== تهيئة التطبيق =====
async function init() {
    const savedLang = localStorage.getItem('lang') || 'ar';
    document.getElementById('langSelector').value = savedLang;
    
    setLang(savedLang);
    const html = document.documentElement;
    if (savedLang === 'ar') {
        html.setAttribute('dir', 'rtl');
        html.setAttribute('lang', 'ar');
    } else {
        html.setAttribute('dir', 'ltr');
        html.setAttribute('lang', savedLang);
    }
    applyTranslations();

    if (token) {
        document.getElementById('app').style.display = 'block';
        document.getElementById('loginPage').style.display = 'none';
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        const userNameElement = document.getElementById('userName');
        const welcomeTranslated = t('welcome');
        userNameElement.innerHTML = `<i class="fas fa-user-circle"></i> ${welcomeTranslated} ${user.name || ''}`;
        
        await loadCategories();
        await loadTransactions();
        await loadSummary();
        await loadSettings();
        await loadGoals();
        await loadDashboard();
        await loadAnalytics();

    } else {
        document.getElementById('app').style.display = 'none';
        document.getElementById('loginPage').style.display = 'block';
    }
}

// ===== ربط الأحداث =====
const loginForm = document.getElementById('loginForm');
if (loginForm) loginForm.addEventListener('submit', (e) => { e.preventDefault(); login(); });

const registerForm = document.getElementById('registerForm');
if (registerForm) registerForm.addEventListener('submit', (e) => { e.preventDefault(); register(); });

const transactionForm = document.getElementById('transactionForm');
if (transactionForm) transactionForm.addEventListener('submit', addTransaction);

const showRegisterBtn = document.getElementById('showRegisterBtn');
if (showRegisterBtn) showRegisterBtn.addEventListener('click', showRegister);

const showLoginBtn = document.getElementById('showLoginBtn');
if (showLoginBtn) showLoginBtn.addEventListener('click', showLogin);

const showRegisterLink = document.getElementById('showRegisterLink');
if (showRegisterLink) showRegisterLink.addEventListener('click', (e) => { e.preventDefault(); showRegister(); });

const showLoginLink = document.getElementById('showLoginLink');
if (showLoginLink) showLoginLink.addEventListener('click', (e) => { e.preventDefault(); showLogin(); });

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) logoutBtn.addEventListener('click', logout);

const searchInput = document.getElementById('searchInput');
if (searchInput) searchInput.addEventListener('input', filterTransactions);

const filterCategory = document.getElementById('filterCategory');
if (filterCategory) filterCategory.addEventListener('change', filterTransactions);

const filterType = document.getElementById('filterType');
if (filterType) filterType.addEventListener('change', filterTransactions);

const exportCSVBtn = document.getElementById('exportCSVBtn');
if (exportCSVBtn) exportCSVBtn.addEventListener('click', exportCSV);

const addCategoryBtn = document.getElementById('addCategoryBtn');
if (addCategoryBtn) addCategoryBtn.addEventListener('click', addCategory);

const langSelector = document.getElementById('langSelector');
if (langSelector) langSelector.addEventListener('change', (e) => {
    changeLanguage(e.target.value);
});

const budgetCard = document.getElementById('budgetCard');
if (budgetCard) budgetCard.addEventListener('click', updateBudget);

// ربط أحداث الأهداف
const addGoalBtn = document.getElementById('addGoalBtn');
if (addGoalBtn) addGoalBtn.addEventListener('click', openGoalModal);

const closeGoalModalBtn = document.getElementById('closeGoalModal');
if (closeGoalModalBtn) closeGoalModalBtn.addEventListener('click', closeGoalModal);

const goalForm = document.getElementById('goalForm');
if (goalForm) goalForm.addEventListener('submit', createGoal);

// التحقق من وجود بيانات غير متزامنة عند بدء التطبيق
const pending = JSON.parse(localStorage.getItem('pendingTransactions') || '[]');
if (pending.length > 0 && navigator.onLine) {
    syncOfflineData();
}

window.addEventListener('click', (e) => {
    const modal = document.getElementById('goalModal');
    if (modal && e.target === modal) closeGoalModal();
});

window.addEventListener('online', () => {
    console.log('🔄 Network connected - syncing offline data');
    syncOfflineData();
});

// بدء التطبيق
init();
