const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from server/.env, fallback to root .env
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env') });

const {
  getMovieDetailsFromTmdb,
  getUpcomingMoviesFromTmdb,
  searchMoviesFromTmdb,
  discoverMoviesByGenre,
  getMovieGenresFromTmdb,
  getTvGenresFromTmdb,
} = require('./services/tmdbService');

const app = express();
const PORT = process.env.PORT || 5001;
const TMDB_API_KEY = process.env.TMDB_API_KEY || process.env.TMDB_API_READ_ACCESS_TOKEN;
const TMDB_BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = process.env.TMDB_IMAGE_BASE || 'https://image.tmdb.org/t/p';

app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'TMDB Movie Details Backend',
    port: PORT,
    hasApiKey: Boolean(TMDB_API_KEY),
  });
});

// Movie genres endpoint (/3/genre/movie/list)
app.get('/api/genres/movies', async (req, res) => {
  try {
    if (!TMDB_API_KEY) {
      return res.status(500).json({
        error: 'TMDB_API_KEY is not configured in server/.env',
      });
    }
    const genres = await getMovieGenresFromTmdb(TMDB_API_KEY, TMDB_BASE_URL);
    res.json(genres);
  } catch (error) {
    console.error('Error fetching movie genres:', error.message);
    res.status(500).json({
      error: 'Failed to fetch movie genres from TMDB',
      message: error.message,
    });
  }
});

// TV genres endpoint (/3/genre/tv/list)
app.get('/api/genres/tv', async (req, res) => {
  try {
    if (!TMDB_API_KEY) {
      return res.status(500).json({
        error: 'TMDB_API_KEY is not configured in server/.env',
      });
    }
    const genres = await getTvGenresFromTmdb(TMDB_API_KEY, TMDB_BASE_URL);
    res.json(genres);
  } catch (error) {
    console.error('Error fetching TV genres:', error.message);
    res.status(500).json({
      error: 'Failed to fetch TV genres from TMDB',
      message: error.message,
    });
  }
});

// Search movies endpoint
app.get('/api/movies/search', async (req, res) => {
  const { query } = req.query;
  try {
    if (!TMDB_API_KEY) {
      return res.status(500).json({
        error: 'TMDB_API_KEY is not configured in server/.env',
      });
    }

    const results = await searchMoviesFromTmdb(
      query,
      TMDB_API_KEY,
      TMDB_BASE_URL,
      TMDB_IMAGE_BASE
    );

    res.json(results);
  } catch (error) {
    console.error('Error searching movies:', error.message);
    res.status(500).json({
      error: 'Failed to search movies from TMDB',
      message: error.message,
    });
  }
});

// Discover movies by genre endpoint
app.get('/api/movies/discover', async (req, res) => {
  const { genre } = req.query;
  try {
    if (!TMDB_API_KEY) {
      return res.status(500).json({
        error: 'TMDB_API_KEY is not configured in server/.env',
      });
    }

    const results = await discoverMoviesByGenre(
      genre,
      TMDB_API_KEY,
      TMDB_BASE_URL,
      TMDB_IMAGE_BASE
    );

    res.json(results);
  } catch (error) {
    console.error('Error discovering movies by genre:', error.message);
    res.status(500).json({
      error: 'Failed to discover movies from TMDB',
      message: error.message,
    });
  }
});

// Upcoming movies endpoint
app.get('/api/movies/upcoming', async (req, res) => {
  try {
    if (!TMDB_API_KEY) {
      return res.status(500).json({
        error: 'TMDB_API_KEY is not configured in server/.env',
      });
    }

    const upcoming = await getUpcomingMoviesFromTmdb(
      TMDB_API_KEY,
      TMDB_BASE_URL,
      TMDB_IMAGE_BASE
    );

    res.json(upcoming);
  } catch (error) {
    console.error('Error fetching upcoming movies:', error.message);
    res.status(500).json({
      error: 'Failed to fetch upcoming movies',
      message: error.message,
    });
  }
});

// Movie details endpoint
app.get('/api/movies/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (!TMDB_API_KEY) {
      return res.status(500).json({
        error: 'TMDB_API_KEY is not configured in server/.env',
      });
    }

    const movieDetails = await getMovieDetailsFromTmdb(
      id,
      TMDB_API_KEY,
      TMDB_BASE_URL,
      TMDB_IMAGE_BASE
    );

    res.json(movieDetails);
  } catch (error) {
    console.error(`Error fetching movie details for id '${id}':`, error.message);
    res.status(500).json({
      error: 'Failed to fetch movie details from TMDB',
      message: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Movie Details Backend listening on port ${PORT}`);
  console.log(`Health Check: http://localhost:${PORT}/api/health`);
  console.log(`The King's Man: http://localhost:${PORT}/api/movies/kings-man`);
});
