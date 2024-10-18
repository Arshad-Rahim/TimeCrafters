const User = require('../../models/userSchema');


const customerInfo = async (req,res) =>{
    
    try {
       
        
        let search='';
        if(req.query.search){
            search = req.query.search;
        }
        let page=1;
        if(req.query.page){
            page = parseInt(req.query.page);
        }
        const limit=0;
        
        const userData = await User.find({
            isAdmin:false,
            $or:[
                {name:{$regex: '.*'+search + '.*'}},
                {email:{$regex: '.*'+search + '.*'}},

            ],
        })
        .limit(limit*1)
        .skip((page-1)*limit)
        .exec();


        const count = await User.find({
            isAdmin:false,  
            $or:[
                {name:{$regex:'.*' +search+'.*'}},
                {email:{$regex:'.*' +search+'.*'}},

            ]
        }).countDocuments();

        const totalPages = Math.ceil(count/limit);
        
        if(req.session.admin){
            return  res.render('userList',{data:userData,totalPages:totalPages,currentPage:page,search:search});
          }else{
             return res.redirect('/admin/adminLogin');
          }
       

    } catch (error) {
      console.error("Error in customer Info ",error)
    }
};


const userBlocked = async(req,res) =>{
    try {

        const id = req.query.id;
        await User.updateOne({_id:id},{$set:{isBlocked:true}});
       return  res.redirect('/admin/users')
        
    } catch (error) {
        console.log('Error in blocking user',error);
    }
}

const userUnBlocked = async(req,res) =>{
    try {

        const id = req.query.id;
        await User.updateOne({_id:id},{$set:{isBlocked:false}});
        return res.redirect('/admin/users');

    } catch (error) {
        console.log('Error in unblocking user',error);
    }
}



module.exports={
    customerInfo,
    userBlocked,
    userUnBlocked,
}