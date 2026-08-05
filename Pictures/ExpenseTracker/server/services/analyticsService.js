const ss = require('simple-statistics');
const { LinearRegression } = require('ml-regression');
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
        return { message: 'لا توجد بيانات كافية للتنبؤ (تحتاج 7 أيام على الأقل)' };
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
    const confidence = Math.max(0, Math.min(1, 1 - (mae / (ss.mean(values) || 1))));

    return {
        predictions: futurePredictions,
        averageDaily: ss.mean(values),
        trend: values[values.length - 1] > values[0] ? 'increasing' : 'decreasing',
        confidence: confidence * 100,
        nextMonthTotal: futurePredictions.reduce((sum, p) => sum + p.predictedAmount, 0)
    };
}

// ===== 2. تحليل الارتباط بين الفئات (معامل بيرسون) =====
function analyzeCorrelations(transactions) {
    const expenses = transactions.filter(t => t.type === 'expense');
    const categories = [...new Set(expenses.map(t => t.category))];
    
    if (categories.length < 2) {
        return { message: 'لا توجد فئات كافية للتحليل' };
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
                    strength: Math.abs(r) > 0.7 ? 'قوية' : Math.abs(r) > 0.5 ? 'متوسطة' : 'ضعيفة',
                    type: r > 0 ? 'طردية (زيادة مع زيادة)' : 'عكسية (زيادة مع نقصان)'
                });
            }
        }
    }

    return correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
}

// ===== 3. الكشف عن الشذوذ (Z-Score + IQR) =====
function detectAnomalies(transactions) {
    const amounts = transactions
        .filter(t => t.type === 'expense')
        .map(t => t.amount);

    if (amounts.length < 5) {
        return { message: 'لا توجد بيانات كافية لاكتشاف الشذوذ (تحتاج 5 معاملات على الأقل)' };
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
            ...t._doc,
            reason: t.amount > upperBound ? 'أعلى من المعتاد (Outlier)' :
                    t.amount < lowerBound ? 'أقل من المعتاد (Outlier)' :
                    'تباين كبير (Z-Score)',
            deviation: ((t.amount - mean) / (std || 1)).toFixed(2)
        }));

    return anomalies;
}

// ===== 4. تصنيف السلوك المالي (K-Means Clustering) =====
function classifySpendingBehavior(transactions) {
    const expenses = transactions.filter(t => t.type === 'expense');
    if (expenses.length < 10) {
        return { message: 'لا توجد بيانات كافية للتصنيف (تحتاج 10 معاملات على الأقل)' };
    }

    const categories = [...new Set(expenses.map(t => t.category))];
    const features = expenses.map(t => [
        t.amount,
        categories.indexOf(t.category) / (categories.length || 1),
        new Date(t.date).getDate() / 31
    ]);

    const k = Math.min(3, Math.floor(expenses.length / 4));
    if (k < 2) return { message: 'لا توجد بيانات كافية للتصنيف' };

    const result = kmeans(features, k);
    const clusters = result.clusters;

    const clusterAnalysis = [];
    for (let i = 0; i < k; i++) {
        const clusterItems = expenses.filter((_, idx) => clusters[idx] === i);
        const avgAmount = ss.mean(clusterItems.map(t => t.amount));
        const commonCategory = ss.mode(clusterItems.map(t => t.category));
        const avgDay = ss.mean(clusterItems.map(t => new Date(t.date).getDate()));
        
        clusterAnalysis.push({
            cluster: i + 1,
            count: clusterItems.length,
            averageAmount: avgAmount,
            commonCategory: commonCategory || 'متنوع',
            averageDay: Math.round(avgDay),
            type: avgAmount > ss.mean(expenses.map(t => t.amount)) * 1.3 ? 'إنفاق مرتفع' :
                  avgAmount < ss.mean(expenses.map(t => t.amount)) * 0.7 ? 'إنفاق منخفض' : 'إنفاق متوسط'
        });
    }

    return clusterAnalysis;
}

