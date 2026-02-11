// backend/src/controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

async function login(req, res) {
  const { email, password } = req.body;

  // Fetch user with business relationship
  const user = await prisma.user.findUnique({ 
    where: { email },
    include: { business: true }
  });
  
  if (!user || !user.active) {
    throw new Error('Invalid credentials');
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new Error('Invalid credentials');
  }

  // ✅ NEW: Prevent admin/staff from logging into wrong subdomain
  if (user.role !== 'super-admin' && user.businessId) {
    const currentSubdomainBusinessId = req.businessId; // From subdomain middleware
    
    if (currentSubdomainBusinessId && currentSubdomainBusinessId !== user.businessId) {
      const userBusiness = await prisma.business.findUnique({
        where: { id: user.businessId },
        select: { slug: true, businessName: true }
      });
      
      return res.status(403).json({
        ok: false,
        error: `Access denied. Please log in at ${userBusiness.slug}.localhost:3000 (${userBusiness.businessName})`
      });
    }
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  // Include businessId in JWT token
  const token = jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      businessId: user.businessId
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    ok: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      businessId: user.businessId,
      firstName: user.firstName,
      lastName: user.lastName,
    },
  });
}

async function getCurrentUser(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      role: true,
      businessId: true,
      firstName: true,
      lastName: true,
      phone: true,
      active: true,
      lastLogin: true,
      createdAt: true,
    },
  });

  res.json({ user });
}

async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Current password and new password are required' 
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Password must be at least 8 characters' 
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({ 
        ok: false, 
        error: 'User not found' 
      });
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Current password is incorrect' 
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash },
    });

    console.log(`✅ Password changed successfully for user: ${user.email}`);

    res.json({ 
      ok: true, 
      message: 'Password updated successfully' 
    });
  } catch (error) {
    console.error('❌ Password change error:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to change password' 
    });
  }
}

module.exports = {
  login,
  getCurrentUser,
  changePassword,
};