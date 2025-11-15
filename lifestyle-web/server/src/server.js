require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');

// Ensure database initializes before routes use it
require('./db'); // eslint-disable-line import/no-unassigned-import

const authRoutes = require('./routes/auth');
const signupRoutes = require('./routes/signup');
const metricsRoutes = require('./routes/metrics');
const athletesRoutes = require('./routes/athletes');
const shareRoutes = require('./routes/share');
const adminRoutes = require('./routes/admin');
const profileRoutes = require('./routes/profile');
const passwordRoutes = require('./routes/password');
const nutritionRoutes = require('./routes/nutrition');
const activityRoutes = require('./routes/activity');
const vitalsRoutes = require('./routes/vitals');
const weightRoutes = require('./routes/weight');

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const HOST = process.env.HOST || '0.0.0.0';

const normalizeOrigin = (value = '') => value.trim().replace(/\/+$/, '').toLowerCase();

const rawAllowedOrigins = (process.env.APP_ORIGIN || 'http://localhost:4000')
  .split(',')
  .map((origin) => normalizeOrigin(origin))
  .filter(Boolean);
const allowAllOrigins = rawAllowedOrigins.includes('*');
const allowedOrigins = allowAllOrigins
  ? rawAllowedOrigins.filter((origin) => origin !== '*')
  : rawAllowedOrigins;
const allowedOriginsSet = new Set(allowedOrigins);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowAllOrigins) {
      return callback(null, true);
    }

    const normalizedOrigin = normalizeOrigin(origin);
    if (allowedOriginsSet.has(normalizedOrigin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

app.use('/api/login', authRoutes);
app.use('/api/signup', signupRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/athletes', athletesRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/password', passwordRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/vitals', vitalsRoutes);
app.use('/api/weight', weightRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, HOST, () => {
  const hostLabel = HOST === '0.0.0.0' ? 'localhost' : HOST;
  console.log(`Lifestyle dashboard listening on http://${hostLabel}:${PORT}`);
  if (allowAllOrigins) {
    console.log('CORS: accepting requests from any origin (APP_ORIGIN=*).');
  } else {
    console.log(`CORS whitelist: ${allowedOrigins.join(', ') || '(none)'}`);
  }
});
