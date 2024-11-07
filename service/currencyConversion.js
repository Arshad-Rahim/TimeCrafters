const axios = require('axios');
const convertCurrency = async (amount, fromCurrency = 'INR', toCurrency = 'USD') => {
  try {
    const apiKey = process.env.OPEN_EXCHANGE_API_KEY; 
    
    const response = await axios.get(`https://openexchangerates.org/api/latest.json?app_id=${apiKey}`);
    
    if (response.data && response.data.rates) {
      const usdToInrRate = response.data.rates[fromCurrency];
      const usdToUsdRate = response.data.rates[toCurrency];
      const convertedAmount = amount * (usdToUsdRate / usdToInrRate);
      return  convertedAmount.toFixed(2);;
    } else {
      throw new Error('Unable to retrieve exchange rates.');
    }

  } catch (error) {
    console.error('Currency conversion error:', error);
    throw error;
  }
};  

module.exports=convertCurrency