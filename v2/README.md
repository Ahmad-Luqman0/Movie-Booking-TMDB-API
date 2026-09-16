# Figma Movies App - Version 2 (v2)

**v2** features a high-performance **NestJS Cache-Aside Proxy** using **Native PostgreSQL** (`pg.Pool`) connected to an upgraded **React Native (Expo)** mobile application.

---

## 🏗️ Architecture Overview

```
Figma-App/v2/
├── backend/                  # NestJS + Native PostgreSQL Backend
│   ├── src/
│   │   ├── database/         # Native PostgreSQL Pool & Schema Initializer
│   │   ├── tmdb/             # Upstream TMDB API Client
│   │   ├── movies/           # Cache-Aside Controller & Service
│   │   ├── app.module.ts
│   │   └── main.ts           # Listening on Port 5002
│   ├── docker-compose.yml    # PostgreSQL Container configuration
│   ├── package.json
│   └── tsconfig.json
│
└── mobile/                   # React Native Client (Expo)
    ├── src/
    │   ├── components/
    │   │   ├── CachedImage.tsx       # CDN Image Caching & Placeholders
    │   │   ├── SkeletonLoader.tsx    # Loading Skeletons for Cache Misses
    │   │   ├── CustomTabBar.tsx      # Sticky Bottom Tab Navigation
    │   │   ├── GenreCard.tsx         # 2-Column Category Grid
    │   │   ├── SearchBar.tsx         # 300ms Debounced Auto-complete
    │   │   ├── SearchResultItem.tsx  # Results with Match & Cache Badges
    │   │   ├── MovieCard.tsx
    │   │   ├── TrailerModal.tsx
    │   │   ├── DateSelector.tsx
    │   │   ├── HallCard.tsx
    │   │   └── InteractiveSeatMap.tsx
    │   ├── screens/
    │   │   ├── WatchScreen.tsx       # Sub-second DB feed + skeletons
    │   │   ├── SearchScreen.tsx      # 2-col categories + 300ms debounced search
    │   │   ├── MovieDetailScreen.tsx # < Watch header, hero backdrop, CTAs
    │   │   ├── CinemaDateScreen.tsx  # Date & auditorium selection
    │   │   ├── SeatSelectionScreen.tsx # Interactive seat map & booking
    │   │   └── PlaceholderTabs.tsx
    │   ├── services/api.ts   # Connected to v3 NestJS port 5002
    │   └── navigation/
    ├── App.tsx
    ├── package.json
    └── tsconfig.json
```

---

## ⚡ Key Highlights

1. **Native PostgreSQL Persistence (No Prisma overhead)**:
   - Uses `pg.Pool` with parameterized SQL queries.
   - Automatically initializes `movies`, `genres`, and `movie_genres` tables with UUIDs and indices on startup.
   - Sub-second cache hits (< 5 milliseconds response time).
2. **Cache-Aside Gateway**:
   - `GET /api/v3/movies/featured`: Checks local PostgreSQL; falls back to TMDB `/movie/upcoming` on miss and persists records.
   - `GET /api/v3/movies/genres`: Serves local genre table; syncs from TMDB on miss.
   - `GET /api/v3/movies/search?q={query}`: Runs SQL `ILIKE` search locally first; queries TMDB if 0 matches found and stores results.
   - `GET /api/v3/movies/:id`: Checks local database for complete metadata/trailer; fetches rich TMDB details with credits & videos on miss.
   - `GET /api/v3/movies/discover?genre={genre}`: Instantaneous category filtering against local tables.
3. **Client UI & Navigation**:
   - **Sticky Bottom Navigation Bar**: `Dashboard`, `Watch`, `Media Library`, `More`.
   - **2-Column Genre Grid**: Visual category cards for instant category browsing.
   - **300ms Debounce Search**: Shows real-time auto-complete results with exact match count (e.g. `"3 Results Found"`).
   - **Movie Details Hero**: `< Watch` header, hero backdrop image, genre pills, synopsis, and interactive CTAs (**Get Tickets** and **Watch Trailer**).

---

## 🚀 Running v2

### 1. Start PostgreSQL (if not already running)
```bash
# Option A: Homebrew PostgreSQL (active on macOS)
brew services start postgresql@14

# Option B: Docker
cd v2/backend && docker compose up -d
```

### 2. Start the v2 NestJS Backend
```bash
cd v2/backend
npm run start:dev
# Server runs on http://localhost:5002
```

### 3. Start the v2 Mobile Client
```bash
cd v2/mobile
npx expo start
```
