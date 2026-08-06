const ss = require('simple-statistics');
const kmeans = require('ml-kmeans');

// ===== 1. التنبؤ بالمصروفات (Exponential Smoothing) =====
function predictExpenses(transactions, days = 30) {
    const dailyExpenses = {};
    transactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
            const date = new Date(t.date).toISOString().split('T')[0];
            dailyExpenses[date] = (dailyExpenses[date] || 0) + t.amount;
        });

    const dates = Object.keys(dailyExpenses).sort();
    const values = dates.map(d => dailyExpenses[d]);

    if (values.length < 7) {
        return { message: 'insufficient_data' };
    }

    const alpha = 0.3;
    let smoothed = values[0];
    for (let i = 1; i < values.length; i++) {
        smoothed = alpha * values[i] + (1 - alpha) * smoothed;
    }

    const lastValue = values[values.length - 1];
    const futurePredictions = [];
    for (let i = 1; i <= days; i++) {
        const predicted = smoothed + (i * (lastValue - smoothed) / values.length);
        futurePredictions.push({
            day: i,
            predictedAmount: Math.max(0, predicted)
        });
    }

    const mae = ss.meanAbsoluteDeviation(values);
    const mean = ss.mean(values);
    const confidence = mean > 0 ? Math.max(0, Math.min(100, (1 - (mae / mean)) * 100)) : 0;

    return {
        predictions: futurePredictions,
        averageDaily: ss.mean(values) || 0,
        trend: values[values.length - 1] > values[0] ? 'increasing' : 'decreasing',
        confidence: confidence,
        nextMonthTotal: futurePredictions.reduce((sum, p) => sum + p.predictedAmount, 0)
    };
}

// ===== 2. تحليل الارتباط بين الفئات =====
function analyzeCorrelations(transactions) {
    const expenses = transactions.filter(t => t.type === 'expense');
    const categories = [...new Set(expenses.map(t => t.category))];
    
    if (categories.length < 2) {
        return { message: 'insufficient_data' };
    }

    const dailyData = {};
    expenses.forEach(t => {
        const date = new Date(t.date).toISOString().split('T')[0];
        if (!dailyData[date]) {
            dailyData[date] = {};
            categories.forEach(c => dailyData[date][c] = 0);
        }
        dailyData[date][t.category] = (dailyData[date][t.category] || 0) + t.amount;
    });

    const dates = Object.keys(dailyData);
    const matrix = dates.map(d => categories.map(c => dailyData[d][c]));

    const correlations = [];
    for (let i = 0; i < categories.length; i++) {
        for (let j = i + 1; j < categories.length; j++) {
            const col1 = matrix.map(row => row[i]);
            const col2 = matrix.map(row => row[j]);
            if (ss.variance(col1) === 0 || ss.variance(col2) === 0) continue;
            const r = ss.sampleCorrelation(col1, col2);
            if (!isNaN(r) && Math.abs(r) > 0.3) {
                correlations.push({
                    category1: categories[i],
                    category2: categories[j],
                    correlation: r,
                    strength: Math.abs(r) > 0.7 ? 'strong' : Math.abs(r) > 0.5 ? 'medium' : 'weak',
                    type: r > 0 ? 'positive' : 'negative'
                });
            }
        }
    }

    return correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
}

// ===== 3. الكشف عن الشذوذ =====
function detectAnomalies(transactions) {
    const amounts = transactions
        .filter(t => t.type === 'expense')
        .map(t => t.amount);

    if (amounts.length < 5) {
        return { message: 'insufficient_data' };
    }

    const mean = ss.mean(amounts);
    const std = ss.standardDeviation(amounts);
    const q1 = ss.quantile(amounts, 0.25);
    const q3 = ss.quantile(amounts, 0.75);
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    const anomalies = transactions
        .filter(t => t.type === 'expense')
        .filter(t => {
            const zScore = Math.abs((t.amount - mean) / (std || 1));
            return zScore > 2.5 || t.amount < lowerBound || t.amount > upperBound;
        })
        .map(t => ({
            description: t.description || 'Unknown',
            amount: t.amount,
            reason: t.amount > upperBound ? 'high_outlier' :
                    t.amount < lowerBound ? 'low_outlier' : 'zscore',
            deviation: ((t.amount - mean) / (std || 1)) || 0
        }));

    return anomalies;
}

// ===== 4. تصنيف السلوك المالي =====
function classifySpendingBehavior(transactions) {
    const expenses = transactions.filter(t => t.type === 'expense');
    if (expenses.length < 10) {
        return { message: 'insufficient_data' };
    }

    const categories = [...new Set(expenses.map(t => t.category))];
    const features = expenses.map(t => [
        t.amount,
        categories.indexOf(t.category) / (categories.length || 1),
        new Date(t.date).getDate() / 31
    ]);

    const k = Math.min(3, Math.floor(expenses.length / 4));
    if (k < 2) return { message: 'insufficient_data' };

    const result = kmeans(features, k);
    const clusters = result.clusters;

    const clusterAnalysis = [];
    const allAmounts = expenses.map(t => t.amount);
    const avgAll = ss.mean(allAmounts);
    
    for (let i = 0; i < k; i++) {
        const clusterItems = expenses.filter((_, idx) => clusters[idx] === i);
        const avgAmount = ss.mean(clusterItems.map(t => t.amount)) || 0;
        const commonCategory = ss.mode(clusterItems.map(t => t.category)) || 'Other';
        const avgDay = ss.mean(clusterItems.map(t => new Date(t.date).getDate())) || 0;
        
        let type = 'medium';
        if (avgAmount > avgAll * 1.3) type = 'high';
        else if (avgAmount < avgAll * 0.7) type = 'low';
        
        clusterAnalysis.push({
            cluster: i + 1,
            count: clusterItems.length,
            averageAmount: avgAmount,
            commonCategory: commonCategory,
            averageDay: Math.round(avgDay),
            type: type
        });
    }

    return clusterAnalysis;
}

