// Shared API and Domain Contracts for Traveler Platform

export type UserRole = 'CUSTOMER' | 'ADMIN' | 'SUPPORT' | 'PARTNER';

export type PropertyType = 'HOTEL' | 'HOMESTAY';

export type ListingPublicationStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'DELISTED';

export type PartnerStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';

export interface PartnerProfileContract {
  id: string;
  userId: string;
  businessName: string;
  businessType: string;
  phone?: string;
  city?: string;
  address?: string;
  country: string;
  taxId?: string;
  status: PartnerStatus;
  isVerified: boolean;
  commissionRate: number;
  isCommissionActive: boolean;
  rejectionReason?: string;
  verifiedAt?: string;
  createdAt: string;
}

export interface RoomDailyInventoryContract {
  id: string;
  roomId: string;
  date: string; // YYYY-MM-DD
  availableRooms: number;
  priceOverride?: number;
  isBlocked: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  partnerProfile?: PartnerProfileContract;
}

export interface AuthTokens {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: UserProfile;
  tokens: AuthTokens;
}


// ================= Flight Models =================
export interface Airport {
  code: string; // e.g. "DEL", "BOM", "DXB"
  name: string;
  city: string;
  country: string;
}

export interface FlightSegment {
  airlineCode: string;
  airlineName: string;
  flightNumber: string;
  aircraft: string;
  departureAirport: Airport;
  arrivalAirport: Airport;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
}

export interface FlightOffer {
  id: string;
  provider: string;
  isSimulated: boolean;
  airline: string;
  flightNumber: string;
  origin: Airport;
  destination: Airport;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  stops: number;
  cabinClass: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
  availableSeats: number;
  baseFare: number;
  taxes: number;
  totalPrice: number;
  currency: string;
}

// ================= Hotel Models =================
export interface HotelRoom {
  id: string;
  hotelId: string;
  roomType: string;
  bedType: string;
  maxOccupancy: number;
  pricePerNight: number;
  taxesPerNight: number;
  amenities: string[];
  isAvailable: boolean;
  images: string[];
}

export interface HotelProperty {
  id: string;
  provider: string;
  isSimulated: boolean;
  name: string;
  propertyType?: PropertyType;
  partnerId?: string;
  publicationStatus?: ListingPublicationStatus;
  adminRejectionReason?: string;
  starRating: number;
  address: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  overview: string;
  amenities: string[];
  featuredImage: string;
  images: string[];
  startingPrice: number;
  currency: string;
  rooms?: HotelRoom[];
}


// ================= Bus Models =================
export interface BusSeat {
  seatNumber: string;
  deck: 'LOWER' | 'UPPER';
  seatType: 'SEATER' | 'SLEEPER';
  isAvailable: boolean;
  basePrice: number;
}

export interface BusRouteSchedule {
  id: string;
  provider: string;
  isSimulated: boolean;
  operatorName: string;
  busType: string;
  fromCity: string;
  toCity: string;
  boardingPoint: string;
  droppingPoint: string;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  availableSeatsCount: number;
  baseFare: number;
  rating: number;
  currency: string;
}

// ================= Holiday Packages =================
export interface HolidayPackage {
  id: string;
  title: string;
  destination: string;
  durationDays: number;
  durationNights: number;
  overview: string;
  inclusions: string[];
  exclusions: string[];
  itinerary: Array<{
    day: number;
    title: string;
    description: string;
  }>;
  pricePerPerson: number;
  currency: string;
  featuredImage: string;
  rating: number;
}

// ================= Train Models =================
export interface TrainSchedule {
  id: string;
  trainNumber: string;
  trainName: string;
  trainType: string;
  fromStationCode: string;
  fromStationName: string;
  fromCity: string;
  toStationCode: string;
  toStationName: string;
  toCity: string;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  trainClass: string;
  availableSeats: number;
  baseFare: number;
  rating: number;
  currency: string;
}

// ================= Cab Models =================
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
  baseFare: number;
  currency: string;
  etaMinutes: number;
  features: string[];
}

// ================= Booking Models =================
export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'FAILED';

export type BookingServiceType = 'FLIGHT' | 'HOTEL' | 'BUS' | 'PACKAGE' | 'TRAIN' | 'CAB';

export interface PriceBreakdown {
  baseAmount: number;
  taxesAndFees: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
}

export interface TravellerDetail {
  title: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  passportNumber?: string;
  seatPreference?: string;
}

export interface BookingResponse {
  id: string;
  bookingReference: string;
  userId: string;
  serviceType: BookingServiceType;
  status: BookingStatus;
  provider: string;
  isSimulated: boolean;
  priceBreakdown: PriceBreakdown;
  travellers: TravellerDetail[];
  contactEmail: string;
  contactPhone: string;
  detailsSnapshot: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  total_users: number;
  total_bookings: number;
  total_revenue: number;
  confirmed_bookings: number;
  pending_bookings: number;
  cancelled_bookings: number;
  total_flights: number;
  total_hotels: number;
  total_buses: number;
  total_packages: number;
  adapter_mode: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

// ================= API Generic Response =================
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  environment: string;
  timestamp: string;
  database: 'connected' | 'disconnected' | 'mock';
  services: Record<string, string>;
}
