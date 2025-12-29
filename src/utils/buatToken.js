//menggunkana modul crypto bawaan Node.js
const crypto = require('crypto');

// Menghasilkan token acak yang aman
exports.buatToken = () => {
  return crypto.randomBytes(32).toString('base64url');
};
