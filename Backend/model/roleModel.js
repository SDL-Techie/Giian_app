import mongoose from "mongoose";

// A single module permission block: create / view / modify checkboxes,
// mirroring the checkboxes shown in the "Create Role" wireframe.
const modulePermissionSchema = new mongoose.Schema(
  {
    create: { type: Boolean, default: false },
    view: { type: Boolean, default: false },
    modify: { type: Boolean, default: false },
    report: { type: Boolean, default: false },
  },
  { _id: false }
);

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Role name is required"],
      trim: true,
      unique: true,
    },
    // Reserved system role - cannot be deleted / edited by non super-admins.
    isSystem: {
      type: Boolean,
      default: false,
    },
    permissions: {
      customers: { type: modulePermissionSchema, default: () => ({}) },
      products: { type: modulePermissionSchema, default: () => ({}) },
      purchase: { type: modulePermissionSchema, default: () => ({}) },
      sales: { type: modulePermissionSchema, default: () => ({}) },
      quotations: { type: modulePermissionSchema, default: () => ({}) },
      receipts: { type: modulePermissionSchema, default: () => ({}) },
      users: { type: modulePermissionSchema, default: () => ({}) },
      vat: { type: modulePermissionSchema, default: () => ({}) },
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const Role = mongoose.model("Role", roleSchema);
export default Role;
