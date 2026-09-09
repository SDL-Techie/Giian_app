import Role from "../model/roleModel.js";
import { isValidObjectId } from "../utils/validators.js";

// @desc   Create a role with the module permission matrix from the wireframe
// @route  POST /api/v1/roles
export const createRole = async (req, res, next) => {
  try {
    const { name, permissions } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Name of the role is required" });
    }

    const existing = await Role.findOne({ name });
    if (existing) {
      return res.status(409).json({ success: false, message: "A role with this name already exists" });
    }

    const role = await Role.create({
      name,
      permissions,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, message: "Role created successfully", data: role });
  } catch (err) {
    next(err);
  }
};

// @desc   List all roles
// @route  GET /api/v1/roles
export const getAllRoles = async (req, res, next) => {
  try {
    const roles = await Role.find();
    res.status(200).json({ success: true, message: "Roles fetched", data: roles });
  } catch (err) {
    next(err);
  }
};

// @desc   Get a single role
// @route  GET /api/v1/roles/:id
export const getRoleById = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid role id" });
    }
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ success: false, message: "Role not found" });
    }
    res.status(200).json({ success: true, message: "Role fetched", data: role });
  } catch (err) {
    next(err);
  }
};

// @desc   Update a role's name / permissions
// @route  PUT /api/v1/roles/:id
export const updateRole = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid role id" });
    }
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ success: false, message: "Role not found" });
    }
    if (role.isSystem) {
      return res.status(403).json({ success: false, message: "System roles cannot be modified" });
    }

    const { name, permissions, status } = req.body;
    if (name) role.name = name;
    if (permissions) role.permissions = { ...role.permissions.toObject(), ...permissions };
    if (status) {
      if (!["Active", "Inactive"].includes(status)) {
        return res.status(400).json({ success: false, message: "Status must be Active or Inactive" });
      }
      role.status = status;
    }

    await role.save();

    res.status(200).json({ success: true, message: "Role updated successfully", data: role });
  } catch (err) {
    next(err);
  }
};

// @desc   Delete a role
// @route  DELETE /api/v1/roles/:id
export const deleteRole = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid role id" });
    }
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ success: false, message: "Role not found" });
    }
    if (role.isSystem) {
      return res.status(403).json({ success: false, message: "System roles cannot be deleted" });
    }
    role.status = "Inactive";
    await role.save();
    res.status(200).json({ success: true, message: "Role deactivated successfully", data: role });
  } catch (err) {
    next(err);
  }
};


