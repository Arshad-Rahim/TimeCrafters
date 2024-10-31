const Product = require('../../models/productSchema');
const User = require('../../models/userSchema');
const Category = require('../../models/categorySchema');
const Brand = require('../../models/brandSchema');


const getProductList = async(req,res) =>{
    try {
  
  
      const page = parseInt(req.query.page) || 1;
      const  search = req.query.search||"";
      const filter = req.query.filter || "new";
      
      const limit = 8;
      const skip = (page - 1) * limit;
  
  
      function getSortObject(filter) {
        switch (filter) {
          case 'atoZ':
            return { productName: 1 };
          case 'ztoA':
            return { productName: -1 };
          case 'new':
            return { createdAt: -1 };
          case 'lowToHigh':
            return { salePrice: 1 };
          case 'highToLow':
            return { salePrice: -1 };
          default:
            return { createdAt: -1 };
        }
      }
  
      const totalProducts = await Product.find({
        $or: [
          { productName: { $regex: new RegExp(".*" + search + ".*", "i") } },
          { brand: { $regex: new RegExp(".*" + search + ".*", "i") } },
        ],
      }).countDocuments();
  
  
      const totalPages = Math.ceil(totalProducts/limit);
  
      const user = req.session.user;
      const categories = await Category.find({isListed:true});
  
  
      const productData = await Product.find({
        $or: [
          { productName: { $regex: new RegExp(".*" + search + ".*", "i") } },
          { brand: { $regex: new RegExp(".*" + search + ".*", "i") } },
        ],
        isBlocked:false,
        category:{$in:categories.map(category =>category._id)},
       
      }).populate('category')
      .sort(getSortObject(filter))
      .skip(skip)
      .limit(limit);
      const brand = await Brand.find({isBlocked:false});
      if (categories && brand) {
      if(user){
  
        const userData = await User.findOne({_id:user._id});
        
        return res.render('userProductList',{
          user:userData,
          product:productData,
          cat:categories,
          currentPage:page,
          totalPages:totalPages,
          totalProducts:totalProducts,
          search: search,
          currentFilter: filter,
        
        });
      }else{
  
        return res.render('userProductList',{
          product:productData,
          cat:categories,
          currentPage:page,
          totalPages:totalPages,
          totalProducts:totalProducts,
          search: search,
          currentFilter: filter,
        
        });
      }
  
      }
      
    } catch (error) {
      console.error('Error in getting the Product list',error);
    }
  }






const getSearchProduct = async (req,res) =>{
    const limit = 8;
   
    try {
  
  console.log(req.query)
      const search = req.query.search || "";
      const filter = req.query.filter || "lowToHigh";
      const page = req.query.page || 1;
  
      function getSortObject(filter){
        switch(filter){
          case 'atoZ':{
            return {productName: 1}
          };
          case 'ztoA' :{
            return {productName :-1}
          };
          case 'new' :{
            return {createdAt:-1}
          };
          case 'lowToHigh':{
            return {salePrice:1}
          };
          case  'highToLow':{
            return {salePrice:-1}
          };
          default:{
            return {createdAt : 1}
          }
        }
      }
  
      const productData = await Product.find({
        $or: [
          { productName: { $regex: new RegExp(".*" + search + ".*", "i") } },
          { brand: { $regex: new RegExp(".*" + search + ".*", "i") } },
        ],
      })
      .sort(getSortObject(filter))
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate("category")
        .exec();
        const count = await Product.find({
          $or: [
            { productName: { $regex: new RegExp(".*" + search + ".*", "i") } },
            { brand: { $regex: new RegExp(".*" + search + ".*", "i") } },
          ],
        }).countDocuments();
        const category = await Category.find({ isListed: true });
        const brand = await Brand.find({ isBlocked: false });
  
        if (category && brand) {
  
           
            return res.render('userProductList',{
              product: productData,
              currentPage: page,
              totalPages: Math.ceil(count / limit),
              cat: category,
              brand: brand,
              search:search,
              currentFilter: filter,
            });
          
         
        } else {
          return res
            .status(400)
            .json("Error in category and brand in get all product");
        }
      
    } catch (error) {
      console.error("Error in getSearchProduct", error);
    }
  }
  





const getProductDetails = async(req,res) =>{
    try {
     
  
      const id = req.params.id;
      const productDetails = await Product.findById({_id:id}).populate('category');
  
  
  
      const user = req.session.user;
      const categories = await Category.find({isListed:true});
      
      const productData = await Product.find({
        isBlocked:false,
        category:{$in:categories.map(category =>category._id)},
       
  
      }).populate('category').sort({createdAt:-1})
      
      if(user){
        const userData = await User.findOne({_id:user._id});
        
        return res.render('productDetails',{user:userData,product:productData,cat:categories,id,productDetails});
        
      }else{
  
        return res.render('productDetails',{product:productData,cat:categories,id,productDetails});
      }
      
    } catch (error) {
      console.error('Error in rendering ProductDetails page',error);
    }
  }
  



const getFilteredCategory = async(req,res) =>{
    const categoryId = req.params.id;
    try {
  
      const page = parseInt(req.query.page) || 1;
      const  search = req.query.search||"";
      const filter = req.query.filter || "new";
      const limit = 8;
      const skip = (page - 1) * limit;
      
     
      function getSortObject(filter) {
        switch (filter) {
          case 'atoZ':
            return { productName: 1 };
          case 'ztoA':
            return { productName: -1 };
          case 'new':
            return { createdAt: -1 };
          case 'lowToHigh':
            return { salePrice: 1 };
          case 'highToLow':
            return { salePrice: -1 };
          default:
            return { createdAt: -1 };
        }
      }
  
      let query = {
        isBlocked: false,
        $or: [
          { productName: { $regex: new RegExp(".*" + search + ".*", "i") } },
          { brand: { $regex: new RegExp(".*" + search + ".*", "i") } },
        ]
      };
  
  
      if (categoryId !== "All") {
        query.category = categoryId;
      }
  
      const totalProducts = await Product.countDocuments(query);
      const totalPages = Math.ceil(totalProducts/limit);
  
      const product = await Product.find(query)
      .populate('category')
      .sort(getSortObject(filter))
      .skip(skip)
      .limit(limit);
  
      const categories = await Category.find({ isListed: true });
      const brand = await Brand.find({ isBlocked: false });
  
      return res.render('userProductList', {
        product,
        cat: categories,
        brand,
        categoryId,
        currentPage: page,
        totalPages: totalPages,
        totalProducts: totalProducts,
        search: search,
        currentFilter: filter,
      });
  
      
    } catch (error) {
      console.log('Error in GetFilterCategory',error);
    }
  }
  
  
  
  
  
  


module.exports={

    getProductList,
    getSearchProduct,
    getProductDetails,
    getFilteredCategory,


}