// ===== ملف الترجمات =====
const translations = {
    ar: {
        appTitle: 'إدارة المصاريف',
        welcome: 'مرحباً',
        logout: 'خروج',
        totalIncome: 'إجمالي الدخل',
        totalExpenses: 'إجمالي المصروفات',
        remaining: 'المتبقي',
        monthlyBudget: 'الميزانية الشهرية',
        clickToEdit: '(اضغط للتعديل)',
        transactionCount: 'عدد المعاملات',
        expenseDistribution: 'توزيع المصروفات حسب الفئة',
        expenseTrend: 'اتجاه المصروفات (آخر 7 أيام)',
        addTransaction: 'إضافة معاملة جديدة',
        description: 'الوصف',
        amount: 'المبلغ',
        category: 'الفئة',
        type: 'النوع',
        expense: 'مصروف',
        income: 'دخل',
        add: 'إضافة',
        manageCategories: 'إدارة الفئات',
        newCategoryName: 'اسم الفئة الجديدة',
        icon: 'رمز تعبيري',
        color: 'اللون',
        addCategory: 'إضافة فئة',
        allTransactions: 'جميع المعاملات',
        search: 'بحث...',
        allCategories: 'جميع الفئات',
        allTypes: 'الكل',
        exportCSV: 'تصدير CSV',
        actions: 'الإجراءات',
        noTransactions: 'لا توجد معاملات',
        login: 'تسجيل الدخول',
        register: 'إنشاء حساب جديد',
        email: 'البريد الإلكتروني',
        password: 'كلمة المرور',
        name: 'الاسم الكامل',
        dontHaveAccount: 'ليس لديك حساب؟',
        haveAccount: 'لديك حساب؟',
        registerNow: 'سجل الآن',
        loginNow: 'تسجيل الدخول',
        deleteConfirm: 'هل أنت متأكد من الحذف؟',
        default: 'افتراضي',
        edit: 'تعديل',
        delete: 'حذف',
        selectCategory: 'اختر الفئة',
        noCategories: 'لا توجد فئات مخصصة',
        fillAllFields: 'يرجى ملء جميع الحقول',
        serverError: 'خطأ في الاتصال بالخادم',
        enterCategoryName: 'يرجى إدخال اسم الفئة',
        editCategoryName: 'تعديل اسم الفئة',
        editIcon: 'تعديل الرمز التعبيري',
        editColor: 'تعديل اللون (رمز سداسي)',
        dailyExpenses: 'المصروفات اليومية',
        noDataToExport: 'لا توجد معاملات للتصدير',
       settings: 'الإعدادات',
preferredCurrency: 'العملة المفضلة',
emailNotifications: 'تفعيل الإشعارات البريدية عند تجاوز الميزانية',
notificationEmail: 'بريد الإشعارات (اختياري)',
saveSettings: 'حفظ الإعدادات',
settingsUpdated: '✅ تم تحديث الإعدادات بنجاح',
        date: 'التاريخ',
        budgetProgress: 'الميزانية الشهرية',
budgetStatusSafe: '✅ ضمن الميزانية',
budgetStatusWarning: '⚠️ اقتربت من الحد الأقصى',
budgetStatusDanger: '🚨 تجاوزت الميزانية!',
     overBudgetAlert: '⚠️ تحذير: لقد تجاوزت ميزانيتك الشهرية بمبلغ {amount} !',
     overBudgetToast: '⚠️ تحذير: بعد إضافة هذه المعاملة، تجاوزت ميزانيتك الشهرية ({budget}) بمبلغ {amount}',
     budgetWarning: '⚠️ تنبيه: المتبقي من ميزانيتك الشهرية هو {amount} فقط.',
        budgetUpdated: '✅ تم تحديث الميزانية الشهرية بنجاح!',
        enterValidNumber: 'الرجاء إدخال رقم موجب صحيح',
        defaultCategories: {
            Food: 'طعام',
            Transport: 'مواصلات',
            Books: 'كتب',
            Supplies: 'مستلزمات',
            Entertainment: 'ترفيه',
            Rent: 'إيجار',
            Utilities: 'فواتير',
            Healthcare: 'صحة',
            Other: 'أخرى'
        }
    },
    fr: {
        appTitle: 'Gestionnaire de dépenses',
        welcome: 'Bienvenue',
        logout: 'Déconnexion',
        totalIncome: 'Revenu total',
        totalExpenses: 'Dépenses totales',
        remaining: 'Reste',
        monthlyBudget: 'Budget mensuel',
        clickToEdit: '(Cliquez pour modifier)',
        transactionCount: 'Nombre de transactions',
        expenseDistribution: 'Répartition des dépenses par catégorie',
        expenseTrend: 'Tendance des dépenses (7 derniers jours)',
        addTransaction: 'Ajouter une transaction',
        description: 'Description',
        amount: 'Montant',
        category: 'Catégorie',
        type: 'Type',
        expense: 'Dépense',
        income: 'Revenu',
        add: 'Ajouter',
        manageCategories: 'Gérer les catégories',
        newCategoryName: 'Nom de la nouvelle catégorie',
        icon: 'Emoji',
        color: 'Couleur',
        addCategory: 'Ajouter une catégorie',
        allTransactions: 'Toutes les transactions',
        search: 'Rechercher...',
        allCategories: 'Toutes les catégories',
        allTypes: 'Tous',
        exportCSV: 'Exporter CSV',
        actions: 'Actions',
        noTransactions: 'Aucune transaction',
        login: 'Connexion',
        register: 'Créer un compte',
        email: 'Email',
        password: 'Mot de passe',
        name: 'Nom complet',
        dontHaveAccount: "Vous n'avez pas de compte ?",
        haveAccount: 'Vous avez déjà un compte ?',
        registerNow: "Inscrivez-vous",
        loginNow: 'Connectez-vous',
        deleteConfirm: 'Êtes-vous sûr de vouloir supprimer ?',
        default: 'Défaut',
        edit: 'Modifier',
        delete: 'Supprimer',
        selectCategory: 'Choisir une catégorie',
        noCategories: 'Aucune catégorie personnalisée',
        fillAllFields: 'Veuillez remplir tous les champs',
        serverError: 'Erreur de connexion au serveur',
        enterCategoryName: 'Veuillez saisir un nom de catégorie',
        editCategoryName: 'Modifier le nom de la catégorie',
        editIcon: "Modifier l'icône",
        editColor: 'Modifier la couleur (code hexadécimal)',
        dailyExpenses: 'Dépenses quotidiennes',
        noDataToExport: 'Aucune transaction à exporter',
        settings: 'Paramètres',
preferredCurrency: 'Devise préférée',
emailNotifications: 'Activer les notifications par e-mail en cas de dépassement du budget',
notificationEmail: 'E-mail de notification (facultatif)',
saveSettings: 'Enregistrer les paramètres',
settingsUpdated: '✅ Paramètres mis à jour avec succès',
        budgetProgress: 'Budget mensuel',
budgetStatusSafe: '✅ Dans le budget',
budgetStatusWarning: '⚠️ Approche de la limite',
budgetStatusDanger: '🚨 Budget dépassé !',
        date: 'Date',
        overBudgetAlert: '⚠️ Attention : vous avez dépassé votre budget mensuel de {amount} !',
        overBudgetToast: '⚠️ Attention : après cette transaction, vous avez dépassé votre budget mensuel ({budget}) de {amount}',
        budgetWarning: '⚠️ Attention : il ne vous reste que {amount} de votre budget mensuel.',
        budgetUpdated: '✅ Budget mensuel mis à jour avec succès !',
        enterValidNumber: 'Veuillez entrer un nombre valide (>= 0)',
        defaultCategories: {
            Food: 'Nourriture',
            Transport: 'Transport',
            Books: 'Livres',
            Supplies: 'Fournitures',
            Entertainment: 'Divertissement',
            Rent: 'Loyer',
            Utilities: 'Factures',
            Healthcare: 'Santé',
            Other: 'Autre'
        }
    },
    en: {
        appTitle: 'Expenses Manager',
        welcome: 'Welcome',
        logout: 'Logout',
        totalIncome: 'Total Income',
        totalExpenses: 'Total Expenses',
        remaining: 'Remaining',
        monthlyBudget: 'Monthly Budget',
        clickToEdit: '(Click to edit)',
        transactionCount: 'Transactions Count',
        expenseDistribution: 'Expense Distribution by Category',
        expenseTrend: 'Expense Trend (Last 7 Days)',
        addTransaction: 'Add Transaction',
        description: 'Description',
        amount: 'Amount',
        category: 'Category',
        type: 'Type',
        expense: 'Expense',
        income: 'Income',
        add: 'Add',
        manageCategories: 'Manage Categories',
        newCategoryName: 'New Category Name',
        icon: 'Emoji',
        color: 'Color',
        addCategory: 'Add Category',
        allTransactions: 'All Transactions',
        search: 'Search...',
        allCategories: 'All Categories',
        allTypes: 'All',
        exportCSV: 'Export CSV',
        actions: 'Actions',
        noTransactions: 'No transactions',
        login: 'Login',
        register: 'Create Account',
        email: 'Email',
        password: 'Password',
        name: 'Full Name',
        dontHaveAccount: "Don't have an account?",
        haveAccount: 'Already have an account?',
        registerNow: 'Register Now',
        loginNow: 'Login Now',
        deleteConfirm: 'Are you sure you want to delete?',
        default: 'Default',
        edit: 'Edit',
        delete: 'Delete',
        selectCategory: 'Select Category',
        noCategories: 'No custom categories',
        fillAllFields: 'Please fill all fields',
        serverError: 'Server connection error',
        enterCategoryName: 'Please enter a category name',
        editCategoryName: 'Edit category name',
        editIcon: 'Edit emoji',
        editColor: 'Edit color (hex code)',
        dailyExpenses: 'Daily Expenses',
        noDataToExport: 'No transactions to export',
        settings: 'Settings',
preferredCurrency: 'Preferred Currency',
emailNotifications: 'Enable email notifications when over budget',
notificationEmail: 'Notification Email (optional)',
saveSettings: 'Save Settings',
settingsUpdated: '✅ Settings updated successfully',
        date: 'Date',
        overBudgetAlert: '⚠️ Warning: You have exceeded your monthly budget by {amount}!',
        overBudgetToast: '⚠️ Warning: After adding this transaction, you exceeded your monthly budget ({budget}) by {amount}',
        budgetWarning: '⚠️ Notice: Only {amount} left of your monthly budget.',
        budgetUpdated: '✅ Monthly budget updated successfully!',
        enterValidNumber: 'Please enter a valid number (>= 0)',
        budgetProgress: 'Monthly Budget',
budgetStatusSafe: '✅ Within budget',
budgetStatusWarning: '⚠️ Approaching limit',
budgetStatusDanger: '🚨 Budget exceeded!',
        defaultCategories: {
            Food: 'Food',
            Transport: 'Transport',
            Books: 'Books',
            Supplies: 'Supplies',
            Entertainment: 'Entertainment',
            Rent: 'Rent',
            Utilities: 'Utilities',
            Healthcare: 'Healthcare',
            Other: 'Other'
        }
    }
};

