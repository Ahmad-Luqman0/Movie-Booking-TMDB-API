import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
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
import { RootStackParamList } from '../types';
import { TrailerModal } from '../components/TrailerModal';
import { fetchMovieDetails, ExtendedMovieDetails } from '../services/api';
import { COLORS, FONTS } from '../constants/theme';

type MovieDetailRouteProp = RouteProp<RootStackParamList, 'MovieDetail'>;

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * MovieDetailScreen
 * 
 * Displays rich movie details fetched live from the TMDB API:
 * - Backdrop image and release date
 * - 'Watch Trailer' modal integration (YouTube embed)
 * - 'Get Tickets' CTA leading to cinema showtime booking
 * - Genre badges, synopsis/overview, and cast lineup
 */
export const MovieDetailScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<MovieDetailRouteProp>();
  // Initial movie payload passed from previous list or search screen
  const initialMovie = route.params.movie;

  // Holds the complete movie details (backdrop, runtime, cast, trailer, etc.)
  const [movieData, setMovieData] = useState<ExtendedMovieDetails | null>(null);
  // Loading spinner indicator while fetching from backend
  const [loading, setLoading] = useState(true);
  // Controls YouTube trailer modal visibility
  const [trailerVisible, setTrailerVisible] = useState(false);

  /**
   * Fetches full movie details from the Node.js TMDB backend whenever the screen opens
   * or the movie ID changes.
   */
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchMovieDetails(String(initialMovie.id))
      .then((live) => {
        if (isMounted) {
          setMovieData(live);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setMovieData(null);
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [initialMovie.id]);

  /**
   * Navigates to the cinema showtime & date picker screen when user clicks 'Get Tickets'.
   */
  const handleGetTickets = () => {
    if (movieData) {
      navigation.navigate('CinemaDate', { movie: movieData });
    }
  };

  /**
   * Returns matching Figma badge background color according to genre category name.
   */
  const getGenreColor = (key: string) => {
    switch (key) {
      case 'action':
        return COLORS.genres.action;
      case 'thriller':
        return COLORS.genres.thriller;
      case 'science':
        return COLORS.genres.science;
      case 'fiction':
        return COLORS.genres.fiction;
      default:
        return COLORS.primaryBlue;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primaryBlue} />
      </View>
    );
  }

  if (!movieData) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: 16 }}
        >
          <Ionicons name="chevron-back" size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
      >
        {/* Hero Section */}
        <ImageBackground
          source={movieData.heroImage || movieData.posterImage}
          style={styles.heroBackground}
          resizeMode="cover"
        >
          {/* Gradient Overlay for Text Readability */}
          <LinearGradient
            colors={[
              'rgba(0,0,0,0.4)',
              'rgba(0,0,0,0.1)',
              'rgba(0,0,0,0.55)',
              'rgba(0,0,0,0.95)',
            ]}
            locations={[0, 0.35, 0.7, 1]}
            style={styles.heroGradient}
          >
            {/* Top Navigation Header (< Watch) */}
            <SafeAreaView edges={['top']} style={styles.topHeader}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => navigation.goBack()}
                style={styles.backButton}
              >
                <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
                <Text style={styles.backText}>Watch</Text>
              </TouchableOpacity>
            </SafeAreaView>

            {/* Centered Actions on Hero */}
            <View style={styles.heroCenterContent}>
              {/* Logo / Title */}
              {movieData.logoImage ? (
                <Image
                  source={movieData.logoImage}
                  style={styles.movieLogo}
                  resizeMode="contain"
                />
              ) : (
                <Text style={styles.heroMovieTitle}>{movieData.title}</Text>
              )}

              {/* Release Date */}
              <Text style={styles.releaseDateText}>{movieData.formattedDate}</Text>

              {/* Get Tickets Button */}
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={handleGetTickets}
                style={styles.getTicketsBtn}
              >
                <Text style={styles.getTicketsText}>Get Tickets</Text>
              </TouchableOpacity>

              {/* Watch Trailer Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setTrailerVisible(true)}
                style={styles.watchTrailerBtn}
              >
                <Ionicons
                  name="play"
                  size={16}
                  color="#FFFFFF"
                  style={styles.trailerPlayIcon}
                />
                <Text style={styles.watchTrailerText}>Watch Trailer</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </ImageBackground>

        {/* Content Section (Genres & Overview) */}
        <View style={styles.detailsContent}>
          {/* Genres Section */}
          <Text style={styles.sectionHeading}>Genres</Text>
          <View style={styles.genresRow}>
            {movieData.genres.map((genre, idx) => {
              const colorKey = movieData.genreColorKeys[idx] || 'action';
              const badgeColor = getGenreColor(colorKey);
              return (
                <View
                  key={genre}
                  style={[styles.genreBadge, { backgroundColor: badgeColor }]}
                >
                  <Text style={styles.genreBadgeText}>{genre}</Text>
                </View>
              );
            })}
          </View>

          <View style={styles.contentDivider} />

          {/* Overview Section */}
          <Text style={styles.sectionHeading}>Overview</Text>
          <Text style={styles.overviewText}>{movieData.overview}</Text>
        </View>
      </ScrollView>

      {/* Trailer Modal with Live Official Trailer */}
      <TrailerModal
        visible={trailerVisible}
        movieTitle={movieData.title}
        trailerKey={movieData.trailerKey}
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
  scrollContent: {
    paddingBottom: 40,
  },
  heroBackground: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.62,
    backgroundColor: COLORS.darkNavy,
  },
  heroGradient: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  topHeader: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
  },
  backText: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 6,
  },
  heroCenterContent: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  movieLogo: {
    width: 180,
    height: 50,
    marginBottom: 8,
  },
  heroMovieTitle: {
    fontFamily: FONTS.bold,
    fontSize: 24,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  releaseDateText: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 18,
    textAlign: 'center',
  },
  getTicketsBtn: {
    width: 243,
    height: 50,
    backgroundColor: COLORS.primaryBlue,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: COLORS.primaryBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  getTicketsText: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  watchTrailerBtn: {
    width: 243,
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primaryBlue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  trailerPlayIcon: {
    marginRight: 8,
  },
  watchTrailerText: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  detailsContent: {
    paddingHorizontal: 30,
    paddingTop: 24,
  },
  sectionHeading: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 14,
  },
  genresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  genreBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  genreBadgeText: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  contentDivider: {
    height: 1,
    backgroundColor: '#F0F0F4',
    marginVertical: 14,
  },
  overviewText: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 20,
    color: '#8F9CA9',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
