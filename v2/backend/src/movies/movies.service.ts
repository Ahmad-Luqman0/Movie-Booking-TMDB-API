import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database/database.service';
import { TmdbMovieItem, TmdbService } from '../tmdb/tmdb.service';

export interface NormalizedMovie {
  id: string;
  tmdbId: number;
  title: string;
  overview: string;
  releaseDate: string;
  formattedDate: string;
  rating: string;
  duration?: string;
  director?: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  genres: string[];
  genreColorKeys: string[];
  trailer?: {
    key: string;
    youtubeUrl: string;
  };
  source: 'cache' | 'network';
}

const GENRE_COLORS: Record<string, string> = {
  Action: 'green',
  Adventure: 'teal',
  Animation: 'coral',
  Comedy: 'teal',
  Comedies: 'teal',
  Crime: 'coral',
  Documentary: 'purple',
  Documentaries: 'purple',
  Drama: 'purple',
  Dramas: 'purple',
  Family: 'teal',
  Fantasy: 'purple',
  History: 'teal',
  Horror: 'coral',
  Music: 'purple',
  Mystery: 'coral',
  Romance: 'coral',
  'Science Fiction': 'purple',
  'Sci-Fi': 'purple',
  Thriller: 'green',
  War: 'teal',
  Western: 'coral',
};

@Injectable()
export class MoviesService {
  private readonly logger = new Logger(MoviesService.name);
  private readonly ttlMilliseconds: number;

  constructor(
    private readonly db: DatabaseService,
    private readonly tmdb: TmdbService,
    private readonly config: ConfigService,
  ) {
    const ttlHours = Number(this.config.get<string>('CACHE_TTL_HOURS') || 24);
    this.ttlMilliseconds = ttlHours * 60 * 60 * 1000;
  }

  private formatDate(dateStr?: string | null): string {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }

  private getGenreColorKeys(genres: string[]): string[] {
    return genres.map((g) => GENRE_COLORS[g] || 'teal');
  }

  /**
   * Sync genres in PostgreSQL
   */
  async syncGenres(): Promise<{ id: string; tmdbId: number; name: string }[]> {
    try {
      const result = await this.db.query(
        `SELECT id, tmdb_id AS "tmdbId", name FROM genres ORDER BY name ASC`
      );

      if (result.rows.length > 0) {
        return result.rows;
      }

      this.logger.log('PostgreSQL genre cache empty. Syncing from TMDB...');
      const tmdbGenres = await this.tmdb.getMovieGenres();

      for (const g of tmdbGenres) {
        await this.db.query(
          `INSERT INTO genres (tmdb_id, name, updated_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (tmdb_id) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()`,
          [g.id, g.name]
        );
      }

      const fresh = await this.db.query(
        `SELECT id, tmdb_id AS "tmdbId", name FROM genres ORDER BY name ASC`
      );
      return fresh.rows;
    } catch (error) {
      this.logger.error(`Error syncing genres in PostgreSQL: ${error.message}`);
      const tmdbGenres = await this.tmdb.getMovieGenres();
      return tmdbGenres.map((g) => ({
        id: String(g.id),
        tmdbId: g.id,
        name: g.name,
      }));
    }
  }

