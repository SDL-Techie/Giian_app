export const passwordPolicyMessage =
  "Password must be at least 10 characters and include uppercase, lowercase, number and special character";

export const isStrongPassword = (password = "") =>
  typeof password === "string" &&
  password.length >= 10 &&
  /[a-z]/.test(password) &&
  /[A-Z]/.test(password) &&
  /\d/.test(password) &&
  /[^A-Za-z0-9]/.test(password);
