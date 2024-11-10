const mongoose = require('mongoose');
const {Schema} = mongoose;


const walletSchema = new Schema({

    userId:{
        type:Schema.Types.ObjectId,
        ref:'User',
        required:true,
    },
    balance:{
        type:Number,
        default:0,
    },
    transactions: [
        {
          order_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "order",
          },
          transaction_date: {
            type: Date,
            required: true,
          },
          transaction_type: {
            type: String,
            enum: ["debit", "credit"],
            required: true,
          },
          transaction_status: {
            type: String,
            enum: ["pending", "completed", "failed"],
            required: true,
          },
          amount: {
            type: Number,
            required: true,
          },
          description:{
            type:String,
            required:false,
          }
        },
      ],


},{timestamps:true});


const Wallet = mongoose.model('Wallet',walletSchema);
module.exports = Wallet;