  /**
   * Cache-Aside: Featured (Upcoming) Movies using raw PostgreSQL
   */
  async getFeaturedMovies(): Promise<{ source: 'cache' | 'network'; movies: NormalizedMovie[] }> {
    const thresholdDate = new Date(Date.now() - this.ttlMilliseconds);

    try {
      // 1. Query local PostgreSQL for cached movies with genre arrays
      const cached = await this.db.query(
        `SELECT m.id, m.tmdb_id AS "tmdbId", m.title, m.overview, m.release_date AS "releaseDate",
                m.poster_path AS "posterPath", m.backdrop_path AS "backdropPath", 
                m.rating, m.duration, m.director, m.trailer_key AS "trailerKey",
                COALESCE(ARRAY_AGG(g.name) FILTER (WHERE g.name IS NOT NULL), '{}') AS genres
         FROM movies m
         LEFT JOIN movie_genres mg ON mg.movie_id = m.id
         LEFT JOIN genres g ON g.id = mg.genre_id
         WHERE m.updated_at >= $1
         GROUP BY m.id
         ORDER BY m.updated_at DESC
         LIMIT 20`,
        [thresholdDate]
      );

      if (cached.rows.length >= 5) {
        this.logger.log(`Cache HIT: Serving ${cached.rows.length} featured movies from PostgreSQL`);
        return {
          source: 'cache',
          movies: cached.rows.map((m) => {
            const genres = m.genres || [];
            return {
              id: String(m.tmdbId),
              tmdbId: Number(m.tmdbId),
              title: m.title,
              overview: m.overview || '',
              releaseDate: m.releaseDate || '',
              formattedDate: this.formatDate(m.releaseDate),
              rating: m.rating ? `${Number(m.rating).toFixed(1)}/10` : '',
              duration: m.duration || undefined,
              director: m.director || undefined,
              posterUrl: this.tmdb.getPosterUrl(m.posterPath),
              backdropUrl: this.tmdb.getBackdropUrl(m.backdropPath),
              genres,
              genreColorKeys: this.getGenreColorKeys(genres),
              trailer: m.trailerKey
                ? {
                    key: m.trailerKey,
                    youtubeUrl: `https://www.youtube.com/watch?v=${m.trailerKey}`,
                  }
                : undefined,
              source: 'cache',
            };
          }),
        };
      }

      // 2. Cache MISS: Query TMDB and persist in PostgreSQL
      this.logger.log('Cache MISS: Fetching upcoming movies from TMDB and persisting in PostgreSQL...');
      await this.syncGenres();
      const tmdbResults = await this.tmdb.getUpcomingMovies();

      for (const item of tmdbResults) {
        await this.upsertTmdbMovie(item);
      }

      const fresh = await this.db.query(
        `SELECT m.id, m.tmdb_id AS "tmdbId", m.title, m.overview, m.release_date AS "releaseDate",
                m.poster_path AS "posterPath", m.backdrop_path AS "backdropPath", 
                m.rating, m.duration, m.director, m.trailer_key AS "trailerKey",
                COALESCE(ARRAY_AGG(g.name) FILTER (WHERE g.name IS NOT NULL), '{}') AS genres
         FROM movies m
         LEFT JOIN movie_genres mg ON mg.movie_id = m.id
         LEFT JOIN genres g ON g.id = mg.genre_id
         WHERE m.tmdb_id = ANY($1::int[])
         GROUP BY m.id
         ORDER BY m.updated_at DESC`,
        [tmdbResults.map((t) => t.id)]
      );

      return {
        source: 'network',
        movies: fresh.rows.map((m) => {
          const genres = m.genres || [];
          return {
            id: String(m.tmdbId),
            tmdbId: Number(m.tmdbId),
            title: m.title,
            overview: m.overview || '',
            releaseDate: m.releaseDate || '',
            formattedDate: this.formatDate(m.releaseDate),
            rating: m.rating ? `${Number(m.rating).toFixed(1)}/10` : '',
            duration: m.duration || undefined,
            director: m.director || undefined,
            posterUrl: this.tmdb.getPosterUrl(m.posterPath),
            backdropUrl: this.tmdb.getBackdropUrl(m.backdropPath),
            genres,
            genreColorKeys: this.getGenreColorKeys(genres),
            trailer: m.trailerKey
              ? {
                  key: m.trailerKey,
                  youtubeUrl: `https://www.youtube.com/watch?v=${m.trailerKey}`,
                }
              : undefined,
            source: 'network',
          };
        }),
      };
    } catch (error) {
      this.logger.error(`Error in getFeaturedMovies: ${error.message}`);
      const tmdbResults = await this.tmdb.getUpcomingMovies();
      return {
        source: 'network',
        movies: tmdbResults.map((item) => ({
          id: String(item.id),
          tmdbId: item.id,
          title: item.title,
          overview: item.overview,
          releaseDate: item.release_date || '',
          formattedDate: this.formatDate(item.release_date),
          rating: item.vote_average ? `${item.vote_average.toFixed(1)}/10` : '',
          posterUrl: this.tmdb.getPosterUrl(item.poster_path),
          backdropUrl: this.tmdb.getBackdropUrl(item.backdrop_path),
          genres: [],
          genreColorKeys: [],
          source: 'network',
        })),
      };
    }
  }

