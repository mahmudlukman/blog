export const sendToken = (user, statusCode, res) => {
  const token = user.getJwtToken();
  
  // Options for cookies
  const options = {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };
  
  // Only set these for production or if using HTTPS
  if (process.env.NODE_ENV === 'production') {
    options.sameSite = "none";
    options.secure = true;
  } else {
    // For development
    options.sameSite = "lax";
    options.secure = false;
  }
  
  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    user,
    token,
  });
};