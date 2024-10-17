
const User = require('../../models/userSchema');
const bcrypt = require('bcrypt');
const env = require('dotenv').config();
const nodemailer = require('nodemailer');
const Category = require('../../models/categorySchema');
const Product = require('../../models/productSchema');
const Brand = require('../../models/brandSchema');


const pageNotFound = async (req,res) =>{
  try {
    res.render('page-404');
    res.status(500).send("Server error");
  } catch (error) {
    res.render('/pageNotFound');
    res.status(500).send("Server error");
  }
};


const loadHome = async (req, res) => {
  try {
    const user = req.session.user;
    
    const categories = await Category.find({isListed:true});
    

    const productData = await Product.find({
      isBlocked: false,
      category: { $in: categories.map(category => category._id) }
    }).sort({ createdOn: -1 }).limit(8); 

   


    if(user){
      const userData = await User.findOne({_id:user._id});
     
      return res.render("home",{user:userData , product:productData,cat:categories});
    }else{
      return res.render('home',{product:productData});
    }
    
  } catch (error) {
    console.log("Home page  not found");
    res.status(500).send("Server error");
  }
};





const Loadlogin = async (req, res) => {
  try {
    if(!req.session.user){
      return res.render("login");
    }else{
     return  res.redirect('/');
    }
    
  } catch (error) {
    res.redirect('/pageNotFound')
    console.log("Login page not found");
    res.status(500).send("Server error");
  }
};



const login = async(req,res) =>{
  try {
   
    const {email,password} = req.body;
    

    const findUser = await User.findOne({email:email})
    if(!findUser){

      req.flash('error_msg',"User not found")
      return res.redirect('/login')
    }
    if(findUser.isBlocked){

      req.flash('error_msg',"User is blocked by the admin")
      return res.redirect('/login')
    }
    
    const passwordMatch = await bcrypt.compare(password,findUser.password);

    if(!passwordMatch){
      req.flash('error_msg',"Incorrect Password")
      return res.redirect('/login')
    }

    req.session.user = findUser._id;
   return res.redirect('/');
  } catch (error) {
    console.log('login error',error);
    req.flash('error_msg',"login failed please try again")
    return res.redirect('login');
  }
}



const loadSignup = async(req,res) =>{
    try{
        return res.render('signup');
    }
    catch(error){
        console.log("Signup page is not found");
        res.status(500).send("Server error");
    }
}



function generateOtp(){
  return Math.floor(100000 + Math.random()*900000).toString();
}


  
async function sentVerificationEmail(email,otp){
  try {

   const transporter = nodemailer.createTransport({
    service:'gmail',
    port:587,
    secure:false,
    requireTLS:true,
    auth:{
      user:process.env.NODEMAILER_EMAIL,
      pass:process.env.NODEMAILER_PASSWORD,
  
    }
   
   })
   

                                                                            
   const info = await transporter.sendMail({
    from:process.env.NODEMAILER_EMAIL,
    to:email,
    subject:'Verify your account',
    text:`Your OTP is ${otp}`,
    html:`<b>Your OTP ${otp}</b>`
    
  })

  return info.accepted.length>0;
   
}catch (error) {
    console.error('Error to sending the email',error);
    return false;
}
}

// const signup = async(req,res) =>{
//   const {name,email,password}=req.body; 

//   try{
//     const newUser = new User({name,email,password});

//     await newUser.save();
    
//     return res.redirect('/signup')
//   }catch(error){
//     console.error("Error to save to database",error);
//     res.status(500).send("Internal server error");

//   }
// }

async function signup(req, res) {
  try {
    const {name,email,password,ConformPassword } = req.body;

    if (password !== ConformPassword) {
      return res.render('signup', { message: "password desn't match" });
      
    }

    const findUser = await User.findOne({ email });
    if (findUser) {
      return res.render('signup', { message: "User with this email is alredy exists" });
    }

    const otp = generateOtp();


    const sentEmail = await sentVerificationEmail(email, otp);

    if (!sentEmail) {
      return res.json('email-error');
    }


    req.session.userOtp = otp;
    req.session.userData = { name,email,password };

    res.render('verify-otp');
    console.log(`OTP sent ${otp}`);

  } catch (error) {
    console.error('Error for signup', error);
    // res.redirect('/pageNotFound');
  }
}


