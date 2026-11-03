import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getServiceLocationsSuggestMobileApi, ServiceLocationSuggestion } from '../services/api';
import { CategoryMode } from '../types/travel';

export interface SelectedLocationResult {
  name: string;
  code?: string;
  city?: string;
  country?: string;
  displayName: string;
  secondaryText?: string;
}

interface LocationSearchModalProps {
  visible: boolean;
  onClose: () => void;
  service: CategoryMode;
  title: string;
  placeholder?: string;
  onSelect: (result: SelectedLocationResult) => void;
}

const DEFAULT_POPULAR_SUGGESTIONS: Record<string, SelectedLocationResult[]> = {
  flights: [
    { name: 'Delhi', code: 'DEL', city: 'Delhi', country: 'India', displayName: 'Indira Gandhi Int\'l Airport', secondaryText: 'Delhi, India • Airport' },
    { name: 'Mumbai', code: 'BOM', city: 'Mumbai', country: 'India', displayName: 'Chhatrapati Shivaji Maharaj Int\'l Airport', secondaryText: 'Mumbai, Maharashtra, India • Airport' },
    { name: 'Bengaluru', code: 'BLR', city: 'Bengaluru', country: 'India', displayName: 'Kempegowda Int\'l Airport', secondaryText: 'Bengaluru, Karnataka, India • Airport' },
    { name: 'Goa', code: 'GOI', city: 'Goa', country: 'India', displayName: 'Dabolim Airport', secondaryText: 'Goa, India • Airport' },
    { name: 'Dubai', code: 'DXB', city: 'Dubai', country: 'United Arab Emirates', displayName: 'Dubai International Airport', secondaryText: 'Dubai, UAE • Airport' },
    { name: 'London', code: 'LHR', city: 'London', country: 'United Kingdom', displayName: 'Heathrow Airport', secondaryText: 'London, UK • Airport' },
  ],
  trains: [
    { name: 'New Delhi', code: 'NDLS', city: 'Delhi', country: 'India', displayName: 'New Delhi Railway Station (NDLS)', secondaryText: 'Central Delhi, India • Railway Station' },
    { name: 'Mumbai Central', code: 'MMCT', city: 'Mumbai', country: 'India', displayName: 'Mumbai Central (MMCT)', secondaryText: 'Mumbai, Maharashtra • Railway Station' },
    { name: 'Varanasi Jn', code: 'BSB', city: 'Varanasi', country: 'India', displayName: 'Varanasi Junction (BSB)', secondaryText: 'Varanasi, Uttar Pradesh • Railway Station' },
    { name: 'KSR Bengaluru', code: 'SBC', city: 'Bengaluru', country: 'India', displayName: 'KSR Bengaluru City Junction (SBC)', secondaryText: 'Bengaluru, Karnataka • Railway Station' },
    { name: 'Howrah Jn', code: 'HWH', city: 'Kolkata', country: 'India', displayName: 'Howrah Junction (HWH)', secondaryText: 'Kolkata, West Bengal • Railway Station' },
  ],
  buses: [
    { name: 'Delhi ISBT', code: 'ISBT', city: 'Delhi', country: 'India', displayName: 'Kashmere Gate ISBT', secondaryText: 'Interstate Bus Terminal, Delhi' },
    { name: 'Bengaluru Majestic', code: 'SBC-BUS', city: 'Bengaluru', country: 'India', displayName: 'Majestic Bus Station (Kempegowda)', secondaryText: 'Central Bengaluru, Karnataka' },
    { name: 'Mumbai Borivali', code: 'BVI', city: 'Mumbai', country: 'India', displayName: 'Borivali West Gokul Hotel Bus Stop', secondaryText: 'Western Express Highway, Mumbai' },
    { name: 'Goa Panjim', code: 'PNJ', city: 'Goa', country: 'India', displayName: 'Panjim KTC Bus Stand', secondaryText: 'Panaji, North Goa' },
    { name: 'Jaipur Sindhi Camp', code: 'JPR', city: 'Jaipur', country: 'India', displayName: 'Sindhi Camp Central Bus Stand', secondaryText: 'Station Road, Jaipur, Rajasthan' },
  ],
  cabs: [
    { name: 'Delhi Airport T3', city: 'Delhi', country: 'India', displayName: 'Indira Gandhi Int\'l Airport Terminal 3', secondaryText: 'Palam, New Delhi • Airport Pickup' },
    { name: 'Connaught Place', city: 'Delhi', country: 'India', displayName: 'Connaught Place Inner Circle', secondaryText: 'Central Delhi, India • Commercial Hub' },
    { name: 'Cyber Hub Gurgaon', city: 'Gurugram', country: 'India', displayName: 'DLF Cyber City & Cyber Hub', secondaryText: 'Sector 24, Gurugram, Haryana' },
    { name: 'Mumbai Airport T2', city: 'Mumbai', country: 'India', displayName: 'Chhatrapati Shivaji Terminal 2 (T2)', secondaryText: 'Sahar, Andheri East, Mumbai' },
    { name: 'Candolim Beach', city: 'Goa', country: 'India', displayName: 'Candolim Beach Main Road', secondaryText: 'North Goa, India • Coastal Zone' },
  ],
  visa: [
    { name: 'United Arab Emirates', country: 'United Arab Emirates', displayName: 'United Arab Emirates', secondaryText: '🇦🇪 30/60 Days Tourist & Business Visa • Sovereign Country' },
    { name: 'Schengen Countries', country: 'France', displayName: 'Schengen Area (France, Italy, Switzerland, Germany)', secondaryText: '🇪🇺 Short Stay C Visit Visa • Schengen Zone' },
    { name: 'United Kingdom', country: 'United Kingdom', displayName: 'United Kingdom (UK)', secondaryText: '🇬🇧 Standard Visitor Visa • Sovereign Country' },
    { name: 'United States', country: 'United States', displayName: 'United States of America (USA)', secondaryText: '🇺🇸 B1/B2 Visitor Visa • Sovereign Country' },
    { name: 'Singapore', country: 'Singapore', displayName: 'Singapore', secondaryText: '🇸🇬 e-Visa Tourist Stay • Sovereign Country' },
  ],
  insurance: [
    { name: 'Schengen Area', country: 'Europe', displayName: 'Schengen Countries Mandatory Shield', secondaryText: '🛡️ €30,000+ Medical Evacuation & Hospitalization' },
    { name: 'United States & Canada', country: 'USA', displayName: 'USA & Canada Comprehensive Shield', secondaryText: '🛡️ \$100,000 Medical, Trip Cancellation & Baggage' },
    { name: 'Worldwide (Excl USA/Canada)', country: 'Global', displayName: 'Worldwide Standard Travel Shield', secondaryText: '🛡️ Global Medical & Zero Delay Protection' },
    { name: 'Southeast Asia', country: 'Asia', displayName: 'Asia Travel Protection', secondaryText: '🛡️ Emergency Medical, Baggage Loss & Flight Delay' },
  ],
  hotels: [
    { name: 'Paris', city: 'Paris', country: 'France', displayName: 'Paris, France', secondaryText: 'City of Light • Worldwide Destination' },
    { name: 'Tokyo', city: 'Tokyo', country: 'Japan', displayName: 'Tokyo, Japan', secondaryText: 'Kanto Region • Worldwide Destination' },
    { name: 'Goa', city: 'Goa', country: 'India', displayName: 'Goa, India', secondaryText: 'Beach Haven • Verified Stays' },
    { name: 'Manali', city: 'Manali', country: 'India', displayName: 'Manali, Himachal Pradesh', secondaryText: 'Himalayan Hill Station • Worldwide Destination' },
    { name: 'Dubai', city: 'Dubai', country: 'United Arab Emirates', displayName: 'Dubai, UAE', secondaryText: 'Luxury Hub • Worldwide Destination' },
  ],
  villas: [
    { name: 'North Goa', city: 'Goa', country: 'India', displayName: 'North Goa (Candolim, Anjuna, Assagao)', secondaryText: 'Luxury Private Pool Villas' },
    { name: 'Lonavala', city: 'Lonavala', country: 'India', displayName: 'Lonavala & Khandala, Maharashtra', secondaryText: 'Hill Station Estates & Private Homestays' },
    { name: 'Manali', city: 'Manali', country: 'India', displayName: 'Manali & Old Manali, Himachal Pradesh', secondaryText: 'Himalayan Cottages & Mountain Lodges' },
    { name: 'Udaipur', city: 'Udaipur', country: 'India', displayName: 'Udaipur, Rajasthan', secondaryText: 'Heritage Havelis & Lakefront Villas' },
  ],
  packages: [
    { name: 'Kashmir', city: 'Srinagar', country: 'India', displayName: 'Kashmir Valley Paradise (Srinagar, Gulmarg, Pahalgam)', secondaryText: '5D/4N • Domestic Holiday' },
    { name: 'Kerala', city: 'Kochi', country: 'India', displayName: 'Kerala Backwaters & Munnar Tea Estates', secondaryText: '6D/5N • Nature & Wellness Tour' },
    { name: 'Europe Highlights', city: 'Paris', country: 'Europe', displayName: 'Classic Europe (Paris, Lucerne, Rome)', secondaryText: '8D/7N • All-Inclusive Continental Tour' },
    { name: 'Dubai Extravaganza', city: 'Dubai', country: 'UAE', displayName: 'Dubai Shopping & Desert Safari Tour', secondaryText: '5D/4N • International Getaway' },
  ],
  tours: [
    { name: 'Burj Khalifa Top', city: 'Dubai', country: 'UAE', displayName: 'Burj Khalifa 124th & 125th Floor Observation Deck', secondaryText: 'Dubai, UAE • Iconic Landmark' },
    { name: 'Eiffel Tower Tour', city: 'Paris', country: 'France', displayName: 'Eiffel Tower Summit Access & Seine Cruise', secondaryText: 'Paris, France • Architectural Landmark' },
    { name: 'Taj Mahal Guided Tour', city: 'Agra', country: 'India', displayName: 'Taj Mahal & Agra Fort Skip-the-line Experience', secondaryText: 'Agra, UP, India • UNESCO World Heritage' },
  ],
};

