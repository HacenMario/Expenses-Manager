const mongoose = require('mongoose');

const SavingGoalSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Please add a goal name'],
        trim: true,
        maxlength: [50, 'Name cannot be more than 50 characters']
    },
    targetAmount: {
        type: Number,
        required: [true, 'Please add a target amount'],
        min: [0.01, 'Target amount must be greater than 0']
    },
    currentAmount: {
        type: Number,
        default: 0
    },
    deadline: {
        type: Date,
        required: [true, 'Please add a deadline date']
    },
    icon: {
        type: String,
        default: '🎯'
    },
    color: {
        type: String,
        default: '#667eea'
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('SavingGoal', SavingGoalSchema);
