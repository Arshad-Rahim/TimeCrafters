const Product = require('../../models/productSchema');
const Wishlist = require('../../models/wishlistSchema');
const User = require('../../models/userSchema');
const mongoose = require("mongoose");


const wishlist = async(req,res) =>{
    try {

       const userId = req.session.user;


       if(!userId){
        return res.status(400).json({
            success: false,
            message: "User is not LogedIn",
            redirectURL: "/login",
          });
    }

       const {productId} = req.params;

       const [product,userWishlistExisting] = await Promise.all([
        Product.findOne({_id:productId}),
        Wishlist.findOne({userId}),
       ])
       if(userWishlistExisting){
        const productExisting = await Wishlist.findOne({
            userId,
            "wishlist.productId":product._id,
        })
        if(productExisting){
            return res.status(400).json({
                success: false,
                message: "Product is alredy in the Wishlist",
              }); 
        }else{
            userWishlistExisting.wishlist.push({
                productId:product._id,
            })

        }

        await userWishlistExisting.save();;
        if(userWishlistExisting){
            return res.status(200).json({
                success: true,
                message: "Added to Wishlist",
                // redirectURL: "/cart",
              });
        }else{
            return res.status(400).json({
                success: false,
                message: "Failed to Add to Wishlist",
              });  
        }
       }else{
        const saveWishlist = new Wishlist({
            userId,
            wishlist:[
                {
                    productId:product._id,
                }
            ]
        });
        await saveWishlist.save();
        if(saveWishlist){
            return res.status(200).json({
                success: true,
                message: "Added to Wishlist",
              });
        }else{
            return res.status(400).json({
                success: false,
                message: "Failed to Add to Wishlist",
              });
        }
       }

    } catch (error) {
        console.log('Error in wishlist',error);
    }
}

const getWishlist = async(req,res) =>{
    try {

        const userId = req.session.user;


        const user = await User.findOne({_id:userId});
        if(!user){
            return res.status(400).json({
                success:false,
                message:'User is not loged in',
            })
        }

        const wishlist = await Wishlist.findOne({userId}).populate('wishlist.productId');
        

        return res.render('wishlist',{wishlist,user:true});
        
    } catch (error) {
        console.log('Error in the getWishList',error);
    }
}

const deleteWishlistProduct = async(req,res) =>{
    try {

        const userId = req.session.user;
        const productId = req.params.id;


        const result = await Wishlist.updateOne(
            {userId:userId},
            {
                $pull:{
                    wishlist:{productId: new mongoose.Types.ObjectId(productId)}
                }
            }
        );

        if(result.modifiedCount==0){
            return res.status(400).json({
                success:false,
                message:'Item is not found in the wishlist'
            })
        }

        return res.status(200).json({
            success:true,
            message:'Product removed from the wishlist'
        })
        
    } catch (error) {
        console.log('Error in deleteWishlistProduct',error);
        
    }
}



module.exports={
wishlist,
getWishlist,
deleteWishlistProduct,
}
