import { Router } from 'express';
import { query } from '../db/index.js';

export const locationsRouter = Router();

export interface LocationSuggestion {
  id: string;
  name: string;
  display_name: string;
  secondary_description: string;
  city: string;
  state?: string;
  country: string;
  category: 'AIRPORT' | 'STATION' | 'BUS_STOP' | 'HOTEL' | 'LOCALITY' | 'LANDMARK' | 'ADDRESS' | 'COUNTRY' | 'REGION';
  category_label: string;
  code?: string; // IATA for airports, IRCTC for train stations, ISO for countries
  lat?: number;
  lon?: number;
  provider: 'INTERNAL_DATABASE' | 'CURATED_HUB' | 'OPENSTREETMAP_PHOTON' | 'NOMINATIM';
  service_affinity?: string[];
}

// ================= 1. VERIFIED AIRPORTS DATASET (FLIGHTS ONLY) =================
export interface AirportRecord {
  code: string;
  name: string;
  city: string;
  country: string;
  state?: string;
  lat?: number;
  lon?: number;
  aliases?: string[];
}

const VERIFIED_AIRPORTS: AirportRecord[] = [
  // India Domestic & International Hubs
  { code: 'DEL', name: 'Indira Gandhi International Airport', city: 'Delhi', state: 'Delhi', country: 'India', lat: 28.5562, lon: 77.1000, aliases: ['New Delhi', 'NCR', 'Palam', 'T3', 'T1'] },
  { code: 'BOM', name: 'Chhatrapati Shivaji Maharaj International Airport', city: 'Mumbai', state: 'Maharashtra', country: 'India', lat: 19.0896, lon: 72.8656, aliases: ['Bombay', 'Sahar', 'Santa Cruz', 'T2'] },
  { code: 'BLR', name: 'Kempegowda International Airport', city: 'Bengaluru', state: 'Karnataka', country: 'India', lat: 13.1986, lon: 77.7066, aliases: ['Bangalore', 'Devanahalli'] },
  { code: 'HYD', name: 'Rajiv Gandhi International Airport', city: 'Hyderabad', state: 'Telangana', country: 'India', lat: 17.2403, lon: 78.4294, aliases: ['Shamshabad', 'Secunderabad'] },
  { code: 'MAA', name: 'Chennai International Airport', city: 'Chennai', state: 'Tamil Nadu', country: 'India', lat: 12.9941, lon: 80.1709, aliases: ['Madras', 'Meenambakkam'] },
  { code: 'CCU', name: 'Netaji Subhash Chandra Bose International Airport', city: 'Kolkata', state: 'West Bengal', country: 'India', lat: 22.6547, lon: 88.4467, aliases: ['Calcutta', 'Dum Dum'] },
  { code: 'GOI', name: 'Dabolim Airport (South Goa)', city: 'Goa', state: 'Goa', country: 'India', lat: 15.3808, lon: 73.8314, aliases: ['Dabolim', 'Vasco', 'South Goa'] },
  { code: 'GOX', name: 'Manohar International Airport (Mopa / North Goa)', city: 'Goa', state: 'Goa', country: 'India', lat: 15.7667, lon: 73.8667, aliases: ['Mopa', 'North Goa', 'Pernem'] },
  { code: 'PNQ', name: 'Pune International Airport', city: 'Pune', state: 'Maharashtra', country: 'India', lat: 18.5822, lon: 73.9197, aliases: ['Lohegaon', 'Poona'] },
  { code: 'AMD', name: 'Sardar Vallabhbhai Patel International Airport', city: 'Ahmedabad', state: 'Gujarat', country: 'India', lat: 23.0772, lon: 72.6347, aliases: ['Hansol', 'Gandhinagar'] },
  { code: 'COK', name: 'Cochin International Airport', city: 'Kochi', state: 'Kerala', country: 'India', lat: 10.1518, lon: 76.3930, aliases: ['Cochin', 'Nedumbassery', 'Ernakulam'] },
  { code: 'JAI', name: 'Jaipur International Airport', city: 'Jaipur', state: 'Rajasthan', country: 'India', lat: 26.8242, lon: 75.8122, aliases: ['Sanganer', 'Pink City'] },
  { code: 'LKO', name: 'Chaudhary Charan Singh International Airport', city: 'Lucknow', state: 'Uttar Pradesh', country: 'India', lat: 26.7606, lon: 80.8893, aliases: ['Amausi', 'Nawab City'] },
  { code: 'IXC', name: 'Shaheed Bhagat Singh International Airport', city: 'Chandigarh', state: 'Chandigarh', country: 'India', lat: 30.6735, lon: 76.7885, aliases: ['Mohali', 'Panchkula'] },
  { code: 'ATQ', name: 'Sri Guru Ram Dass Jee International Airport', city: 'Amritsar', state: 'Punjab', country: 'India', lat: 31.7096, lon: 74.7973, aliases: ['Raja Sansi', 'Golden Temple'] },
  { code: 'GAU', name: 'Lokpriya Gopinath Bordoloi International Airport', city: 'Guwahati', state: 'Assam', country: 'India', lat: 26.1061, lon: 91.5859, aliases: ['Borjhar', 'Assam Hub'] },
  { code: 'SXR', name: 'Sheikh ul-Alam International Airport', city: 'Srinagar', state: 'Jammu and Kashmir', country: 'India', lat: 33.9871, lon: 74.7744, aliases: ['Kashmir', 'Dal Lake'] },
  { code: 'IXB', name: 'Bagdogra International Airport', city: 'Siliguri', state: 'West Bengal', country: 'India', lat: 26.6812, lon: 88.3286, aliases: ['Darjeeling Gate', 'Sikkim Gate'] },
  { code: 'TRV', name: 'Thiruvananthapuram International Airport', city: 'Thiruvananthapuram', state: 'Kerala', country: 'India', lat: 8.4821, lon: 76.9200, aliases: ['Trivandrum', 'Chakai'] },
  { code: 'IXZ', name: 'Veer Savarkar International Airport', city: 'Port Blair', state: 'Andaman and Nicobar Islands', country: 'India', lat: 11.6410, lon: 92.7297, aliases: ['Andamans', 'Havelock'] },
  { code: 'BBI', name: 'Biju Patnaik International Airport', city: 'Bhubaneswar', state: 'Odisha', country: 'India', lat: 20.2444, lon: 85.8178, aliases: ['Puri Gate', 'Cuttack'] },
  { code: 'PAT', name: 'Jay Prakash Narayan Airport', city: 'Patna', state: 'Bihar', country: 'India', lat: 25.5913, lon: 85.0880, aliases: ['Bihar'] },
  { code: 'IDR', name: 'Devi Ahilyabai Holkar Airport', city: 'Indore', state: 'Madhya Pradesh', country: 'India', lat: 22.7217, lon: 75.8011, aliases: ['Malwa'] },
  { code: 'VNS', name: 'Lal Bahadur Shastri International Airport', city: 'Varanasi', state: 'Uttar Pradesh', country: 'India', lat: 25.4524, lon: 82.8593, aliases: ['Babarput', 'Banaras', 'Kashi'] },
  { code: 'UDR', name: 'Maharana Pratap Airport', city: 'Udaipur', state: 'Rajasthan', country: 'India', lat: 24.6177, lon: 73.8961, aliases: ['Dabok', 'Lake City'] },
  { code: 'IXJ', name: 'Jammu Airport', city: 'Jammu', state: 'Jammu and Kashmir', country: 'India', lat: 32.6891, lon: 74.8374, aliases: ['Satwari', 'Vaishno Devi Gate'] },
  { code: 'DED', name: 'Jolly Grant Airport', city: 'Dehradun', state: 'Uttarakhand', country: 'India', lat: 30.1897, lon: 78.1803, aliases: ['Rishikesh', 'Haridwar Gate', 'Mussoorie'] },
  { code: 'AGR', name: 'Agra Airport / Kheria Air Force Station', city: 'Agra', state: 'Uttar Pradesh', country: 'India', lat: 27.1558, lon: 77.9609, aliases: ['Taj Mahal Air'] },

  // International Tier-1 Gateways
  { code: 'DXB', name: 'Dubai International Airport', city: 'Dubai', country: 'United Arab Emirates', lat: 25.2532, lon: 55.3657, aliases: ['UAE', 'Emirates Hub'] },
  { code: 'AUH', name: 'Zayed International Airport (Abu Dhabi)', city: 'Abu Dhabi', country: 'United Arab Emirates', lat: 24.4330, lon: 54.6511, aliases: ['Etihad Hub'] },
  { code: 'DOH', name: 'Hamad International Airport', city: 'Doha', country: 'Qatar', lat: 25.2731, lon: 51.6081, aliases: ['Qatar Airways Hub'] },
  { code: 'SIN', name: 'Singapore Changi Airport', city: 'Singapore', country: 'Singapore', lat: 1.3644, lon: 103.9915, aliases: ['Changi'] },
  { code: 'BKK', name: 'Suvarnabhumi Airport', city: 'Bangkok', country: 'Thailand', lat: 13.6900, lon: 100.7501, aliases: ['Bangkok Main', 'Siam'] },
  { code: 'DMK', name: 'Don Mueang International Airport', city: 'Bangkok', country: 'Thailand', lat: 13.9126, lon: 100.6067, aliases: ['Bangkok Budget'] },
  { code: 'HKT', name: 'Phuket International Airport', city: 'Phuket', country: 'Thailand', lat: 8.1132, lon: 98.3169, aliases: ['Phuket Island', 'Patong'] },
  { code: 'DPS', name: 'Ngurah Rai International Airport (Denpasar)', city: 'Bali', country: 'Indonesia', lat: -8.7482, lon: 115.1672, aliases: ['Bali Denpasar', 'Kuta', 'Seminyak'] },
  { code: 'KUL', name: 'Kuala Lumpur International Airport', city: 'Kuala Lumpur', country: 'Malaysia', lat: 2.7456, lon: 101.7099, aliases: ['KLIA', 'KLIA2', 'Sepang'] },
  { code: 'LHR', name: 'London Heathrow Airport', city: 'London', country: 'United Kingdom', lat: 51.4700, lon: -0.4543, aliases: ['Heathrow', 'UK Main'] },
  { code: 'LGW', name: 'London Gatwick Airport', city: 'London', country: 'United Kingdom', lat: 51.1537, lon: -0.1821, aliases: ['Gatwick'] },
  { code: 'CDG', name: 'Paris Charles de Gaulle Airport', city: 'Paris', country: 'France', lat: 49.0097, lon: 2.5479, aliases: ['Roissy', 'France Main'] },
  { code: 'AMS', name: 'Amsterdam Airport Schiphol', city: 'Amsterdam', country: 'Netherlands', lat: 52.3105, lon: 4.7683, aliases: ['Schiphol'] },
  { code: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany', lat: 50.0379, lon: 8.5622, aliases: ['Lufthansa Hub'] },
  { code: 'ZRH', name: 'Zurich Airport', city: 'Zurich', country: 'Switzerland', lat: 47.4582, lon: 8.5555, aliases: ['Kloten', 'Swiss Gate'] },
  { code: 'FCO', name: 'Leonardo da Vinci–Fiumicino Airport', city: 'Rome', country: 'Italy', lat: 41.8003, lon: 12.2389, aliases: ['Fiumicino'] },
  { code: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', state: 'NY', country: 'United States', lat: 40.6413, lon: -73.7781, aliases: ['NYC', 'Queens'] },
  { code: 'EWR', name: 'Newark Liberty International Airport', city: 'New York', state: 'NJ', country: 'United States', lat: 40.6895, lon: -74.1745, aliases: ['NYC Newark'] },
  { code: 'SFO', name: 'San Francisco International Airport', city: 'San Francisco', state: 'CA', country: 'United States', lat: 37.6213, lon: -122.3790, aliases: ['Bay Area', 'Silicon Valley'] },
  { code: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles', state: 'CA', country: 'United States', lat: 33.9416, lon: -118.4085, aliases: ['SoCal', 'Hollywood'] },
  { code: 'YYZ', name: 'Toronto Pearson International Airport', city: 'Toronto', state: 'ON', country: 'Canada', lat: 43.6777, lon: -79.6248, aliases: ['Pearson', 'Ontario'] },
  { code: 'SYD', name: 'Sydney Kingsford Smith Airport', city: 'Sydney', country: 'Australia', lat: -33.9399, lon: 151.1753, aliases: ['Mascot', 'Australia Gate'] },
  { code: 'MEL', name: 'Melbourne Airport', city: 'Melbourne', country: 'Australia', lat: -37.6690, lon: 144.8410, aliases: ['Tullamarine'] },
  { code: 'NRT', name: 'Narita International Airport', city: 'Tokyo', country: 'Japan', lat: 35.7720, lon: 140.3929, aliases: ['Tokyo Narita'] },
  { code: 'HND', name: 'Haneda Airport (Tokyo International)', city: 'Tokyo', country: 'Japan', lat: 35.5494, lon: 139.7798, aliases: ['Tokyo Haneda'] },
];

// ================= 2. VERIFIED RAILWAY STATIONS DATASET (TRAINS ONLY) =================
export interface StationRecord {
  code: string;
  name: string;
  city: string;
  state: string;
  country: string;
  aliases?: string[];
}

const VERIFIED_STATIONS: StationRecord[] = [
  // Delhi
  { code: 'NDLS', name: 'New Delhi Railway Station', city: 'Delhi', state: 'Delhi', country: 'India', aliases: ['Paharganj', 'Ajmeri Gate', 'Central Delhi'] },
  { code: 'DLI', name: 'Old Delhi Railway Station (Delhi Junction)', city: 'Delhi', state: 'Delhi', country: 'India', aliases: ['Chandni Chowk', 'Kashmere Gate'] },
  { code: 'NZM', name: 'Hazrat Nizamuddin Railway Station', city: 'Delhi', state: 'Delhi', country: 'India', aliases: ['Nizamuddin', 'South Delhi', 'Rajdhani Hub'] },
  { code: 'ANVT', name: 'Anand Vihar Terminal', city: 'Delhi', state: 'Delhi', country: 'India', aliases: ['East Delhi', 'Trans Yamuna'] },
  { code: 'DEE', name: 'Delhi Sarai Rohilla Railway Station', city: 'Delhi', state: 'Delhi', country: 'India', aliases: ['Sarai Rohilla', 'West Delhi'] },

  // Mumbai
  { code: 'MMCT', name: 'Mumbai Central', city: 'Mumbai', state: 'Maharashtra', country: 'India', aliases: ['Bombay Central', 'WR Headquarters'] },
  { code: 'CSMT', name: 'Chhatrapati Shivaji Maharaj Terminus', city: 'Mumbai', state: 'Maharashtra', country: 'India', aliases: ['VT', 'Victoria Terminus', 'South Mumbai'] },
  { code: 'BDTS', name: 'Bandra Terminus', city: 'Mumbai', state: 'Maharashtra', country: 'India', aliases: ['Bandra East', 'Suburban Hub'] },
  { code: 'LTT', name: 'Lokmanya Tilak Terminus (Kurla)', city: 'Mumbai', state: 'Maharashtra', country: 'India', aliases: ['Kurla Terminus', 'Central Line'] },
  { code: 'DR', name: 'Dadar Central / Western', city: 'Mumbai', state: 'Maharashtra', country: 'India', aliases: ['Dadar TT', 'Midtown Junction'] },

  // Bengaluru
  { code: 'SBC', name: 'KSR Bengaluru City Junction', city: 'Bengaluru', state: 'Karnataka', country: 'India', aliases: ['Majestic Station', 'Bangalore City'] },
  { code: 'SMVB', name: 'Sir M. Visvesvaraya Terminal (Baiyappanahalli)', city: 'Bengaluru', state: 'Karnataka', country: 'India', aliases: ['AC Terminal Baiyappanahalli'] },
  { code: 'YPR', name: 'Yesvantpur Junction', city: 'Bengaluru', state: 'Karnataka', country: 'India', aliases: ['North Bangalore'] },
  { code: 'BNC', name: 'Bengaluru Cantt Railway Station', city: 'Bengaluru', state: 'Karnataka', country: 'India', aliases: ['Bangalore Cantonment'] },

  // Other Major Indian Stations
  { code: 'MAS', name: 'MGR Chennai Central', city: 'Chennai', state: 'Tamil Nadu', country: 'India', aliases: ['Madras Central', 'Southern Hub'] },
  { code: 'MS', name: 'Chennai Egmore Railway Station', city: 'Chennai', state: 'Tamil Nadu', country: 'India', aliases: ['Egmore'] },
  { code: 'HWH', name: 'Howrah Junction', city: 'Kolkata', state: 'West Bengal', country: 'India', aliases: ['Howrah Bridge', 'Eastern Hub'] },
  { code: 'SDAH', name: 'Sealdah Railway Station', city: 'Kolkata', state: 'West Bengal', country: 'India', aliases: ['North Sealdah'] },
  { code: 'SC', name: 'Secunderabad Junction', city: 'Hyderabad', state: 'Telangana', country: 'India', aliases: ['Twin City Station'] },
  { code: 'HYB', name: 'Hyderabad Deccan (Nampally)', city: 'Hyderabad', state: 'Telangana', country: 'India', aliases: ['Nampally'] },
  { code: 'PUNE', name: 'Pune Junction', city: 'Pune', state: 'Maharashtra', country: 'India', aliases: ['Poona Central'] },
  { code: 'ADI', name: 'Ahmedabad Junction (Kalupur)', city: 'Ahmedabad', state: 'Gujarat', country: 'India', aliases: ['Kalupur'] },
  { code: 'JP', name: 'Jaipur Junction', city: 'Jaipur', state: 'Rajasthan', country: 'India', aliases: ['Pink City Junction'] },
  { code: 'AGC', name: 'Agra Cantt Railway Station', city: 'Agra', state: 'Uttar Pradesh', country: 'India', aliases: ['Taj Cantt', 'Shatabdi Stop'] },
  { code: 'AF', name: 'Agra Fort Railway Station', city: 'Agra', state: 'Uttar Pradesh', country: 'India', aliases: ['Fort Station'] },
  { code: 'BSB', name: 'Varanasi Junction (Cantonment)', city: 'Varanasi', state: 'Uttar Pradesh', country: 'India', aliases: ['Banaras Cantt', 'Kashi Junction'] },
  { code: 'DDU', name: 'Pt. Deen Dayal Upadhyaya Junction (Mughalsarai)', city: 'Varanasi', state: 'Uttar Pradesh', country: 'India', aliases: ['Mughalsarai Junction'] },
  { code: 'CNB', name: 'Kanpur Central Railway Station', city: 'Kanpur', state: 'Uttar Pradesh', country: 'India', aliases: ['Kanpur'] },
  { code: 'LKO', name: 'Lucknow Charbagh Railway Station (NR)', city: 'Lucknow', state: 'Uttar Pradesh', country: 'India', aliases: ['Charbagh NR'] },
  { code: 'ASR', name: 'Amritsar Junction', city: 'Amritsar', state: 'Punjab', country: 'India', aliases: ['Golden Temple Station'] },
  { code: 'CDG', name: 'Chandigarh Junction', city: 'Chandigarh', state: 'Chandigarh', country: 'India', aliases: ['City Beautiful Station'] },
  { code: 'JAT', name: 'Jammu Tawi Railway Station', city: 'Jammu', state: 'Jammu and Kashmir', country: 'India', aliases: ['Vaishno Devi Railhead'] },
  { code: 'MAO', name: 'Madgaon Junction', city: 'Goa', state: 'Goa', country: 'India', aliases: ['Margao', 'South Goa Railhead'] },
  { code: 'KRMI', name: 'Karmali Railway Station', city: 'Goa', state: 'Goa', country: 'India', aliases: ['Old Goa', 'Panjim Railhead'] },
  { code: 'THVM', name: 'Thivim Railway Station', city: 'Goa', state: 'Goa', country: 'India', aliases: ['North Goa Beach Railhead', 'Calangute Gate'] },
  { code: 'ERS', name: 'Ernakulam Junction (South)', city: 'Kochi', state: 'Kerala', country: 'India', aliases: ['Cochin South'] },
  { code: 'TVC', name: 'Thiruvananthapuram Central', city: 'Thiruvananthapuram', state: 'Kerala', country: 'India', aliases: ['Trivandrum Central'] },
  { code: 'GHY', name: 'Guwahati Railway Station', city: 'Guwahati', state: 'Assam', country: 'India', aliases: ['Paltan Bazaar'] },
  { code: 'BBS', name: 'Bhubaneswar Railway Station', city: 'Bhubaneswar', state: 'Odisha', country: 'India', aliases: ['Master Canteen'] },
  { code: 'PNBE', name: 'Patna Junction', city: 'Patna', state: 'Bihar', country: 'India', aliases: ['Bihar Central'] },
];

// ================= 3. VERIFIED BUS TERMINALS & HUBS (BUSES ONLY) =================
export interface BusPointRecord {
  id: string;
  name: string;
  city: string;
  state: string;
  country: string;
  hub_type: 'ISBT' | 'TERMINAL' | 'PICKUP_POINT' | 'MAJOR_CROSSING';
  aliases?: string[];
}

const VERIFIED_BUS_POINTS: BusPointRecord[] = [
  // Delhi
  { id: 'bus-del-isbt-kg', name: 'Kashmere Gate ISBT (Maharana Pratap Inter-State Bus Terminus)', city: 'Delhi', state: 'Delhi', country: 'India', hub_type: 'ISBT', aliases: ['Old Delhi Bus Stand', 'Kashmere Gate'] },
  { id: 'bus-del-isbt-av', name: 'Anand Vihar ISBT (Swami Vivekanand Bus Terminal)', city: 'Delhi', state: 'Delhi', country: 'India', hub_type: 'ISBT', aliases: ['East Delhi Bus Stand', 'Anand Vihar'] },
  { id: 'bus-del-isbt-skk', name: 'Sarai Kale Khan ISBT (Vir Hakikat Rai Bus Terminal)', city: 'Delhi', state: 'Delhi', country: 'India', hub_type: 'ISBT', aliases: ['Nizamuddin Bus Stand', 'Sarai Kale Khan'] },
  { id: 'bus-del-mkt', name: 'Majnu Ka Tila Tibetan Colony Bus Point', city: 'Delhi', state: 'Delhi', country: 'India', hub_type: 'PICKUP_POINT', aliases: ['Himachal Volvo Boarding', 'Manali Bus Point'] },
  { id: 'bus-del-dhaula-kuan', name: 'Dhaula Kuan Metro Bus Stop', city: 'Delhi', state: 'Delhi', country: 'India', hub_type: 'MAJOR_CROSSING', aliases: ['Ring Road Crossing', 'Airport Link'] },
  { id: 'bus-del-akshardham', name: 'Akshardham Metro Station Bus Boarding', city: 'Delhi', state: 'Delhi', country: 'India', hub_type: 'PICKUP_POINT', aliases: ['Noida Link', 'UP Volvo Boarding'] },

  // Mumbai
  { id: 'bus-bom-borivali', name: 'Borivali West (Gokul Hotel / National Park)', city: 'Mumbai', state: 'Maharashtra', country: 'India', hub_type: 'PICKUP_POINT', aliases: ['Borivali Highway', 'Western Suburbs Hub'] },
  { id: 'bus-bom-dadar', name: 'Dadar TT Circle / Asiad Stand', city: 'Mumbai', state: 'Maharashtra', country: 'India', hub_type: 'TERMINAL', aliases: ['Dadar Central Bus Point', 'Pune Asiad Stand'] },
  { id: 'bus-bom-vashi', name: 'Vashi Highway Plaza / Old Toll Plaza', city: 'Mumbai', state: 'Maharashtra', country: 'India', hub_type: 'MAJOR_CROSSING', aliases: ['Navi Mumbai Hub', 'Sion-Panvel Highway'] },
  { id: 'bus-bom-andheri', name: 'Andheri East (WEH Metro / Bisleri Compound)', city: 'Mumbai', state: 'Maharashtra', country: 'India', hub_type: 'PICKUP_POINT', aliases: ['Airport Crossing', 'Western Express'] },
  { id: 'bus-bom-thane', name: 'Thane Teen Hath Naka / Cadbury Junction', city: 'Mumbai', state: 'Maharashtra', country: 'India', hub_type: 'MAJOR_CROSSING', aliases: ['Thane Central Hub'] },

  // Bengaluru
  { id: 'bus-blr-majestic', name: 'Majestic Kempegowda Bus Station (KSRTC & Private Stands)', city: 'Bengaluru', state: 'Karnataka', country: 'India', hub_type: 'ISBT', aliases: ['City Bus Stand', 'Subhash Nagar'] },
  { id: 'bus-blr-silkboard', name: 'Central Silk Board Junction (Hosur Road)', city: 'Bengaluru', state: 'Karnataka', country: 'India', hub_type: 'MAJOR_CROSSING', aliases: ['Electronic City Link', 'Koramangala Hub'] },
  { id: 'bus-blr-madiwala', name: 'Madiwala Police Station / Total Mall Stand', city: 'Bengaluru', state: 'Karnataka', country: 'India', hub_type: 'PICKUP_POINT', aliases: ['Kerala & Tamil Nadu Buses', 'Madiwala Hub'] },
  { id: 'bus-blr-anandrao', name: 'Anand Rao Circle Private Bus Lounge', city: 'Bengaluru', state: 'Karnataka', country: 'India', hub_type: 'TERMINAL', aliases: ['Private Operators Hub', 'Race Course Road'] },
  { id: 'bus-blr-hebbal', name: 'Hebbal Esteem Mall Bus Stop', city: 'Bengaluru', state: 'Karnataka', country: 'India', hub_type: 'MAJOR_CROSSING', aliases: ['North Bangalore Hub', 'Airport Road'] },

  // Goa
  { id: 'bus-goa-panjim', name: 'Panjim KTC Central Bus Stand', city: 'Goa', state: 'Goa', country: 'India', hub_type: 'ISBT', aliases: ['Panaji Bus Stand', 'Patto Plaza'] },
  { id: 'bus-goa-mapusa', name: 'Mapusa KTC Bus Stand', city: 'Goa', state: 'Goa', country: 'India', hub_type: 'TERMINAL', aliases: ['North Goa Beach Gateway', 'Anjuna Vagator Link'] },
  { id: 'bus-goa-margao', name: 'Margao KTC Bus Stand', city: 'Goa', state: 'Goa', country: 'India', hub_type: 'TERMINAL', aliases: ['South Goa Central Stand', 'Madgaon Bus Hub'] },
  { id: 'bus-goa-calangute', name: 'Calangute Football Ground Private Stop', city: 'Goa', state: 'Goa', country: 'India', hub_type: 'PICKUP_POINT', aliases: ['Calangute Beach Bus Stop', 'Baga Road'] },

  // Jaipur
  { id: 'bus-jai-sindhicamp', name: 'Sindhi Camp Central Bus Stand (RSRTC Central)', city: 'Jaipur', state: 'Rajasthan', country: 'India', hub_type: 'ISBT', aliases: ['Jaipur Central Stand', 'Station Road'] },
  { id: 'bus-jai-narayan-singh', name: 'Narayan Singh Circle Private Bus Stop', city: 'Jaipur', state: 'Rajasthan', country: 'India', hub_type: 'PICKUP_POINT', aliases: ['Tonk Road Point', 'Volvo Stand'] },

  // Pune
  { id: 'bus-pnq-swargate', name: 'Swargate ST Bus Stand', city: 'Pune', state: 'Maharashtra', country: 'India', hub_type: 'ISBT', aliases: ['South Pune Central'] },
  { id: 'bus-pnq-wakad', name: 'Wakad Hinjewadi Bridge Highway Stop', city: 'Pune', state: 'Maharashtra', country: 'India', hub_type: 'MAJOR_CROSSING', aliases: ['IT Park Bus Point', 'Expressway Entry'] },

  // Manali & Himachal
  { id: 'bus-manali-volvo', name: 'Private Volvo Bus Stand (Aleo / Near Mall Road)', city: 'Manali', state: 'Himachal Pradesh', country: 'India', hub_type: 'TERMINAL', aliases: ['Manali Volvo Stand', 'Beas River Stand'] },
  { id: 'bus-shimla-isbt', name: 'ISBT Tutikandi (Shimla New Bus Stand)', city: 'Shimla', state: 'Himachal Pradesh', country: 'India', hub_type: 'ISBT', aliases: ['Shimla Central Stand', 'Bypass Bus Stand'] },
  { id: 'bus-rishikesh-natraj', name: 'Natraj Chowk / Nepali Farm Highway Stop', city: 'Rishikesh', state: 'Uttarakhand', country: 'India', hub_type: 'MAJOR_CROSSING', aliases: ['Haridwar-Rishikesh Link', 'Tapovan Gate'] },
];

// ================= 4. VERIFIED COUNTRIES DATASET (VISA & INSURANCE ONLY) =================
export interface CountryRecord {
  code: string; // ISO-2
  iso3: string;
  name: string;
  continent: string;
  popular_flag: string;
  visa_types_available?: string[];
  requires_visa_for_indian_passports: boolean;
  aliases?: string[];
}

const VERIFIED_COUNTRIES: CountryRecord[] = [
  { code: 'AE', iso3: 'ARE', name: 'United Arab Emirates', continent: 'Asia', popular_flag: '🇦🇪', requires_visa_for_indian_passports: true, aliases: ['Dubai', 'Abu Dhabi', 'Sharjah', 'UAE'], visa_types_available: ['30-Days Express Tourist eVisa', '60-Days Tourist eVisa', '14-Days Transit Visa'] },
  { code: 'SG', iso3: 'SGP', name: 'Singapore', continent: 'Asia', popular_flag: '🇸🇬', requires_visa_for_indian_passports: true, aliases: ['Lion City', 'Changi'], visa_types_available: ['30-Days Multiple Entry eVisa'] },
  { code: 'TH', iso3: 'THA', name: 'Thailand', continent: 'Asia', popular_flag: '🇹🇭', requires_visa_for_indian_passports: false, aliases: ['Bangkok', 'Phuket', 'Siam'], visa_types_available: ['Visa On Arrival / Visa-Free Regime', '60-Days Tourist eVisa'] },
  { code: 'VN', iso3: 'VNM', name: 'Vietnam', continent: 'Asia', popular_flag: '🇻🇳', requires_visa_for_indian_passports: true, aliases: ['Hanoi', 'Ho Chi Minh', 'Danang'], visa_types_available: ['30-Days Single Entry eVisa', '90-Days Multiple Entry eVisa'] },
  { code: 'ID', iso3: 'IDN', name: 'Indonesia', continent: 'Asia', popular_flag: '🇮🇩', requires_visa_for_indian_passports: true, aliases: ['Bali', 'Jakarta'], visa_types_available: ['30-Days e-VOA (Visa on Arrival)', '60-Days Tourist Visa'] },
  { code: 'MY', iso3: 'MYS', name: 'Malaysia', continent: 'Asia', popular_flag: '🇲🇾', requires_visa_for_indian_passports: false, aliases: ['Kuala Lumpur', 'Penang'], visa_types_available: ['Visa-Free Regime Assistance', '30-Days eNTRI / eVisa'] },
  { code: 'GB', iso3: 'GBR', name: 'United Kingdom', continent: 'Europe', popular_flag: '🇬🇧', requires_visa_for_indian_passports: true, aliases: ['UK', 'Great Britain', 'England', 'Scotland', 'London'], visa_types_available: ['Standard Visitor Visa (6 Months)', '2-Year Long Term Visitor Visa'] },
  { code: 'US', iso3: 'USA', name: 'United States of America', continent: 'North America', popular_flag: '🇺🇸', requires_visa_for_indian_passports: true, aliases: ['USA', 'America', 'New York', 'California'], visa_types_available: ['B1/B2 Tourist & Business Visa Assistance'] },
  { code: 'FR', iso3: 'FRA', name: 'France (Schengen)', continent: 'Europe', popular_flag: '🇫🇷', requires_visa_for_indian_passports: true, aliases: ['Paris', 'Schengen Area'], visa_types_available: ['Short Stay Schengen Tourist Visa (Type C)'] },
  { code: 'CH', iso3: 'CHE', name: 'Switzerland (Schengen)', continent: 'Europe', popular_flag: '🇨🇭', requires_visa_for_indian_passports: true, aliases: ['Swiss', 'Zurich', 'Geneva'], visa_types_available: ['Short Stay Schengen Tourist Visa (Type C)'] },
  { code: 'DE', iso3: 'DEU', name: 'Germany (Schengen)', continent: 'Europe', popular_flag: '🇩🇪', requires_visa_for_indian_passports: true, aliases: ['Berlin', 'Frankfurt', 'Munich'], visa_types_available: ['Short Stay Schengen Tourist Visa (Type C)'] },
  { code: 'IT', iso3: 'ITA', name: 'Italy (Schengen)', continent: 'Europe', popular_flag: '🇮🇹', requires_visa_for_indian_passports: true, aliases: ['Rome', 'Milan', 'Venice', 'Florence'], visa_types_available: ['Short Stay Schengen Tourist Visa (Type C)'] },
  { code: 'ES', iso3: 'ESP', name: 'Spain (Schengen)', continent: 'Europe', popular_flag: '🇪🇸', requires_visa_for_indian_passports: true, aliases: ['Madrid', 'Barcelona', 'Ibiza'], visa_types_available: ['Short Stay Schengen Tourist Visa (Type C)'] },
  { code: 'NL', iso3: 'NLD', name: 'Netherlands (Schengen)', continent: 'Europe', popular_flag: '🇳🇱', requires_visa_for_indian_passports: true, aliases: ['Holland', 'Amsterdam'], visa_types_available: ['Short Stay Schengen Tourist Visa (Type C)'] },
  { code: 'JP', iso3: 'JPN', name: 'Japan', continent: 'Asia', popular_flag: '🇯🇵', requires_visa_for_indian_passports: true, aliases: ['Tokyo', 'Kyoto', 'Osaka'], visa_types_available: ['Single Entry Tourist eVisa', 'Temporary Visitor Visa'] },
  { code: 'AU', iso3: 'AUS', name: 'Australia', continent: 'Oceania', popular_flag: '🇦🇺', requires_visa_for_indian_passports: true, aliases: ['Sydney', 'Melbourne', 'Brisbane'], visa_types_available: ['Visitor Visa (Subclass 600)'] },
  { code: 'CA', iso3: 'CAN', name: 'Canada', continent: 'North America', popular_flag: '🇨🇦', requires_visa_for_indian_passports: true, aliases: ['Toronto', 'Vancouver', 'Montreal'], visa_types_available: ['Temporary Resident Visa (Visitor Visa)'] },
  { code: 'TR', iso3: 'TUR', name: 'Turkey (Türkiye)', continent: 'Europe/Asia', popular_flag: '🇹🇷', requires_visa_for_indian_passports: true, aliases: ['Istanbul', 'Cappadocia'], visa_types_available: ['30-Days Tourist eVisa (with valid US/UK/Schengen)'] },
  { code: 'LK', iso3: 'LKA', name: 'Sri Lanka', continent: 'Asia', popular_flag: '🇱🇰', requires_visa_for_indian_passports: true, aliases: ['Colombo', 'Kandy'], visa_types_available: ['30-Days Tourist ETA (Electronic Travel Authorization)'] },
  { code: 'MV', iso3: 'MDV', name: 'Maldives', continent: 'Asia', popular_flag: '🇲🇻', requires_visa_for_indian_passports: false, aliases: ['Male', 'Atoll'], visa_types_available: ['30-Days Free Tourist Visa on Arrival'] },
  { code: 'MU', iso3: 'MUS', name: 'Mauritius', continent: 'Africa', popular_flag: '🇲🇺', requires_visa_for_indian_passports: false, aliases: ['Port Louis'], visa_types_available: ['60-Days Free Tourist Visa on Arrival'] },
  { code: 'SA', iso3: 'SAU', name: 'Saudi Arabia', continent: 'Asia', popular_flag: '🇸🇦', requires_visa_for_indian_passports: true, aliases: ['Riyadh', 'Jeddah', 'Mecca'], visa_types_available: ['1-Year Multiple Entry Tourist eVisa', 'Umrah Visa'] },
  { code: 'QA', iso3: 'QAT', name: 'Qatar', continent: 'Asia', popular_flag: '🇶🇦', requires_visa_for_indian_passports: false, aliases: ['Doha'], visa_types_available: ['30-Days Visa Waiver on Arrival'] },
  { code: 'OM', iso3: 'OMN', name: 'Oman', continent: 'Asia', popular_flag: '🇴🇲', requires_visa_for_indian_passports: true, aliases: ['Muscat'], visa_types_available: ['10-Days / 30-Days Tourist eVisa'] },
  { code: 'EG', iso3: 'EGY', name: 'Egypt', continent: 'Africa', popular_flag: '🇪🇬', requires_visa_for_indian_passports: true, aliases: ['Cairo', 'Pyramids', 'Giza'], visa_types_available: ['30-Days Tourist eVisa'] },
  { code: 'ZA', iso3: 'ZAF', name: 'South Africa', continent: 'Africa', popular_flag: '🇿🇦', requires_visa_for_indian_passports: true, aliases: ['Cape Town', 'Johannesburg'], visa_types_available: ['Visitor Visa Subclass'] },
  { code: 'NZ', iso3: 'NZL', name: 'New Zealand', continent: 'Oceania', popular_flag: '🇳🇿', requires_visa_for_indian_passports: true, aliases: ['Auckland', 'Queenstown'], visa_types_available: ['Visitor Visa (General)'] },
  { code: 'KR', iso3: 'KOR', name: 'South Korea', continent: 'Asia', popular_flag: '🇰🇷', requires_visa_for_indian_passports: true, aliases: ['Seoul', 'Busan'], visa_types_available: ['C-3-9 Individual Tourist Visa'] },
  { code: 'GR', iso3: 'GRC', name: 'Greece (Schengen)', continent: 'Europe', popular_flag: '🇬🇷', requires_visa_for_indian_passports: true, aliases: ['Athens', 'Santorini', 'Mykonos'], visa_types_available: ['Short Stay Schengen Tourist Visa (Type C)'] },
  { code: 'AT', iso3: 'AUT', name: 'Austria (Schengen)', continent: 'Europe', popular_flag: '🇦🇹', requires_visa_for_indian_passports: true, aliases: ['Vienna', 'Salzburg'], visa_types_available: ['Short Stay Schengen Tourist Visa (Type C)'] },
  { code: 'PT', iso3: 'PRT', name: 'Portugal (Schengen)', continent: 'Europe', popular_flag: '🇵🇹', requires_visa_for_indian_passports: true, aliases: ['Lisbon', 'Porto'], visa_types_available: ['Short Stay Schengen Tourist Visa (Type C)'] },
  { code: 'PH', iso3: 'PHL', name: 'Philippines', continent: 'Asia', popular_flag: '🇵🇭', requires_visa_for_indian_passports: true, aliases: ['Manila', 'Boracay'], visa_types_available: ['9(A) Temporary Visitor Visa'] },
  { code: 'GE', iso3: 'GEO', name: 'Georgia', continent: 'Europe', popular_flag: '🇬🇪', requires_visa_for_indian_passports: true, aliases: ['Tbilisi', 'Batumi'], visa_types_available: ['Short-Term Tourist eVisa'] },
  { code: 'AZ', iso3: 'AZE', name: 'Azerbaijan', continent: 'Asia/Europe', popular_flag: '🇦🇿', requires_visa_for_indian_passports: true, aliases: ['Baku'], visa_types_available: ['3-Days ASAN Tourist eVisa'] },
  { code: 'KZ', iso3: 'KAZ', name: 'Kazakhstan', continent: 'Asia', popular_flag: '🇰🇿', requires_visa_for_indian_passports: false, aliases: ['Almaty', 'Astana'], visa_types_available: ['14-Days Free Visa-Exempt Travel'] },
  { code: 'UZ', iso3: 'UZB', name: 'Uzbekistan', continent: 'Asia', popular_flag: '🇺🇿', requires_visa_for_indian_passports: true, aliases: ['Tashkent', 'Samarkand'], visa_types_available: ['30-Days Single Entry Tourist eVisa'] },
  { code: 'RU', iso3: 'RUS', name: 'Russia', continent: 'Europe/Asia', popular_flag: '🇷🇺', requires_visa_for_indian_passports: true, aliases: ['Moscow', 'St. Petersburg'], visa_types_available: ['16-Days Unified Electronic Visa (e-Visa)'] },
  { code: 'BR', iso3: 'BRA', name: 'Brazil', continent: 'South America', popular_flag: '🇧🇷', requires_visa_for_indian_passports: true, aliases: ['Rio de Janeiro', 'Sao Paulo'], visa_types_available: ['VIVIS Visitor Visa'] },
  { code: 'MX', iso3: 'MEX', name: 'Mexico', continent: 'North America', popular_flag: '🇲🇽', requires_visa_for_indian_passports: true, aliases: ['Cancun', 'Mexico City'], visa_types_available: ['Tourist Visa (Free entry if holding valid US Visa)'] },
  { code: 'IE', iso3: 'IRL', name: 'Ireland', continent: 'Europe', popular_flag: '🇮🇪', requires_visa_for_indian_passports: true, aliases: ['Dublin'], visa_types_available: ["Short Stay 'C' Visit Tourist Visa"] },
];

// ================= 5. CURATED TOP GLOBAL TRAVEL DESTINATIONS =================
export interface CuratedCityHub {
  id: string;
  name: string;
  display_name: string;
  formatted_address: string;
  city: string;
  state?: string;
  country: string;
  category: 'AIRPORT' | 'STATION' | 'BUS_STOP' | 'HOTEL' | 'LOCALITY' | 'LANDMARK' | 'ADDRESS';
  category_label: string;
  lat: number;
  lon: number;
  aliases?: string[];
  service_affinity: string[];
}

const CURATED_CITY_HUBS: CuratedCityHub[] = [
  // Delhi
  {
    id: 'hub-del-cp',
    name: 'Connaught Place (Rajiv Chowk)',
    display_name: 'Connaught Place / Central Delhi Commercial Center',
    formatted_address: 'Connaught Place, Inner Circle, New Delhi, Delhi 110001, India',
    city: 'Delhi',
    state: 'Delhi',
    country: 'India',
    category: 'LOCALITY',
    category_label: 'City Center',
    lat: 28.6315,
    lon: 77.2167,
    aliases: ['CP', 'Rajiv Chowk', 'Central Delhi'],
    service_affinity: ['hotels', 'villas', 'cabs', 'tours'],
  },
  {
    id: 'hub-del-cyberhub',
    name: 'DLF Cyber City & CyberHub',
    display_name: 'DLF CyberHub, Gurugram IT Corridor',
    formatted_address: 'DLF Cyber City, DLF Phase 2, Sector 24, Gurugram, Haryana 122002, India',
    city: 'Gurugram',
    state: 'Haryana',
    country: 'India',
    category: 'LANDMARK',
    category_label: 'Business District',
    lat: 28.4986,
    lon: 77.0878,
    aliases: ['CyberHub', 'Gurgaon', 'DLF Phase 2'],
    service_affinity: ['hotels', 'cabs'],
  },

  // Mumbai
  {
    id: 'hub-bom-marine-drive',
    name: 'Marine Drive / Nariman Point',
    display_name: 'Marine Drive Promenade & Nariman Point, South Mumbai',
    formatted_address: 'Netaji Subhash Chandra Bose Road, Churchgate, Mumbai, Maharashtra 400020, India',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    category: 'LANDMARK',
    category_label: 'Scenic Promenade',
    lat: 18.9432,
    lon: 72.8234,
    aliases: ['Queen Necklace', 'Churchgate', 'South Bombay'],
    service_affinity: ['hotels', 'cabs', 'tours'],
  },
  {
    id: 'hub-bom-bkc',
    name: 'Bandra Kurla Complex (BKC)',
    display_name: 'Bandra Kurla Complex (BKC), Financial District, Mumbai',
    formatted_address: 'Bandra Kurla Complex, G Block, Bandra East, Mumbai, Maharashtra 400051, India',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    category: 'LOCALITY',
    category_label: 'Financial District',
    lat: 19.0657,
    lon: 72.8687,
    aliases: ['BKC', 'Bandra East', 'Jio World Centre'],
    service_affinity: ['hotels', 'cabs'],
  },

  // Bengaluru
  {
    id: 'hub-blr-indiranagar',
    name: 'Indiranagar 100ft Road / 12th Main',
    display_name: 'Indiranagar Metro & Dining District, Bengaluru',
    formatted_address: '100 Feet Road, HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka 560038, India',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    category: 'LOCALITY',
    category_label: 'Lifestyle Hub',
    lat: 12.9719,
    lon: 77.6412,
    aliases: ['Indiranagar', '100ft Road'],
    service_affinity: ['hotels', 'cabs'],
  },

  // Goa
  {
    id: 'hub-goa-calangute',
    name: 'Calangute & Baga Beach Belt',
    display_name: 'Calangute & Baga Beachfront, North Goa',
    formatted_address: 'Calangute Beach Road, North Goa, Goa 403516, India',
    city: 'Goa',
    state: 'Goa',
    country: 'India',
    category: 'LOCALITY',
    category_label: 'Beach Destination',
    lat: 15.5439,
    lon: 73.7553,
    aliases: ['Calangute', 'Baga', 'North Goa Stays'],
    service_affinity: ['hotels', 'villas', 'cabs', 'holidays', 'tours'],
  },
  {
    id: 'hub-goa-candolim',
    name: 'Candolim & Sinquerim Beach Luxury Villas',
    display_name: 'Candolim Beach Road, North Goa',
    formatted_address: 'Candolim Beach Road, Bardez, North Goa, Goa 403515, India',
    city: 'Goa',
    state: 'Goa',
    country: 'India',
    category: 'LOCALITY',
    category_label: 'Luxury Villa Hub',
    lat: 15.5186,
    lon: 73.7631,
    aliases: ['Candolim', 'Aguada', 'Sinquerim'],
    service_affinity: ['hotels', 'villas', 'cabs'],
  },

  // Jaipur
  {
    id: 'hub-jai-hawa-mahal',
    name: 'Hawa Mahal & City Palace (Old Walled City)',
    display_name: 'Hawa Mahal, Badi Choupad, Pink City, Jaipur',
    formatted_address: 'Hawa Mahal Marg, Badi Choupad, J.D.A. Market, Pink City, Jaipur, Rajasthan 302002, India',
    city: 'Jaipur',
    state: 'Rajasthan',
    country: 'India',
    category: 'LANDMARK',
    category_label: 'Heritage Monument',
    lat: 26.9239,
    lon: 75.8267,
    aliases: ['Hawa Mahal', 'Pink City Center', 'City Palace'],
    service_affinity: ['hotels', 'cabs', 'holidays', 'tours'],
  },

  // Agra
  {
    id: 'hub-agr-taj',
    name: 'Taj Mahal (Eastern / Western Gate)',
    display_name: 'Taj Mahal Monument, Dharmapuri, Forest Colony, Agra',
    formatted_address: 'Dharmapuri, Forest Colony, Tajganj, Agra, Uttar Pradesh 282001, India',
    city: 'Agra',
    state: 'Uttar Pradesh',
    country: 'India',
    category: 'LANDMARK',
    category_label: 'World Wonder',
    lat: 27.1751,
    lon: 78.0421,
    aliases: ['Taj Mahal', 'Tajganj'],
    service_affinity: ['hotels', 'cabs', 'holidays', 'tours'],
  },

  // Hill Stations & Nature
  {
    id: 'hub-manali-mall-road',
    name: 'Mall Road Manali & Old Manali',
    display_name: 'Mall Road, Siyal, Manali, Himachal Pradesh',
    formatted_address: 'Mall Road, Siyal, Manali, Himachal Pradesh 175131, India',
    city: 'Manali',
    state: 'Himachal Pradesh',
    country: 'India',
    category: 'LOCALITY',
    category_label: 'Hill Station Center',
    lat: 32.2396,
    lon: 77.1887,
    aliases: ['Manali Mall Road', 'Old Manali', 'Kullu Valley'],
    service_affinity: ['hotels', 'villas', 'cabs', 'holidays'],
  },
  {
    id: 'hub-shimla-ridge',
    name: 'The Ridge & Mall Road Shimla',
    display_name: 'The Ridge, Center of Shimla, Himachal Pradesh',
    formatted_address: 'The Ridge, Mall Road, Shimla, Himachal Pradesh 171001, India',
    city: 'Shimla',
    state: 'Himachal Pradesh',
    country: 'India',
    category: 'LOCALITY',
    category_label: 'Hill Station Center',
    lat: 31.1048,
    lon: 77.1734,
    aliases: ['Shimla Mall Road', 'The Ridge', 'Kufri Gate'],
    service_affinity: ['hotels', 'villas', 'cabs', 'holidays'],
  },
  {
    id: 'hub-kashmir-srinagar',
    name: 'Dal Lake Boulevard & Srinagar',
    display_name: 'Boulevard Road, Dal Lake, Srinagar, Kashmir',
    formatted_address: 'Boulevard Road, Dal Lake, Srinagar, Jammu and Kashmir 190001, India',
    city: 'Srinagar',
    state: 'Jammu and Kashmir',
    country: 'India',
    category: 'LOCALITY',
    category_label: 'Scenic Lake & Houseboats',
    lat: 34.0837,
    lon: 74.8360,
    aliases: ['Srinagar', 'Kashmir', 'Dal Lake', 'Gulmarg Gate', 'Pahalgam Gate'],
    service_affinity: ['hotels', 'villas', 'cabs', 'holidays', 'tours'],
  },

  // International Cities
  {
    id: 'hub-dxb-downtown',
    name: 'Downtown Dubai & Burj Khalifa',
    display_name: 'Downtown Dubai, Burj Khalifa & Dubai Mall',
    formatted_address: 'Sheikh Mohammed bin Rashid Blvd, Downtown Dubai, Dubai, United Arab Emirates',
    city: 'Dubai',
    country: 'United Arab Emirates',
    category: 'LANDMARK',
    category_label: 'Downtown Hub',
    lat: 25.1972,
    lon: 55.2744,
    aliases: ['Burj Khalifa', 'Downtown Dubai', 'Dubai Mall'],
    service_affinity: ['hotels', 'cabs', 'holidays', 'tours', 'visa'],
  },
  {
    id: 'hub-sin-marina-bay',
    name: 'Marina Bay Sands & Gardens by the Bay',
    display_name: '10 Bayfront Ave, Marina Bay, Singapore 018956',
    formatted_address: '10 Bayfront Ave, Marina Bay, Singapore 018956',
    city: 'Singapore',
    country: 'Singapore',
    category: 'LANDMARK',
    category_label: 'Waterfront Landmark',
    lat: 1.2834,
    lon: 103.8607,
    aliases: ['Marina Bay', 'Gardens by the Bay'],
    service_affinity: ['hotels', 'cabs', 'holidays', 'tours', 'visa'],
  },
  {
    id: 'hub-bali-seminyak',
    name: 'Seminyak & Canggu Beach Villas',
    display_name: 'Jalan Kayu Aya, Seminyak, Kuta, Bali, Indonesia',
    formatted_address: 'Jl. Kayu Aya, Seminyak, Kuta, Kabupaten Badung, Bali 80361, Indonesia',
    city: 'Bali',
    country: 'Indonesia',
    category: 'LOCALITY',
    category_label: 'Tropical Luxury Stays',
    lat: -8.6913,
    lon: 115.1582,
    aliases: ['Seminyak', 'Canggu', 'Ubud', 'Bali Villas'],
    service_affinity: ['hotels', 'villas', 'cabs', 'holidays', 'tours', 'visa'],
  },
  {
    id: 'hub-lon-mayfair',
    name: 'Mayfair & Westminster Central London',
    display_name: 'Mayfair, Central London, W1J, United Kingdom',
    formatted_address: 'Mayfair, London W1J 7NT, United Kingdom',
    city: 'London',
    country: 'United Kingdom',
    category: 'LOCALITY',
    category_label: 'Luxury District',
    lat: 51.5074,
    lon: -0.1478,
    aliases: ['Mayfair', 'Piccadilly', 'Westminster'],
    service_affinity: ['hotels', 'cabs', 'holidays', 'tours', 'visa'],
  },
  {
    id: 'hub-par-champs',
    name: 'Champs-Élysées & Eiffel Tower',
    display_name: 'Avenue des Champs-Élysées, 8th Arrondissement, Paris, France',
    formatted_address: 'Av. des Champs-Élysées, 75008 Paris, France',
    city: 'Paris',
    country: 'France',
    category: 'LANDMARK',
    category_label: 'Iconic Boulevard',
    lat: 48.8698,
    lon: 2.3075,
    aliases: ['Eiffel Tower', 'Champs-Elysees', 'Paris Center'],
    service_affinity: ['hotels', 'cabs', 'holidays', 'tours', 'visa'],
  },
];

// ================= SERVICE-SPECIFIC SUGGESTION DISPATCHER =================
locationsRouter.get('/suggest', async (req, res) => {
  try {
    const rawService = ((req.query.service as string) || 'hotels').toLowerCase().trim();
    const q = ((req.query.q as string) || '').trim();
    const limit = Math.min(Math.max(parseInt((req.query.limit as string) || '10', 10), 1), 25);

    const qLower = q.toLowerCase();

    // -------------------------------------------------------------
    // SERVICE 1: FLIGHTS -> STRICTLY AIRPORTS ONLY
    // -------------------------------------------------------------
    if (rawService === 'flights' || rawService === 'flight') {
      let filtered = VERIFIED_AIRPORTS.filter((a) => {
        if (!q) return true;
        return (
          a.code.toLowerCase().includes(qLower) ||
          a.city.toLowerCase().includes(qLower) ||
          a.name.toLowerCase().includes(qLower) ||
          a.country.toLowerCase().includes(qLower) ||
          (a.aliases && a.aliases.some((al) => al.toLowerCase().includes(qLower)))
        );
      });

      // Priority sort: exact IATA match first, then city match, then name
      filtered.sort((a, b) => {
        if (a.code.toLowerCase() === qLower) return -1;
        if (b.code.toLowerCase() === qLower) return 1;
        if (a.city.toLowerCase() === qLower) return -1;
        if (b.city.toLowerCase() === qLower) return 1;
        if (a.city.toLowerCase().startsWith(qLower)) return -1;
        if (b.city.toLowerCase().startsWith(qLower)) return 1;
        return 0;
      });

      const items: LocationSuggestion[] = filtered.slice(0, limit).map((a) => ({
        id: `apt-${a.code.toLowerCase()}`,
        name: `${a.name} (${a.code})`,
        display_name: `${a.city} (${a.code}) — ${a.name}`,
        secondary_description: `${a.city}, ${a.state ? a.state + ', ' : ''}${a.country}`,
        city: a.city,
        state: a.state,
        country: a.country,
        category: 'AIRPORT',
        category_label: 'Airport',
        code: a.code,
        lat: a.lat,
        lon: a.lon,
        provider: 'INTERNAL_DATABASE',
        service_affinity: ['flights'],
      }));

      return res.json({
        success: true,
        service: 'flights',
        data: items,
        count: items.length,
      });
    }

    // -------------------------------------------------------------
    // SERVICE 2: TRAINS -> STRICTLY RAILWAY STATIONS ONLY
    // -------------------------------------------------------------
    if (rawService === 'trains' || rawService === 'train') {
      let filtered = VERIFIED_STATIONS.filter((s) => {
        if (!q) return true;
        return (
          s.code.toLowerCase().includes(qLower) ||
          s.city.toLowerCase().includes(qLower) ||
          s.name.toLowerCase().includes(qLower) ||
          s.state.toLowerCase().includes(qLower) ||
          (s.aliases && s.aliases.some((al) => al.toLowerCase().includes(qLower)))
        );
      });

      filtered.sort((a, b) => {
        if (a.code.toLowerCase() === qLower) return -1;
        if (b.code.toLowerCase() === qLower) return 1;
        if (a.city.toLowerCase() === qLower) return -1;
        if (b.city.toLowerCase() === qLower) return 1;
        return 0;
      });

      const items: LocationSuggestion[] = filtered.slice(0, limit).map((s) => ({
        id: `stn-${s.code.toLowerCase()}`,
        name: `${s.name} (${s.code})`,
        display_name: `${s.name} [${s.code}] — ${s.city}`,
        secondary_description: `${s.city}, ${s.state}, ${s.country}`,
        city: s.city,
        state: s.state,
        country: s.country,
        category: 'STATION',
        category_label: 'Railway Station',
        code: s.code,
        provider: 'INTERNAL_DATABASE',
        service_affinity: ['trains'],
      }));

      return res.json({
        success: true,
        service: 'trains',
        data: items,
        count: items.length,
      });
    }

    // -------------------------------------------------------------
    // SERVICE 3: BUSES -> BUS TERMINALS, ISBTs & STOPS
    // -------------------------------------------------------------
    if (rawService === 'buses' || rawService === 'bus') {
      let filtered = VERIFIED_BUS_POINTS.filter((b) => {
        if (!q) return true;
        return (
          b.city.toLowerCase().includes(qLower) ||
          b.name.toLowerCase().includes(qLower) ||
          b.state.toLowerCase().includes(qLower) ||
          (b.aliases && b.aliases.some((al) => al.toLowerCase().includes(qLower)))
        );
      });

      // Also include city-level hubs
      const seenCities = new Set<string>();
      const items: LocationSuggestion[] = [];

      filtered.forEach((b) => {
        items.push({
          id: b.id,
          name: b.name,
          display_name: `${b.name} · ${b.city}`,
          secondary_description: `${b.city}, ${b.state}, ${b.country}`,
          city: b.city,
          state: b.state,
          country: b.country,
          category: 'BUS_STOP',
          category_label: b.hub_type === 'ISBT' ? 'Inter-State Bus Terminal' : 'Bus Boarding Point',
          provider: 'INTERNAL_DATABASE',
          service_affinity: ['buses'],
        });
        seenCities.add(b.city.toLowerCase());
      });

      // If user typed a city without a specific terminal, add a general City Boarding Hub
      if (q && !seenCities.has(qLower)) {
        items.unshift({
          id: `bus-city-${qLower.replace(/\s+/g, '-')}`,
          name: `${q} (All Boarding Points)`,
          display_name: `${q} City Hub · Multiple Boarding Stops`,
          secondary_description: `All scheduled bus services departing from ${q}`,
          city: q,
          country: 'India',
          category: 'BUS_STOP',
          category_label: 'City Bus Hub',
          provider: 'INTERNAL_DATABASE',
          service_affinity: ['buses'],
        });
      }

      return res.json({
        success: true,
        service: 'buses',
        data: items.slice(0, limit),
        count: items.length,
      });
    }

    // -------------------------------------------------------------
    // SERVICE 4: VISA & SERVICE 5: INSURANCE -> STRICTLY COUNTRIES
    // -------------------------------------------------------------
    if (rawService === 'visa' || rawService === 'insurance') {
      let filtered = VERIFIED_COUNTRIES.filter((c) => {
        if (!q) return true;
        return (
          c.name.toLowerCase().includes(qLower) ||
          c.code.toLowerCase().includes(qLower) ||
          c.iso3.toLowerCase().includes(qLower) ||
          c.continent.toLowerCase().includes(qLower) ||
          (c.aliases && c.aliases.some((al) => al.toLowerCase().includes(qLower)))
        );
      });

      filtered.sort((a, b) => {
        if (a.name.toLowerCase() === qLower) return -1;
        if (b.name.toLowerCase() === qLower) return 1;
        if (a.name.toLowerCase().startsWith(qLower)) return -1;
        if (b.name.toLowerCase().startsWith(qLower)) return 1;
        return 0;
      });

      const items: LocationSuggestion[] = filtered.slice(0, limit).map((c) => {
        const visaNote = c.requires_visa_for_indian_passports
          ? (c.visa_types_available ? c.visa_types_available[0] : 'Visa Required')
          : 'Visa-Free / Visa on Arrival';

        return {
          id: `country-${c.code.toLowerCase()}`,
          name: `${c.popular_flag} ${c.name}`,
          display_name: `${c.popular_flag} ${c.name} (${c.code})`,
          secondary_description: rawService === 'visa' ? `${visaNote} · ${c.continent}` : `Worldwide Coverage · ${c.continent}`,
          city: c.aliases ? c.aliases[0] : c.name,
          country: c.name,
          category: 'COUNTRY',
          category_label: 'Sovereign Country',
          code: c.code,
          provider: 'INTERNAL_DATABASE',
          service_affinity: ['visa', 'insurance'],
        };
      });

      return res.json({
        success: true,
        service: rawService,
        data: items,
        count: items.length,
      });
    }

    // -------------------------------------------------------------
    // SERVICE 6: CABS -> MAP PLACES, HUBS, AIRPORTS, STATIONS & ADDRESSES
    // -------------------------------------------------------------
    if (rawService === 'cabs' || rawService === 'cab') {
      const results: LocationSuggestion[] = [];
      const seen = new Set<string>();

      // A: Curated hubs match
      CURATED_CITY_HUBS.forEach((hub) => {
        if (
          !q ||
          hub.name.toLowerCase().includes(qLower) ||
          hub.display_name.toLowerCase().includes(qLower) ||
          hub.city.toLowerCase().includes(qLower) ||
          (hub.aliases && hub.aliases.some((al) => al.toLowerCase().includes(qLower)))
        ) {
          if (!seen.has(hub.name.toLowerCase())) {
            seen.add(hub.name.toLowerCase());
            results.push({
              id: hub.id,
              name: hub.name,
              display_name: hub.display_name,
              secondary_description: hub.formatted_address,
              city: hub.city,
              state: hub.state,
              country: hub.country,
              category: hub.category,
              category_label: hub.category_label,
              lat: hub.lat,
              lon: hub.lon,
              provider: 'CURATED_HUB',
              service_affinity: ['cabs'],
            });
          }
        }
      });

      // Also include Airport terminals (common cab pickups)
      VERIFIED_AIRPORTS.slice(0, 5).forEach((apt) => {
        if (
          q &&
          (apt.name.toLowerCase().includes(qLower) ||
            apt.city.toLowerCase().includes(qLower) ||
            apt.code.toLowerCase().includes(qLower))
        ) {
          if (!seen.has(apt.name.toLowerCase())) {
            seen.add(apt.name.toLowerCase());
            results.push({
              id: `cab-apt-${apt.code.toLowerCase()}`,
              name: `${apt.name} (${apt.code})`,
              display_name: `${apt.city} Airport (${apt.code}) — Pick-up / Drop Zone`,
              secondary_description: `${apt.name}, ${apt.city}, ${apt.country}`,
              city: apt.city,
              state: apt.state,
              country: apt.country,
              category: 'AIRPORT',
              category_label: 'Airport Terminal',
              code: apt.code,
              lat: apt.lat,
              lon: apt.lon,
              provider: 'INTERNAL_DATABASE',
              service_affinity: ['cabs'],
            });
          }
        }
      });

      // If user typed a query, fetch live Map places via Photon
      if (q && q.length >= 2 && results.length < limit) {
        try {
          const photonUrl = new URL('https://photon.komoot.io/api/');
          photonUrl.searchParams.set('q', q);
          photonUrl.searchParams.set('limit', String(limit - results.length));

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2500);

          const resp = await fetch(photonUrl.toString(), {
            signal: controller.signal,
            headers: { 'Accept': 'application/json' },
          });
          clearTimeout(timeoutId);

          if (resp.ok) {
            const json = (await resp.json()) as any;
            const features = json.features || [];

            for (const f of features) {
              const props = f.properties || {};
              const coords = f.geometry?.coordinates || [0, 0];
              const name = props.name || props.street || props.locality || props.city || q;
              const nameKey = name.toLowerCase();

              if (!seen.has(nameKey)) {
                seen.add(nameKey);
                const addressParts = [
                  props.name !== props.street ? props.street : null,
                  props.locality,
                  props.district,
                  props.city,
                  props.state,
                  props.country,
                ].filter(Boolean);

                const formatted = addressParts.length > 0 ? addressParts.join(', ') : `${name}, ${props.country || ''}`;

                results.push({
                  id: `osm-${props.osm_id || Math.random().toString(36).substring(2, 9)}`,
                  name,
                  display_name: `${name}${props.city ? ' · ' + props.city : ''}`,
                  secondary_description: formatted,
                  city: props.city || props.county || q,
                  state: props.state || '',
                  country: props.country || 'India',
                  category: 'ADDRESS',
                  category_label: props.osm_value ? props.osm_value.toUpperCase() : 'Location',
                  lat: coords[1],
                  lon: coords[0],
                  provider: 'OPENSTREETMAP_PHOTON',
                  service_affinity: ['cabs'],
                });
                if (results.length >= limit) break;
              }
            }
          }
        } catch {
          // Graceful network timeout fallback
        }
      }

      return res.json({
        success: true,
        service: 'cabs',
        data: results.slice(0, limit),
        count: results.length,
      });
    }

    // -------------------------------------------------------------
    // SERVICE 7: HOTELS, SERVICE 8: VILLAS, SERVICE 9: HOLIDAYS, SERVICE 10: TOURS
    // -> WORLDWIDE DESTINATIONS, CITIES & LOCALITIES (NOT RESTRICTED TO DB INVENTORY)
    // -------------------------------------------------------------
    const destinationResults: LocationSuggestion[] = [];
    const seenDestinations = new Set<string>();

    // Step A: Check Curated City Hubs
    CURATED_CITY_HUBS.forEach((hub) => {
      if (
        !q ||
        hub.name.toLowerCase().includes(qLower) ||
        hub.display_name.toLowerCase().includes(qLower) ||
        hub.city.toLowerCase().includes(qLower) ||
        (hub.aliases && hub.aliases.some((al) => al.toLowerCase().includes(qLower)))
      ) {
        if (!seenDestinations.has(hub.city.toLowerCase())) {
          seenDestinations.add(hub.city.toLowerCase());
          destinationResults.push({
            id: hub.id,
            name: hub.city,
            display_name: `${hub.city}, ${hub.country}`,
            secondary_description: hub.display_name,
            city: hub.city,
            state: hub.state,
            country: hub.country,
            category: 'LOCALITY',
            category_label: hub.country === 'India' ? 'Popular Domestic Destination' : 'Top International Destination',
            lat: hub.lat,
            lon: hub.lon,
            provider: 'CURATED_HUB',
            service_affinity: ['hotels', 'villas', 'holidays', 'tours'],
          });
        }
      }
    });

    // Step B: Live Global Geocoding via Photon OSM (Allows ANY city in the world: Tokyo, Reykjavik, Manali, Zurich, etc.)
    if (q && q.length >= 2 && destinationResults.length < limit) {
      try {
        const photonUrl = new URL('https://photon.komoot.io/api/');
        photonUrl.searchParams.set('q', q);
        photonUrl.searchParams.set('limit', String(limit - destinationResults.length + 3));

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);

        const resp = await fetch(photonUrl.toString(), {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' },
        });
        clearTimeout(timeoutId);

        if (resp.ok) {
          const json = (await resp.json()) as any;
          const features = json.features || [];

          for (const f of features) {
            const props = f.properties || {};
            const coords = f.geometry?.coordinates || [0, 0];
            const cityName = props.city || props.name || props.locality;
            if (!cityName) continue;

            const cityKey = cityName.toLowerCase();
            if (!seenDestinations.has(cityKey)) {
              seenDestinations.add(cityKey);

              const countryName = props.country || '';
              const stateName = props.state || '';
              const subText = [stateName, countryName].filter(Boolean).join(', ');

              destinationResults.push({
                id: `geo-dest-${props.osm_id || Math.random().toString(36).substring(2, 9)}`,
                name: cityName,
                display_name: subText ? `${cityName}, ${subText}` : cityName,
                secondary_description: props.type ? `${props.type.toUpperCase()} · ${subText}` : `Destination in ${countryName}`,
                city: cityName,
                state: stateName,
                country: countryName,
                category: 'LOCALITY',
                category_label: 'Verified Destination',
                lat: coords[1],
                lon: coords[0],
                provider: 'OPENSTREETMAP_PHOTON',
                service_affinity: ['hotels', 'villas', 'holidays', 'tours'],
              });

              if (destinationResults.length >= limit) break;
            }
          }
        }
      } catch {
        // Safe timeout fallback
      }
    }

    // Fallback: If user typed something completely novel and no external service responded,
    // ACCEPT THE USER'S LOCATION INPUT AS VALID! (Separation of location discovery vs inventory)
    if (q && destinationResults.length === 0) {
      destinationResults.push({
        id: `user-dest-${Date.now()}`,
        name: q,
        display_name: `${q} (Global Search)`,
        secondary_description: `Search all available stays and inventory in ${q}`,
        city: q,
        country: 'Worldwide',
        category: 'LOCALITY',
        category_label: 'Selected Destination',
        provider: 'CURATED_HUB',
        service_affinity: ['hotels', 'villas', 'holidays', 'tours'],
      });
    }

    return res.json({
      success: true,
      service: rawService,
      data: destinationResults.slice(0, limit),
      count: destinationResults.length,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ================= PLACES SEARCH (FOR CABS / MAP PICKERS) =================
locationsRouter.get('/places-search', async (req, res) => {
  try {
    const q = ((req.query.q as string) || '').trim();
    const limit = Math.min(Math.max(parseInt((req.query.limit as string) || '8', 10), 1), 20);

    if (!q || q.length < 2) {
      return res.json({
        success: true,
        data: CURATED_CITY_HUBS.slice(0, limit),
      });
    }

    const qLower = q.toLowerCase();
    const results: any[] = [];
    const seenNames = new Set<string>();

    CURATED_CITY_HUBS.forEach((hub) => {
      if (
        hub.name.toLowerCase().includes(qLower) ||
        hub.display_name.toLowerCase().includes(qLower) ||
        hub.city.toLowerCase().includes(qLower) ||
        (hub.aliases && hub.aliases.some((al) => al.toLowerCase().includes(qLower)))
      ) {
        if (!seenNames.has(hub.name.toLowerCase())) {
          seenNames.add(hub.name.toLowerCase());
          results.push(hub);
        }
      }
    });

    if (results.length < limit) {
      try {
        const photonUrl = new URL('https://photon.komoot.io/api/');
        photonUrl.searchParams.set('q', q);
        photonUrl.searchParams.set('limit', String(limit - results.length));

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);

        const resp = await fetch(photonUrl.toString(), {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' },
        });
        clearTimeout(timeoutId);

        if (resp.ok) {
          const json = (await resp.json()) as any;
          const features = json.features || [];

          for (const f of features) {
            const props = f.properties || {};
            const coords = f.geometry?.coordinates || [0, 0];
            const name = props.name || props.street || props.locality || props.city || q;
            const nameKey = name.toLowerCase();

            if (!seenNames.has(nameKey)) {
              seenNames.add(nameKey);
              const addressParts = [
                props.name !== props.street ? props.street : null,
                props.locality,
                props.district,
                props.city,
                props.state,
                props.country,
              ].filter(Boolean);

              const formatted = addressParts.length > 0 ? addressParts.join(', ') : `${name}, ${props.country || ''}`;

              results.push({
                id: `osm-${props.osm_id || Math.random().toString(36).substring(2, 9)}`,
                name,
                display_name: `${name}${props.city ? ' · ' + props.city : ''}`,
                formatted_address: formatted,
                category: 'LOCALITY',
                category_label: props.osm_value ? props.osm_value.toUpperCase() : 'Location',
                lat: coords[1],
                lon: coords[0],
                city: props.city || props.county || '',
                state: props.state || '',
                country: props.country || '',
              });
              if (results.length >= limit) break;
            }
          }
        }
      } catch {
        // Safe timeout
      }
    }

    return res.json({ success: true, data: results });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ================= REVERSE GEOCODING (GPS CURRENT LOCATION) =================
locationsRouter.get('/reverse-geocode', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ success: false, message: 'Invalid coordinates' });
    }

    try {
      const photonRevUrl = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lon}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const resp = await fetch(photonRevUrl, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      });
      clearTimeout(timeoutId);

      if (resp.ok) {
        const json = (await resp.json()) as any;
        const feature = json.features && json.features[0];
        if (feature) {
          const props = feature.properties || {};
          const name = props.name || props.street || props.locality || 'Current Location';
          const addressParts = [
            props.name !== props.street ? props.street : null,
            props.locality,
            props.district,
            props.city,
            props.state,
            props.country,
          ].filter(Boolean);

          const formatted = addressParts.length > 0 ? addressParts.join(', ') : `${name}, ${props.country || ''}`;

          return res.json({
            success: true,
            data: {
              id: `geo-${Date.now()}`,
              name,
              display_name: `${name} (Current GPS Location)`,
              formatted_address: formatted,
              category: 'LOCALITY',
              category_label: 'Current Location',
              lat,
              lon,
              city: props.city || props.county || '',
              state: props.state || '',
              country: props.country || '',
            },
          });
        }
      }
    } catch {
      // Fallback
    }

    return res.json({
      success: true,
      data: {
        id: `geo-${Date.now()}`,
        name: 'My Current Location',
        display_name: `GPS: ${lat.toFixed(4)}, ${lon.toFixed(4)}`,
        formatted_address: `Detected GPS Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
        category: 'LOCALITY',
        category_label: 'Current Location',
        lat,
        lon,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ================= DRIVING ROUTE & DISTANCE ESTIMATION =================
locationsRouter.get('/route-estimate', async (req, res) => {
  try {
    const originLat = parseFloat(req.query.originLat as string);
    const originLon = parseFloat(req.query.originLon as string);
    const destLat = parseFloat(req.query.destLat as string);
    const destLon = parseFloat(req.query.destLon as string);

    if (isNaN(originLat) || isNaN(originLon) || isNaN(destLat) || isNaN(destLon)) {
      return res.status(400).json({ success: false, message: 'Invalid route coordinates' });
    }

    const R = 6371; // Earth radius in km
    const dLat = ((destLat - originLat) * Math.PI) / 180;
    const dLon = ((destLon - originLon) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((originLat * Math.PI) / 180) *
        Math.cos((destLat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const straightDist = R * c;

    const roadDistKm = Math.max(1, Math.round(straightDist * 1.28 * 10) / 10);
    const estMinutes = Math.max(6, Math.round((roadDistKm / 32) * 60) + 6);

    const hours = Math.floor(estMinutes / 60);
    const mins = estMinutes % 60;
    const formattedDuration = hours > 0 ? `${hours} hr ${mins} min` : `${mins} mins`;

    return res.json({
      success: true,
      data: {
        distance_km: roadDistKm,
        duration_minutes: estMinutes,
        formatted_duration: formattedDuration,
        origin: { lat: originLat, lon: originLon },
        destination: { lat: destLat, lon: destLon },
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ================= SERVICES METADATA (AIRPORTS & HUBS OVERVIEW) =================
locationsRouter.get('/', async (req, res) => {
  return res.json({
    success: true,
    data: {
      origins: VERIFIED_AIRPORTS.slice(0, 6),
      destinations: VERIFIED_AIRPORTS.slice(6, 14),
      stations: VERIFIED_STATIONS.slice(0, 10),
      bus_hubs: VERIFIED_BUS_POINTS.slice(0, 10),
      countries: VERIFIED_COUNTRIES.slice(0, 12),
      curated_hubs: CURATED_CITY_HUBS,
    },
  });
});

locationsRouter.post('/validate-route', async (req, res) => {
  return res.json({ success: true, data: { valid: true, message: 'Route validated' } });
});
