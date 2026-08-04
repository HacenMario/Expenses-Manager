const nodemailer = require('nodemailer');
const emailTranslations = require('../utils/emailTranslations');

// ===== إعداد Nodemailer =====
let transporter = null;

const createTransporter = () => {
    if (!transporter) {
        // التحقق من وجود المتغيرات البيئية
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error('❌ EMAIL_USER or EMAIL_PASS not set in environment variables');
            return null;
        }

        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            // إعدادات إضافية لتحسين الموثوقية
            tls: {
                rejectUnauthorized: false
            },
            pool: true, // استخدام تجمع الاتصالات
            maxConnections: 1,
            rateLimit: true // تجنب الحظر من Gmail
        });
    }
    return transporter;
};

// ===== دالة إرسال البريد =====
const sendBudgetAlertEmail = async (user, totalExpenses, monthlyBudget) => {
    try {
        // التحقق من وجود البريد الإلكتروني للمستخدم
        if (!user || !user.email) {
            console.error('❌ User email is missing');
            return false;
        }

        // التحقق من وجود المتغيرات البيئية
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error('❌ Email credentials not configured');
            return false;
        }

        const lang = user.language || 'ar';
        const t = emailTranslations[lang] || emailTranslations.ar;
        const currency = user.currency || 'DZD';
        const overspent = (totalExpenses - monthlyBudget).toFixed(2);

        console.log(`📧 Preparing email to ${user.email} (${lang})`);

        const mailOptions = {
            from: `"Expense Tracker" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: t.subject,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                    <h2 style="color: #e53e3e; text-align: center;">${t.greeting(user.name)}</h2>
                    <hr style="border: none; border-top: 2px solid #e2e8f0;">
                    <p style="font-size: 16px; line-height: 1.6;">${t.body1} <strong style="color: #667eea;">${monthlyBudget.toFixed(2)} ${currency}</strong>.</p>
                    <p style="font-size: 16px; line-height: 1.6;">${t.body2} <strong style="color: #fc8181;">${totalExpenses.toFixed(2)} ${currency}</strong></p>
                    <p style="font-size: 16px; line-height: 1.6;">${t.body3} <strong style="color: #e53e3e;">${overspent} ${currency}</strong></p>
                    <div style="background-color: #fff5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
                        <p style="color: #c53030; font-weight: bold; text-align: center;">⚠️ ${t.advice}</p>
                    </div>
                    <hr style="border: none; border-top: 1px solid #e2e8f0;">
                    <p style="text-align: center; color: #718096; font-size: 14px;">${t.footer}</p>
                </div>
            `
        };

        const transporterInstance = createTransporter();
        if (!transporterInstance) {
            console.error('❌ Failed to create email transporter');
            return false;
        }

        // محاولة إرسال البريد مع محاولة إعادة المحاولة
        let attempts = 0;
        const maxAttempts = 3;
        let sent = false;

        while (attempts < maxAttempts && !sent) {
            try {
                const info = await transporterInstance.sendMail(mailOptions);
                console.log(`✅ Email sent to ${user.email} (attempt ${attempts + 1})`);
                console.log(`📧 Message ID: ${info.messageId}`);
                sent = true;
                return true;
            } catch (err) {
                attempts++;
                console.error(`❌ Email attempt ${attempts} failed:`, err.message);
                if (attempts < maxAttempts) {
                    // انتظار ثانيتين قبل إعادة المحاولة
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
        }

        console.error(`❌ Failed to send email after ${maxAttempts} attempts`);
        return false;

    } catch (error) {
        console.error('❌ Email service error:', error.message);
        return false;
    }
};

// ===== اختبار الاتصال بالبريد =====
const testEmailConnection = async () => {
    try {
        const transporterInstance = createTransporter();
        if (!transporterInstance) {
            console.error('❌ Cannot create transporter');
            return false;
        }

        await transporterInstance.verify();
        console.log('✅ Email transporter is ready');
        return true;
    } catch (error) {
        console.error('❌ Email transporter verification failed:', error.message);
        return false;
    }
};

module.exports = { 
    sendBudgetAlertEmail, 
    testEmailConnection,
    createTransporter 
};
