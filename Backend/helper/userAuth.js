import jwt from "jsonwebtoken";
import User from "../model/userModel.js";

// Verifies the JWT (from the Authorization header or the httpOnly cookie),
// loads the authenticated user onto req.user, and blocks deactivated accounts.
export const verifyUser = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access Denied. Login Required",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id).populate("role");

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if (req.user.status === "Inactive") {
      return res.status(403).json({
        success: false,
        message: "This account has been deactivated",
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

// Restricts a route to the super admin only (User Management screens
// in the PDF are gated with "Enable only ADMIN").
export const isAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: "Access denied. Admins only.",
  });
};

// Grants access if the user is the super admin OR their assigned Role
// has the requested permission for the given module.
// Usage: authorize("customers", "create")
export const authorize = (module, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Access Denied. Login Required",
      });
    }

    if (req.user.isAdmin) {
      return next();
    }

    const permissions = req.user.role && req.user.role.permissions;
    const modulePermission = permissions && permissions[module];

    if (modulePermission && modulePermission[action]) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Access denied. You do not have permission to ${action} ${module}.`,
    });
  };
};
