const mongoose = require('mongoose');
const {Schema}  =  mongoose;


const offerSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true,
    },
    percentage:{
        type:Number,
        required:true,
    },
    type:{
        type: String,
        enum: ["product", "category"],
        required: true,
    },
    targetId:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
    },
    targetName: {
        type: String,
        required: true,
      },
      endDate: {
        type: Date,
        required: true,
      },
},{timestamps:true})


const Offers = mongoose.model('Offers',offerSchema);
module.exports = Offers;