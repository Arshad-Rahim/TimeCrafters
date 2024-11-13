const User = require('../../models/userSchema');
const Wallet = require('../../models/walletShema');


const referralOffer = async(req,res) =>{
    try {
       const {referralCode} = req.body;
       const user = await User.findOne({referalCode:referralCode});
       if(!user){
        return res.status(400).json({
            success:false,
            message:"Invalid refferal code",
        })
       }
       const currentuserId = req.session.user;
       const currentUser = await User.findOne({_id:currentuserId});
       currentUser.appliedReferalCode = true;
       await currentUser.save();
       const currentUserWallet = await Wallet.findOne({userId:currentuserId});
       const userWallet = await Wallet.findOne({userId:user._id});
       const amount = 2000;
       const transactions = {
        transaction_date:Date.now(),
        transaction_type:'credit',
        transaction_status:'completed',
        amount:amount,
    }

   
    currentUserWallet.balance += +amount;
    currentUserWallet.transactions.push(transactions);
        await currentUserWallet.save();
        userWallet.balance += +amount;
        userWallet.transactions.push(transactions);
         await userWallet.save();
        return res.status(200).json({
            success:true,
            message:"Succesfully referal amount added to the wallet",
        })
    


    } catch (error) {
        console.log("Error in referraOffer",error)
    }
}




module.exports={
    referralOffer,
}