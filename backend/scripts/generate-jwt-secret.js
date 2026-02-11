// backend/scripts/generate-jwt-secret.js
const crypto = require('crypto');

// Generate a 256-bit (32 bytes) random secret
const secret = crypto.randomBytes(32).toString('hex');

console.log('Your new JWT secret:', secret);
