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

// ===== استرجاع أيقونة الفئة (تدعم الأسماء المترجمة) =====
function getIconForCategory(categoryName) {
    // 1. البحث في الفئات المخصصة (المستخدم)
    const customCat = categories.find(c => c.name === categoryName);
    if (customCat && customCat.icon) {
        return customCat.icon;
    }
    
    // 2. البحث في الفئات الافتراضية (باستخدام الترجمة العكسية)
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
    
    // نحاول العثور على المفتاح الإنجليزي من الاسم الحالي
    let engKey = null;
    
    // أولاً: نبحث مباشرة في المفاتيح الإنجليزية
    if (DEFAULT_CATEGORY_ICONS[categoryName]) {
        return DEFAULT_CATEGORY_ICONS[categoryName];
    }
    
    // ثانياً: نبحث في خريطة الترجمة (عربي -> إنجليزي)
    for (const [ar, en] of Object.entries(defaultKeysMap)) {
        if (categoryName === ar || categoryName === en) {
            engKey = en;
            break;
        }
    }
    
    // ثالثاً: نبحث عن الترجمة الحالية في defaultCategories من ملف languages.js
    if (!engKey) {
        for (const [en, translated] of Object.entries(t('defaultCategories'))) {
            if (categoryName === translated) {
                engKey = en;
                break;
            }
        }
    }
    
    if (engKey && DEFAULT_CATEGORY_ICONS[engKey]) {
        return DEFAULT_CATEGORY_ICONS[engKey];
    }
    
    return '📁'; // أيقونة افتراضية
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
    const currentVal = select.value;
    select.innerHTML = `<option value="">${t('selectCategory')}</option>`;
    
    // الفئات المخصصة
    categories.forEach(c => {
        select.innerHTML += `<option value="${c.name}">${c.icon || '📁'} ${c.name}</option>`;
    });
    
    // الفئات الافتراضية مع أيقوناتها
    const defaultKeys = ['Food', 'Transport', 'Books', 'Supplies', 'Entertainment', 'Rent', 'Utilities', 'Healthcare', 'Other'];
    defaultKeys.forEach(key => {
        const translatedName = t(`defaultCategories.${key}`);
        // نضيفها فقط إذا لم تكن موجودة في الفئات المخصصة
        if (!categories.some(c => c.name === translatedName)) {
            const icon = DEFAULT_CATEGORY_ICONS[key] || '📁';
            select.innerHTML += `<option value="${translatedName}">${icon} ${translatedName}</option>`;
        }
    });
    
    if (currentVal) select.value = currentVal;

    // نفس الشيء لقائمة التصفية
    const filterSelect = document.getElementById('filterCategory');
    const filterVal = filterSelect.value;
    filterSelect.innerHTML = `<option value="">${t('allCategories')}</option>`;
    
    categories.forEach(c => {
        filterSelect.innerHTML += `<option value="${c.name}">${c.icon || '📁'} ${c.name}</option>`;
    });
    
    defaultKeys.forEach(key => {
        const translatedName = t(`defaultCategories.${key}`);
        if (!categories.some(c => c.name === translatedName)) {
            const icon = DEFAULT_CATEGORY_ICONS[key] || '📁';
            filterSelect.innerHTML += `<option value="${translatedName}">${icon} ${translatedName}</option>`;
        }
    });
    
    if (filterVal) filterSelect.value = filterVal;
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

// ===== تحميل الملخص (مع تحديث التحذير) =====
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

            // ===== تحديث شريط تقدم الميزانية (إضافة جديدة) =====
            updateBudgetProgress(summary);

            // تحديث التحذير (هام)
            checkBudgetAlert(summary);
            // تحديث الرسوم البيانية
            updateCharts(summary.categoryTotals, transactions);
        } else {
            console.error('Error in summary:', data.message);
        }
    } catch (err) {
        console.error('Error loading summary:', err);
    }
}

