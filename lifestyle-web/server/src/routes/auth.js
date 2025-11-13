const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const { createSession, destroySession, authenticate } = require('../services/session-store');

const router = express.Router();

function hash(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

router.post('/', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const user = db
    .prepare(
      `SELECT id, name, email, role, avatar_url, goal_steps, goal_calories, goal_sleep, goal_readiness, password_hash
       FROM users
       WHERE email = ?`
    )
    .get(email.trim().toLowerCase());

  if (!user || user.password_hash !== hash(password)) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  const { password_hash: _, ...safeUser } = user; // eslint-disable-line camelcase, no-unused-vars
  const session = createSession(safeUser);

  return res.json(session);
});

router.post('/logout', authenticate, (req, res) => {
  destroySession(req.token);
  return res.status(204).send();
});

module.exports = router;
