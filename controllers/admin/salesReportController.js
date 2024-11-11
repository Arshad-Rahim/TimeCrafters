const Order = require("../../models/orderScheama");
const User = require("../../models/userSchema");
const PDFDocument = require("pdfkit");
const Excel = require("exceljs");

const getSalesReport = async (req, res) => {
  try {
    // Get filter type and dates from query parameters
    const { filter, startDate, endDate } = req.query;
    let queryStartDate, queryEndDate;

    // Calculate date range based on filter
    if (filter) {
      switch (filter) {
        case "daily":
          queryStartDate = new Date();
          queryStartDate.setHours(0, 0, 0, 0);
          queryEndDate = new Date();
          queryEndDate.setHours(23, 59, 59, 999);
          break;
        case "weekly":
          queryEndDate = new Date();
          queryStartDate = new Date(
            queryEndDate.getTime() - 6 * 24 * 60 * 60 * 1000
          );
          queryStartDate.setHours(0, 0, 0, 0);
          break;
        case "monthly":
          queryEndDate = new Date();
          queryStartDate = new Date(
            queryEndDate.getFullYear(),
            queryEndDate.getMonth(),
            1
          );
          queryStartDate.setHours(0, 0, 0, 0);
          break;
        case "custom":
          queryStartDate = new Date(startDate);
          queryEndDate = new Date(endDate);
          queryStartDate.setHours(0, 0, 0, 0);
          queryEndDate.setHours(23, 59, 59, 999);
          break;
      }
    }

    // Build query object
    const query =
      queryStartDate && queryEndDate
        ? {
            createdAt: {
              $gte: queryStartDate,
              $lte: queryEndDate,
            },
          }
        : {};

    // Fetch orders with date filter if present
    const order = await Order.find(query).populate("userId");

    // Aggregate pipeline for statistics
    const aggregatePipeline = [
      // Date filter if provided
      ...(queryStartDate && queryEndDate
        ? [
            {
              $match: {
                createdAt: { $gte: queryStartDate, $lte: queryEndDate },
              },
            },
          ]
        : []),
        
      // Filter out items with Canceled status
      {
        $match: {
          "items.orderStatus": { $ne: "Canceled" }
        }
      },
      
      // Group and calculate totals
      {
        $group: {
          _id: null,
          // Count total number of orders
          totalOrders: { $sum: 1 },
          
          // Sum of all order totals
          totalOrderAmount: { $sum: "$orderTotal" },
          
          // Sum of all offers (includes coupon discounts)
          totalDiscount: { $sum: "$offerApplied" },
          
          // Sum of coupon discounts separately
          totalCouponDiscount: { $sum: "$couponDiscount" }
        }
      }
    ];

    const result = await Order.aggregate(aggregatePipeline);

    const overallSalesCount = result.length > 0 ? result[0].totalOrders : 0;
    const overallOrderAmount =
      result.length > 0 ? result[0].totalOrderAmount : 0;
    const overallDiscount = result.length > 0 ? result[0].totalDiscount : 0;
    const totalCouponDiscount = result.length > 0 ? result[0].totalCouponDiscount : 0;

    // Render the page with all necessary data
    return res.render("salesReport", {
      order,
      overallSalesCount,
      overallOrderAmount,
      overallDiscount,
      totalCouponDiscount,
      activeFilter: filter || "daily",
      startDate: startDate || "",
      endDate: endDate || "",
    });
  } catch (error) {
    console.log("Error in getSalesReport", error);
    res
      .status(500)
      .render("error", { message: "Error generating sales report" });
  }
};

