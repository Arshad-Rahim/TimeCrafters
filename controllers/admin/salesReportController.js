const Order = require("../../models/orderScheama");
const User = require("../../models/userSchema");

const getSalesReport = async (req, res) => {
  try {
    const order = await Order.find({}).populate("userId");

    const result = await Order.aggregate([
        { $match: { "items.orderStatus": { $ne: 'Canceled' } } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalOrderAmount: {
              $sum: {
                $cond: [
                  { $eq: ["$offerApplied", 0] },
                  "$orderTotal",
                  { $subtract: ["$orderTotal", "$offerApplied"] }
                ]
              }
            },
            totalDiscount: {
              $sum: {
                $cond: [
                  { $eq: ["$offerApplied", 0] },
                  {
                    $sum: {
                      $multiply: [
                        { $subtract: ["$regularPrice", "$salePrice"] },
                        "$quantity"
                      ]
                    }
                  },
                  "$offerApplied"
                ]
              }
            }
          }
        }
      ]);
  
      const overallSalesCount = result.length > 0 ? result[0].totalOrders : 0;
      const overallOrderAmount = result.length > 0 ? result[0].totalOrderAmount : 0;
      const overallDiscount = result.length > 0 ? result[0].totalDiscount : 0;



    return res.render("salesReport", { order, overallSalesCount,overallOrderAmount,overallDiscount });
  } catch (error) {
    console.log("Error in getSalesReport", error);
  }
};




const getFilteredReport = async (req, res) => {
    try {
      const { filter } = req.query;
      let startDate, endDate;
  
      switch (filter) {
        case 'daily':
          startDate = new Date();
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date();
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'weekly':
          endDate = new Date();
          startDate = new Date(endDate.getTime() - 6 * 24 * 60 * 60 * 1000); // Last 7 days
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'monthly':
          endDate = new Date();
          startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'custom':
          startDate = new Date(req.query.startDate);
          endDate = new Date(req.query.endDate);
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        default:
          return res.status(400).json({ error: 'Invalid filter option' });
      }
  
      const orders = await Order.find({
        createdAt: { $gte: startDate, $lte: endDate },
      }).populate('userId');
  
      const result = await Order.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        { $match: { "items.orderStatus": { $ne: 'Canceled' } } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalOrderAmount: {
              $sum: {
                $cond: [
                  { $eq: ['$offerApplied', 0] },
                  '$orderTotal',
                  { $subtract: ['$orderTotal', '$offerApplied'] },
                ],
              },
            },
            totalDiscount: {
              $sum: {
                $cond: [
                  { $eq: ['$offerApplied', 0] },
                  {
                    $sum: {
                      $multiply: [{ $subtract: ['$regularPrice', '$salePrice'] }, '$quantity'],
                    },
                  },
                  '$offerApplied',
                ],
              },
            },
          },
        },
      ]);
  
      const overallSalesCount = result.length > 0 ? result[0].totalOrders : 0;
      const overallOrderAmount = result.length > 0 ? result[0].totalOrderAmount : 0;
      const overallDiscount = result.length > 0 ? result[0].totalDiscount : 0;
  
      return res.json({
        orders: orders,
        overallSalesCount,
        overallOrderAmount,
        overallDiscount,
      });
    } catch (error) {
      console.error('Error in getFilteredReport', error);
      return res.status(500).json({ error: 'Error getting sales report' });
    }
  };
module.exports = {
  getSalesReport,
  getFilteredReport,
};
