const User = require('../models/userSchema');


const userAuth = (req,res,next) =>{


   
    if(req.session.user){
        User.findById(req.session.user)
        .then(data =>{
            if(data && !data.isBlocked){
               return next();
            }else{
                req.session.destroy();
               return  res.redirect('/login');
                
            }
        })
        .catch(error =>{
            console.log("Error in user auth Middleware",error);
            res.status(500).send('internal server error');
            
        })
    }else
    {   
        
        return res.redirect('/login');  
    }
}



const adminAuth = (req,res,next) =>{
   
try {
    if(req.session.admin){
        next();
    }else{
        return res.redirect('/admin/adminLogin');
    }
    
} catch (error) {
    console.log('Error in the adminAuth middleware',error);
}


}

module.exports={
    userAuth,
    adminAuth,
}