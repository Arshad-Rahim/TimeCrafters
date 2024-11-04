const User = require('../models/userSchema');


const userAuth = async (req, res, next) => {
    try {
        if (!req.session.user) {
            console.log('No user session found');
            return res.redirect('/login');
        }

        const user = await User.findById(req.session.user);
        
        if (!user) {
            console.log('User not found in database');
            req.session.destroy((err) => {
                if (err) console.log('Error destroying session:', err);
            });
            return res.redirect('/login');
        }

        if (user.isBlocked) {
            console.log('User is blocked');
            req.session.destroy((err) => {
                if (err) console.log('Error destroying session:', err);
            });
            return res.status(403).redirect('/login?error=Account%20is%20blocked');
        }

        next();

    } catch (error) {
        console.log("Error in userAuth middleware:", error);
        return res.status(500).redirect('/login?error=Internal%20server%20error');
    }
};

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