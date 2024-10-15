const User = require('../../models/userSchema');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session');


const pageError = async(req,res) =>{
    res.render('page-error-404');
}

const loadLogin = async(req,res) =>{
   try {
    if(req.session.admin){
        return res.redirect('/admin');
    }
        return res.render('adminLogin',{message:null});
   } catch (error) {
    console.log('error in loadind admin loging page',error);
    return res.redirect('/admin/adminLogin');
     
   }
};
const login = async (req,res) =>{
    try {
        
        const {email,password} = req.body;
       

        const admin = await User.findOne({email,isAdmin:true});
        if(admin){
            const passwordMatch = await bcrypt.compare(password,admin.password);
            if(passwordMatch){
                req.session.admin=true;
              return  res.redirect('/admin');
            }else{
               return res.render('adminLogin',{message:'passord doesnot match'});
            }
        }
      return  res.render('adminLogin',{message:"Not be an Admin account"});
    } catch (error) {
        console.error('login error',error);
    }
}

const loadDashboard = async(req,res) =>{
    try {
        
        if(req.session.admin){
          return res.render('dashboard');
        }else{
           return res.redirect('/admin/adminLogin');
        }

    } catch (error) {
        console.log("Error to load Dashboard",error);
    }
}

const logout = async (req,res) =>{
    try{
        req.session.destroy(err =>{
            if(err){
                console.log("error in destroying adminSession");
            }else{
                return res.redirect('/admin/adminLogin');
            }
        })
    }
    
    catch(err) {
        console.log("unexpected during the logout");
    }
}

module.exports={
    loadLogin,
    login,
    loadDashboard,
    pageError,
    logout,
}