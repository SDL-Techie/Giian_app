// import User from "../model/userModel.js";
// import Role from "../model/roleModel.js";
// import { sendToken } from "../helper/jwtToken.js";
// import { isValidEmail, isValidObjectId } from "../utils/validators.js";
// import { isStrongPassword, passwordPolicyMessage } from "../utils/passwordPolicy.js";

// // @desc   Public self-registration is intentionally disabled in production.
// export const publicRegistrationDisabled = async (_req, res) => {
//   return res.status(403).json({
//     success: false,
//     message: "Public registration is disabled. Users must be created by an administrator.",
//   });
// };

// // @desc   Create a staff user (admin-only via /api/v1/users)
// export const createUser = async (req, res, next) => {
//   try {
//     const { name, email, phoneno, password, roleId } = req.body;

//     if (!name || !email || !password) {
//       return res.status(400).json({ success: false, message: "Name, email and password are required" });
//     }
//     if (!isValidEmail(email)) {
//       return res.status(400).json({ success: false, message: "Invalid email format" });
//     }
//     if (!isStrongPassword(password)) {
//       return res.status(400).json({ success: false, message: passwordPolicyMessage });
//     }

//     const normalizedEmail = email.toLowerCase().trim();
//     if (await User.exists({ email: normalizedEmail })) {
//       return res.status(409).json({ success: false, message: "Email already registered" });
//     }

//     let role = null;
//     if (roleId) {
//       if (!isValidObjectId(roleId)) {
//         return res.status(400).json({ success: false, message: "Invalid role id" });
//       }
//       role = await Role.findById(roleId);
//       if (!role) return res.status(404).json({ success: false, message: "Role not found" });
//       if (role.status !== "Active") {
//         return res.status(400).json({ success: false, message: "Cannot assign an inactive role" });
//       }
//     }

//     const user = await User.create({
//       name: name.trim(),
//       email: normalizedEmail,
//       phoneno,
//       password,
//       isAdmin: false,
//       role: role?._id || null,
//       status: "Active",
//       mustChangePassword: true,
//       createdBy: req.user._id,
//     });

//     const safeUser = await User.findById(user._id).populate("role");
//     res.status(201).json({ success: true, message: "User created successfully", data: safeUser });
//   } catch (err) {
//     next(err);
//   }
// };

// // @desc   Login
// // @route  POST /api/v1/auth/login
// export const loginUser = async (req, res, next) => {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Email and password are required" });
//     }

//     const user = await User.findOne({ email: email.toLowerCase() })
//       .select("+password")
//       .populate("role");

//     if (!user) {
//       return res.status(401).json({ success: false, message: "Invalid email or password" });
//     }

//     if (user.status === "Inactive") {
//       return res.status(403).json({ success: false, message: "This account has been deactivated" });
//     }
//     if (!user.isAdmin && user.role && user.role.status !== "Active") {
//       return res.status(403).json({ success: false, message: "Your assigned role is inactive" });
//     }

//     const isMatch = await user.comparePassword(password);
//     if (!isMatch) {
//       return res.status(401).json({ success: false, message: "Invalid email or password" });
//     }

//     sendToken(user, 200, res);
//   } catch (err) {
//     next(err);
//   }
// };

// // @desc   Logout
// // @route  GET /api/v1/auth/logout
// export const logoutUser = async (req, res, next) => {
//   try {
//     res
//       .status(200)
//       .cookie("token", "", { expires: new Date(0), httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: process.env.COOKIE_SAME_SITE || (process.env.NODE_ENV === "production" ? "strict" : "lax"), path: "/" })
//       .json({ success: true, message: "Logged out successfully" });
//   } catch (err) {
//     next(err);
//   }
// };

// // @desc   Get my profile
// // @route  GET /api/v1/auth/me
// export const getMyProfile = async (req, res, next) => {
//   try {
//     const user = await User.findById(req.user._id).populate("role");
//     res.status(200).json({ success: true, message: "Profile fetched", data: user });
//   } catch (err) {
//     next(err);
//   }
// };

