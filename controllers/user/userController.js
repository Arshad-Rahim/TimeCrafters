const User = require("../../models/userSchema");
const bcrypt = require("bcrypt");
const env = require("dotenv").config();
const nodemailer = require("nodemailer");
const Category = require("../../models/categorySchema");
const Product = require("../../models/productSchema");
const Brand = require("../../models/brandSchema");
const Address = require("../../models/addressSchema");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Order = require("../../models/orderScheama");
const Cart = require("../../models/cartSchema");
const Wallet = require('../../models/walletShema');
const handleUserBonus = require('../../service/welcomeBonus');
const crypto = require('crypto');
const Wishlist = require('../../models/wishlistSchema');

const pageNotFound = async (req, res) => {
  try {
    res.render("page-404");
    res.status(500).send("Server error");
  } catch (error) {
    res.render("/pageNotFound");
    res.status(500).send("Server error");
  }
};

const Loadlogin = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.render("login");
    } else {
      return res.redirect("/");
    }
  } catch (error) {
    res.redirect("/pageNotFound");
    console.log("Login page not found");
    res.status(500).send("Server error");
  }
};

const loadHome = async (req, res) => {
  try {
    const user = req.session.user;
const categories = await  Category.find({ isListed: true });
const brands = await Brand.find({isBlocked:false});
    const [userData,productData] = await Promise.all([
      User.findOne({ _id: user }),
      Product.find({
        isBlocked: false,
        category: { $in: categories.map((category) => category._id) },
        brand:{$in:brands.map((brand) => brand.brandName) }
      })
        .sort({ createdOn: -1 })
        .limit(8),
    ])
   

    if (userData) {
      if (userData.isBlocked) {
        req.flash("error_msg", "User is blocked by the admin");
        return res.render("login", {
          error_msg: req.flash("error_msg"),
          success_msg: req.flash("success_msg"),
        });
      } else {
        const wishlist = await Wishlist.findOne({userId:user});
        return res.render("home", {
          user: userData,
          product: productData,
          cat: categories,
          wishlist,
        });
      }
    } else {
      return res.render("home", { product: productData ,user:null,wishlist:false});
    }
  } catch (error) {
    console.log("Home page  not found");
    res.status(500).send("Server error");
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const findUser = await User.findOne({ email: email });
    if (!findUser) {
      req.flash("error_msg", "User not found");
      return res.redirect("/login");
    }
    if (findUser.isBlocked) {
      req.flash("error_msg", "User is blocked by the admin");
      return res.redirect("/login");
    }

    const passwordMatch = await bcrypt.compare(password, findUser.password);

    if (!passwordMatch) {
      req.flash("error_msg", "Incorrect Password");
      return res.redirect("/login");
    }

    req.session.user = findUser._id;
    return res.redirect("/");
  } catch (error) {
    console.log("login error", error);
    req.flash("error_msg", "login failed please try again");
    return res.redirect("login");
  }
};

const loadSignup = async (req, res) => {
  try {
    if(!req.session.user){
      return res.render("signup");
    }else{
      return res.redirect('/');
    }
  } catch (error) {
    console.log("Signup page is not found");
    res.status(500).send("Server error");
  }
};

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sentVerificationEmail(email, otp) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.NODEMAILER_EMAIL,
      to: email,
      subject: "Verify your account",
      text: `Your OTP is ${otp}`,
      html: `<b>Your OTP ${otp}</b>`,
    });

    return info.accepted.length > 0;
  } catch (error) {
    console.error("Error to sending the email", error);
    return false;
  }
}

async function signup(req, res) {
  try {
    const { name, email, password, confirmPassword } = req.body;

    const findUser = await User.findOne({ email });

    if (findUser) {
      req.flash("error_msg", "User with this email is alredy exists");

      return res.redirect("signup");
    }

    const otp = generateOtp();

    const sentEmail = await sentVerificationEmail(email, otp);

    if (!sentEmail) {
      return res.json("email-error");
    }

    req.session.userOtp = otp;
    req.session.userData = { name, email, password };

    res.render("verify-otp");
    console.log(`OTP sent ${otp}`);
  } catch (error) {
    console.error("Error for signup", error);
  }
}

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.error("Error in Hashing the password", error);
  }
};

const verifyOtpSignup = async (req, res) => {
  try {
    const { otp } = req.body;

   function generateCode(length = 8) {
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      
      // Generate first part using timestamp (first 4 chars)
      const timestamp = Date.now().toString(36).slice(-4).toUpperCase();
      code += timestamp;
      
      // Generate remaining random characters
      const remainingLength = length - timestamp.length;
      for (let i = 0; i < remainingLength; i++) {
          const randomIndex = crypto.randomInt(0, characters.length);
          code += characters[randomIndex];
      }
      
      return code;
  }
    const referalCode = generateCode();

    if (otp == req.session.userOtp) {
      const user = req.session.userData;
      const passwordHash = await securePassword(user.password);

      const saveUserData = new User({
        name: user.name,
        email: user.email,
        password: passwordHash,
        referalCode:referalCode,
      });

      await saveUserData.save();
      req.session.user = saveUserData._id;

      await handleUserBonus(saveUserData._id, 'welcome');

      res.json({ success: true, redirectUrl: "/" });
    } else {
      res
        .status(400)
        .json({ success: false, message: "Invalid OTP, Please try again" });
    }
  } catch (error) {
    console.log("Error while Verifiying OTP", error);
    res.status(500).json({ success: false, message: "An error occured" });
  }
};

