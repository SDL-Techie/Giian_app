// import mongoose from "mongoose";
// import bcryptjs from "bcryptjs";
// import jwt from "jsonwebtoken";

// const userSchema = new mongoose.Schema(
//   {
//     name: { type: String, required: [true, "Name is required"], trim: true },
//     email: {
//       type: String,
//       required: [true, "Email is required"],
//       unique: true,
//       lowercase: true,
//       trim: true,
//       match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
//     },
//     phoneno: { type: String, trim: true },
//     password: {
//       type: String,
//       required: true,
//       minlength: [10, "Password must be at least 10 characters"],
//       select: false,
//     },
//     isAdmin: { type: Boolean, default: false },
//     role: { type: mongoose.Schema.Types.ObjectId, ref: "Role", default: null },
//     status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
//     mustChangePassword: { type: Boolean, default: false },
//     passwordChangedAt: { type: Date },
//     createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//   },
//   { timestamps: true }
// );

// userSchema.index({ status: 1, createdAt: -1 });
// userSchema.index({ role: 1, status: 1 });

// userSchema.pre("save", async function () {
//   if (!this.isModified("password")) return;
//   this.password = await bcryptjs.hash(this.password, 12);
//   this.passwordChangedAt = new Date();
// });

// userSchema.methods.getJWTToken = function () {
//   return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
//     expiresIn: process.env.JWT_EXPIRE || "30m",
//   });
// };

// userSchema.methods.comparePassword = async function (enteredPassword) {
//   return bcryptjs.compare(enteredPassword, this.password);
// };

// const User = mongoose.model("User", userSchema);
// export default User;


import mongoose from "mongoose";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    phoneno: { type: String, trim: true },
    password: {
      type: String,
      required: true,
      minlength: [10, "Password must be at least 10 characters"],
      select: false,
    },
    isAdmin: { type: Boolean, default: false },
    role: { type: mongoose.Schema.Types.ObjectId, ref: "Role", default: null },
    esignUrl: { type: String },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    mustChangePassword: { type: Boolean, default: false },
    passwordChangedAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

userSchema.index({ status: 1, createdAt: -1 });
userSchema.index({ role: 1, status: 1 });

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcryptjs.hash(this.password, 12);
  this.passwordChangedAt = new Date();
});

userSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "30m",
  });
};

userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcryptjs.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;