  /**
   * Search Movies: PostgreSQL ILIKE query first, fallback to TMDB on zero results
   */
  async searchMovies(query: string): Promise<{
    query: string;
    matchCount: number;
    source: 'cache' | 'network';
    results: NormalizedMovie[];
  }> {
    if (!query || !query.trim()) {
      return { query: '', matchCount: 0, source: 'cache', results: [] };
    }

    const trimmed = query.trim();
    const likePattern = `%${trimmed}%`;

    try {
      // 1. Search PostgreSQL with ILIKE
      const localMatches = await this.db.query(
        `SELECT m.id, m.tmdb_id AS "tmdbId", m.title, m.overview, m.release_date AS "releaseDate",
                m.poster_path AS "posterPath", m.backdrop_path AS "backdropPath", 
                m.rating, m.duration, m.director, m.trailer_key AS "trailerKey",
                COALESCE(ARRAY_AGG(g.name) FILTER (WHERE g.name IS NOT NULL), '{}') AS genres
         FROM movies m
         LEFT JOIN movie_genres mg ON mg.movie_id = m.id
         LEFT JOIN genres g ON g.id = mg.genre_id
         WHERE m.title ILIKE $1 OR m.overview ILIKE $1
         GROUP BY m.id
         LIMIT 20`,
        [likePattern]
      );

      if (localMatches.rows.length > 0) {
        this.logger.log(`Search Cache HIT: Found ${localMatches.rows.length} local results in PostgreSQL for "${trimmed}"`);
        return {
          query: trimmed,
          matchCount: localMatches.rows.length,
          source: 'cache',
          results: localMatches.rows.map((m) => {
            const genres = m.genres || [];
            return {
              id: String(m.tmdbId),
              tmdbId: Number(m.tmdbId),
              title: m.title,
              overview: m.overview || '',
              releaseDate: m.releaseDate || '',
              formattedDate: this.formatDate(m.releaseDate),
              rating: m.rating ? `${Number(m.rating).toFixed(1)}/10` : '',
              posterUrl: this.tmdb.getPosterUrl(m.posterPath),
              backdropUrl: this.tmdb.getBackdropUrl(m.backdropPath),
              genres,
              genreColorKeys: this.getGenreColorKeys(genres),
              source: 'cache',
            };
          }),
        };
      }

      // 2. Cache MISS: Query TMDB and persist into PostgreSQL
      this.logger.log(`Search Cache MISS for "${trimmed}". Querying TMDB upstream...`);
      const tmdbResults = await this.tmdb.searchMovies(trimmed);

      for (const item of tmdbResults) {
        await this.upsertTmdbMovie(item);
      }

      const freshMatches = await this.db.query(
        `SELECT m.id, m.tmdb_id AS "tmdbId", m.title, m.overview, m.release_date AS "releaseDate",
                m.poster_path AS "posterPath", m.backdrop_path AS "backdropPath", 
                m.rating, m.duration, m.director, m.trailer_key AS "trailerKey",
                COALESCE(ARRAY_AGG(g.name) FILTER (WHERE g.name IS NOT NULL), '{}') AS genres
         FROM movies m
         LEFT JOIN movie_genres mg ON mg.movie_id = m.id
         LEFT JOIN genres g ON g.id = mg.genre_id
         WHERE m.tmdb_id = ANY($1::int[])
         GROUP BY m.id
         LIMIT 20`,
        [tmdbResults.map((t) => t.id)]
      );

      return {
        query: trimmed,
        matchCount: freshMatches.rows.length,
        source: 'network',
        results: freshMatches.rows.map((m) => {
          const genres = m.genres || [];
          return {
            id: String(m.tmdbId),
            tmdbId: Number(m.tmdbId),
            title: m.title,
            overview: m.overview || '',
            releaseDate: m.releaseDate || '',
            formattedDate: this.formatDate(m.releaseDate),
            rating: m.rating ? `${Number(m.rating).toFixed(1)}/10` : '',
            posterUrl: this.tmdb.getPosterUrl(m.posterPath),
            backdropUrl: this.tmdb.getBackdropUrl(m.backdropPath),
            genres,
            genreColorKeys: this.getGenreColorKeys(genres),
            source: 'network',
          };
        }),
      };
    } catch (error) {
      this.logger.error(`Error in searchMovies: ${error.message}`);
      const tmdbResults = await this.tmdb.searchMovies(trimmed);
      return {
        query: trimmed,
        matchCount: tmdbResults.length,
        source: 'network',
        results: tmdbResults.map((item) => ({
          id: String(item.id),
          tmdbId: item.id,
          title: item.title,
          overview: item.overview,
          releaseDate: item.release_date || '',
          formattedDate: this.formatDate(item.release_date),
          rating: item.vote_average ? `${item.vote_average.toFixed(1)}/10` : '',
          posterUrl: this.tmdb.getPosterUrl(item.poster_path),
          backdropUrl: this.tmdb.getBackdropUrl(item.backdrop_path),
          genres: [],
          genreColorKeys: [],
          source: 'network',
        })),
      };
    }
  }

