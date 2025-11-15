# Lifestyle Web Dashboard

A Fitbit-inspired lifestyle monitoring experience that complements the MSML project with a modern web interface and API that mobile apps can also consume.  
The stack combines an Express.js backend, a lightweight SQLite data layer seeded from an SQL file, and a responsive front-end served from the same server.

## Features
- Email + password login plus inline sign-up (seeded demo accounts included). You can enter the full email, the full name, the first name, or the email handle (text before `@`) when signing in.
- Avatar picker during sign-up so every athlete can choose an icon or drop in their own PNG/WebP link.
- Coach leaderboard + athlete switching so trainers can review multiple shared dashboards from one login.
- Athletes can share access with a coach by entering their email (also exposed via `/api/share`).
- Newly created accounts start empty; cards and charts explain that telemetry hasn’t synced yet.
- Data isolation is enforced at the API layer—only the owner, linked coaches, or head coaches can view a dashboard (`/api/athletes` + `/api/metrics`).
- Dedicated profile screen lets users change their display name, email, or password after re-entering their current password (via `/api/profile`), with uniqueness enforced.
- Forgot-password flow generates a reset token and logs the email link to the server console in development (via `/api/password/forgot` + `/api/password/reset`).
- Head coaches can promote/demote members between coach and athlete roles or delete inactive accounts via the `/api/admin` endpoints.
- Token-based auth middleware that web and mobile clients can share.
- SQLite database seeded from `database/sql/lifestyle_metrics.sql`, keeping health, activity, and nutrition data versionable.
- Metric aggregation endpoints powering charts and insight cards.
- Activity Tracking page surfaces Garmin/Apple Watch-style metrics with run charts, splits, and Strava importing.
- Athletes can store their Strava client ID/secret/redirect URL in Profile, then connect and sync their own activities without touching server config.
- Responsive dashboard styled with gradients, glassmorphism, and Fitbit-like typography.
- AES-256-GCM encrypted session tokens signed with `SESSION_SECRET` so both the app and web dashboard can trust the same credentials.
- `/api/signup` auto logs the new account in so they can immediately invite coaches or start sending telemetry.
- `/api/profile` lets authenticated users update their account details (with current-password confirmation).

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
        │   ├── activity.js
        │   ├── admin.js
        │   ├── athletes.js
        │   ├── auth.js
        │   ├── metrics.js
        │   ├── share.js
        │   └── signup.js
        ├── services
        │   ├── session-store.js
        │   └── strava.js
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
| `PASSWORD_ENCRYPTION_KEY` | Secret used to derive the AES-256-GCM key that encrypts stored password digests | `msml-lifestyle-monitor-passwords` |
| `DB_STORAGE_DIR` | Optional override for writable SQLite directory | `./database/storage` |
| `DB_SQL_DIR` | Optional override for SQL seed directory | `./database/sql` |
| `HEAD_COACH_SEED_PASSWORD` | Optional override for the head coach demo password | `coach123` |
| `SEED_AVERY_PASSWORD` | Optional override for Avery's demo password | `athlete123` |
| `SEED_LEO_PASSWORD` | Optional override for Leo's demo password | `mindful123` |
| `STRAVA_CLIENT_ID` | OAuth client ID from https://www.strava.com/settings/api | — |
| `STRAVA_CLIENT_SECRET` | OAuth client secret from Strava | — |
| `STRAVA_REDIRECT_URI` | HTTPS URL that Strava should redirect back to (must end with `/api/activity/strava/callback`) | — |
| `STRAVA_SCOPE` | Optional scope override for Strava requests | `read,activity:read_all` |

These environment variables act as fallbacks for deployments that manage one shared Strava application. Individual athletes can store their own client credentials under **Profile → Strava connection keys**.

### Strava Linking
1. Create a Strava developer application (https://www.strava.com/settings/api) and point the authorization callback URL to `https://your-domain/api/activity/strava/callback` (include the full scheme + host/port).
2. Sign in to the Lifestyle dashboard, open **Profile → Strava connection keys**, and paste your client ID, client secret, and redirect URL. These credentials are stored privately against your account.
3. Restart `npm run dev` if you changed any server-side environment variables. Node.js 18+ is recommended because the integration relies on the built-in `fetch` implementation.
4. Navigate to the Activity tab and click **Connect Strava**. Authorize the Lifestyle app in the pop-up window.
5. Once linked, use **Sync latest** whenever you want to pull Garmin/Apple Watch-equivalent metrics (distance, pace, HR, training load, splits) straight from Strava.

### Password Storage
- Passwords are converted to a SHA-256 digest and then encrypted with AES-256-GCM using the `PASSWORD_ENCRYPTION_KEY`. The resulting value (`iv:authTag:ciphertext`) is what gets persisted in SQLite.
- Because the encryption is keyed, changing `PASSWORD_ENCRYPTION_KEY` after users exist invalidates their hashes. Rotate the key only when you plan to reset everyone’s password or replace the SQLite file.
- The three demo accounts (below) are automatically re-encrypted at startup using the configured seed password env vars so you can override them without editing SQL.

## Demo Accounts
| Email | Password | Role |
| --- | --- | --- |
| `avery.hart@example.com` | `athlete123` | Coach |
| `leo.singh@example.com` | `mindful123` | Athlete |
| `david.cracknell@example.com` | `coach123` | Head Coach (full visibility) |

> The hashed credentials live inside the SQL seed so both the website and the native app can tap into the same auth + analytics pipeline. Prefer to create your own login? Use the "Create account" tab on the landing page or POST to `/api/signup`.

## Next Steps
- Hook the `ios/` app (or any other client) to the `/api/login`, `/api/signup`, `/api/athletes`, `/api/share`, `/api/admin`, `/api/profile`, `/api/password/*`, and `/api/metrics` endpoints.
- Replace the seed SQL file with a production database or telemetry ingestion pipeline.
- Extend the metrics route with additional tables when new sensors come online.
- If you previously ran the project, delete `database/storage/lifestyle_monitor.db` once so the updated seed (roles, links, and head coach account) can be recreated.