// // @desc   Update my profile (name / phone / email) - the wireframe allows the logged-in
// //         user to view & change their own details and password.
// // @route  PUT /api/v1/auth/me
// export const updateMyProfile = async (req, res, next) => {
//   try {
//     const { name, phoneno, email } = req.body;
//     const updates = {};
//     if (name) updates.name = name;
//     if (phoneno) updates.phoneno = phoneno;
//     if (email) {
//       if (!isValidEmail(email)) {
//         return res.status(400).json({ success: false, message: "Invalid email format" });
//       }
//       updates.email = email.toLowerCase();
//     }

//     const user = await User.findByIdAndUpdate(req.user._id, updates, {
//       returnDocument: 'after',
//       runValidators: true,
//     });

//     res.status(200).json({ success: true, message: "Profile updated successfully", data: user });
//   } catch (err) {
//     next(err);
//   }
// };

// // @desc   Change my own password
// // @route  PUT /api/v1/auth/change-password
// export const changePassword = async (req, res, next) => {
//   try {
//     const { currentPassword, newPassword } = req.body;

//     if (!currentPassword || !newPassword) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Current and new password are required" });
//     }
//     if (!isStrongPassword(newPassword)) {
//       return res.status(400).json({ success: false, message: passwordPolicyMessage });
//     }

//     const user = await User.findById(req.user._id).select("+password");
//     const isMatch = await user.comparePassword(currentPassword);
//     if (!isMatch) {
//       return res.status(401).json({ success: false, message: "Current password is incorrect" });
//     }

//     user.password = newPassword;
//     user.mustChangePassword = false;
//     await user.save();

//     res.status(200).json({ success: true, message: "Password changed successfully" });
//   } catch (err) {
//     next(err);
//   }
// };

// // ---------- Admin-only User Management (PDF: "User Management - ENABLE ONLY ADMIN") ----------

// // @desc   List all users (admin)
// // @route  GET /api/v1/users
// export const getAllUsers = async (req, res, next) => {
//   try {
//     const users = await User.find().populate("role", "name");
//     res.status(200).json({ success: true, message: "Users fetched", data: users });
//   } catch (err) {
//     next(err);
//   }
// };

// // @desc   Get a single user by id (admin)
// // @route  GET /api/v1/users/:id
// export const getUserById = async (req, res, next) => {
//   try {
//     if (!isValidObjectId(req.params.id)) {
//       return res.status(400).json({ success: false, message: "Invalid user id" });
//     }
//     const user = await User.findById(req.params.id).populate("role");
//     if (!user) {
//       return res.status(404).json({ success: false, message: "User not found" });
//     }
//     res.status(200).json({ success: true, message: "User fetched", data: user });
//   } catch (err) {
//     next(err);
//   }
// };

// // @desc   Modify user details / role (admin) - "Modify Users: change details"
// // @route  PUT /api/v1/users/:id
// export const updateUserDetails = async (req, res, next) => {
//   try {
//     if (!isValidObjectId(req.params.id)) {
//       return res.status(400).json({ success: false, message: "Invalid user id" });
//     }

//     const { name, phoneno, email, roleId } = req.body;
//     const updates = {};
//     if (name) updates.name = name;
//     if (phoneno) updates.phoneno = phoneno;
//     if (email) {
//       if (!isValidEmail(email)) {
//         return res.status(400).json({ success: false, message: "Invalid email format" });
//       }
//       updates.email = email.toLowerCase();
//     }
//     if (roleId !== undefined) {
//       if (roleId && !isValidObjectId(roleId)) {
//         return res.status(400).json({ success: false, message: "Invalid role id" });
//       }
//       if (roleId) {
//         const role = await Role.findById(roleId);
//         if (!role) return res.status(404).json({ success: false, message: "Role not found" });
//         if (role.status !== "Active") return res.status(400).json({ success: false, message: "Cannot assign an inactive role" });
//       }
//       updates.role = roleId || null;
//     }

//     const user = await User.findByIdAndUpdate(req.params.id, updates, {
//       returnDocument: 'after',
//       runValidators: true,
//     }).populate("role");

//     if (!user) {
//       return res.status(404).json({ success: false, message: "User not found" });
//     }

//     res.status(200).json({ success: true, message: "User updated successfully", data: user });
//   } catch (err) {
//     next(err);
//   }
// };

