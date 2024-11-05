
const Coupon = require('../../models/couponSchema');

const couponManagment = async(req,res) =>{
    try {

        const coupon = await Coupon.find();

        return res.render('couponManagment',{coupon});
        
    } catch (error) {
        console.log('Error in couponManagment',error);
    }
}


const addCoupon = async(req,res) =>{
    try {

        const {code,description,discount,minPurchase,maxDiscount,expirationDate,usageLimit} = req.body;

     const existingCode = await Coupon.findOne({
        code:{ $regex: new RegExp(`^${code}$`, "i")}
     });

     if(existingCode){
        return res.status(400).json({
            success:false,
            message:'Coupon name alredy existing',
        });
     }else{
        const newCoupon = new Coupon({
            code:code,
            description:description,
            discountPercentage:discount,
            minimumPurchased:minPurchase,
            maximumDiscount:maxDiscount,
            endDate:expirationDate,
            usageLimit:usageLimit,
        })

        await newCoupon.save();
        return res.status(200).json({
            success:true,
            message:'Coupon added Succesfully',
        })
     }
        
    } catch (error) {
        console.log("Error in addCoupon ",error);
    }
}


const deleteCoupon = async(req,res) =>{
    try {

        const couponId = req.query.id;
        
        if(!couponId){
            return res.status(400).json({
                success:false,
                message:'Error in getting the Id of the coupon',
            })
        }else{
             await Coupon.deleteOne({_id:couponId});
             return res.status(200).json({
                success:true,
                message:'Coupon deleted Succesfully',
                redirectURL:'/admin/couponManagment',
             })

        }

        
    } catch (error) {
        console.log('Error in deleteCoupon',error);
    }
}

module.exports={
    couponManagment,
    addCoupon,
    deleteCoupon,
}