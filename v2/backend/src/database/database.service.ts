import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, QueryResult, QueryResultRow } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: Pool;

  constructor(private readonly config: ConfigService) {
    const connectionString =
      this.config.get<string>('DATABASE_URL') ||
      'postgresql://ahmad@localhost:5432/figma_movies_v2';

    this.pool = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }

  async onModuleInit() {
    try {
      const client = await this.pool.connect();
      client.release();
      this.logger.log('Connected to PostgreSQL database successfully via pg.Pool');
      await this.initializeSchema();
    } catch (error) {
      this.logger.warn(`Could not connect to PostgreSQL on startup: ${error.message}`);
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
    this.logger.log('PostgreSQL connection pool closed');
  }

  async query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, params);
  }

  private async initializeSchema() {
    this.logger.log('Verifying PostgreSQL tables & indices for v2...');
    await this.query(`
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";

      CREATE TABLE IF NOT EXISTS genres (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tmdb_id INT UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS movies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tmdb_id INT UNIQUE NOT NULL,
        title VARCHAR(500) NOT NULL,
        overview TEXT,
        release_date VARCHAR(50),
        poster_path VARCHAR(500),
        backdrop_path VARCHAR(500),
        rating NUMERIC(3,1) DEFAULT 0.0,
        duration VARCHAR(100),
        director VARCHAR(255),
        trailer_key VARCHAR(100),
        cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS movie_genres (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
        genre_id UUID NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
        UNIQUE(movie_id, genre_id)
      );

      CREATE INDEX IF NOT EXISTS idx_movies_tmdb_id ON movies(tmdb_id);
      CREATE INDEX IF NOT EXISTS idx_movies_title ON movies(title);
      CREATE INDEX IF NOT EXISTS idx_movies_updated_at ON movies(updated_at);
      CREATE INDEX IF NOT EXISTS idx_genres_tmdb_id ON genres(tmdb_id);
      CREATE INDEX IF NOT EXISTS idx_movie_genres_movie ON movie_genres(movie_id);
      CREATE INDEX IF NOT EXISTS idx_movie_genres_genre ON movie_genres(genre_id);
    `);
    this.logger.log('PostgreSQL schema initialized successfully');
  }
}
