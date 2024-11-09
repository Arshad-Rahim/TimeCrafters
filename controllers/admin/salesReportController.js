const Order = require("../../models/orderScheama");
const User = require("../../models/userSchema");
const PDFDocument = require('pdfkit');
const Excel = require('exceljs');



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




const downloadSalesReportPdf = async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;
    
    // Fetch orders based on filter
    let query = {};
    
    if (period === 'custom' && startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (period === 'daily') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query.createdAt = { $gte: today };
    } else if (period === 'weekly') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      query.createdAt = { $gte: weekAgo };
    } else if (period === 'monthly') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      query.createdAt = { $gte: monthAgo };
    }

    const allOrders = await Order.find(query)
      .populate('userId', 'name')
      .sort({ createdAt: -1 });

    // Filter out orders with zero total amount
    const orders = allOrders.filter(order => {
      const totalAmount = order.offerApplied > 0 ? order.offerApplied : order.orderTotal;
      return totalAmount > 0;
    });

    const summary = {
      totalOrders: orders.length,
      totalAmount: orders.reduce((sum, order) => 
        sum + (order.offerApplied > 0 ? order.offerApplied : order.orderTotal), 0),
      totalProducts: orders.reduce((sum, order) => sum + order.items.length, 0)
    };

    const pdfDoc = new PDFDocument({ margin: 50, size: 'A4' });
      
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=sales_report_${period}.pdf`);
    
    // Pipe to response
    pdfDoc.pipe(res);

    // Add header
    pdfDoc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('Sales Report', { align: 'center' })
      .moveDown();

    // Add report period
    pdfDoc
      .fontSize(12)
      .font('Helvetica')
      .text(`Report Period: ${period.charAt(0).toUpperCase() + period.slice(1)}`, { align: 'center' })
      .moveDown();

    if (period === 'custom') {
      pdfDoc.text(`Date Range: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`, { align: 'center' })
        .moveDown();
    }

    // Add summary section
    pdfDoc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Summary', { underline: true })
      .moveDown();

    pdfDoc
      .fontSize(10)
      .font('Helvetica')
      .text(`Total Orders: ${summary.totalOrders}`)
      .text(`Total Amount: Rs.${summary.totalAmount.toFixed(2)}`)
      .text(`Total Products Sold: ${summary.totalProducts}`)
      .moveDown(2);

    // Add orders table header
    pdfDoc
      .fontSize(12)
      .font('Helvetica-Bold');

    const tableTop = pdfDoc.y;
    const tableHeaders = ['Date', 'Customer', 'Payment Method', 'Products', 'Amount'];
    const columnWidth = 100;
    
    // Draw headers
    tableHeaders.forEach((header, i) => {
      pdfDoc.text(header, 50 + (i * columnWidth), tableTop, { width: columnWidth, align: 'center' });
    });

    // Draw orders
    let tableY = tableTop + 20;
    pdfDoc.fontSize(10).font('Helvetica');

    for (const order of orders) {
      // Add new page if needed
      if (tableY > 700) {
        pdfDoc.addPage();
        tableY = 50;
      }

      const row = [
        new Date(order.createdAt).toLocaleDateString(),
        order.userId.name,
        order.paymentInfo.method,
        order.items.length.toString(),
        `Rs.${(order.offerApplied > 0 ? order.offerApplied : order.orderTotal).toFixed(2)}`
      ];

      row.forEach((text, i) => {
        pdfDoc.text(text, 50 + (i * columnWidth), tableY, { width: columnWidth, align: 'center' });
      });

      tableY += 20;
    }

    // Add footer
    pdfDoc
      .fontSize(8)
      .text(
        `Generated on ${new Date().toLocaleString()}`,
        50,
        pdfDoc.page.height - 50,
        { align: 'center' }
      );

    // Finalize PDF
    pdfDoc.end();

  } catch(error) {
    console.error('Error generating PDF:', error);
    res.status(500).send('Error generating PDF report');
  }
};


const downloadSalesReportExcel = async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;
    
    // Fetch orders based on filter
    let query = {};
    
    if (period === 'custom' && startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (period === 'daily') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query.createdAt = { $gte: today };
    } else if (period === 'weekly') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      query.createdAt = { $gte: weekAgo };
    } else if (period === 'monthly') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      query.createdAt = { $gte: monthAgo };
    }

    const allOrders = await Order.find(query)
      .populate('userId', 'name')
      .sort({ createdAt: -1 });

    // Filter out orders with zero total amount
    const orders = allOrders.filter(order => {
      const totalAmount = order.offerApplied > 0 ? order.offerApplied : order.orderTotal;
      return totalAmount > 0;
    });

    // Calculate summary
    const summary = {
      totalOrders: orders.length,
      totalAmount: orders.reduce((sum, order) => 
        sum + (order.offerApplied > 0 ? order.offerApplied : order.orderTotal), 0),
      totalProducts: orders.reduce((sum, order) => sum + order.items.length, 0)
    };

    // Create new workbook and worksheet
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    // Add title
    worksheet.mergeCells('A1:E1');
    worksheet.getCell('A1').value = 'Sales Report';
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    // Add period
    worksheet.mergeCells('A2:E2');
    worksheet.getCell('A2').value = `Report Period: ${period.charAt(0).toUpperCase() + period.slice(1)}`;
    worksheet.getCell('A2').alignment = { horizontal: 'center' };

    // Add date range for custom period
    if (period === 'custom') {
      worksheet.mergeCells('A3:E3');
      worksheet.getCell('A3').value = `Date Range: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
      worksheet.getCell('A3').alignment = { horizontal: 'center' };
    }

    // Add summary section
    const summaryStartRow = period === 'custom' ? 5 : 4;
    worksheet.getCell(`A${summaryStartRow}`).value = 'Summary';
    worksheet.getCell(`A${summaryStartRow}`).font = { bold: true };

    worksheet.getCell(`A${summaryStartRow + 1}`).value = `Total Orders: ${summary.totalOrders}`;
    worksheet.getCell(`A${summaryStartRow + 2}`).value = `Total Amount: Rs.${summary.totalAmount.toFixed(2)}`;
    worksheet.getCell(`A${summaryStartRow + 3}`).value = `Total Products Sold: ${summary.totalProducts}`;

    // Add orders table
    const tableStartRow = summaryStartRow + 5;
    
    // Add headers
    const headers = ['Date', 'Customer', 'Payment Method', 'Products', 'Amount','Delivery Status'];
    worksheet.getRow(tableStartRow).values = headers;
    worksheet.getRow(tableStartRow).font = { bold: true };

    // Add order data
    orders.forEach((order, index) => {
      const row = worksheet.getRow(tableStartRow + index + 1);
      row.values = [
        new Date(order.createdAt).toLocaleDateString(),
        order.userId.name,
        order.paymentInfo.method,
        order.items.length,
        `Rs.${(order.offerApplied > 0 ? order.offerApplied : order.orderTotal).toFixed(2)}`,
        order.paymentInfo.status,
      ];
    });

    // Style the table
    const tableRange = `A${tableStartRow}:E${tableStartRow + orders.length}`;
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });
    });

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = 20;
    });

    // Add footer
    const footerRow = worksheet.lastRow.number + 2;
    worksheet.mergeCells(`A${footerRow}:E${footerRow}`);
    worksheet.getCell(`A${footerRow}`).value = `Generated on ${new Date().toLocaleString()}`;
    worksheet.getCell(`A${footerRow}`).alignment = { horizontal: 'center' };

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=sales_report_${period}.xlsx`
    );

    // Write to response
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error generating Excel:', error);
    res.status(500).send('Error generating Excel report');
  }
};

module.exports = {
  getSalesReport,
  downloadSalesReportPdf,
  downloadSalesReportExcel,

};
