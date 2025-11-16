require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Ensure database initializes before routes use it.
require('./db'); // eslint-disable-line import/no-unassigned-import

const normalizeOrigin = (value = '') => value.trim().replace(/\/+$/, '').toLowerCase();

const defaultOrigins = [
  'http://localhost:4000',
  'http://127.0.0.1:4000',
  'http://localhost:8081',
  'http://localhost:8082',
  'http://localhost:8083',
  'http://127.0.0.1:8083',
  'http://localhost:19006',
];

function resolveAllowedOrigins(override) {
  const configured = (override || process.env.APP_ORIGIN || defaultOrigins.join(','))
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);

  const allowAllOrigins = configured.includes('*');
  const allowedOrigins = allowAllOrigins
    ? configured.filter((origin) => origin !== '*')
    : configured;

  return {
    allowAllOrigins,
    allowedOrigins,
    allowedOriginsSet: new Set(allowedOrigins),
  };
}

function createHttpsMiddleware(requireHttps) {
  if (!requireHttps) {
    return null;
  }
  return (req, res, next) => {
    const protoHeader = (req.get('x-forwarded-proto') || '').split(',')[0].trim().toLowerCase();
    const protocol = protoHeader || (req.protocol || '').toLowerCase();
    if (protocol === 'https') {
      return next();
    }

    if (req.method === 'GET' || req.method === 'HEAD') {
      const host = req.get('host');
      if (host) {
        return res.redirect(301, `https://${host}${req.originalUrl}`);
      }
    }
    return res.status(403).json({ message: 'HTTPS required.' });
  };
}

function createApp(options = {}) {
  const app = express();
  const bodyLimit = options.bodyLimit || process.env.API_BODY_LIMIT || '6mb';
  const requireHttps = options.requireHttps ?? process.env.REQUIRE_HTTPS === 'true';
  const { allowAllOrigins, allowedOrigins, allowedOriginsSet } = resolveAllowedOrigins(
    options.appOrigin
  );

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

  // Expose CORS config for logging and tests.
  app.locals.cors = { allowAllOrigins, allowedOrigins };

  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
    })
  );

  const httpsMiddleware = createHttpsMiddleware(requireHttps);
  if (httpsMiddleware) {
    app.use(httpsMiddleware);
  }

  app.use(cors(corsOptions));
  app.use(express.json({ limit: bodyLimit }));
  app.use(
    express.urlencoded({
      extended: false,
      limit: bodyLimit,
    })
  );

  app.use((error, req, res, next) => {
    if (error && error.type === 'entity.too.large') {
      return res
        .status(413)
        .json({ message: 'Upload too large. Try a smaller image (under 5 MB).' });
    }
    if (error) {
      return res.status(400).json({ message: error.message || 'Invalid request payload.' });
    }
    return next();
  });

  app.use('/api/login', require('./routes/auth'));
  app.use('/api/signup', require('./routes/signup'));
  app.use('/api/metrics', require('./routes/metrics'));
  app.use('/api/athletes', require('./routes/athletes'));
  app.use('/api/share', require('./routes/share'));
  app.use('/api/admin', require('./routes/admin'));
  app.use('/api/profile', require('./routes/profile'));
  app.use('/api/password', require('./routes/password'));
  app.use('/api/nutrition', require('./routes/nutrition'));
  app.use('/api/activity', require('./routes/activity'));
  app.use('/api/vitals', require('./routes/vitals'));
  app.use('/api/weight', require('./routes/weight'));
  app.use('/api/streams', require('./routes/streams'));

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
  });

  return app;
}

module.exports = createApp;
