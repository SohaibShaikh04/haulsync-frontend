# HaulSync — Frontend

> Enterprise truck route planning and FMCSA Hours of Service compliance dashboard, built with React + Vite.

HaulSync is a mission-control-style logistics application for commercial trucking. Enter your current location, pickup, dropoff, and hours used in the current cycle — and get back an interactive route map, HOS-compliant stop timeline, and FMCSA-standard daily ELD logs.

**Live demo:** [haulsync-frontend.vercel.app](https://haulsync-frontend.vercel.app)

---

## Features

- 🗺 **Interactive route map** — MapLibre GL + CartoDB dark tiles, animated route polyline, fly-to on timeline click
- ⚡ **FMCSA HOS engine** — 11-hr drive limit, 14-hr shift window, 30-min mandatory break, 10-hr sleeper berth, 70-hr/8-day cycle
- 📋 **ELD Daily Logs** — authentic FMCSA Driver Daily Log grid drawn in SVG with animated duty-status lines, multi-day pagination
- 🌗 **Light / Dark mode** — toggle persisted to localStorage
- 📱 **Fully responsive** — desktop 3-column layout, tablet 2-column, mobile single-panel with bottom tab navigation

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite |
| State | Zustand |
| Data Fetching | TanStack Query |
| Animations | Framer Motion |
| Map | MapLibre GL JS |
| Styling | Vanilla CSS + CSS Variables |
| Deployment | Vercel |

---

## Local Setup

### 1. Prerequisites
- Node.js 18+
- npm 9+
- The [HaulSync backend](https://github.com/SohaibShaikh04/haulsync-backend) running locally on port 8000

### 2. Clone and install

```bash
git clone https://github.com/SohaibShaikh04/haulsync-frontend.git
cd haulsync-frontend
npm install
```

### 3. Environment variables

Create a `.env.local` file in the project root:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

> In development, Vite also proxies `/api` to `http://127.0.0.1:8000` automatically (see `vite.config.js`).

### 4. Start development server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Build production bundle to `dist/` |
| `npm run preview` | Preview production build locally |

---

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── AppHeader.jsx       # Header with theme toggle
│   │   ├── TripPlanner.jsx     # Left panel — trip input form
│   │   ├── CenterPanel.jsx     # Map / ELD toggle panel
│   │   ├── MapPanel.jsx        # MapLibre route map
│   │   ├── ELDViewer.jsx       # FMCSA daily log grid
│   │   ├── HOSPanel.jsx        # Right panel — HOS gauges + timeline
│   │   └── Timeline.jsx        # Stop-by-stop event timeline
│   ├── services/
│   │   └── api.js              # Axios client pointing to backend
│   ├── store/
│   │   └── tripStore.js        # Zustand global state
│   ├── styles/
│   │   └── theme.css           # Light mode vars + responsive breakpoints
│   ├── App.jsx                 # Root layout + theme + mobile tabs
│   └── index.css               # Design system (CSS variables, components)
├── .env.production             # Production API URL for Vercel
├── vite.config.js              # Dev proxy config
└── vercel.json                 # SPA routing rewrite rules
```

---

## Deployment (Vercel)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. Framework preset: **Vite**
4. Add environment variable:
   - `VITE_API_BASE_URL` = your Render backend URL (e.g. `https://haulsync-backend.onrender.com`)
5. Deploy — Vercel auto-redeploys on every push to `main`

> The `vercel.json` rewrites all routes to `index.html` for client-side routing.

---

## Backend

The frontend requires the [HaulSync Django backend](https://github.com/SohaibShaikh04/haulsync-backend) for:
- Trip planning and HOS calculation (`POST /api/trips/plan/`)
- Server-side geocoding (`GET /api/geocode/`)
