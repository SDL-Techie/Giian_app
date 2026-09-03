import express from "express";
import {
  createUser,
  loginUser,
  logoutUser,
  getMyProfile,
  updateMyProfile,
  changePassword,
} from "../controller/userController.js";
import { verifyUser } from "../helper/userAuth.js";

const router = express.Router();

router.post("/register", createUser);
router.post("/login", loginUser);
router.get("/logout", logoutUser);
router.get("/me", verifyUser, getMyProfile);
router.put("/me", verifyUser, updateMyProfile);
router.put("/change-password", verifyUser, changePassword);

export default router;
