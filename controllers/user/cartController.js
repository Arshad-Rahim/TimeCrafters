const mongoose = require("mongoose");
const Product = require("../../models/productSchema");
const Cart = require("../../models/cartSchema");
const Address = require("../../models/addressSchema");
const Order = require("../../models/orderScheama");
const Coupon = require("../../models/couponSchema");
const User = require("../../models/userSchema");
const convertCurrency = require("../../service/currencyConversion");

const getCart = async (req, res) => {
  try {
    const userId = req.session.user;

    const cart = await Cart.findOne({ userId }).populate("items.productId");
    if (cart) {
      // const cartCalculation = {
      //   basePrice: cart.items.reduce(
      //     (total, item) => total + item.regularPrice * item.quantity,
      //     0
      //   ),
      //   totalPrice: cart.items.reduce(
      //     (total, item) => total + item.salePrice * item.quantity,
      //     0
      //   ),
      // };

      const cartCalculation = cart.items.reduce(
        (acc, item) => ({
          basePrice: acc.basePrice + item.regularPrice * item.quantity,
          totalPrice: acc.totalPrice + item.salePrice * item.quantity,
        }),
        { basePrice: 0, totalPrice: 0 }
      );

      cartCalculation.savings =
        cartCalculation.basePrice - cartCalculation.totalPrice;
      return res.render("cart", { cart, cartCalculation });
    } else {
      const cartCalculation = 0;
      return res.render("cart", { cart, cartCalculation });
    }
  } catch (error) {
    console.log("Error in get cart", error);
  }
};

const postCart = async (req, res) => {
  try {
    const userId = req.session.user;

    const { id } = req.params;
    const { color, colorStock } = req.body;

    const product = await Product.findOne({ _id: id });

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User is not LogedIn",
        redirectURL: "/login",
      });
    }
    if (colorStock < 1) {
      return res.status(400).json({
        success: false,
        message: "Selected Color is out of stock",
      });
    }

    let userCartExisting = await Cart.findOne({ userId });

    if (userCartExisting) {
      const productExisting = await Cart.findOne({
        userId,
        "items.productId": product._id,
      });
      if (productExisting) {
        return res.status(400).json({
          success: false,
          message: "Product is alredy in the cart",
        });
      } else {
      }

      userCartExisting.items.push({
        productId: product._id,
        productName: product.productName,
        salePrice: product.salePrice,
        regularPrice: product.regularPrice,
        productImage: product.productImage[0],
        quantity: 1,
        productAmount: product.salePrice * 1,
        color: color,
        colorStock: colorStock,
      });

      userCartExisting.totalPrice = userCartExisting.items.reduce(
        (total, item) => total + item.salePrice * item.quantity,
        0
      );

      await userCartExisting.save();

      if (userCartExisting) {
        return res.status(200).json({
          success: true,
          message: "Added to Cart",
          redirectURL: "/cart",
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "Failed to Add to Cart",
        });
      }
    } else {
      const saveCart = new Cart({
        userId,
        items: [
          {
            productId: product._id,
            productName: product.productName,
            regularPrice: product.regularPrice,
            salePrice: product.salePrice,
            productImage: product.productImage[0],
            quantity: 1,
            productAmount: product.salePrice * 1,
            color: color,
            colorStock: colorStock,
          },
        ],
      });

      saveCart.totalPrice = saveCart.items.reduce(
        (total, item) => total + item.salePrice * item.quantity,
        0
      );

      await saveCart.save();
      if (saveCart) {
        return res.status(200).json({
          success: true,
          message: "Added to Cart",
          redirectURL: "/cart",
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "Failed to Add to Cart",
        });
      }
    }
  } catch (error) {
    console.log("Error in postCart", error);
  }
};

