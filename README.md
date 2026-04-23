# JukeBoxd

A social music discovery app: reviews and ratings for songs and albums, playlists, profiles, and activity—backed by **Supabase** and **Spotify’s** catalog. Ships as a responsive web app and can be wrapped for **iOS/Android** with **Capacitor**.

**Live:** [jukeboxd.ca](https://www.jukeboxd.ca/)

---

## Features

- **Reviews & ratings** for tracks and albums
- **Spotify catalog** search and metadata (client uses a server-issued token; see [Environment](#environment-variables))
- **Playlists** with drag-and-drop ordering (Hello Pangea DnD)
- **Profiles & social** following, discovery, and activity
- **Supabase Auth** for sign-in and sessions
- **TanStack Query** for data fetching and caching
- **Tailwind CSS** + Radix-based UI components
- **Optional previews** via a Supabase Edge Function (`enrich-preview`) used from the client where configured

---

## Screenshots

<img width="1879" height="1208" alt="Album" src="https://github.com/user-attachments/assets/f8a2b689-7a0d-43c4-bfa3-295c613b3a8e" />
<img width="446" height="1012" alt="HomePhone" src="https://github.com/user-attachments/assets/96f72740-97fa-4776-a1a0-da54c9cc5d28" />
<img width="1897" height="1011" alt="Trending" src="https://github.com/user-attachments/assets/026f9a4c-d9a5-4471-b7d5-c4a28bb56899" />
<img width="1900" height="1005" alt="Profile" src="https://github.com/user-attachments/assets/7d106882-8def-4fca-a3fd-a8ce2c555637" />
<img width="1894" height="1011" alt="Library" src="https://github.com/user-attachments/assets/41b674d4-73fc-438b-b439-ad6cf32f47ce" />
<img width="1894" height="1011" alt="Playlists" src="https://github.com/user-attachments/assets/21732719-47a7-4d65-9431-98fe9ddec998" />

---

## Tech stack

| Area | Details |
|------|---------|
| **App** | React 18, TypeScript, Vite, React Router 7 |
| **UI** | Tailwind CSS, Radix UI, Framer Motion, Recharts, Swiper |
| **Data & auth** | Supabase (Postgres, Auth, Edge Functions) |
| **Music API** | Spotify Web API (client credentials via Vercel serverless route) |
| **Mobile shell** | Capacitor (Android / iOS), Status Bar plugin |
| **Hosting** | Vercel (SPA rewrites + `/api/*` serverless) |

---

## Prerequisites

- **Node.js** 18+
- **npm** (or compatible package manager)
- A **Supabase** project: [supabase.com](https://supabase.com)
- A **Spotify** app (for Client ID / Client Secret): [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)

---

## Environment variables

### Frontend (`.env.local` in the repo root)

These are read by Vite (`import.meta.env`).

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_anon_key
# Optional; used in some API helpers if set
VITE_SUPABASE_PROJECT_ID=your_supabase_project_ref
```

### Spotify token route (Vercel / server)

Search and catalog calls use `GET /api/spotify-token`, implemented in `api/spotify-token.ts`. Configure these where you run that function (e.g. **Vercel project environment variables**), not in `VITE_*` vars:

```env
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
```

**Local development:** `npm run dev` serves the Vite app only; `/api/*` is provided in production by Vercel. For full Spotify search locally, use [`vercel dev`](https://vercel.com/docs/cli/dev) from the project root (with the same `SPOTIFY_*` vars), or rely on a deployed preview/production URL.

---

## Clone and run

```bash
git clone https://github.com/not-finley/jukebox.git
cd jukebox
npm install
```

Create `.env.local` as in [Environment variables](#environment-variables), then:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Scripts

```bash
npm install          # dependencies
npm run dev          # Vite dev server (default http://localhost:5173)
npm run build        # Typecheck + production build → dist/
npm run preview      # Preview the production build locally
npm run lint         # ESLint
```

---

## Mobile (Capacitor)

The native projects live under `android/` and `ios/` (when present). Typical workflow after a web release:

```bash
npm run build
npx cap sync
```

Then open the native workspace (e.g. **Android Studio** → `android/`, or **Xcode** → `ios/App`) to run on a device or emulator. App id: `ca.jukeboxd.app` (see `capacitor.config.ts`).

---

## Roadmap

**Done (high level)**  
Auth & profiles · Reviews & ratings · Spotify-backed search & pages · Playlists · Social follow & activity · Trending surfaces · Responsive + Capacitor shell

**Next**  
Personalized recommendations · Collaborative playlists · Listening / “Wrapped-style” insights · Deeper mobile polish (OAuth redirects, safe areas, offline behavior) · Play Store / App Store releases

---

## Contributing

1. Fork the repository  
2. Create a branch: `feature/your-feature-name`  
3. Commit and push  
4. Open a pull request  

---

## Acknowledgments

- [Spotify Web API](https://developer.spotify.com/documentation/web-api/)
- [Supabase](https://supabase.com/)
- [Vercel](https://vercel.com/)
- [React](https://react.dev/)

---

## Contact

- **Email:** [fharriso@uwaterloo.ca](mailto:fharriso@uwaterloo.ca)  
- **GitHub:** [not-finley](https://github.com/not-finley)  
- **LinkedIn:** [Finley Harrison](https://www.linkedin.com/in/finley-harrison-163b16291/)
