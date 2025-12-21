const crypto = require('crypto');

exports.generateToken = () => {
  return crypto.randomBytes(32).toString('base64url');
};
