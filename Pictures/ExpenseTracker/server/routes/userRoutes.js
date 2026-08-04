const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @route   GET /api/user/settings
// @desc    Get user settings
router.get('/settings', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json({
            success: true,
            data: {
                currency: user.currency,
                emailNotifications: user.emailNotifications,
                monthlyBudget: user.monthlyBudget,
                notificationEmail: user.notificationEmail || user.email
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   PUT /api/user/settings
// @desc    Update user settings
router.put('/settings', protect, async (req, res) => {
    try {
        const { currency, emailNotifications, notificationEmail, monthlyBudget } = req.body;
        const updateData = {};
        if (currency) updateData.currency = currency;
        if (emailNotifications !== undefined) updateData.emailNotifications = emailNotifications;
        if (notificationEmail) updateData.notificationEmail = notificationEmail;
        if (monthlyBudget !== undefined) updateData.monthlyBudget = monthlyBudget;

        const user = await User.findByIdAndUpdate(req.user.id, updateData, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: {
                currency: user.currency,
                emailNotifications: user.emailNotifications,
                monthlyBudget: user.monthlyBudget,
                notificationEmail: user.notificationEmail || user.email
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;