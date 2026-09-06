import User from "../model/userModel.js";
import { isValidEmail } from "../utils/validators.js";
import { isStrongPassword, passwordPolicyMessage } from "../utils/passwordPolicy.js";
import { logger } from "../utils/logger.js";

export const ensureBootstrapAdmin = async () => {
  const existingAdmin = await User.findOne({ isAdmin: true });
  if (existingAdmin) {
    logger.info("Bootstrap admin check complete", { adminExists: true });
    return;
  }

  const name = process.env.BOOTSTRAP_ADMIN_NAME;
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;

  if (!name || !email || !password) {
    const message = "No admin exists. Set BOOTSTRAP_ADMIN_NAME, BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD.";
    if (process.env.NODE_ENV === "production") throw new Error(message);
    logger.warn(message);
    return;
  }

  if (!isValidEmail(email)) throw new Error("BOOTSTRAP_ADMIN_EMAIL is invalid");
  if (!isStrongPassword(password)) throw new Error(`BOOTSTRAP_ADMIN_PASSWORD: ${passwordPolicyMessage}`);

  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    existingEmail.isAdmin = true;
    existingEmail.status = "Active";
    existingEmail.mustChangePassword = true;
    existingEmail.password = password;
    await existingEmail.save();
    logger.warn("Existing bootstrap email promoted to admin; password reset and change required", { email });
    return;
  }

  await User.create({
    name,
    email,
    password,
    isAdmin: true,
    status: "Active",
    mustChangePassword: true,
  });

  logger.info("Bootstrap admin created; change its password immediately after first login", { email });
};
