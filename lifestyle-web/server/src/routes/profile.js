const express = require('express');
const db = require('../db');
const { authenticate, createSession } = require('../services/session-store');
const { hashPassword, verifyPassword } = require('../utils/hash-password');
const { coerceRole, ROLES } = require('../utils/role');

const router = express.Router();

router.use(authenticate);

router.put('/', (req, res) => {
  const {
    name,
    email,
    password,
    currentPassword,
    weightCategory,
    stravaClientId,
    stravaClientSecret,
    stravaRedirectUri,
  } = req.body || {};
  const trimmedName = typeof name === 'string' ? name.trim() : '';
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const newPassword = typeof password === 'string' ? password : '';
  const current = typeof currentPassword === 'string' ? currentPassword : '';
  const trimmedWeightCategory =
    typeof weightCategory === 'string' ? weightCategory.trim() : '';
  const trimmedStravaClientId =
    typeof stravaClientId === 'string' ? stravaClientId.trim() : undefined;
  const trimmedStravaClientSecret =
    typeof stravaClientSecret === 'string' ? stravaClientSecret.trim() : undefined;
  const trimmedStravaRedirectUri =
    typeof stravaRedirectUri === 'string' ? stravaRedirectUri.trim() : undefined;

  if (!current) {
    return res.status(400).json({ message: 'Current password is required.' });
  }

  const user = db
    .prepare(
      `SELECT id,
              name,
              email,
              role,
              avatar_url,
              weight_category,
              goal_steps,
              goal_calories,
              goal_sleep,
              goal_readiness,
              password_hash,
              strava_client_id,
              strava_client_secret,
              strava_redirect_uri
         FROM users
        WHERE id = ?`
    )
    .get(req.user.id);

  if (!user || !verifyPassword(current, user.password_hash)) {
    return res.status(401).json({ message: 'Current password is incorrect.' });
  }

  const updates = {
    name: user.name,
    email: user.email,
    password_hash: user.password_hash,
    weight_category: user.weight_category || null,
    strava_client_id: user.strava_client_id || null,
    strava_client_secret: user.strava_client_secret || null,
    strava_redirect_uri: user.strava_redirect_uri || null,
  };

  if (trimmedName) {
    if (trimmedName.length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters.' });
    }
    const existingName = db
      .prepare('SELECT id FROM users WHERE LOWER(name) = ? AND id != ?')
      .get(trimmedName.toLowerCase(), req.user.id);
    if (existingName) {
      return res.status(409).json({ message: 'That name is already in use.' });
    }
    updates.name = trimmedName;
  }

  if (normalizedEmail) {
    const existingEmail = db
      .prepare('SELECT id FROM users WHERE LOWER(email) = ? AND id != ?')
      .get(normalizedEmail, req.user.id);
    if (existingEmail) {
      return res.status(409).json({ message: 'That email is already in use.' });
    }
    updates.email = normalizedEmail;
  }

  if (trimmedWeightCategory || trimmedWeightCategory === '') {
    if (trimmedWeightCategory.length > 40) {
      return res.status(400).json({ message: 'Weight category must be 40 characters or fewer.' });
    }
    updates.weight_category = trimmedWeightCategory || null;
  }

  if (/^[a-f0-9]{64}$/i.test(user.password_hash || '')) {
    updates.password_hash = hashPassword(current);
  }

  if (newPassword) {
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters.' });
    }
    updates.password_hash = hashPassword(newPassword);
  }

  const hasStravaFields =
    trimmedStravaClientId !== undefined ||
    trimmedStravaClientSecret !== undefined ||
    trimmedStravaRedirectUri !== undefined;

  if (hasStravaFields) {
    const normalizedId = trimmedStravaClientId || '';
    const normalizedSecret = trimmedStravaClientSecret || '';
    const normalizedRedirect = trimmedStravaRedirectUri || '';
    const allEmpty = !normalizedId && !normalizedSecret && !normalizedRedirect;
    if (!allEmpty && (!normalizedId || !normalizedSecret || !normalizedRedirect)) {
      return res
        .status(400)
        .json({ message: 'Provide Strava client ID, secret, and redirect URL together.' });
    }
    if (normalizedRedirect && !/^https?:\/\//i.test(normalizedRedirect)) {
      return res.status(400).json({ message: 'Redirect URL must start with http:// or https://.' });
    }
    updates.strava_client_id = normalizedId || null;
    updates.strava_client_secret = normalizedSecret || null;
    updates.strava_redirect_uri = normalizedRedirect || null;
  }

  db.prepare(
    `UPDATE users
        SET name = ?,
            email = ?,
            password_hash = ?,
            weight_category = ?,
            strava_client_id = ?,
            strava_client_secret = ?,
            strava_redirect_uri = ?
      WHERE id = ?`
  ).run(
    updates.name,
    updates.email,
    updates.password_hash,
    updates.weight_category,
    updates.strava_client_id,
    updates.strava_client_secret,
    updates.strava_redirect_uri,
    req.user.id
  );

  const refreshed = {
    ...user,
    name: updates.name,
    email: updates.email,
    weight_category: updates.weight_category,
    strava_client_id: updates.strava_client_id,
    strava_client_secret: updates.strava_client_secret,
    strava_redirect_uri: updates.strava_redirect_uri,
    password_hash: undefined,
    role: coerceRole(user.role) || ROLES.ATHLETE,
  };

  const session = createSession({
    id: req.user.id,
    name: refreshed.name,
    email: refreshed.email,
    role: refreshed.role,
    avatar_url: user.avatar_url,
    weight_category: refreshed.weight_category,
    goal_steps: user.goal_steps,
    goal_calories: user.goal_calories,
    goal_sleep: user.goal_sleep,
    goal_readiness: user.goal_readiness,
    strava_client_id: updates.strava_client_id,
    strava_client_secret: updates.strava_client_secret,
    strava_redirect_uri: updates.strava_redirect_uri,
  });

  return res.json(session);
});

module.exports = router;
