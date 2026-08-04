const axios = require('axios');
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 3600 }); // تخزين لمدة ساعة

const BASE_CURRENCY = 'DZD';

async function getExchangeRates() {
    let rates = cache.get('exchangeRates');
    if (rates) return rates;

    try {
        const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/${BASE_CURRENCY}`);
        rates = response.data.rates;
        cache.set('exchangeRates', rates);
        return rates;
    } catch (error) {
        console.error('Error fetching exchange rates:', error);
        // في حالة الفشل، نعيد أسعار صرف ثابتة (احتياطي)
        return { DZD: 1, EUR: 250, GBP: 300, SAR: 375, AED: 367 };
    }
}

async function convertCurrency(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return amount;
    const rates = await getExchangeRates();
    // تحويل من fromCurrency إلى الدولار أولاً، ثم إلى toCurrency
    const amountInBase = amount / rates[fromCurrency];
    return amountInBase * rates[toCurrency];
}

module.exports = { getExchangeRates, convertCurrency };