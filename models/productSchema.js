const mongoose  = require('mongoose');
const {Schema} = mongoose;

const productSchema = new mongoose.Schema({

    productName:{
        type:String,
        required:true,
    },
    description:{
        type:String,
        required:true,
    },
    additionalInfo:{
        type:String,
        required:true,
    },
    brand:{
        type:String,
        required:true,
    },
    category:{
        type:Schema.Types.ObjectId,
        ref:'Category',
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
    productOffer:{
        type:Number,
        default:0,
    },
    isBlocked:{
        type:Boolean,
        default:false,
    },
    status:{
        type:String,
        enum:['Available','out of stock','Discountinued'],
        required:true,
        default:'Available'
    },
    variants:[
        {
            color:{
                type:String,

            },
            quantity:{
                type:Number,
                default:0,
            },
            productImage:{
                type:[String],
                required:true,
            },
        }
    ],  
    
},{timestamps:true});




const Product = mongoose.model('Product',productSchema);
module.exports=Product;

productSchema.index({ brand: 1, category: 1 });
productSchema.index({ createdAt: -1 });