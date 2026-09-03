import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const data = await mongoose.connect("mongodb://localhost:27017/salesmanagement", {
      serverSelectionTimeoutMS: 8000,
    });
    console.log("db connected in your", data.connection.host);
  } catch (err) {
    console.log("MongoDB connection error:", err.message);
    process.exit(1);
  }
};
