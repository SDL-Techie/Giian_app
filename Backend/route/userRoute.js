import express from "express";
import {
  createUser,
  getAllUsers,
  getUserById,
  updateUserDetails,
  resetUserPassword,
  setUserStatus,
} from "../controller/userController.js";
import { verifyUser, isAdmin } from "../helper/userAuth.js";

const router = express.Router();

// Every route below is gated to admins only, matching
// "USER MANAGEMENT - ENABLE ONLY ADMIN" in the wireframe.
router.use(verifyUser, isAdmin);

router.route("/").get(getAllUsers).post(createUser);
router.route("/:id").get(getUserById).put(updateUserDetails);
router.put("/:id/reset-password", resetUserPassword);
router.put("/:id/status", setUserStatus);

export default router;
