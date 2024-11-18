
const Offer = require('../../models/offerSchema');
const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema');

const productOffers = async(req,res)=>{
    try {

        const offer = await Offer.find({type:'product'});
        return res.render('offerManagment',{offer});
        
    } catch (error) {
        console.log('Error n offerManagment',error);
    }
}



const categoryOffers = async(req,res) =>{
    try {


        const [category,offer] = await Promise.all([
            await Category.find(),
            Offer.find({type:'category'}),
        ])

        return res.render('categoryOffers',{category:category,offer});
        
    } catch (error) {
        console.log('Error in the categoryOffes',error);
    }
}


const addProductOffer = async(req,res) =>{
    try {
       
       const  {offerName,offerPercentage,endDate,selectedProduct} = req.body;
     
     
     const offerNameLowerCase = offerName.trim().toLowerCase();
     const exisitingOfferName = await Offer.findOne({
        name:{ $regex: new RegExp(`^${offerNameLowerCase}$`, "i")}
     });
     const existingSelectedProduct = await Offer.findOne({targetName:selectedProduct});
     if(existingSelectedProduct){
        return res.status(400).json({
            success:false,
            message:'Alredy there is offer existing in this product',
        })
     }



     const target = await Product.findOne({productName:selectedProduct}).populate('category');
     if(!target){
        return res.status(400).json({
            success:false,
            message:'Product with this name notfound'
        })
     }

     
     const offerPrice = (target.regularPrice)/100 * offerPercentage;
     const updatedSalePrice = target.regularPrice - offerPrice;

   target.salePrice = Math.round(updatedSalePrice) ;
   await target.save();

     const targetId = target._id;
     if(exisitingOfferName){
        return res.status(400).json({
            success:false,
            message:'OfferName alredy existing',
        });
     }else{
        const newOffer = new Offer({
            name:offerName,
            percentage:offerPercentage,
            type:'product',
            targetId:targetId,
            targetName:selectedProduct,
            endDate:endDate,
        })

        await newOffer.save();

     const existingProductOffer = await Offer.findOne({ targetId: target._id, type: 'product'});
     const categoryOffer = await Offer.findOne({ targetId: target.category._id, type: 'category' });


       let totalOfferPercentage = 0; 

       if (existingProductOffer) {
         totalOfferPercentage += existingProductOffer.percentage;
       }
 
       if (categoryOffer) {
         totalOfferPercentage += categoryOffer.percentage;
       }
       if(totalOfferPercentage>99){
        totalOfferPercentage=99;
       }
 
       const totalOfferAmount = (target.regularPrice / 100) * totalOfferPercentage;
       const finalUpdatedSalePrice = target.regularPrice - Math.round(totalOfferAmount) ;
 
       target.salePrice = finalUpdatedSalePrice;
       target.productOffer = totalOfferPercentage; 
       await target.save();

        return res.status(200).json({
            success:true,
            message:'Offer added succesfully',
            redirectURL:'/admin/productOffers',
        })
     }
        
    } catch (error) {
        console.log('Error in addProductOffer',error);
    }
}



