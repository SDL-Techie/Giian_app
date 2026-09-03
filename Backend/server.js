// CRITICAL: Load environment variables FIRST before anything else.
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import { connectDB } from "./config/db.js";
import app from "./app.js";

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
  });
};

startServer();

process.on("unhandledRejection", (err) => {
  console.log(`Unhandled Rejection: ${err.message}`);
});
