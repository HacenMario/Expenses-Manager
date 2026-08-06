// ===== دالة مساعدة للتحويل الآمن =====
function safeToFixed(value, decimals = 0) {
    if (value === undefined || value === null || typeof value !== 'number' || !isFinite(value)) return '0';
    return value.toFixed(decimals);
}

// ===== تحميل التحليلات =====
async function loadAnalytics() {
    const container = document.getElementById('analyticsContainer');
    if (!container) return;
    container.innerHTML = `<p>⏳ ${t('loadingAnalytics')}</p>`;

    try {
        const res = await fetch(`${API}/analytics/insights`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            renderAnalytics(data.data);
        } else {
            container.innerHTML = `<div class="analytics-error"><i class="fas fa-exclamation-triangle"></i><p>${t('analyticsError')}</p></div>`;
        }
    } catch (err) {
        console.error('Error loading analytics:', err);
        container.innerHTML = `<div class="analytics-error"><i class="fas fa-exclamation-triangle"></i><p>${t('analyticsConnectionError')}</p></div>`;
    }
}

// ===== عرض التحليلات (مع ترجمة ديناميكية) =====
function renderAnalytics(analytics) {
    const container = document.getElementById('analyticsContainer');
    if (!container) return;

    // التحقق من وجود البيانات
    if (!analytics || typeof analytics !== 'object') {
        container.innerHTML = `<p>${t('noAnalyticsData')}</p>`;
        return;
    }

    // ===== 1. التوصيات =====
    let insightsHtml = '';
    if (Array.isArray(analytics.insights) && analytics.insights.length > 0) {
        insightsHtml = analytics.insights.map(i => {
            // ترجمة النص بناءً على القالب
            let title = '';
            let description = '';
            let actionText = '';

            // استخدام الترجمة مع إرسال البيانات
            const data = i.data || {};
            switch (i.template) {
                case 'budget_exceed_forecast':
                    title = t('insight.budget_exceed_forecast.title');
                    description = t('insight.budget_exceed_forecast.desc', {
                        projected: safeToFixed(data.projectedExpense),
                        budget: safeToFixed(data.monthlyBudget),
                        percent: data.percentage
                    });
                    actionText = t('insight.budget_exceed_forecast.action');
                    break;
                case 'budget_forecast':
                    title = t('insight.budget_forecast.title');
                    description = t('insight.budget_forecast.desc', {
                        projected: safeToFixed(data.projectedExpense),
                        budget: safeToFixed(data.monthlyBudget)
                    });
                    actionText = t('insight.budget_forecast.action');
                    break;
                case 'correlation_found':
                    title = t('insight.correlation_found.title');
                    description = t('insight.correlation_found.desc', {
                        cat1: data.category1,
                        cat2: data.category2,
                        strength: t(`strength.${data.strength}`) || data.strength,
                        type: t(`correlationType.${data.type}`) || data.type,
                        corr: safeToFixed(data.correlation, 2)
                    });
                    actionText = t('insight.correlation_found.action');
                    break;
                case 'anomaly_detected':
                    title = t('insight.anomaly_detected.title');
                    description = t('insight.anomaly_detected.desc', {
                        desc: data.description,
                        amount: safeToFixed(data.amount),
                        reason: t(`anomalyReason.${data.reason}`) || data.reason
                    });
                    actionText = t('insight.anomaly_detected.action');
                    break;
                case 'goal_progress':
                    title = t('insight.goal_progress.title');
                    description = t('insight.goal_progress.desc', {
                        name: data.name,
                        progress: safeToFixed(data.progress),
                        remaining: safeToFixed(data.remaining)
                    });
                    actionText = t('insight.goal_progress.action');
                    break;
                case 'spending_behavior':
                    title = t('insight.spending_behavior.title');
                    description = t('insight.spending_behavior.desc', {
                        count: data.count,
                        type: t(`spendingType.${data.type}`) || data.type,
                        avg: safeToFixed(data.avgAmount),
                        category: data.category
                    });
                    actionText = t('insight.spending_behavior.action');
                    break;
                case 'saving_suggestion':
                    title = t('insight.saving_suggestion.title');
                    description = t('insight.saving_suggestion.desc', {
                        category: data.category,
                        percent: safeToFixed(data.percentage),
                        amount: safeToFixed(data.amount),
                        savings: safeToFixed(data.savingsAmount)
                    });
                    actionText = t('insight.saving_suggestion.action');
                    break;
                default:
                    title = i.title || t('insight.general.title');
                    description = i.description || t('insight.general.desc');
                    actionText = i.action || t('insight.general.action');
            }

            return `
                <div class="insight-card insight-${i.type || 'info'}">
                    <div class="insight-header">
                        <span class="insight-icon">${title.split(' ')[0] || '💡'}</span>
                        <span class="insight-title">${title}</span>
                    </div>
                    <p class="insight-description">${description}</p>
                    <div class="insight-action"><i class="fas fa-lightbulb"></i> ${actionText}</div>
                </div>
            `;
        }).join('');
    } else {
        insightsHtml = `<p>${t('noInsights')}</p>`;
    }

    // ===== 2. التنبؤات =====
    let predictionsHtml = '';
    const predictions = analytics.predictions;
    if (predictions && typeof predictions.nextMonthTotal === 'number' && isFinite(predictions.nextMonthTotal)) {
        const total = predictions.nextMonthTotal;
        const conf = (typeof predictions.confidence === 'number' && isFinite(predictions.confidence)) ? predictions.confidence : 0;
        const trend = predictions.trend === 'increasing' ? t('trend.up') : predictions.trend === 'decreasing' ? t('trend.down') : t('trend.stable');
        predictionsHtml = `
            <div class="prediction-card">
                <h4>📊 ${t('prediction.title')}</h4>
                <div class="prediction-total">
                    <span class="prediction-amount">${safeToFixed(total)} DZD</span>
                    <span class="prediction-confidence">${t('prediction.confidence')} ${safeToFixed(conf)}%</span>
                </div>
                <div class="prediction-trend">${t('prediction.trend')} ${trend}</div>
            </div>
        `;
    }

    // ===== 3. الشذوذ =====
    let anomaliesHtml = '';
    const anomalies = analytics.anomalies;
    if (Array.isArray(anomalies) && anomalies.length > 0) {
        anomaliesHtml = `
            <div class="anomalies-card">
                <h4>🚨 ${t('anomalies.title')}</h4>
                ${anomalies.slice(0, 5).map(a => {
                    const desc = a.description || t('anomalies.unknown');
                    const amount = (typeof a.amount === 'number' && isFinite(a.amount)) ? a.amount : 0;
                    const reason = a.reason ? t(`anomalyReason.${a.reason}`) || a.reason : t('anomalies.unknownReason');
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

    // ===== 4. الارتباطات =====
    let correlationsHtml = '';
    const correlations = analytics.correlations;
    if (Array.isArray(correlations) && correlations.length > 0) {
        correlationsHtml = `
            <div class="correlations-card">
                <h4>🔗 ${t('correlations.title')}</h4>
                ${correlations.slice(0, 3).map(c => {
                    const cat1 = c.category1 || '?';
                    const cat2 = c.category2 || '?';
                    const strength = t(`strength.${c.strength}`) || c.strength || t('strength.weak');
                    const type = t(`correlationType.${c.type}`) || c.type || t('correlationType.unknown');
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

    // ===== 5. الملخص =====
    let summaryHtml = '';
    const summary = analytics.summary;
    if (summary && typeof summary === 'object') {
        const totalExpenses = (typeof summary.totalExpenses === 'number' && isFinite(summary.totalExpenses)) ? summary.totalExpenses : 0;
        const totalIncome = (typeof summary.totalIncome === 'number' && isFinite(summary.totalIncome)) ? summary.totalIncome : 0;
        const transactionCount = summary.transactionCount || 0;
        const expenseCount = summary.expenseCount || 0;
        const avgExpense = (typeof summary.averageExpense === 'number' && isFinite(summary.averageExpense)) ? summary.averageExpense : 0;

        summaryHtml = `
            <div class="summary-card">
                <h4>📋 ${t('summary.title')}</h4>
                <div class="summary-grid">
                    <div><span>${t('summary.totalExpenses')}</span> <strong>${safeToFixed(totalExpenses)} DZD</strong></div>
                    <div><span>${t('summary.totalIncome')}</span> <strong>${safeToFixed(totalIncome)} DZD</strong></div>
                    <div><span>${t('summary.transactionCount')}</span> <strong>${transactionCount}</strong></div>
                    <div><span>${t('summary.expenseCount')}</span> <strong>${expenseCount}</strong></div>
                    <div><span>${t('summary.averageExpense')}</span> <strong>${safeToFixed(avgExpense)} DZD</strong></div>
                </div>
            </div>
        `;
    }

    // ===== تجميع الكل =====
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
