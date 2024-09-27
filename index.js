const express = require("express");
const app = express();
const env = require("dotenv").config();
const path = require("path");
const db = require("../first project/config/db");
db();
const userRouter = require("./routes/userRouter");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.use(express.static("public"));

app.set("views", [
  path.join(__dirname, "views/user"),
  path.join(__dirname, "views/admin"),
]);

app.use("/", userRouter);

app.listen(3000, () => console.log("Server is running"));
