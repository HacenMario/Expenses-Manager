const nodemailer = require('nodemailer');
const emailTranslations = require('../utils/emailTranslations');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendBudgetAlertEmail = async (user, totalExpenses, monthlyBudget) => {
    try {
        const lang = user.language || 'ar';
        const t = emailTranslations[lang] || emailTranslations.ar;
        const overspent = (totalExpenses - monthlyBudget).toFixed(2);

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: t.subject,
            html: `
                <h2>${t.greeting(user.name)}</h2>
                <p>${t.body1} <strong>${monthlyBudget} ${user.currency || 'DZD'}</strong>.</p>
                <p>${t.body2} <strong>${totalExpenses.toFixed(2)} ${user.currency || 'DZD'}</strong></p>
                <p>${t.body3} <strong>${overspent} ${user.currency || 'DZD'}</strong></p>
                <p>${t.advice}</p>
                <hr>
                <p>${t.footer}</p>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to ${user.email}`);
        return true;
    } catch (error) {
        console.error('❌ Email error:', error.message);
        return false;
    }
};

module.exports = { sendBudgetAlertEmail };
