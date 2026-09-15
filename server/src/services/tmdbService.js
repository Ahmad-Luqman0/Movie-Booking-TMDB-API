function formatTheatricalDate(dateStr) {
  if (!dateStr) return 'Coming Soon';
  try {
    const d = new Date(dateStr);
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `In Theaters ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  } catch (e) {
    return `In Theaters ${dateStr}`;
  }
}

function formatRuntime(minutes) {
  if (!minutes) return '';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs}h ${mins}m`;
}

function mapGenreColorKey(genreName) {
  const g = (genreName || '').toLowerCase();
  if (g.includes('action') || g.includes('adventure')) return 'action';
  if (g.includes('thrill') || g.includes('crime') || g.includes('horror') || g.includes('comedy')) return 'thriller';
  if (g.includes('sci') || g.includes('animation') || g.includes('fantasy')) return 'science';
  return 'fiction';
}

async function getMovieDetailsFromTmdb(identifier, apiKey, baseUrl, imageBase) {
  const tmdbId = parseInt(identifier, 10);
  if (isNaN(tmdbId)) {
    throw new Error(`Invalid movie ID: '${identifier}'. Expected a numeric TMDB ID.`);
  }

  const url = `${baseUrl}/movie/${tmdbId}?api_key=${apiKey}&append_to_response=videos,credits,images`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`TMDB API returned HTTP ${response.status}: ${response.statusText}`);
  }

  const raw = await response.json();

  //Extract Trailer Video
  let trailer = null;
  if (raw.videos && Array.isArray(raw.videos.results)) {
    const trailers = raw.videos.results.filter(
      (v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
    );
    const official = trailers.find((v) => v.official) || trailers[0];
    if (official) {
      trailer = {
        key: official.key,
        name: official.name,
        youtubeUrl: `https://www.youtube.com/watch?v=${official.key}`,
        embedUrl: `https://www.youtube.com/embed/${official.key}?autoplay=1`,
      };
    }
  }

  // Extract director & top cast
  const director = raw.credits?.crew?.find((c) => c.job === 'Director')?.name || 'Director';
  const cast = (raw.credits?.cast || []).slice(0, 5).map((c) => ({
    id: c.id,
    name: c.name,
    character: c.character,
    profileUrl: c.profile_path ? `${imageBase}/w185${c.profile_path}` : null,
  }));

  const genres = (raw.genres || []).map((g) => g.name);
  const genreColorKeys = genres.map(mapGenreColorKey);

  return {
    id: raw.id,
    slug: identifier,
    title: raw.title,
    tagline: raw.tagline,
    overview: raw.overview,
    releaseDate: raw.release_date,
    formattedDate: formatTheatricalDate(raw.release_date),
    duration: formatRuntime(raw.runtime),
    rating: raw.vote_average ? `${raw.vote_average.toFixed(1)}/10` : 'N/A',
    backdropUrl: raw.backdrop_path ? `${imageBase}/original${raw.backdrop_path}` : null,
    posterUrl: raw.poster_path ? `${imageBase}/w500${raw.poster_path}` : null,
    genres,
    genreColorKeys,
    trailer,
    director,
    cast,
  };
}

const GENRE_MAP = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Science Fiction',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
};



//Get Movies List
async function getUpcomingMoviesFromTmdb(apiKey, baseUrl, imageBase) {
  const url = `${baseUrl}/movie/upcoming?api_key=${apiKey}&language=en-US&page=1`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`TMDB upcoming fetch failed: ${response.status}`);
  }
  const data = await response.json();
  return (data.results || []).slice(0, 10).map((m) => {
    const genres = (m.genre_ids || []).map((id) => GENRE_MAP[id] || 'Action').slice(0, 3);
    const genreColorKeys = genres.map(mapGenreColorKey);
    return {
      id: String(m.id),
      title: m.title,
      overview: m.overview,
      releaseDate: m.release_date,
      formattedDate: formatTheatricalDate(m.release_date),
      posterUrl: m.poster_path ? `${imageBase}/w500${m.poster_path}` : null,
      backdropUrl: m.backdrop_path ? `${imageBase}/w780${m.backdrop_path}` : null,
      genres: genres.length ? genres : ['Action', 'Thriller'],
      genreColorKeys: genreColorKeys.length ? genreColorKeys : ['action', 'thriller'],
      rating: m.vote_average ? `${m.vote_average.toFixed(1)}/10` : 'N/A',
    };
  });
}

