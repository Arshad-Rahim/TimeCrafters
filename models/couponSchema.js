const mongoose = require('mongoose');
const {Schema} = mongoose;


const couponSchema = new mongoose.Schema({

    code:{
        type:String,
        required:true,
        unique:true,
    },
    description:{
        type:String,
        },
    discountPercentage:{
        type:Number,
        required:true,
    },
    minimumPurchased:{
        type:Number,
        required:true,
    },
    maximumDiscount:{
        type:Number,
        required:true,
    },
    endDate:{
        type:Date,
        required:true,
    },
    usageLimit:{
        type:Number,
        required:true,
    }


},{timestamps:true});

couponSchema.index({ endDate: 1 }, { expireAfterSeconds: 0 });

const Coupon = mongoose.model('Coupon',couponSchema);
module.exports = Coupon;