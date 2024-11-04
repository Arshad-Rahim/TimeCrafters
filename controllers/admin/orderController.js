const Order = require("../../models/orderScheama");
const User = require("../../models/userSchema");

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

    // const order = await Order.findOne({ _id: orderId });

    // const itemIndex = order.items.findIndex(
    //   (item) => item.productId.toString() == productId
    // );

    // if (itemIndex == -1) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "item not found in the order",
    //   });
    // }

    // order.items[itemIndex].orderStatus = status;

    // await order.save();
    // the above code is time consuming as the reviewer said so we need to do it in aggregation to reduce the time consuption

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

module.exports = {
  getOrderManagment,
  updateStatus,
  getPopUpOrderDetails,
};
