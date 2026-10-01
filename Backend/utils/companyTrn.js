// Backend/utils/companyTrn.js
// The company (GIIAN) TRN lives on the single admin user (User Management).
import User from "../model/userModel.js";

export const getCompanyTrn = async () => {
  const admin = await User.findOne({ isAdmin: true, trn: { $nin: ["", null] } }).select("trn");
  return admin?.trn || process.env.GIIAN_TRN_NO || "";
};