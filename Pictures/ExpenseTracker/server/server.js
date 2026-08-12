const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

const allowedOrigins = [
    'https://expenses-manager-inky.vercel.app',
    'http://localhost:3000',
    'http://localhost:5000'
];

app.use(cors({
    origin: function (origin, callback) {
        // السماح للطلبات بدون Origin مثل server-to-server / health checks
        if (!origin) {
            return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        console.warn(`⚠️ CORS blocked origin: ${origin}`);
        return callback(new Error('Not allowed by CORS'));
    },

    methods: [
        'GET',
        'POST',
        'PUT',
        'PATCH',
        'DELETE',
        'OPTIONS'
    ],

    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Accept'
    ],

    credentials: false,

    optionsSuccessStatus: 204
}));

// معالجة طلبات CORS preflight
app.options('*', cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error('Not allowed by CORS'));
    },

    methods: [
        'GET',
        'POST',
        'PUT',
        'PATCH',
        'DELETE',
        'OPTIONS'
    ],

    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Accept'
    ],

    credentials: false,

    optionsSuccessStatus: 204
}));

app.use(express.json({ limit: '100kb' }));

// ===== إعدادات PWA =====
// تقديم ملف manifest.json
app.get('/manifest.json', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/manifest.json'));
});

// تقديم Service Worker
app.get('/sw.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(__dirname, '../client/sw.js'));
});

// تقديم أيقونات PWA
app.get('/icons/:icon', (req, res) => {
    const iconName = req.params.icon;
    const iconPath = path.join(__dirname, '../client/icons', iconName);
    res.sendFile(iconPath);
});

// تقديم صفحة offline
app.get('/offline.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/offline.html'));
});

// تقديم الملفات الثابتة من مجلد client
app.use(express.static(path.join(__dirname, '../client')));

// مسارات API
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/goals', require('./routes/savingGoalRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

// معالجة طلب favicon (إذا لم يكن الملف موجوداً)
app.get('/favicon.ico', (req, res) => {
    // محاولة إرسال الملف من مجلد client
    const faviconPath = path.join(__dirname, '../client/favicon.ico');
    res.sendFile(faviconPath, (err) => {
        if (err) {
            // إذا لم يوجد الملف، نرسل استجابة 204 (بدون محتوى)
            res.status(204).end();
        }
    });
});

// مسار اختبار البريد الإلكتروني (للتحقق من الإعدادات)
app.get('/api/test-email', async (req, res) => {
    const { testEmailConnection } = require('./services/emailService');
    const result = await testEmailConnection();
    res.json({
        success: result,
        message: result ? 'Email configured correctly' : 'Email configuration failed'
    });
});

// الصفحة الرئيسية
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// ===== مسار للتحقق من حالة الخادم (لـ UptimeRobot) =====
app.get('/api/status', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// ===== إبقاء الخادم نشطاً =====
const keepAlive = () => {
    const port = process.env.PORT || 5000;
    const url = `http://localhost:${port}/api/status`;
    
    setInterval(async () => {
        try {
            const response = await fetch(url);
            const data = await response.json();
            console.log(`✅ Keep-alive ping: ${data.message || 'OK'} at ${new Date().toISOString()}`);
        } catch (error) {
            console.error('❌ Keep-alive ping failed:', error.message);
        }
    }, 14 * 60 * 1000); // كل 14 دقيقة (أقل من 15 دقيقة التي تدخل فيها Render في السكون)
};

// تشغيل الـ Keep-alive بعد بدء الخادم
if (process.env.NODE_ENV !== 'production') {
    console.log('🔄 Keep-alive enabled for development');
} else {
    // في بيئة الإنتاج (Render)، شغّل الـ Keep-alive
    setTimeout(keepAlive, 60 * 1000); // انتظر دقيقة بعد بدء الخادم
}
