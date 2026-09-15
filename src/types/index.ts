export interface Movie {
  id: string;
  title: string;
  releaseDate: string;
  formattedDate: string;
  posterImage: any;
  heroImage?: any;
  logoImage?: any;
  genres: string[];
  genreColorKeys: ('action' | 'thriller' | 'science' | 'fiction')[];
  overview: string;
  duration?: string;
  rating?: string;
}

export interface GenreCategory {
  id: string;
  name: string;
  image: any;
}

export interface CinemaDate {
  id: string;
  dayNumber: string;
  month: string;
  fullDate: string;
  dayOfWeek: string;
}

export interface CinemaHall {
  id: string;
  time: string;
  hallName: string;
  screenType: string;
  price: number;
  bonusPoints: number;
  previewRows?: number;
}

export type SeatStatus = 'available' | 'reserved' | 'selected';
export type SeatTier = 'regular' | 'vip';

export interface Seat {
  id: string; // e.g. "R3-S4"
  row: number; // 1-10
  number: number; // seat index in row
  section: 'left' | 'center' | 'right';
  tier: SeatTier;
  price: number;
  status: SeatStatus;
}

export type RootStackParamList = {
  MainTabs: undefined;
  MovieDetail: { movie: Movie };
  CinemaDate: { movie: Movie };
  SeatSelection: {
    movie: Movie;
    date: CinemaDate;
    hall: CinemaHall;
  };
  TrailerModal: { movieTitle: string };
  PaymentSuccess: {
    movie: Movie;
    date: CinemaDate;
    hall: CinemaHall;
    seats: Seat[];
    totalPrice: number;
  };
};

export type BottomTabParamList = {
  Dashboard: undefined;
  Watch: undefined;
  MediaLibrary: undefined;
  More: undefined;
};
