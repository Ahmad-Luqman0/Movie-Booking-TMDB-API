import { CinemaDate, CinemaHall, GenreCategory, Seat } from '../types';

/**
 * Genre categories used in Screen 02 (Search & Categories Grid).
 * Each category links to its Figma mockup poster asset.
 */
export const GENRES: GenreCategory[] = [
  { id: 'comedies', name: 'Comedies', image: require('../../assets/images/genre_comedies.png') },
  { id: 'crime', name: 'Crime', image: require('../../assets/images/genre_crime.png') },
  { id: 'family', name: 'Family', image: require('../../assets/images/genre_family.png') },
  { id: 'documentaries', name: 'Documentaries', image: require('../../assets/images/genre_documentaries.png') },
  { id: 'dramas', name: 'Dramas', image: require('../../assets/images/genre_dramas.png') },
  { id: 'fantasy', name: 'Fantasy', image: require('../../assets/images/genre_fantasy.png') },
  { id: 'holidays', name: 'Holidays', image: require('../../assets/images/genre_holidays.png') },
  { id: 'horror', name: 'Horror', image: require('../../assets/images/genre_horror.png') },
  { id: 'scifi', name: 'Sci-Fi', image: require('../../assets/images/genre_scifi.png') },
  { id: 'thriller', name: 'Thriller', image: require('../../assets/images/genre_thriller.png') },
];

/**
 * Available show dates for the Cinema Date selection screen (Screen 06).
 * Based on the design mockup calendar dates.
 */
export const DATES: CinemaDate[] = [
  { id: '5-mar', dayNumber: '5', month: 'Mar', fullDate: 'March 5, 2021', dayOfWeek: 'Fri' },
  { id: '6-mar', dayNumber: '6', month: 'Mar', fullDate: 'March 6, 2021', dayOfWeek: 'Sat' },
  { id: '7-mar', dayNumber: '7', month: 'Mar', fullDate: 'March 7, 2021', dayOfWeek: 'Sun' },
  { id: '8-mar', dayNumber: '8', month: 'Mar', fullDate: 'March 8, 2021', dayOfWeek: 'Mon' },
  { id: '9-mar', dayNumber: '9', month: 'Mar', fullDate: 'March 9, 2021', dayOfWeek: 'Tue' },
  { id: '10-mar', dayNumber: '10', month: 'Mar', fullDate: 'March 10, 2021', dayOfWeek: 'Wed' },
];

/**
 * Cinema hall showtimes and pricing tiers for the Cinema Date selection screen.
 * Defines the time slot, auditorium type (e.g. IMAX, Dolby Atmos, VIP), and price.
 */
export const CINEMA_HALLS: CinemaHall[] = [
  {
    id: 'hall-1-1230',
    time: '12:30',
    hallName: 'Cinetech + Hall 1',
    screenType: 'IMAX 3D',
    price: 50,
    bonusPoints: 2500,
  },
  {
    id: 'hall-2-1330',
    time: '13:30',
    hallName: 'Cinetech + Hall 2',
    screenType: 'Dolby Atmos',
    price: 75,
    bonusPoints: 3000,
  },
  {
    id: 'hall-1-1545',
    time: '15:45',
    hallName: 'Cinetech + Hall 1',
    screenType: 'IMAX 3D',
    price: 50,
    bonusPoints: 2500,
  },
  {
    id: 'hall-3-1800',
    time: '18:00',
    hallName: 'Cinetech VIP Lounge',
    screenType: 'VIP 4DX',
    price: 150,
    bonusPoints: 5000,
  },
];

/**
 * Generates the theater seat map layout matching Figma Screen 07:
 * - 10 Rows total
 * - 3 Sections per row: Left (4 seats), Center (12 seats), Right (4 seats)
 * - Rows 1–9: Regular seats ($50)
 * - Row 10: VIP seats ($150)
 * - Pre-populates realistic reserved seats and initial selection matching the design.
 */
export function generateInitialSeats(): Seat[] {
  const seats: Seat[] = [];
  // Row 1 to 10
  // Left: 4 seats per row, Center: 12 seats per row, Right: 4 seats per row
  // Row 10 is VIP ($150)
  for (let row = 1; row <= 10; row++) {
    const isVIP = row === 10;
    const price = isVIP ? 150 : 50;

    // Left section (4 seats)
    for (let s = 1; s <= 4; s++) {
      // Create some unavailable seats 
      const isUnavailable =
        (row === 1 && (s === 1 || s === 2)) ||
        (row === 2 && s === 3) ||
        (row === 3 && s === 1) ||
        (row === 4 && (s === 1 || s === 2)) ||
        (row === 6 && (s === 1 || s === 4)) ||
        (row === 8 && (s === 1 || s === 4));

      seats.push({
        id: `R${row}-L${s}`,
        row,
        number: s,
        section: 'left',
        tier: isVIP ? 'vip' : 'regular',
        price,
        status: isUnavailable ? 'reserved' : 'available',
      });
    }

    // Center section (12 seats)
    for (let s = 1; s <= 12; s++) {
      // In Figma Screen 07, row 3 seat 4 is pre-selected (ochre gold)
      const isSelected = row === 3 && s === 4;
      const isUnavailable =
        (row === 1 && (s === 5 || s === 6 || s === 9)) ||
        (row === 2 && (s === 2 || s === 4 || s === 8 || s === 11)) ||
        (row === 3 && (s === 5 || s === 7 || s === 9)) ||
        (row === 4 && (s === 1 || s === 3 || s === 6 || s === 8 || s === 10)) ||
        (row === 5 && (s === 3 || s === 5 || s === 8 || s === 11)) ||
        (row === 6 && (s === 1 || s === 2 || s === 5 || s === 7 || s === 10)) ||
        (row === 7 && (s === 4 || s === 9)) ||
        (row === 8 && (s === 1 || s === 2 || s === 6 || s === 9 || s === 11)) ||
        (row === 9 && (s === 3 || s === 7 || s === 10));

      seats.push({
        id: `R${row}-C${s}`,
        row,
        number: s,
        section: 'center',
        tier: isVIP ? 'vip' : 'regular',
        price,
        status: isSelected ? 'selected' : isUnavailable ? 'reserved' : 'available',
      });
    }

    // Right section (4 seats)
    for (let s = 1; s <= 4; s++) {
      const isUnavailable =
        (row === 1 && (s === 3 || s === 4)) ||
        (row === 2 && (s === 1 || s === 3)) ||
        (row === 3 && (s === 1 || s === 4)) ||
        (row === 4 && (s === 1 || s === 3 || s === 4)) ||
        (row === 5 && (s === 1 || s === 2)) ||
        (row === 6 && (s === 1 || s === 4)) ||
        (row === 7 && (s === 1 || s === 2)) ||
        (row === 8 && (s === 3 || s === 4)) ||
        (row === 9 && (s === 1 || s === 4));

      seats.push({
        id: `R${row}-R${s}`,
        row,
        number: s,
        section: 'right',
        tier: isVIP ? 'vip' : 'regular',
        price,
        status: isUnavailable ? 'reserved' : 'available',
      });
    }
  }

  return seats;
}