async function searchMoviesFromTmdb(query, apiKey, baseUrl, imageBase) {
  if (!query || !query.trim()) return [];
  const url = `${baseUrl}/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`TMDB search fetch failed: ${response.status}`);
  }
  const data = await response.json();
  return (data.results || []).slice(0, 10).map((m) => {
    const genres = (m.genre_ids || []).map((id) => GENRE_MAP[id] || 'Action').slice(0, 2);
    return {
      id: String(m.id),
      title: m.title,
      category: genres[0] || 'Movie',
      overview: m.overview,
      releaseDate: m.release_date,
      formattedDate: formatTheatricalDate(m.release_date),
      posterUrl: m.poster_path ? `${imageBase}/w500${m.poster_path}` : (m.backdrop_path ? `${imageBase}/w500${m.backdrop_path}` : null),
      rating: m.vote_average ? `${m.vote_average.toFixed(1)}/10` : 'N/A',
    };
  });
}

async function discoverMoviesByGenre(genreNameOrId, apiKey, baseUrl, imageBase) {
  const GENRE_NAME_TO_ID = {
    'comedies': 35,
    'comedy': 35,
    'crime': 80,
    'family': 10751,
    'documentaries': 99,
    'documentary': 99,
    'dramas': 18,
    'drama': 18,
    'fantasy': 14,
    'holidays': 10751,
    'horror': 27,
    'scifi': 878,
    'sci-fi': 878,
    'sciencefiction': 878,
    'thriller': 53,
    'action': 28,
    'adventure': 12,
    'actionadventure': 10759,
    'animation': 16,
    'history': 36,
    'music': 10402,
    'mystery': 9648,
    'romance': 10749,
    'tvmovie': 10770,
    'war': 10752,
    'warpolitics': 10768,
    'western': 37,
    'kids': 10762,
    'news': 10763,
    'reality': 10764,
    'soap': 10766,
    'talk': 10767,
  };

  let genreId = parseInt(genreNameOrId, 10);
  if (isNaN(genreId)) {
    const key = (genreNameOrId || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    genreId = GENRE_NAME_TO_ID[key] || 35;
  }

  const url = `${baseUrl}/discover/movie?api_key=${apiKey}&with_genres=${genreId}&sort_by=popularity.desc&include_adult=false&language=en-US&page=1`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`TMDB discover fetch failed: ${response.status}`);
  }
  const data = await response.json();
  return (data.results || []).slice(0, 15).map((m) => {
    const genres = (m.genre_ids || []).map((id) => GENRE_MAP[id] || 'Movie').slice(0, 2);
    return {
      id: String(m.id),
      title: m.title,
      category: genres[0] || 'Movie',
      overview: m.overview,
      releaseDate: m.release_date,
      formattedDate: formatTheatricalDate(m.release_date),
      posterUrl: m.poster_path ? `${imageBase}/w500${m.poster_path}` : (m.backdrop_path ? `${imageBase}/w500${m.backdrop_path}` : null),
      rating: m.vote_average ? `${m.vote_average.toFixed(1)}/10` : 'N/A',
    };
  });
}

async function getMovieGenresFromTmdb(apiKey, baseUrl) {
  const url = `${baseUrl}/genre/movie/list?api_key=${apiKey}&language=en`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`TMDB movie genre list fetch failed: ${response.status}`);
  }
  const data = await response.json();
  return data.genres || [];
}

async function getTvGenresFromTmdb(apiKey, baseUrl) {
  const url = `${baseUrl}/genre/tv/list?api_key=${apiKey}&language=en`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`TMDB TV genre list fetch failed: ${response.status}`);
  }
  const data = await response.json();
  return data.genres || [];
}

module.exports = {
  getMovieDetailsFromTmdb,
  getUpcomingMoviesFromTmdb,
  searchMoviesFromTmdb,
  discoverMoviesByGenre,
  getMovieGenresFromTmdb,
  getTvGenresFromTmdb,
};
