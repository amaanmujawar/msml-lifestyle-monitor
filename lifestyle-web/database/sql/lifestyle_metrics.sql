DROP TABLE IF EXISTS activity_splits;
DROP TABLE IF EXISTS activity_sessions;
DROP TABLE IF EXISTS strava_oauth_states;
DROP TABLE IF EXISTS strava_connections;
DROP TABLE IF EXISTS nutrition_entries;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS coach_athlete_links;
DROP TABLE IF EXISTS daily_metrics;
DROP TABLE IF EXISTS heart_rate_zones;
DROP TABLE IF EXISTS nutrition_macros;
DROP TABLE IF EXISTS hydration_logs;
DROP TABLE IF EXISTS sleep_stages;
DROP TABLE IF EXISTS health_markers;

CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  avatar_url TEXT,
  weight_category TEXT,
  goal_steps INTEGER,
  goal_calories INTEGER,
  goal_sleep REAL,
  goal_readiness INTEGER,
  strava_client_id TEXT,
  strava_client_secret TEXT,
  strava_redirect_uri TEXT
);

CREATE TABLE coach_athlete_links (
  id INTEGER PRIMARY KEY,
  coach_id INTEGER NOT NULL,
  athlete_id INTEGER NOT NULL,
  UNIQUE (coach_id, athlete_id),
  FOREIGN KEY (coach_id) REFERENCES users (id),
  FOREIGN KEY (athlete_id) REFERENCES users (id)
);