const putQuantity = async (req, res) => {
  try {
    const userId = req.session.user;

    const { quantity, productId } = req.body;

    const [cart, product] = await Promise.all([
      Cart.findOne({ userId }),
      Product.findById(productId),
    ]);

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Atleast One product Must be in cart",
      });
    }

    if (quantity > 5) {
      return res.status(400).json({
        success: false,
        message: "Maximum quantity is 5",
      });
    }

    const foundItem = cart.items.find(
      (item) => item.productId.toString() == productId.toString()
    );

    if (!foundItem) {
      return res.status(400).json({
        success: false,
        message: "Product is not Found in the cart",
      });
    }

    if (quantity > foundItem.colorStock) {
      return res.status(400).json({
        success: false,
        message: `Only ${foundItem.colorStock} items available in this color`,
      });
    }

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const foundIndex = cart.items.findIndex(
      (item) => item.productId.toString() == productId.toString()
    );

    if (foundIndex == -1) {
      return res.status(400).json({
        success: false,
        message: "Item is not found in cart",
      });
    }

    cart.items[foundIndex].quantity = quantity;

    cart.items[foundIndex].productAmount =
      cart.items[foundIndex].salePrice * quantity;
    cart.totalPrice = cart.items.reduce(
      (total, item) => total + item.salePrice * item.quantity,
      0
    );

    await cart.save();
    return res.status(200).json({
      success: true,
      message: "Cart updated succesfully",
    });
  } catch (error) {
    console.log("Error in patchQuantity", error);
  }
};

const getCheckOut = async (req, res) => {
  try {
    const userId = req.session.user;

    // instead of multople await using promise to solve with single await
    const [address, cart] = await Promise.all([
      Address.find({ userId }),
      Cart.findOne({ userId }).populate({
        path: "items.productId",
        select: "productName salePrice productImage",
      }),
    ]);

    const cartCalculation = {
      basePrice: cart.items.reduce(
        (total, item) => total + item.regularPrice * item.quantity,
        0
      ),
      totalPrice: cart.items.reduce(
        (total, item) => total + item.salePrice * item.quantity,
        0
      ),
    };

    cartCalculation.savings =
      cartCalculation.basePrice - cartCalculation.totalPrice;
    return res.render("checkOut", { cart, cartCalculation, address });
  } catch (error) {
    console.log("Error in getCheckOut", error);
  }
};

