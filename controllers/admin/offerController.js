
const Offer = require('../../models/offerSchema');
const Product = require('../../models/productSchema');

const productOffers = async(req,res)=>{
    try {

        return res.render('offerManagment');
        
    } catch (error) {
        console.log('Error n offerManagment',error);
    }
}



const categoryOffers = async(req,res) =>{
    try {

        return res.render('categoryOffers');
        
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
     const target = await Product.findOne({productName:selectedProduct});
     const offerPrice = (target.regularPrice)/100 * offerPercentage;
     console.log(offerPrice)
     const updatedSalePrice = target.regularPrice - offerPrice;
     console.log(updatedSalePrice);

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



module.exports={

    productOffers,
    categoryOffers,
    addProductOffer,

}