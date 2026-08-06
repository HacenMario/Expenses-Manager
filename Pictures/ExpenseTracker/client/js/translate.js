// ===== نظام الترجمة الذكي =====
(function() {
    // ===== اللغات المتاحة =====
    const LANGUAGES = {
        ar: { code: 'ar', label: 'ع', name: 'العربية' },
        en: { code: 'en', label: 'En', name: 'الإنجليزية' },
        fr: { code: 'fr', label: 'Fr', name: 'الفرنسية' }
    };

    // ===== الحصول على اللغة الحالية للموقع =====
    function getSiteLanguage() {
        return localStorage.getItem('lang') || 'ar';
    }

    // ===== الحصول على اللغة المستهدفة للترجمة =====
    function getTargetLanguage() {
        const siteLang = getSiteLanguage();
        // إذا كانت لغة الموقع عربية، نترجم إلى الإنجليزية (افتراضياً)
        if (siteLang === 'ar') {
            return localStorage.getItem('translate_target') || 'en';
        }
        // إذا كانت لغة الموقع غير عربية، نترجم إلى العربية
        return 'ar';
    }

    // ===== تبديل اللغة المستهدفة =====
    function cycleTargetLanguage() {
        const siteLang = getSiteLanguage();
        if (siteLang !== 'ar') return 'ar';

        const current = localStorage.getItem('translate_target') || 'en';
        // التبديل بين الإنجليزية والفرنسية
        const next = current === 'en' ? 'fr' : 'en';
        localStorage.setItem('translate_target', next);
        return next;
    }

    // ===== تحديث واجهة الزر =====
    function updateButton(targetLang) {
        const btn = document.getElementById('translate-btn');
        if (!btn) return;

        const lang = LANGUAGES[targetLang] || LANGUAGES.en;
        btn.innerHTML = `🌐 ${lang.label}`;
        btn.title = `ترجمة إلى ${lang.name}`;
    }

    // ===== تهيئة الترجمة =====
    function initTranslation() {
        const btn = document.getElementById('translate-btn');
        if (!btn) {
            console.warn('⚠️ translate-btn not found');
            return;
        }

        // تحديد اللغة المستهدفة
        const targetLang = getTargetLanguage();
        updateButton(targetLang);

        // التحقق من وجود المكتبة
        if (typeof initLanguageToggle !== 'function') {
            console.warn('⏳ LanguageToggle library not loaded, retrying...');
            setTimeout(initTranslation, 500);
            return;
        }

        // تهيئة الترجمة
        const instance = initLanguageToggle({
            sourceLang: 'ar',
            targetLang: targetLang,
            sourceSymbol: 'ع',
            targetSymbol: LANGUAGES[targetLang].label,
            toggleButton: btn
        });

        console.log(`✅ Translation initialized: ${targetLang}`);
        return instance;
    }

    // ===== إعادة تهيئة الترجمة بعد تغيير اللغة المستهدفة =====
    function reinitTranslation(targetLang) {
        const btn = document.getElementById('translate-btn');
        if (!btn) return;

        if (typeof initLanguageToggle !== 'function') {
            console.warn('⚠️ LanguageToggle not available');
            return;
        }

        updateButton(targetLang);

        initLanguageToggle({
            sourceLang: 'ar',
            targetLang: targetLang,
            sourceSymbol: 'ع',
            targetSymbol: LANGUAGES[targetLang].label,
            toggleButton: btn
        });

        console.log(`🔄 Translation reinitialized: ${targetLang}`);
    }

    // ===== معالج النقر على الزر =====
    function handleButtonClick() {
        const siteLang = getSiteLanguage();
        if (siteLang === 'ar') {
            // تبديل اللغة المستهدفة (EN ↔ FR)
            const newTarget = cycleTargetLanguage();
            reinitTranslation(newTarget);
        } else {
            // العودة إلى العربية
            const newTarget = 'ar';
            localStorage.removeItem('translate_target');
            reinitTranslation(newTarget);
        }
    }

    // ===== تحديث الترجمة عند تغيير لغة الموقع =====
    function onLanguageChange() {
        const siteLang = getSiteLanguage();
        let targetLang;

        if (siteLang === 'ar') {
            targetLang = localStorage.getItem('translate_target') || 'en';
        } else {
            targetLang = 'ar';
        }

        reinitTranslation(targetLang);
    }

    // ===== تهيئة التطبيق =====
    function setup() {
        const btn = document.getElementById('translate-btn');
        if (!btn) {
            console.warn('⚠️ translate-btn not found, retrying...');
            setTimeout(setup, 300);
            return;
        }

        // إزالة أي مستمعين سابقين
        btn.removeEventListener('click', handleButtonClick);
        btn.addEventListener('click', handleButtonClick);

        // تهيئة الترجمة
        initTranslation();

        // الاستماع لتغيير اللغة
        document.removeEventListener('languageChanged', onLanguageChange);
        document.addEventListener('languageChanged', onLanguageChange);

        // الاستماع لتغيير قائمة اللغات
        const langSelector = document.getElementById('langSelector');
        if (langSelector) {
            langSelector.removeEventListener('change', onLanguageChange);
            langSelector.addEventListener('change', function() {
                document.dispatchEvent(new CustomEvent('languageChanged'));
            });
        }

        console.log('📚 Translation system ready (EN ↔ FR ↔ AR)');
    }

    // ===== تشغيل بعد تحميل الصفحة =====
    if (document.readyState === 'complete') {
        setTimeout(setup, 400);
    } else {
        window.addEventListener('load', () => {
            setTimeout(setup, 400);
        });
    }

    // ===== جعل الدوال متاحة للاستخدام الخارجي =====
    window.translate = {
        getTargetLanguage,
        cycleTargetLanguage,
        reinitTranslation,
        onLanguageChange
    };
})();
