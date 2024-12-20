const mongoose = require('mongoose');
const {Schema}= mongoose;

const categorySchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true,
    },
    description:{
        type:String,
        required:true,
    },
    isListed:{
        type:Boolean,
        default:true,
    },

   
},{timestamps:true})

const Category = mongoose.model('Category',categorySchema);
module.exports = Category;


categorySchema.index({ name: 1 });