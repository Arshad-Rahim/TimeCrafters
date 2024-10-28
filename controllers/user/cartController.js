const mongoose = require("mongoose");
const Product = require("../../models/productSchema");
const Cart = require("../../models/cartSchema");
const Address = require("../../models/addressSchema");
const Order = require("../../models/orderScheama");

const getCart = async (req, res) => {
  try {
    const userId = req.session.user;

    const cart = await Cart.findOne({ userId }).populate("items.productId");

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
    if (req.session.user) {
      return res.render("cart", { cart, cartCalculation });
    } else {
      return res.redirect("/login");
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
    if (req.session.user) {
      const userId = req.session.user;

      const { quantity, productId } = req.body;

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

      const cart = await Cart.findOne({ userId });

      if (!cart) {
        return res.status(404).json({
          success: false,
          message: "Cart not found",
        });
      }

      const product = await Product.findById(productId);

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
    }
  } catch (error) {
    console.log("Error in patchQuantity", error);
  }
};

const getCheckOut = async (req, res) => {
  try {
    const userId = req.session.user;
    const address = await Address.find({ userId });

    const cart = await Cart.findOne({ userId }).populate({
      path: "items.productId",
      select: "productName salePrice productImage",
    });

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
    if (req.session.user) {
      return res.render("checkOut", { cart, cartCalculation, address });
    } else {
      return res.redirect("/login");
    }
  } catch (error) {
    console.log("Error in getCheckOut", error);
  }
};

const deleteCartProduct = async (req, res) => {
  try {
    const userId = req.session.user;
    const productId = req.params.id;
    const cart = await Cart.findOne({ userId });
    const foundIndex = cart.items.findIndex(
      (item) => item.productId.toString() == productId.toString()
    );

    if (foundIndex == -1) {
      return res.status(400).json({
        success: false,
        message: "Item is not found in cart",
      });
    }
    // splice vech delete the product from the array
    cart.items.splice(foundIndex, 1);
    await cart.save();
    return res.status(200).json({
      success: true,
      message: "Product deleted From the cart",
    });
  } catch (error) {
    console.log("Error in deleteAddress", error);
  }
};

const postOrderSuccess = async (req, res) => {
  try {
    const userId = req.session.user;
    const cart = await Cart.findOne({ userId });
    const { selectedAddress, selectedAddressDetails } = req.body;


    const orderItems = cart.items.map((item) => ({
      productId: item.productId,
      ProductName: item.productName,
      quantity: item.quantity,
      salePrice: item.salePrice,
      ProductTotal: item.productAmount,
      color:item.color,
      productImage:item.productImage,
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
        method: "Cash on delivery",
      },
      
    });

    await saveOrderList.save();

    return res.status(200).json({
      success:true,
      message:'Order Succesfully placed',
      redirectURL:'/orderSuccess',
    })
  } catch (error) {
    console.log("Error in saveOrderList", error);
  }
};




const getOrderSuccess = async(req,res) =>{
  try {

    if(req.session.user){
      const userId = req.session.user;
      const cart = await Cart.findOne({userId});
      const findOrder = await Order.findOne({userId}).sort({createdAt:-1}).populate('items.productId');

      return res.render('orderSuccess',{order:findOrder,cart});
    }else{
      return res.redirect('/login');
    }
    
  } catch (error) {
    console.log("Error in getOrderSuccess",error);
  }
}

module.exports = {
  getCart,
  postCart,
  putQuantity,
  getCheckOut,
  deleteCartProduct,
  postOrderSuccess,
  getOrderSuccess,
};