  /**
   * Filter / Discover movies by Genre using PostgreSQL
   */
  async getMoviesByGenre(genreName: string): Promise<NormalizedMovie[]> {
    try {
      const isNumeric = /^\d+$/.test(genreName);
      const genreQuery = isNumeric
        ? `SELECT id, tmdb_id, name FROM genres WHERE tmdb_id = $1 LIMIT 1`
        : `SELECT id, tmdb_id, name FROM genres WHERE name ILIKE $1 LIMIT 1`;
      const genreParam = isNumeric ? [Number(genreName)] : [genreName];

      const genreResult = await this.db.query(genreQuery, genreParam);

      if (genreResult.rows.length > 0) {
        const genre = genreResult.rows[0];

        const localMovies = await this.db.query(
          `SELECT m.id, m.tmdb_id AS "tmdbId", m.title, m.overview, m.release_date AS "releaseDate",
                  m.poster_path AS "posterPath", m.backdrop_path AS "backdropPath", 
                  m.rating, m.duration, m.director, m.trailer_key AS "trailerKey",
                  COALESCE(ARRAY_AGG(g.name) FILTER (WHERE g.name IS NOT NULL), '{}') AS genres
           FROM movies m
           JOIN movie_genres mg ON mg.movie_id = m.id
           JOIN genres g ON g.id = mg.genre_id
           WHERE mg.genre_id = $1
           GROUP BY m.id
           LIMIT 20`,
          [genre.id]
        );

        if (localMovies.rows.length >= 4) {
          this.logger.log(`Genre Category HIT: Found ${localMovies.rows.length} movies in PostgreSQL for "${genre.name}"`);
          return localMovies.rows.map((m) => {
            const genres = m.genres || [];
            return {
              id: String(m.tmdbId),
              tmdbId: Number(m.tmdbId),
              title: m.title,
              overview: m.overview || '',
              releaseDate: m.releaseDate || '',
              formattedDate: this.formatDate(m.releaseDate),
              rating: m.rating ? `${Number(m.rating).toFixed(1)}/10` : '',
              posterUrl: this.tmdb.getPosterUrl(m.posterPath),
              backdropUrl: this.tmdb.getBackdropUrl(m.backdropPath),
              genres,
              genreColorKeys: this.getGenreColorKeys(genres),
              source: 'cache',
            };
          });
        }

        // Cache miss for genre: fetch from TMDB discover and upsert
        this.logger.log(`Genre Category MISS for "${genre.name}". Fetching TMDB discover...`);
        const tmdbResults = await this.tmdb.discoverByGenre(genre.tmdb_id);
        for (const item of tmdbResults) {
          await this.upsertTmdbMovie(item);
        }

        const freshMovies = await this.db.query(
          `SELECT m.id, m.tmdb_id AS "tmdbId", m.title, m.overview, m.release_date AS "releaseDate",
                  m.poster_path AS "posterPath", m.backdrop_path AS "backdropPath", 
                  m.rating, m.duration, m.director, m.trailer_key AS "trailerKey",
                  COALESCE(ARRAY_AGG(g.name) FILTER (WHERE g.name IS NOT NULL), '{}') AS genres
           FROM movies m
           JOIN movie_genres mg ON mg.movie_id = m.id
           JOIN genres g ON g.id = mg.genre_id
           WHERE mg.genre_id = $1
           GROUP BY m.id
           LIMIT 20`,
          [genre.id]
        );

        return freshMovies.rows.map((m) => {
          const genres = m.genres || [];
          return {
            id: String(m.tmdbId),
            tmdbId: Number(m.tmdbId),
            title: m.title,
            overview: m.overview || '',
            releaseDate: m.releaseDate || '',
            formattedDate: this.formatDate(m.releaseDate),
            rating: m.rating ? `${Number(m.rating).toFixed(1)}/10` : '',
            posterUrl: this.tmdb.getPosterUrl(m.posterPath),
            backdropUrl: this.tmdb.getBackdropUrl(m.backdropPath),
            genres,
            genreColorKeys: this.getGenreColorKeys(genres),
            source: 'network',
          };
        });
      }

      return [];
    } catch (error) {
      this.logger.error(`Error in getMoviesByGenre: ${error.message}`);
      return [];
    }
  }

