const JWT  = require('jsonwebtoken');
const secret = "123@123"

// Function to create a JWT token for a user
// This function takes a user object, extracts relevant information, and generates a token
function createToken(user){
  const payload = {
    _id: user._id,
    email: user.email,
    profileImageURL: user.profileImageURL,
    role: user.role
  };
  const token = JWT.sign(payload, secret, { expiresIn: '1h' });
  return token;
}

// Function to validate a JWT token 
// This function verifies the token and returns the decoded payload if valid, or null if invalid
function validateToken(token) {
  try {
    const payload = JWT.verify(token, secret);
    return payload; // Return the decoded payload if the token is valid
  } 
  catch (error) {
    console.error('Invalid token:', error);
    return null; // Return null if the token is invalid
  }
}

module.exports = {
  createToken,
  validateToken
};