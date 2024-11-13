const Order = require("../../models/orderScheama");
const User = require("../../models/userSchema");
const Product = require('../../models/productSchema');
const Wallet = require('../../models/walletShema');

const getOrderManagment = async (req, res) => {
  try {
    const order = await Order.find().populate("userId").sort({ createdAt: -1 });

    return res.render("orderManagment", { order });
  } catch (error) {
    console.log("Error in getOrderManagment", error);
  }
};

const updateStatus = async (req, res) => {
  try {
    let { orderId, productId } = req.params;

    const { status } = req.body;

    const updateOrder = await Order.findOneAndUpdate(
      {
        _id: orderId,
        "items.productId": productId,
      },
      {
        $set: {
          "items.$.orderStatus": status,
        },
      },
      {
        new: true,
      }
    );

    if (!updateOrder) {
      return res.status(400).json({
        success: false,
        message: "Order or Product not found",
      });
    } else {
      return res.status(200).json({
        success: true,
        message: "Order status changed Succesfully",
      });
    }
  } catch (error) {
    console.log("Error in updateStatus", error);
  }
};

const getPopUpOrderDetails = async (req, res) => {
  try {
    return res.render("popUpProductDetails");
  } catch (error) {
    console.log("Error in getPopUpOrderDetails", error);
  }
};



const deleteOrderListProduct = async (req, res) => {
  try {
    const { orderId, productId } = req.params;

    const order = await Order.findOne({ _id: orderId });
      const userId = order.userId;
    const itemIndex = order.items.findIndex(
      (item) => item.productId.toString() == productId
    );

    if (itemIndex == -1) {
      return res.status(400).json({
        success: false,
        message: "item not found in the order",
      });
    }

    order.items[itemIndex].orderStatus = "Canceled";
const initialOrderTotal = order.orderTotal;
    order.orderTotal = order.items
      .filter((item) => item.orderStatus !== "Canceled")
      .reduce((acc, curr) => acc + curr.ProductTotal, 0);
    await order.save();
    const resultOrderTotal = order.orderTotal;
    const differenceAmount = initialOrderTotal - resultOrderTotal;

    const colorQuantityMap = {
      gold: "goldenQuantity",
      black: "blackQuantity",
      silver: "silverQuantity",
    };
    const product = await Product.findOne({ _id: productId });

    const cancelItem = order.items[itemIndex];
    const colorQuantityField = colorQuantityMap[cancelItem.color];

    if (!colorQuantityField) {
      return res.status(400).json({
        success: false,
        message: `Unsupported color in deleteOrderListProduct`,
      });
    }

    product[colorQuantityField] =
      product[colorQuantityField] + cancelItem.quantity;

    await product.save();

    const wallet = await Wallet.findOne({userId});

    console.log(order.paymentInfo.method)
    if(order.paymentInfo.method == 'wallet' || 'paypal' ){
      wallet.userId = userId;
      wallet.balance+= differenceAmount;
      const transactions ={
        order_id:orderId,
        transaction_date:Date.now(),
        transaction_type:'credit',
        transaction_status:'completed',
        amount:differenceAmount,
      }
      wallet.transactions.push(transactions);
      await wallet.save();
    }
   

    return res.status(200).json({
      success: true,
      message: "Order cancelled succesfully",
      redirectURL: "/orderList",
    });
  } catch (error) {
    console.log("Error in deleteOrderListProduct", error);
  }
};



const handleReturn = async(req,res) =>{
  try {
    const { orderId, productId } = req.params;
    const {action} = req.body;

    const order = await Order.findOne({ _id: orderId });

    const itemIndex = order.items.findIndex(
      (item) => item.productId.toString() == productId
    );

    if (itemIndex == -1) {
      return res.status(400).json({
        success: false,
        message: "item not found in the order",
      });
    }

    order.items[itemIndex].returnRequest = action;
    await order.save();

    if(action == 'Approved'){
    const userId = order.userId;
    const wallet = await Wallet.findOne({userId});
    const differenceAmount = order.paymentInfo.paidAmount;

    wallet.balance+= differenceAmount;
    const transactions ={
      order_id:orderId,
      transaction_date:Date.now(),
      transaction_type:'credit',
      transaction_status:'completed',
      amount:differenceAmount,
    }
    wallet.transactions.push(transactions);
    await wallet.save();
    return res.status(200).json({
      success:true,
      message:'Request accepted succesfully',
    })
  }else{
    return res.status(200).json({
      success:true,
      message:'Request Rejected succefully',
    })
  }
  } catch (error) {
    console.log('Error in handleReturn',error);
  }
}

module.exports = {
  getOrderManagment,
  updateStatus,
  getPopUpOrderDetails,
  deleteOrderListProduct,
  handleReturn,
};
