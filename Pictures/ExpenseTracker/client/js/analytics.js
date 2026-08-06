// ===== دوال مساعدة آمنة =====
function safeToFixed(value, decimals = 0) {
    if (value === undefined || value === null || typeof value !== 'number' || !isFinite(value) || isNaN(value)) return '0';
    return value.toFixed(decimals);
}

// ===== تحميل التحليلات =====
async function loadAnalytics() {
    const container = document.getElementById('analyticsContainer');
    if (!container) {
        console.warn('⚠️ analyticsContainer not found');
        return;
    }
    
    // عرض رسالة تحميل
    container.innerHTML = `<p style="color: var(--text-muted, #718096);">⏳ ${t('loadingAnalytics') || 'جاري تحميل التحليلات...'}</p>`;

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            container.innerHTML = `<div class="analytics-error"><i class="fas fa-exclamation-triangle"></i><p>${t('loginRequired') || 'يرجى تسجيل الدخول'}</p></div>`;
            return;
        }

        const response = await fetch(`${API}/analytics/insights`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            container.innerHTML = `<div class="analytics-error"><i class="fas fa-exclamation-triangle"></i><p>${t('sessionExpired') || 'انتهت الجلسة، جاري إعادة التوجيه...'}</p></div>`;
            setTimeout(() => { window.location.href = '/'; }, 2000);
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success) {
            renderAnalytics(data.data);
        } else {
            container.innerHTML = `<div class="analytics-error"><i class="fas fa-exclamation-triangle"></i><p>${data.message || t('analyticsError') || 'حدث خطأ'}</p></div>`;
        }
    } catch (err) {
        console.error('❌ Analytics error:', err);
        container.innerHTML = `<div class="analytics-error"><i class="fas fa-exclamation-triangle"></i><p>${t('analyticsConnectionError') || 'خطأ في الاتصال بالخادم'}</p></div>`;
    }
}