const securePassword = async (password) =>{
    try {

      const passwordHash = await bcrypt.hash(password,10);
    return passwordHash;
      
    } catch (error) {

      console.error("Error in Hashing the password",error);
      
    }
}



const verifyOtp = async (req,res) =>{
  try {

    const {otp} = req.body;

    if( otp == req.session.userOtp){
      const user = req.session.userData;
      const passwordHash = await securePassword(user.password);

      const saveUserData = new User({
        name:user.name,
        email:user.email,
        password:passwordHash,
      })

        await saveUserData.save();
        req.session.user = saveUserData._id;
        res.json({success:true,redirectUrl:'/'});
    }else{
      res.status(400).json({success:fasle,message:"Invalid OTP, Please try again"})
    }
    
  } catch (error) {

    console.log('Error while Verifiying OTP',error);
    res.status(500).json({success:false,message:"An error occured"});
    
  }
}


const resentOtp = async (req,res) =>{
  try {
    
    const {email} = req.session.userData;

    if(!email){
     return res.status(400).json({success:false,message:"Email not found in session"})
    }

    const otp = generateOtp();
    req.session.userOtp = otp;

    const emailSend = await sentVerificationEmail(email,otp);

    if(emailSend){
      console.log(`Resent otp is ${otp}`);
      res.status(200).json({success:true,message:"OTP resend successfully"});
    }else{
      res.status(500).json({success:false,message:"Error to resend OTP.Please try again"});
    }


  } catch (error) {
    console.error('Error to resending OTP',error);
    res.status(500).json({success:false,message:"Internal server error. Please try again"});
  }
}


const getProductList = async(req,res) =>{
  try {

    const user = req.session.user;
    const categories = await Category.find({isListed:true});
    const productData = await Product.find({
      isBlocked:false,
      category:{$in:categories.map(category =>category._id)},
     
    }).populate('category').sort({createdAt:-1});

    if(user){
      const userData = await User.findOne({_id:user._id});
      
      return res.render('userProductList',{user:userData,product:productData,cat:categories});
    }else{
      return res.render('userProductList',{product:productData,cat:categories});
    }

  
    
  } catch (error) {
    console.error('Error in getting the Product list',error);
  }
}






const getProductDetails = async(req,res) =>{
  try {
   

    const id = req.params.id;
    const productDetails = await Product.findById({_id:id}).populate('category');



    const user = req.session.user;
    const categories = await Category.find({isListed:true});
    
    const productData = await Product.find({
      isBlocked:false,
      category:{$in:categories.map(category =>category._id)},
     

    }).populate('category').sort({createdAt:-1})
    
    if(user){
      const userData = await User.findOne({_id:user._id});
      
      return res.render('productDetails',{user:userData,product:productData,cat:categories,id,productDetails});
      
    }else{

      return res.render('productDetails',{product:productData,cat:categories,id,productDetails});
    }
    
  } catch (error) {
    console.error('Error in rendering ProductDetails page',error);
  }
}



const getFilteredCategory = async(req,res) =>{
  const categoryId = req.params.id;
  try {

    let product;

    if(categoryId == "All"){
      product = await Product.find();
    }else{
      
      product = await Product.find({category:categoryId});
    }

    const cat = await Category.find();
    return res.render('userProductList',{product,cat,categoryId});
    
    
  } catch (error) {
    
  }
}




module.exports = {
  loadHome,
  Loadlogin,
  loadSignup,
  signup,
  verifyOtp,
  resentOtp,
  pageNotFound,
  login,
  getProductList,
  getProductDetails,
  getFilteredCategory,

};
