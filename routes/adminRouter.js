const express = require('express');
const router = express.Router();
const {adminAuth} = require('../middleware/auth');

const adminController = require("../controllers/admin/adminController");
const customerController = require('../controllers/admin/customerController');
const categoryController = require('../controllers/admin/categoryController');
const brandController = require('../controllers/admin/brandController');
const productController = require('../controllers/admin/productController');
const orderController = require('../controllers/admin/orderController');
const offerController = require('../controllers/admin/offerController');    
const couponController = require('../controllers/admin/couponController');
const salesReportController = require('../controllers/admin/salesReportController');

const multer = require('multer');
const storage = require('../helpers/multer');
const uploads = multer({storage:storage});

// admin normal loging routes
router.get('/page-error-404',adminController.pageError);
router.get('/adminLogin',adminController.loadLogin);
router.post('/adminLogin',adminController.login);
router.get('/',adminAuth,adminController.loadDashboard);
router.get('/users',adminAuth,customerController.customerInfo);

router.get('/logout',adminAuth,adminController.logout);

// customer controller routes
router.get('/blockUser',adminAuth,customerController.userBlocked);
router.get('/unblockUser',adminAuth,customerController.userUnBlocked);

// category management routes
router.get('/category',adminAuth,categoryController.categoryInfo);
router.post('/addCategory',adminAuth,categoryController.addCategory);
router.get('/listCategory',adminAuth,categoryController.getListCategory);
router.get('/unListCategory',adminAuth,categoryController.getUnListedCategory);
router.get('/editCategory',adminAuth,categoryController.getEditCategory);
router.post('/editCategory/:id',adminAuth,categoryController.editCategory);


// Brand Management routes
router.get('/brands',adminAuth,brandController.getBrandPage);
router.post('/addBrands',adminAuth,uploads.single('image'),brandController.addBrands);

router.get('/blockBrand',adminAuth,brandController.blockBrand);
router.get('/unBlockBrand',adminAuth,brandController.unBlockBrand);
router.get('/deleteBrand',adminAuth,brandController.deleteBrand);
router.get('/editBrand',adminAuth,brandController.getEditBrand);    
router.post('/editBrand/:id',adminAuth,uploads.single('brandImage'),brandController.editBrand);


// product Managemetn
router.get('/addProduct',adminAuth,productController.getAddProduct);
router.post('/addProduct',adminAuth,uploads.array('images',4),productController.addProduct)
router.get('/product',adminAuth,productController.getAllProducts);

router.get('/blockProduct',adminAuth,productController.blockProduct);
router.get('/unBlockProduct',adminAuth,productController.unBlockProduct);
router.get('/editProduct',adminAuth,productController.getEditProduct);
router.post('/editProduct/:id',adminAuth,uploads.array('images',4),productController.editProduct);


// order Management
router.get('/orderManagment',adminAuth,orderController.getOrderManagment);
router.put('/updateStatus/:orderId/:productId',adminAuth,orderController.updateStatus);
router.delete('/deleteOrderListProduct/:orderId/:productId', orderController.deleteOrderListProduct);


// offer managment
router.get('/productOffers',adminAuth,offerController.productOffers);
router.get('/categoryOffers',adminAuth,offerController.categoryOffers);
router.post('/addProductOffer',adminAuth,offerController.addProductOffer);
router.post('/addCategoryOffer',adminAuth,offerController.addCategoryOffer);
router.delete('/deleteProductOffer',adminAuth,offerController.deleteProductOffer);
router.delete('/deleteCategoryOffer',adminAuth,offerController.deleteCategoryOffer);


// couponManagment

router.get('/couponManagment',adminAuth,couponController.couponManagment);
router.post('/addCoupon',adminAuth,couponController.addCoupon);
router.delete('/deleteCoupon',adminAuth,couponController.deleteCoupon);


// salesReport

router.get('/salesReport',adminAuth,salesReportController.getSalesReport);
router.get('/sales-report',adminAuth,salesReportController.getFilteredReport);

module.exports=router;