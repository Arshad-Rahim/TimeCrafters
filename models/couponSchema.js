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
    },

    users_applied: [
        {
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
          },
          used_count: {
            type: Number,
            default: 0,
            min: [0, "Used count cannot be negative"],
          },
        },
      ],


},{timestamps:true});

couponSchema.index({ endDate: 1 }, { expireAfterSeconds: 0 });

const Coupon = mongoose.model('Coupon',couponSchema);
module.exports = Coupon;