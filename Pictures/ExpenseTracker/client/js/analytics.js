// ===== دوال مساعدة آمنة =====
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
        const token = localStorage.getItem('token');
        if (!token) {
            container.innerHTML = `<div class="analytics-error"><i class="fas fa-exclamation-triangle"></i><p>${t('loginRequired')}</p></div>`;
            return;
        }

        const res = await fetch(`${API}/analytics/insights`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
            return;
        }

        const data = await res.json();
        if (data.success) {
            renderAnalytics(data.data);
        } else {
            container.innerHTML = `<div class="analytics-error"><i class="fas fa-exclamation-triangle"></i><p>${data.message || t('analyticsError')}</p></div>`;
        }
    } catch (err) {
        console.error('Error loading analytics:', err);
        container.innerHTML = `<div class="analytics-error"><i class="fas fa-exclamation-triangle"></i><p>${t('analyticsConnectionError')}</p></div>`;
    }
}

// ===== عرض التحليلات =====
function renderAnalytics(analytics) {
    const container = document.getElementById('analyticsContainer');
    if (!container) return;
    if (!analytics || typeof analytics !== 'object') {
        container.innerHTML = `<p>${t('noAnalyticsData')}</p>`;
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
                    title = t('insight.budget_exceed_forecast.title');
                    description = t('insight.budget_exceed_forecast.desc', {
                        projected: safeToFixed(d.projectedExpense),
                        budget: safeToFixed(d.monthlyBudget),
                        percent: d.percentage || '0'
                    });
                    action = t('insight.budget_exceed_forecast.action');
                    break;
                case 'budget_forecast':
                    title = t('insight.budget_forecast.title');
                    description = t('insight.budget_forecast.desc', {
                        projected: safeToFixed(d.projectedExpense),
                        budget: safeToFixed(d.monthlyBudget)
                    });
                    action = t('insight.budget_forecast.action');
                    break;
                case 'correlation_found':
                    title = t('insight.correlation_found.title');
                    description = t('insight.correlation_found.desc', {
                        cat1: d.category1 || '?',
                        cat2: d.category2 || '?',
                        strength: t(`strength.${d.strength}`) || d.strength,
                        type: t(`correlationType.${d.type}`) || d.type,
                        corr: safeToFixed(d.correlation, 2)
                    });
                    action = t('insight.correlation_found.action');
                    break;
                case 'anomaly_detected':
                    title = t('insight.anomaly_detected.title');
                    description = t('insight.anomaly_detected.desc', {
                        desc: d.description || 'Unknown',
                        amount: safeToFixed(d.amount),
                        reason: t(`anomalyReason.${d.reason}`) || d.reason
                    });
                    action = t('insight.anomaly_detected.action');
                    break;
                case 'goal_progress':
                    title = t('insight.goal_progress.title');
                    description = t('insight.goal_progress.desc', {
                        name: d.name || 'Goal',
                        progress: safeToFixed(d.progress),
                        remaining: safeToFixed(d.remaining)
                    });
                    action = t('insight.goal_progress.action');
                    break;
                case 'spending_behavior':
                    title = t('insight.spending_behavior.title');
                    description = t('insight.spending_behavior.desc', {
                        count: d.count || 0,
                        type: t(`spendingType.${d.type}`) || d.type,
                        avg: safeToFixed(d.avgAmount),
                        category: d.category || 'Other'
                    });
                    action = t('insight.spending_behavior.action');
                    break;
                case 'saving_suggestion':
                    title = t('insight.saving_suggestion.title');
                    description = t('insight.saving_suggestion.desc', {
                        category: d.category || 'Other',
                        percent: safeToFixed(d.percentage),
                        amount: safeToFixed(d.amount),
                        savings: safeToFixed(d.savingsAmount)
                    });
                    action = t('insight.saving_suggestion.action');
                    break;
                default:
                    title = '💡 ' + t('insight.general.title');
                    description = t('insight.general.desc');
                    action = t('insight.general.action');
            }

            return `
                <div class="insight-card insight-${i.type || 'info'}">
                    <div class="insight-header">
                        <span class="insight-title">${title}</span>
                    </div>
                    <p class="insight-description">${description}</p>
                    <div class="insight-action"><i class="fas fa-lightbulb"></i> ${action}</div>
                </div>
            `;
        }).join('');
    } else {
        insightsHtml = `<p style="color:#999;">${t('noInsights')}</p>`;
    }

    // ===== 2. التنبؤات =====
    let predictionsHtml = '';
    const p = analytics.predictions;
    if (p && typeof p.nextMonthTotal === 'number' && isFinite(p.nextMonthTotal) && p.nextMonthTotal > 0) {
        predictionsHtml = `
            <div class="prediction-card">
                <h4>📊 ${t('prediction.title')}</h4>
                <div class="prediction-total">
                    <span class="prediction-amount">${safeToFixed(p.nextMonthTotal)} DZD</span>
                    <span class="prediction-confidence">${t('prediction.confidence')} ${safeToFixed(p.confidence)}%</span>
                </div>
                <div class="prediction-trend">${t('prediction.trend')} ${t(`trend.${p.trend}`) || p.trend}</div>
            </div>
        `;
    }

    // ===== 3. الشذوذ =====
    let anomaliesHtml = '';
    const a = analytics.anomalies;
    if (Array.isArray(a) && a.length > 0 && !a.message) {
        anomaliesHtml = `
            <div class="anomalies-card">
                <h4>🚨 ${t('anomalies.title')}</h4>
                ${a.slice(0, 5).map(item => `
                    <div class="anomaly-item">
                        <span>${item.description || t('anomalies.unknown')}</span>
                        <span class="anomaly-amount">${safeToFixed(item.amount)} DZD</span>
                        <span class="anomaly-reason">${t(`anomalyReason.${item.reason}`) || item.reason}</span>
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
                <h4>🔗 ${t('correlations.title')}</h4>
                ${c.slice(0, 3).map(item => `
                    <div class="correlation-item">
                        <span>${item.category1 || '?'} ↔ ${item.category2 || '?'}</span>
                        <span class="correlation-strength">${t(`strength.${item.strength}`) || item.strength}</span>
                        <span class="correlation-type">${t(`correlationType.${item.type}`) || item.type}</span>
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
                <h4>📋 ${t('summary.title')}</h4>
                <div class="summary-grid">
                    <div><span>${t('summary.totalExpenses')}</span> <strong>${safeToFixed(s.totalExpenses)} DZD</strong></div>
                    <div><span>${t('summary.totalIncome')}</span> <strong>${safeToFixed(s.totalIncome)} DZD</strong></div>
                    <div><span>${t('summary.transactionCount')}</span> <strong>${s.transactionCount || 0}</strong></div>
                    <div><span>${t('summary.expenseCount')}</span> <strong>${s.expenseCount || 0}</strong></div>
                    <div><span>${t('summary.averageExpense')}</span> <strong>${safeToFixed(s.averageExpense)} DZD</strong></div>
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

// جعل الدوال متاحة في النطاق العام
window.loadAnalytics = loadAnalytics;
window.renderAnalytics = renderAnalytics;
