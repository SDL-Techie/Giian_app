import jwt from "jsonwebtoken";
import User from "../model/userModel.js";

export const verifyUser = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.slice(7).trim();
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) return res.status(401).json({ success: false, message: "Access Denied. Login Required" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).populate("role");

    if (!req.user) return res.status(401).json({ success: false, message: "User not found" });
    if (req.user.status !== "Active") {
      return res.status(403).json({ success: false, message: "This account has been deactivated" });
    }
    if (req.user.passwordChangedAt && decoded.iat) {
      const changedAt = Math.floor(new Date(req.user.passwordChangedAt).getTime() / 1000);
      if (decoded.iat < changedAt) {
        return res.status(401).json({ success: false, message: "Password changed. Please login again." });
      }
    }
    if (!req.user.isAdmin && req.user.role && req.user.role.status !== "Active") {
      return res.status(403).json({ success: false, message: "Your assigned role is inactive" });
    }
    if (req.user.mustChangePassword) {
      const allowedWhileChanging = ["/api/v1/auth/change-password", "/api/v1/auth/me", "/api/v1/auth/logout"];
      if (!allowedWhileChanging.some((path) => req.originalUrl.startsWith(path))) {
        return res.status(403).json({ success: false, code: "PASSWORD_CHANGE_REQUIRED", message: "Password change required before continuing" });
      }
    }

    next();
  } catch (_error) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

export const isAdmin = (req, res, next) => {
  if (req.user?.isAdmin) return next();
  return res.status(403).json({ success: false, message: "Access denied. Admins only." });
};

export const authorize = (module, action) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: "Access Denied. Login Required" });
  if (req.user.isAdmin) return next();
  if (!req.user.role || req.user.role.status !== "Active") {
    return res.status(403).json({ success: false, message: "Access denied. Active role required." });
  }

  const modulePermission = req.user.role.permissions?.[module];
  if (modulePermission?.[action]) return next();

  return res.status(403).json({
    success: false,
    message: `Access denied. You do not have permission to ${action} ${module}.`,
  });
};
