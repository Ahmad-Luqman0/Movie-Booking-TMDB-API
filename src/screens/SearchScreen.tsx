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
  searchMovies,
  fetchMoviesByGenre,
  LiveSearchResult,
} from '../services/api';
import { GenreCategory, RootStackParamList } from '../types';
import { COLORS, FONTS } from '../constants/theme';

/**
 * SearchScreen
 * 
 * Provides interactive movie search and category browsing:
 * - 2-column genre discovery grid (Screen 02)
 * - Live auto-complete search with 300ms debounce (Screen 03)
 * - Genre-filtered results view with result count header (Screen 04)
 */
export const SearchScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  // State for typed search query
  const [searchQuery, setSearchQuery] = useState('');
  // Selected category name when user taps a genre card
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  // Whether the screen is currently displaying a results list or the default genre grid
  const [isResultMode, setIsResultMode] = useState(false);
  // Current movie results fetched from TMDB
  const [results, setResults] = useState<LiveSearchResult[]>([]);
  // Loading spinner indicator while querying TMDB
  const [loading, setLoading] = useState(false);

  /**
   * Debounced live search: Waits 300ms after user stops typing before querying
   * the backend to prevent excessive API calls and optimize performance.
   */
  useEffect(() => {
    // If a genre is selected, genre effect handles it
    if (selectedGenre) return;

    if (!searchQuery.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    let isCurrent = true;
    setLoading(true);

    const timer = setTimeout(() => {
      searchMovies(searchQuery)
        .then((data) => {
          if (isCurrent) {
            setResults(data);
            setLoading(false);
          }
        })
        .catch(() => {
          if (isCurrent) {
            setResults([]);
            setLoading(false);
          }
        });
    }, 300);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [searchQuery, selectedGenre]);

  /**
   * Navigates to MovieDetailScreen when a movie card in search results is pressed.
   */
  const handleSelectMovie = (id: string, title: string) => {
    navigation.navigate('MovieDetail', {
      movie: {
        id,
        title,
        releaseDate: '',
        formattedDate: '',
        genres: [],
        genreColorKeys: [],
        overview: '',
        posterImage: undefined,
      },
    });
  };

  /**
   * Fetches live movies filtered by genre when user clicks any category card in the grid.
   */
  const handleSelectGenre = (genre: GenreCategory) => {
    setSelectedGenre(genre.name);
    setIsResultMode(true);
    setLoading(true);
    fetchMoviesByGenre(genre.name)
      .then((data) => {
        setResults(data);
        setLoading(false);
      })
      .catch(() => {
        setResults([]);
        setLoading(false);
      });
  };

  /**
   * Resets the search input, clears active genre filter, and returns to default genre grid.
   */
  const handleClear = () => {
    setSearchQuery('');
    setSelectedGenre(null);
    setResults([]);
    setIsResultMode(false);
    Keyboard.dismiss();
  };

  /**
   * Handles back navigation: exits result mode first if browsing results,
   * or pops screen if already on the main search screen.
   */
  const handleBack = () => {
    if (isResultMode || selectedGenre) {
      setIsResultMode(false);
      setSelectedGenre(null);
      setSearchQuery('');
      setResults([]);
    } else {
      navigation.goBack();
    }
  };

  const isTyping = searchQuery.trim().length > 0 && !isResultMode;
  const isBrowsingResults = isResultMode || searchQuery.trim().length > 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Screen 04 Header: Results Found with Back Button */}
      {isResultMode ? (
        <View style={styles.resultHeader}>
          <TouchableOpacity
            onPress={handleBack}
            activeOpacity={0.7}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.resultCountText}>
            {selectedGenre ? `${selectedGenre} • ` : ''}
            {results.length} Results Found
          </Text>
        </View>
      ) : (
        /* Screen 02 & 03: Search Input Bar */
        <SearchBar
          value={searchQuery}
          onChangeText={(text) => {
            setSelectedGenre(null);
            setSearchQuery(text);
            if (isResultMode) setIsResultMode(false);
          }}
          onClear={handleClear}
          placeholder="TV shows, movies and more"
        />
      )}

      {/* Screen 03: Top Results header while typing */}
      {isTyping && results.length > 0 && (
        <View style={styles.topResultsHeader}>
          <Text style={styles.topResultsText}>Top Results</Text>
          <View style={styles.divider} />
        </View>
      )}

      {/* Loading indicator */}
      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={COLORS.primaryBlue} />
        </View>
      )}

      {/* Content Area */}
      {isBrowsingResults ? (
        /* Live Results List */
        <FlatList
          key="results-flatlist"
          data={results}
          keyExtractor={(item, index) => (item?.id ? `result-${item.id}` : `result-${index}`)}
          renderItem={({ item }) => (
            <SearchResultItem
              title={item?.title || 'Untitled'}
              category={item?.category || 'Movie'}
              image={item?.posterUrl ? { uri: item.posterUrl } : undefined}
              onPress={() => handleSelectMovie(item.id, item.title)}
            />
          )}
          contentContainerStyle={styles.resultsListContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyState}>
                <Ionicons name="film-outline" size={40} color={COLORS.borderLight} />
                <Text style={styles.emptyTitle}>No movies found</Text>
                <Text style={styles.emptySub}>
                  {selectedGenre
                    ? `No current titles found in ${selectedGenre}.`
                    : `No titles match "${searchQuery}".`}
                </Text>
              </View>
            ) : null
          }
        />
      ) : (
        /* Screen 02: 2-Column Grid of Genres */
        <FlatList
          key="genre-grid-flatlist"
          data={GENRES}
          keyExtractor={(item) => `genre-${item.id}`}
          numColumns={2}
          renderItem={({ item }) => (
            <GenreCard genre={item} onPress={() => handleSelectGenre(item)} />
          )}
          contentContainerStyle={styles.genreGridContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  resultHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F4',
  },
  backButton: {
    padding: 6,
    marginRight: 12,
  },
  resultCountText: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  topResultsHeader: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 4,
  },
  topResultsText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F4',
  },
  loadingBox: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  genreGridContent: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 90,
  },
  resultsListContent: {
    paddingTop: 8,
    paddingBottom: 90,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginTop: 12,
  },
  emptySub: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
});
