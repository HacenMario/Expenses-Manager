const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const axios = require('axios');
const nodemailer = require('nodemailer');
const emailTranslations = require('../utils/emailTranslations');
const { sendBudgetAlertEmail } = require('../services/emailService');

// ===== إعداد Nodemailer =====
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// ===== دالة الحصول على سعر الصرف =====
async function getExchangeRate(from, to) {
    if (from === to) return 1;
    try {
        const response = await axios.get(
            `https://api.exchangerate-api.com/v4/latest/${from}`
        );
        return response.data.rates[to] || 1;
    } catch (error) {
        console.error('Error fetching exchange rate:', error.message);
        return 1;
    }
}

// ===== المسارات =====

// @route   GET /api/transactions
router.get('/', protect, async (req, res) => {
    try {
        const transactions = await Transaction.find({ user: req.user.id }).sort({ date: -1 });
        res.status(200).json({ success: true, data: transactions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/transactions
router.post('/', protect, async (req, res) => {
    try {
        // 1. إضافة المعاملة فوراً
        const transaction = await Transaction.create({ ...req.body, user: req.user.id });

        // 2. جلب البيانات اللازمة للرد (بدون انتظار البريد)
        const transactions = await Transaction.find({ user: req.user.id });
        const totalExpenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        const user = await User.findById(req.user.id);
        const monthlyBudget = user.monthlyBudget || 1000;
        const isOverBudget = totalExpenses > monthlyBudget;

        // 3. إرسال البريد الإلكتروني في الخلفية (غير متزامن)
        if (isOverBudget) {
            setImmediate(() => {
                sendBudgetAlertEmail(user, totalExpenses, monthlyBudget)
                    .then(() => console.log('✅ Email sent successfully'))
                    .catch(err => console.error('❌ Email error:', err.message));
            });
        }

        // 4. الرد فوراً على العميل
        res.status(201).json({
            success: true,
            data: transaction,
            isOverBudget,
            totalExpenses,
            monthlyBudget
        });

    } catch (error) {
        console.error('❌ Transaction creation error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   PUT /api/transactions/:id
router.put('/:id', protect, async (req, res) => {
    try {
        let transaction = await Transaction.findById(req.params.id);
        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }
        if (transaction.user.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        transaction = await Transaction.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ success: true, data: transaction });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   DELETE /api/transactions/:id
router.delete('/:id', protect, async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }
        if (transaction.user.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        await transaction.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/transactions/summary
router.get('/summary', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const preferredCurrency = user.currency || 'USD';

        const transactions = await Transaction.find({ user: req.user.id });

        const totalIncomeBase = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        const totalExpensesBase = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        const balanceBase = totalIncomeBase - totalExpensesBase;

        const rate = await getExchangeRate('USD', preferredCurrency);

        const totalIncome = totalIncomeBase * rate;
        const totalExpenses = totalExpensesBase * rate;
        const balance = balanceBase * rate;
        const monthlyBudget = (user.monthlyBudget || 1000) * rate;

        const categoryTotalsBase = {};
        transactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                categoryTotalsBase[t.category] = (categoryTotalsBase[t.category] || 0) + t.amount;
            });
        const categoryTotals = {};
        Object.keys(categoryTotalsBase).forEach(cat => {
            categoryTotals[cat] = categoryTotalsBase[cat] * rate;
        });

        const isOverBudget = totalExpenses > monthlyBudget;
        const budgetDifference = monthlyBudget - totalExpenses;

        res.status(200).json({
            success: true,
            data: {
                totalIncome,
                totalExpenses,
                balance,
                remainingBudget: balance,
                monthlyBudget,
                categoryTotals,
                transactionCount: transactions.length,
                isOverBudget,
                budgetDifference,
                currency: preferredCurrency,
                rate
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