const deleteCartProduct = async (req, res) => {
  try {
    const userId = req.session.user;
    const productId = req.params.id;
    // const cart = await Cart.findOne({ userId });
    // const foundIndex = cart.items.findIndex(
    //   (item) => item.productId.toString() == productId.toString()
    // );

    // if (foundIndex == -1) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Item is not found in cart",
    //   });
    // }
    // // splice vech delete the product from the array
    // cart.items.splice(foundIndex, 1);
    // await cart.save();
    // return res.status(200).json({
    //   success: true,
    //   message: "Product deleted From the cart",
    // });

    const result = await Cart.updateOne(
      { userId: userId },
      {
        $pull: {
          items: { productId: new mongoose.Types.ObjectId(productId) },
        },
      }
    );

    if (result.modifiedCount == 0) {
      return res.status(400).json({
        success: false,
        message: "Item not found in the cart",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product deleted from the cart",
    });
  } catch (error) {
    console.log("Error in deleteAddress", error);
  }
};

const postOrderSuccess = async (req, res) => {
  try {
    const userId = req.session.user;
    const cart = await Cart.findOne({ userId });
    const { selectedAddress, selectedAddressDetails, paymentMethod,totalPrice } = req.body;

    if(!req.session.newTotal){
       req.session.newTotal = totalPrice;
    }
    const orderItems = cart.items.map((item) => ({
      productId: item.productId,
      ProductName: item.productName,
      quantity: item.quantity,
      salePrice: item.salePrice,
      regularPrice: item.regularPrice,
      ProductTotal: item.productAmount,
      color: item.color,
      productImage: item.productImage,
    }));

    const saveOrderList = new Order({
      userId,
      items: orderItems,
      shippingAddress: {
        houseName: selectedAddressDetails.houseName,
        street: selectedAddressDetails.street,
        landmark: selectedAddressDetails.landmark,
        city: selectedAddressDetails.city,
        district: selectedAddressDetails.district,
        state: selectedAddressDetails.state,
        zipCode: selectedAddressDetails.zipCode,
        addressType: selectedAddressDetails.addressType,
        mobileNumber: selectedAddressDetails.mobileNumber,
        altMobileNumber: selectedAddressDetails.altMobileNumber,
      },
      paymentInfo: {
        method: paymentMethod,
      },
    });

    await saveOrderList.save();

    for (const cartItem of cart.items) {
      const product = await Product.findOne({ _id: cartItem.productId });
      if (!product) {
        console.log("Product not found in PostOrderSuccess");
      }

      let colorQuantityField;

      switch (cartItem.color) {
        case "gold":
          colorQuantityField = "goldenQuantity";
          break;
        case "black":
          colorQuantityField = "blackQuantity";
          break;
        case "silver":
          colorQuantityField = "silverQuantity";
          break;
        default:
          console.log("unsupported color");
      }

      product[colorQuantityField] =
        product[colorQuantityField] - cartItem.quantity;
      await product.save();
    }
    if (paymentMethod == "paypal") {
      console.log("paypal athi");
      const newTotal = req.session.newTotal;
      console.log(newTotal)

      const convertAmount = await convertCurrency(newTotal);
      req.session.convertAmount = convertAmount;
      return res.json({
        success: true,
        redirectURL: "/pay",
        convertAmount: convertAmount,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order Succesfully placed",
      redirectURL: "/orderSuccess",
    });
  } catch (error) {
    console.log("Error in saveOrderList", error);
  }
};

const getOrderSuccess = async (req, res) => {
  try {
    const userId = req.session.user;

    const [cart, findOrder] = await Promise.all([
      Cart.findOne({ userId }),
      Order.findOne({ userId })
        .sort({ createdAt: -1 })
        .populate("items.productId"),
    ]);

    return res.render("orderSuccess", { order: findOrder, cart });
  } catch (error) {
    console.log("Error in getOrderSuccess", error);
  }
};

const applyCoupon = async (req, res) => {
  try {
    const { couponCode, totalPrice } = req.body;
    const userId = req.session.user;

    // Find the coupon
    const coupon = await Coupon.findOne({ code: couponCode });
    if (!coupon) {
      return res.status(400).json({
        success: false,
        message: "Invalid Coupon Code",
      });
    }

    // Check if minimum purchase requirement is met
    if (totalPrice < coupon.minimumPurchased) {
      return res.status(400).json({
        success: false,
        message: `Coupon minimum purchase amount not met. Minimum required: ${coupon.minimumPurchased}`,
      });
    }

    // Check user's coupon usage
    const userCouponUsage = await Coupon.aggregate([
      {
        $match: { code: couponCode },
      },
      {
        $unwind: "$users_applied",
      },
      {
        $match: {
          "users_applied.user": new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $group: {
          _id: "$users_applied.user",
          used_count: { $sum: "$users_applied.used_count" },
          limit: { $first: "$usageLimit" }, // Changed from limit to usageLimit to match schema
        },
      },
    ]);

    // Check if user has reached usage limit
    if (
      userCouponUsage.length > 0 &&
      userCouponUsage[0].used_count >= userCouponUsage[0].limit
    ) {
      return res.status(400).json({
        success: false,
        message: `You have reached the usage limit for this coupon.`,
      });
    }

    // Update coupon usage
    if (userCouponUsage.length > 0) {
      // User has used this coupon before - increment count
      await Coupon.updateOne(
        {
          code: couponCode,
          "users_applied.user": new mongoose.Types.ObjectId(userId),
        },
        { $inc: { "users_applied.$.used_count": 1 } }
      );
    } else {
      // First time user is using this coupon
      await Coupon.updateOne(
        { code: couponCode },
        {
          $push: {
            users_applied: {
              user: new mongoose.Types.ObjectId(userId),
              used_count: 1,
            },
          },
        }
      );
    }

    // Calculate discount
    const discountPercentage = coupon.discountPercentage;
    const maximumDiscount = coupon.maximumDiscount;
    let discountAmount = Math.round((totalPrice * discountPercentage) / 100);
    
    if (discountAmount > maximumDiscount) {
      discountAmount = maximumDiscount;
    }
    
    const newTotal = totalPrice - discountAmount;
    
    req.session.newTotal = newTotal;

    return res.status(200).json({
      success: true,
      message: "Coupon applied successfully",
      discountPercentage,
      maximumDiscount,
      newTotal,
      discountAmount,
    });

  } catch (error) {
    console.error("Error in applyCoupon:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while applying the coupon",
    });
  }
};

module.exports = {
  getCart,
  postCart,
  putQuantity,
  getCheckOut,
  deleteCartProduct,
  postOrderSuccess,
  getOrderSuccess,
  applyCoupon,
};
