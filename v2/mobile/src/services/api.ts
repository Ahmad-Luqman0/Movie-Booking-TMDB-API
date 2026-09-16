import { Platform } from 'react-native';
import { Movie } from '../types';

const getApiBaseUrl = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    return `http://${window.location.hostname}:5002/api/v3/movies`;
  }
  return 'http://localhost:5002/api/v3/movies';
};

const API_BASE_URL = getApiBaseUrl();

export interface SearchResponse {
  query: string;
  matchCount: number;
  source: 'cache' | 'network';
  results: MovieSearchResult[];
}

export interface MovieSearchResult {
  id: string;
  tmdbId?: number;
  title: string;
  overview?: string;
  releaseDate?: string;
  formattedDate?: string;
  rating?: string;
  category?: string;
  posterUrl: string | null;
  backdropUrl?: string | null;
  genres?: string[];
  genreColorKeys?: string[];
  source?: 'cache' | 'network';
}

export interface GenreItem {
  id: string;
  tmdbId: number;
  name: string;
}

/**
 * Fetch featured (upcoming/now playing) movies from v3 NestJS proxy
 */
export async function fetchFeaturedMovies(): Promise<Movie[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(`${API_BASE_URL}/featured`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) return [];

    const data = await response.json();
    if (Array.isArray(data)) {
      return data.map((m: any) => ({
        id: String(m.id || m.tmdbId),
        tmdbId: m.tmdbId,
        title: m.title || '',
        releaseDate: m.releaseDate || '',
        formattedDate: m.formattedDate || '',
        posterImage: m.posterUrl
          ? { uri: m.posterUrl }
          : m.backdropUrl
          ? { uri: m.backdropUrl }
          : undefined,
        heroImage: m.backdropUrl
          ? { uri: m.backdropUrl }
          : m.posterUrl
          ? { uri: m.posterUrl }
          : undefined,
        genres: Array.isArray(m.genres) ? m.genres : [],
        genreColorKeys: Array.isArray(m.genreColorKeys) ? m.genreColorKeys : ['teal'],
        overview: m.overview || '',
        rating: m.rating || '',
        duration: m.duration,
        director: m.director,
        trailerKey: m.trailer?.key,
        youtubeUrl: m.trailer?.youtubeUrl,
      }));
    }
    return [];
  } catch (error) {
    console.warn('[v2 API] Error fetching featured movies:', error);
    return [];
  }
}

/**
 * Fetch movie details with rich metadata & trailer
 */
export async function fetchMovieDetails(id: string): Promise<Movie | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(`${API_BASE_URL}/${id}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data = await response.json();
    if (!data || (!data.id && !data.tmdbId)) return null;

    return {
      id: String(data.id || data.tmdbId),
      tmdbId: data.tmdbId,
      title: data.title || '',
      overview: data.overview || '',
      releaseDate: data.releaseDate || '',
      formattedDate: data.formattedDate || '',
      duration: data.duration || '',
      rating: data.rating || '',
      director: data.director || '',
      genres: Array.isArray(data.genres) ? data.genres : [],
      genreColorKeys: Array.isArray(data.genreColorKeys) ? data.genreColorKeys : ['teal'],
      heroImage: data.backdropUrl ? { uri: data.backdropUrl } : (data.posterUrl ? { uri: data.posterUrl } : undefined),
      posterImage: data.posterUrl ? { uri: data.posterUrl } : (data.backdropUrl ? { uri: data.backdropUrl } : undefined),
      trailerKey: data.trailer?.key,
      youtubeUrl: data.trailer?.youtubeUrl,
    };
  } catch (error) {
    console.warn('[v2 API] Error fetching movie details:', error);
    return null;
  }
}

/**
 * Search movies with cache-aside lookup and match count
 */
export async function searchMoviesWithMeta(query: string): Promise<SearchResponse> {
  if (!query || !query.trim()) {
    return { query: '', matchCount: 0, source: 'cache', results: [] };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query.trim())}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return { query, matchCount: 0, source: 'network', results: [] };
    }

    const data = await response.json();
    const rawResults = Array.isArray(data.results) ? data.results : [];

    const mappedResults: MovieSearchResult[] = rawResults.map((item: any) => ({
      id: String(item.id || item.tmdbId),
      tmdbId: item.tmdbId,
      title: item.title,
      category: item.genres && item.genres.length > 0 ? item.genres[0] : 'Movie',
      posterUrl: item.posterUrl,
      backdropUrl: item.backdropUrl,
      rating: item.rating || '',
      overview: item.overview || '',
      formattedDate: item.formattedDate || '',
      genres: item.genres || [],
      genreColorKeys: item.genreColorKeys || ['teal'],
      source: item.source || data.source || 'cache',
    }));

    return {
      query: data.query || query,
      matchCount: data.matchCount ?? mappedResults.length,
      source: data.source || 'cache',
      results: mappedResults,
    };
  } catch (error) {
    console.warn('[v2 API] Error searching movies:', error);
    return { query, matchCount: 0, source: 'network', results: [] };
  }
}

/**
 * Discover movies by category / genre
 */
export async function fetchMoviesByGenre(genre: string): Promise<MovieSearchResult[]> {
  if (!genre) return [];
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(`${API_BASE_URL}/discover?genre=${encodeURIComponent(genre)}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) return [];

    const data = await response.json();
    if (Array.isArray(data)) {
      return data.map((item: any) => ({
        id: String(item.id || item.tmdbId),
        tmdbId: item.tmdbId,
        title: item.title,
        category: item.genres && item.genres.length > 0 ? item.genres[0] : genre,
        posterUrl: item.posterUrl,
        backdropUrl: item.backdropUrl,
        rating: item.rating,
        overview: item.overview,
        formattedDate: item.formattedDate,
        genres: item.genres || [],
        genreColorKeys: item.genreColorKeys || ['teal'],
        source: item.source || 'cache',
      }));
    }
    return [];
  } catch (error) {
    console.warn('[v2 API] Error discovering movies by genre:', error);
    return [];
  }
}

/**
 * Fetch genres from local database
 */
export async function fetchGenres(): Promise<GenreItem[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/genres`);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.warn('[v2 API] Error fetching genres:', error);
    return [];
  }
}
