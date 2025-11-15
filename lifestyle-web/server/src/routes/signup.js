const express = require('express');
const db = require('../db');
const { createSession } = require('../services/session-store');
const { hashPassword } = require('../utils/hash-password');
const { isHeadCoach, ROLES } = require('../utils/role');

const router = express.Router();

const DEFAULT_ROLE = ROLES.ATHLETE;
const DEFAULT_WEIGHT_CATEGORY = 'Unassigned';
const DEFAULT_GOALS = {
  steps: 9000,
  calories: 2200,
  sleep: 7.5,
  readiness: 80,
};

const defaultCoachStatement = db.prepare(
  `SELECT id, role
   FROM users
   WHERE LOWER(role) LIKE '%coach%'
   ORDER BY (LOWER(role) LIKE '%head coach%') DESC, id ASC
   LIMIT 1`
);

const linkAthleteStatement = db.prepare(
  `INSERT OR IGNORE INTO coach_athlete_links (coach_id, athlete_id)
   VALUES (?, ?)`
);

function normalizeEmail(value = '') {
  return value.trim().toLowerCase();
}

function normalizeAvatarUrl(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (!/^https?:\/\//i.test(trimmed)) {
    return null;
  }

  if (trimmed.length > 600) {
    return trimmed.slice(0, 600);
  }

  return trimmed;
}

router.post('/', (req, res) => {
  const { name, email, password, avatar } = req.body || {};
  const trimmedName = typeof name === 'string' ? name.trim() : '';
  const normalizedEmail = normalizeEmail(email);
  const cleanPassword = typeof password === 'string' ? password : '';
  const avatarUrl = normalizeAvatarUrl(avatar);

  if (!trimmedName || !normalizedEmail || !cleanPassword) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }

  if (!normalizedEmail.includes('@') || !normalizedEmail.includes('.')) {
    return res.status(400).json({ message: 'Provide a valid email address.' });
  }

  if (cleanPassword.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters.' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (existing) {
    return res.status(409).json({ message: 'An account with that email already exists.' });
  }

  try {
    const passwordHash = hashPassword(cleanPassword);
    const insert = db.prepare(
      `INSERT INTO users (name, email, password_hash, role, avatar_url, weight_category, goal_steps, goal_calories, goal_sleep, goal_readiness)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const result = insert.run(
      trimmedName,
      normalizedEmail,
      passwordHash,
      DEFAULT_ROLE,
      avatarUrl,
      DEFAULT_WEIGHT_CATEGORY,
      DEFAULT_GOALS.steps,
      DEFAULT_GOALS.calories,
      DEFAULT_GOALS.sleep,
      DEFAULT_GOALS.readiness
    );

    const user = {
      id: result.lastInsertRowid,
      name: trimmedName,
      email: normalizedEmail,
      role: DEFAULT_ROLE,
      avatar_url: avatarUrl,
      weight_category: DEFAULT_WEIGHT_CATEGORY,
      goal_steps: DEFAULT_GOALS.steps,
      goal_calories: DEFAULT_GOALS.calories,
      goal_sleep: DEFAULT_GOALS.sleep,
      goal_readiness: DEFAULT_GOALS.readiness,
      strava_client_id: null,
      strava_client_secret: null,
      strava_redirect_uri: null,
    };

    const defaultCoach = defaultCoachStatement.get();
    if (defaultCoach && (isHeadCoach(defaultCoach.role) || defaultCoach.id !== user.id)) {
      linkAthleteStatement.run(defaultCoach.id, user.id);
    }
    const session = createSession(user);
    return res.status(201).json(session);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Signup failed:', error);
    return res.status(500).json({ message: 'Unable to create account right now.' });
  }
});

module.exports = router;
