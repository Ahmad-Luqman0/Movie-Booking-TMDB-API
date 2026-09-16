# Figma Movies App - Version 3 (v3)

**v3** features a complete **NestJS Cache-Aside Proxy** using **Prisma ORM in the service layer** connected to an upgraded **React Native (Expo)** mobile application.

---

## 🏗️ Architecture Overview

```
Figma-App/v3/
├── backend/                  # NestJS + Prisma ORM Backend (Port 5003)
│   ├── prisma/
│   │   └── schema.prisma     # Prisma Schema mapped to PostgreSQL tables
│   ├── src/
│   │   ├── prisma/           # PrismaService & PrismaModule lifecycle
│   │   ├── tmdb/             # Upstream TMDB API Client
│   │   ├── movies/           # Cache-Aside Service (Prisma ORM) & Controller
│   │   ├── app.module.ts
│   │   └── main.ts           # Running on Port 5003
│   ├── package.json
│   └── tsconfig.json
│
└── mobile/                   # React Native Client (Expo)
    ├── src/
    │   ├── services/api.ts   # Pointing to http://localhost:5003/api/v3/movies
    │   ├── components/       # CustomTabBar, CachedImage, SkeletonLoader, SearchBar, etc.
    │   ├── screens/          # WatchScreen, SearchScreen, MovieDetailScreen, CinemaDate, SeatSelection
    │   └── navigation/
    ├── App.tsx
    ├── package.json
    └── tsconfig.json
```

---

## ⚡ Key Differences Between Versions

| Version | Database Strategy | Port | Service Layer Code Style |
| :--- | :--- | :--- | :--- |
| **v1** | In-memory Express proxy | `5001` | Direct HTTP pass-through to TMDB |
| **v2** | Native PostgreSQL | `5002` | Direct SQL queries via `pg.Pool` |
| **v3** | **Prisma ORM + PostgreSQL** | **`5003`** | **Type-safe Prisma client methods (`this.prisma.movie.*`)** |

---

## 🚀 How to Run v3

### 1. Ensure PostgreSQL is running
```bash
brew services start postgresql@14
```

### 2. Start the v3 NestJS Backend
```bash
cd "v3/backend"
npm run start:dev
# Backend starts on http://localhost:5003
```

### 3. Start the v3 Mobile Client
```bash
cd "v3/mobile"
npx expo start
```
- Press **`w`** to open in web browser.
- Or scan the QR code with **Expo Go** on iOS / Android.
