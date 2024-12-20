const Product = require("../../models/productSchema");
const User = require("../../models/userSchema");
const Category = require("../../models/categorySchema");
const Brand = require("../../models/brandSchema");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const Cart = require('../../models/cartSchema');
const { image } = require("pdfkit");

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
           

              variants = req.body.variants; 

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

      const processedVariants = [];
      if (req.files) {
        await Promise.all(variants.map(async (variant, variantIndex) => {
            const variantImages = [];

            // Filter images for the current variant
            const variantImageFiles = req.files.filter(file => 
                file.fieldname.startsWith(`variants[${variantIndex}][images]`)
            );

            // Resize and save images for each variant
            await Promise.all(variantImageFiles.map(async (imageFile) => {
                const uploadDir = path.join("public", "uploads", "product-variants");
                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }

                const originalFilename = imageFile.filename;
                const resizedFilename = `resized-${originalFilename}`;
                const resizedImagePath = path.join(uploadDir, resizedFilename);

                // Resize image
                await sharp(imageFile.path)
                    .resize({ width: 440, height: 440 })
                    .toFile(resizedImagePath);

                variantImages.push(resizedFilename);
            }));

            // Create processed variant object
            processedVariants.push({
                color: variant.color,
                quantity: parseInt(variant.quantity),
                productImage: variantImages
            });
        }));
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
          variants:processedVariants,
          
    
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
      variants = req.body.variants; 
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



    const processedVariants = [];
    if (req.files) {
      await Promise.all(variants.map(async (variant, variantIndex) => {
          const variantImages = [];

          // Filter images for the current variant
          if (variant.existingImages) {
            variant.existingImages.forEach(existingImage => {
                variantImages.push(existingImage); // Add existing images to the array
            });
        }
          const variantImageFiles = req.files.filter(file => 
              file.fieldname.startsWith(`variants[${variantIndex}][images]`)
          );

          // Resize and save images for each variant
          await Promise.all(variantImageFiles.map(async (imageFile) => {
              const uploadDir = path.join("public", "uploads", "product-variants");
              if (!fs.existsSync(uploadDir)) {
                  fs.mkdirSync(uploadDir, { recursive: true });
              }

              const originalFilename = imageFile.filename;
              const resizedFilename = `resized-${originalFilename}`;
              const resizedImagePath = path.join(uploadDir, resizedFilename);

              // Resize image
              await sharp(imageFile.path)
                  .resize({ width: 440, height: 440 })
                  .toFile(resizedImagePath);

              variantImages.push(resizedFilename);
          }));

          // Create processed variant object
          processedVariants.push({
            color: Array.isArray(variant.color) ? variant.color[0] : variant.color,
              quantity: parseInt(variant.quantity),
              productImage: variantImages
          });
      }));
  }



    const updateFields = {
      productName: data.productName,
      description: data.description,
      additionalInfo: data.additionalInfo,
      brand: data.brand,
      category: category._id,
      regularPrice: data.regularPrice,
      salePrice: data.salePrice,
      variants:processedVariants,
    };


    await Product.findByIdAndUpdate(id, updateFields, { new: true });


    const cartsToUpdate = await Cart.find({ 'items.productId': id });

    for (const cart of cartsToUpdate) {

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

      cart.totalPrice = cart.items.reduce(
        (total, item) => total + item.salePrice * item.quantity,
        0
      );

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
