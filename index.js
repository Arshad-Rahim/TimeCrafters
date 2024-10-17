      const express = require("express");
      const flash = require('connect-flash');
      const app = express();
      const session = require('express-session');
      const dotenv = require('dotenv');
      const env = require("dotenv").config();
      const path = require("path");
      const passport = require('./config/passport');
      const db = require("../first project/config/db");
      db();
      const userRouter = require("./routes/userRouter");
      const adminRouter = require('./routes/adminRouter');

      app.use(express.json());
      app.use(express.urlencoded({ extended: true }));

      // session
      app.use(session({
        secret:process.env.SESSION_SECRET,
        resave:false,
        saveUninitialized:true,
        cookie:{
          secure:false,
          httpOnly:true,
          maxAge:72*60*60*1000,
        }
      }))

      app.use(flash());

      app.use((req,res,next) =>{
        res.locals.success_msg = req.flash('success_msg');
        res.locals.error_msg = req.flash('error_msg');
        res.locals.error = req.flash('error');
        next();
      })

      app.use(passport.initialize());
      app.use(passport.session());


      app.use((req,res,next) =>{
        res.set('cache-control','no-store');
        next();
      })

      app.set("view engine", "ejs");
      app.use(express.static("public"));

      app.set("views", [
        path.join(__dirname, "views/user"),
        path.join(__dirname, "views/admin"),
      ]);

      app.use("/", userRouter);
      app.use('/admin',adminRouter);

      app.listen(3000, () => console.log("Server is running"));
