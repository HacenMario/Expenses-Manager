const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    description: { type: String, required: true, trim: true, maxlength: 500 },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, default: 'DZD' },
    category: { type: String, required: true, trim: true },
    type: { type: String, required: true, enum: ['income', 'expense'], default: 'expense' },
    date: { type: Date, default: Date.now },
    notes: { type: String, maxlength: 500 }
});

module.exports = mongoose.model('Transaction', TransactionSchema);