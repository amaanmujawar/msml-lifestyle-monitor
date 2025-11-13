const express = require('express');
const db = require('../db');
const { authenticate } = require('../services/session-store');

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  const userId = req.user.id;

  const latest = db
    .prepare(
      `SELECT steps, calories, sleep_hours AS sleepHours, readiness_score AS readiness
       FROM daily_metrics
       WHERE user_id = ?
       ORDER BY date DESC
       LIMIT 1`
    )
    .get(userId);

  const timeline = db
    .prepare(
      `SELECT date, steps, calories, readiness_score AS readiness
       FROM daily_metrics
       WHERE user_id = ?
       ORDER BY date ASC`
    )
    .all(userId);

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
    .get(userId);

  const heartRateZones = db
    .prepare(
      `SELECT zone, minutes
       FROM heart_rate_zones
       WHERE user_id = ?`
    )
    .all(userId);

  const hydration = db
    .prepare(
      `SELECT date, ounces
       FROM hydration_logs
       WHERE user_id = ?
       ORDER BY date ASC`
    )
    .all(userId);

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
    .get(userId);

  const readiness = timeline.map((entry) => ({
    date: entry.date,
    readiness: entry.readiness,
  }));

  return res.json({
    user: req.user,
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
