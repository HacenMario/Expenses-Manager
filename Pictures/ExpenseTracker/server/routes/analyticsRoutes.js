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
        // حماية المسار موجودة بالفعل في protect middleware
        const user = await User.findById(req.user.id);
        const transactions = await Transaction.find({ user: req.user.id });
        const goals = await SavingGoal.find({ user: req.user.id });

        if (transactions.length < 5) {
            return res.status(200).json({
                success: true,
                data: {
                    message: 'insufficient_data',
                    insights: [],
                    summary: {
                        totalExpenses: 0,
                        totalIncome: 0,
                        transactionCount: 0,
                        expenseCount: 0,
                        averageExpense: 0
                    }
                }
            });
        }

        const analytics = generateFullAnalytics(transactions, user);
        // دمج الأهداف في التوصيات
        analytics.insights = require('../services/analyticsService')
            .generateInsights(transactions, user.monthlyBudget || 1000, goals, user.language || 'ar');

        res.status(200).json({ success: true, data: analytics });
    } catch (error) {
        console.error('❌ Analytics error:', error.message);
        // إرسال رسالة خطأ مناسبة
        res.status(500).json({ 
            success: false, 
            message: error.message || 'فشل في تحميل التحليلات' 
        });
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
