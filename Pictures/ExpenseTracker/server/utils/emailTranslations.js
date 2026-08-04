// ===== ترجمات البريد الإلكتروني =====
const emailTranslations = {
    ar: {
        subject: '⚠️ تنبيه: تجاوزت ميزانيتك الشهرية',
        greeting: (name) => `مرحباً ${name},`,
        body1: 'لقد تجاوزت ميزانيتك الشهرية المحددة بـ',
        body2: 'إجمالي مصروفاتك الحالية:',
        body3: 'المبلغ المتجاوز:',
        advice: 'يرجى مراجعة مصروفاتك لتجنب الإسراف.',
        footer: 'مع تحيات تطبيق إدارة المصروفات'
    },
    en: {
        subject: '⚠️ Alert: You have exceeded your monthly budget',
        greeting: (name) => `Hello ${name},`,
        body1: 'You have exceeded your monthly budget of',
        body2: 'Your current total expenses:',
        body3: 'Overspent amount:',
        advice: 'Please review your expenses to avoid overspending.',
        footer: 'Best regards, Expense Tracker App'
    },
    fr: {
        subject: '⚠️ Alerte : Vous avez dépassé votre budget mensuel',
        greeting: (name) => `Bonjour ${name},`,
        body1: 'Vous avez dépassé votre budget mensuel de',
        body2: 'Vos dépenses totales actuelles :',
        body3: 'Montant dépassé :',
        advice: 'Veuillez revoir vos dépenses pour éviter les excès.',
        footer: 'Cordialement, Application de suivi des dépenses'
    }
};

module.exports = emailTranslations;
