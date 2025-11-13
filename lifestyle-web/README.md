# Lifestyle Web Dashboard

A Fitbit-inspired lifestyle monitoring experience that complements the MSML project with a modern web interface and API that mobile apps can also consume.  
The stack combines an Express.js backend, a lightweight SQLite data layer seeded from an SQL file, and a responsive front-end served from the same server.

## Features
- Email + password login for multiple users (seeded demo accounts).
- Token-based auth middleware that web and mobile clients can share.
- SQLite database seeded from `database/sql/lifestyle_metrics.sql`, keeping health, activity, and nutrition data versionable.
- Metric aggregation endpoints powering charts and insight cards.
- Responsive dashboard styled with gradients, glassmorphism, and Fitbit-like typography.
- AES-256-GCM encrypted session tokens signed with `SESSION_SECRET` so both the app and web dashboard can trust the same credentials.

## Project Structure
```
lifestyle-web/
├── README.md
├── database
│   ├── sql
│   │   └── lifestyle_metrics.sql   # Schema + sample data ingested on boot
│   └── storage/                    # SQLite DB file is created here at runtime
└── server
    ├── public                      # Vanilla JS + Chart.js powered UI
    │   ├── app.js
    │   ├── index.html
    │   └── styles.css
    └── src
        ├── routes
        │   ├── auth.js
        │   └── metrics.js
        ├── services
        │   └── session-store.js
        ├── utils
        │   ├── crypto.js
        │   └── load-sql.js
        ├── db.js
        └── server.js
```

## Getting Started
```bash
cd lifestyle-web/server
npm install
npm run dev
```

The server reads environment variables from `.env` (see `.env.example`). By default it listens on `http://localhost:4000`.

### Environment Variables
| Name | Description | Default |
| --- | --- | --- |
| `PORT` | HTTP port | `4000` |
| `APP_ORIGIN` | Comma-separated list of allowed origins for CORS | `http://localhost:4000` |
| `SESSION_TTL_HOURS` | Session lifetime | `12` |
| `SESSION_SECRET` | Secret used to derive AES-256-GCM key for tokens | `msml-lifestyle-monitor` |
| `DB_STORAGE_DIR` | Optional override for writable SQLite directory | `./database/storage` |
| `DB_SQL_DIR` | Optional override for SQL seed directory | `./database/sql` |

## Demo Accounts
| Email | Password | Role |
| --- | --- | --- |
| `avery.hart@example.com` | `athlete123` | Performance Coach |
| `leo.singh@example.com` | `mindful123` | Wellness Lead |

> The hashed credentials live inside the SQL seed so both the website and the native app can tap into the same auth + analytics pipeline.

## Next Steps
- Hook the `ios/` app (or any other client) to the `/api/login` and `/api/metrics` endpoints.
- Replace the seed SQL file with a production database or telemetry ingestion pipeline.
- Extend the metrics route with additional tables when new sensors come online.
