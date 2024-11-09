const express = require("express");
const router = express.Router();

const userController = require("../controllers/user/userController");
const cartController = require('../controllers/user/cartController');
const productController = require('../controllers/user/productController');
const addressController = require('../controllers/user/addressController');
const orderController = require('../controllers/user/orderController');
const wishlistController = require('../controllers/user/wishlistController');
const walletController = require('../controllers/user/walletController');

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


router.get('/userProductList',productController.getProductList);
router.get('/search',productController.getSearchProduct);
router.get('/productDetails/:id',productController.getProductDetails);

// category filtering
router.get('/userProductList/:id',productController.getFilteredCategory);


// forgetPassword

router.get('/forgetPasswordEmail',userController.getForgetPasswordEmail);
router.post('/forgetPasswordEmail',userController.postForgetPasswordEmail);
router.post('/verify-otp-forgetPassword',userController.verifyOtpForgetPassword);
router.get('/setNewPassword',userController.getPasswordEnter);
router.post('/setNewPassword',userController.postPasswordEnter);  


// userProfile

router.get('/userProfile',userAuth,userController.getUserProfile);
router.post('/userProfile',userController.postUserProfile);



router.get('/myAddress',addressController.getMyAddress);
router.get('/addAddress',addressController.getAddAddress);
router.post('/addAddress',addressController.postAddAddress);
router.get('/editAddress/:id',addressController.getEditAddress);
router.put('/editAddress/:id',addressController.putEditAddress);
router.delete('/deleteAddress/:id',addressController.deleteAddress);


router.get('/orderList',userAuth,orderController.getOrderList);
router.get('/orderDetails/:id',userAuth,orderController.getOrderDetails);
router.delete('/deleteOrderListProduct/:orderId/:productId', orderController.deleteOrderListProduct);


// cart
router.get('/cart',userAuth,cartController.getCart);
router.post('/cart/:id',cartController.postCart);
router.put('/cart',cartController.putQuantity);
router.delete('/deleteCartProduct/:id',cartController.deleteCartProduct);


// wishlist
router.post('/wishlist/:productId',wishlistController.wishlist);
router.get('/wishlist',userAuth,wishlistController.getWishlist);
router.delete('/deleteWishlistProduct/:id',wishlistController.deleteWishlistProduct);


// checkOut
router.get('/checkOut',userAuth,cartController.getCheckOut);
router.post('/applyCoupon',userAuth,cartController.applyCoupon);


// orderSuccess
router.post('/orderSuccess',userAuth,cartController.postOrderSuccess);
router.get('/orderSuccess',userAuth,cartController.getOrderSuccess)
// passport
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"],  prompt: "select_account"  })
);



// wallet
router.get('/wallet',userAuth,walletController.getWallet);
router.post('/addWalletFund',userAuth,walletController.addWalletFund);


router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/signup" }),
  (req, res) => {
    req.session.user = req.user._id;
    return res.redirect("/");
  }
);






router.get('/logout',userAuth,userController.logout);

module.exports = router;
 