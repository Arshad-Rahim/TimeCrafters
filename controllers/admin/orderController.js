const Order = require('../../models/orderScheama');
const User = require('../../models/userSchema');


const getOrderManagment = async(req,res) =>{
    try {

        if(req.session.admin){
            const order = await Order.find()
        .populate('userId')
        .sort({createdAt:-1});


        return res.render('orderManagment',{order});
        }else{
            return res.redirect('/admin/adminLogin');
        }
        

        
    } catch (error) {
        console.log('Error in getOrderManagment',error);
    }
}


const updateStatus = async(req,res) =>{
    try {

        let {orderId,productId} = req.params;

        const {status} = req.body;


        const order = await Order.findOne({_id:orderId});

        const itemIndex = order.items.findIndex(item => item.productId.toString() == productId);



        if(itemIndex == -1){
            return res.status(400).json({
              success:false,
              message:'item not found in the order',
            })
          }

          order.items[itemIndex].orderStatus = status;

          await order.save();

          return res.status(200).json({
            success:true,
            message:'Order status changed Succesfully',
          })
        
    } catch (error) {
        console.log("Error in updateStatus",error);
    }
}


const getPopUpOrderDetails = async(req,res) =>{
    try {

        return res.render('popUpProductDetails');
        
    } catch (error) {
        console.log('Error in getPopUpOrderDetails',error);
    }
}

module.exports={

    getOrderManagment,
    updateStatus,
    getPopUpOrderDetails,
}