// // @desc   Admin resets a user's password - "Modify Users: change password"
// // @route  PUT /api/v1/users/:id/reset-password
// export const resetUserPassword = async (req, res, next) => {
//   try {
//     if (!isValidObjectId(req.params.id)) {
//       return res.status(400).json({ success: false, message: "Invalid user id" });
//     }
//     const { newPassword } = req.body;
//     if (!isStrongPassword(newPassword)) {
//       return res.status(400).json({ success: false, message: passwordPolicyMessage });
//     }

//     const user = await User.findById(req.params.id);
//     if (!user) {
//       return res.status(404).json({ success: false, message: "User not found" });
//     }

//     user.password = newPassword;
//     user.mustChangePassword = true;
//     await user.save();

//     res.status(200).json({ success: true, message: "Password reset successfully" });
//   } catch (err) {
//     next(err);
//   }
// };

// // @desc   Deactivate / reactivate a user - "Modify Users: deactivate"
// // @route  PUT /api/v1/users/:id/status
// export const setUserStatus = async (req, res, next) => {
//   try {
//     if (!isValidObjectId(req.params.id)) {
//       return res.status(400).json({ success: false, message: "Invalid user id" });
//     }
//     const { status } = req.body;
//     if (!["Active", "Inactive"].includes(status)) {
//       return res.status(400).json({ success: false, message: "Status must be Active or Inactive" });
//     }

//     if (String(req.params.id) === String(req.user._id)) {
//       return res
//         .status(400)
//         .json({ success: false, message: "You cannot change your own account status" });
//     }

//     const user = await User.findByIdAndUpdate(req.params.id, { status }, { returnDocument: 'after' });
//     if (!user) {
//       return res.status(404).json({ success: false, message: "User not found" });
//     }

//     res.status(200).json({ success: true, message: `User ${status.toLowerCase()}d successfully`, data: user });
//   } catch (err) {
//     next(err);
//   }
// };




import User from "../model/userModel.js";
import Role from "../model/roleModel.js";
import { sendToken } from "../helper/jwtToken.js";
import { isValidEmail, isValidObjectId } from "../utils/validators.js";
import { isStrongPassword, passwordPolicyMessage } from "../utils/passwordPolicy.js";
import { uploadImageToCloudinary } from "../utils/cloudinary.js";

const esignUrl = async (file) => file ? (await uploadImageToCloudinary(file, "giian/esigns")).secure_url : undefined;

// @desc   Public self-registration is intentionally disabled in production.
export const publicRegistrationDisabled = async (_req, res) => {
  return res.status(403).json({
    success: false,
    message: "Public registration is disabled. Users must be created by an administrator.",
  });
};

// @desc   Create a staff user (admin-only via /api/v1/users)
export const createUser = async (req, res, next) => {
  try {
    const { name, email, phoneno, password, roleId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email and password are required" });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format" });
    }
    if (!isStrongPassword(password)) {
      return res.status(400).json({ success: false, message: passwordPolicyMessage });
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (await User.exists({ email: normalizedEmail })) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    let role = null;
    if (roleId) {
      if (!isValidObjectId(roleId)) {
        return res.status(400).json({ success: false, message: "Invalid role id" });
      }
      role = await Role.findById(roleId);
      if (!role) return res.status(404).json({ success: false, message: "Role not found" });
      if (role.status !== "Active") {
        return res.status(400).json({ success: false, message: "Cannot assign an inactive role" });
      }
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phoneno,
      password,
      isAdmin: false,
      role: role?._id || null,
      esignUrl: await esignUrl(req.file),
      status: "Active",
      mustChangePassword: true,
      createdBy: req.user._id,
    });

    const safeUser = await User.findById(user._id).populate("role");
    res.status(201).json({ success: true, message: "User created successfully", data: safeUser });
  } catch (err) {
    next(err);
  }
};

