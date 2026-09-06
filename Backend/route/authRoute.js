import express from "express";
import {
  publicRegistrationDisabled,
  loginUser,
  logoutUser,
  getMyProfile,
  updateMyProfile,
  changePassword,
} from "../controller/userController.js";
import { verifyUser } from "../helper/userAuth.js";

const router = express.Router();

router.post("/register", publicRegistrationDisabled);
router.post("/login", loginUser);
router.post("/logout", verifyUser, logoutUser);
router.get("/me", verifyUser, getMyProfile);
router.put("/me", verifyUser, updateMyProfile);
router.put("/change-password", verifyUser, changePassword);

export default router;
