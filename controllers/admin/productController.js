const Product = require("../../models/productSchema");
const User = require("../../models/userSchema");
const Category = require("../../models/categorySchema");
const Brand = require("../../models/brandSchema");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const Cart = require('../../models/cartSchema');

const getAddProduct = async (req, res) => {
  try {
    const [category, brand] = await Promise.all([
      Category.find({ isListed: true }),
      Brand.find({ isBlocked: false }),
    ]);

    res.render("addProduct", {
      cat: category,
      brand: brand,
    });
  } catch (error) {
    console.error("Error in add product", error);
  }
};

const addProduct = async (req, res) => {
  try {
      const product = req.body;
      let variants = [];
      
    
      if (req.body.variants) {
          try {
              const variantsString = req.body.variants.toString().trim();
              
              variants = JSON.parse(variantsString);
          } catch (error) {
              console.error('Error parsing variants:', error);
              console.error('Problematic variants string:', req.body.variants);
              return res.status(400).json({ error: 'Invalid variant data' });
          }
      }

      const productExists = await Product.findOne({
          productName: product.productName,
      });

      if (productExists) {
          return res.status(400).json({ error: "Product name already exists" });
      }

      // Process images
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
          return res.status(400).json({ error: "Invalid category name" });
      }

      const newProduct = await Product.create({
          productName: product.productName,
          description: product.description,
          additionalInfo: product.additionalInfo,
          brand: product.brand,
          category: categoryId._id,
          regularPrice: product.regularPrice,
          salePrice: product.salePrice,
          productImage: images,
          variants: variants.map(variant => ({
            color: variant.color,
            quantity: parseInt(variant.quantity),
        }))
    
      });

    

      return res.status(200).json({ 
        success: true, 
        message: "Product added successfully",
      });
  } catch (error) {
      console.error("Error saving product:", error);
      return res.status(500).json({ 
        success: false, 
        error: "An error occurred while saving the product" 
      });
  }
};

const getAllProducts = async (req, res) => {
  const limit = 0;
  try {
    const search = req.query.search || "";
    const page = req.query.page || 1;

    const category = await Category.find({ isListed: true });

    const [productData, count, brand] = await Promise.all([
      Product.find({
        $or: [
          { productName: { $regex: new RegExp(".*" + search + ".*", "i") } },
          { brand: { $regex: new RegExp(".*" + search + ".*", "i") } },
        ],
      })
        .sort({ _id: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate("category")
        .exec(),
      Product.find({
        $or: [
          { productName: { $regex: new RegExp(".*" + search + ".*", "i") } },
          { brand: { $regex: new RegExp(".*" + search + ".*", "i") } },
        ],
      }).countDocuments(),
      Brand.find({ isBlocked: false }),
    ]);

    if (category && brand) {
      return res.render("product", {
        data: productData,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        cat: category,
        brand: brand,
        search: search,
      });
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

const getEditProduct = async (req, res) => {
  try {
    const id = req.query.id;
    const [brand, category, product] = await Promise.all([
      Brand.find({ isBlocked: false }),
      Category.find({ isListed: true }),
      Product.findOne({ _id: id }).populate('category'),
    ]);

    return res.render("editProduct", {
      product: product,
      brand: brand,
      cat: category,
    });
  } catch (error) {
    console.error("Error in getting edit page", error);
  }
};

const editProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const data = req.body;
    let variants = [];

    if (req.body.variants) {
      try {
          const variantsString = req.body.variants.toString().trim();
          
          variants = JSON.parse(variantsString);
      } catch (error) {
          console.error('Error parsing variants:', error);
          console.error('Problematic variants string:', req.body.variants);
          return res.status(400).json({ error: 'Invalid variant data' });
      }
  }

    const [product, category, existingProduct] = await Promise.all([
      Product.find({ _id: id }),
      Category.findOne({ name: data.category }),
      Product.findOne({
        productName: data.productName,
        _id: { $ne: id },
      }),
    ]);

    if (existingProduct) {
      return res.status(400).json({ error: "Product name already exists" });
    }

    const images = [];

    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        images.push(req.files[i].filename);
      }
    }

    const updateFields = {
      productName: data.productName,
      description: data.description,
      additionalInfo: data.additionalInfo,
      brand: data.brand,
      category: category._id,
      regularPrice: data.regularPrice,
      salePrice: data.salePrice,
      variants: variants.map(variant => ({
        color: variant.color,
        quantity: parseInt(variant.quantity),
    }))
    };

    if (req.files.length > 0) {
      updateFields.$push = { productImage: { $each: images } };
    }

    await Product.findByIdAndUpdate(id, updateFields, { new: true });


    // await Cart.updateMany(
    //   { 'items.productId': id },
    //   {
    //     $set: {
    //       'items.$[elem].regularPrice': data.regularPrice,
    //       'items.$[elem].salePrice': data.salePrice
    //     }
    //   },
    //   {
    //     arrayFilters: [{ 'elem.productId': id }],
    //     multi: true
    //   }
    // );
    const cartsToUpdate = await Cart.find({ 'items.productId': id });

    for (const cart of cartsToUpdate) {
      // Update individual item prices and product amounts
      cart.items = cart.items.map(item => {
        if (item.productId.toString() === id) {
          return {
            ...item,
            regularPrice: data.regularPrice,
            salePrice: data.salePrice,
            productAmount: data.salePrice * item.quantity
          };
        }
        return item;
      });

      // Recalculate total price
      cart.totalPrice = cart.items.reduce(
        (total, item) => total + item.salePrice * item.quantity,
        0
      );

      // Save the updated cart
      await cart.save();
    }


    return res.status(200).json({ 
      success: true, 
      message: "Product Updated successfully",
    });
  } catch (error) {
    console.error("error in Editing the product in product Controller", error);
    return res.status(500).json({ 
      success: false, 
      error: "An error occurred while saving the product" 
    });
  }
};

module.exports = {
  getAddProduct,
  addProduct,
  getAllProducts,
  blockProduct,
  unBlockProduct,
  getEditProduct,
  editProduct,
};
