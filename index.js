      const express = require("express");
      const flash = require('connect-flash');
      const app = express();
      const session = require('express-session');
      const dotenv = require('dotenv');
      const env = require("dotenv").config();
      const path = require("path");
      const passport = require('./config/passport');

      const paypal = require('paypal-rest-sdk');

      const db = require("../first project/config/db");
      db();
      const userRouter = require("./routes/userRouter");
      const adminRouter = require('./routes/adminRouter');

      paypal.configure({
        'mode': 'sandbox', //sandbox or live
        'client_id': process.env.PAYPAL_CLIENT_ID,
        'client_secret': process.env.PAYPAL_CLIENT_SECRET,
      });

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






app.get('/pay', (req, res) => {
  const amount = req.session.convertAmount || "0.00";
  const create_payment_json = {
    "intent": "sale",
    "payer": {
        "payment_method": "paypal"
    },
    "redirect_urls": {
        "return_url": "http://localhost:3000/success",
        "cancel_url": "http://localhost:3000/cancel"
    },
    "transactions": [{
        "item_list": {
            "items": [{
                "name": "Red Sox Hat",
                "sku": "001",
                "price": amount.toString(),
                "currency": "USD",
                "quantity": 1
            }]
        },
        "amount": {
            "currency": "USD",
            "total": amount.toString(),
        },
        "description": "Dynamic Price Purchased"
    }]
};
app.get('/success', (req, res) => {
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;

  const execute_payment_json = {
    "payer_id": payerId,
    "transactions": [{
        "amount": {
            "currency": "USD",
            "total": amount.toString(),
        }
    }]
  };

  paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
    if (error) {
        console.log(error.response);
        throw error;
    } else {
        console.log(JSON.stringify(payment));
        res.redirect('/orderSuccess');
    }
});
});
  paypal.payment.create(create_payment_json, function (error, payment) {
      if (error) {
          throw error;
      } else {
          for(let i = 0;i < payment.links.length;i++){
            if(payment.links[i].rel === 'approval_url'){
              res.redirect(payment.links[i].href);
            }
          }
      }
    });
    
    });
app.get('/cancel', (req, res) => res.send('Cancelled'));


      app.listen(3000, () => console.log("Server is running"));
