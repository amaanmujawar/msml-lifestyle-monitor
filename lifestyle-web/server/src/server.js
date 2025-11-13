require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');

// Ensure database initializes before routes use it
require('./db'); // eslint-disable-line import/no-unassigned-import

const authRoutes = require('./routes/auth');
const metricsRoutes = require('./routes/metrics');

const app = express();
const PORT = process.env.PORT || 4000;

const allowedOrigins = (process.env.APP_ORIGIN || 'http://localhost:4000')
  .split(',')
  .map((origin) => origin.trim());

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

app.use('/api/login', authRoutes);
app.use('/api/metrics', metricsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Lifestyle dashboard listening on http://localhost:${PORT}`);
});