const addCategoryOffer = async(req,res) =>{
    try {
        
        const {offerName,offerPercentage,endDate,selectedCategory} = req.body;

        const offerNameLowerCase = offerName.trim().toLowerCase();
     const exisitingOfferName = await Offer.findOne({
        name:{ $regex: new RegExp(`^${offerNameLowerCase}$`, "i")}
     });

    

     const targetCategory = await Category.findById(selectedCategory);


     if(!targetCategory) {
       return res.status(400).json({
         success: false,
         message: 'Selected category not found'
       });
     }
     const category = await Category.findOne({_id:selectedCategory});
     const existingCategory = await Offer.findOne({
        targetName:category.name,
     })

     if(existingCategory){
        return res.status(400).json({
            success:false,
            message:'Alredy an offer exist for that category',
        })
     }



if(exisitingOfferName){
    return res.status(400).json({
      success:false,
      message:'Offer Name already existing'
    });
  } else {
      
        const multiplier = 1 - (offerPercentage / 100);

        await Product.updateMany(
            { category: targetCategory._id },
            [  
                {
                    $set: {
                        salePrice: {
                            $multiply: ["$regularPrice", multiplier]
                        },
                        productOffer: offerPercentage
                    }
                }
            ]
        );


      const newOffer = new Offer({
        name: offerName,
        percentage: offerPercentage,
        type: "category",
        targetId: targetCategory._id,
        targetName: targetCategory.name,
        endDate: endDate,
      });

      await newOffer.save();






        const productsInCategory = await Product.find({ category: targetCategory._id });

        for (const product of productsInCategory) {
            const existingProductOffer = await Offer.findOne({ 
                targetId: product._id, 
                type: 'product'
            });

            let totalOfferPercentage = Number(offerPercentage); 

            if (existingProductOffer) {
                totalOfferPercentage += +existingProductOffer.percentage;
            }

            if(totalOfferPercentage>99){
              totalOfferPercentage=99;
             }

            const totalOfferAmount = (product.regularPrice / 100) * totalOfferPercentage;
            const finalUpdatedSalePrice = product.regularPrice - Math.round(totalOfferAmount) ;

            product.salePrice = finalUpdatedSalePrice;
            product.productOffer = totalOfferPercentage;
            await product.save();
        }



      return res.status(200).json({
        success: true,
        message: "Offer added to the Category successfully",
        redirectURL: "/admin/categoryOffers",
      });
    }
    } catch (error) {
        console.log('Error in the addCategoryOffer',error);
    }
}



const deleteProductOffer = async(req,res) =>{
    try {

        const offerId = req.query.id;
        const productName = req.query.productName;
          
        if(!offerId){
            return res.status(400).json({
                success:false,
                message:'Error in getting the Id of the Offer',
            })
        }else{
             await Offer.deleteOne({_id:offerId});

             const product = await Product.findOne({productName:productName}).populate('category');
             if(!product){
                return res.status(400).json({
                    success:fasle,
                    message:"Product not found",
                })
             }

             const categoryOffer = await Offer.findOne({
                targetId: product.category._id,
                type: 'category',
              });

              if (categoryOffer) {
                const totalOfferAmount = (product.regularPrice / 100) * categoryOffer.percentage;
                product.salePrice = product.regularPrice - totalOfferAmount;
                product.productOffer = categoryOffer.percentage; 
              } else {
                product.salePrice = product.regularPrice;
                product.productOffer = 0;
              }

             await product.save();
            
             return res.status(200).json({
                success:true,
                message:'Offer deleted Succesfully',
                redirectURL:'/admin/productOffers',
             })

        }
        
    } catch (error) {
        console.log('Error in deleteProductOffer',error);
    }
}


const deleteCategoryOffer = async(req,res) =>{
    try {

        const offerId = req.query.id;
        const categoryName = req.query.categoryName;
        if(!offerId){
            return res.status(400).json({
                success:false,
                message:'Error in getting the Id of the Offer',
            })
        }else{
             await Offer.deleteOne({_id:offerId});
             
             const category = await Category.findOne({ name: categoryName });
             if (!category) {
                return res.status(404).json({
                  success: false,
                  message: 'Category not found',
                });
              }
            
          const productsInCategory = await Product.find({ category: category._id });

      for (const product of productsInCategory) {
        const existingProductOffer = await Offer.findOne({
          targetId: product._id,
          type: 'product'
        });

        if (existingProductOffer) {
          const totalOfferAmount = (product.regularPrice / 100) * existingProductOffer.percentage;
          product.salePrice = product.regularPrice - totalOfferAmount;
          product.productOffer = existingProductOffer.percentage;
        } else {
          product.salePrice = product.regularPrice;
          product.productOffer = 0; 
        }

        await product.save();
      }


             return res.status(200).json({
                success:true,
                message:'Offer deleted Succesfully',
                redirectURL:'/admin/categoryOffers',
             })

        }
        
    } catch (error) {
        console.log('Error in deleteCategoryOffer',error);
    }
}

module.exports={

    productOffers,
    categoryOffers,
    addProductOffer,
    addCategoryOffer,
    deleteProductOffer,
    deleteCategoryOffer,

}