// ===== 5. توليد التوصيات (بيانات خام) =====
function generateInsights(transactions, monthlyBudget, goals) {
    const expenses = transactions.filter(t => t.type === 'expense');
    const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0);
    const predictions = predictExpenses(transactions, 30);
    const correlations = analyzeCorrelations(transactions);
    const anomalies = detectAnomalies(transactions);
    const clusters = classifySpendingBehavior(transactions);

    const insights = [];

    // 1. التنبؤ بالمستقبل
    if (predictions && predictions.nextMonthTotal && predictions.nextMonthTotal > 0) {
        const projected = predictions.nextMonthTotal;
        const budgetWarning = projected > monthlyBudget * 1.2;
        insights.push({
            type: budgetWarning ? 'warning' : 'info',
            template: budgetWarning ? 'budget_exceed_forecast' : 'budget_forecast',
            data: {
                projectedExpense: projected,
                monthlyBudget: monthlyBudget,
                percentage: ((projected / monthlyBudget) * 100 - 100).toFixed(0)
            }
        });
    }

    // 2. أقوى ارتباط
    if (correlations && correlations.length > 0 && !correlations.message) {
        const top = correlations[0];
        insights.push({
            type: 'info',
            template: 'correlation_found',
            data: {
                category1: top.category1,
                category2: top.category2,
                strength: top.strength,
                type: top.type,
                correlation: top.correlation
            }
        });
    }

    // 3. الشذوذ
    if (anomalies && anomalies.length > 0 && !anomalies.message) {
        const top = anomalies[0];
        insights.push({
            type: 'danger',
            template: 'anomaly_detected',
            data: {
                description: top.description,
                amount: top.amount,
                reason: top.reason
            }
        });
    }

    // 4. تقدم الأهداف
    if (goals && goals.length > 0) {
        const closest = goals
            .filter(g => !g.isCompleted)
            .sort((a, b) => (b.currentAmount / b.targetAmount) - (a.currentAmount / a.targetAmount))[0];
        if (closest) {
            const progress = (closest.currentAmount / closest.targetAmount) * 100;
            insights.push({
                type: progress > 80 ? 'success' : 'info',
                template: 'goal_progress',
                data: {
                    name: closest.name,
                    progress: progress,
                    remaining: closest.targetAmount - closest.currentAmount,
                    target: closest.targetAmount,
                    current: closest.currentAmount
                }
            });
        }
    }

    // 5. السلوك المالي
    if (clusters && clusters.length > 0 && !clusters.message) {
        const highest = clusters.reduce((a, b) => a.averageAmount > b.averageAmount ? a : b);
        insights.push({
            type: 'info',
            template: 'spending_behavior',
            data: {
                count: highest.count,
                type: highest.type,
                avgAmount: highest.averageAmount,
                category: highest.commonCategory
            }
        });
    }

    // 6. اقتراح توفير
    if (expenses.length > 0) {
        const topCategory = ss.mode(expenses.map(t => t.category)) || 'Other';
        const topTotal = expenses.filter(t => t.category === topCategory).reduce((s, t) => s + t.amount, 0);
        if (topTotal > totalExpenses * 0.3) {
            insights.push({
                type: 'suggestion',
                template: 'saving_suggestion',
                data: {
                    category: topCategory,
                    percentage: ((topTotal / totalExpenses) * 100),
                    amount: topTotal,
                    savingsAmount: topTotal * 0.1
                }
            });
        }
    }

    return insights;
}

// ===== دالة رئيسية =====
function generateFullAnalytics(transactions, user) {
    const monthlyBudget = user.monthlyBudget || 1000;
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    const incomeTransactions = transactions.filter(t => t.type === 'income');
    
    const totalExpenses = expenseTransactions.reduce((s, t) => s + t.amount, 0);
    const totalIncome = incomeTransactions.reduce((s, t) => s + t.amount, 0);
    const expenseCount = expenseTransactions.length;
    const averageExpense = expenseCount > 0 ? totalExpenses / expenseCount : 0;

    return {
        predictions: predictExpenses(transactions),
        correlations: analyzeCorrelations(transactions),
        anomalies: detectAnomalies(transactions),
        clusters: classifySpendingBehavior(transactions),
        insights: generateInsights(transactions, monthlyBudget, []),
        summary: {
            totalExpenses: totalExpenses,
            totalIncome: totalIncome,
            transactionCount: transactions.length,
            expenseCount: expenseCount,
            categories: [...new Set(transactions.map(t => t.category))],
            averageExpense: averageExpense
        }
    };
}

module.exports = {
    predictExpenses,
    analyzeCorrelations,
    detectAnomalies,
    classifySpendingBehavior,
    generateInsights,
    generateFullAnalytics
};
