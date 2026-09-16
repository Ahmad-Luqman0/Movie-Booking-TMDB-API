import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface TmdbGenre {
  id: number;
  name: string;
}

export interface TmdbMovieItem {
  id: number;
  title: string;
  overview: string;
  release_date?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  genre_ids?: number[];
}

export interface TmdbVideo {
  key: string;
  site: string;
  type: string;
  official: boolean;
}

export interface TmdbCastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface TmdbCrewMember {
  id: number;
  name: string;
  job: string;
}

export interface TmdbMovieDetails {
  id: number;
  title: string;
  overview: string;
  release_date?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  runtime?: number;
  genres?: TmdbGenre[];
  videos?: { results: TmdbVideo[] };
  credits?: {
    cast: TmdbCastMember[];
    crew: TmdbCrewMember[];
  };
}

@Injectable()
export class TmdbService {
  private readonly logger = new Logger(TmdbService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly imageBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('TMDB_API_KEY') || '';
    this.baseUrl = this.configService.get<string>('TMDB_BASE_URL') || 'https://api.themoviedb.org/3';
    this.imageBaseUrl = this.configService.get<string>('TMDB_IMAGE_BASE') || 'https://image.tmdb.org/t/p';

    if (!this.apiKey) {
      this.logger.warn('TMDB_API_KEY is not set. Upstream TMDB API calls will fail.');
    }
  }

  getPosterUrl(path?: string | null, size = 'w500'): string | null {
    if (!path) return null;
    return `${this.imageBaseUrl}/${size}${path}`;
  }

  getBackdropUrl(path?: string | null, size = 'w1280'): string | null {
    if (!path) return null;
    return `${this.imageBaseUrl}/${size}${path}`;
  }

  private async fetchFromTmdb<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.append('api_key', this.apiKey);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`TMDB API Error [${response.status}] ${endpoint}: ${errorText}`);
      throw new Error(`TMDB error ${response.status}: ${errorText}`);
    }

    return (await response.json()) as T;
  }

  async getMovieGenres(): Promise<TmdbGenre[]> {
    const data = await this.fetchFromTmdb<{ genres: TmdbGenre[] }>('/genre/movie/list');
    return data.genres || [];
  }

  async getUpcomingMovies(): Promise<TmdbMovieItem[]> {
    const data = await this.fetchFromTmdb<{ results: TmdbMovieItem[] }>('/movie/upcoming', {
      language: 'en-US',
      page: '1',
    });
    return data.results || [];
  }

  async searchMovies(query: string): Promise<TmdbMovieItem[]> {
    if (!query || !query.trim()) return [];
    const data = await this.fetchFromTmdb<{ results: TmdbMovieItem[] }>('/search/movie', {
      query: query.trim(),
      include_adult: 'false',
      language: 'en-US',
      page: '1',
    });
    return data.results || [];
  }

  async getMovieDetails(tmdbId: number): Promise<TmdbMovieDetails> {
    return this.fetchFromTmdb<TmdbMovieDetails>(`/movie/${tmdbId}`, {
      append_to_response: 'videos,credits',
      language: 'en-US',
    });
  }

  async discoverByGenre(genreId: number): Promise<TmdbMovieItem[]> {
    const data = await this.fetchFromTmdb<{ results: TmdbMovieItem[] }>('/discover/movie', {
      with_genres: String(genreId),
      sort_by: 'popularity.desc',
      page: '1',
    });
    return data.results || [];
  }
}
