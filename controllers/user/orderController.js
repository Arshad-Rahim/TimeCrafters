const Order = require("../../models/orderScheama");
const Cart = require("../../models/cartSchema");
const Product = require("../../models/productSchema");
const User = require("../../models/userSchema");
const Wallet = require('../../models/walletShema');
const PDFDocument = require("pdfkit");


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

    return res.render("orderList", { orders: orders, cart,user:true });
  } catch (error) {
    console.log("Error in getOrderList", error);
  }
};

// const getOrderDetails = async (req, res) => {
//   try {
//     const userId = req.session.user;
//     const { id } = req.params;

//     const [cart, findOrder] = await Promise.all([
//       Cart.findOne({ userId }),
//       Order.findOne({ _id: id })
//         .sort({ createdAt: -1 })
//         .populate("items.productId"),
//     ]);

//     return res.render("orderDetails", { order: findOrder, cart,user:true });
//   } catch (error) {
//     console.log("Error in getOrderDetails", error);
//   }
// };


const getOrderDetails = async (req, res) => {
  try {
    const userId = req.session.user;
    const { id } = req.params;

    const [cart, findOrder] = await Promise.all([
      Cart.findOne({ userId }).populate({
        // Added category population to match getOrderSuccess
        path: "items.productId",
        populate: {
          path: "category",
        },
      }),
      Order.findOne({ _id: id })
        .sort({ createdAt: -1 })
        .populate("items.productId"),
    ]);

    // Filter cart items to remove blocked products and unlisted categories
    if (cart && cart.items) {
      cart.items = cart.items.filter(item => {
        const product = item.productId;
        return product && !product.isBlocked && product.category.isListed;
      });
    }

    if (findOrder) {
      // Calculate all order totals
      const orderCalculations = {
        // Original total price without any discounts
        baseTotal: findOrder.items.reduce((total, item) => 
          total + (item.regularPrice * item.quantity), 0),
        
        // Total after product discounts but before coupon
        saleTotal: findOrder.items.reduce((total, item) => 
          total + (item.salePrice * item.quantity), 0),
        
        // Only product discount savings (not including coupon)
        productSavings: findOrder.items.reduce((total, item) => 
          total + ((item.regularPrice - item.salePrice) * item.quantity), 0),
      };

      // Update order with calculated values
      findOrder.orderTotal = orderCalculations.baseTotal;
      findOrder.productSavings = orderCalculations.productSavings;
      findOrder.finalTotal = orderCalculations.saleTotal - (findOrder.couponDiscount || 0);
    }

    return res.render("orderDetails", { 
      order: findOrder, 
      cart,
      user: true,
      // Add orderTotals object to match getOrderSuccess
      orderTotals: {
        subTotal: findOrder?.orderTotal || 0,
        productSavings: findOrder?.productSavings || 0,  // Only product discounts
        couponDiscount: findOrder?.couponDiscount || 0,  // Separate coupon discount
        finalAmount: findOrder?.finalTotal || 0
      }
    });
  } catch (error) {
    console.log("Error in getOrderDetails", error);
  }
};