// @desc   Login
// @route  POST /api/v1/auth/login
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() })
      .select("+password")
      .populate("role");

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    if (user.status === "Inactive") {
      return res.status(403).json({ success: false, message: "This account has been deactivated" });
    }
    if (!user.isAdmin && user.role && user.role.status !== "Active") {
      return res.status(403).json({ success: false, message: "Your assigned role is inactive" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    sendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc   Logout
// @route  GET /api/v1/auth/logout
export const logoutUser = async (req, res, next) => {
  try {
    res
      .status(200)
      .cookie("token", "", { expires: new Date(0), httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: process.env.COOKIE_SAME_SITE || (process.env.NODE_ENV === "production" ? "strict" : "lax"), path: "/" })
      .json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
};

// @desc   Get my profile
// @route  GET /api/v1/auth/me
export const getMyProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate("role");
    res.status(200).json({ success: true, message: "Profile fetched", data: user });
  } catch (err) {
    next(err);
  }
};

// @desc   Update my profile (name / phone / email) - the wireframe allows the logged-in
//         user to view & change their own details and password.
// @route  PUT /api/v1/auth/me
export const updateMyProfile = async (req, res, next) => {
  try {
    const { name, phoneno, email } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (phoneno) updates.phoneno = phoneno;
    if (email) {
      if (!isValidEmail(email)) {
        return res.status(400).json({ success: false, message: "Invalid email format" });
      }
      updates.email = email.toLowerCase();
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      returnDocument: 'after',
      runValidators: true,
    });

    res.status(200).json({ success: true, message: "Profile updated successfully", data: user });
  } catch (err) {
    next(err);
  }
};

// @desc   Change my own password
// @route  PUT /api/v1/auth/change-password
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Current and new password are required" });
    }
    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({ success: false, message: passwordPolicyMessage });
    }

    const user = await User.findById(req.user._id).select("+password");
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Current password is incorrect" });
    }

    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();

    res.status(200).json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    next(err);
  }
};

// ---------- Admin-only User Management (PDF: "User Management - ENABLE ONLY ADMIN") ----------

// @desc   List all users (admin)
// @route  GET /api/v1/users
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().populate("role", "name");
    res.status(200).json({ success: true, message: "Users fetched", data: users });
  } catch (err) {
    next(err);
  }
};

// @desc   Get a single user by id (admin)
// @route  GET /api/v1/users/:id
export const getUserById = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid user id" });
    }
    const user = await User.findById(req.params.id).populate("role");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, message: "User fetched", data: user });
  } catch (err) {
    next(err);
  }
};

// @desc   Modify user details / role / e-sign (admin) - "Modify Users: change details"
// @route  PUT /api/v1/users/:id
export const updateUserDetails = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid user id" });
    }

    const { name, phoneno, email, roleId } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (phoneno) updates.phoneno = phoneno;
    if (email) {
      if (!isValidEmail(email)) {
        return res.status(400).json({ success: false, message: "Invalid email format" });
      }
      updates.email = email.toLowerCase();
    }
    if (roleId !== undefined) {
      if (roleId && !isValidObjectId(roleId)) {
        return res.status(400).json({ success: false, message: "Invalid role id" });
      }
      if (roleId) {
        const role = await Role.findById(roleId);
        if (!role) return res.status(404).json({ success: false, message: "Role not found" });
        if (role.status !== "Active") return res.status(400).json({ success: false, message: "Cannot assign an inactive role" });
      }
      updates.role = roleId || null;
    }
    if (req.file) updates.esignUrl = await esignUrl(req.file);

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      returnDocument: 'after',
      runValidators: true,
    }).populate("role");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, message: "User updated successfully", data: user });
  } catch (err) {
    next(err);
  }
};

// @desc   Admin resets a user's password - "Modify Users: change password"
// @route  PUT /api/v1/users/:id/reset-password
export const resetUserPassword = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid user id" });
    }
    const { newPassword } = req.body;
    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({ success: false, message: passwordPolicyMessage });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.password = newPassword;
    user.mustChangePassword = true;
    await user.save();

    res.status(200).json({ success: true, message: "Password reset successfully" });
  } catch (err) {
    next(err);
  }
};

// @desc   Deactivate / reactivate a user - "Modify Users: deactivate"
// @route  PUT /api/v1/users/:id/status
export const setUserStatus = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid user id" });
    }
    const { status } = req.body;
    if (!["Active", "Inactive"].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be Active or Inactive" });
    }

    if (String(req.params.id) === String(req.user._id)) {
      return res
        .status(400)
        .json({ success: false, message: "You cannot change your own account status" });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { status }, { returnDocument: 'after' });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, message: `User ${status.toLowerCase()}d successfully`, data: user });
  } catch (err) {
    next(err);
  }
};