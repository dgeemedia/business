// backend/src/controllers/userController.js
const bcrypt = require('bcrypt');
const prisma = require('../lib/prisma');
const notify = require('../lib/notify');

function resolveBusinessId(req) {
  return req.businessId || req.user?.businessId || null;
}

// ============================================================================
// GET ALL USERS
// ============================================================================
async function getAllUsers(req, res) {
  const where = {};

  if (req.user.role === 'super-admin') {
    const subdomainBiz = req.businessId;
    if (subdomainBiz) where.businessId = subdomainBiz;
  } else {
    where.businessId = req.user.businessId;
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true, email: true, role: true, businessId: true,
      firstName: true, lastName: true, phone: true, active: true, createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const normalized = users.map(u => ({
    ...u,
    name:     [u.firstName, u.lastName].filter(Boolean).join(' ') || '',
    isActive: u.active,
  }));

  res.json(normalized);
}

// ============================================================================
// CREATE USER
// ============================================================================
async function createUser(req, res) {
  const { email, password, name, firstName, lastName, phone, role, businessId } = req.body;

  if (!email || !password) {
    return res.status(400).json({ ok: false, error: 'Email and password required' });
  }

  if (req.user.role === 'staff') {
    return res.status(403).json({ ok: false, error: 'Staff cannot create users' });
  }

  let first = firstName || '';
  let last  = lastName  || '';
  if (name && !firstName && !lastName) {
    const parts = name.trim().split(/\s+/);
    first = parts[0] || '';
    last  = parts.slice(1).join(' ') || '';
  }

  let assignedBusinessId;
  if (req.user.role === 'super-admin') {
    assignedBusinessId = role === 'super-admin' ? null : (businessId || resolveBusinessId(req) || null);
  } else {
    assignedBusinessId = req.user.businessId;
  }

  if (req.user.role === 'admin') {
    if (!assignedBusinessId) {
      return res.status(400).json({ ok: false, error: 'Admin must have a business assigned' });
    }
    if (role === 'super-admin') {
      return res.status(403).json({ ok: false, error: 'Admin cannot create super-admin' });
    }
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(400).json({ ok: false, error: 'User already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email, passwordHash,
      role:       role || 'staff',
      businessId: assignedBusinessId,
      firstName:  first,
      lastName:   last,
      phone:      phone || '',
      active:     true,
    },
    select: {
      id: true, email: true, role: true, businessId: true,
      firstName: true, lastName: true, phone: true, active: true,
    },
  });

  // Notify the business that a new team member was added
  if (assignedBusinessId) {
    await notify.userCreated(assignedBusinessId, email, role || 'staff');
  }

  console.log(`✅ User created: ${user.email} (${user.role}) by ${req.user.email}`);
  res.status(201).json({ ok: true, user });
}

// ============================================================================
// UPDATE USER
// ============================================================================
async function updateUser(req, res) {
  const userId = Number(req.params.id);

  const {
    password, name, firstName, lastName,
    email, role, active, isActive, phone,
  } = req.body;

  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) {
    return res.status(404).json({ ok: false, error: 'User not found' });
  }

  if (req.user.role !== 'super-admin' && targetUser.businessId !== req.user.businessId) {
    return res.status(403).json({ ok: false, error: 'You cannot manage users from another business' });
  }
  if (req.user.role === 'admin' && targetUser.role === 'super-admin') {
    return res.status(403).json({ ok: false, error: 'Admin cannot modify super-admin accounts' });
  }
  if (req.user.role === 'admin' && role === 'super-admin') {
    return res.status(403).json({ ok: false, error: 'Admin cannot promote to super-admin' });
  }

  const updateData = {};

  if (name && !firstName && !lastName) {
    const parts = name.trim().split(/\s+/);
    updateData.firstName = parts[0] || '';
    updateData.lastName  = parts.slice(1).join(' ') || '';
  } else {
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName  !== undefined) updateData.lastName  = lastName;
  }

  if (phone !== undefined) updateData.phone = phone;
  if (role  !== undefined) updateData.role  = role;

  const activeVal = active !== undefined ? active : isActive;
  if (activeVal !== undefined) updateData.active = Boolean(activeVal);

  if (password && password.trim().length > 0) {
    if (password.length < 8) {
      return res.status(400).json({ ok: false, error: 'Password must be at least 8 characters' });
    }
    updateData.passwordHash = await bcrypt.hash(password, 12);
  }

  if (Object.keys(updateData).length === 0) {
    return res.json({ ok: true, user: targetUser });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data:  updateData,
    select: {
      id: true, email: true, role: true, businessId: true,
      firstName: true, lastName: true, phone: true, active: true,
    },
  });

  console.log(`✅ User updated: ${user.email} by ${req.user.email}`);
  res.json({ ok: true, user });
}

