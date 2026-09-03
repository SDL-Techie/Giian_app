export const sendToken = (user, statusCode, res) => {
  const token = user.getJWTToken();
  const userObject = user.toObject();
  delete userObject.password;

  const cookieDays = parseInt(process.env.EXPIRE_COOKIE, 10) || 7;
  const options = {
    expires: new Date(Date.now() + cookieDays * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  };

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    user: userObject,
    token,
  });
};
