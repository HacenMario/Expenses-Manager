const express = require('express');
const router = express.Router();
const SavingGoal = require('../models/SavingGoal');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');

// ===== الحصول على جميع أهداف المستخدم =====
router.get('/', protect, async (req, res) => {
    try {
        const goals = await SavingGoal.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: goals });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ===== إنشاء هدف جديد =====
router.post('/', protect, async (req, res) => {
    try {
        const { name, targetAmount, deadline, icon, color } = req.body;
        const goal = await SavingGoal.create({
            user: req.user.id,
            name,
            targetAmount,
            deadline: new Date(deadline),
            icon: icon || '🎯',
            color: color || '#667eea'
        });
        res.status(201).json({ success: true, data: goal });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ===== تحديث هدف =====
router.put('/:id', protect, async (req, res) => {
    try {
        let goal = await SavingGoal.findById(req.params.id);
        if (!goal) {
            return res.status(404).json({ success: false, message: 'Goal not found' });
        }
        if (goal.user.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        goal = await SavingGoal.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ success: true, data: goal });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ===== حذف هدف =====
router.delete('/:id', protect, async (req, res) => {
    try {
        const goal = await SavingGoal.findById(req.params.id);
        if (!goal) {
            return res.status(404).json({ success: false, message: 'Goal not found' });
        }
        if (goal.user.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        await goal.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ===== إضافة مبلغ إلى الهدف =====
router.post('/:id/add-amount', protect, async (req, res) => {
    try {
        const { amount, transactionId } = req.body;
        const goal = await SavingGoal.findById(req.params.id);
        if (!goal) {
            return res.status(404).json({ success: false, message: 'Goal not found' });
        }
        if (goal.user.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        if (amount <= 0) {
            return res.status(400).json({ success: false, message: 'Amount must be greater than 0' });
        }

        const newCurrent = goal.currentAmount + amount;
        const isCompleted = newCurrent >= goal.targetAmount;

        goal.currentAmount = Math.min(newCurrent, goal.targetAmount);
        goal.isCompleted = isCompleted;
        await goal.save();

        // إنشاء معاملة مرتبطة بالهدف (اختياري)
        if (transactionId) {
            await Transaction.findByIdAndUpdate(transactionId, { goalId: goal._id });
        }

        res.status(200).json({
            success: true,
            data: goal,
            isCompleted
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
