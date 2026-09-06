import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();
const uri = process.env.DB_URL;
if (!uri) {
  console.error("DB_URL is required");
  process.exit(1);
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const output = path.resolve("backups", stamp);
fs.mkdirSync(output, { recursive: true });

const child = spawn("mongodump", ["--uri", uri, "--out", output], { stdio: "inherit" });
child.on("exit", (code) => process.exit(code ?? 1));
child.on("error", (error) => {
  console.error("Unable to start mongodump. Install MongoDB Database Tools or use Atlas automated backups.", error.message);
  process.exit(1);
});
