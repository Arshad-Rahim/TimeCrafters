const mongoose = require('mongoose');
const {Schema} = mongoose;

const userSchema= new Schema({
    name:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        require:true,
        unique:true,
    },
    password:{
        type:String,
        require:false,

    },
    googleId:{
        type:String,
        unique:true,
    },
    ConformPassword:{
        type:String,
        require:false,

    }
    // phone:{
    //     type:String,
    //     require:false,
    //     unique:false,
    //     sparse:true,
    //     default:null,
    // },
   

    

     //    googleId:{
    //     type:String,
    //     unique:false,
    // },
    // isBlocked:{
    //     type:Boolean,
    //     default:false,
    // },
    // isAdmin:{
    //     type:Boolean,
    //     default:false,
    // },
    // cart:[{
    //     type:Schema.Types.ObjectId,
    //     ref:"Cart"
    // }],
    // wallet:{
    //     type:Number,
    //     default:0,
    // },
    // whishlist:[{
    //     type:Schema.Types.ObjectId,
    //     ref:"Wishlist"
    // }],
    // orderHistory:[{
    //     type:Schema.Types.ObjectId,
    //     ref:"Order"
    // }],
    // createdOn:{
    //     type:Date,
    //     default:Date.now,
    // },
    // referalCode:{
    //     type:String,
    // },
    // redeemed:{
    //     type:Boolean,
    // },
    // redeemedUser:{
    //     type:Schema.Types.ObjectId,
    //     ref:"User"
    // },
    // searchHistory:[{
    //     category:{
    //         type:Schema.Types.ObjectId,
    //         ref:'Category',
    //     },
    //     brand:{
    //         type:String,
    //     },
    //     searchOn:{
    //         type:Date,
    //         default:Date.now,
    //     }
    // }]
})

const User = mongoose.model('User',userSchema);

module.exports = User;