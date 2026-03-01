// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // ✅ Normalize role to lowercase so all checks work consistently
    req.user = { ...decoded, role: decoded.role?.toLowerCase() };
    req.businessId = decoded.businessId || null;
    
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireSuperAdmin(req, res, next) {
  if (req.user.role?.toLowerCase() !== 'super-admin') {
    return res.status(403).json({ error: 'Forbidden: Super admin access required' });
  }
  next();
}

function requireAdmin(req, res, next) {
  const role = req.user.role?.toLowerCase();
  if (role !== 'super-admin' && role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  next();
}

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