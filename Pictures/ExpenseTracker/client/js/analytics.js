// ===== تحميل التحليلات =====
async function loadAnalytics() {
    try {
        const res = await fetch(`${API}/analytics/insights`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            renderAnalytics(data.data);
        }
    } catch (err) {
        console.error('Error loading analytics:', err);
    }
}

// ===== عرض التحليلات =====
function renderAnalytics(analytics) {
    const container = document.getElementById('analyticsContainer');
    if (!container) return;

    // 1. عرض التوصيات
    const insightsHtml = analytics.insights.map(i => `
        <div class="insight-card insight-${i.type}">
            <div class="insight-header">
                <span class="insight-icon">${i.title.split(' ')[0]}</span>
                <span class="insight-title">${i.title}</span>
            </div>
            <p class="insight-description">${i.description}</p>
            <div class="insight-action">
                <i class="fas fa-lightbulb"></i> ${i.action}
            </div>
        </div>
    `).join('');

    // 2. عرض التنبؤات
    let predictionsHtml = '';
    if (analytics.predictions && analytics.predictions.predictions) {
        predictionsHtml = `
            <div class="prediction-card">
                <h4>📊 توقع المصروفات للشهر القادم</h4>
                <div class="prediction-total">
                    <span class="prediction-amount">${analytics.predictions.nextMonthTotal.toFixed(0)} DZD</span>
                    <span class="prediction-confidence">دقة: ${analytics.predictions.confidence.toFixed(0)}%</span>
                </div>
                <div class="prediction-trend">
                    الاتجاه: ${analytics.predictions.trend === 'increasing' ? '📈 صاعد' : '📉 هابط'}
                </div>
            </div>
        `;
    }

    // 3. عرض الشذوذ
    let anomaliesHtml = '';
    if (analytics.anomalies && analytics.anomalies.length > 0) {
        anomaliesHtml = `
            <div class="anomalies-card">
                <h4>🚨 المعاملات غير الطبيعية</h4>
                ${analytics.anomalies.map(a => `
                    <div class="anomaly-item">
                        <span>${a.description}</span>
                        <span class="anomaly-amount">${a.amount} DZD</span>
                        <span class="anomaly-reason">${a.reason}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // 4. عرض الارتباطات
    let correlationsHtml = '';
    if (analytics.correlations && analytics.correlations.length > 0) {
        correlationsHtml = `
            <div class="correlations-card">
                <h4>🔗 العلاقات بين الفئات</h4>
                ${analytics.correlations.slice(0, 3).map(c => `
                    <div class="correlation-item">
                        <span>${c.category1} ↔ ${c.category2}</span>
                        <span class="correlation-strength">${c.strength}</span>
                        <span class="correlation-type">${c.type}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    container.innerHTML = `
        <div class="analytics-grid">
            <div class="insights-section">${insightsHtml}</div>
            <div class="predictions-section">${predictionsHtml}</div>
            <div class="anomalies-section">${anomaliesHtml}</div>
            <div class="correlations-section">${correlationsHtml}</div>
        </div>
    `;
}
