const User = require('../../models/userSchema');
const Wallet = require('../../models/walletShema');

const getWallet = async(req,res) =>{
    try {

        const userId = req.session.user;
        const wallet = await Wallet.findOne({userId}).populate("userId");

        return res.render('wallet',{wallet,user:true});
        
    } catch (error) {
        console.log('Error in getWallet',error);
    }
}


const  addWalletFund = async(req,res) =>{
    try {

        const userId = req.session.user;
        const user = await User.findOne({_id:userId});
        const {amount} = req.body;
        const transactions = {
            transaction_date:Date.now(),
            transaction_type:'credit',
            transaction_status:'completed',
            amount:amount,
        }

        const existingWallet = await Wallet.findOne({userId});
        if(!existingWallet){
            const newWallet = new Wallet({
                userId:userId,
                balance:amount,
            })

        
            newWallet.transactions.push(transactions);

            await newWallet.save();
            return res.status(200).json({
                success:true,
                message:'Succesfully fund added to the wallet',
            })
        }else{
            existingWallet.balance += +amount;
            existingWallet.transactions.push(transactions);
            await existingWallet.save();
            return res.status(200).json({
                success:true,
                message:"Succesfully fund added to the wallet",
            })
        }
        
    } catch (error) {
      console.log('Error in addWalletFunds',error);  
    }
}



module.exports={
    getWallet,
    addWalletFund,
}