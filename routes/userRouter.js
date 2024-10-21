const express = require("express");
const router = express.Router();

const userController = require("../controllers/user/userController");
const {userAuth} = require('../middleware/auth');
const passport = require("passport");

router.get('/page-not-found',userController.pageNotFound )

router.get("/",userController.loadHome);
router.get("/login", userController.Loadlogin);
router.post('/login',userController.login);
router.get("/signup", userController.loadSignup);
router.post("/signup", userController.signup);
router.post("/verify-otp", userController.verifyOtpSignup);
router.post("/resent-otp", userController.resentOtp);
router.get('/userProductList',userController.getProductList);
router.get('/productDetails/:id',userController.getProductDetails);
// category filtering
router.get('/userProductList/:id',userController.getFilteredCategory);


// forgetPassword

router.get('/forgetPasswordEmail',userController.getForgetPasswordEmail);
router.post('/forgetPasswordEmail',userController.postForgetPasswordEmail);
router.post('/verify-otp-forgetPassword',userController.verifyOtpForgetPassword);
router.get('/setNewPassword',userController.getPasswordEnter);
router.post('/setNewPassword',userController.postPasswordEnter);  


// userProfile

router.get('/userProfile',userController.getUserProfile);
router.post('/userProfile',userController.postUserProfile);






// passport
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"],  prompt: "select_account"  })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/signup" }),
  (req, res) => {
    req.session.user = req.user._id;
    return res.redirect("/");
  }
);

module.exports = router;
 