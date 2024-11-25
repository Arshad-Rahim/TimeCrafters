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

      const Order = require('/home/arshad-rahim/first project/models/orderScheama');
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





      // Middleware to validate payment amount
const validatePaymentAmount = (req, res, next) => {
  const amount = req.session.convertAmount;
  
  // Validate amount exists and is valid
  if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid payment amount',
      redirectURL: '/checkout'
    });
  }
  
  // Store formatted amount in session
  req.session.formattedAmount = parseFloat(amount).toFixed(2);
  next();
};



app.get('/pay',  (req, res) => {
  const amount = req.session.convertAmount || "0.00";

  if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
    throw new Error('Invalid payment amount');
  }

  req.session.formattedAmount = parseFloat(amount).toFixed(2);

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
                "sku": "ORDER-" + Date.now(), 
                "price": req.session.formattedAmount,
                "currency": "USD",
                "quantity": 1
            }]
        },
        "amount": {
            "currency": "USD",
           "total": req.session.formattedAmount,
        },
        "description": "Order Payment"
    }]
};

  paypal.payment.create(create_payment_json, function (error, payment) {
    if (error) {
      console.error('PayPal Creation Error:', error);
      res.redirect('/checkout?error=payment_failed');
    } else {
      // Store payment ID in session
      req.session.paypalPaymentId = payment.id;
      
      for(let i = 0; i < payment.links.length; i++) {
        if(payment.links[i].rel === 'approval_url') {
          res.redirect(payment.links[i].href);
          return;
        }
      }
    }
  });
    });

// app.get('/success', async(req, res) => {
//   const payerId = req.query.PayerID;
//   const paymentId = req.query.paymentId;

//   const execute_payment_json = {
//     "payer_id": payerId,
//     "transactions": [{
//         "amount": {
//             "currency": "USD",
//             "total": formattedAmount.toString(),
//         }
//     }]
//   };

//    paypal.payment.execute (paymentId, execute_payment_json, function (error, payment) {
//     if (error) {
//         console.log(error.response);
//         throw error;
//     } else {
//         // console.log(JSON.stringify(payment));
//         (async ()=>{
//           const order = await Order.findOne({ userId: req.session.user }).sort({ createdAt: -1 });
//           order.paymentInfo.status = "Paid"
//           await order.save();
//           // console.log(order)
//         })();
//         delete req.session.convertAmount;
//         delete req.session.formattedAmount;
// console.log('order succes index varunnunto')
//         res.redirect('/orderSuccess');
//     }
// });
// });
//   paypal.payment.create(create_payment_json, function (error, payment) {
//       if (error) {
//           throw error;
//       } else {
//           for(let i = 0;i < payment.links.length;i++){
//             if(payment.links[i].rel === 'approval_url'){
//               res.redirect(payment.links[i].href);
//             }
//           }
//       }
//     });
    
// app.get('/cancel', (req, res) => res.send('Cancelled'));
app.get('/success', async (req, res) => {
  try {
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;
    
    // Verify we have the correct payment ID
    if (paymentId !== req.session.paypalPaymentId) {
      throw new Error('Payment ID mismatch');
    }

    const execute_payment_json = {
      "payer_id": payerId,
      "transactions": [{
        "amount": {
          "currency": "USD",
          "total": req.session.formattedAmount
        }
      }]
    };

    paypal.payment.execute(paymentId, execute_payment_json, async function (error, payment) {
      if (error) {
        console.error('PayPal Execution Error:', error);
        return res.redirect('/checkout?error=payment_failed');
      }
      
      try {
        const order = await Order.findOne({ userId: req.session.user }).sort({ createdAt: -1 });
        order.paymentInfo.status = "Paid";
        order.paymentInfo.paypalPaymentId = paymentId;
        await order.save();

        // Clear all payment-related session data
        delete req.session.convertAmount;
        delete req.session.formattedAmount;
        delete req.session.paypalPaymentId;
        delete req.session.couponDiscount;
        
        res.redirect('/orderSuccess');
      } catch (dbError) {
        console.error('Database Error:', dbError);
        res.redirect('/checkout?error=order_update_failed');
      }
    });
  } catch (error) {
    console.error('Success Route Error:', error);
    res.redirect('/checkout?error=payment_processing_failed');
  }
});


      app.listen(3000, () => console.log("Server is running"));
