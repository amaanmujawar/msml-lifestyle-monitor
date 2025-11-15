const express = require('express');
const db = require('../db');
const { authenticate } = require('../services/session-store');
const { isHeadCoach, coerceRole } = require('../utils/role');

const router = express.Router();
const OUNCES_PER_ML = 0.033814;

const subjectStatement = db.prepare(
  `SELECT id,
          name,
          email,
          role,
          avatar_url,
          weight_category,
          goal_steps,
          goal_calories,
          goal_sleep,
          goal_readiness
   FROM users
   WHERE id = ?`
);

const accessStatement = db.prepare(
  `SELECT 1
   FROM coach_athlete_links
   WHERE coach_id = ? AND athlete_id = ?`
);

const liquidHydrationStatement = db.prepare(
  `SELECT date,
          weight_amount AS amount,
          weight_unit   AS unit
     FROM nutrition_entries
    WHERE user_id = ?
      AND item_type = 'Liquid'
      AND weight_amount IS NOT NULL`
);

function convertToOunces(amount, unit) {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }
  const normalizedUnit = (unit || '').toLowerCase();
  if (normalizedUnit === 'ml' || normalizedUnit === '') {
    return Math.round(value * OUNCES_PER_ML * 10) / 10;
  }
  if (normalizedUnit === 'g') {
    return Math.round(value * OUNCES_PER_ML * 10) / 10;
  }
  return null;
}

function mergeHydrationSources(logs = [], liquids = []) {
  const totals = new Map();
  logs.forEach((entry) => {
    const ounces = Number(entry.ounces);
    if (!Number.isFinite(ounces) || ounces <= 0) return;
    totals.set(entry.date, (totals.get(entry.date) || 0) + ounces);
  });
  liquids.forEach((entry) => {
    const ounces = convertToOunces(entry.amount, entry.unit);
    if (!Number.isFinite(ounces) || ounces <= 0) return;
    totals.set(entry.date, (totals.get(entry.date) || 0) + ounces);
  });
  return Array.from(totals.entries())
    .map(([date, ounces]) => ({ date, ounces: Math.round(ounces * 10) / 10 }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

router.get('/', authenticate, (req, res) => {
  req.user = { ...req.user, role: coerceRole(req.user.role) };
  const viewerId = req.user.id;
  const requestedId = Number.parseInt(req.query.athleteId, 10);
  const subjectId = Number.isNaN(requestedId) ? viewerId : requestedId;

  if (subjectId !== viewerId && !isHeadCoach(req.user.role)) {
    const hasAccess = accessStatement.get(viewerId, subjectId);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to view that athlete.' });
    }
  }

  const subject = subjectStatement.get(subjectId);
  if (!subject) {
    return res.status(404).json({ message: 'Athlete not found.' });
  }
  subject.role = coerceRole(subject.role);

  const latest = db
    .prepare(
      `SELECT steps, calories, sleep_hours AS sleepHours, readiness_score AS readiness
       FROM daily_metrics
       WHERE user_id = ?
       ORDER BY date DESC
       LIMIT 1`
    )
    .get(subjectId);

  const timeline = db
    .prepare(
      `SELECT date, steps, calories, readiness_score AS readiness
       FROM daily_metrics
       WHERE user_id = ?
       ORDER BY date ASC`
    )
    .all(subjectId);

  const macros = db
    .prepare(
      `SELECT protein_grams AS protein,
              carbs_grams   AS carbs,
              fats_grams    AS fats,
              target_calories AS targetCalories
       FROM nutrition_macros
       WHERE user_id = ?
       ORDER BY date DESC
       LIMIT 1`
    )
    .get(subjectId);

  const heartRateZones = db
    .prepare(
      `SELECT zone, minutes
       FROM heart_rate_zones
       WHERE user_id = ?`
    )
    .all(subjectId);

  const hydrationLogs = db
    .prepare(
      `SELECT date, ounces
       FROM hydration_logs
       WHERE user_id = ?
       ORDER BY date ASC`
    )
    .all(subjectId);
  const liquidHydration = liquidHydrationStatement.all(subjectId);
  const hydration = mergeHydrationSources(hydrationLogs, liquidHydration);

  const sleepStages = db
    .prepare(
      `SELECT date,
              deep_minutes  AS deep,
              rem_minutes   AS rem,
              light_minutes AS light
       FROM sleep_stages
       WHERE user_id = ?
       ORDER BY date DESC
       LIMIT 1`
    )
    .get(subjectId);

  const readiness = timeline.map((entry) => ({
    date: entry.date,
    readiness: entry.readiness,
  }));

  return res.json({
    user: req.user,
    subject,
    summary: latest,
    timeline,
    macros,
    heartRateZones,
    hydration,
    sleepStages,
    readiness,
  });
});

module.exports = router;
