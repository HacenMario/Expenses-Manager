const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const SavingGoal = require('../models/SavingGoal');
const { protect } = require('../middleware/auth');
const {
    predictExpenses,
    analyzeCorrelations,
    detectAnomalies,
    classifySpendingBehavior,
    generateInsights,
    generateFullAnalytics
} = require('../services/analyticsService');

// ===== الحصول على جميع التحليلات =====
router.get('/insights', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const transactions = await Transaction.find({ user: req.user.id });
        const goals = await SavingGoal.find({ user: req.user.id });

        if (transactions.length < 5) {
            return res.status(200).json({
                success: true,
                data: {
                    message: 'لا توجد بيانات كافية للتحليل (تحتاج 5 معاملات على الأقل)',
                    insights: [{
                        type: 'info',
                        title: '📊 بيانات غير كافية',
                        description: 'قم بإضافة المزيد من المعاملات للحصول على تحليلات متقدمة',
                        action: 'أضف 5 معاملات على الأقل للحصول على تحليلات دقيقة'
                    }],
                    summary: {
                        totalExpenses: transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
                        totalIncome: transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
                        transactionCount: transactions.length
                    }
                }
            });
        }

        const analytics = generateFullAnalytics(transactions, user);
        analytics.insights = generateInsights(transactions, user.monthlyBudget || 1000, goals);

        res.status(200).json({
            success: true,
            data: analytics
        });

    } catch (error) {
        console.error('❌ Analytics error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ===== التنبؤ بالمصروفات فقط =====
router.get('/predictions', protect, async (req, res) => {
    try {
        const transactions = await Transaction.find({ user: req.user.id });
        const result = predictExpenses(transactions);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ===== تحليل الارتباط فقط =====
router.get('/correlations', protect, async (req, res) => {
    try {
        const transactions = await Transaction.find({ user: req.user.id });
        const result = analyzeCorrelations(transactions);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
