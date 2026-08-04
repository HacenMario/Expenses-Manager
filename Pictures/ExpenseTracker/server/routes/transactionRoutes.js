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

// ===== دالة إرسال البريد مع الترجمة =====
const sendBudgetAlertEmail = async (user, overspentAmount, totalExpenses) => {
    const lang = user.language || 'ar';
    const t = emailTranslations[lang] || emailTranslations.ar;

    const currencySymbol = user.currency || 'DZD';
    const formattedOverspent = overspentAmount.toFixed(2);
    const formattedTotal = totalExpenses.toFixed(2);
    const formattedBudget = user.monthlyBudget.toFixed(2);

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: t.subject,
        html: `
            <h2>${t.greeting(user.name)}</h2>
            <p>${t.body1} <strong>${formattedBudget} ${currencySymbol}</strong>.</p>
            <p>${t.body2} <strong>${formattedTotal} ${currencySymbol}</strong></p>
            <p>${t.body3} <strong>${formattedOverspent} ${currencySymbol}</strong></p>
            <p>${t.advice}</p>
            <hr>
            <p>${t.footer}</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ تم إرسال بريد إشعار إلى ${user.email} باللغة ${lang}`);
    } catch (error) {
        console.error('❌ فشل إرسال البريد:', error.message);
    }
};

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
        const transaction = await Transaction.create({ ...req.body, user: req.user.id });

        // جلب جميع المعاملات لحساب الإجماليات
        const transactions = await Transaction.find({ user: req.user.id });
        const totalExpenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        const user = await User.findById(req.user.id);
        const monthlyBudget = user.monthlyBudget || 1000;
        const isOverBudget = totalExpenses > monthlyBudget;

        // إرسال البريد الإلكتروني إذا تم التجاوز
        if (isOverBudget) {
            await sendBudgetAlertEmail(user, totalExpenses, monthlyBudget);
        }

        // إرجاع الاستجابة مع بيانات التجاوز
        res.status(201).json({
            success: true,
            data: transaction,
            isOverBudget,
            totalExpenses,
            monthlyBudget
        });
    } catch (error) {
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
        const preferredCurrency = user.currency || 'DZD';

        const transactions = await Transaction.find({ user: req.user.id });

        const totalIncomeBase = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        const totalExpensesBase = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        const balanceBase = totalIncomeBase - totalExpensesBase;

        const rate = await getExchangeRate('DZD', preferredCurrency);

        const totalIncome = totalIncomeBase * rate;
        const totalExpenses = totalExpensesBase * rate;
        const balance = balanceBase * rate;
        const monthlyBudget = (user.monthlyBudget || 0) * rate;

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