let currentLang = localStorage.getItem('lang') || 'ar';

function getLang() {
    return currentLang;
}

function setLang(lang) {
    if (translations[lang]) {
        currentLang = lang;
        localStorage.setItem('lang', lang);
        applyTranslations();
    }
}

function t(key, params = {}) {
    const langData = translations[currentLang];
    if (!langData) return key;
    const keys = key.split('.');
    let value = langData;
    for (let k of keys) {
        if (value && value[k] !== undefined) value = value[k];
        else return key;
    }
    if (typeof value === 'function') return value(params);
    if (typeof value === 'string' && params) {
        // استبدال المتغيرات بين { }
        return value.replace(/\{(\w+)\}/g, (match, p1) => params[p1] || match);
    }
    return value;
}

function applyTranslations() {
    // ترجمة النصوص الثابتة في الصفحة
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        el.placeholder = t(key);
    });
    // ترجمة خيارات select
    document.querySelectorAll('select[data-i18n-options]').forEach(select => {
        const keyPrefix = select.getAttribute('data-i18n-options');
        const options = select.querySelectorAll('option');
        options.forEach(opt => {
            const val = opt.value;
            if (val) {
                const transKey = keyPrefix + '.' + val;
                opt.textContent = t(transKey);
            }
        });
    });
    // تحديث النص داخل عناصر أخرى (مثل التنبيهات)
    // سيتم التعامل معها داخل app.js
}
