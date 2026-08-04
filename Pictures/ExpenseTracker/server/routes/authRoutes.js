const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @route   POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, currency, language } = req.body;
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }
        const user = await User.create({ 
            name, 
            email, 
            password, 
            currency: currency || 'DZD',
            language: language || 'ar'
        });
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
        res.status(201).json({
            success: true,
            token,
            user: { 
                id: user._id, 
                name: user.name, 
                email: user.email, 
                monthlyBudget: user.monthlyBudget,
                currency: user.currency,
                language: user.language
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
        res.status(200).json({
            success: true,
            token,
            user: { 
                id: user._id, 
                name: user.name, 
                email: user.email, 
                monthlyBudget: user.monthlyBudget,
                currency: user.currency,
                language: user.language
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   PUT /api/auth/budget
router.put('/budget', protect, async (req, res) => {
    try {
        const { monthlyBudget } = req.body;
        if (monthlyBudget === undefined || monthlyBudget === null || monthlyBudget < 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide a valid monthly budget (must be >= 0)' 
            });
        }
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { monthlyBudget },
            { new: true, runValidators: true }
        );
        res.status(200).json({
            success: true,
            data: { monthlyBudget: user.monthlyBudget }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   PUT /api/auth/currency
router.put('/currency', protect, async (req, res) => {
    try {
        const { currency } = req.body;
        if (!currency) {
            return res.status(400).json({ success: false, message: 'Please provide a currency code' });
        }
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { currency },
            { new: true, runValidators: true }
        );
        res.status(200).json({
            success: true,
            data: { currency: user.currency }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   PUT /api/auth/language
router.put('/language', protect, async (req, res) => {
    try {
        const { language } = req.body;
        if (!language || !['ar', 'en', 'fr'].includes(language)) {
            return res.status(400).json({ success: false, message: 'Invalid language code' });
        }
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { language },
            { new: true, runValidators: true }
        );
        res.status(200).json({
            success: true,
            data: { language: user.language }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/auth/settings
router.get('/settings', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json({
            success: true,
            data: {
                currency: user.currency || 'DZD',
                monthlyBudget: user.monthlyBudget || 0,
                name: user.name,
                email: user.email,
                language: user.language || 'ar'
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   PUT /api/auth/settings
router.put('/settings', protect, async (req, res) => {
    try {
        const { currency, monthlyBudget, language } = req.body;
        const updateData = {};
        if (currency) updateData.currency = currency;
        if (monthlyBudget !== undefined && monthlyBudget >= 0) updateData.monthlyBudget = monthlyBudget;
        if (language && ['ar', 'en', 'fr'].includes(language)) updateData.language = language;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ success: false, message: 'No valid fields to update' });
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: {
                currency: user.currency,
                monthlyBudget: user.monthlyBudget,
                name: user.name,
                email: user.email,
                language: user.language
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;