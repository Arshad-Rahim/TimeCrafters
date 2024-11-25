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
    const { orderId, productId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.paymentInfo.status === 'Failed') {
      return res.status(400).json({
        success: false,
        message: "Cannot update status for orders with failed payment",
      });
    }

    const orderItem = order.items.find(
      item => item.productId.toString() === productId
    );

    if (!orderItem) {
      return res.status(404).json({
        success: false,
        message: "Product not found in this order",
      });
    }

    if (orderItem.orderStatus === 'Delivered' && status !== 'Delivered') {
      return res.status(400).json({
        success: false,
        message: "Cannot change status after delivery",
      });
    }

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

    return res.status(200).json({
      success: true,
      message: "Order status changed successfully",
      order: updateOrder,
    });

  } catch (error) {
    console.log("Error in updateStatus", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
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

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const itemIndex = order.items.findIndex(
      (item) => item.productId.toString() == productId
    );

    if (itemIndex == -1) {
      return res.status(400).json({
        success: false,
        message: "item not found in the order",
      });
    }

    const returnedItem = order.items[itemIndex];


    order.items[itemIndex].returnRequest = action;

    if(action == 'Approved'){

      let refundAmount = returnedItem.ProductTotal;

      if (order.couponDiscount > 0) {
        const orderSubtotal = order.items.reduce((sum, item) => sum + item.ProductTotal, 0);
        
        const itemDiscountProportion = returnedItem.ProductTotal / orderSubtotal;
        const itemCouponDiscount = order.couponDiscount * itemDiscountProportion;
        
        refundAmount -= itemCouponDiscount;
      }

      refundAmount = Math.round(refundAmount * 100) / 100;

    const userId = order.userId;
    const wallet = await Wallet.findOne({userId});

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found",
      });
    }

     wallet.balance += refundAmount;
    const transactions ={
      order_id:orderId,
      transaction_date:Date.now(),
      transaction_type:'credit',
      transaction_status:'completed',
      amount:refundAmount,
    }
    wallet.transactions.push(transactions);

    
    await Promise.all([wallet.save(), order.save()]);
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
