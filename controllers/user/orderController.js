const Order = require("../../models/orderScheama");
const Cart = require("../../models/cartSchema");
const Product = require("../../models/productSchema");
const User = require("../../models/userSchema");

const getOrderList = async (req, res) => {
  try {
    const userId = req.session.user;
    const [cart, orders] = await Promise.all([
      Cart.findOne({ userId }),
      Order.find({ userId })
        .sort({ createdAt: -1 })
        .populate("userId")
        .populate("items.productId"),
    ]);

    return res.render("orderList", { orders: orders, cart });
  } catch (error) {
    console.log("Error in getOrderList", error);
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const userId = req.session.user;
    const { id } = req.params;

    // let promise = Promise.all()
    const [cart, findOrder] = await Promise.all([
      Cart.findOne({ userId }),
      Order.findOne({ _id: id })
        .sort({ createdAt: -1 })
        .populate("items.productId"),
    ]);

    return res.render("orderDetails", { order: findOrder, cart });
  } catch (error) {
    console.log("Error in getOrderDetails", error);
  }
};

const deleteOrderListProduct = async (req, res) => {
  try {
    const { orderId, productId } = req.params;
    const userId = req.session.id;

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

    order.items[itemIndex].orderStatus = "Canceled";

    order.orderTotal = order.items
      .filter((item) => item.orderStatus !== "Canceled")
      .reduce((acc, curr) => acc + curr.ProductTotal, 0);

    await order.save();

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

    return res.status(200).json({
      success: true,
      message: "Order cancelled succesfully",
      redirectURL: "/orderList",
    });
  } catch (error) {
    console.log("Error in deleteOrderListProduct", error);
  }
};

module.exports = {
  getOrderList,
  getOrderDetails,
  deleteOrderListProduct,
};
