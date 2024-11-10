const mongoose = require("mongoose");
const { Schema } = mongoose;

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        ProductName: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        salePrice: {
          type: Number,
          required: true,
        },
        regularPrice: {
          type: Number,
          required: true,
        },
        ProductTotal: { type: Number, required: true },
        color: {
          type: String,
          required: true,
        },
        productImage: {
          type: String,
          required: true,
        },
        orderStatus: {
          type: String,
          enum: ["Pending", "Shipped", "Delivered", "Canceled"],
          default: "Pending",
        },
      },
    ],
    shippingAddress: {
      houseName: { type: String, required: true },
      street: { type: String, required: true },
      landmark: { type: String, required: true },
      city: { type: String, required: true },
      district: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      addressType: { type: String, required: true },
      mobileNumber: { type: String, requred: true },
      altMobileNumber: { type: String, required: false },
    },
    paymentInfo: {
      method: { type: String, required: true },
      transactionId: { type: String },
      status: { type: String, default: "Pending" },
    },
    orderTotal: {
      type: Number,
    },
    offerApplied: {
      type: Number,
      default: 0,
    },
    couponDiscount:{
      type: Number,
      default:0,
    }
  },
  { timestamps: true }
);

orderSchema.pre("save", function (next) {
  const total = this.items.reduce((acc, curr) => {
    return curr.orderStatus !== "Canceled" ? acc + curr.ProductTotal : acc;
  }, 0);
  this.orderTotal = total;
  next();
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