const deleteOrderListProduct = async (req, res) => {
  try {
    const { orderId, productId } = req.params;
    const userId = req.session.user;

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
const initialOrderTotal = order.orderTotal;
    order.orderTotal = order.items
      .filter((item) => item.orderStatus !== "Canceled")
      .reduce((acc, curr) => acc + curr.ProductTotal, 0);
    await order.save();
    // const resultOrderTotal = order.paymentInfo.paidAmount;
    // const differenceAmount = initialOrderTotal - resultOrderTotal;
    const differenceAmount = order.paymentInfo.paidAmount;
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
    if(order.paymentInfo.method == 'wallet' || order.paymentInfo.method == 'paypal' ){
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


const returnProduct = async(req,res) =>{
  try {
    const { orderId, productId } = req.params;
    const userId = req.session.user;
    console.log(req.body);
   const {reason,comments} = req.body;


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
    order.items[itemIndex].returnStatus = true;
    order.items[itemIndex].returnReason = reason;
    order.items[itemIndex].returnComments = comments;

    await order.save();
    console.log(order.items[itemIndex].returnStatus)
    return res.status(200).json({
      success: true,
      message: "product request Sended successfully",
    })
    
  } catch (error) {
    console.log('Error in returnProduct',error);
  }
}

const invoiceDownload = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.session.user;

    // Fetch order with populated data
    const order = await Order.findOne({ _id: orderId })
      .populate('userId', 'name email')
      .populate('items.productId', 'name')
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Create PDF document
    const pdfDoc = new PDFDocument({
      margin: 50,
      size: 'A4'
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition',
      `attachment; filename="${encodeURIComponent(`invoice_${orderId}.pdf`)}"`);
    pdfDoc.pipe(res);

    // Constants for layout
    const PAGE_WIDTH = 595.28;
    const LEFT_MARGIN = 50;
    const RIGHT_MARGIN = PAGE_WIDTH - 50;
    const COL_1 = LEFT_MARGIN;
    const COL_2 = PAGE_WIDTH / 2;

    // Header section
    pdfDoc
      .fontSize(24)
      .font('Helvetica-Bold')
      .text('INVOICE', LEFT_MARGIN, 50, { align: 'left' });

    // Order information (top right)
    pdfDoc
      .fontSize(10)
      .font('Helvetica')
      .text(`Order Date: ${new Date().toLocaleDateString()}`, 400, 50)
      .text(`Delivery By: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}`, 400, 65);

    // Billing and Shipping Information
    pdfDoc
      .moveDown(3)
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Bill To', COL_1, 120)
      .text('Ship To', COL_2, 120);

    // Billing Details
    pdfDoc
      .fontSize(10)
      .font('Helvetica')
      .text(order.userId.name, COL_1, 145)
      .text(order.userId.email, COL_1, 160);

    // Shipping Details
    pdfDoc
      .text(order.shippingAddress.houseName, COL_2, 145)
      .text(order.shippingAddress.street, COL_2, 160)
      .text(`${order.shippingAddress.state} ${order.shippingAddress.zipCode}`, COL_2, 175)
      .text(`Phone: ${order.shippingAddress.mobileNumber}`, COL_2, 190);

    // Order Details Section
    pdfDoc
      .moveDown(4)
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Order Details', LEFT_MARGIN, 220);

    // Table Headers with improved alignment
    const TABLE_START_X = 50;
    const COL_WIDTHS = [150, 80, 50, 100, 70, 80];  // Define widths for each column
    const TABLE_TOP = 250;

    pdfDoc.fontSize(10).font('Helvetica-Bold');

    const tableHeaders = [
      { text: 'Product', width: COL_WIDTHS[0] },
      { text: 'Color', width: COL_WIDTHS[1] },
      { text: 'Qty', width: COL_WIDTHS[2], align: 'right' },
      { text: 'Price', width: COL_WIDTHS[3], align: 'right' },
      { text: 'Discount', width: COL_WIDTHS[4], align: 'right' },
      { text: 'Total', width: COL_WIDTHS[5], align: 'right' }
    ];

    let xPos = TABLE_START_X;
    tableHeaders.forEach(header => {
      pdfDoc.text(header.text, xPos, TABLE_TOP, { width: header.width, align: header.align || 'left' });
      xPos += header.width;
    });

    // Underline the headers for separation
    pdfDoc
      .moveTo(LEFT_MARGIN, TABLE_TOP + 15)
      .lineTo(RIGHT_MARGIN, TABLE_TOP + 15)
      .stroke();

    // Table Content with consistent alignment
    let yPosition = TABLE_TOP + 30;
    order.items.forEach(item => {
      if(item.orderStatus != "Canceled"){
        xPos = TABLE_START_X;

        pdfDoc
          .fontSize(10)
          .font('Helvetica')
          .text(item.ProductName, xPos, yPosition, { width: COL_WIDTHS[0], ellipsis: true });
        xPos += COL_WIDTHS[0];
  
        pdfDoc.text(item.color || '-', xPos, yPosition, { width: COL_WIDTHS[1], align: 'left' });
        xPos += COL_WIDTHS[1];
  
        pdfDoc.text(item.quantity.toString(), xPos, yPosition, { width: COL_WIDTHS[2], align: 'right' });
        xPos += COL_WIDTHS[2];
  
        pdfDoc.text(`RS ${item.regularPrice.toFixed(2)}`, xPos, yPosition, { width: COL_WIDTHS[3], align: 'right' });
        xPos += COL_WIDTHS[3];
  
        pdfDoc.text(`RS ${(item.regularPrice - item.salePrice).toFixed(2)}`, xPos, yPosition, { width: COL_WIDTHS[4], align: 'right' });
        xPos += COL_WIDTHS[4];
  
        pdfDoc.text(`RS ${item.ProductTotal.toFixed(2)}`, xPos, yPosition, { width: COL_WIDTHS[5], align: 'right' });
  
        yPosition += 20; // Move to the next row
      }
     
    });

    // Order Summary
    yPosition += 30;
    pdfDoc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Order Summary', 350, yPosition);

    yPosition += 20;
    const summaryItems = [
      { label: 'Subtotal:', value: `RS ${order.orderTotal.toFixed(2)}` },
      { label: 'Shipping Fee:', value: 'RS 0.00' },
      { label: 'Coupon Discount:', value: `RS ${(order.couponDiscount || 0).toFixed(2)}` },
      { label: 'Total:', value: `RS ${(order.orderTotal - (order.couponDiscount || 0)).toFixed(2)}` }
    ];

    summaryItems.forEach(item => {
      pdfDoc
        .fontSize(10)
        .font('Helvetica')
        .text(item.label, 350, yPosition)
        .text(item.value, 450, yPosition, { align: 'right' });
      yPosition += 20;
    });

    // Payment Information
    yPosition += 20;
    pdfDoc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Payment Information', LEFT_MARGIN, yPosition);

    yPosition += 20;
    pdfDoc
      .fontSize(10)
      .font('Helvetica')
      .text(`Payment Method: ${order.paymentInfo.method}`, LEFT_MARGIN, yPosition)
      .text(`Payment Status: ${order.paymentInfo.status}`, LEFT_MARGIN, yPosition + 15);

    // Footer
    pdfDoc
      .fontSize(8)
      .text(
        `Generated on ${new Date().toLocaleString()}`,
        LEFT_MARGIN,
        pdfDoc.page.height - 50,
        { align: 'center' }
      );

    pdfDoc.end();
  } catch (error) {
    console.error('Error in invoiceDownload:', error);
    res.status(500).json({
      success: false,
      message: "Error generating invoice",
      error: error.message
    });
  }
};


module.exports = {
  getOrderList,
  getOrderDetails,
  deleteOrderListProduct,
  returnProduct,
  invoiceDownload,
};
