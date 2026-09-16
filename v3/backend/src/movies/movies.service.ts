import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
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
    private readonly prisma: PrismaService,
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
   * Sync genres using Prisma ORM
   */
  async syncGenres(): Promise<{ id: string; tmdbId: number; name: string }[]> {
    try {
      const localGenres = await this.prisma.genre.findMany({
        orderBy: { name: 'asc' },
      });

      if (localGenres.length > 0) {
        return localGenres.map((g) => ({
          id: g.id,
          tmdbId: g.tmdbId,
          name: g.name,
        }));
      }

      this.logger.log('Syncing genres into PostgreSQL via Prisma...');
      const tmdbGenres = await this.tmdb.getMovieGenres();

      for (const g of tmdbGenres) {
        await this.prisma.genre.upsert({
          where: { tmdbId: g.id },
          create: { tmdbId: g.id, name: g.name },
          update: { name: g.name },
        });
      }

      const fresh = await this.prisma.genre.findMany({ orderBy: { name: 'asc' } });
      return fresh.map((g) => ({
        id: g.id,
        tmdbId: g.tmdbId,
        name: g.name,
      }));
    } catch (error) {
      this.logger.error(`Error syncing genres via Prisma: ${error.message}`);
      const tmdbGenres = await this.tmdb.getMovieGenres();
      return tmdbGenres.map((g) => ({
        id: String(g.id),
        tmdbId: g.id,
        name: g.name,
      }));
    }
  }

  /**
   * Cache-Aside: Featured Movies using Prisma ORM
   */
  async getFeaturedMovies(): Promise<{ source: 'cache' | 'network'; movies: NormalizedMovie[] }> {
    const thresholdDate = new Date(Date.now() - this.ttlMilliseconds);

    try {
      // 1. Prisma query: check local database for cached records within TTL
      const cached = await this.prisma.movie.findMany({
        where: {
          updatedAt: { gte: thresholdDate },
        },
        include: {
          genres: {
            include: { genre: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 20,
      });

      if (cached.length >= 5) {
        this.logger.log(`Prisma Cache HIT: Serving ${cached.length} featured movies from PostgreSQL`);
        return {
          source: 'cache',
          movies: cached.map((m) => {
            const genres = m.genres.map((mg) => mg.genre.name);
            return {
              id: String(m.tmdbId),
              tmdbId: m.tmdbId,
              title: m.title,
              overview: m.overview || '',
              releaseDate: m.releaseDate || '',
              formattedDate: this.formatDate(m.releaseDate),
              rating: m.rating ? `${m.rating.toFixed(1)}/10` : '',
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

      // 2. Cache MISS: Query TMDB, upsert into Prisma, and return
      this.logger.log('Prisma Cache MISS: Fetching upcoming movies from TMDB...');
      await this.syncGenres();
      const tmdbResults = await this.tmdb.getUpcomingMovies();

      for (const item of tmdbResults) {
        await this.upsertTmdbMovieWithPrisma(item);
      }

      const fresh = await this.prisma.movie.findMany({
        where: {
          tmdbId: { in: tmdbResults.map((t) => t.id) },
        },
        include: {
          genres: {
            include: { genre: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      return {
        source: 'network',
        movies: fresh.map((m) => {
          const genres = m.genres.map((mg) => mg.genre.name);
          return {
            id: String(m.tmdbId),
            tmdbId: m.tmdbId,
            title: m.title,
            overview: m.overview || '',
            releaseDate: m.releaseDate || '',
            formattedDate: this.formatDate(m.releaseDate),
            rating: m.rating ? `${m.rating.toFixed(1)}/10` : '',
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
   * Search Movies using Prisma findMany with insensitive contains
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

    try {
      // 1. Prisma case-insensitive search
      const localMatches = await this.prisma.movie.findMany({
        where: {
          OR: [
            { title: { contains: trimmed, mode: 'insensitive' } },
            { overview: { contains: trimmed, mode: 'insensitive' } },
          ],
        },
        include: {
          genres: {
            include: { genre: true },
          },
        },
        take: 20,
      });

      if (localMatches.length > 0) {
        this.logger.log(`Prisma Search Cache HIT: Found ${localMatches.length} local results for "${trimmed}"`);
        return {
          query: trimmed,
          matchCount: localMatches.length,
          source: 'cache',
          results: localMatches.map((m) => {
            const genres = m.genres.map((mg) => mg.genre.name);
            return {
              id: String(m.tmdbId),
              tmdbId: m.tmdbId,
              title: m.title,
              overview: m.overview || '',
              releaseDate: m.releaseDate || '',
              formattedDate: this.formatDate(m.releaseDate),
              rating: m.rating ? `${m.rating.toFixed(1)}/10` : '',
              posterUrl: this.tmdb.getPosterUrl(m.posterPath),
              backdropUrl: this.tmdb.getBackdropUrl(m.backdropPath),
              genres,
              genreColorKeys: this.getGenreColorKeys(genres),
              source: 'cache',
            };
          }),
        };
      }

      // 2. Cache MISS: Query TMDB and persist via Prisma
      this.logger.log(`Prisma Search Cache MISS for "${trimmed}". Querying TMDB upstream...`);
      const tmdbResults = await this.tmdb.searchMovies(trimmed);

      for (const item of tmdbResults) {
        await this.upsertTmdbMovieWithPrisma(item);
      }

      const freshMatches = await this.prisma.movie.findMany({
        where: {
          tmdbId: { in: tmdbResults.map((t) => t.id) },
        },
        include: {
          genres: {
            include: { genre: true },
          },
        },
        take: 20,
      });

      return {
        query: trimmed,
        matchCount: freshMatches.length,
        source: 'network',
        results: freshMatches.map((m) => {
          const genres = m.genres.map((mg) => mg.genre.name);
          return {
            id: String(m.tmdbId),
            tmdbId: m.tmdbId,
            title: m.title,
            overview: m.overview || '',
            releaseDate: m.releaseDate || '',
            formattedDate: this.formatDate(m.releaseDate),
            rating: m.rating ? `${m.rating.toFixed(1)}/10` : '',
            posterUrl: this.tmdb.getPosterUrl(m.posterPath),
            backdropUrl: this.tmdb.getBackdropUrl(m.backdropPath),
            genres,
            genreColorKeys: this.getGenreColorKeys(genres),
            source: 'network',
          };
        }),
      };
    } catch (error) {
      this.logger.error(`Error in searchMovies via Prisma: ${error.message}`);
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
   * Filter / Discover movies by Genre using Prisma relations
   */
  async getMoviesByGenre(genreName: string): Promise<NormalizedMovie[]> {
    try {
      const isNumeric = /^\d+$/.test(genreName);
      const genre = await this.prisma.genre.findFirst({
        where: isNumeric
          ? { tmdbId: Number(genreName) }
          : { name: { equals: genreName, mode: 'insensitive' } },
      });

      if (genre) {
        const localMovies = await this.prisma.movie.findMany({
          where: {
            genres: {
              some: { genreId: genre.id },
            },
          },
          include: {
            genres: {
              include: { genre: true },
            },
          },
          take: 20,
        });

        if (localMovies.length >= 4) {
          this.logger.log(`Prisma Genre HIT: Found ${localMovies.length} movies for "${genre.name}"`);
          return localMovies.map((m) => {
            const genres = m.genres.map((mg) => mg.genre.name);
            return {
              id: String(m.tmdbId),
              tmdbId: m.tmdbId,
              title: m.title,
              overview: m.overview || '',
              releaseDate: m.releaseDate || '',
              formattedDate: this.formatDate(m.releaseDate),
              rating: m.rating ? `${m.rating.toFixed(1)}/10` : '',
              posterUrl: this.tmdb.getPosterUrl(m.posterPath),
              backdropUrl: this.tmdb.getBackdropUrl(m.backdropPath),
              genres,
              genreColorKeys: this.getGenreColorKeys(genres),
              source: 'cache',
            };
          });
        }

        this.logger.log(`Prisma Genre MISS for "${genre.name}". Fetching TMDB discover...`);
        const tmdbResults = await this.tmdb.discoverByGenre(genre.tmdbId);
        for (const item of tmdbResults) {
          await this.upsertTmdbMovieWithPrisma(item);
        }

        const freshMovies = await this.prisma.movie.findMany({
          where: {
            genres: {
              some: { genreId: genre.id },
            },
          },
          include: {
            genres: {
              include: { genre: true },
            },
          },
          take: 20,
        });

        return freshMovies.map((m) => {
          const genres = m.genres.map((mg) => mg.genre.name);
          return {
            id: String(m.tmdbId),
            tmdbId: m.tmdbId,
            title: m.title,
            overview: m.overview || '',
            releaseDate: m.releaseDate || '',
            formattedDate: this.formatDate(m.releaseDate),
            rating: m.rating ? `${m.rating.toFixed(1)}/10` : '',
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
      this.logger.error(`Error in getMoviesByGenre via Prisma: ${error.message}`);
      return [];
    }
  }

  /**
   * Get Movie Details via Prisma ORM
   */
  async getMovieDetails(idOrTmdbId: string): Promise<NormalizedMovie | null> {
    try {
      const tmdbIdNum = Number(idOrTmdbId);
      const isNumeric = !isNaN(tmdbIdNum);
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrTmdbId);

      const whereClause = isNumeric
        ? { tmdbId: tmdbIdNum }
        : isUuid
        ? { id: idOrTmdbId }
        : { title: { equals: idOrTmdbId, mode: 'insensitive' as const } };

      // Prisma check
      const existing = await this.prisma.movie.findFirst({
        where: whereClause,
        include: {
          genres: {
            include: { genre: true },
          },
        },
      });

      if (existing && (existing.trailerKey || existing.director)) {
        this.logger.log(`Prisma Detail Cache HIT for: ${existing.title}`);
        const genres = existing.genres.map((mg) => mg.genre.name);
        return {
          id: String(existing.tmdbId),
          tmdbId: existing.tmdbId,
          title: existing.title,
          overview: existing.overview || '',
          releaseDate: existing.releaseDate || '',
          formattedDate: this.formatDate(existing.releaseDate),
          rating: existing.rating ? `${existing.rating.toFixed(1)}/10` : '',
          duration: existing.duration || undefined,
          director: existing.director || undefined,
          posterUrl: this.tmdb.getPosterUrl(existing.posterPath),
          backdropUrl: this.tmdb.getBackdropUrl(existing.backdropPath),
          genres,
          genreColorKeys: this.getGenreColorKeys(genres),
          trailer: existing.trailerKey
            ? {
                key: existing.trailerKey,
                youtubeUrl: `https://www.youtube.com/watch?v=${existing.trailerKey}`,
              }
            : undefined,
          source: 'cache',
        };
      }

      // If TMDB ID is valid, fetch rich details
      if (!isNaN(tmdbIdNum)) {
        this.logger.log(`Prisma Detail MISS: Fetching rich metadata from TMDB for ID ${tmdbIdNum}...`);
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

        // Upsert movie with rich fields using Prisma
        const movieRecord = await this.prisma.movie.upsert({
          where: { tmdbId: details.id },
          create: {
            tmdbId: details.id,
            title: details.title,
            overview: details.overview || '',
            releaseDate: details.release_date || null,
            posterPath: details.poster_path || null,
            backdropPath: details.backdrop_path || null,
            rating: details.vote_average || 0.0,
            duration: duration || null,
            director: director || null,
            trailerKey: trailerKey || null,
          },
          update: {
            title: details.title,
            overview: details.overview || '',
            releaseDate: details.release_date || null,
            posterPath: details.poster_path || null,
            backdropPath: details.backdrop_path || null,
            rating: details.vote_average || 0.0,
            duration: duration || null,
            director: director || null,
            trailerKey: trailerKey || null,
          },
        });

        // Link genres via Prisma
        if (details.genres) {
          for (const g of details.genres) {
            const genreRecord = await this.prisma.genre.upsert({
              where: { tmdbId: g.id },
              create: { tmdbId: g.id, name: g.name },
              update: { name: g.name },
            });

            await this.prisma.movieGenre.upsert({
              where: {
                movieId_genreId: {
                  movieId: movieRecord.id,
                  genreId: genreRecord.id,
                },
              },
              create: {
                movieId: movieRecord.id,
                genreId: genreRecord.id,
              },
              update: {},
            });
          }
        }

        const genres = details.genres?.map((g) => g.name) || [];

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
          genres,
          genreColorKeys: this.getGenreColorKeys(genres),
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
      this.logger.error(`Error in getMovieDetails via Prisma: ${error.message}`);
      return null;
    }
  }

  /**
   * Helper to upsert TMDB movie and genres using Prisma ORM
   */
  private async upsertTmdbMovieWithPrisma(item: TmdbMovieItem) {
    try {
      const movieRecord = await this.prisma.movie.upsert({
        where: { tmdbId: item.id },
        create: {
          tmdbId: item.id,
          title: item.title,
          overview: item.overview || '',
          releaseDate: item.release_date || null,
          posterPath: item.poster_path || null,
          backdropPath: item.backdrop_path || null,
          rating: item.vote_average || 0.0,
        },
        update: {
          title: item.title,
          overview: item.overview || '',
          releaseDate: item.release_date || null,
          posterPath: item.poster_path || null,
          backdropPath: item.backdrop_path || null,
          rating: item.vote_average || 0.0,
        },
      });

      if (item.genre_ids && item.genre_ids.length > 0) {
        for (const tmdbGenreId of item.genre_ids) {
          const genre = await this.prisma.genre.findUnique({
            where: { tmdbId: tmdbGenreId },
          });

          if (genre) {
            await this.prisma.movieGenre.upsert({
              where: {
                movieId_genreId: {
                  movieId: movieRecord.id,
                  genreId: genre.id,
                },
              },
              create: {
                movieId: movieRecord.id,
                genreId: genre.id,
              },
              update: {},
            });
          }
        }
      }
    } catch (err) {
      this.logger.warn(`Failed to upsert movie ${item.id} via Prisma: ${err.message}`);
    }
  }
}
