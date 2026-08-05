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

// ===== Dashboard Widgets =====
router.get('/dashboard', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const transactions = await Transaction.find({ user: req.user.id });
        
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        
        // 1. مصروفات الشهر الحالي
        const thisMonthExpenses = transactions
            .filter(t => t.type === 'expense' && new Date(t.date) >= startOfMonth)
            .reduce((sum, t) => sum + t.amount, 0);
        
        // 2. مصروفات الشهر الماضي
        const lastMonthExpenses = transactions
            .filter(t => t.type === 'expense' && new Date(t.date) >= startOfLastMonth && new Date(t.date) <= endOfLastMonth)
            .reduce((sum, t) => sum + t.amount, 0);
        
        // 3. دخل الشهر الحالي
        const thisMonthIncome = transactions
            .filter(t => t.type === 'income' && new Date(t.date) >= startOfMonth)
            .reduce((sum, t) => sum + t.amount, 0);
        
        // 4. أعلى فئة إنفاق
        const categoryTotals = {};
        transactions
            .filter(t => t.type === 'expense' && new Date(t.date) >= startOfMonth)
            .forEach(t => {
                categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
            });
        
        let topCategory = { name: 'لا توجد', amount: 0, percentage: 0 };
        const totalExpenses = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
        for (const [name, amount] of Object.entries(categoryTotals)) {
            if (amount > topCategory.amount) {
                topCategory = { 
                    name, 
                    amount, 
                    percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0 
                };
            }
        }
        
        // 5. متوسط الإنفاق اليومي
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const dailyAverage = daysInMonth > 0 ? thisMonthExpenses / daysInMonth : 0;
        
        // 6. نسبة الادخار
        const savingsRate = thisMonthIncome > 0 ? ((thisMonthIncome - thisMonthExpenses) / thisMonthIncome) * 100 : 0;
        
        // 7. مقارنة مع الشهر الماضي
        const comparison = lastMonthExpenses > 0 
            ? ((thisMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 
            : 0;
        
        // 8. أسرع هدف ادخار
        const goals = await SavingGoal.find({ user: req.user.id, isCompleted: false });
        let fastestGoal = null;
        let bestProgress = 0;
        for (const goal of goals) {
            const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
            if (progress > bestProgress) {
                bestProgress = progress;
                fastestGoal = goal;
            }
        }
        
        // 9. عدد الأيام المتبقية في الشهر
        const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();
        
        res.status(200).json({
            success: true,
            data: {
                thisMonthExpenses,
                thisMonthIncome,
                lastMonthExpenses,
                topCategory,
                dailyAverage,
                savingsRate: Math.max(savingsRate, 0),
                comparison,
                fastestGoal: fastestGoal ? {
                    name: fastestGoal.name,
                    progress: bestProgress,
                    currentAmount: fastestGoal.currentAmount,
                    targetAmount: fastestGoal.targetAmount
                } : null,
                daysLeft,
                transactionCount: transactions.length
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ===== مزامنة المعاملات دون اتصال =====
router.post('/sync', protect, async (req, res) => {
    try {
        const { pendingTransactions } = req.body;
        let created = 0;
        
        for (const tx of pendingTransactions) {
            const { description, amount, category, type, date } = tx;
            await Transaction.create({
                user: req.user.id,
                description,
                amount,
                category,
                type,
                date: date || new Date()
            });
            created++;
        }
        
        res.status(200).json({
            success: true,
            message: `${created} transactions synced successfully`,
            count: created
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
