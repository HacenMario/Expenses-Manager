// ===== تحميل التحليلات =====
async function loadAnalytics() {
    try {
        const res = await fetch(`${API}/analytics/insights`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            renderAnalytics(data.data);
        } else {
            console.error('Analytics error:', data.message);
            document.getElementById('analyticsContainer').innerHTML = `
                <div class="analytics-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>${data.message || 'حدث خطأ أثناء تحميل التحليلات'}</p>
                </div>
            `;
        }
    } catch (err) {
        console.error('Error loading analytics:', err);
        document.getElementById('analyticsContainer').innerHTML = `
            <div class="analytics-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>حدث خطأ في الاتصال بالخادم</p>
            </div>
        `;
    }
}

// ===== عرض التحليلات (مع تحسين الأمان) =====
function renderAnalytics(analytics) {
    const container = document.getElementById('analyticsContainer');
    if (!container) return;

    // التحقق من وجود بيانات
    if (!analytics) {
        container.innerHTML = `<p style="color:#999;">لا توجد بيانات تحليلية متاحة</p>`;
        return;
    }

    // ===== 1. عرض التوصيات =====
    let insightsHtml = '';
    if (analytics.insights && analytics.insights.length > 0) {
        insightsHtml = analytics.insights.map(i => `
            <div class="insight-card insight-${i.type || 'info'}">
                <div class="insight-header">
                    <span class="insight-icon">${i.title ? i.title.split(' ')[0] : '💡'}</span>
                    <span class="insight-title">${i.title || 'توصية'}</span>
                </div>
                <p class="insight-description">${i.description || 'لا توجد تفاصيل'}</p>
                <div class="insight-action">
                    <i class="fas fa-lightbulb"></i> ${i.action || 'لا يوجد إجراء مقترح'}
                </div>
            </div>
        `).join('');
    } else {
        insightsHtml = `<p style="color:#999;">لا توجد توصيات حالياً</p>`;
    }

    // ===== 2. عرض التنبؤات (مع التحقق من وجود البيانات) =====
    let predictionsHtml = '';
    const predictions = analytics.predictions;
    if (predictions && predictions.nextMonthTotal !== undefined && predictions.nextMonthTotal !== null) {
        const confidence = predictions.confidence || 0;
        predictionsHtml = `
            <div class="prediction-card">
                <h4>📊 توقع المصروفات للشهر القادم</h4>
                <div class="prediction-total">
                    <span class="prediction-amount">${predictions.nextMonthTotal.toFixed(0)} DZD</span>
                    <span class="prediction-confidence">دقة: ${confidence.toFixed(0)}%</span>
                </div>
                <div class="prediction-trend">
                    الاتجاه: ${predictions.trend === 'increasing' ? '📈 صاعد' : predictions.trend === 'decreasing' ? '📉 هابط' : 'متذبذب'}
                </div>
            </div>
        `;
    }

    // ===== 3. عرض الشذوذ =====
    let anomaliesHtml = '';
    const anomalies = analytics.anomalies;
    if (anomalies && Array.isArray(anomalies) && anomalies.length > 0) {
        anomaliesHtml = `
            <div class="anomalies-card">
                <h4>🚨 المعاملات غير الطبيعية</h4>
                ${anomalies.slice(0, 5).map(a => `
                    <div class="anomaly-item">
                        <span>${a.description || 'معاملة غير معروفة'}</span>
                        <span class="anomaly-amount">${a.amount || 0} DZD</span>
                        <span class="anomaly-reason">${a.reason || 'غير محدد'}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // ===== 4. عرض الارتباطات =====
    let correlationsHtml = '';
    const correlations = analytics.correlations;
    if (correlations && Array.isArray(correlations) && correlations.length > 0) {
        correlationsHtml = `
            <div class="correlations-card">
                <h4>🔗 العلاقات بين الفئات</h4>
                ${correlations.slice(0, 3).map(c => `
                    <div class="correlation-item">
                        <span>${c.category1 || '?'} ↔ ${c.category2 || '?'}</span>
                        <span class="correlation-strength">${c.strength || 'ضعيفة'}</span>
                        <span class="correlation-type">${c.type || 'غير معروف'}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // ===== 5. عرض الملخص =====
    let summaryHtml = '';
    const summary = analytics.summary;
    if (summary) {
        summaryHtml = `
            <div class="summary-card">
                <h4>📋 ملخص سريع</h4>
                <div class="summary-grid">
                    <div><span>المصروفات الكلية</span> <strong>${(summary.totalExpenses || 0).toFixed(0)} DZD</strong></div>
                    <div><span>الدخل الكلي</span> <strong>${(summary.totalIncome || 0).toFixed(0)} DZD</strong></div>
                    <div><span>عدد المعاملات</span> <strong>${summary.transactionCount || 0}</strong></div>
                    <div><span>متوسط الإنفاق</span> <strong>${(summary.averageExpense || 0).toFixed(0)} DZD</strong></div>
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
