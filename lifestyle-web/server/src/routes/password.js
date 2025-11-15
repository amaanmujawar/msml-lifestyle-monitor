const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const { hashPassword } = require('../utils/hash-password');

const router = express.Router();
const RESET_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

router.post('/forgot', (req, res) => {
  const { email } = req.body || {};
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (!normalizedEmail) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  const user = db
    .prepare('SELECT id, email, name FROM users WHERE LOWER(email) = ?')
    .get(normalizedEmail);

  if (user) {
    const token = crypto.randomBytes(48).toString('hex');
    const expiresAt = new Date(Date.now() + RESET_WINDOW_MS).toISOString();

    db.prepare(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at, used, created_at)
       VALUES (?, ?, ?, 0, ?)`
    ).run(user.id, token, expiresAt, new Date().toISOString());

    const resetLink = `${process.env.APP_ORIGIN || 'http://localhost:4000'}/reset?token=${token}`;
    console.log(`Password reset link for ${user.email}: ${resetLink}`);
  }

  return res.json({ message: 'If that email exists, a reset link has been sent.' });
});

router.post('/reset', (req, res) => {
  const { token, password } = req.body || {};
  const trimmedToken = typeof token === 'string' ? token.trim() : '';
  const newPassword = typeof password === 'string' ? password : '';

  if (!trimmedToken || !newPassword) {
    return res.status(400).json({ message: 'Token and new password are required.' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters.' });
  }

  const entry = db
    .prepare(
      `SELECT id, user_id, expires_at, used
       FROM password_reset_tokens
       WHERE token = ?`
    )
    .get(trimmedToken);

  if (!entry) {
    return res.status(400).json({ message: 'Invalid or expired token.' });
  }

  if (entry.used) {
    return res.status(400).json({ message: 'This token has already been used.' });
  }

  if (new Date(entry.expires_at).getTime() < Date.now()) {
    return res.status(400).json({ message: 'This token has expired.' });
  }

  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(newPassword), entry.user_id);
  db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE id = ?').run(entry.id);

  return res.json({ message: 'Password updated. You can sign in with the new password.' });
});

module.exports = router;