  /**
   * Get Movie Details from PostgreSQL or TMDB
   */
  async getMovieDetails(idOrTmdbId: string): Promise<NormalizedMovie | null> {
    try {
      const tmdbIdNum = Number(idOrTmdbId);

      // Check PostgreSQL
      const query = !isNaN(tmdbIdNum)
        ? `SELECT m.id, m.tmdb_id AS "tmdbId", m.title, m.overview, m.release_date AS "releaseDate",
                  m.poster_path AS "posterPath", m.backdrop_path AS "backdropPath", 
                  m.rating, m.duration, m.director, m.trailer_key AS "trailerKey",
                  COALESCE(ARRAY_AGG(g.name) FILTER (WHERE g.name IS NOT NULL), '{}') AS genres
           FROM movies m
           LEFT JOIN movie_genres mg ON mg.movie_id = m.id
           LEFT JOIN genres g ON g.id = mg.genre_id
           WHERE m.tmdb_id = $1
           GROUP BY m.id
           LIMIT 1`
        : `SELECT m.id, m.tmdb_id AS "tmdbId", m.title, m.overview, m.release_date AS "releaseDate",
                  m.poster_path AS "posterPath", m.backdrop_path AS "backdropPath", 
                  m.rating, m.duration, m.director, m.trailer_key AS "trailerKey",
                  COALESCE(ARRAY_AGG(g.name) FILTER (WHERE g.name IS NOT NULL), '{}') AS genres
           FROM movies m
           LEFT JOIN movie_genres mg ON mg.movie_id = m.id
           LEFT JOIN genres g ON g.id = mg.genre_id
           WHERE m.id = $1::uuid
           GROUP BY m.id
           LIMIT 1`;

      const existing = await this.db.query(query, [!isNaN(tmdbIdNum) ? tmdbIdNum : idOrTmdbId]);

      if (existing.rows.length > 0 && (existing.rows[0].trailerKey || existing.rows[0].director)) {
        const row = existing.rows[0];
        const genres = row.genres || [];
        this.logger.log(`Detail Cache HIT in PostgreSQL for: ${row.title}`);
        return {
          id: String(row.tmdbId),
          tmdbId: Number(row.tmdbId),
          title: row.title,
          overview: row.overview || '',
          releaseDate: row.releaseDate || '',
          formattedDate: this.formatDate(row.releaseDate),
          rating: row.rating ? `${Number(row.rating).toFixed(1)}/10` : '',
          duration: row.duration || undefined,
          director: row.director || undefined,
          posterUrl: this.tmdb.getPosterUrl(row.posterPath),
          backdropUrl: this.tmdb.getBackdropUrl(row.backdropPath),
          genres,
          genreColorKeys: this.getGenreColorKeys(genres),
          trailer: row.trailerKey
            ? {
                key: row.trailerKey,
                youtubeUrl: `https://www.youtube.com/watch?v=${row.trailerKey}`,
              }
            : undefined,
          source: 'cache',
        };
      }

      // If TMDB ID is valid, fetch rich details
      if (!isNaN(tmdbIdNum)) {
        this.logger.log(`Detail Cache MISS: Fetching rich metadata from TMDB for ID ${tmdbIdNum}...`);
        const details = await this.tmdb.getMovieDetails(tmdbIdNum);

        let trailerKey = '';
        if (details.videos?.results) {
          const trailer =
            details.videos.results.find((v) => v.site === 'YouTube' && v.type === 'Trailer' && v.official) ||
            details.videos.results.find((v) => v.site === 'YouTube' && v.type === 'Trailer') ||
            details.videos.results.find((v) => v.site === 'YouTube');
          if (trailer) trailerKey = trailer.key;
        }

        const director = details.credits?.crew?.find((c) => c.job === 'Director')?.name || '';

        let duration = '';
        if (details.runtime) {
          const hrs = Math.floor(details.runtime / 60);
          const mins = details.runtime % 60;
          duration = hrs > 0 ? `${hrs}hr ${mins}m` : `${mins}m`;
        }

        // Upsert movie with rich fields in PostgreSQL
        const upsertRes = await this.db.query(
          `INSERT INTO movies (tmdb_id, title, overview, release_date, poster_path, backdrop_path, rating, duration, director, trailer_key, cached_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
           ON CONFLICT (tmdb_id) DO UPDATE SET
             title = EXCLUDED.title,
             overview = EXCLUDED.overview,
             release_date = EXCLUDED.release_date,
             poster_path = EXCLUDED.poster_path,
             backdrop_path = EXCLUDED.backdrop_path,
             rating = EXCLUDED.rating,
             duration = EXCLUDED.duration,
             director = EXCLUDED.director,
             trailer_key = EXCLUDED.trailer_key,
             updated_at = NOW()
           RETURNING id`,
          [
            details.id,
            details.title,
            details.overview || '',
            details.release_date || null,
            details.poster_path || null,
            details.backdrop_path || null,
            details.vote_average || 0.0,
            duration || null,
            director || null,
            trailerKey || null,
          ]
        );

        const movieId = upsertRes.rows[0].id;

        // Upsert and link genres
        if (details.genres) {
          for (const g of details.genres) {
            const genreRes = await this.db.query(
              `INSERT INTO genres (tmdb_id, name, updated_at)
               VALUES ($1, $2, NOW())
               ON CONFLICT (tmdb_id) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
               RETURNING id`,
              [g.id, g.name]
            );
            const genreId = genreRes.rows[0].id;

            await this.db.query(
              `INSERT INTO movie_genres (movie_id, genre_id)
               VALUES ($1, $2)
               ON CONFLICT (movie_id, genre_id) DO NOTHING`,
              [movieId, genreId]
            );
          }
        }

        const genreNames = details.genres?.map((g) => g.name) || [];

        return {
          id: String(details.id),
          tmdbId: details.id,
          title: details.title,
          overview: details.overview || '',
          releaseDate: details.release_date || '',
          formattedDate: this.formatDate(details.release_date),
          rating: details.vote_average ? `${details.vote_average.toFixed(1)}/10` : '',
          duration: duration || undefined,
          director: director || undefined,
          posterUrl: this.tmdb.getPosterUrl(details.poster_path),
          backdropUrl: this.tmdb.getBackdropUrl(details.backdrop_path),
          genres: genreNames,
          genreColorKeys: this.getGenreColorKeys(genreNames),
          trailer: trailerKey
            ? {
                key: trailerKey,
                youtubeUrl: `https://www.youtube.com/watch?v=${trailerKey}`,
              }
            : undefined,
          source: 'network',
        };
      }

      return null;
    } catch (error) {
      this.logger.error(`Error in getMovieDetails: ${error.message}`);
      return null;
    }
  }

