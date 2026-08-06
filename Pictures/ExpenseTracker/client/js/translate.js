// ===== زر ترجمة ذكي مع دعم الفرنسية =====
(function() {
    let translateInstance = null;
    let isTranslated = false;
    let currentTargetLang = 'en';
    let currentSourceLang = 'ar';

    // ===== تحديد اللغة المستهدفة بناءً على لغة الموقع =====
    function getTargetLanguage() {
        const currentLang = localStorage.getItem('lang') || 'ar';
        currentSourceLang = 'ar'; // المصدر دائماً العربية
        
        // إذا كانت اللغة العربية، نترجم إلى الإنجليزية (أو الفرنسية حسب اختيار المستخدم)
        if (currentLang === 'ar') {
            // هنا يمكن للمستخدم اختيار الترجمة إلى الإنجليزية أو الفرنسية
            // نستخدم قيمة مخزنة أو نعرض خيارات
            const preferredTarget = localStorage.getItem('translate_target') || 'en';
            return preferredTarget; // 'en' أو 'fr'
        } else {
            // إذا كانت اللغة غير عربية، نترجم إلى العربية
            return 'ar';
        }
    }

    // ===== تحديث نص الزر =====
    function updateButtonLabel(targetLang) {
        const myButton = document.getElementById('translate-btn');
        if (!myButton) return;

        const langSymbol = targetLang === 'en' ? 'En' : targetLang === 'fr' ? 'Fr' : 'ع';
        const langName = targetLang === 'en' ? 'الإنجليزية' : targetLang === 'fr' ? 'الفرنسية' : 'العربية';
        myButton.innerHTML = `🌐 ${langSymbol}`;
        myButton.title = `ترجمة إلى ${langName}`;
    }

    // ===== تبديل لغة الترجمة المستهدفة (بين الإنجليزية والفرنسية) =====
    function cycleTranslateTarget() {
        const currentLang = localStorage.getItem('lang') || 'ar';
        if (currentLang === 'ar') {
            // التبديل بين الإنجليزية والفرنسية
            const currentTarget = localStorage.getItem('translate_target') || 'en';
            const newTarget = currentTarget === 'en' ? 'fr' : 'en';
            localStorage.setItem('translate_target', newTarget);
            return newTarget;
        }
        return 'ar';
    }

    // ===== تهيئة الترجمة =====
    function setupTranslate() {
        if (typeof initLanguageToggle !== 'function') {
            console.warn('⚠️ LanguageToggle library not loaded, retrying...');
            setTimeout(setupTranslate, 500);
            return;
        }

        const myButton = document.getElementById('translate-btn');
        if (!myButton) {
            console.warn('⚠️ translate-btn not found');
            return;
        }

        // تحديد اللغة المستهدفة
        let targetLang = getTargetLanguage();
        currentTargetLang = targetLang;

        // تحديث نص الزر
        updateButtonLabel(targetLang);

        // تهيئة الترجمة
        translateInstance = initLanguageToggle({
            sourceLang: 'ar',
            targetLang: targetLang,
            sourceSymbol: 'ع',
            targetSymbol: targetLang === 'en' ? 'En' : targetLang === 'fr' ? 'Fr' : 'ع',
            toggleButton: myButton
        });

        console.log(`✅ Translation button initialized (target: ${targetLang})`);

        // ===== إضافة حدث للنقر على الزر للتبديل بين اللغات =====
        myButton.addEventListener('click', function(e) {
            const currentLang = localStorage.getItem('lang') || 'ar';
            if (currentLang === 'ar') {
                // التبديل بين الإنجليزية والفرنسية
                const newTarget = cycleTranslateTarget();
                currentTargetLang = newTarget;
                updateButtonLabel(newTarget);
                
                // إعادة تهيئة الترجمة
                if (typeof initLanguageToggle === 'function') {
                    translateInstance = initLanguageToggle({
                        sourceLang: 'ar',
                        targetLang: newTarget,
                        sourceSymbol: 'ع',
                        targetSymbol: newTarget === 'en' ? 'En' : 'Fr',
                        toggleButton: myButton
                    });
                    console.log(`🔄 Switched translation to: ${newTarget}`);
                }
            } else {
                // إذا كانت اللغة غير عربية، نترجم إلى العربية
                const newTarget = 'ar';
                currentTargetLang = newTarget;
                updateButtonLabel(newTarget);
                
                if (typeof initLanguageToggle === 'function') {
                    translateInstance = initLanguageToggle({
                        sourceLang: 'ar',
                        targetLang: newTarget,
                        sourceSymbol: 'ع',
                        targetSymbol: 'ع',
                        toggleButton: myButton
                    });
                    console.log(`🔄 Switched translation to: Arabic`);
                }
            }
        });
    }

    // ===== تحديث الترجمة عند تغيير اللغة =====
    function updateTranslationTarget() {
        const targetLang = getTargetLanguage();
        if (targetLang !== currentTargetLang) {
            currentTargetLang = targetLang;
            const myButton = document.getElementById('translate-btn');
            if (!myButton) return;

            updateButtonLabel(targetLang);

            if (typeof initLanguageToggle === 'function') {
                translateInstance = initLanguageToggle({
                    sourceLang: 'ar',
                    targetLang: targetLang,
                    sourceSymbol: 'ع',
                    targetSymbol: targetLang === 'en' ? 'En' : targetLang === 'fr' ? 'Fr' : 'ع',
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
            document.dispatchEvent(new CustomEvent('languageChanged'));
            setTimeout(updateTranslationTarget, 200);
        });
    }

    console.log('📚 Translation module loaded (supports EN/FR)');
})();