const getServiceHeaderBadge = (service: CategoryMode): { badge: string; icon: any } => {
  switch (service) {
    case 'flights':
      return { badge: 'AIRPORTS ONLY (IATA)', icon: 'flight' };
    case 'trains':
      return { badge: 'RAILWAY STATIONS ONLY (IRCTC)', icon: 'train' };
    case 'buses':
      return { badge: 'BUS TERMINALS & STOPS', icon: 'directions-bus' };
    case 'cabs':
      return { badge: 'MAP ADDRESS / PLACE SEARCH', icon: 'local-taxi' };
    case 'visa':
      return { badge: 'SOVEREIGN COUNTRIES ONLY', icon: 'card-membership' };
    case 'insurance':
      return { badge: 'DESTINATION ZONES & COUNTRIES', icon: 'security' };
    case 'villas':
      return { badge: 'VILLAS & HOMESTAYS DESTINATIONS', icon: 'holiday-village' };
    case 'packages':
      return { badge: 'DESTINATION REGIONS & TOURS', icon: 'beach-access' };
    case 'tours':
      return { badge: 'DESTINATIONS & ATTRACTIONS', icon: 'attractions' };
    case 'hotels':
    default:
      return { badge: 'WORLDWIDE DESTINATIONS', icon: 'hotel' };
  }
};