  /**
   * Helper to upsert a movie and its genres into PostgreSQL
   */
  private async upsertTmdbMovie(item: TmdbMovieItem) {
    try {
      const res = await this.db.query(
        `INSERT INTO movies (tmdb_id, title, overview, release_date, poster_path, backdrop_path, rating, cached_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         ON CONFLICT (tmdb_id) DO UPDATE SET
           title = EXCLUDED.title,
           overview = EXCLUDED.overview,
           release_date = EXCLUDED.release_date,
           poster_path = EXCLUDED.poster_path,
           backdrop_path = EXCLUDED.backdrop_path,
           rating = EXCLUDED.rating,
           updated_at = NOW()
         RETURNING id`,
        [
          item.id,
          item.title,
          item.overview || '',
          item.release_date || null,
          item.poster_path || null,
          item.backdrop_path || null,
          item.vote_average || 0.0,
        ]
      );

      const movieId = res.rows[0].id;

      if (item.genre_ids && item.genre_ids.length > 0) {
        for (const tmdbGenreId of item.genre_ids) {
          const gRes = await this.db.query(`SELECT id FROM genres WHERE tmdb_id = $1 LIMIT 1`, [tmdbGenreId]);
          if (gRes.rows.length > 0) {
            await this.db.query(
              `INSERT INTO movie_genres (movie_id, genre_id)
               VALUES ($1, $2)
               ON CONFLICT (movie_id, genre_id) DO NOTHING`,
              [movieId, gRes.rows[0].id]
            );
          }
        }
      }
    } catch (err) {
      this.logger.warn(`Failed to upsert movie ${item.id} into PostgreSQL: ${err.message}`);
    }
  }
}
