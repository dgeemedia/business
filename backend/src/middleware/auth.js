// backend/src/middleware/auth.js (UPDATED)
const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireSuperAdmin(req, res, next) {
  if (req.user.role !== 'super-admin') {
    return res.status(403).json({ error: 'Forbidden: Super admin access required' });
  }
  next();
}

// NEW: Middleware to allow both super-admin and admin
function requireAdmin(req, res, next) {
  if (req.user.role !== 'super-admin' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  next();
}

// NEW: Middleware to prevent staff from accessing certain routes
function preventStaff(req, res, next) {
  if (req.user.role === 'staff') {
    return res.status(403).json({ error: 'Forbidden: Staff cannot access this resource' });
  }
  next();
}

module.exports = { 
  authMiddleware, 
  requireSuperAdmin, 
  requireAdmin,
  preventStaff
};