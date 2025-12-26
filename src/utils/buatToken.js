const crypto = require('crypto');

// Menghasilkan token acak yang aman
exports.generateToken = () => {
  return crypto.randomBytes(32).toString('base64url');
};
