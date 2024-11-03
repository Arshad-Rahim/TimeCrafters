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

    return res.render("category", {
      cat: categoryData,
      currentPage: page,
      totalPages: totalPages,
      totalCategories: totalCategories,
    });
  } catch (error) {
    console.log("Error in Category Info ", error);
  }
};

const addCategory = async (req, res) => {
  try {
    const { categoryName, description } = req.body;

    const LowerCaseCategoryName = categoryName.trim().toLowerCase();

    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${LowerCaseCategoryName}$`, "i") },
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category already existing",
      });
    } else {
      const newCategory = new Category({
        name: categoryName,
        description,
      });

      await newCategory.save();
      return res.status(200).json({
        success: true,
        message: "Category added succesfully",
        redirectURL: "/admin/category",
      });
    }
  } catch (error) {
    return res.json({ error: "Internal Server Error " });
  }
};

const getListCategory = async (req, res) => {
  try {
    const id = req.query.id;

    await Category.updateOne({ _id: id }, { $set: { isListed: false } });
    return res.redirect("/admin/category");
  } catch (error) {
    console.log("Error to Unlist the Category", error);
  }
};

const getUnListedCategory = async (req, res) => {
  try {
    const id = req.query.id;
    await Category.updateOne({ _id: id }, { $set: { isListed: true } });
    return res.redirect("/admin/category");
  } catch (error) {
    console.log("Error in Unlisting Category", Error);
  }
};

const getEditCategory = async (req, res) => {
  try {
    const id = req.query.id;
    const category = await Category.findOne({ _id: id });

    return res.render("editCategory", { category: category });
  } catch (error) {
    console.log("Error in editing the Category", error);
  }
};

const editCategory = async (req, res) => {
  try {
    const id = req.params.id;

    console.log(id);

    const categoryName = req.body.categoryName.trim();
    const description = req.body.description.trim();

    const isCategoryExists = await Category.findOne({
      name: categoryName,
      _id: { $ne: id },
    });

    if (isCategoryExists) {
      return res.status(409).json({ error: "Catgeory already existing" });
    }

    const existingCategory = await Category.findById(id);

    // ee two way ith implement cheyyam
    // const updateCategory = await Category.findByIdAndUpdate(id,{
    //   name:categoryName,
    //   description:description,
    // },{new:true});

    if (existingCategory.name != categoryName) {
      existingCategory.name = categoryName;
    }

    if (existingCategory.description != description) {
      existingCategory.description = description;
    }

    await existingCategory.save();

    if (existingCategory) {
      return res.status(200).json({
        success: true,
        message: "Category has updated succesfully",
        redirectURL: "/admin/category",
      });
    } else {
      return res.status(400).json({ error: "category not found" });
    }
  } catch (error) {
    return res.status(500).json({ error: "Inernal Server error" });
  }
};

module.exports = {
  categoryInfo,
  addCategory,
  getListCategory,
  getUnListedCategory,
  getEditCategory,
  editCategory,
};