INSERT INTO users (id, name, email, password_hash, role, avatar_url, weight_category, goal_steps, goal_calories, goal_sleep, goal_readiness, strava_client_id, strava_client_secret, strava_redirect_uri)
VALUES
  (1, 'Avery Hart', 'avery.hart@example.com', '8f927203b5777f8b90cdfc41eb9f24593959e5057283b1856567ff3f6cd93092', 'Coach', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80', 'Welterweight', 13000, 2500, 7.7, 88, NULL, NULL, NULL),
  (2, 'Leo Singh', 'leo.singh@example.com', 'd433f9c9a6da4fa32df977cf8f9ea2a355f66516ff30f31d2530f93030c6aa90', 'Athlete', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80', 'Middleweight', 10000, 2200, 8.2, 82, NULL, NULL, NULL),
  (3, 'David Cracknell', 'david.cracknell@example.com', '777a025f5ca4a20f7bafee940f2820e28e1f4bbcbd9dd774bbce883166ef7c55', 'Head Coach', 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=200&q=80', 'Heavyweight', NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO coach_athlete_links (coach_id, athlete_id)
VALUES
  (3, 1),
  (3, 2);

CREATE TABLE daily_metrics (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  steps INTEGER,
  calories INTEGER,
  sleep_hours REAL,
  readiness_score INTEGER,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

INSERT INTO daily_metrics (user_id, date, steps, calories, sleep_hours, readiness_score) VALUES
  (1, '2025-03-10', 13240, 2460, 7.8, 90),
  (1, '2025-03-11', 12860, 2395, 7.5, 87),
  (1, '2025-03-12', 14120, 2530, 7.9, 93),
  (1, '2025-03-13', 11840, 2285, 6.8, 79),
  (1, '2025-03-14', 15010, 2585, 7.6, 95),
  (1, '2025-03-15', 13480, 2445, 7.2, 88),
  (1, '2025-03-16', 13890, 2490, 7.7, 91),
  (2, '2025-03-10', 9850, 2050, 8.1, 78),
  (2, '2025-03-11', 10420, 2120, 8.3, 82),
  (2, '2025-03-12', 11010, 2180, 8.0, 84),
  (2, '2025-03-13', 9020, 1975, 7.5, 75),
  (2, '2025-03-14', 11950, 2245, 8.4, 87),
  (2, '2025-03-15', 10180, 2095, 7.9, 80),
  (2, '2025-03-16', 10740, 2160, 8.2, 83);

CREATE TABLE heart_rate_zones (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  zone TEXT NOT NULL,
  minutes INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

INSERT INTO heart_rate_zones (user_id, zone, minutes) VALUES
  (1, 'Peak', 36),
  (1, 'Cardio', 62),
  (1, 'Fat Burn', 81),
  (1, 'Ease', 260),
  (2, 'Peak', 24),
  (2, 'Cardio', 51),
  (2, 'Fat Burn', 86),
  (2, 'Ease', 288);

CREATE TABLE nutrition_macros (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  target_calories INTEGER,
  protein_grams INTEGER,
  carbs_grams INTEGER,
  fats_grams INTEGER,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

INSERT INTO nutrition_macros (user_id, date, target_calories, protein_grams, carbs_grams, fats_grams) VALUES
  (1, '2025-03-16', 2550, 160, 275, 82),
  (2, '2025-03-16', 2250, 138, 240, 74);

CREATE TABLE nutrition_entries (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  item_name TEXT NOT NULL,
  item_type TEXT NOT NULL DEFAULT 'Food',
  calories INTEGER NOT NULL,
  protein_grams INTEGER DEFAULT 0,
  carbs_grams INTEGER DEFAULT 0,
  fats_grams INTEGER DEFAULT 0,
  weight_amount REAL,
  weight_unit TEXT DEFAULT 'g',
  barcode TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

INSERT INTO nutrition_entries (user_id, date, item_name, item_type, calories, protein_grams, carbs_grams, fats_grams, weight_amount, weight_unit, barcode) VALUES
  (2, '2025-03-16', 'Overnight oats + whey', 'Food', 420, 32, 48, 12, 320, 'g', '0489123400123'),
  (2, '2025-03-16', 'Citrus recovery drink', 'Liquid', 110, 0, 28, 0, 500, 'ml', NULL),
  (2, '2025-03-16', 'Grilled salmon bowl', 'Food', 640, 48, 52, 24, 420, 'g', '0073412345000'),
  (2, '2025-03-15', 'Greek yogurt and berries', 'Food', 310, 25, 38, 6, 250, 'g', '0499123499881'),
  (2, '2025-03-15', 'Electrolyte packet', 'Liquid', 45, 0, 11, 0, 250, 'ml', NULL),
  (2, '2025-03-14', 'Chicken pesto pasta', 'Food', 710, 46, 82, 19, 380, 'g', '0500012345678'),
  (1, '2025-03-16', 'Protein waffles', 'Food', 380, 32, 42, 10, 180, 'g', '0012345678902'),
  (1, '2025-03-16', 'Matcha latte', 'Liquid', 190, 8, 24, 6, 350, 'ml', NULL),
  (1, '2025-03-15', 'Quinoa power bowl', 'Food', 560, 34, 68, 16, 360, 'g', '0001234987650'),
  (1, '2025-03-14', 'Evening shake', 'Liquid', 220, 28, 18, 4, 400, 'ml', NULL);

CREATE TABLE hydration_logs (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  ounces INTEGER,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

INSERT INTO hydration_logs (user_id, date, ounces) VALUES
  (1, '2025-03-12', 88),
  (1, '2025-03-13', 92),
  (1, '2025-03-14', 95),
  (1, '2025-03-15', 90),
  (1, '2025-03-16', 96),
  (2, '2025-03-12', 74),
  (2, '2025-03-13', 76),
  (2, '2025-03-14', 81),
  (2, '2025-03-15', 79),
  (2, '2025-03-16', 83);

CREATE TABLE sleep_stages (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  deep_minutes INTEGER,
  rem_minutes INTEGER,
  light_minutes INTEGER,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

INSERT INTO sleep_stages (user_id, date, deep_minutes, rem_minutes, light_minutes) VALUES
  (1, '2025-03-16', 118, 142, 215),
  (2, '2025-03-16', 130, 147, 218);

CREATE TABLE health_markers (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  resting_hr INTEGER,
  hrv_score INTEGER,
  spo2 INTEGER,
  stress_score INTEGER,
  systolic_bp INTEGER,
  diastolic_bp INTEGER,
  glucose_mg_dl INTEGER,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

INSERT INTO health_markers (user_id, date, resting_hr, hrv_score, spo2, stress_score, systolic_bp, diastolic_bp, glucose_mg_dl) VALUES
  (1, '2025-03-11', 52, 83, 98, 31, 120, 74, 96),
  (1, '2025-03-12', 53, 82, 98, 33, 122, 76, 99),
  (1, '2025-03-13', 51, 85, 99, 30, 121, 74, 94),
  (1, '2025-03-14', 50, 87, 99, 28, 118, 73, 92),
  (1, '2025-03-15', 49, 88, 99, 27, 117, 72, 90),
  (1, '2025-03-16', 48, 90, 99, 25, 116, 71, 88),
  (2, '2025-03-11', 57, 75, 97, 36, 126, 80, 101),
  (2, '2025-03-12', 56, 77, 98, 35, 125, 79, 99),
  (2, '2025-03-13', 55, 78, 98, 34, 124, 78, 98),
  (2, '2025-03-14', 55, 80, 99, 32, 123, 78, 96),
  (2, '2025-03-15', 54, 81, 99, 31, 122, 77, 95),
  (2, '2025-03-16', 54, 83, 99, 30, 121, 76, 94);

CREATE TABLE activity_sessions (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  source_id TEXT,
  name TEXT NOT NULL,
  sport_type TEXT NOT NULL DEFAULT 'Run',
  start_time TEXT NOT NULL,
  distance_m REAL,
  moving_time_s INTEGER,
  elapsed_time_s INTEGER,
  average_hr REAL,
  max_hr REAL,
  average_pace_s REAL,
  average_cadence REAL,
  average_power REAL,
  elevation_gain_m REAL,
  calories REAL,
  perceived_effort INTEGER,
  vo2max_estimate REAL,
  training_load REAL,
  strava_activity_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id),
  UNIQUE (user_id, strava_activity_id)
);

INSERT INTO activity_sessions (id, user_id, source, source_id, name, sport_type, start_time, distance_m, moving_time_s, elapsed_time_s, average_hr, max_hr, average_pace_s, average_cadence, average_power, elevation_gain_m, calories, perceived_effort, vo2max_estimate, training_load, strava_activity_id)
VALUES
  (1, 1, 'manual', NULL, 'Sunrise Aerobic', 'Run', '2025-03-14T06:20:00Z', 14200, 3600, 3680, 152, 173, 254, 178, 310, 210, 1020, 6, 56.1, 78, 880001),
  (2, 1, 'manual', NULL, 'Track Speed Session', 'Run', '2025-03-16T08:00:00Z', 10200, 3000, 3120, 165, 188, 294, 186, 340, 80, 780, 8, 57.4, 91, 880002),
  (3, 1, 'manual', NULL, 'Evening Shakeout', 'Run', '2025-03-15T18:05:00Z', 6400, 2100, 2155, 140, 158, 328, 174, 270, 60, 420, 4, 55.2, 40, 880003),
  (4, 2, 'manual', NULL, 'River Long Run', 'Run', '2025-03-16T07:30:00Z', 24200, 6100, 6240, 150, 174, 252, 176, 298, 280, 1450, 7, 53.8, 110, 990001),
  (5, 2, 'manual', NULL, 'Tempo Over Unders', 'Run', '2025-03-14T06:50:00Z', 15800, 4200, 4320, 162, 184, 266, 182, 320, 160, 1120, 8, 54.7, 96, 990002),
  (6, 2, 'manual', NULL, 'Recovery Run', 'Run', '2025-03-13T17:40:00Z', 9200, 2400, 2450, 138, 155, 261, 174, 250, 70, 540, 4, 52.1, 45, 990003),
  (7, 2, 'manual', NULL, 'Hill Repeats', 'Run', '2025-03-11T07:10:00Z', 11800, 3300, 3450, 168, 187, 280, 180, 335, 420, 980, 9, 54.1, 105, 990004);

CREATE TABLE activity_splits (
  id INTEGER PRIMARY KEY,
  session_id INTEGER NOT NULL,
  split_index INTEGER NOT NULL,
  distance_m REAL NOT NULL,
  moving_time_s INTEGER NOT NULL,
  average_pace_s REAL,
  elevation_gain_m REAL,
  average_hr REAL,
  FOREIGN KEY (session_id) REFERENCES activity_sessions (id)
);

INSERT INTO activity_splits (session_id, split_index, distance_m, moving_time_s, average_pace_s, elevation_gain_m, average_hr) VALUES
  (1, 1, 1000, 255, 255, 18, 148),
  (1, 2, 1000, 252, 252, 45, 152),
  (1, 3, 1000, 249, 249, 62, 156),
  (1, 4, 1000, 256, 256, 40, 151),
  (2, 1, 1000, 296, 296, 12, 158),
  (2, 2, 1000, 292, 292, 15, 166),
  (2, 3, 1000, 290, 290, 18, 170),
  (2, 4, 1000, 298, 298, 10, 164),
  (3, 1, 1000, 330, 330, 6, 138),
  (3, 2, 1000, 327, 327, 9, 141),
  (3, 3, 1000, 326, 326, 5, 142),
  (4, 1, 1000, 252, 252, 35, 144),
  (4, 2, 1000, 251, 251, 42, 149),
  (4, 3, 1000, 253, 253, 46, 152),
  (4, 4, 1000, 254, 254, 50, 153),
  (4, 5, 1000, 252, 252, 58, 155),
  (4, 6, 1000, 251, 251, 49, 150),
  (5, 1, 1000, 266, 266, 24, 158),
  (5, 2, 1000, 264, 264, 28, 164),
  (5, 3, 1000, 269, 269, 32, 167),
  (5, 4, 1000, 265, 265, 26, 163),
  (6, 1, 1000, 262, 262, 10, 136),
  (6, 2, 1000, 260, 260, 9, 138),
  (6, 3, 1000, 261, 261, 11, 140),
  (7, 1, 1000, 278, 278, 55, 166),
  (7, 2, 1000, 279, 279, 70, 170),
  (7, 3, 1000, 281, 281, 80, 172),
  (7, 4, 1000, 282, 282, 85, 168);

CREATE TABLE strava_connections (
  id INTEGER PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL,
  athlete_id INTEGER,
  athlete_name TEXT,
  client_id TEXT,
  client_secret TEXT,
  redirect_uri TEXT,
  access_token TEXT,
  refresh_token TEXT,
  expires_at INTEGER,
  scope TEXT,
  last_sync TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE strava_oauth_states (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  state TEXT NOT NULL UNIQUE,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id)
);
