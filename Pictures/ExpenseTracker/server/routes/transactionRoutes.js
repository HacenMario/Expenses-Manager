const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const axios = require('axios');
const { sendBudgetAlertEmail, testEmailConnection } = require('../services/emailService');

// ===== متغيرات التخزين المؤقت لأسعار الصرف =====
let exchangeRatesCache = {};
let lastFetchTime = 0;
const CACHE_DURATION = 3600000; // 1 ساعة

// ===== دالة الحصول على سعر الصرف =====
async function getExchangeRate(from, to) {
    if (from === to) return 1;

    const cacheKey = `${from}_${to}`;
    if (exchangeRatesCache[cacheKey] && (Date.now() - lastFetchTime) < CACHE_DURATION) {
        return exchangeRatesCache[cacheKey];
    }

    try {
        const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/${from}`, {
            timeout: 5000
        });
        const rate = response.data.rates[to];
        if (rate) {
            exchangeRatesCache[cacheKey] = rate;
            lastFetchTime = Date.now();
            return rate;
        }
        return 1;
    } catch (error) {
        console.error('❌ Error fetching exchange rate:', error.message);
        if (exchangeRatesCache[cacheKey]) {
            return exchangeRatesCache[cacheKey];
        }
        return 1;
    }
}

// ===== اختبار البريد عند بدء التشغيل =====
(async function testEmailOnStartup() {
    try {
        console.log('📧 Testing email connection...');
        const result = await testEmailConnection();
        if (result) {
            console.log('✅ Email service is ready');
        } else {
            console.warn('⚠️ Email service not configured or failed. Check EMAIL_USER and EMAIL_PASS env vars.');
        }
    } catch (err) {
        console.error('❌ Email test failed:', err.message);
    }
})();

// ===== المسارات =====

// @route   GET /api/transactions
router.get('/', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const preferredCurrency = user.currency || 'DZD';

        const transactions = await Transaction.find({ user: req.user.id }).sort({ date: -1 });

        const rate = await getExchangeRate('DZD', preferredCurrency);
        const convertedTransactions = transactions.map(t => ({
            ...t.toObject(),
            amount: t.amount * rate
        }));

        res.status(200).json({ success: true, data: convertedTransactions });
    } catch (error) {
        console.error('❌ GET transactions error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/transactions
router.post('/', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const preferredCurrency = user.currency || 'DZD';

        // تحويل المبلغ من العملة المفضلة إلى DZD
        const rateToDZD = await getExchangeRate(preferredCurrency, 'DZD');
        const amountInDZD = req.body.amount * rateToDZD;

        const transaction = await Transaction.create({
            ...req.body,
            amount: amountInDZD,
            user: req.user.id
        });

        // جلب جميع المعاملات لحساب الإجماليات
        const allTransactions = await Transaction.find({ user: req.user.id });
        const totalExpensesDZD = allTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        const monthlyBudgetDZD = user.monthlyBudget || 1000;
        const isOverBudget = totalExpensesDZD > monthlyBudgetDZD;

        console.log(`📊 Transaction added. Total expenses: ${totalExpensesDZD} DZD, Budget: ${monthlyBudgetDZD} DZD, Over: ${isOverBudget}`);

        // إرسال البريد الإلكتروني في الخلفية
        if (isOverBudget) {
            const rateToPreferred = await getExchangeRate('DZD', preferredCurrency);
            const totalExpensesPreferred = totalExpensesDZD * rateToPreferred;
            const monthlyBudgetPreferred = monthlyBudgetDZD * rateToPreferred;

            console.log(`📧 Sending email to ${user.email}...`);
            setImmediate(async () => {
                const sent = await sendBudgetAlertEmail(user, totalExpensesPreferred, monthlyBudgetPreferred);
                if (sent) {
                    console.log('✅ Email sent successfully');
                } else {
                    console.error('❌ Failed to send email');
                }
            });
        }

        const rateToPreferred = await getExchangeRate('DZD', preferredCurrency);
        res.status(201).json({
            success: true,
            data: {
                ...transaction.toObject(),
                amount: transaction.amount * rateToPreferred
            },
            isOverBudget,
            totalExpenses: totalExpensesDZD * rateToPreferred,
            monthlyBudget: monthlyBudgetDZD * rateToPreferred
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

        if (req.body.amount) {
            const user = await User.findById(req.user.id);
            const preferredCurrency = user.currency || 'DZD';
            const rate = await getExchangeRate(preferredCurrency, 'DZD');
            req.body.amount = req.body.amount * rate;
        }

        transaction = await Transaction.findByIdAndUpdate(req.params.id, req.body, { new: true });

        const user = await User.findById(req.user.id);
        const preferredCurrency = user.currency || 'DZD';
        const rateToPreferred = await getExchangeRate('DZD', preferredCurrency);

        res.status(200).json({
            success: true,
            data: {
                ...transaction.toObject(),
                amount: transaction.amount * rateToPreferred
            }
        });
    } catch (error) {
        console.error('❌ Update transaction error:', error.message);
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
        console.error('❌ Delete transaction error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/transactions/summary
router.get('/summary', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const preferredCurrency = user.currency || 'DZD';

        const transactions = await Transaction.find({ user: req.user.id });

        const totalIncomeDZD = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        const totalExpensesDZD = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        const balanceDZD = totalIncomeDZD - totalExpensesDZD;

        const categoryTotalsDZD = {};
        transactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                categoryTotalsDZD[t.category] = (categoryTotalsDZD[t.category] || 0) + t.amount;
            });

        const rate = await getExchangeRate('DZD', preferredCurrency);
        const totalIncome = totalIncomeDZD * rate;
        const totalExpenses = totalExpensesDZD * rate;
        const balance = balanceDZD * rate;
        const monthlyBudget = (user.monthlyBudget || 1000) * rate;

        const categoryTotals = {};
        Object.keys(categoryTotalsDZD).forEach(cat => {
            categoryTotals[cat] = categoryTotalsDZD[cat] * rate;
        });

        const isOverBudget = totalExpenses > monthlyBudget;

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
                currency: preferredCurrency,
                rate
            }
        });
    } catch (error) {
        console.error('❌ Summary error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