// ===== تحديث شريط تقدم الميزانية =====
function updateBudgetProgress(summaryData) {
    const { totalExpenses, monthlyBudget } = summaryData;

    // تحديث الأرقام
    document.getElementById('spentAmount').textContent = totalExpenses.toFixed(0) + ' ' + CURRENCY;
    document.getElementById('budgetAmount').textContent = monthlyBudget.toFixed(0) + ' ' + CURRENCY;

    // حساب النسبة المئوية
    let percentage = 0;
    if (monthlyBudget > 0) {
        percentage = Math.min((totalExpenses / monthlyBudget) * 100, 100);
    }
    percentage = Math.round(percentage);

    // تحديث النسبة المعروضة
    document.getElementById('budgetPercentage').textContent = percentage + '%';

    // تحديث شريط التقدم
    const progressBar = document.getElementById('budgetProgressBar');
    const progressText = document.getElementById('progressBarText');
    const statusDiv = document.getElementById('progressStatus');

    progressBar.style.width = percentage + '%';
    progressText.textContent = percentage + '%';

    // تحديث اللون والحالة حسب النسبة
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

// ===== التحقق من الميزانية (مع تحديث واجهة التحذير) =====
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

// ===== تحديث الميزانية =====
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

// ===== إضافة معاملة =====
async function addTransaction(e) {
    e.preventDefault();
    const desc = document.getElementById('desc').value.trim();
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;
    const type = document.getElementById('type').value;
    if (!desc || !amount || !category) return alert(t('fillAllFields'));

    // تعطيل الزر مؤقتاً لمنع النقر المتكرر
    const submitBtn = document.querySelector('#transactionForm button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '⏳ جاري الإضافة...';

    try {
        const res = await fetch(`${API}/transactions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ description: desc, amount, category, type })
        });

        // قراءة الرد (حتى لو كان خطأ)
        const result = await res.json();

        if (result.success) {
            // إعادة تعيين النموذج
            document.getElementById('transactionForm').reset();

            // تحديث البيانات (الجدول، الإحصائيات، التحذير)
            await loadTransactions();
            await loadSummary();

            // عرض تحذير فوري إذا تم التجاوز
            if (result.isOverBudget) {
                const overspent = (result.totalExpenses - result.monthlyBudget).toFixed(0);
                const msg = t('overBudgetToast', {
                    budget: result.monthlyBudget.toFixed(0) + ' ' + CURRENCY,
                    amount: overspent + ' ' + CURRENCY
                });
                alert('⚠️ ' + msg);
                // تحديث التحذير في الصفحة (ستقوم loadSummary بالاتصال بـ checkBudgetAlert)
            }
        } else {
            alert('❌ ' + (result.message || t('serverError')));
        }
    } catch (error) {
        console.error('Error adding transaction:', error);
        alert('❌ ' + t('serverError'));
    } finally {
        // إعادة تمكين الزر
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

// ===== عرض الجدول =====
function renderTransactions(list) {
    const tbody = document.getElementById('transactionsBody');
    if (!list || list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">${t('noTransactions')}</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(tx => {
        const icon = getIconForCategory(tx.category);
        let displayName = tx.category;
        
        // ترجمة اسم الفئة إذا كانت افتراضية
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
        // إذا لم نجد، نبحث في الترجمة الحالية
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
    // ===== الرسم البياني الدائري (مع الأيقونات) =====
    const ctxPie = document.getElementById('expenseChart').getContext('2d');
    if (chartPie) chartPie.destroy();

    const catNames = Object.keys(categoryTotals);
    const catValues = Object.values(categoryTotals);

    if (catNames.length > 0) {
        // إنشاء تسميات مع الأيقونات
        const translatedLabels = catNames.map(name => {
            // الحصول على الأيقونة المناسبة
            const icon = getIconForCategory(name);
            // الحصول على الاسم المترجم
            let displayName = name;
            
            // محاولة ترجمة الاسم إذا كان من الفئات الافتراضية
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
                // البحث في الترجمة الحالية
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
            
            // إرجاع التسمية مع الأيقونة
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

    // ===== الرسم البياني الخطي (بدون تغيير) =====
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
    // حفظ اللغة في localStorage
    setLang(lang);
    
    // تغيير اتجاه الصفحة حسب اللغة
    const html = document.documentElement;
    if (lang === 'ar') {
        html.setAttribute('dir', 'rtl');
        html.setAttribute('lang', 'ar');
    } else {
        html.setAttribute('dir', 'ltr');
        html.setAttribute('lang', lang);
    }
    
    // حفظ اللغة في localStorage للمستخدم (إذا كان مسجلاً)
    if (token) {
        updateUserLanguage(lang);
    }
    
    // إعادة تحميل الصفحة لتطبيق جميع التغييرات
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

// ===== متغيرات الأهداف =====
let goals = [];
let editingGoalId = null;

// ===== تحميل الأهداف =====
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

// ===== عرض الأهداف =====
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

// ===== إضافة مبلغ إلى الهدف =====
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

// ===== إنشاء هدف جديد =====
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

// ===== تعديل هدف =====
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

// ===== حذف هدف =====
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

// ===== فتح/إغلاق النافذة المنبثقة =====
function openGoalModal() {
    document.getElementById('goalForm').reset();
    editingGoalId = null;
    document.getElementById('goalModal').style.display = 'flex';
}

function closeGoalModal() {
    document.getElementById('goalModal').style.display = 'none';
}

// ===== ربط الأحداث =====
document.getElementById('addGoalBtn').addEventListener('click', openGoalModal);
document.getElementById('closeGoalModal').addEventListener('click', closeGoalModal);
document.getElementById('goalForm').addEventListener('submit', createGoal);
window.addEventListener('click', (e) => {
    if (e.target === document.getElementById('goalModal')) closeGoalModal();
});

// ===== تهيئة التطبيق =====
async function init() {
    // قراءة اللغة المخزنة
    const savedLang = localStorage.getItem('lang') || 'ar';
    document.getElementById('langSelector').value = savedLang;
    
    // تطبيق اللغة (بدون إعادة تحميل لأننا في بداية التشغيل)
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
        
        // تعيين اسم المستخدم مع الترجمة
        const userNameElement = document.getElementById('userName');
        const welcomeTranslated = t('welcome');
        userNameElement.innerHTML = `<i class="fas fa-user-circle"></i> ${welcomeTranslated} ${user.name || ''}`;
        
        await loadCategories();
        await loadGoals();
        await loadTransactions();
        await loadSummary();
        await loadSettings();
    } else {
        document.getElementById('app').style.display = 'none';
        document.getElementById('loginPage').style.display = 'block';
    }
}

// ===== ربط الأحداث (مع التحقق من وجود العناصر) =====
const loginForm = document.getElementById('loginForm');
if (loginForm) loginForm.addEventListener('submit', (e) => { e.preventDefault(); login(); });

const registerForm = document.getElementById('registerForm');
if (registerForm) registerForm.addEventListener('submit', (e) => { e.preventDefault(); register(); });

const transactionForm = document.getElementById('transactionForm');
if (transactionForm) transactionForm.addEventListener('submit', addTransaction);

// أزرار التنقل بين تسجيل الدخول والتسجيل (الجديدة)
const showRegisterBtn = document.getElementById('showRegisterBtn');
if (showRegisterBtn) showRegisterBtn.addEventListener('click', showRegister);

const showLoginBtn = document.getElementById('showLoginBtn');
if (showLoginBtn) showLoginBtn.addEventListener('click', showLogin);

// الروابط النصية القديمة (للتوافق مع الإصدارات السابقة)
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

// بدء التطبيق
init();
