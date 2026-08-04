const nodemailer = require('nodemailer');

// إعدادات البريد الإلكتروني - استخدم إعداداتك الخاصة
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', // أو أي مزود آخر
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER, // بريدك الإلكتروني
        pass: process.env.EMAIL_PASS  // كلمة مرور التطبيق
    }
});

const sendBudgetAlertEmail = async (userEmail, userName, overspentAmount, monthlyBudget, totalExpenses) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: `⚠️ تنبيه: تجاوزت ميزانيتك الشهرية`,
        html: `
            <h2>مرحباً ${userName},</h2>
            <p>لقد تجاوزت ميزانيتك الشهرية المحددة بـ <strong>${monthlyBudget}</strong>.</p>
            <p>إجمالي مصروفاتك الحالية: <strong>${totalExpenses}</strong></p>
            <p>المبلغ المتجاوز: <strong>${overspentAmount}</strong></p>
            <p>يرجى مراجعة مصروفاتك لتجنب الإسراف.</p>
            <hr>
            <p>مع تحيات تطبيق إدارة المصروفات</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ تم إرسال بريد إشعار إلى ${userEmail}`);
    } catch (error) {
        console.error('❌ فشل إرسال البريد:', error);
    }
};

module.exports = { sendBudgetAlertEmail };