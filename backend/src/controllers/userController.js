// backend/src/controllers/userController.js
const bcrypt = require('bcrypt');
const prisma = require('../lib/prisma');

/**
 * Resolve businessId with consistent priority:
 *   1. req.businessId        – subdomain middleware
 *   2. req.user?.businessId  – logged-in user's own business
 */
function resolveBusinessId(req) {
  return req.businessId || req.user?.businessId || null;
}

// ============================================================================
// GET ALL USERS - WITH TENANT ISOLATION
// ============================================================================
async function getAllUsers(req, res) {
  const where = {};

  // Super-admin on a subdomain → scope to that subdomain's business.
  // Super-admin on bare localhost (no subdomain) → sees all users.
  // Admin / staff → always scoped to their own business.
  if (req.user.role === 'super-admin') {
    const subdomainBiz = req.businessId; // from subdomain middleware
    if (subdomainBiz) {
      where.businessId = subdomainBiz;
    }
    // else: no filter – intentional for the "manage all tenants" view
  } else {
    where.businessId = req.user.businessId;
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      role: true,
      businessId: true,
      firstName: true,
      lastName: true,
      phone: true,
      active: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(users);
}

// ============================================================================
// CREATE USER - WITH BUSINESS ASSIGNMENT
// ============================================================================
async function createUser(req, res) {
  const { email, password, firstName, lastName, phone, role, businessId } = req.body;

  if (!email || !password) {
    throw new Error('Email and password required');
  }

  if (req.user.role === 'staff') {
    return res.status(403).json({ ok: false, error: 'Staff cannot create users' });
  }

  // ── Determine which business the new user belongs to ─────────────────────
  let assignedBusinessId;

  if (req.user.role === 'super-admin') {
    if (role === 'super-admin') {
      assignedBusinessId = null;          // super-admins are not tied to a business
    } else {
      // Explicit body > subdomain > null
      assignedBusinessId = businessId || resolveBusinessId(req) || null;
    }
  } else {
    // Admin: always assign to their own business
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
    throw new Error('User already exists');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role:       role || 'staff',
      businessId: assignedBusinessId,
      firstName:  firstName || '',
      lastName:   lastName  || '',
      phone:      phone     || '',
      active:     true,
    },
    select: {
      id: true, email: true, role: true, businessId: true,
      firstName: true, lastName: true, phone: true, active: true,
    },
  });

  console.log(`✅ User created: ${user.email} (${user.role}) by ${req.user.email} – Business: ${assignedBusinessId || 'none'}`);
  res.status(201).json({ ok: true, user });
}

// ============================================================================
// UPDATE USER - WITH TENANT SECURITY
// ============================================================================
async function updateUser(req, res) {
  const userId = Number(req.params.id);
  const { role, active, ...otherUpdates } = req.body;

  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) {
    return res.status(404).json({ ok: false, error: 'User not found' });
  }

  // Tenant check: non-super-admin can only touch users in their own business
  if (req.user.role !== 'super-admin' && targetUser.businessId !== req.user.businessId) {
    return res.status(403).json({ ok: false, error: 'You cannot manage users from another business' });
  }

  if (req.user.role === 'admin' && targetUser.role === 'super-admin') {
    return res.status(403).json({ ok: false, error: 'Admin cannot modify super-admin accounts' });
  }
  if (req.user.role === 'admin' && role === 'super-admin') {
    return res.status(403).json({ ok: false, error: 'Admin cannot create or promote to super-admin' });
  }

  const updateData = { ...otherUpdates };
  if (role   !== undefined) updateData.role   = role;
  if (active !== undefined) updateData.active = active;

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
    select: {
      id: true, email: true, role: true, businessId: true,
      firstName: true, lastName: true, active: true,
    },
  });

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
    select: {
      id: true, email: true, role: true, businessId: true,
      firstName: true, lastName: true, active: true,
    },
  });

  console.log(`✅ User reactivated: ${user.email} by ${req.user.email}`);
  res.json({ ok: true, message: 'User reactivated', user });
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
  getAllUsers,
  createUser,
  updateUser,
  suspendUser,
  reactivateUser,
  deleteUser,
};