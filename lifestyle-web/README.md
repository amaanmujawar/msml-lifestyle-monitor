# Lifestyle Web Dashboard

A Fitbit-inspired lifestyle monitoring experience that complements the MSML project with a modern web interface and API that mobile apps can also consume.  
The stack combines an Express.js backend, a lightweight SQLite data layer seeded from an SQL file, and a responsive front-end served from the same server.

## Features
- Email + password login plus inline sign-up (seeded demo accounts included). You can enter the full email, the full name, the first name, or the email handle (text before `@`) when signing in.
- Sign-in accepts either the account email or the username, making demo logins quicker.
- Avatar picker during sign-up so every athlete can choose an icon or drop in their own PNG/WebP link.
- Coach leaderboard + athlete switching so trainers can review multiple shared dashboards from one login.
- Athletes can share access with a coach by entering their email (also exposed via `/api/share`).
- Head coaches can promote/demote members between coach and athlete roles or delete inactive accounts via the `/api/admin` endpoints.
- Token-based auth middleware that web and mobile clients can share.
- SQLite database seeded from `database/sql/lifestyle_metrics.sql`, keeping health, activity, and nutrition data versionable.
- Metric aggregation endpoints powering charts and insight cards.
- Responsive dashboard styled with gradients, glassmorphism, and Fitbit-like typography.
- AES-256-GCM encrypted session tokens signed with `SESSION_SECRET` so both the app and web dashboard can trust the same credentials.
- `/api/signup` seeds a baseline wellness timeline for every new account so the dashboard lights up instantly.

> Coaches gain visibility into athlete data through the `coach_athlete_links` table, which powers the ranking board and cross-account sharing.

### Role access hierarchy
- **Head Coach** accounts appear at the top of the Team Board, can switch into every other user’s dashboard, promote/demote members between roles, and delete accounts when necessary.
- **Coaches** can see their own data plus any linked athletes defined in `coach_athlete_links`.
- **Athletes** only see their personal dashboard but can still add avatars during sign-up and invite coaches via the Share Data panel.

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
        │   ├── athletes.js
        │   ├── auth.js
        │   ├── metrics.js
        │   ├── share.js
        │   ├── admin.js
        │   └── signup.js
        ├── services
        │   └── session-store.js
        ├── utils
        │   ├── crypto.js
        │   ├── load-sql.js
        │   └── role.js
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

### Serving Beyond Localhost
1. Copy `.env.example` to `.env` and set `HOST=0.0.0.0` (or the specific interface to bind) plus the port you want to expose.
2. Update `APP_ORIGIN` with every public URL you expect browsers to load the dashboard from (comma-separated). Set `APP_ORIGIN=*` only if you explicitly want to allow any origin.
3. Open the chosen TCP port in your firewall/router and forward it to this machine. When deploying behind HTTPS, point your reverse proxy at `http://127.0.0.1:PORT` and include the final HTTPS origin in `APP_ORIGIN`.
4. Restart the server (`npm run start` or your process manager) and verify an external request works with `curl http://<your-public-host>:PORT/api/health`.

### Environment Variables
| Name | Description | Default |
| --- | --- | --- |
| `PORT` | HTTP port | `4000` |
| `HOST` | Interface the server binds to | `0.0.0.0` |
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
| `david.cracknell@example.com` | `coach123` | Head Coach (full visibility) |

> The hashed credentials live inside the SQL seed so both the website and the native app can tap into the same auth + analytics pipeline. Prefer to create your own login? Use the "Create account" tab on the landing page or POST to `/api/signup`.

## Next Steps
- Hook the `ios/` app (or any other client) to the `/api/login`, `/api/signup`, `/api/athletes`, `/api/share`, `/api/admin`, and `/api/metrics` endpoints.
- Replace the seed SQL file with a production database or telemetry ingestion pipeline.
- Extend the metrics route with additional tables when new sensors come online.
- If you previously ran the project, delete `database/storage/lifestyle_monitor.db` once so the updated seed (roles, links, and head coach account) can be recreated.
