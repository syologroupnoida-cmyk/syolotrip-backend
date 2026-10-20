export type ScreenName = 'explore' | 'flights' | 'hotels' | 'checkout' | 'trips';

export type CategoryMode = 'flights' | 'hotels' | 'packages';

export interface DestinationCard {
  id: string;
  city: string;
  country: string;
  price: number;
  weather: string;
  tag: string;
  tagType: 'flash' | 'seasonal' | 'resort';
  image: string;
  flightType: string;
}

export interface FlightOption {
  id: string;
  airline: string;
  flightCode: string;
  aircraft: string;
  originCode: string;
  originTerminal: string;
  departureTime: string;
  destCode: string;
  destTerminal: string;
  arrivalTime: string;
  duration: string;
  isNextDay: boolean;
  stopsText: string;
  isDirect: boolean;
  price: number;
  badge?: string;
  badgeVariant?: 'recommended' | 'schedule' | 'budget';
  perks: string[];
}

export interface HotelOption {
  id: string;
  name: string;
  stars: number;
  ratingScore: number;
  ratingLabel: string;
  reviewCount: number;
  neighborhood: string;
  distance: string;
  pricePerNight: number;
  totalPrice: number;
  cancellationText: string;
  breakfastIncluded: boolean;
  image: string;
  tags: string[];
  lat: number;
  lng: number;
}

export interface TripBookingState {
  originCode: string;
  originCity: string;
  destCode: string;
  destCity: string;
  datesText: string;
  travelersText: string;
  selectedFlight?: FlightOption;
  selectedHotel?: HotelOption;
  seat: string;
  hasInsurance: boolean;
  travelerName: string;
  dob: string;
  passportNumber: string;
  frequentFlyer: string;
}
