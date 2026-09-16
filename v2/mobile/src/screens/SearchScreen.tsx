import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { GENRES } from '../data/mockData';
import { SearchBar } from '../components/SearchBar';
import { GenreCard } from '../components/GenreCard';
import { SearchResultItem } from '../components/SearchResultItem';
import {
  searchMoviesWithMeta,
  fetchMoviesByGenre,
  MovieSearchResult,
} from '../services/api';
import { GenreCategory, Movie, RootStackParamList } from '../types';
import { COLORS, FONTS } from '../constants/theme';

export const SearchScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [isResultMode, setIsResultMode] = useState(false);
  const [results, setResults] = useState<MovieSearchResult[]>([]);
  const [matchCount, setMatchCount] = useState<number>(0);
  const [source, setSource] = useState<'cache' | 'network'>('cache');
  const [loading, setLoading] = useState(false);

  // 300ms debounce search handler
  const handleDebouncedSearch = async (text: string) => {
    if (selectedGenre) return;

    if (!text.trim()) {
      setResults([]);
      setMatchCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const resp = await searchMoviesWithMeta(text.trim());
      setResults(resp.results);
      setMatchCount(resp.matchCount);
      setSource(resp.source);
    } catch {
      setResults([]);
      setMatchCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Genre filtering
  const handleGenrePress = async (genre: GenreCategory) => {
    Keyboard.dismiss();
    setSelectedGenre(genre.name);
    setSearchQuery(genre.name);
    setIsResultMode(true);
    setLoading(true);

    try {
      const data = await fetchMoviesByGenre(genre.name);
      setResults(data);
      setMatchCount(data.length);
      setSource('cache');
    } catch {
      setResults([]);
      setMatchCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    setSelectedGenre(null);
    setResults([]);
    setMatchCount(0);
    setIsResultMode(false);
    setLoading(false);
  };

  const handleBackToGenres = () => {
    handleClear();
  };

  const handleMoviePress = (item: MovieSearchResult) => {
    const movie: Movie = {
      id: item.id,
      tmdbId: item.tmdbId,
      title: item.title,
      overview: item.overview || '',
      releaseDate: item.releaseDate || '',
      formattedDate: item.formattedDate || '',
      posterImage: item.posterUrl ? { uri: item.posterUrl } : undefined,
      heroImage: item.backdropUrl ? { uri: item.backdropUrl } : undefined,
      genres: item.genres || [item.category || 'Movie'],
      genreColorKeys: item.genreColorKeys || ['teal'],
      rating: item.rating,
    };
    navigation.navigate('MovieDetail', { movie });
  };

  const isShowingResults = isResultMode || searchQuery.trim().length > 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Search Header */}
      <View style={styles.header}>
        {isShowingResults && (
          <TouchableOpacity
            onPress={handleBackToGenres}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        )}
        <View style={styles.searchBarWrapper}>
          <SearchBar
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              if (selectedGenre && text !== selectedGenre) {
                setSelectedGenre(null);
              }
              if (text.trim().length > 0) {
                setIsResultMode(true);
              }
            }}
            onDebouncedSearch={handleDebouncedSearch}
            onClear={handleClear}
            placeholder="TV shows, movies and more"
          />
        </View>
      </View>

      {/* Main Content Area */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primaryBlue} />
          <Text style={styles.loadingText}>Searching PostgreSQL Cache & TMDB...</Text>
        </View>
      ) : isShowingResults ? (
        <View style={styles.resultsWrapper}>
          {/* Top count header: e.g. "3 Results Found" */}
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsCountText}>
              {matchCount} {matchCount === 1 ? 'Result' : 'Results'} Found
            </Text>
            {source === 'cache' && matchCount > 0 ? (
              <View style={styles.cachePill}>
                <Ionicons name="flash" size={12} color="#15D2BC" style={{ marginRight: 3 }} />
                <Text style={styles.cachePillText}>Sub-second DB Cache</Text>
              </View>
            ) : null}
          </View>

          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <SearchResultItem
                title={item.title}
                category={item.category || (item.genres && item.genres[0]) || 'Movie'}
                image={
                  item.posterUrl
                    ? { uri: item.posterUrl }
                    : item.backdropUrl
                    ? { uri: item.backdropUrl }
                    : undefined
                }
                rating={item.rating}
                isCached={item.source === 'cache'}
                onPress={() => handleMoviePress(item)}
              />
            )}
            contentContainerStyle={styles.resultsListContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={48} color={COLORS.textSecondary} />
                <Text style={styles.emptyTitle}>No matches found</Text>
                <Text style={styles.emptySubtitle}>
                  Try searching with a different movie title or keyword.
                </Text>
              </View>
            }
          />
        </View>
      ) : (
        /* 2-Column Genre Categories Grid */
        <FlatList
          data={GENRES}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={({ item }) => (
            <GenreCard genre={item} onPress={() => handleGenrePress(item)} />
          )}
          contentContainerStyle={styles.genresListContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.genreSectionHeader}>
              <Text style={styles.sectionTitle}>Browse Categories</Text>
              <Text style={styles.sectionSubtitle}>Instant local filtering</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.canvasLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: COLORS.canvasLight,
  },
  backButton: {
    marginRight: 10,
    padding: 4,
  },
  searchBarWrapper: {
    flex: 1,
  },
  genresListContent: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 100, // Space for sticky bottom tab bar
  },
  genreSectionHeader: {
    paddingHorizontal: 6,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 18,
    color: COLORS.textPrimary,
  },
  sectionSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  resultsWrapper: {
    flex: 1,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.borderLight,
  },
  resultsCountText: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  cachePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6FAF7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cachePillText: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: '#0EA391',
  },
  resultsListContent: {
    paddingVertical: 8,
    paddingBottom: 100, // Space for sticky bottom tab bar
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
  },
  loadingText: {
    marginTop: 12,
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 18,
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
