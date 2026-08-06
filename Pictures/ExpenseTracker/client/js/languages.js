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
        savingGoals: 'أهداف الادخار',
        addGoal: 'إضافة هدف',
        newGoal: 'هدف جديد',
        goalName: 'اسم الهدف',
        targetAmount: 'المبلغ المستهدف',
        deadline: 'تاريخ الانتهاء',
        goalIcon: 'رمز تعبيري (🎯)',
        addAmount: 'إضافة مبلغ',
        enterAmount: 'أدخل المبلغ المراد إضافته:',
        enterValidAmount: 'يرجى إدخال مبلغ صحيح',
        goalAchieved: '🎉 تهانينا! لقد حققت هدفك!',
        goalCreated: 'تم إنشاء الهدف بنجاح',
        noGoals: 'لا توجد أهداف',
        daysLeft: 'يوم متبقي',
        deadlinePassed: 'انتهى الموعد',
        save: 'حفظ',
        preferredCurrency: 'العملة المفضلة',
        emailNotifications: 'تفعيل الإشعارات البريدية عند تجاوز الميزانية',
        notificationEmail: 'بريد الإشعارات (اختياري)',
        saveSettings: 'حفظ الإعدادات',
        settingsUpdated: '✅ تم تحديث الإعدادات بنجاح',
        analytics: 'تحليلات ذكية',
        loadingAnalytics: 'جاري تحميل التحليلات...',
        analyticsError: 'حدث خطأ أثناء تحميل التحليلات',
        analyticsConnectionError: 'حدث خطأ في الاتصال بالخادم',
        noAnalyticsData: 'لا توجد بيانات تحليلية متاحة',
        noInsights: 'لا توجد توصيات حالياً',
        loginRequired: 'يرجى تسجيل الدخول لعرض التحليلات',
        sessionExpired: 'انتهت صلاحية الجلسة. جاري إعادة التوجيه...',
        topCategory: 'أعلى فئة إنفاق',
        dailyAverage: 'متوسط الإنفاق اليومي',
        thisMonth: 'هذا الشهر',
        savingsRate: 'نسبة الادخار',
        daysLeft: 'الأيام المتبقية',
        untilMonthEnd: 'حتى نهاية الشهر',
        vsLastMonth: 'مقارنة بالشهر الماضي',
        moreThanLastMonth: 'أكثر من الشهر الماضي',
        lessThanLastMonth: 'أقل من الشهر الماضي',
        sameAsLastMonth: 'مثل الشهر الماضي',
        fastestGoal: 'أسرع هدف ادخار',
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
        trend: {
            up: 'صاعد 📈',
            down: 'هابط 📉',
            stable: 'متذبذب'
        },
        strength: {
            strong: 'قوية',
            medium: 'متوسطة',
            weak: 'ضعيفة'
        },
        correlationType: {
            positive: 'طردية (زيادة مع زيادة)',
            negative: 'عكسية (زيادة مع نقصان)',
            unknown: 'غير معروف'
        },
        anomalyReason: {
            high_outlier: 'أعلى من المعتاد',
            low_outlier: 'أقل من المعتاد',
            zscore: 'تباين كبير'
        },
        spendingType: {
            high: 'إنفاق مرتفع',
            medium: 'إنفاق متوسط',
            low: 'إنفاق منخفض'
        },
        prediction: {
            title: 'توقع المصروفات للشهر القادم',
            confidence: 'دقة:',
            trend: 'الاتجاه:'
        },
        anomalies: {
            title: 'المعاملات غير الطبيعية',
            unknown: 'معاملة غير معروفة',
            unknownReason: 'غير محدد'
        },
        correlations: {
            title: 'العلاقات بين الفئات'
        },
        summary: {
            title: 'ملخص سريع',
            totalExpenses: 'المصروفات الكلية',
            totalIncome: 'الدخل الكلي',
            transactionCount: 'عدد المعاملات',
            expenseCount: 'عدد معاملات المصروف',
            averageExpense: 'متوسط الإنفاق لكل معاملة مصروف'
        },
        insight: {
            general: {
                title: '💡 توصية',
                desc: 'تحليل مخصص بناءً على بياناتك',
                action: 'تابع مراقبة مصروفاتك'
            },
            budget_exceed_forecast: {
                title: '⚠️ تحذير: توقع تجاوز الميزانية',
                desc: 'من المتوقع أن تنفق {projected} DZD الشهر القادم، متجاوزاً ميزانيتك ({budget} DZD) بنسبة {percent}%',
                action: 'فكر في تقليل النفقات غير الضرورية'
            },
            budget_forecast: {
                title: '📊 توقع المصروفات الشهرية',
                desc: 'من المتوقع أن تنفق {projected} DZD الشهر القادم، ضمن ميزانيتك ({budget} DZD)',
                action: 'استمر في الإنفاق الحكيم'
            },
            correlation_found: {
                title: '🔗 علاقة بين الفئات',
                desc: 'علاقة {strength} {type} بين "{cat1}" و "{cat2}" (معامل الارتباط: {corr})',
                action: 'راقب هاتين الفئتين معاً للتحكم في الإنفاق'
            },
            anomaly_detected: {
                title: '🚨 نفقة غير معتادة',
                desc: 'تم اكتشاف معاملة غير عادية: "{desc}" بقيمة {amount} DZD ({reason})',
                action: 'تأكد من صحة هذه المعاملة'
            },
            goal_progress: {
                title: '🎯 تقدم هدف الادخار',
                desc: '{name}: تم تحقيق {progress}% من الهدف ({remaining} DZD متبقية)',
                action: 'أنت على وشك تحقيق هدفك! استمر'
            },
            spending_behavior: {
                title: '📈 نمط الإنفاق',
                desc: 'معظم إنفاقك ({count} معاملة) هو {type} بمتوسط {avg} DZD في "{category}"',
                action: 'راجع هذه المعاملات للبحث عن فرص للتوفير'
            },
            saving_suggestion: {
                title: '💡 اقتراح توفير',
                desc: 'فئة "{category}" تشكل {percent}% من إجمالي مصروفاتك ({amount} DZD)',
                action: 'حاول تقليل الإنفاق على "{category}" بنسبة 10% لتوفير {savings} DZD شهرياً'
            }
        },
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
        savingGoals: "Objectifs d'épargne",
        addGoal: 'Ajouter un objectif',
        newGoal: 'Nouvel objectif',
        goalName: "Nom de l'objectif",
        targetAmount: 'Montant cible',
        deadline: 'Date limite',
        goalIcon: 'Emoji (🎯)',
        addAmount: 'Ajouter un montant',
        enterAmount: 'Entrez le montant à ajouter :',
        enterValidAmount: 'Veuillez entrer un montant valide',
        goalAchieved: '🎉 Félicitations ! Vous avez atteint votre objectif !',
        goalCreated: 'Objectif créé avec succès',
        noGoals: 'Aucun objectif',
        daysLeft: 'jours restants',
        deadlinePassed: 'Délai dépassé',
        save: 'Enregistrer',
        preferredCurrency: 'Devise préférée',
        emailNotifications: 'Activer les notifications par e-mail en cas de dépassement du budget',
        notificationEmail: 'E-mail de notification (facultatif)',
        saveSettings: 'Enregistrer les paramètres',
        settingsUpdated: '✅ Paramètres mis à jour avec succès',
        analytics: 'Analyses IA',
        loadingAnalytics: '⏳ Chargement des analyses...',
        analyticsError: 'Erreur lors du chargement des analyses',
        analyticsConnectionError: 'Erreur de connexion au serveur',
        noAnalyticsData: 'Aucune donnée d\'analyse disponible',
        noInsights: 'Aucune recommandation pour le moment',
        loginRequired: 'Veuillez vous connecter pour voir les analyses',
        sessionExpired: 'Session expirée. Redirection...',
        topCategory: 'Catégorie de dépense la plus élevée',
        dailyAverage: 'Dépense quotidienne moyenne',
        thisMonth: 'Ce mois-ci',
        savingsRate: "Taux d'épargne",
        daysLeft: 'Jours restants',
        untilMonthEnd: "Jusqu'à la fin du mois",
        vsLastMonth: 'Comparaison avec le mois dernier',
        moreThanLastMonth: 'Plus que le mois dernier',
        lessThanLastMonth: 'Moins que le mois dernier',
        sameAsLastMonth: 'Comme le mois dernier',
        fastestGoal: 'Objectif le plus proche',
        date: 'Date',
        budgetProgress: 'Budget mensuel',
        budgetStatusSafe: '✅ Dans le budget',
        budgetStatusWarning: '⚠️ Approche de la limite',
        budgetStatusDanger: '🚨 Budget dépassé !',
        overBudgetAlert: '⚠️ Attention : vous avez dépassé votre budget mensuel de {amount} !',
        overBudgetToast: '⚠️ Attention : après cette transaction, vous avez dépassé votre budget mensuel ({budget}) de {amount}',
        budgetWarning: '⚠️ Attention : il ne vous reste que {amount} de votre budget mensuel.',
        budgetUpdated: '✅ Budget mensuel mis à jour avec succès !',
        enterValidNumber: 'Veuillez entrer un nombre valide (>= 0)',
        trend: {
            up: 'Hausse 📈',
            down: 'Baisse 📉',
            stable: 'Stable'
        },
        strength: {
            strong: 'Forte',
            medium: 'Moyenne',
            weak: 'Faible'
        },
        correlationType: {
            positive: 'Positive (augmentation ensemble)',
            negative: 'Négative (augmentation/diminution)',
            unknown: 'Inconnue'
        },
        anomalyReason: {
            high_outlier: 'Supérieur à la normale',
            low_outlier: 'Inférieur à la normale',
            zscore: 'Écart important'
        },
        spendingType: {
            high: 'Dépenses élevées',
            medium: 'Dépenses moyennes',
            low: 'Dépenses faibles'
        },
        prediction: {
            title: 'Prévision des dépenses pour le mois prochain',
            confidence: 'Précision :',
            trend: 'Tendance :'
        },
        anomalies: {
            title: 'Transactions anormales',
            unknown: 'Transaction inconnue',
            unknownReason: 'Non spécifié'
        },
        correlations: {
            title: 'Relations entre les catégories'
        },
        summary: {
            title: 'Résumé rapide',
            totalExpenses: 'Dépenses totales',
            totalIncome: 'Revenu total',
            transactionCount: 'Nombre de transactions',
            expenseCount: 'Nombre de transactions de dépenses',
            averageExpense: 'Dépense moyenne par transaction'
        },
        insight: {
            general: {
                title: '💡 Recommandation',
                desc: 'Analyse personnalisée basée sur vos données',
                action: 'Continuez à surveiller vos dépenses'
            },
            budget_exceed_forecast: {
                title: '⚠️ Alerte : dépassement de budget prévu',
                desc: 'Vous devriez dépenser {projected} DZD le mois prochain, dépassant votre budget ({budget} DZD) de {percent}%',
                action: 'Réduisez les dépenses inutiles'
            },
            budget_forecast: {
                title: '📊 Prévision des dépenses mensuelles',
                desc: 'Vous devriez dépenser {projected} DZD le mois prochain, dans votre budget ({budget} DZD)',
                action: 'Continuez à dépenser judicieusement'
            },
            correlation_found: {
                title: '🔗 Relation entre catégories',
                desc: 'Relation {strength} {type} entre "{cat1}" et "{cat2}" (coefficient: {corr})',
                action: 'Surveillez ces deux catégories ensemble'
            },
            anomaly_detected: {
                title: '🚨 Dépense inhabituelle',
                desc: 'Transaction inhabituelle : "{desc}" pour {amount} DZD ({reason})',
                action: 'Vérifiez cette transaction'
            },
            goal_progress: {
                title: '🎯 Progression de l\'objectif',
                desc: '{name} : {progress}% atteint ({remaining} DZD restants)',
                action: 'Vous êtes sur le point d\'atteindre votre objectif !'
            },
            spending_behavior: {
                title: '📈 Modèle de dépenses',
                desc: 'La plupart de vos dépenses ({count} transactions) sont {type} avec une moyenne de {avg} DZD dans "{category}"',
                action: 'Examinez ces transactions pour économiser'
            },
            saving_suggestion: {
                title: '💡 Suggestion d\'économie',
                desc: 'La catégorie "{category}" représente {percent}% de vos dépenses ({amount} DZD)',
                action: 'Réduisez les dépenses sur "{category}" de 10% pour économiser {savings} DZD par mois'
            }
        },
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
        savingGoals: 'Saving Goals',
        addGoal: 'Add Goal',
        newGoal: 'New Goal',
        goalName: 'Goal Name',
        targetAmount: 'Target Amount',
        deadline: 'Deadline',
        goalIcon: 'Emoji (🎯)',
        addAmount: 'Add Amount',
        enterAmount: 'Enter the amount to add:',
        enterValidAmount: 'Please enter a valid amount',
        goalAchieved: '🎉 Congratulations! You achieved your goal!',
        goalCreated: 'Goal created successfully',
        noGoals: 'No goals yet',
        daysLeft: 'days left',
        deadlinePassed: 'Deadline passed',
        save: 'Save',
        preferredCurrency: 'Preferred Currency',
        emailNotifications: 'Enable email notifications when over budget',
        notificationEmail: 'Notification Email (optional)',
        saveSettings: 'Save Settings',
        settingsUpdated: '✅ Settings updated successfully',
        analytics: 'AI Analytics',
        loadingAnalytics: '⏳ Loading analytics...',
        analyticsError: 'Error loading analytics',
        analyticsConnectionError: 'Server connection error',
        noAnalyticsData: 'No analytics data available',
        noInsights: 'No insights available',
        loginRequired: 'Please login to view analytics',
        sessionExpired: 'Session expired. Redirecting...',
        topCategory: 'Top Spending Category',
        dailyAverage: 'Daily Average Spending',
        thisMonth: 'This Month',
        savingsRate: 'Savings Rate',
        daysLeft: 'Days Left',
        untilMonthEnd: 'Until Month End',
        vsLastMonth: 'vs Last Month',
        moreThanLastMonth: 'More than last month',
        lessThanLastMonth: 'Less than last month',
        sameAsLastMonth: 'Same as last month',
        fastestGoal: 'Closest Saving Goal',
        date: 'Date',
        budgetProgress: 'Monthly Budget',
        budgetStatusSafe: '✅ Within budget',
        budgetStatusWarning: '⚠️ Approaching limit',
        budgetStatusDanger: '🚨 Budget exceeded!',
        overBudgetAlert: '⚠️ Warning: You have exceeded your monthly budget by {amount}!',
        overBudgetToast: '⚠️ Warning: After adding this transaction, you exceeded your monthly budget ({budget}) by {amount}',
        budgetWarning: '⚠️ Notice: Only {amount} left of your monthly budget.',
        budgetUpdated: '✅ Monthly budget updated successfully!',
        enterValidNumber: 'Please enter a valid number (>= 0)',
        trend: {
            up: 'Up 📈',
            down: 'Down 📉',
            stable: 'Stable'
        },
        strength: {
            strong: 'Strong',
            medium: 'Medium',
            weak: 'Weak'
        },
        correlationType: {
            positive: 'Positive (increase together)',
            negative: 'Negative (increase/decrease)',
            unknown: 'Unknown'
        },
        anomalyReason: {
            high_outlier: 'Above normal',
            low_outlier: 'Below normal',
            zscore: 'Large deviation'
        },
        spendingType: {
            high: 'High Spending',
            medium: 'Medium Spending',
            low: 'Low Spending'
        },
        prediction: {
            title: 'Expense Forecast for Next Month',
            confidence: 'Confidence:',
            trend: 'Trend:'
        },
        anomalies: {
            title: 'Anomalous Transactions',
            unknown: 'Unknown transaction',
            unknownReason: 'Not specified'
        },
        correlations: {
            title: 'Category Correlations'
        },
        summary: {
            title: 'Quick Summary',
            totalExpenses: 'Total Expenses',
            totalIncome: 'Total Income',
            transactionCount: 'Transactions Count',
            expenseCount: 'Expense Transactions Count',
            averageExpense: 'Average Expense per Transaction'
        },
        insight: {
            general: {
                title: '💡 Recommendation',
                desc: 'Custom analysis based on your data',
                action: 'Keep monitoring your expenses'
            },
            budget_exceed_forecast: {
                title: '⚠️ Warning: Budget Exceed Forecast',
                desc: 'You are projected to spend {projected} DZD next month, exceeding your budget ({budget} DZD) by {percent}%',
                action: 'Consider reducing unnecessary expenses'
            },
            budget_forecast: {
                title: '📊 Monthly Expense Forecast',
                desc: 'You are projected to spend {projected} DZD next month, within your budget ({budget} DZD)',
                action: 'Keep up the smart spending'
            },
            correlation_found: {
                title: '🔗 Category Correlation',
                desc: 'There is a {strength} {type} correlation between "{cat1}" and "{cat2}" (correlation: {corr})',
                action: 'Monitor these two categories together'
            },
            anomaly_detected: {
                title: '🚨 Unusual Expense',
                desc: 'Unusual transaction: "{desc}" for {amount} DZD ({reason})',
                action: 'Verify this transaction'
            },
            goal_progress: {
                title: '🎯 Saving Goal Progress',
                desc: '{name}: {progress}% achieved ({remaining} DZD remaining)',
                action: "You're close to achieving your goal! Keep going"
            },
            spending_behavior: {
                title: '📈 Spending Pattern',
                desc: 'Most of your spending ({count} transactions) is {type} averaging {avg} DZD in "{category}"',
                action: 'Review these transactions for savings'
            },
            saving_suggestion: {
                title: '💡 Saving Suggestion',
                desc: 'The category "{category}" accounts for {percent}% of your expenses ({amount} DZD)',
                action: 'Try reducing spending on "{category}" by 10% to save {savings} DZD per month'
            }
        },
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
        // ===== إعادة تحميل التحليلات عند تغيير اللغة =====
        if (window.loadAnalytics && typeof window.loadAnalytics === 'function') {
            setTimeout(() => window.loadAnalytics(), 100);
        }
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
    if (typeof value === 'string' && params) {
        return value.replace(/\{(\w+)\}/g, (match, p1) => params[p1] || match);
    }
    return value;
}

// جعل الدوال متاحة في النطاق العام
window.t = t;
window.setLang = setLang;
window.currentLang = currentLang;

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
