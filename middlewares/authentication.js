const { validateToken } = require("../services/authentication");
const User = require('../models/user');

function checkForAuthenticationCookie(cookieName) {
  return async (req, res, next) => {
    const tokenCookieValue = req.cookies[cookieName];
    
    if (!tokenCookieValue) {
      return next();
    }
    try {
      const payload = validateToken(tokenCookieValue); 

      if (payload && payload._id) {
        const user = await User.findById(payload._id);
        
        if (user) {
          req.user = user; // Set the full user object on the request
        }
      }
    } catch (error) {
      console.error('Token validation failed:', error);
    }
    next();
  };
}

module.exports = {
  checkForAuthenticationCookie
};
