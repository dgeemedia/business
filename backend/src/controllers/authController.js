// backend/src/controllers/authController.js
const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const prisma = require('../lib/prisma');

// ============================================================================
// LOGIN
// ============================================================================
// ✅ REWRITTEN: Removed ALL subdomain-based access gating.
//
// OLD behaviour (broken with path-based routing):
//   - Read req.businessId from subdomain middleware
//   - If no subdomain (isMainDomain = true) → block non-super-admins
//   - If subdomain present → check user's businessId matches
//
// NEW behaviour (works with path-based routing):
//   - Verify credentials
//   - Route by role only: super-admin → their panel, everyone else → /dashboard
//   - Business context comes from the user's own businessId in the DB
//   - No subdomain needed at login time
// ============================================================================
async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ ok: false, error: 'Email and password are required' });
  }

  // ── 1. Find user ──────────────────────────────────────────────────────────
  const user = await prisma.user.findUnique({
    where:   { email },
    include: { business: { select: { id: true, slug: true, businessName: true, isActive: true } } },
  });

  if (!user || !user.active) {
    return res.status(401).json({ ok: false, error: 'Invalid credentials' });
  }

  // ── 2. Check password ─────────────────────────────────────────────────────
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ ok: false, error: 'Invalid credentials' });
  }

  // ── 3. For non-super-admins, ensure their business exists and is active ───
  if (user.role !== 'super-admin') {
    if (!user.businessId || !user.business) {
      return res.status(403).json({
        ok:    false,
        error: 'Your account is not associated with any business. Contact support.',
      });
    }

    if (!user.business.isActive) {
      return res.status(403).json({
        ok:    false,
        error: 'Your business account has been suspended. Contact support.',
      });
    }
  }

  // ── 4. Record last login ──────────────────────────────────────────────────
  await prisma.user.update({
    where: { id: user.id },
    data:  { lastLogin: new Date() },
  });

  // ── 5. Issue JWT ──────────────────────────────────────────────────────────
  // contextBusinessId is kept in the token so protected routes that relied
  // on it (e.g. order lookups) still work — it simply equals businessId now.
  const token = jwt.sign(
    {
      id:                user.id,
      email:             user.email,
      role:              user.role,
      businessId:        user.businessId,
      contextBusinessId: user.businessId, // same as businessId in path-based world
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  console.log(`✅ Login: ${user.email} (${user.role})${user.business ? ` — ${user.business.businessName}` : ''}`);

  return res.json({
    ok:    true,
    token,
    user: {
      id:                user.id,
      email:             user.email,
      role:              user.role,
      businessId:        user.businessId,
      contextBusinessId: user.businessId,
      firstName:         user.firstName,
      lastName:          user.lastName,
    },
  });
}

// ============================================================================
// GET CURRENT USER  (/api/auth/me)
// ============================================================================
async function getCurrentUser(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id:        true,
      email:     true,
      role:      true,
      businessId:true,
      firstName: true,
      lastName:  true,
      phone:     true,
      active:    true,
      lastLogin: true,
      createdAt: true,
      business: {
        select: { id: true, businessName: true, slug: true },
      },
    },
  });

  return res.json({ user });
}

// ============================================================================
// CHANGE PASSWORD
// ============================================================================
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ ok: false, error: 'Current password and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ ok: false, error: 'Password must be at least 8 characters' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ ok: false, error: 'User not found' });
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return res.status(400).json({ ok: false, error: 'Current password is incorrect' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    console.log(`✅ Password changed: ${user.email}`);
    return res.json({ ok: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('❌ Password change error:', error);
    return res.status(500).json({ ok: false, error: 'Failed to change password' });
  }
}

module.exports = { login, getCurrentUser, changePassword };