// ===== زر ترجمة ذكي حسب اللغة المختارة =====
(function() {
    let translateInstance = null;
    let isTranslated = false;
    let currentTargetLang = 'en';

    // ===== تحديد اللغة المستهدفة بناءً على لغة الموقع =====
    function getTargetLanguage() {
        const currentLang = localStorage.getItem('lang') || 'ar';
        // إذا كانت اللغة العربية، نترجم إلى الإنجليزية (أو الفرنسية حسب اختيار المستخدم)
        // إذا كانت لغة أخرى، نترجم إلى العربية
        if (currentLang === 'ar') {
            return 'en'; // افتراضي: الإنجليزية
        } else {
            return 'ar'; // العودة للعربية
        }
    }

    // ===== تهيئة الترجمة =====
    function setupTranslate() {
        // التحقق من وجود المكتبة
        if (typeof initLanguageToggle !== 'function') {
            console.warn('⚠️ LanguageToggle library not loaded, retrying...');
            setTimeout(setupTranslate, 500);
            return;
        }

        const myButton = document.getElementById('translate-btn');
        if (!myButton) {
            console.warn('⚠️ translate-btn not found in DOM');
            return;
        }

        // تحديد اللغة المستهدفة
        const targetLang = getTargetLanguage();
        currentTargetLang = targetLang;

        // تحديث نص الزر
        const langSymbol = targetLang === 'en' ? 'En' : targetLang === 'fr' ? 'Fr' : 'ع';
        myButton.innerHTML = `🌐 ${langSymbol}`;
        myButton.title = `ترجمة إلى ${targetLang === 'en' ? 'الإنجليزية' : targetLang === 'fr' ? 'الفرنسية' : 'العربية'}`;

        // تهيئة الترجمة
        translateInstance = initLanguageToggle({
            sourceLang: 'ar',
            targetLang: targetLang,
            sourceSymbol: 'ع',
            targetSymbol: langSymbol,
            toggleButton: myButton
        });

        console.log(`✅ Translation button initialized (target: ${targetLang})`);
    }

    // ===== تحديث الترجمة عند تغيير اللغة =====
    function updateTranslationTarget() {
        const targetLang = getTargetLanguage();
        if (targetLang !== currentTargetLang) {
            currentTargetLang = targetLang;

            const myButton = document.getElementById('translate-btn');
            if (!myButton) return;

            const langSymbol = targetLang === 'en' ? 'En' : targetLang === 'fr' ? 'Fr' : 'ع';
            myButton.innerHTML = `🌐 ${langSymbol}`;
            myButton.title = `ترجمة إلى ${targetLang === 'en' ? 'الإنجليزية' : targetLang === 'fr' ? 'الفرنسية' : 'العربية'}`;

            // إعادة تهيئة الترجمة
            if (typeof initLanguageToggle === 'function') {
                translateInstance = initLanguageToggle({
                    sourceLang: 'ar',
                    targetLang: targetLang,
                    sourceSymbol: 'ع',
                    targetSymbol: langSymbol,
                    toggleButton: myButton
                });
                console.log(`🔄 Translation target updated to: ${targetLang}`);
            }
        }
    }

    // ===== الاستماع لتغيير اللغة =====
    document.addEventListener('languageChanged', updateTranslationTarget);

    // ===== تشغيل عند تحميل الصفحة =====
    if (document.readyState === 'complete') {
        setTimeout(setupTranslate, 300);
    } else {
        window.addEventListener('load', () => {
            setTimeout(setupTranslate, 300);
        });
    }

    // ===== إضافة مستمع لتغيير اللغة عبر قائمة اللغات =====
    const langSelector = document.getElementById('langSelector');
    if (langSelector) {
        langSelector.addEventListener('change', function() {
            // إعلام النظام بتغيير اللغة
            document.dispatchEvent(new CustomEvent('languageChanged'));
            // تحديث الترجمة بعد تأخير بسيط
            setTimeout(updateTranslationTarget, 200);
        });
    }

    console.log('📚 Translation module loaded');
})();
