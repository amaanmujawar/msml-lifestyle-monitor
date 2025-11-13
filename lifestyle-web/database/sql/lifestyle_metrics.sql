DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS daily_metrics;
DROP TABLE IF EXISTS heart_rate_zones;
DROP TABLE IF EXISTS nutrition_macros;
DROP TABLE IF EXISTS hydration_logs;
DROP TABLE IF EXISTS sleep_stages;

CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  avatar_url TEXT,
  goal_steps INTEGER,
  goal_calories INTEGER,
  goal_sleep REAL,
  goal_readiness INTEGER
);

INSERT INTO users (id, name, email, password_hash, role, avatar_url, goal_steps, goal_calories, goal_sleep, goal_readiness)
VALUES
  (1, 'Avery Hart', 'avery.hart@example.com', '8f927203b5777f8b90cdfc41eb9f24593959e5057283b1856567ff3f6cd93092', 'Performance Coach', 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=200&q=80', 12000, 2400, 7.5, 85),
  (2, 'Leo Singh', 'leo.singh@example.com', 'd433f9c9a6da4fa32df977cf8f9ea2a355f66516ff30f31d2530f93030c6aa90', 'Wellness Lead', 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=200&q=80', 9500, 2100, 8.0, 80);

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
  (1, '2025-02-10', 11820, 2320, 7.2, 83),
  (1, '2025-02-11', 12450, 2410, 7.6, 88),
  (1, '2025-02-12', 13120, 2450, 7.8, 91),
  (1, '2025-02-13', 10980, 2280, 6.9, 78),
  (1, '2025-02-14', 14210, 2525, 7.4, 92),
  (1, '2025-02-15', 12640, 2390, 7.1, 86),
  (1, '2025-02-16', 13580, 2475, 7.9, 94),
  (2, '2025-02-10', 9080, 1980, 7.9, 77),
  (2, '2025-02-11', 9720, 2050, 8.1, 80),
  (2, '2025-02-12', 10110, 2085, 8.0, 82),
  (2, '2025-02-13', 8760, 1940, 7.4, 74),
  (2, '2025-02-14', 11220, 2140, 8.3, 85),
  (2, '2025-02-15', 9450, 2030, 7.8, 79),
  (2, '2025-02-16', 9875, 2075, 8.2, 83);

CREATE TABLE heart_rate_zones (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  zone TEXT NOT NULL,
  minutes INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

INSERT INTO heart_rate_zones (user_id, zone, minutes) VALUES
  (1, 'Peak', 32),
  (1, 'Cardio', 58),
  (1, 'Fat Burn', 76),
  (1, 'Ease', 274),
  (2, 'Peak', 21),
  (2, 'Cardio', 47),
  (2, 'Fat Burn', 83),
  (2, 'Ease', 301);

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
  (1, '2025-02-16', 2400, 155, 265, 78),
  (2, '2025-02-16', 2100, 130, 230, 72);

CREATE TABLE hydration_logs (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  ounces INTEGER,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

INSERT INTO hydration_logs (user_id, date, ounces) VALUES
  (1, '2025-02-12', 82),
  (1, '2025-02-13', 76),
  (1, '2025-02-14', 93),
  (1, '2025-02-15', 88),
  (1, '2025-02-16', 95),
  (2, '2025-02-12', 70),
  (2, '2025-02-13', 64),
  (2, '2025-02-14', 78),
  (2, '2025-02-15', 72),
  (2, '2025-02-16', 80);

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
  (1, '2025-02-16', 112, 138, 220),
  (2, '2025-02-16', 125, 142, 214);
