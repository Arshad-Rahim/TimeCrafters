const mongoose = require("mongoose");
const env = require("dotenv").config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_ATLAS_CONNECTION_STRING,{
      tls:true,
    });
    console.log("DB connected");
  } catch (error) {
    console.log("DB connection error", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
