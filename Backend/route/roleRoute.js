import express from "express";
import {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
} from "../controller/roleController.js";
import { verifyUser, isAdmin } from "../helper/userAuth.js";

const router = express.Router();

router.use(verifyUser, isAdmin);

router.route("/").get(getAllRoles).post(createRole);
router.route("/:id").get(getRoleById).put(updateRole).delete(deleteRole);

export default router;
