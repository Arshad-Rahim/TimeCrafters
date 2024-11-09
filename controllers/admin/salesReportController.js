const Order = require("../../models/orderScheama");
const User = require("../../models/userSchema");



const getSalesReport = async (req, res) => {
  try {
    // Get filter type and dates from query parameters
    const { filter, startDate, endDate } = req.query;
    let queryStartDate, queryEndDate;

    // Calculate date range based on filter
    if (filter) {
      switch (filter) {
        case 'daily':
          queryStartDate = new Date();
          queryStartDate.setHours(0, 0, 0, 0);
          queryEndDate = new Date();
          queryEndDate.setHours(23, 59, 59, 999);
          break;
        case 'weekly':
          queryEndDate = new Date();
          queryStartDate = new Date(queryEndDate.getTime() - 6 * 24 * 60 * 60 * 1000);
          queryStartDate.setHours(0, 0, 0, 0);
          break;
        case 'monthly':
          queryEndDate = new Date();
          queryStartDate = new Date(queryEndDate.getFullYear(), queryEndDate.getMonth(), 1);
          queryStartDate.setHours(0, 0, 0, 0);
          break;
        case 'custom':
          queryStartDate = new Date(startDate);
          queryEndDate = new Date(endDate);
          queryStartDate.setHours(0, 0, 0, 0);
          queryEndDate.setHours(23, 59, 59, 999);
          break;
      }
    }

    // Build query object
    const query = queryStartDate && queryEndDate 
      ? { 
          createdAt: { 
            $gte: queryStartDate, 
            $lte: queryEndDate 
          }
        } 
      : {};

    // Fetch orders with date filter if present
    const order = await Order.find(query).populate("userId");

    // Aggregate pipeline for statistics
    const aggregatePipeline = [
      ...(queryStartDate && queryEndDate ? [{
        $match: {
          createdAt: { $gte: queryStartDate, $lte: queryEndDate }
        }
      }] : []),
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
                "$offerApplied"  
              ]
            }
          },
          totalDiscount: {
            $sum: {
              $cond: [
                { $eq: ["$offerApplied", 0] },
                0,  
                { $subtract: ["$orderTotal", "$offerApplied"] }  
              ]
            }
          }
        }
      }
    ];

    const result = await Order.aggregate(aggregatePipeline);

    const overallSalesCount = result.length > 0 ? result[0].totalOrders : 0;
    const overallOrderAmount = result.length > 0 ? result[0].totalOrderAmount : 0;
    const overallDiscount = result.length > 0 ? result[0].totalDiscount : 0;

    // Render the page with all necessary data
    return res.render("salesReport", { 
      order, 
      overallSalesCount,
      overallOrderAmount,
      overallDiscount,
      activeFilter: filter || 'daily',
      startDate: startDate || '',
      endDate: endDate || ''
    });
  } catch (error) {
    console.log("Error in getSalesReport", error);
    res.status(500).render('error', { message: 'Error generating sales report' });
  }
};





module.exports = {
  getSalesReport,
};
