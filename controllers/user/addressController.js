const Address = require('../../models/addressSchema');



const getMyAddress = async(req,res) =>{
    try {
      const id = req.session.user;
    
      const address = await Address.find({userId:id})
      
      
      if(req.session.user){
        return res.render('myAddress',{address});
      }else{
        return res.redirect('/login');
      }
      
    } catch (error) {
      console.log('Error in getMyAddress',error);
    }
  }



const getAddAddress = async(req,res)=>{
    try {
  
      if(req.session.user){
       const userId = req.session.user; 
      
       
  
        return res.render('addAddress',{userId});
      }else{
        return res.redirect('/login');
      }
      
    } catch (error) {
      console.log("Error in getAddAddress",error);
    }
  }
  
  



const postAddAddress = async(req,res) =>{
    try {
      
      
      
       const {userId,houseName,street,landmark,city,district,state,zipCode,addressType,mobileNumber,altMobileNumber} = req.body;
      
  
       const saveAddress = new Address({
        userId,
        houseName,street,
        landmark,
        city,
        district,
        state,
        zipCode,
        addressType,
        mobileNumber,
        altMobileNumber
        
       })
  
       await saveAddress.save();
  if(saveAddress){
   
    return res.json({
      success:true,
      message:'Address added succesfuly',
      redirectURL:"/myAddress"
    });
  }else{
    return res.json({success:false,message:"Error in saving address"})
  }
       
      
      
      
    } catch (error) {
      console.log("Error in postAddAddress",error)
    }
  }



  const getEditAddress = async(req,res) =>{
    try {
  
      const id = req.params.id;
      const userId = req.session.user;
      const userData = await User.findOne({_id:userId});
      const address = await Address.findOne({_id:id});
      
  
      if(req.session.user){
        return res.render('editAddress',{userData,address});
      }else{
        return res.redirect('/login');
      }
      
    } catch (error) {
      console.log('Error in getEditAddress',error)
    }
  }



  const putEditAddress = async(req,res)=>{
    try {
      const id = req.params.id;
      const {userId,houseName,street,landmark,city,district,state,zipCode,addressType,mobileNumber,altMobileNumber} = req.body;
     
      const updateAddress = await Address.findOneAndUpdate({_id:id},{
        houseName,
        street,
        landmark,
        city,
        district,
        state,
        zipCode,
        addressType,
        mobileNumber,
        altMobileNumber,
        
      },{new:true});
  
      if(updateAddress){
        return res.status(200).json({
          success:true,
          message:'Address updated Succesfully',
          redirectURL:"/myAddress"
        })
      }else{
        return res.status(400).json({error:'Address not updated'})
      }
      
    } catch (error) {
      console.log('Error in PutEditAddress',error);
    }
  }
  




const deleteAddress = async(req,res) =>{
    try {
  
    const id = req.params.id;
    const deleteAddress =  await Address.findOneAndDelete({_id:id});
    if(deleteAddress){
      return res.status(200).json({
        success:true,
        message:'Address deleted Succesfully',
        redirectURL:'/myAddress',
      })
    }else{
      return res.status(400).json({
        success:false,
        message:'Address not Deleted',
      })
    }
      
    } catch (error) {
      console.log('Error in deleteAddress',error);
    }
  }
  
  



module.exports={

    getMyAddress,
    getAddAddress,
    postAddAddress,
    getEditAddress,
    putEditAddress,
    deleteAddress,

}