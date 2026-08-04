const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// تقديم الملفات الثابتة من مجلد client
app.use(express.static(path.join(__dirname, '../client')));

// مسارات API
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));

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

// الصفحة الرئيسية
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});