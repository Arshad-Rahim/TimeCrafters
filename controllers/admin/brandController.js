const Brand = require("../../models/brandSchema");

const getBrandPage = async (req, res) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = 3;
    const skip = (page - 1) * limit;

    const brandData = await Brand.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalBrands = await Brand.countDocuments();
    const totalPages = Math.ceil(totalBrands / limit);


      return res.render("brands", {
        data: brandData,
        currentPage: page,
        totalPages: totalPages,
        totalBrands: totalBrands,
      });
  
  } catch (error) {
    console.error("Error to rendering brands", error);
    return res.status(500).send("Server error");
  }
};

const addBrands = async (req, res) => {
  try {
    const brand = req.body.name;
    const findBrand = await Brand.findOne({ brand });

    if (!findBrand) {
      const image = req.file.filename;
      const newBrand = new Brand({
        brandName: brand,
        brandImage: image,
      });
      await newBrand.save();
      return res.redirect("/admin/brands");
    }
  } catch (error) {
    console.error("Error in addidn Brand Controller", error);
  }
};

const blockBrand = async (req, res) => {
  try {
    const { id } = req.query;
    await Brand.updateOne({ _id: id }, { $set: { isBlocked: true } });
    return res.redirect("/admin/brands");
  } catch (error) {
    console.error("Error in blocking the User", error);
  }
};

const unBlockBrand = async (req, res) => {
  try {
    const { id } = req.query;
    await Brand.updateOne({ _id: id }, { $set: { isBlocked: false } });
    return res.redirect("/admin/brands");
  } catch (error) {
    console.log("Error in unblocking User", error);
  }
};

const deleteBrand = async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json("id doesnot received in deleteController");
    } else {
      await Brand.deleteOne({ _id: id });
      return res.redirect("/admin/brands");
    }
  } catch (error) {
    console.error("Error in deleting brand", error);
  }
};

const getEditBrand = async (req, res) => {
  try {
    const id = req.query.id;
    const brand = await Brand.findOne({ _id: id });

      return res.render("editBrand", { brand: brand });
    
  } catch (error) {
    console.error("Error to rendering editing brand page", error);
  }
};

const editBrand = async (req, res) => {
  try {
    const id = req.params.id;

    const { brandName } = req.body;
    if (req.file.filename) {
      brandImage = req.file.filename;
    }

    const existingBrand = await Brand.findOne({
      brandName: brandName,
      _id: { $ne: id },
    });

    if (existingBrand) {
      return res.status(400).json({ error: "The brand name alredy exists" });
    }

    const updateBrand = await Brand.findByIdAndUpdate(
      id,
      {
        brandName: brandName,
        brandImage: brandImage,
      },
      { new: true }
    );

    if (updateBrand) {
      return res.redirect("/admin/brands");
    } else {
      return res.status(400).json({ error: "brand not found" });
    }
  } catch (error) {
    console.error("Error in editing the Brand".error);
  }
};

module.exports = {
  getBrandPage,
  addBrands,
  blockBrand,
  unBlockBrand,
  deleteBrand,
  getEditBrand,
  editBrand,
};
