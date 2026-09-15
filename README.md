# Movie Booking App (Figma to Expo React Native)

A movie discovery and ticket booking mobile application built with **React Native (Expo SDK 54)** and a **Node.js Express backend** powered by **TMDB (The Movie Database)** APIs.

---

## 📱 Features

- **Figma Design Fidelity**: Pixel-accurate implementation of Poppins typography, brand palettes, interactive headers, navigation tabs, and cinema seat layouts.
- **Pure Live Data (Zero Dummy Data)**: Live upcoming movies, real-time debounced search, genre exploration, and full movie details fetched directly from TMDB via the backend service.
- **Official Trailers**: Modal trailer player with YouTube video playback.
- **Cinema Showtime & Date Picker**: Interactive show dates, hall selections (IMAX, Dolby Atmos, VIP), and pricing.
- **Interactive Seat Map**: 10-row theater map with left/center/right sections, VIP tiers, zoom controls, real-time bill calculation, and booking confirmation modal.

---

## 🛠 Tech Stack

- **Frontend**: React Native, Expo, TypeScript, React Navigation, Expo Linear Gradient, React Native SVG
- **Backend**: Node.js, Express, CORS, Dotenv, TMDB REST API

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- npm or yarn
- Expo Go app (on physical device) or web browser

### 2. Backend Setup
```bash
cd server
npm install
cp .env.example .env
# Edit server/.env and add your TMDB_API_KEY
npm start
```
The backend will run on `http://localhost:5001`.

### 3. Frontend Setup
```bash
# In project root:
npm install
cp .env.example .env
# Start Expo:
npx expo start
# Or press 'w' to run in the web browser
```

---

## 📄 License
MIT
