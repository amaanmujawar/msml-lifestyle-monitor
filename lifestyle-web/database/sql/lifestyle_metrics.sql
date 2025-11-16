DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS coach_athlete_links;
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

CREATE TABLE coach_athlete_links (
  id INTEGER PRIMARY KEY,
  coach_id INTEGER NOT NULL,
  athlete_id INTEGER NOT NULL,
  UNIQUE (coach_id, athlete_id),
  FOREIGN KEY (coach_id) REFERENCES users (id),
  FOREIGN KEY (athlete_id) REFERENCES users (id)
);

INSERT INTO users (id, name, email, password_hash, role, avatar_url, goal_steps, goal_calories, goal_sleep, goal_readiness)
VALUES
  (1, 'Avery Hart', 'avery.hart@example.com', '8f927203b5777f8b90cdfc41eb9f24593959e5057283b1856567ff3f6cd93092', 'Performance Coach', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80', 13000, 2500, 7.7, 88),
  (2, 'Leo Singh', 'leo.singh@example.com', 'd433f9c9a6da4fa32df977cf8f9ea2a355f66516ff30f31d2530f93030c6aa90', 'Wellness Lead', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80', 10000, 2200, 8.2, 82),
  (3, 'David Cracknell', 'david.cracknell@example.com', '777a025f5ca4a20f7bafee940f2820e28e1f4bbcbd9dd774bbce883166ef7c55', 'Head Coach', 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=200&q=80', NULL, NULL, NULL, NULL);

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
http://localhost:4000
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