// ===== عرض التحليلات =====
function renderAnalytics(analytics) {
    const container = document.getElementById('analyticsContainer');
    if (!container) return;

    if (!analytics || typeof analytics !== 'object') {
        container.innerHTML = `<p style="color: var(--text-muted, #718096);">${t('noAnalyticsData') || 'لا توجد بيانات تحليلية'}</p>`;
        return;
    }

    // ===== 1. التوصيات =====
    let insightsHtml = '';
    if (Array.isArray(analytics.insights) && analytics.insights.length > 0) {
        insightsHtml = analytics.insights.map(i => {
            let title = '', description = '', action = '';
            const d = i.data || {};

            switch (i.template) {
                case 'budget_exceed_forecast':
                    title = t('insight.budget_exceed_forecast.title') || '⚠️ تحذير: توقع تجاوز الميزانية';
                    description = (t('insight.budget_exceed_forecast.desc') || 'من المتوقع أن تنفق {projected} DZD الشهر القادم، متجاوزاً ميزانيتك ({budget} DZD) بنسبة {percent}%')
                        .replace(/{projected}/g, safeToFixed(d.projectedExpense))
                        .replace(/{budget}/g, safeToFixed(d.monthlyBudget))
                        .replace(/{percent}/g, d.percentage || '0');
                    action = t('insight.budget_exceed_forecast.action') || 'فكر في تقليل النفقات غير الضرورية';
                    break;
                case 'budget_forecast':
                    title = t('insight.budget_forecast.title') || '📊 توقع المصروفات';
                    description = (t('insight.budget_forecast.desc') || 'من المتوقع أن تنفق {projected} DZD الشهر القادم، ضمن ميزانيتك ({budget} DZD)')
                        .replace(/{projected}/g, safeToFixed(d.projectedExpense))
                        .replace(/{budget}/g, safeToFixed(d.monthlyBudget));
                    action = t('insight.budget_forecast.action') || 'استمر في الإنفاق الحكيم';
                    break;
                case 'correlation_found':
                    title = t('insight.correlation_found.title') || '🔗 علاقة بين الفئات';
                    description = (t('insight.correlation_found.desc') || 'علاقة {strength} {type} بين "{cat1}" و "{cat2}" (معامل الارتباط: {corr})')
                        .replace(/{cat1}/g, d.category1 || '?')
                        .replace(/{cat2}/g, d.category2 || '?')
                        .replace(/{strength}/g, t(`strength.${d.strength}`) || d.strength || 'ضعيفة')
                        .replace(/{type}/g, t(`correlationType.${d.type}`) || d.type || 'غير معروف')
                        .replace(/{corr}/g, safeToFixed(d.correlation, 2));
                    action = t('insight.correlation_found.action') || 'راقب هاتين الفئتين معاً';
                    break;
                case 'anomaly_detected':
                    title = t('insight.anomaly_detected.title') || '🚨 نفقة غير معتادة';
                    description = (t('insight.anomaly_detected.desc') || 'معاملة غير عادية: "{desc}" بقيمة {amount} DZD ({reason})')
                        .replace(/{desc}/g, d.description || 'غير معروف')
                        .replace(/{amount}/g, safeToFixed(d.amount))
                        .replace(/{reason}/g, t(`anomalyReason.${d.reason}`) || d.reason || 'غير محدد');
                    action = t('insight.anomaly_detected.action') || 'تأكد من صحة هذه المعاملة';
                    break;
                case 'goal_progress':
                    title = t('insight.goal_progress.title') || '🎯 تقدم هدف الادخار';
                    description = (t('insight.goal_progress.desc') || '{name}: {progress}% من الهدف ({remaining} DZD متبقية)')
                        .replace(/{name}/g, d.name || 'هدف')
                        .replace(/{progress}/g, safeToFixed(d.progress))
                        .replace(/{remaining}/g, safeToFixed(d.remaining));
                    action = t('insight.goal_progress.action') || 'أنت على وشك تحقيق هدفك!';
                    break;
                case 'spending_behavior':
                    title = t('insight.spending_behavior.title') || '📈 نمط الإنفاق';
                    description = (t('insight.spending_behavior.desc') || 'معظم إنفاقك ({count} معاملة) هو {type} بمتوسط {avg} DZD في "{category}"')
                        .replace(/{count}/g, d.count || 0)
                        .replace(/{type}/g, t(`spendingType.${d.type}`) || d.type || 'متوسط')
                        .replace(/{avg}/g, safeToFixed(d.avgAmount))
                        .replace(/{category}/g, d.category || 'أخرى');
                    action = t('insight.spending_behavior.action') || 'راجع هذه المعاملات لتوفير المزيد';
                    break;
                case 'saving_suggestion':
                    title = t('insight.saving_suggestion.title') || '💡 اقتراح توفير';
                    description = (t('insight.saving_suggestion.desc') || 'فئة "{category}" تشكل {percent}% من مصروفاتك ({amount} DZD)')
                        .replace(/{category}/g, d.category || 'أخرى')
                        .replace(/{percent}/g, safeToFixed(d.percentage))
                        .replace(/{amount}/g, safeToFixed(d.amount));
                    action = (t('insight.saving_suggestion.action') || 'خفّض الإنفاق على "{category}" بنسبة 10% لتوفير {savings} DZD شهرياً')
                        .replace(/{category}/g, d.category || 'أخرى')
                        .replace(/{savings}/g, safeToFixed(d.savingsAmount));
                    break;
                default:
                    title = '💡 ' + (t('insight.general.title') || 'توصية');
                    description = t('insight.general.desc') || 'تحليل مخصص بناءً على بياناتك';
                    action = t('insight.general.action') || 'تابع مراقبة مصروفاتك';
            }

            const typeClass = i.type || 'info';
            return `
                <div class="insight-card insight-${typeClass}">
                    <div class="insight-header">
                        <span class="insight-title">${title}</span>
                    </div>
                    <p class="insight-description">${description}</p>
                    <div class="insight-action"><i class="fas fa-lightbulb"></i> ${action}</div>
                </div>
            `;
        }).join('');
    } else {
        insightsHtml = `<p style="color: var(--text-muted, #718096);">${t('noInsights') || 'لا توجد توصيات حالياً'}</p>`;
    }

    // ===== 2. التنبؤات =====
    let predictionsHtml = '';
    const p = analytics.predictions;
    if (p && typeof p.nextMonthTotal === 'number' && isFinite(p.nextMonthTotal) && p.nextMonthTotal > 0) {
        const confidence = typeof p.confidence === 'number' && isFinite(p.confidence) ? p.confidence : 0;
        const trend = t(`trend.${p.trend}`) || p.trend || 'متذبذب';
        predictionsHtml = `
            <div class="prediction-card">
                <h4>📊 ${t('prediction.title') || 'توقع المصروفات للشهر القادم'}</h4>
                <div class="prediction-total">
                    <span class="prediction-amount">${safeToFixed(p.nextMonthTotal)} DZD</span>
                    <span class="prediction-confidence">${t('prediction.confidence') || 'الدقة:'} ${safeToFixed(confidence)}%</span>
                </div>
                <div class="prediction-trend">${t('prediction.trend') || 'الاتجاه:'} ${trend}</div>
            </div>
        `;
    }

    // ===== 3. الشذوذ =====
    let anomaliesHtml = '';
    const a = analytics.anomalies;
    if (Array.isArray(a) && a.length > 0 && !a.message) {
        anomaliesHtml = `
            <div class="anomalies-card">
                <h4>🚨 ${t('anomalies.title') || 'المعاملات غير الطبيعية'}</h4>
                ${a.slice(0, 5).map(item => `
                    <div class="anomaly-item">
                        <span>${item.description || t('anomalies.unknown') || 'غير معروف'}</span>
                        <span class="anomaly-amount">${safeToFixed(item.amount)} DZD</span>
                        <span class="anomaly-reason">${t(`anomalyReason.${item.reason}`) || item.reason || 'غير محدد'}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // ===== 4. الارتباطات =====
    let correlationsHtml = '';
    const c = analytics.correlations;
    if (Array.isArray(c) && c.length > 0 && !c.message) {
        correlationsHtml = `
            <div class="correlations-card">
                <h4>🔗 ${t('correlations.title') || 'العلاقات بين الفئات'}</h4>
                ${c.slice(0, 3).map(item => `
                    <div class="correlation-item">
                        <span>${item.category1 || '?'} ↔ ${item.category2 || '?'}</span>
                        <span class="correlation-strength">${t(`strength.${item.strength}`) || item.strength || 'ضعيفة'}</span>
                        <span class="correlation-type">${t(`correlationType.${item.type}`) || item.type || 'غير معروف'}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // ===== 5. الملخص =====
    let summaryHtml = '';
    const s = analytics.summary;
    if (s && typeof s === 'object') {
        summaryHtml = `
            <div class="summary-card">
                <h4>📋 ${t('summary.title') || 'ملخص سريع'}</h4>
                <div class="summary-grid">
                    <div><span>${t('summary.totalExpenses') || 'المصروفات الكلية'}</span> <strong>${safeToFixed(s.totalExpenses)} DZD</strong></div>
                    <div><span>${t('summary.totalIncome') || 'الدخل الكلي'}</span> <strong>${safeToFixed(s.totalIncome)} DZD</strong></div>
                    <div><span>${t('summary.transactionCount') || 'عدد المعاملات'}</span> <strong>${s.transactionCount || 0}</strong></div>
                    <div><span>${t('summary.expenseCount') || 'عدد معاملات المصروف'}</span> <strong>${s.expenseCount || 0}</strong></div>
                    <div><span>${t('summary.averageExpense') || 'متوسط الإنفاق لكل معاملة'}</span> <strong>${safeToFixed(s.averageExpense)} DZD</strong></div>
                </div>
            </div>
        `;
    }

    // ===== تجميع =====
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

// ===== جعل الدوال متاحة في النطاق العام =====
window.loadAnalytics = loadAnalytics;
window.renderAnalytics = renderAnalytics;
window.safeToFixed = safeToFixed;

console.log('📊 Analytics module loaded');
