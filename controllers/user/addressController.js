const Address = require("../../models/addressSchema");
const User = require("../../models/userSchema");

const getMyAddress = async (req, res) => {
  try {
    const id = req.session.user;

    const address = await Address.find({ userId: id });

    return res.render("myAddress", { address ,user:true});
  } catch (error) {
    console.log("Error in getMyAddress", error);
  }
};

const getAddAddress = async (req, res) => {
  try {
    const {redirect} = req.query;
    const userId = req.session.user;
    const user = await User.findOne({_id:userId});

    return res.render("addAddress", { userId ,user,redirect});
  } catch (error) {
    console.log("Error in getAddAddress", error);
  }
};

const postAddAddress = async (req, res) => {
  try {
    const {
      userId,
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
      redirect
    } = req.body;
  

    const saveAddress = new Address({
      userId,
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
    });

    await saveAddress.save();
    if (saveAddress) {
      return res.json({
        success: true,
        message: "Address added succesfuly",
        redirectURL: `/${redirect}`,
      });
    } else {
      return res.json({ success: false, message: "Error in saving address" });
    }
  } catch (error) {
    console.log("Error in postAddAddress", error);
  }
};

const getEditAddress = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.session.user;
    const {redirect} = req.query;
   
    const [userData,address] = await Promise.all([
      User.findOne({ _id: userId }),
      Address.findOne({ _id: id }),
    ])

    return res.render("editAddress", { userData, address,user:true,redirect });
  } catch (error) {
    console.log("Error in getEditAddress", error);
  }
};

const putEditAddress = async (req, res) => {
  try {
    const id = req.params.id;
    const {
      userId,
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
      redirect
    } = req.body;

    const updateAddress = await Address.findOneAndUpdate(
      { _id: id },
      {
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
      },
      { new: true }
    );

    if (updateAddress) {
      return res.status(200).json({
        success: true,
        message: "Address updated Succesfully",
        redirectURL: `/${redirect}`,
      });
    } else {
      return res.status(400).json({ error: "Address not updated" });
    }
  } catch (error) {
    console.log("Error in PutEditAddress", error);
  }
};

const deleteAddress = async (req, res) => {
  try {
    const id = req.params.id;
    const deleteAddress = await Address.findOneAndDelete({ _id: id });
    if (deleteAddress) {
      return res.status(200).json({
        success: true,
        message: "Address deleted Succesfully",
        redirectURL: "/myAddress",
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Address not Deleted",
      });
    }
  } catch (error) {
    console.log("Error in deleteAddress", error);
  }
};

module.exports = {
  getMyAddress,
  getAddAddress,
  postAddAddress,
  getEditAddress,
  putEditAddress,
  deleteAddress,
};