const resentOtp = async (req, res) => {
  try {
    const { email } = req.session.userData;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email not found in session" });
    }

    const otp = generateOtp();
    req.session.userOtp = otp;

    const emailSend = await sentVerificationEmail(email, otp);

    if (emailSend) {
      console.log(`Resent otp is ${otp}`);
      res
        .status(200)
        .json({ success: true, message: "OTP resend successfully" });
    } else {
      res
        .status(500)
        .json({
          success: false,
          message: "Error to resend OTP.Please try again",
        });
    }
  } catch (error) {
    console.error("Error to resending OTP", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Internal server error. Please try again",
      });
  }
};

const getForgetPasswordEmail = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.render("forgetPasswordEmail");
    } else {
      return res.redirect("/");
    }
  } catch (error) {}
};

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sentVerificationEmail(email, otp) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.NODEMAILER_EMAIL,
      to: email,
      subject: "Verify your account",
      text: `Your OTP is ${otp}`,
      html: `<b>Your OTP ${otp}</b>`,
    });

    return info.accepted.length > 0;
  } catch (error) {
    console.error("Error to sending the email", error);
    return false;
  }
}

async function postForgetPasswordEmail(req, res) {
  try {
    const { email } = req.body;

    req.session.userData = { email };

    const findUser = await User.findOne({ email: email });

    if (!findUser) {
      req.flash("error_msg", "The email is not registered");
      return res.redirect("/forgetPasswordEmail");
    } else {
      const otp = generateOtp();

      const sentEmail = await sentVerificationEmail(email, otp);

      if (!sentEmail) {
        return res.json("email-error");
      }

      req.session.userOtp = otp;

      console.log(`OTP sent ${otp}`);
      return res.render("forgetPasswordOTP");
    }
  } catch (error) {
    console.log("Error in postForgetPassword", error);
  }
}


const verifyOtpForgetPassword = async (req, res) => {
  try {
    const { otp } = req.body;

    if (otp == req.session.userOtp) {
      return res.json({ success: true, redirectUrl: "/setNewPassword" });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Invalid OTP, Please try again" });
    }
  } catch (error) {
    console.log("Error while Verifiying OTP", error);
    return res
      .status(500)
      .json({ success: false, message: "An error occured" });
  }
};

const getPasswordEnter = async (req, res) => {
  try {
    return res.render("passwordEnter");
  } catch (error) {}
};

const postPasswordEnter = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const { email } = req.session.userData;
    const passwordHash = await securePassword(newPassword);

    const updatePassword = await User.findOneAndUpdate(
      { email: email },
      { password: passwordHash },
      { new: true }
    );

    if (updatePassword) {
      return res.status(200).json({
        success: true,
        message: "Password updated succesfully",
        redirectURL: "/login",
      });
    } else {
      return res.status(400).json({ error: "Password not updated" });
    }
  } catch (error) {
    console.log("Error in postPasswordEnter", error);
  }
};


const getUserProfile = async (req, res) => {
  try {
    if (req.session.user) {
      const id = req.session.user;

      const userData = await User.findOne({ _id: id });

      return res.render("userProfile", { user: userData });
    } else {
      return res.redirect("/login");
    }
  } catch (error) {
    console.log("Error in getUserProfile", error);
  }
};

const postUserProfile = async (req, res) => {
  try {
    const { name } = req.body;
    const id = req.session.user;

    const updateName = await User.findByIdAndUpdate(
      { _id: id },
      { name: name },
      { new: true }
    );

    if (updateName) {
      return res.status(200).json({
        success: true,
        message: "User Profile updated Succesfully",
      });
    } else {
      return res.status(400).json({ error: "Name not Updated" });
    }
  } catch (error) {
    console.log("Error in postUserProfile", error);
  }
};

const logout = async (req, res) => {
  try {
    delete req.session.user;
    return res.redirect("/");
  } catch (error) {
    console.log("Error in logout", error);
  }
};

module.exports = {
  loadHome,
  Loadlogin,
  loadSignup,
  signup,
  verifyOtpSignup,
  resentOtp,
  pageNotFound,
  login,
  getForgetPasswordEmail,
  postForgetPasswordEmail,
  verifyOtpForgetPassword,
  getPasswordEnter,
  postPasswordEnter,
  getUserProfile,
  postUserProfile,
  logout,
};
