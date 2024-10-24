const Product = require("../../models/productSchema");
const User = require("../../models/userSchema");
const Category = require("../../models/categorySchema");
const Brand = require("../../models/brandSchema");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const getAddProduct = async (req, res) => {
  try {
    const category = await Category.find({ isListed: true });
    const brand = await Brand.find({ isBlocked: false });


    if(req.session.admin){
      res.render("addProduct", {
        cat: category,
        brand: brand,
      });
    }else{
       return res.redirect('/admin/adminLogin');
    }
   
  } catch (error) {
    console.error("Error in add product", error);
  }
};

const addProduct = async (req, res) => {
  try {
    const product = req.body;
   
    const productExists = await Product.findOne({
      productName: product.productName,
    });

    if (!productExists) {
      const images = [];

    
      if (req.files && req.files.length > 0) {
        const uploadDir = path.join("public", "uploads", "re-image");
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        for (let i = 0; i < req.files.length; i++) {
          const originalImagePath = req.files[i].path;
          const originalFilename = req.files[i].filename;
          const resizedFilename = `resized-${originalFilename}`;
          const resizedImagePath = path.join(uploadDir, resizedFilename);
          await sharp(originalImagePath)
            .resize({ width: 440, height: 440 })
            .toFile(resizedImagePath);
          images.push(resizedFilename);
        }
      }

      const categoryId = await Category.findOne({ name: product.category });

      if (!categoryId) {
        return res.status(400).json("invalid category name");
      }

      const newProduct = new Product({
        productName: product.productName,
        description: product.description,
        additionalInfo:product.additionalInfo,
        brand: product.brand,
        category: categoryId._id,
        regularPrice: product.regularPrice,
        salePrice: product.salePrice,
        createdOn: new Date(),
        blackQuantity: product.blackQuantity,
        silverQuantity: product.silverQuantity,
        goldenQuantity: product.goldenQuantity,
        productImage: images,
        status: "Available",
      });
      await newProduct.save();
      return res.redirect("/admin/addProduct");
    } else {
      return res
        .status(400)
        .json("product already exist,please try with another name");
    }
  } catch (error) {
    console.error("error to saving product", error);
    return res
      .status(500)
      .json({ error: "An error occurred while saving the product" });
  }
};

const getAllProducts = async (req, res) => {
 const limit = 0;
  try {
    const search = req.query.search || "";
    const page = req.query.page || 1;
   

    const productData = await Product.find({
      $or: [
        { productName: { $regex: new RegExp(".*" + search + ".*", "i") } },
        { brand: { $regex: new RegExp(".*" + search + ".*", "i") } },
      ],
    }).sort({_id: -1})
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
      if(req.session.admin){
        return res.render("product", {
          data: productData,
          currentPage: page,
          totalPages: Math.ceil(count / limit),
          cat: category,
          brand: brand,
          search:search,
        });
      }else{
         return res.redirect('/admin/adminLogin');
      }
     
    } else {
      return res
        .status(400)
        .json("Error in category and brand in get all product");
    }
  } catch (error) {
    console.error("error in getting the ProductPage", error);
  }
};

const blockProduct = async (req, res) => {
  try {
    const { id } = req.query;
    console.log(id);

    await Product.updateOne({ _id: id }, { $set: { isBlocked: true } });
    return res.redirect("/admin/product");
  } catch (error) {
    console.error("Error in blocking the product", error);
  }
};

const unBlockProduct = async (req, res) => {
  try {
    const { id } = req.query;
    await Product.updateOne({ _id: id }, { $set: { isBlocked: false } });
    return res.redirect("/admin/product");
  } catch (error) {
    console.error("Error in unblocking the product", error);
  }
};


const getEditProduct = async(req,res) =>{
  try {

    const id = req.query.id;
    const brand = await Brand.find({isBlocked:false});
    const category = await Category.find({isListed:true})

    const product = await Product.findOne({_id:id});
    if(req.session.admin){
      return res.render('editProduct',{product:product,brand:brand,cat:category});
    }else{
       return res.redirect('/admin/adminLogin');
    }
   
   
    
  } catch (error) {
    console.error("Error in getting edit page",error);
  }
}


const editProduct = async(req,res) =>{
  try {
    
    const id = req.params.id;
    const product = await Product.find({_id:id});
    const data = req.body;
// ith vechan update category id kittunne
    const category = await Category.findOne({name:data.category});

    const existingProduct =await Product.findOne({
      productName:data.productName,
      _id:{$ne:id}
    })

    if(existingProduct){
      return res.status(400).json('The product name is alredy existing so you can try with another name');
    }

    const images =[];

    if(req.files && req.files.length>0){
      for(let i=0;i<req.files.length;i++){
        images.push(req.files[i].filename);
      }
    }


    const updateFields = {
      productName:data.productName,
      description:data.description,
      additionalInfo:data.additionalInfo,
      brand:data.brand,
      category:category._id,
      regularPrice:data.regularPrice,
      salePrice:data.salePrice,
      blackQuantity:data.blackQuantity,
      silverQuantity:data.silverQuantity,
      goldenQuantity:data.goldenQuantity,

    }

    if(req.files.length>0){
      updateFields.$push = {productImage:{$each:images}};
    }

    await Product.findByIdAndUpdate(id,updateFields,{new:true});
    return res.redirect('/admin/product');

  } catch (error) {
    console.error("error in Editing the product in product Controller",error);
  }
}

module.exports = {
  getAddProduct,
  addProduct,
  getAllProducts,
  blockProduct,
  unBlockProduct,
  getEditProduct,
  editProduct,
};
