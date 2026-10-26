// SS Journey Partner Types — Fully typed backend schemas

export type ScreenName =
  | 'dashboard'
  | 'properties'
  | 'property_detail'
  | 'create_property'
  | 'edit_property'
  | 'rooms'
  | 'inventory_calendar'
  | 'bookings'
  | 'profile'
  | 'auth';

export type PartnerStatus =
  | 'PENDING_VERIFICATION'
  | 'PENDING'
  | 'VERIFIED'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUSPENDED';

export type PropertyPublicationStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED';

export type PropertyType = 'HOTEL' | 'HOMESTAY';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface PartnerProfileData {
  id: string;
  user_id: string;
  business_name: string;
  business_type: string;
  phone?: string;
  city?: string;
  address?: string;
  country: string;
  tax_id?: string;
  status: PartnerStatus;
  is_verified: boolean;
  commission_rate: number;
  is_commission_active: boolean;
  rejection_reason?: string;
  verified_at?: string;
  created_at: string;
}

export interface HotelRoomData {
  id: string;
  room_type: string;
  bed_type: string;
  max_occupancy: number;
  price_per_night: number;
  taxes_per_night: number;
  available_rooms: number;
  amenities?: string[];
  images?: string[];
  is_available: boolean;
}

export interface PartnerPropertyData {
  id: string;
  partner_id?: string;
  name: string;
  property_type: PropertyType;
  publication_status: PropertyPublicationStatus;
  admin_rejection_reason?: string;
  approved_at?: string;
  star_rating: number;
  guest_rating: number;
  rating_label: string;
  review_count: number;
  address: string;
  city: string;
  country: string;
  neighborhood?: string;
  overview: string;
  amenities?: string[];
  tags?: string[];
  featured_image: string;
  images?: string[];
  starting_price: number;
  currency: string;
  is_active: boolean;
  featured: boolean;
  rooms?: HotelRoomData[];
}

export interface DailyInventoryData {
  id: string;
  room_id: string;
  date: string;
  available_rooms: number;
  price_override?: number | null;
  is_blocked: boolean;
}

export interface PartnerBookingPassenger {
  first_name: string;
  last_name: string;
  title?: string;
  passenger_type?: string;
}

export interface PartnerBookingItem {
  id: string;
  service_type: string;
  item_type: string;
  item_id: string;
  hotel_id?: string;
  title: string;
  description?: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  details?: Record<string, any>;
}

export interface PartnerBookingData {
  id: string;
  booking_reference: string;
  service_type: string;
  status: string;
  payment_status: string;
  base_amount: number;
  taxes_amount: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  created_at: string;
  passengers?: PartnerBookingPassenger[];
  items?: PartnerBookingItem[];
}

export interface DashboardMetrics {
  totalProperties: number;
  approvedProperties: number;
  pendingProperties: number;
  draftProperties: number;
  totalRooms: number;
  totalBookings: number;
  confirmedBookings: number;
  grossRevenue: number;
  estimatedNetPayout: number;
}
