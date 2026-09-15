import { Platform } from 'react-native';
import { Movie } from '../types';

const getApiBaseUrl = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    return `http://${window.location.hostname}:5001/api`;
  }
  return 'http://localhost:5001/api';
};

const API_BASE_URL = getApiBaseUrl();

export interface ExtendedMovieDetails extends Movie {
  trailerKey?: string;
  youtubeUrl?: string;
  director?: string;
  cast?: Array<{
    id: number;
    name: string;
    character: string;
    profileUrl: string | null;
  }>;
}

export async function fetchMovieDetails(
  movieId: string
): Promise<ExtendedMovieDetails | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(`${API_BASE_URL}/movies/${movieId}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (!data || !data.id) {
      return null;
    }

    return {
      id: String(data.id),
      title: data.title || '',
      overview: data.overview || '',
      releaseDate: data.releaseDate || '',
      formattedDate: data.formattedDate || '',
      duration: data.duration || '',
      rating: data.rating || '',
      genres: Array.isArray(data.genres) ? data.genres : [],
      genreColorKeys: Array.isArray(data.genreColorKeys) ? data.genreColorKeys : [],
      heroImage: data.backdropUrl ? { uri: data.backdropUrl } : undefined,
      posterImage: data.posterUrl ? { uri: data.posterUrl } : (data.backdropUrl ? { uri: data.backdropUrl } : undefined),
      trailerKey: data.trailer?.key,
      youtubeUrl: data.trailer?.youtubeUrl,
      director: data.director,
      cast: data.cast,
    };
  } catch (error) {
    console.error('[API] Error fetching live movie details:', error);
    return null;
  }
}

export async function fetchUpcomingMovies(): Promise<Movie[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(`${API_BASE_URL}/movies/upcoming`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    if (Array.isArray(data)) {
      return data.map((m: any) => ({
        id: String(m.id),
        title: m.title || '',
        releaseDate: m.releaseDate || '',
        formattedDate: m.formattedDate || '',
        posterImage: m.backdropUrl
          ? { uri: m.backdropUrl }
          : m.posterUrl
          ? { uri: m.posterUrl }
          : undefined,
        heroImage: m.backdropUrl
          ? { uri: m.backdropUrl }
          : m.posterUrl
          ? { uri: m.posterUrl }
          : undefined,
        genres: Array.isArray(m.genres) ? m.genres : [],
        genreColorKeys: Array.isArray(m.genreColorKeys) ? m.genreColorKeys : [],
        overview: m.overview || '',
        rating: m.rating || '',
      }));
    }
    return [];
  } catch (error) {
    console.error('[API] Error fetching live upcoming movies:', error);
    return [];
  }
}

export interface LiveSearchResult {
  id: string;
  title: string;
  category: string;
  posterUrl: string | null;
  rating: string;
}

export async function searchMovies(query: string): Promise<LiveSearchResult[]> {
  if (!query || !query.trim()) return [];
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(
      `${API_BASE_URL}/movies/search?query=${encodeURIComponent(query)}`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (!response.ok) return [];

    const data = await response.json();
    if (Array.isArray(data)) {
      return data.map((item: any) => ({
        id: String(item.id),
        title: item.title,
        category: item.category || 'Movie',
        posterUrl: item.posterUrl,
        rating: item.rating,
      }));
    }
    return [];
  } catch (error) {
    console.error('[API] Error searching movies:', error);
    return [];
  }
}

export async function fetchMoviesByGenre(genre: string): Promise<LiveSearchResult[]> {
  if (!genre) return [];
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(
      `${API_BASE_URL}/movies/discover?genre=${encodeURIComponent(genre)}`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (!response.ok) return [];

    const data = await response.json();
    if (Array.isArray(data)) {
      return data.map((item: any) => ({
        id: String(item.id),
        title: item.title,
        category: item.category || genre,
        posterUrl: item.posterUrl,
        rating: item.rating,
      }));
    }
    return [];
  } catch (error) {
    console.error('[API] Error discovering movies by genre:', error);
    return [];
  }
}

export interface GenreItem {
  id: number;
  name: string;
}

export async function fetchMovieGenres(): Promise<GenreItem[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(`${API_BASE_URL}/genres/movies`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) return [];

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('[API] Error fetching movie genres:', error);
    return [];
  }
}

export async function fetchTvGenres(): Promise<GenreItem[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(`${API_BASE_URL}/genres/tv`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) return [];

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('[API] Error fetching TV genres:', error);
    return [];
  }
}
