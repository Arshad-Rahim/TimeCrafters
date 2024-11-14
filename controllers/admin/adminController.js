const User = require("../../models/userSchema");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Order = require("../../models/orderScheama");
const session = require("express-session");

const pageError = async (req, res) => {
  res.render("page-error-404");
};

const loadLogin = async (req, res) => {
  try {
    if (req.session.admin) {
      return res.redirect("/admin");
    } else {
      return res.render("adminLogin");
    }
  } catch (error) {
    console.log("error in loadind admin loging page", error);
    return res.redirect("/admin/adminLogin");
  }
};
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await User.findOne({ email, isAdmin: true });
    if (admin) {
      const passwordMatch = await bcrypt.compare(password, admin.password);
      if (passwordMatch) {
        req.session.admin = true;
        return res.redirect("/admin");
      } else {
        req.flash("error_msg", "passord doesnot match");
        return res.redirect("adminLogin");
      }
    }
    req.flash("error_msg", "Not be an Admin account");
    return res.redirect("adminLogin");
  } catch (error) {
    console.error("login error", error);
  }
};

const loadDashboard = async (req, res) => {
  try {
    const order = await Order.find({});
    
    // Calculate total revenue and discount
    const totalRevenue = order.reduce((total, order) => {
      if (order.paymentInfo.status === 'Paid') {
        return total + order.orderTotal;
      }
      return total;
    }, 0);
    
    const totalDiscount = order.reduce((total, order) => {
      return total + (order.offerApplied || 0) + (order.couponDiscount || 0);
    }, 0);

    // Step 2: Prepare data with different time ranges
    const prepareTimeRangeData = (orders, range) => {
      const now = new Date();
      let startDate;
      
      switch(range) {
        case 'daily':
          startDate = new Date(now.setDate(now.getDate() - 10)); // Last 10 days
          break;
        case 'monthly':
          startDate = new Date(now.setMonth(now.getMonth() - 1)); // Last month
          break;
        case 'yearly':
          startDate = new Date(now.setFullYear(now.getFullYear() - 1)); // Last year
          break;
      }

      const filteredOrders = orders.filter(order => 
        new Date(order.createdAt) >= startDate
      );

      const groupedData = filteredOrders.reduce((acc, order) => {
        let dateKey;
        const orderDate = new Date(order.createdAt);
        
        if (range === 'yearly') {
          dateKey = orderDate.toLocaleString('default', { month: 'short', year: 'numeric' });
        } else if (range === 'monthly') {
          dateKey = orderDate.toLocaleString('default', { month: 'short', day: 'numeric' });
        } else {
          dateKey = orderDate.toISOString().split('T')[0];
        }

        if (!acc[dateKey]) {
          acc[dateKey] = {
            revenue: 0,
            orders: 0
          };
        }
        
        if (order.paymentInfo.status === 'Paid') {
          acc[dateKey].revenue += order.orderTotal;
        }
        acc[dateKey].orders++;
        return acc;
      }, {});

      return {
        labels: Object.keys(groupedData),
        revenue: Object.values(groupedData).map(d => d.revenue),
        orders: Object.values(groupedData).map(d => d.orders)
      };
    };

    // Prepare data for all time ranges
    const chartData = {
      daily: prepareTimeRangeData(order, 'daily'),
      monthly: prepareTimeRangeData(order, 'monthly'),
      yearly: prepareTimeRangeData(order, 'yearly')
    };

    // Step 3: Pass data to the template
    res.render("dashboard", {
      order,
      totalRevenue,
      totalDiscount,
      chartData: JSON.stringify(chartData)
    });
  } catch (error) {
    console.log("Error to load Dashboard", error);
  }
};

const logout = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.log("error in destroying adminSession");
      } else {
        return res.redirect("/admin/adminLogin");
      }
    });
  } catch (err) {
    console.log("unexpected error during the logout", err);
  }
};

module.exports = {
  loadLogin,
  login,
  loadDashboard,
  pageError,
  logout,
};
