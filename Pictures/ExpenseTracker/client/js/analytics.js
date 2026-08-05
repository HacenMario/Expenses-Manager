// ===== دالة مساعدة للتحويل الآمن إلى عدد مع منازل عشرية =====
function safeToFixed(value, decimals = 0) {
    // إذا كانت القيمة غير معرفة أو فارغة أو ليست رقمًا صحيحًا، نعيد "0"
    if (value === undefined || value === null || typeof value !== 'number' || !isFinite(value)) {
        return '0';
    }
    return value.toFixed(decimals);
}

// ===== تحميل التحليلات =====
async function loadAnalytics() {
    const container = document.getElementById('analyticsContainer');
    if (!container) return;

    // عرض رسالة تحميل
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

// ===== عرض التحليلات (نسخة آمنة تماماً) =====
function renderAnalytics(analytics) {
    const container = document.getElementById('analyticsContainer');
    if (!container) return;

    if (!analytics || typeof analytics !== 'object') {
        container.innerHTML = `<p style="color:#999;">${t('noAnalyticsData')}</p>`;
        return;
    }

    // ===== 1. التوصيات =====
    let insightsHtml = '';
    if (Array.isArray(analytics.insights) && analytics.insights.length > 0) {
        insightsHtml = analytics.insights.map(i => {
            const type = i.type || 'info';
            const title = i.title || t('noInsights');
            const description = i.description || '';
            const action = i.action || '';
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
        insightsHtml = `<p style="color:#999;">${t('noInsights')}</p>`;
    }

    // ===== 2. التنبؤات =====
    let predictionsHtml = '';
    const predictions = analytics.predictions;
    if (predictions && typeof predictions === 'object') {
        const nextMonthTotal = predictions.nextMonthTotal;
        if (typeof nextMonthTotal === 'number' && isFinite(nextMonthTotal)) {
            const conf = (typeof predictions.confidence === 'number' && isFinite(predictions.confidence)) ? predictions.confidence : 0;
            const trend = predictions.trend === 'increasing' ? t('trendUp') :
                          predictions.trend === 'decreasing' ? t('trendDown') : t('trendStable');
            predictionsHtml = `
                <div class="prediction-card">
                    <h4>${t('predictionTitle')}</h4>
                    <div class="prediction-total">
                        <span class="prediction-amount">${safeToFixed(nextMonthTotal)} DZD</span>
                        <span class="prediction-confidence">${t('confidenceLevel')}: ${safeToFixed(conf)}%</span>
                    </div>
                    <div class="prediction-trend">${t('trend')}: ${trend}</div>
                </div>
            `;
        }
    }

    // ===== 3. الشذوذ =====
    let anomaliesHtml = '';
    const anomalies = analytics.anomalies;
    if (Array.isArray(anomalies) && anomalies.length > 0) {
        anomaliesHtml = `
            <div class="anomalies-card">
                <h4>${t('anomaliesTitle')}</h4>
                ${anomalies.slice(0, 5).map(a => {
                    const desc = a.description || 'معاملة غير معروفة';
                    const amount = (typeof a.amount === 'number' && isFinite(a.amount)) ? a.amount : 0;
                    let reason = a.reason || 'غير محدد';
                    // ترجمة أسباب الشذوذ
                    if (reason.includes('أعلى')) reason = t('anomalyReasonHigh');
                    else if (reason.includes('أقل')) reason = t('anomalyReasonLow');
                    else if (reason.includes('Z-Score')) reason = t('anomalyReasonZScore');
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
                <h4>${t('correlationsTitle')}</h4>
                ${correlations.slice(0, 3).map(c => {
                    const cat1 = c.category1 || '?';
                    const cat2 = c.category2 || '?';
                    let strength = c.strength || t('correlationStrengthWeak');
                    // ترجمة قوة الارتباط
                    if (strength.includes('قوية')) strength = t('correlationStrengthStrong');
                    else if (strength.includes('متوسطة')) strength = t('correlationStrengthMedium');
                    else strength = t('correlationStrengthWeak');
                    
                    let type = c.type || t('correlationTypePositive');
                    if (type.includes('طردية') || type.includes('Positive')) type = t('correlationTypePositive');
                    else if (type.includes('عكسية') || type.includes('Negative')) type = t('correlationTypeNegative');
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
                <h4>${t('summaryTitle')}</h4>
                <div class="summary-grid">
                    <div><span>${t('totalExpenses')}</span> <strong>${safeToFixed(totalExpenses)} DZD</strong></div>
                    <div><span>${t('totalIncome')}</span> <strong>${safeToFixed(totalIncome)} DZD</strong></div>
                    <div><span>${t('transactionCount')}</span> <strong>${transactionCount}</strong></div>
                    <div><span>${t('expenseCount')}</span> <strong>${expenseCount}</strong></div>
                    <div><span>${t('averageExpense')}</span> <strong>${safeToFixed(avgExpense)} DZD</strong></div>
                </div>
            </div>
        `;
    }

    // ===== تجميع كل الأقسام =====
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
