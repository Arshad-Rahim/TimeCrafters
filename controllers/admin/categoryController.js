const Category = require("../../models/categorySchema");

const categoryInfo = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 3;
    const skip = (page - 1) * limit;

    const categoryData = await Category.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCategories = await Category.countDocuments();
    const totalPages = Math.ceil(totalCategories / limit);

    if(req.session.admin){
      return res.render("category", {
        cat: categoryData,
        currentPage: page,
        totalPages: totalPages,
        totalCategories: totalCategories,
      });
    }else{
       return res.redirect('/admin/adminLogin');
    }
    
  } catch (error) {
    console.log("Error in Category Info ", error);
  }
};

const addCategory = async (req, res) => {
  try {
    
    const { name, description } = req.body;
    console.log(req.body)

    const existingCategory = await Category.findOne({ name });

    if (existingCategory) {
      return res.status(400).json({ error: "Category already existing" });
    } else {
      const newCategory = new Category({
        name,
        description,
      });

      await newCategory.save();
      return res.json({ message: "Category added succesfully" });
    }
  } catch (error) {
    return res.json({ error: "Internal Server Error " });
  }
};


const getListCategory = async(req,res)=>{
  try {
    
    const id = req.query.id;

    await Category.updateOne({_id:id},{$set:{isListed:false}});
    return res.redirect('/admin/category');

  } catch (error) {
    console.log("Error to Unlist the Category",error);
  }
}

const getUnListedCategory = async (req,res) =>{
  try {

    const id = req.query.id;
  await Category.updateOne({_id:id},{$set:{isListed:true}});
  return res.redirect('/admin/category')
    
  } catch (error) {
    console.log("Error in Unlisting Category",Error);
  }
  
}


const getEditCategory = async(req,res)=>{
  try {
    
    const id = req.query.id;
    const category = await Category.findOne({_id:id});

    if(req.session.admin){
      return res.render('editCategory',{category:category})
    }else{
       return res.redirect('/admin/adminLogin');
    }
  

  } catch (error) {
    console.log('Error in editing the Category',error);
  }
}

const editCategory = async(req,res)=>{
  try {
    
    const id = req.params.id;
    
    const {categoryName,description}=req.body;
   

    const existingCategory = await Category.findOne({ name: categoryName, _id: { $ne: id } });
    if(existingCategory){
      return res.status(400).json({error:'category exists, please choose another name'})
    }
    const updateCategory = await Category.findByIdAndUpdate(id,{
      name:categoryName,
      description:description,
    },{new:true});
   
   
    if(updateCategory){
      
      return res.redirect('/admin/category');
    }else{
      return res.status(400).json({error:'category not found'});
    }

  } catch (error) {
    return res.status(500).json({error:'Inernal Server error'});
  }
}

module.exports = {
  categoryInfo,
  addCategory,
  getListCategory,
  getUnListedCategory,
  getEditCategory,
  editCategory,
};