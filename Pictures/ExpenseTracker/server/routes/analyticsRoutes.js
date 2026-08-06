const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const SavingGoal = require('../models/SavingGoal');
const { protect } = require('../middleware/auth');
const { generateFullAnalytics, generateInsights } = require('../services/analyticsService');

router.get('/insights', protect, async (req, res) => {
    try {
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
        analytics.insights = generateInsights(transactions, user.monthlyBudget || 1000, goals);

        res.status(200).json({ success: true, data: analytics });
    } catch (error) {
        console.error('❌ Analytics error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