export const LocationSearchModal: React.FC<LocationSearchModalProps> = ({
  visible,
  onClose,
  service,
  title,
  placeholder,
  onSelect,
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<ServiceLocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimer = useRef<any>(null);

  const { badge, icon } = getServiceHeaderBadge(service);

  useEffect(() => {
    if (visible) {
      setQuery('');
      setSuggestions([]);
      setIsLoading(false);
    }
  }, [visible, service]);

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (!query.trim() || query.trim().length < 1) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    debounceTimer.current = setTimeout(async () => {
      try {
        const results = await getServiceLocationsSuggestMobileApi(service, query.trim(), 12);
        setSuggestions(results);
      } catch (err) {
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 280);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query, service]);

  const handleSelectItem = (item: SelectedLocationResult) => {
    onSelect(item);
    onClose();
  };

  const handleSelectApiSuggestion = (s: ServiceLocationSuggestion) => {
    const code = s.iata_code || s.station_code || s.code || '';
    const city = s.city || s.display_name.split(',')[0].trim();
    const name = s.display_name.split(',')[0].trim();
    const result: SelectedLocationResult = {
      name,
      code,
      city,
      country: s.country,
      displayName: s.display_name,
      secondaryText: s.secondary_text,
    };
    handleSelectItem(result);
  };

  const defaultPopular = DEFAULT_POPULAR_SUGGESTIONS[service] || DEFAULT_POPULAR_SUGGESTIONS.hotels;

  // Whether this service accepts any custom destination
  const allowsCustomDestination = ['hotels', 'villas', 'packages', 'cabs', 'tours'].includes(service);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* ── Top Header ── */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <MaterialIcons name="arrow-back" size={24} color="#0F172A" />
            </TouchableOpacity>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
              <View style={styles.badgeRow}>
                <MaterialIcons name={icon} size={12} color="#005cab" style={{ marginRight: 4 }} />
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            </View>
          </View>

          {/* ── Search Input Field ── */}
          <View style={styles.inputContainer}>
            <MaterialIcons name="search" size={22} color="#005cab" style={styles.searchIcon} />
            <TextInput
              style={styles.textInput}
              placeholder={placeholder || `Search ${service}...`}
              placeholderTextColor="#94A3B8"
              value={query}
              onChangeText={setQuery}
              autoFocus
              autoCorrect={false}
              autoCapitalize="words"
              clearButtonMode="while-editing"
            />
            {query.length > 0 && (
              <TouchableOpacity
                onPress={() => setQuery('')}
                style={styles.clearBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons name="cancel" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
            {isLoading && (
              <ActivityIndicator size="small" color="#005cab" style={{ marginLeft: 8 }} />
            )}
          </View>

          {/* ── Suggestions / Results List ── */}
          <FlatList
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
            data={suggestions}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={() => {
              if (query.trim().length > 0 && allowsCustomDestination) {
                return (
                  <TouchableOpacity
                    style={styles.customDestinationCard}
                    onPress={() =>
                      handleSelectItem({
                        name: query.trim(),
                        city: query.trim(),
                        displayName: query.trim(),
                        secondaryText: `Worldwide destination (All valid locations accepted)`,
                      })
                    }
                    activeOpacity={0.8}
                  >
                    <View style={styles.customIconCircle}>
                      <MaterialIcons name="location-searching" size={20} color="#005cab" />
                    </View>
                    <View style={styles.customTextWrap}>
                      <Text style={styles.customMainText}>
                        Search in "{query.trim()}"
                      </Text>
                      <Text style={styles.customSubText}>
                        Valid destination • Search inventory in this location
                      </Text>
                    </View>
                    <MaterialIcons name="arrow-forward-ios" size={14} color="#94A3B8" />
                  </TouchableOpacity>
                );
              }

              if (query.trim().length === 0) {
                return (
                  <View style={styles.sectionHeaderWrap}>
                    <Text style={styles.sectionHeaderText}>POPULAR & VERIFIED SUGGESTIONS</Text>
                  </View>
                );
              }

              return null;
            }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionRow}
                onPress={() => handleSelectApiSuggestion(item)}
                activeOpacity={0.7}
              >
                <View style={styles.rowIconCircle}>
                  <MaterialIcons name={icon} size={20} color="#005cab" />
                </View>
                <View style={styles.rowTextWrap}>
                  <View style={styles.rowTitleRow}>
                    <Text style={styles.rowMainText} numberOfLines={1}>
                      {item.display_name}
                    </Text>
                    {(item.iata_code || item.station_code || item.code) && (
                      <View style={styles.codeBadge}>
                        <Text style={styles.codeBadgeText}>
                          {item.iata_code || item.station_code || item.code}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.rowSubText} numberOfLines={1}>
                    {item.secondary_text}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={() => {
              if (query.trim().length === 0) {
                return (
                  <View>
                    {defaultPopular.map((item, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.suggestionRow}
                        onPress={() => handleSelectItem(item)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.rowIconCircle}>
                          <MaterialIcons name={icon} size={20} color="#005cab" />
                        </View>
                        <View style={styles.rowTextWrap}>
                          <View style={styles.rowTitleRow}>
                            <Text style={styles.rowMainText} numberOfLines={1}>
                              {item.displayName}
                            </Text>
                            {item.code && (
                              <View style={styles.codeBadge}>
                                <Text style={styles.codeBadgeText}>{item.code}</Text>
                              </View>
                            )}
                          </View>
                          {item.secondaryText && (
                            <Text style={styles.rowSubText} numberOfLines={1}>
                              {item.secondaryText}
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                );
              }

              if (!isLoading) {
                return (
                  <View style={styles.emptyContainer}>
                    <MaterialIcons name="search-off" size={44} color="#94A3B8" />
                    <Text style={styles.emptyTitle}>No exact records found</Text>
                    <Text style={styles.emptySub}>
                      {allowsCustomDestination
                        ? `You can still select "Search in ${query.trim()}" above to look up inventory.`
                        : `Please check the spelling or select a verified ${service} location.`}
                    </Text>
                  </View>
                );
              }

              return null;
            }}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  closeBtn: {
    padding: 6,
    marginRight: 8,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#005cab',
    letterSpacing: 0.6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 14,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#005cab',
    shadowColor: '#005cab',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    padding: 0,
  },
  clearBtn: {
    padding: 4,
  },
  listContent: {
    paddingHorizontal: 14,
    paddingBottom: 40,
  },
  sectionHeaderWrap: {
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  sectionHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  customDestinationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 14,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  customIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  customTextWrap: {
    flex: 1,
  },
  customMainText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  customSubText: {
    fontSize: 11,
    color: '#3B82F6',
    marginTop: 2,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rowIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowTextWrap: {
    flex: 1,
  },
  rowTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  rowMainText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  codeBadge: {
    backgroundColor: '#005cab',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  codeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  rowSubText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
});
