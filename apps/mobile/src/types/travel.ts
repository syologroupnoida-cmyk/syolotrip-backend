export type ScreenName = 'explore' | 'flights' | 'hotels' | 'checkout' | 'trips';

export type CategoryMode = 
  | 'flights' 
  | 'hotels' 
  | 'villas'
  | 'packages' 
  | 'trains' 
  | 'buses' 
  | 'cabs'
  | 'tours'
  | 'visa'
  | 'insurance';

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
  defaultRoomId?: string;
  rooms?: Array<{
    id: string;
    roomType: string;
    pricePerNight: number;
    availableRooms: number;
    isAvailable: boolean;
  }>;
}

export interface TrainOption {
  id: string;
  trainNumber: string;
  trainName: string;
  trainType: string;
  fromStationCode: string;
  fromStationName: string;
  toStationCode: string;
  toStationName: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  trainClass: string;
  availableSeats: number;
  price: number;
  rating: number;
}

export interface BusOption {
  id: string;
  operatorName: string;
  busType: string;
  fromCity: string;
  toCity: string;
  boardingPoint: string;
  droppingPoint: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  availableSeats: number;
  price: number;
  rating: number;
}

export interface CabOption {
  id: string;
  cabType: string;
  vehicleModel: string;
  city: string;
  pickupArea: string;
  dropArea: string;
  driverName: string;
  driverRating: number;
  capacity: number;
  price: number;
  etaMinutes: number;
  features: string[];
}

export interface PackageOption {
  id: string;
  title: string;
  destination: string;
  durationDays: number;
  durationNights: number;
  overview: string;
  inclusions: string[];
  price: number;
  rating: number;
  image: string;
}

export interface TripBookingState {
  serviceType?: 'FLIGHT' | 'HOTEL' | 'BUS' | 'PACKAGE' | 'TRAIN' | 'CAB' | 'VILLA' | 'TOUR' | 'VISA' | 'INSURANCE';
  originCode: string;
  originCity: string;
  destCode: string;
  destCity: string;
  datesText: string;
  travelersText: string;
  selectedFlight?: FlightOption;
  selectedHotel?: HotelOption;
  selectedTrain?: TrainOption;
  selectedBus?: BusOption;
  selectedCab?: CabOption;
  selectedPackage?: PackageOption;
  seat: string;
  hasInsurance: boolean;
  travelerName: string;
  dob: string;
  passportNumber: string;
  frequentFlyer: string;
}
