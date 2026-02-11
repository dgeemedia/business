// backend/src/config/constants.js
module.exports = {
  JWT: {
    SECRET: process.env.JWT_SECRET,
    EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  },
  BCRYPT: {
    SALT_ROUNDS: 12,
  },
  ROLES: {
    SUPER_ADMIN: 'super-admin',
    STAFF: 'staff',
  },
};