// backend/src/controllers/authController.js
const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const prisma = require('../lib/prisma');

// ============================================================================
// LOGIN
// ============================================================================
async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ ok: false, error: 'Email and password are required' });
  }

  // ── 1. Find user ──────────────────────────────────────────────────────────
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      business: {
        // ✅ Schema field is isActive:Boolean — NOT status:String
        select: { id: true, slug: true, businessName: true, isActive: true },
      },
    },
  });

  // ── DEV diagnostic log — safe to remove once confirmed working ────────────
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🔍 Login attempt: ${email}`);
    console.log(`   found=${!!user}  active=${user?.active}  role=${user?.role}`);
  }

  if (!user) {
    return res.status(401).json({ ok: false, error: 'Invalid credentials' });
  }

  // ── 2. Active check ───────────────────────────────────────────────────────
  //
  // ✅ ROOT-CAUSE FIX for super-admin "Invalid credentials" bug:
  //
  // The OLD code was:  if (!user || !user.active) → throw 'Invalid credentials'
  // Super-admin accounts seeded without explicit active:true have active=null
  // in Postgres (not false, not true — NULL), which made !user.active = true,
  // so the check fired and blocked login before even checking the password.
  //
  // Schema: User.active Boolean @default(true) — default only applies to
  // INSERT via Prisma. Raw SQL seeds or old records can still have NULL.
  //
  // FIX: Super-admins bypass the active flag entirely (they own the platform).
  // Business users still need active=true so staff suspension works.
  if (user.role !== 'super-admin' && user.active !== true) {
    return res.status(401).json({
      ok: false,
      error: 'Your account has been deactivated. Contact support.',
    });
  }

  // ── 3. Verify password ────────────────────────────────────────────────────
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ ok: false, error: 'Invalid credentials' });
  }

  // ── 4. For non-super-admins: ensure business exists and is active ─────────
  //
  // ✅ Schema: Business.isActive Boolean @default(true) — correct field name
  if (user.role !== 'super-admin') {
    if (!user.businessId || !user.business) {
      return res.status(403).json({
        ok: false,
        error: 'Your account is not associated with any business. Contact support.',
      });
    }

    if (!user.business.isActive) {
      return res.status(403).json({
        ok: false,
        error: 'Your business account has been suspended. Contact support.',
      });
    }
  }

  // ── 5. Stamp last login + self-heal super-admin active=null ──────────────
  //
  // If this was the super-admin's first login after schema migration and
  // their active was NULL, set it to true now so it doesn't happen again.
  await prisma.user.update({
    where: { id: user.id },
    data: {
      lastLogin: new Date(),
      ...(user.role === 'super-admin' && user.active !== true ? { active: true } : {}),
    },
  });

  // ── 6. Issue JWT ──────────────────────────────────────────────────────────
  const token = jwt.sign(
    {
      id:                user.id,
      email:             user.email,
      role:              user.role,
      businessId:        user.businessId,
      contextBusinessId: user.businessId, // equals businessId in path-based routing
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  console.log(
    `✅ Login: ${user.email} (${user.role})` +
    (user.business ? ` — ${user.business.businessName}` : ' — platform admin')
  );

  return res.json({
    ok: true,
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
// GET CURRENT USER  /api/auth/me
// ============================================================================
async function getCurrentUser(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id:         true,
      email:      true,
      role:       true,
      businessId: true,
      firstName:  true,
      lastName:   true,
      phone:      true,
      active:     true,
      lastLogin:  true,
      createdAt:  true,
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