// ===== 5. توليد توصيات ذكية =====
function generateInsights(transactions, monthlyBudget, goals) {
    const expenses = transactions.filter(t => t.type === 'expense');
    const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0);
    const predictions = predictExpenses(transactions, 30);
    const correlations = analyzeCorrelations(transactions);
    const anomalies = detectAnomalies(transactions);
    const clusters = classifySpendingBehavior(transactions);

    const insights = [];

    // توصية 1: التنبؤ بالمستقبل
    if (predictions && predictions.nextMonthTotal) {
        const projectedExpense = predictions.nextMonthTotal;
        const budgetWarning = projectedExpense > monthlyBudget * 1.2;
        insights.push({
            type: budgetWarning ? 'warning' : 'info',
            title: budgetWarning ? '⚠️ تحذير: توقع تجاوز الميزانية' : '📊 توقع المصروفات الشهرية',
            description: budgetWarning ?
                `من المتوقع أن تنفق ${projectedExpense.toFixed(0)} DZD الشهر القادم، وهو ما يتجاوز ميزانيتك الشهرية (${monthlyBudget} DZD) بنسبة ${((projectedExpense / monthlyBudget) * 100 - 100).toFixed(0)}%` :
                `من المتوقع أن تنفق ${projectedExpense.toFixed(0)} DZD الشهر القادم، ضمن ميزانيتك الشهرية (${monthlyBudget} DZD)`,
            action: budgetWarning ? 'فكر في تقليل النفقات غير الضرورية' : 'استمر في الإنفاق الحكيم'
        });
    }

    // توصية 2: أقوى ارتباط بين الفئات
    if (correlations && correlations.length > 0) {
        const topCorrelation = correlations[0];
        insights.push({
            type: 'info',
            title: '🔗 علاقة بين الفئات',
            description: `هناك علاقة ${topCorrelation.strength} ${topCorrelation.type} بين "${topCorrelation.category1}" و "${topCorrelation.category2}" (معامل الارتباط: ${topCorrelation.correlation.toFixed(2)})`,
            action: 'حاول مراقبة هاتين الفئتين معاً للتحكم في الإنفاق'
        });
    }

    // توصية 3: الشذوذ
    if (anomalies && anomalies.length > 0) {
        const topAnomaly = anomalies[0];
        insights.push({
            type: 'danger',
            title: '🚨 نفقة غير معتادة',
            description: `تم اكتشاف معاملة غير عادية: "${topAnomaly.description}" بقيمة ${topAnomaly.amount} DZD (${topAnomaly.reason})`,
            action: 'تأكد من صحة هذه المعاملة وتأكد من عدم وجود خطأ'
        });
    }

    // توصية 4: تقدم الأهداف
    if (goals && goals.length > 0) {
        const closestGoal = goals
            .filter(g => !g.isCompleted)
            .sort((a, b) => (b.currentAmount / b.targetAmount) - (a.currentAmount / a.targetAmount))[0];
        if (closestGoal) {
            const progress = (closestGoal.currentAmount / closestGoal.targetAmount) * 100;
            const remaining = closestGoal.targetAmount - closestGoal.currentAmount;
            insights.push({
                type: progress > 80 ? 'success' : 'info',
                title: '🎯 تقدم هدف الادخار',
                description: `${closestGoal.name}: تم تحقيق ${progress.toFixed(0)}% من الهدف (${remaining.toFixed(0)} DZD متبقية)`,
                action: progress > 80 ? 'أنت على وشك تحقيق هدفك! استمر' : 'يمكنك زيادة الادخار قليلاً للوصول إلى الهدف'
            });
        }
    }

    // توصية 5: السلوك المالي
    if (clusters && clusters.length > 0) {
        const highestCluster = clusters.reduce((a, b) => a.averageAmount > b.averageAmount ? a : b);
        insights.push({
            type: 'info',
            title: '📈 نمط الإنفاق',
            description: `معظم إنفاقك (${highestCluster.count} معاملة) هو ${highestCluster.type} بمتوسط ${highestCluster.averageAmount.toFixed(0)} DZD، وأغلبها في "${highestCluster.commonCategory}"`,
            action: highestCluster.type === 'إنفاق مرتفع' ? 'يمكنك مراجعة هذه المعاملات للبحث عن فرص للتوفير' : 'أنت تدير ميزانيتك بشكل جيد'
        });
    }

    // توصية 6: توفير مقترح
    const topCategory = ss.mode(expenses.map(t => t.category)) || 'غير محدد';
    const topCategoryTotal = expenses.filter(t => t.category === topCategory).reduce((s, t) => s + t.amount, 0);
    if (topCategoryTotal > totalExpenses * 0.3) {
        insights.push({
            type: 'suggestion',
            title: '💡 اقتراح توفير',
            description: `فئة "${topCategory}" تشكل ${((topCategoryTotal / totalExpenses) * 100).toFixed(0)}% من إجمالي مصروفاتك (${topCategoryTotal.toFixed(0)} DZD)`,
            action: `حاول تقليل الإنفاق على "${topCategory}" بنسبة 10% لتوفير ${(topCategoryTotal * 0.1).toFixed(0)} DZD شهرياً`
        });
    }

    return insights;
}

// ===== دالة رئيسية لتوليد جميع التحليلات =====
function generateFullAnalytics(transactions, user) {
    const monthlyBudget = user.monthlyBudget || 1000;
    const goals = [];
    
    // حساب المصروفات والدخل
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    const incomeTransactions = transactions.filter(t => t.type === 'income');
    
    const totalExpenses = expenseTransactions.reduce((s, t) => s + t.amount, 0);
    const totalIncome = incomeTransactions.reduce((s, t) => s + t.amount, 0);
    const totalCount = transactions.length;
    const expenseCount = expenseTransactions.length;
    
    // المتوسط الصحيح = إجمالي المصروفات / عدد معاملات المصروف
    const averageExpense = expenseCount > 0 ? totalExpenses / expenseCount : 0;

    return {
        predictions: predictExpenses(transactions),
        correlations: analyzeCorrelations(transactions),
        anomalies: detectAnomalies(transactions),
        clusters: classifySpendingBehavior(transactions),
        insights: generateInsights(transactions, monthlyBudget, goals),
        summary: {
            totalExpenses: totalExpenses,
            totalIncome: totalIncome,
            transactionCount: totalCount,
            expenseCount: expenseCount,
            categories: [...new Set(transactions.map(t => t.category))],
            averageExpense: averageExpense  // الآن يحسب بشكل صحيح
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
