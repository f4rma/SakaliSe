const crypto = require('crypto');

exports.generateToken = () => {
  // Generate cryptographically secure random token
  const randomBytes = crypto.randomBytes(32);
  const token = randomBytes.toString('base64url'); // URL-safe base64
  return token;
};