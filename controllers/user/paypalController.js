const Order = require("../../models/orderScheama");
const convertCurrency = require("../../service/currencyConversion");

const cancelPaypal = async (req, res) => {
  try {
    const order = await Order.findOne({ userId: req.session.user }).sort({
      createdAt: -1,
    });

    order.paymentInfo.status = "Failed";
    await order.save();
    res.redirect("/orderSuccess");
  } catch (error) {
    console.log("Error in pay", error);
  }
};

const retryPayment = async (req, res) => {
  try {
    const { totalPrice } = req.body;

    const currentTotal = totalPrice;

    const convertAmount = await convertCurrency(currentTotal);
    req.session.convertAmount = convertAmount;
    return res.json({
      success: true,
      redirectURL: "/pay",
      convertAmount: convertAmount,
    });
  } catch (error) {
    console.log("Error in retryPayment", error);
  }
};

module.exports = {
  cancelPaypal,
  retryPayment,
};
