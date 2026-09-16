import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Movie, RootStackParamList } from '../types';
import { TrailerModal } from '../components/TrailerModal';
import { fetchMovieDetails } from '../services/api';
import { COLORS, FONTS } from '../constants/theme';

type MovieDetailRouteProp = RouteProp<RootStackParamList, 'MovieDetail'>;

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const GENRE_TAG_COLORS: Record<string, string> = {
  Action: '#15D2BC',
  Thriller: '#E26CA5',
  'Science Fiction': '#564CA3',
  'Sci-Fi': '#564CA3',
  Comedy: '#15D2BC',
  Comedies: '#15D2BC',
  Drama: '#564CA3',
  Dramas: '#564CA3',
  Adventure: '#15D2BC',
  Animation: '#E26CA5',
  Family: '#15D2BC',
  Fantasy: '#564CA3',
  Crime: '#E26CA5',
  teal: '#15D2BC',
  coral: '#E26CA5',
  purple: '#564CA3',
  gold: '#CD9D0F',
  green: '#15D2BC',
};

export const MovieDetailScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<MovieDetailRouteProp>();
  const initialMovie = route.params.movie;

  const [movieData, setMovieData] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [trailerVisible, setTrailerVisible] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchMovieDetails(String(initialMovie.tmdbId || initialMovie.id))
      .then((live) => {
        if (isMounted) {
          setMovieData(live || initialMovie);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setMovieData(initialMovie);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [initialMovie]);

  const movie = movieData || initialMovie;

  const handleGetTickets = () => {
    navigation.navigate('CinemaDate', { movie });
  };

  const handleWatchTrailer = () => {
    setTrailerVisible(true);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const heroImageSource = movie.heroImage || movie.posterImage;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroContainer}>
          <ImageBackground
            source={heroImageSource}
            style={styles.heroImage}
            resizeMode="cover"
          >
            <LinearGradient
              colors={[
                'rgba(0,0,0,0.5)',
                'rgba(0,0,0,0.1)',
                'rgba(0,0,0,0.6)',
                '#FFFFFF',
              ]}
              locations={[0, 0.35, 0.75, 1]}
              style={styles.heroGradient}
            >
              {/* Back button Header: < Watch */}
              <SafeAreaView edges={['top', 'left', 'right']} style={styles.headerSafeArea}>
                <View style={styles.headerBar}>
                  <TouchableOpacity
                    onPress={handleBack}
                    activeOpacity={0.7}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    style={styles.backButton}
                  >
                    <Ionicons name="chevron-back" size={24} color={COLORS.textLight} />
                    <Text style={styles.backButtonText}>Watch</Text>
                  </TouchableOpacity>
                </View>
              </SafeAreaView>

              {/* Title & CTAs Overlay */}
              <View style={styles.heroContent}>
                <Text style={styles.heroTitle} numberOfLines={2}>
                  {movie.title}
                </Text>
                {movie.formattedDate ? (
                  <Text style={styles.releaseDateText}>
                    In Theaters {movie.formattedDate}
                  </Text>
                ) : null}

                {/* Primary CTA Buttons */}
                <View style={styles.ctaContainer}>
                  <TouchableOpacity
                    onPress={handleGetTickets}
                    activeOpacity={0.85}
                    style={styles.getTicketsButton}
                  >
                    <Text style={styles.getTicketsText}>Get Tickets</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleWatchTrailer}
                    activeOpacity={0.85}
                    style={styles.watchTrailerButton}
                  >
                    <Ionicons
                      name="play"
                      size={16}
                      color={COLORS.textLight}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.watchTrailerText}>Watch Trailer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>
        </View>

        {/* Lower Body Section */}
        <View style={styles.detailsContainer}>
          {loading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={COLORS.primaryBlue} />
              <Text style={styles.loadingText}>Fetching metadata from PostgreSQL cache...</Text>
            </View>
          )}

          {/* Genres Badges */}
          {movie.genres && movie.genres.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Genres</Text>
              <View style={styles.genresRow}>
                {movie.genres.map((genreName, index) => {
                  const tagColor = GENRE_TAG_COLORS[genreName] || '#15D2BC';
                  return (
                    <View
                      key={index}
                      style={[styles.genreBadge, { backgroundColor: tagColor }]}
                    >
                      <Text style={styles.genreBadgeText}>{genreName}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          <View style={styles.divider} />

          {/* Overview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <Text style={styles.overviewText}>
              {movie.overview || 'No synopsis available for this title.'}
            </Text>
          </View>

          {/* Runtime & Director Info */}
          {(movie.duration || movie.director || movie.rating) && (
            <>
              <View style={styles.divider} />
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Details</Text>
                <View style={styles.detailsMetaGrid}>
                  {movie.rating ? (
                    <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>Rating</Text>
                      <Text style={styles.metaValue}>{movie.rating}</Text>
                    </View>
                  ) : null}
                  {movie.duration ? (
                    <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>Runtime</Text>
                      <Text style={styles.metaValue}>{movie.duration}</Text>
                    </View>
                  ) : null}
                  {movie.director ? (
                    <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>Director</Text>
                      <Text style={styles.metaValue}>{movie.director}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Trailer Modal */}
      <TrailerModal
        visible={trailerVisible}
        movieTitle={movie.title}
        trailerKey={movie.trailerKey}
        onClose={() => setTrailerVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  heroContainer: {
    height: SCREEN_HEIGHT * 0.58,
    width: '100%',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  headerSafeArea: {
    width: '100%',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  backButtonText: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    color: COLORS.textLight,
    marginLeft: 4,
  },
  heroContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  heroTitle: {
    fontFamily: FONTS.bold,
    fontSize: 24,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  releaseDateText: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  ctaContainer: {
    width: '100%',
    gap: 12,
  },
  getTicketsButton: {
    backgroundColor: COLORS.primaryBlue,
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primaryBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  getTicketsText: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    color: COLORS.textLight,
  },
  watchTrailerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primaryBlue,
    borderRadius: 12,
    height: 50,
  },
  watchTrailerText: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    color: COLORS.textLight,
  },
  detailsContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    backgroundColor: '#FFFFFF',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  loadingText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 18,
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  genresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genreBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  genreBadgeText: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.borderLight,
    marginVertical: 16,
  },
  overviewText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  detailsMetaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 14,
  },
  metaItem: {
    alignItems: 'center',
  },
  metaLabel: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  metaValue: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
});
