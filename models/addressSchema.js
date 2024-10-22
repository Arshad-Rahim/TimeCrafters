const mongoose = require('mongoose');
const {Schema} = mongoose;


const addressSchema = new Schema({


    userId: {
        type: Schema.Types.ObjectId, 
        ref: 'User',   
        required: true,
    },
    houseName:{
        type:String,
        required:true,
    },
    street:{
        type:String,
        required:true,
    },
    landmark:{
        type:String,
        required:false,
    },
    city:{
        type:String,
        required:true,
    },
    district:{
        type:String,
        required:true,
    },
    state:{
        type:String,
        required:true,
    },
    zipCode:{
        type:String,
        required:true,
    },
    addressType:{
        type:String,
        enum:['home','work','other'],
        required:true,
    },
    mobileNumber:{
        type:String,
        required:true,
    },
    altMobileNumber:{
        type:String,
        required:false,
    }


},{timestamps:true});



const Address = mongoose.model('Address',addressSchema);
module.exports=Address;