const downloadSalesReportPdf = async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;

    // Fetch orders based on filter
    let query = {};

    if (period === "custom" && startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (period === "daily") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query.createdAt = { $gte: today };
    } else if (period === "weekly") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      query.createdAt = { $gte: weekAgo };
    } else if (period === "monthly") {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      query.createdAt = { $gte: monthAgo };
    }

    const allOrders = await Order.find(query)
      .populate("userId", "name")
      .sort({ createdAt: -1 });

    // Filter out orders with zero total amount
    const orders = allOrders.filter((order) => {
      const totalAmount =
        order.offerApplied > 0 ? order.offerApplied : order.orderTotal;
      return totalAmount > 0;
    });

    const summary = {
      totalOrders: orders.length,
      totalAmount: orders.reduce(
        (sum, order) =>
          sum +
          (order.offerApplied > 0 ? order.offerApplied : order.orderTotal),
        0
      ),
      totalProducts: orders.reduce((sum, order) => sum + order.items.length, 0),
      // Add these new fields:
      totalDiscounts: orders.reduce((sum, order) => {
        const discountAmount =
          order.offerApplied === 0
            ? order.orderTotal
            : order.offerApplied - order.couponDiscount;
        return sum + discountAmount;
      }, 0),
      totalCouponOffers: orders.reduce(
        (sum, order) => sum + order.couponDiscount,
        0
      ),
    };

    const pdfDoc = new PDFDocument({ margin: 50, size: "A4" });

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=sales_report_${period}.pdf`
    );

    // Pipe to response
    pdfDoc.pipe(res);

    // Add header
    pdfDoc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("Sales Report", { align: "center" })
      .moveDown();

    // Add report period
    pdfDoc
      .fontSize(10)
      .font("Helvetica")
      .text(
        `Report Period: ${period.charAt(0).toUpperCase() + period.slice(1)}`,
        { align: "center" }
      )
      .moveDown();

    if (period === "custom") {
      pdfDoc
        .text(
          `Date Range: ${new Date(startDate).toLocaleDateString()} - ${new Date(
            endDate
          ).toLocaleDateString()}`,
          { align: "center" }
        )
        .moveDown();
    }

    // Add summary section
    pdfDoc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("Summary", { underline: true })
      .moveDown();

    pdfDoc
      .fontSize(10)
      .font("Helvetica")
      .text(`Total Orders: ${summary.totalOrders}`)
      .text(`Total Amount: Rs.${summary.totalAmount.toFixed(2)}`)
      .text(`Total Products Sold: ${summary.totalProducts}`)
      .text(`Total Discounts: Rs.${summary.totalDiscounts.toFixed(2)}`)
      .text(`Total Coupon Offers: Rs.${summary.totalCouponOffers.toFixed(2)}`)
      .moveDown(2);

    // Add orders table header
    

    const pageWidth = pdfDoc.page.width - 100;
    const columns = [
      { header: "Date", width: pageWidth * 0.15 },           // 15% of available width
      { header: "Customer", width: pageWidth * 0.15 },       // 15% of available width
      { header: "Payment Method", width: pageWidth * 0.15 }, // 15% of available width
      { header: "Products", width: pageWidth * 0.1 },        // 10% of available width
      { header: "Amount", width: pageWidth * 0.15 },         // 15% of available width
      { header: "Discount Amount", width: pageWidth * 0.15 },// 15% of available width
      { header: "Coupon Offer", width: pageWidth * 0.15 },   // 15% of available width
    ];


    let xPosition = 50; // Start from left margin
    columns.forEach(column => {
      column.x = xPosition;
      xPosition += column.width;
    });

    const tableTop = pdfDoc.y;
    pdfDoc.fontSize(10).font("Helvetica-Bold");

    columns.forEach(column => {
      pdfDoc.text(column.header, column.x, tableTop, {
        width: column.width,
        align: "center",
      });
    });
    // pdfDoc
    // .moveTo(50, tableTop + 20)
    // .lineTo(pdfDoc.page.width - 50, tableTop + 20)
    // .stroke();
    let tableY = tableTop + 25; // Increased spacing after headers
    pdfDoc.fontSize(10).font("Helvetica");


   

 

    for (const order of orders) {
      // CHANGE 6: Improved page break handling
      if (tableY > 700) {
        pdfDoc.addPage();
        tableY = 50;
        
        // Re-add headers on new page
        columns.forEach(column => {
          pdfDoc
            .fontSize(10)
            .font("Helvetica-Bold")
            .text(column.header, column.x, tableY, {
              width: column.width,
              align: "center",
            });
        });
        
        tableY += 25;
        
     
      }

      const row = [
        new Date(order.createdAt).toLocaleDateString(),
        order.userId.name,
        order.paymentInfo.method,
        order.items.length.toString(),
        `Rs.${(order.offerApplied > 0
          ? order.offerApplied
          : order.orderTotal
        ).toFixed(2)}`,
    `Rs.${(order.offerApplied === 0 ? 0 : order.offerApplied - order.couponDiscount).toFixed(2)}`,
        `Rs.${order.couponDiscount.toFixed(2)}`,
      ];

      row.forEach((text, i) => {
        pdfDoc.fontSize(10).font("Helvetica").text(text, columns[i].x, tableY, {
          width: columns[i].width,
          align: "center",
        });
      });


    tableY += 20; //
    }

    // Add footer
    pdfDoc
    .fontSize(8)
    .text(
      `Generated on ${new Date().toLocaleString()}`,
      50,
      pdfDoc.page.height - 50,
      { align: "center" }
    );
    // Finalize PDF
    pdfDoc.end();
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).send("Error generating PDF report");
  }
};
const downloadSalesReportExcel = async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;

    // Fetch orders based on filter
    let query = {};

    if (period === "custom" && startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (period === "daily") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query.createdAt = { $gte: today };
    } else if (period === "weekly") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      query.createdAt = { $gte: weekAgo };
    } else if (period === "monthly") {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      query.createdAt = { $gte: monthAgo };
    }

    const allOrders = await Order.find(query)
      .populate("userId", "name")
      .sort({ createdAt: -1 });

    // Filter out orders with zero total amount
    const orders = allOrders.filter((order) => {
      const totalAmount =
        order.offerApplied > 0 ? order.offerApplied : order.orderTotal;
      return totalAmount > 0;
    });

    // Calculate summary with new fields
    const summary = {
      totalOrders: orders.length,
      totalAmount: orders.reduce(
        (sum, order) =>
          sum +
          (order.offerApplied > 0 ? order.offerApplied : order.orderTotal),
        0
      ),
      totalProducts: orders.reduce((sum, order) => sum + order.items.length, 0),
      // Add these new fields:
      totalDiscounts: orders.reduce((sum, order) => {
        const discountAmount =
          order.offerApplied === 0
            ? order.orderTotal
            : order.offerApplied - order.couponDiscount;
        return sum + discountAmount;
      }, 0),
      totalCouponOffers: orders.reduce(
        (sum, order) => sum + order.couponDiscount,
        0
      ),
    };

    // Create new workbook and worksheet
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet("Sales Report");

    // Add title
    worksheet.mergeCells("A1:G1"); // Extended to include new columns
    worksheet.getCell("A1").value = "Sales Report";
    worksheet.getCell("A1").font = { size: 16, bold: true };
    worksheet.getCell("A1").alignment = { horizontal: "center" };

    // Add period
    worksheet.mergeCells("A2:G2"); // Extended to include new columns
    worksheet.getCell("A2").value = `Report Period: ${
      period.charAt(0).toUpperCase() + period.slice(1)
    }`;
    worksheet.getCell("A2").alignment = { horizontal: "center" };

    // Add date range for custom period
    if (period === "custom") {
      worksheet.mergeCells("A3:G3"); // Extended to include new columns
      worksheet.getCell("A3").value = `Date Range: ${new Date(
        startDate
      ).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
      worksheet.getCell("A3").alignment = { horizontal: "center" };
    }

    // Add summary section
    const summaryStartRow = period === "custom" ? 5 : 4;
    worksheet.getCell(`A${summaryStartRow}`).value = "Summary";
    worksheet.getCell(`A${summaryStartRow}`).font = { bold: true };

    worksheet.getCell(
      `A${summaryStartRow + 1}`
    ).value = `Total Orders: ${summary.totalOrders}`;
    worksheet.getCell(
      `A${summaryStartRow + 2}`
    ).value = `Total Amount: Rs.${summary.totalAmount.toFixed(2)}`;
    worksheet.getCell(
      `A${summaryStartRow + 3}`
    ).value = `Total Products Sold: ${summary.totalProducts}`;
    worksheet.getCell(
      `A${summaryStartRow + 4}`
    ).value = `Total Discounts: Rs.${summary.totalDiscounts.toFixed(2)}`;
    worksheet.getCell(
      `A${summaryStartRow + 5}`
    ).value = `Total Coupon Offers: Rs.${summary.totalCouponOffers.toFixed(2)}`;

    // Add orders table
    const tableStartRow = summaryStartRow + 7; // Adjusted for new summary rows

    // Add headers with new columns
    const headers = [
      "Date",
      "Customer",
      "Payment Method",
      "Products",
      "Amount",
      "Discount Amount",
      "Coupon Offer"
    ];
    worksheet.getRow(tableStartRow).values = headers;
    worksheet.getRow(tableStartRow).font = { bold: true };

    // Add order data with new columns
    orders.forEach((order, index) => {
      const row = worksheet.getRow(tableStartRow + index + 1);
      row.values = [
        new Date(order.createdAt).toLocaleDateString(),
        order.userId.name,
        order.paymentInfo.method,
        order.items.length,
        `Rs.${(order.offerApplied > 0
          ? order.offerApplied
          : order.orderTotal
        ).toFixed(2)}`,
      `Rs.${(order.offerApplied === 0 ? 0 : order.offerApplied - order.couponDiscount).toFixed(2)}`,
        `Rs.${order.couponDiscount.toFixed(2)}`
      ];
    });

    // Style the table
    const tableRange = `A${tableStartRow}:G${tableStartRow + orders.length}`; // Extended to include new columns
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        cell.alignment = { horizontal: "center", vertical: "middle" };
      });
    });

    // Auto-fit columns
    worksheet.columns.forEach((column) => {
      column.width = 20;
    });

    // Add footer
    const footerRow = worksheet.lastRow.number + 2;
    worksheet.mergeCells(`A${footerRow}:G${footerRow}`); // Extended to include new columns
    worksheet.getCell(
      `A${footerRow}`
    ).value = `Generated on ${new Date().toLocaleString()}`;
    worksheet.getCell(`A${footerRow}`).alignment = { horizontal: "center" };

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=sales_report_${period}.xlsx`
    );

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error generating Excel:", error);
    res.status(500).send("Error generating Excel report");
  }
};

module.exports = {
  getSalesReport,
  downloadSalesReportPdf,
  downloadSalesReportExcel,
};
