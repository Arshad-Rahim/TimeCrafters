const mongoose = require('mongoose');

const {Schema} = mongoose;

const cartSchema = new Schema({

    userId:{
        type:Schema.Types.ObjectId,
        ref:'User',
        required:true,
    },
    items:[

        {
            productId:{
                type:Schema.Types.ObjectId,
                ref:'Product',
                required:true,
            },
            productName:{
                type:String,
                required:true,
            },
            regularPrice:{
                type:Number,
                required:true,
            },
            salePrice:{
                type:Number,
                required:true,
            },
            quantity:{
                type:Number,
                required:true,
                default:1,
            },
            productAmount:{
                type:Number,
                required:true,
            },
            productImage:{
                type:String,
                required:true,
            },
            color:{
                type:String,
                required:true,
                default:'black',
            },
            colorStock:{
                type:Number,
                required:true,
            }
        
        }
    ],
    totalPrice:{
        type:Number,
        required:true,
        default:0,
    }
},{timestamps:true});



const Cart = mongoose.model('Cart',cartSchema);
module.exports = Cart;