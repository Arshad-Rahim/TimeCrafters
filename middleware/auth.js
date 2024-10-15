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
   
    User.findOne({isAdmin:true})
    .then(data =>{
        
        if(data){
            next();
        }else{
            
            return res.redirect('/admin/adminLogin');
        }
    })
    .catch(error =>{
        console.log('Error in admin auth middleware');
        res.status(500).send('inernal server error');
    })
}

module.exports={
    userAuth,
    adminAuth,
}