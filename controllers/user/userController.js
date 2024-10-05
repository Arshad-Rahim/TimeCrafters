
const User = require('../../models/userSchema');
const bcrypt = require('bcrypt');
const env = require('dotenv').config();
const nodemailer = require('nodemailer');



const loadHome = async (req, res) => {
  try {
    return res.render("home");
  } catch (error) {
    console.log("Home page  not found");
    res.status(500).send("Server error");
  }
};
const login = async (req, res) => {
  try {
    return res.render("login");
  } catch (error) {
    console.log("Login page not found");
    res.status(500).send("Server error");
  }
};

const loadSignup = async(req,res) =>{
    try{
        return res.render('signup');
    }
    catch(error){
        console.log("Signup page is not found");
        res.status(500).send("Server error");
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
    res.status(500).json({success:fasle,message:"An error occured"});
    
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



module.exports = {
  loadHome,
  login,
  loadSignup,
  signup,
  verifyOtp,
  resentOtp,
};
