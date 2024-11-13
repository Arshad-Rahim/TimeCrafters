const express = require("express");
const router = express.Router();

const userController = require("../controllers/user/userController");
const cartController = require('../controllers/user/cartController');
const productController = require('../controllers/user/productController');
const addressController = require('../controllers/user/addressController');
const orderController = require('../controllers/user/orderController');
const wishlistController = require('../controllers/user/wishlistController');
const walletController = require('../controllers/user/walletController');
const referalController = require('../controllers/user/referalController');
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
router.post('/userProfile',userAuth,userController.postUserProfile);



router.get('/myAddress',userAuth,addressController.getMyAddress);
router.get('/addAddress',userAuth,addressController.getAddAddress);
router.post('/addAddress',userAuth,addressController.postAddAddress);
router.get('/editAddress/:id',userAuth,addressController.getEditAddress);
router.put('/editAddress/:id',userAuth,addressController.putEditAddress);
router.delete('/deleteAddress/:id',userAuth,addressController.deleteAddress);


router.get('/orderList',userAuth,orderController.getOrderList);
router.get('/orderDetails/:id',userAuth,orderController.getOrderDetails);
router.delete('/deleteOrderListProduct/:orderId/:productId',userAuth, orderController.deleteOrderListProduct);


// cart
router.get('/cart',userAuth,cartController.getCart);
router.post('/cart/:id',userAuth,cartController.postCart);
router.put('/cart',userAuth,cartController.putQuantity);
router.delete('/deleteCartProduct/:id',userAuth,cartController.deleteCartProduct);


// wishlist
router.post('/wishlist/:productId',userAuth,wishlistController.wishlist);
router.get('/wishlist',userAuth,wishlistController.getWishlist);
router.delete('/deleteWishlistProduct/:id',userAuth,wishlistController.deleteWishlistProduct);


// checkOut
router.get('/checkOut',userAuth,cartController.getCheckOut);
router.post('/applyCoupon',userAuth,cartController.applyCoupon);
router.post('/removeCoupon',userAuth,cartController.removeCoupon);



// orderSuccess
router.post('/orderSuccess',userAuth,cartController.postOrderSuccess);
router.get('/orderSuccess',userAuth,cartController.getOrderSuccess)

// return order
router.post('/returnOrderListProduct/:orderId/:productId',userAuth,orderController.returnProduct);
router.post('/invoiceDownload/:orderId/:productId',userAuth,orderController.invoiceDownload);


// passport
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"],  prompt: "select_account"  })
);



// wallet
router.get('/wallet',userAuth,walletController.getWallet);
router.post('/addWalletFund',userAuth,walletController.addWalletFund);


// referal offer
router.post('/applyReferral',userAuth,referalController.referralOffer);

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
 