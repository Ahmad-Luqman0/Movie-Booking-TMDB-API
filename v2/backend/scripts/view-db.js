const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://ahmad@localhost:5432/figma_movies_v2',
});

async function viewDb() {

  // Genres
  const genresRes = await pool.query('SELECT tmdb_id, name FROM genres ORDER BY name ASC');
  console.log(`🏷️  Cached Genres (${genresRes.rowCount}):`);
  console.table(genresRes.rows.slice(0, 10));

  // Movies
  const moviesRes = await pool.query(`
    SELECT m.tmdb_id AS "tmdbId", m.title, m.rating, m.release_date AS "releaseDate",
           COALESCE(ARRAY_AGG(g.name) FILTER (WHERE g.name IS NOT NULL), '{}') AS genres
    FROM movies m
    LEFT JOIN movie_genres mg ON mg.movie_id = m.id
    LEFT JOIN genres g ON g.id = mg.genre_id
    GROUP BY m.id
    ORDER BY m.updated_at DESC
    LIMIT 10
  `);

  const countRes = await pool.query('SELECT COUNT(*) FROM movies');
  console.log(`\n🎬 Cached Movies (Total: ${countRes.rows[0].count}, showing latest 10):`);
  console.table(moviesRes.rows);

  await pool.end();
}

viewDb().catch((err) => {
  console.error('Error querying DB:', err.message);
  process.exit(1);
});
