# MSML Lifestyle Mobile (React Native)

A React Native + Expo client that mirrors the MSML Lifestyle dashboard so athletes and coaches can monitor readiness, vitals, nutrition, activity, and roster insights from mobile devices. The app consumes the existing Express/SQLite API that powers the `lifestyle-web` project and adds an offline-aware mutation queue so logs can be captured without connectivity.

## Requirements

- Node.js 18+
- npm or yarn
- Expo CLI (`npx expo` is sufficient)

## Getting started

```bash
cd lifestyle-mobile
cp .env.example .env            # update API URLs
npm install                     # installs Expo + React Native deps
npm run start                   # launches Expo dev server
```

The default `.env.example` assumes the API is available at `http://localhost:4000`. When deploying, point `EXPO_PUBLIC_API_BASE_URL` to the public URL of the lifestyle server and `EXPO_PUBLIC_WEB_APP_ORIGIN` to the web dashboard (used for deep links).

## Feature parity

The mobile app implements the same major surfaces as the web UI:

- **Authentication + password reset** using the `/api/login`, `/api/signup`, and `/api/password` routes.
- **Overview dashboard** with readiness ring, hydration, macro targets, and timeline charts from `/api/metrics`.
- **Activity + Sessions** with Strava connectivity plus best efforts, recent workouts, split breakdowns, and the same mileage/training-load/pace charts from `/api/activity`.
- **Coach subject switching** mirrors the web dashboard with the "My dashboard" chip and roster stats so coaches can bounce between themselves and linked athletes.
- **Vitals** 14‑day trends and latest readings from `/api/vitals`.
- **Nutrition** day selector, collapsible macro targets/log entry forms with barcode + weight-aware inputs (with offline queue), and monthly trends from `/api/nutrition`.
- **Weight** logging and trends with offline queue via `/api/weight`.
- **Roster + Sharing** for coaches using `/api/athletes` and `/api/share`.
- **Profile + Admin** for updating account details and managing roles via `/api/profile` and `/api/admin`.
- **Navigation + auth** mirrors the responsive web dashboard with a visible drawer toggle and logout action so switching pages/accounts works the same way.
- **Profile photos** snap a picture during signup or from Profile, syncing the avatar (or URL) directly to the shared user record.

Subject switching is available to coaches so they can view linked athletes just like the browser experience.

## Offline sync queue

Mutations that write data (weight logs, nutrition entries) route through `SyncProvider`, which:

1. Tries the network immediately using the active auth token.
2. Falls back to persisting the request (endpoint, payload, description) in AsyncStorage when offline.
3. Replays queued mutations automatically when network connectivity returns.

React Query caches GET responses locally so previously viewed screens remain visible while offline.

## Project structure

```
App.tsx                # font loading + NavigationContainer
app.config.js          # Expo config + env bindings
src/
  api/                 # API client, typed endpoints, response models
  components/          # Themed UI building blocks
  features/            # Screen implementations per domain
  navigation/          # Auth stack + drawer navigator
  providers/           # Auth, subject, connectivity, sync contexts
  theme/               # Color + spacing tokens ported from styles.css
```

## Running on devices

The app is managed by Expo, so you can develop on any platform (no macOS required). Use the Expo Go app or `npx expo run:ios` / `npx expo run:android` when native builds are needed. All network calls go to the same API origin you configure in `.env`.
