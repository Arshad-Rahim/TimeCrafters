const Product = require("../../models/productSchema");
const User = require("../../models/userSchema");
const Category = require("../../models/categorySchema");
const Brand = require("../../models/brandSchema");
const mongoose = require('mongoose');
const Cart = require('../../models/cartSchema');

const getProductList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const search = req.query.search || "";
    const filter = req.query.filter || "new";

    const limit = 8;
    const skip = (page - 1) * limit;

    function getSortObject(filter) {
      switch (filter) {
        case "atoZ":
          return { productName: 1 };
        case "ztoA":
          return { productName: -1 };
        case "new":
          return { createdAt: -1 };
        case "lowToHigh":
          return { salePrice: 1 };
        case "highToLow":
          return { salePrice: -1 };
        default:
          return { createdAt: -1 };
      }
    }

    const categories = await Category.find({ isListed: true });

    const [totalProducts, productData, brand] = await Promise.all([
      Product.find({
        $or: [
          { productName: { $regex: new RegExp(".*" + search + ".*", "i") } },
          { brand: { $regex: new RegExp(".*" + search + ".*", "i") } },
        ],
      }).countDocuments(),

      Product.find({
        $or: [
          { productName: { $regex: new RegExp(".*" + search + ".*", "i") } },
          { brand: { $regex: new RegExp(".*" + search + ".*", "i") } },
        ],
        isBlocked: false,
        category: { $in: categories.map((category) => category._id) },
      })
        .populate("category")
        .sort(getSortObject(filter))
        .skip(skip)
        .limit(limit),

      Brand.find({ isBlocked: false }),
    ]);

    const totalPages = Math.ceil(totalProducts / limit);
    const user = req.session.user;
    if (categories && brand) {
      if (user) {
        const userData = await User.findOne({ _id: user._id });
      

        return res.render("userProductList", {
          user: userData,
          product: productData,
          cat: categories,
          currentPage: page,
          totalPages: totalPages,
          totalProducts: totalProducts,
          search: search,
          currentFilter: filter,
        });
      } else {
        return res.render("userProductList", {
          user:true,
          product: productData,
          cat: categories,
          currentPage: page,
          totalPages: totalPages,
          totalProducts: totalProducts,
          search: search,
          currentFilter: filter,
        });
      }
    }
  } catch (error) {
    console.error("Error in getting the Product list", error);
  }
};

const getSearchProduct = async (req, res) => {
  const limit = 8;

  try {
    const search = req.query.search || "";
    const filter = req.query.filter || "lowToHigh";
    const page = req.query.page || 1;

    function getSortObject(filter) {
      switch (filter) {
        case "atoZ": {
          return { productName: 1 };
        }
        case "ztoA": {
          return { productName: -1 };
        }
        case "new": {
          return { createdAt: -1 };
        }
        case "lowToHigh": {
          return { salePrice: 1 };
        }
        case "highToLow": {
          return { salePrice: -1 };
        }
        default: {
          return { createdAt: 1 };
        }
      }
    }

    const category = await Category.find({ isListed: true });

    const [productData, count, brand] = await Promise.all([
      Product.find({
        $or: [
          { productName: { $regex: new RegExp(".*" + search + ".*", "i") } },
          { brand: { $regex: new RegExp(".*" + search + ".*", "i") } },
        ],
      })
        .sort(getSortObject(filter))
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
      return res.render("userProductList", {
        product: productData,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        cat: category,
        brand: brand,
        search: search,
        currentFilter: filter,
        user:true,
      });
    } else {
      return res
        .status(400)
        .json("Error in category and brand in get all product");
    }
  } catch (error) {
    console.error("Error in getSearchProduct", error);
  }
};

const getProductDetails = async (req, res) => {
  try {
    const id = req.params.id;
    const categories = await Category.find({ isListed: true });

    const [productDetails, productData] = await Promise.all([
      Product.findById({ _id: id }).populate("category"),
      Product.find({
        isBlocked: false,
        category: { $in: categories.map((category) => category._id) },
      })
        .populate("category")
        .sort({ createdAt: -1 }),
    ]);

    const userId = req.session.user;
    let cartColorsForProduct = [];

    if (userId) {
      const userData = await User.findOne({ _id: userId });

      const productObjectId = new mongoose.Types.ObjectId(id);

      const cartData = await Cart.findOne({
        userId: userData._id,
        'items.productId': productObjectId
      });

      if (cartData) {
        cartColorsForProduct = cartData.items
          .filter(item => item.productId.toString() === id)
          .map(item => item.color);
      }




      return res.render("productDetails", {
        user: userData,
        product: productData,
        cat: categories,
        id,
        productDetails,
        cartColorsForProduct,
      });
    } else {
      return res.render("productDetails", {
        user:true,
        product: productData,
        cat: categories,
        id,
        productDetails,
        cartColorsForProduct:[]
      });
    }
  } catch (error) {
    console.error("Error in rendering ProductDetails page", error);
  }
};

const getFilteredCategory = async (req, res) => {
  const categoryId = req.params.id;
  try {
    const page = parseInt(req.query.page) || 1;
    const search = req.query.search || "";
    const filter = req.query.filter || "new";
    const limit = 8;
    const skip = (page - 1) * limit;

    function getSortObject(filter) {
      switch (filter) {
        case "atoZ":
          return { productName: 1 };
        case "ztoA":
          return { productName: -1 };
        case "new":
          return { createdAt: -1 };
        case "lowToHigh":
          return { salePrice: 1 };
        case "highToLow":
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
      ],
    };

    if (categoryId !== "All") {
      query.category = categoryId;
    }

    const categories = await Category.find({ isListed: true });

    const [totalProducts, product, brand] = await Promise.all([
      Product.countDocuments(query),
      Product.find(query)
        .populate("category")
        .sort(getSortObject(filter))
        .skip(skip)
        .limit(limit),
      Brand.find({ isBlocked: false }),
    ]);

    const totalPages = Math.ceil(totalProducts / limit);

    return res.render("userProductList", {
      product,
      cat: categories,
      brand,
      categoryId,
      currentPage: page,
      totalPages: totalPages,
      totalProducts: totalProducts,
      search: search,
      currentFilter: filter,
      user:true,
    });
  } catch (error) {
    console.log("Error in GetFilterCategory", error);
  }
};

module.exports = {
  getProductList,
  getSearchProduct,
  getProductDetails,
  getFilteredCategory,
};
