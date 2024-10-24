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
    goldenQuantity:{
        type:Number,
        default:true,
    },
    blackQuantity:{
        type:Number,
        default:true,
    },
    silverQuantity:{
        type:Number,
        default:true,
    },
    productImage:{
        type:[String],
        required:true,
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
    
},{timestamps:true});




const Product = mongoose.model('Product',productSchema);
module.exports=Product;