// ============================================================================
// SUSPEND USER
// ============================================================================
async function suspendUser(req, res) {
  const userId = Number(req.params.id);

  if (userId === req.user.id) {
    return res.status(400).json({ ok: false, error: 'Cannot suspend your own account' });
  }

  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) {
    return res.status(404).json({ ok: false, error: 'User not found' });
  }

  if (req.user.role !== 'super-admin' && targetUser.businessId !== req.user.businessId) {
    return res.status(403).json({ ok: false, error: 'You cannot manage users from another business' });
  }
  if (req.user.role === 'admin' && targetUser.role === 'super-admin') {
    return res.status(403).json({ ok: false, error: 'Admin cannot suspend super-admin' });
  }
  if (req.user.role === 'staff') {
    return res.status(403).json({ ok: false, error: 'Staff cannot suspend users' });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data:  { active: false },
    select: { id: true, email: true, role: true, businessId: true, firstName: true, lastName: true, active: true },
  });

  // Notify the business that a user was suspended
  if (targetUser.businessId) {
    await notify.system(
      targetUser.businessId,
      '⚠️ Team Member Suspended',
      `${targetUser.email} has been suspended by ${req.user.email}.`
    );
  }

  console.log(`⚠️ User suspended: ${user.email} by ${req.user.email}`);
  res.json({ ok: true, message: 'User suspended', user });
}

// ============================================================================
// REACTIVATE USER
// ============================================================================
async function reactivateUser(req, res) {
  const userId = Number(req.params.id);

  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) {
    return res.status(404).json({ ok: false, error: 'User not found' });
  }

  if (req.user.role !== 'super-admin' && targetUser.businessId !== req.user.businessId) {
    return res.status(403).json({ ok: false, error: 'You cannot manage users from another business' });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data:  { active: true },
    select: { id: true, email: true, role: true, businessId: true, firstName: true, lastName: true, active: true },
  });

  // Notify the business that a user was reactivated
  if (targetUser.businessId) {
    await notify.system(
      targetUser.businessId,
      '✅ Team Member Reactivated',
      `${targetUser.email} has been reactivated and can now access the dashboard.`
    );
  }

  console.log(`✅ User reactivated: ${user.email} by ${req.user.email}`);
  res.json({ ok: true, message: 'User reactivated', user });
}

// ============================================================================
// TOGGLE (legacy — backwards compat)
// ============================================================================
async function toggleUserStatus(req, res) {
  const userId = Number(req.params.id);

  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) {
    return res.status(404).json({ ok: false, error: 'User not found' });
  }

  if (req.user.role !== 'super-admin' && targetUser.businessId !== req.user.businessId) {
    return res.status(403).json({ ok: false, error: 'Access denied' });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data:  { active: !targetUser.active },
    select: { id: true, email: true, role: true, active: true },
  });

  res.json({ ok: true, user });
}

// ============================================================================
// DELETE USER
// ============================================================================
async function deleteUser(req, res) {
  const userId = Number(req.params.id);

  if (userId === req.user.id) {
    return res.status(400).json({ ok: false, error: 'Cannot delete your own account' });
  }

  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) {
    return res.status(404).json({ ok: false, error: 'User not found' });
  }

  if (req.user.role !== 'super-admin' && targetUser.businessId !== req.user.businessId) {
    return res.status(403).json({ ok: false, error: 'You cannot manage users from another business' });
  }
  if (req.user.role === 'admin' && targetUser.role === 'super-admin') {
    return res.status(403).json({ ok: false, error: 'Admin cannot delete super-admin' });
  }
  if (req.user.role === 'staff') {
    return res.status(403).json({ ok: false, error: 'Staff cannot delete users' });
  }

  await prisma.user.delete({ where: { id: userId } });

  console.log(`🗑️ User deleted: ${targetUser.email} by ${req.user.email}`);
  res.json({ ok: true, message: 'User deleted' });
}

module.exports = {
  getAllUsers, createUser, updateUser,
  suspendUser, reactivateUser, toggleUserStatus, deleteUser,
};