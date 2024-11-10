
const Wallet = require('../models/walletShema');
const handleUserBonus = async (userId, bonusType) => {
    try {
      const transactions = {
        transaction_date: Date.now(),
        transaction_type: 'credit',
        transaction_status: 'completed',
        amount: 100,
        description: `${bonusType} bonus`
      };
  
      const existingWallet = await Wallet.findOne({ userId });
      
      if (!existingWallet) {
        const newWallet = new Wallet({
          userId: userId,
          balance: 100,
          transactions: [transactions]
        });
        await newWallet.save();
      }
      return true;
  } catch (error) {
    console.error('Error handling user bonus:', error);
    return false;
  }
};


module.exports = handleUserBonus