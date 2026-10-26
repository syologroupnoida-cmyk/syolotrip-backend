import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../theme/theme';
import { PartnerPropertyData } from '../types/partner';
import { createPartnerPropertyApi, updatePartnerPropertyApi } from '../services/api';

interface CreateEditPropertyScreenProps {
  property?: PartnerPropertyData;
  onSuccess: (savedProperty: PartnerPropertyData) => void;
  onCancel: () => void;
}

const COMMON_AMENITIES = [
  'Free High-Speed Wi-Fi',
  'Swimming Pool',
  'Complimentary Breakfast',
  'Air Conditioning',
  'Spa & Wellness',
  'Fitness Center',
  'Mountain View',
  'Beach Access',
  'Room Service',
  'Free Valet Parking',
  'Restaurant & Bar',
  'Pet Friendly',
];

export const CreateEditPropertyScreen: React.FC<CreateEditPropertyScreenProps> = ({
  property,
  onSuccess,
  onCancel,
}) => {
  const isEditing = !!property;

  const [name, setName] = useState(property?.name || '');
  const [propertyType, setPropertyType] = useState<'HOTEL' | 'HOMESTAY'>(
    property?.property_type || 'HOTEL'
  );
  const [starRating, setStarRating] = useState<number>(property?.star_rating || 4);
  const [city, setCity] = useState(property?.city || '');
  const [address, setAddress] = useState(property?.address || '');
  const [country, setCountry] = useState(property?.country || 'India');
  const [neighborhood, setNeighborhood] = useState(property?.neighborhood || '');
  const [overview, setOverview] = useState(property?.overview || '');
  const [startingPrice, setStartingPrice] = useState(
    property?.starting_price ? String(property.starting_price) : '2500'
  );
  const [featuredImage, setFeaturedImage] = useState(
    property?.featured_image ||
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'
  );
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    property?.amenities || ['Free High-Speed Wi-Fi', 'Complimentary Breakfast']
  );

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const toggleAmenity = (amenity: string) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter((a) => a !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setErrorMsg('Property name is required.');
      return;
    }
    if (!city.trim() || !address.trim()) {
      setErrorMsg('City and address are required.');
      return;
    }
    const priceNum = parseFloat(startingPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setErrorMsg('Please enter a valid starting price.');
      return;
    }
    if (!overview.trim()) {
      setErrorMsg('Property overview / description is required.');
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    try {
      if (isEditing && property) {
        const updated = await updatePartnerPropertyApi(property.id, {
          name: name.trim(),
          property_type: propertyType,
          star_rating: starRating,
          city: city.trim(),
          address: address.trim(),
          country: country.trim(),
          neighborhood: neighborhood.trim() || undefined,
          overview: overview.trim(),
          starting_price: priceNum,
          featured_image: featuredImage.trim(),
          amenities: selectedAmenities,
        });
        Alert.alert('Saved', 'Property details updated successfully.');
        onSuccess(updated);
      } else {
        const created = await createPartnerPropertyApi({
          name: name.trim(),
          property_type: propertyType,
          star_rating: starRating,
          city: city.trim(),
          address: address.trim(),
          country: country.trim(),
          neighborhood: neighborhood.trim() || undefined,
          overview: overview.trim(),
          starting_price: priceNum,
          featured_image: featuredImage.trim(),
          amenities: selectedAmenities,
        });
        Alert.alert('Listing Draft Created', 'Your property draft has been created. Next, add your room categories before submitting for approval.');
        onSuccess(created);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save property listing.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.headerTitle}>
          {isEditing ? `Edit "${property?.name}"` : 'New Property Listing'}
        </Text>
        <Text style={styles.headerSub}>
          {isEditing
            ? 'Update property description, amenities, and starting rates.'
            : 'Fill in property details to create a draft listing.'}
        </Text>

        {errorMsg && (
          <View style={styles.errorBox}>
            <MaterialIcons name="error" size={16} color={Colors.error} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {/* Property Type Toggle */}
        <Text style={styles.label}>Property Category *</Text>
        <View style={styles.typeRow}>
          <TouchableOpacity
            style={[styles.typeBtn, propertyType === 'HOTEL' && styles.typeBtnActive]}
            onPress={() => setPropertyType('HOTEL')}
          >
            <MaterialIcons
              name="hotel"
              size={18}
              color={propertyType === 'HOTEL' ? '#ffffff' : Colors.primary}
            />
            <Text
              style={[
                styles.typeBtnText,
                propertyType === 'HOTEL' && styles.typeBtnTextActive,
              ]}
            >
              Hotel / Resort
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typeBtn, propertyType === 'HOMESTAY' && styles.typeBtnActive]}
            onPress={() => setPropertyType('HOMESTAY')}
          >
            <MaterialIcons
              name="villa"
              size={18}
              color={propertyType === 'HOMESTAY' ? '#ffffff' : Colors.primary}
            />
            <Text
              style={[
                styles.typeBtnText,
                propertyType === 'HOMESTAY' && styles.typeBtnTextActive,
              ]}
            >
              Homestay / Villa
            </Text>
          </TouchableOpacity>
        </View>

        {/* Name */}
        <Text style={styles.label}>Property Display Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Whispering Pines Luxury Chalet"
          placeholderTextColor={Colors.onSurfaceSubtle}
          value={name}
          onChangeText={setName}
        />

        {/* Star Rating */}
        <Text style={styles.label}>Star Rating</Text>
        <View style={styles.starRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              style={[styles.starBtn, starRating === star && styles.starBtnActive]}
              onPress={() => setStarRating(star)}
            >
              <MaterialIcons
                name="star"
                size={16}
                color={starRating >= star ? '#f59e0b' : Colors.onSurfaceSubtle}
              />
              <Text
                style={[
                  styles.starText,
                  starRating === star && { color: Colors.primary, fontWeight: 'bold' },
                ]}
              >
                {star}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* City & Country */}
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>City *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Manali, Goa"
              placeholderTextColor={Colors.onSurfaceSubtle}
              value={city}
              onChangeText={setCity}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Country</Text>
            <TextInput
              style={styles.input}
              placeholder="India"
              placeholderTextColor={Colors.onSurfaceSubtle}
              value={country}
              onChangeText={setCountry}
            />
          </View>
        </View>

        {/* Address & Neighborhood */}
        <Text style={styles.label}>Street Address *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Circuit House Road, Hadimba"
          placeholderTextColor={Colors.onSurfaceSubtle}
          value={address}
          onChangeText={setAddress}
        />

        <Text style={styles.label}>Neighborhood / Area</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Old Manali, North Beach"
          placeholderTextColor={Colors.onSurfaceSubtle}
          value={neighborhood}
          onChangeText={setNeighborhood}
        />

        {/* Base Starting Price */}
        <Text style={styles.label}>Starting Base Rate (₹ / night) *</Text>
        <TextInput
          style={styles.input}
          placeholder="2500"
          placeholderTextColor={Colors.onSurfaceSubtle}
          keyboardType="numeric"
          value={startingPrice}
          onChangeText={setStartingPrice}
        />

        {/* Featured Image URL */}
        <Text style={styles.label}>Featured Photo URL *</Text>
        <TextInput
          style={styles.input}
          placeholder="https://..."
          placeholderTextColor={Colors.onSurfaceSubtle}
          value={featuredImage}
          onChangeText={setFeaturedImage}
        />

        {/* Overview */}
        <Text style={styles.label}>Property Overview / Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe your property, guest amenities, views, and unique experiences..."
          placeholderTextColor={Colors.onSurfaceSubtle}
          multiline
          numberOfLines={4}
          value={overview}
          onChangeText={setOverview}
        />

        {/* Amenities Selection */}
        <Text style={styles.label}>Select Available Amenities</Text>
        <View style={styles.amenitiesWrap}>
          {COMMON_AMENITIES.map((item) => {
            const isSelected = selectedAmenities.includes(item);
            return (
              <TouchableOpacity
                key={item}
                style={[styles.amenityChip, isSelected && styles.amenityChipActive]}
                onPress={() => toggleAmenity(item)}
              >
                <MaterialIcons
                  name={isSelected ? 'check-circle' : 'add-circle-outline'}
                  size={14}
                  color={isSelected ? '#ffffff' : Colors.onSurfaceVariant}
                />
                <Text
                  style={[
                    styles.amenityChipText,
                    isSelected && styles.amenityChipTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Action Buttons */}
        <View style={styles.formFooter}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>
                {isEditing ? 'Save Changes' : 'Create Listing Draft'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    ...Shadows.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.onSurface,
  },
  headerSub: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
    marginBottom: Spacing.md,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  errorText: {
    fontSize: 11,
    color: Colors.error,
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurface,
    marginTop: Spacing.sm + 2,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    fontSize: 13,
    color: Colors.onSurface,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  typeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    backgroundColor: Colors.surfaceLow,
  },
  typeBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  typeBtnTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  starRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  starBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    backgroundColor: Colors.surfaceLow,
  },
  starBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(12, 45, 107, 0.08)',
  },
  starText: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  amenitiesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: 4,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceLow,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  amenityChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  amenityChipText: {
    fontSize: 10.5,
    color: Colors.onSurfaceVariant,
    fontWeight: '500',
  },
  amenityChipTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  formFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceLow,
  },
  cancelBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  saveBtn: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    ...Shadows.sm,
  },
  saveBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});
