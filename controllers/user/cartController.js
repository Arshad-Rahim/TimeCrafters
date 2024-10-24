
const mongoose = require('mongoose');
const Product = require('../../models/productSchema');
const Cart = require('../../models/cartSchema');

const getCart = async(req,res) =>{
    try {
  const userId = req.session.user;

  const cart = await Cart.findOne({userId}).populate({
    path:'items.productId',
    select:'productName salePrice productImage'
  })
  
 
      if(req.session.user){
        
        return res.render('cart',{cart});
      }else{
        return res.redirect('/login');
      }
      
    } catch (error) {
      console.log("Error in get cart",error);
    }
  }


  const postCart = async(req,res)=>{
    try {
        const userId = req.session.user;
        
        const  {id} = req.params;
        const {color,colorStock} = req.body;
       
        const product = await Product.findOne({_id:id});

        if(!userId){
            return res.status(400).json({
                success:false,
                message:'User is not LogedIn',
                redirectURL:'/login',
            })
        }
        if(colorStock<1){
          return res.status(400).json({
              success:false,
              message:'Selected Color is out of stock',
              
          })
      }

        let userCartExisting = await Cart.findOne({userId});

        if(userCartExisting){

          const productExisting = await Cart.findOne({userId,'items.productId':product._id})
          if(productExisting){
            return res.status(400).json({
              success:false,
              message:'Product is alredy in the cart',
          
            })
          }else{

          }

          userCartExisting.items.push({
            productId:product._id,
            productName:product.productName,
            salePrice:product.salePrice,
            regularPrice:product.regularPrice,
            productImage:product.productImage[0],
            quantity:1,
            color:color,
            colorStock:colorStock,
          });

          userCartExisting.totalPrice = userCartExisting.items.reduce((total,item)=>total+(item.salePrice * item.quantity),0);

          await userCartExisting.save();

          if(userCartExisting){
            return res.status(200).json({
                success:true,
                message:'Added to Cart',
                redirectURL:'/cart',
            });
        }else{
            return res.status(400).json({
                success:false,
                message:'Failed to Add to Cart',
            })
        }

              
        }else{


          const saveCart = new Cart({
            userId,
            items:[{

                productId:product._id,
                productName:product.productName,
                regularPrice:product.regularPrice,
                salePrice:product.salePrice,
                productImage:product.productImage[0],
                quantity:1,
                color:color,
                colorStock:colorStock,
            }]
           
        })

        saveCart.totalPrice = saveCart.items.reduce((total,item) => total+(item.salePrice * item.quantity),0)

        await saveCart.save();
        if(saveCart){
            return res.status(200).json({
                success:true,
                message:'Added to Cart',
                redirectURL:'/cart',
            });
        }else{
            return res.status(400).json({
                success:false,
                message:'Failed to Add to Cart',
            })
        }
          
        }
        
   
       
        
    } catch (error) {
        console.log('Error in postCart',error);
    }
  }
  


  module.exports={
    getCart,
    postCart,
  }