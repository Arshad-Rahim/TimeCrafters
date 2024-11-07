
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
       console.log(selectedProduct)
     
     const offerNameLowerCase = offerName.trim().toLowerCase();
     const exisitingOfferName = await Offer.findOne({
        name:{ $regex: new RegExp(`^${offerNameLowerCase}$`, "i")}
     });
     const target = await Product.findOne({productName:selectedProduct});
     if(!target){
        return res.status(400).json({
            success:false,
            message:'Product with this name notfound'
        })
     }
     const offerPrice = (target.regularPrice)/100 * offerPercentage;
     const updatedSalePrice = target.regularPrice - offerPrice;

   target.salePrice = updatedSalePrice;
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
        // selected category is passing in here

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

             const product = await Product.findOne({productName:productName});
             product.salePrice = product.regularPrice;
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
             await Product.updateMany(
                { category: category._id },
                [
                    {
                        $set: {
                            salePrice: "$regularPrice"
                        }
                    }
                ]
            );
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