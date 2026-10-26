import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../theme/theme';
import { usePartnerAuth } from '../context/PartnerAuthContext';

interface PartnerAuthScreenProps {
  onSuccess: () => void;
}

export const PartnerAuthScreen: React.FC<PartnerAuthScreenProps> = ({ onSuccess }) => {
  const { user, partnerProfile, login, registerPartnerFlow, registerProfile } = usePartnerAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sign In / Sign Up fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  // Business Profile fields
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState<'HOTELIER' | 'HOMESTAY_HOST'>('HOTELIER');
  const [businessPhone, setBusinessPhone] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [taxId, setTaxId] = useState('');

  const needsOnboarding = !!user && !partnerProfile;

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email.trim() || !password || !fullName.trim()) {
      setErrorMsg('Please enter your full name, email, and password.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (!businessName.trim() || !city.trim()) {
      setErrorMsg('Business name and operating city are required.');
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const msg = await registerPartnerFlow({
        email: email.trim().toLowerCase(),
        full_name: fullName.trim(),
        password,
        phone: phone.trim() || undefined,
        business_name: businessName.trim(),
        business_type: businessType,
        business_phone: businessPhone.trim() || phone.trim() || undefined,
        city: city.trim(),
        address: address.trim() || undefined,
        tax_id: taxId.trim() || undefined,
      });

      // SEC-04: Clear password, return to signin, require explicit login
      setPassword('');
      setMode('signin');
      setSuccessMsg(
        msg ||
          'Registration submitted successfully! Your partner application is under review. Please sign in with your email and password.'
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteOnboarding = async () => {
    if (!businessName.trim() || !city.trim()) {
      setErrorMsg('Business name and operating city are required.');
      return;
    }
    setErrorMsg(null);
    setLoading(true);
    try {
      await registerProfile({
        business_name: businessName.trim(),
        business_type: businessType,
        phone: businessPhone.trim() || user?.phone,
        city: city.trim(),
        address: address.trim() || undefined,
        tax_id: taxId.trim() || undefined,
      });
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete partner profile onboarding.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Brand Hero */}
      <View style={styles.brandHero}>
        <View style={styles.heroLogoCircle}>
          <MaterialIcons name="business" size={32} color={Colors.secondary} />
        </View>
        <Text style={styles.heroTitle}>SS JOURNEY PARTNER</Text>
        <Text style={styles.heroSub}>
          Hospitality Management Portal for Hotels &amp; Homestays
        </Text>
      </View>

      {/* Main Card */}
      <View style={styles.card}>
        {errorMsg && (
          <View style={styles.errorBox}>
            <MaterialIcons name="error" size={16} color={Colors.error} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {successMsg && (
          <View style={styles.successBox}>
            <MaterialIcons name="check-circle" size={18} color="#059669" />
            <Text style={styles.successText}>{successMsg}</Text>
          </View>
        )}

        {needsOnboarding ? (
          /* Step 2: Complete Profile if authenticated user lacks PartnerProfile */
          <View>
            <View style={styles.stepIndicator}>
              <Text style={styles.stepTitle}>Step 2: Business Onboarding</Text>
              <Text style={styles.stepSub}>
                Register your hospitality business to start listing inventory.
              </Text>
            </View>

            <Text style={styles.inputLabel}>Business / Property Brand Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Royal Heritage Stays"
              placeholderTextColor={Colors.onSurfaceSubtle}
              value={businessName}
              onChangeText={setBusinessName}
            />

            <Text style={styles.inputLabel}>Business Type *</Text>
            <View style={styles.typeSelectorRow}>
              <TouchableOpacity
                style={[
                  styles.typeOption,
                  businessType === 'HOTELIER' && styles.typeOptionActive,
                ]}
                onPress={() => setBusinessType('HOTELIER')}
              >
                <MaterialIcons
                  name="hotel"
                  size={16}
                  color={businessType === 'HOTELIER' ? '#ffffff' : Colors.primary}
                />
                <Text
                  style={[
                    styles.typeOptionText,
                    businessType === 'HOTELIER' && styles.typeOptionTextActive,
                  ]}
                >
                  Hotelier
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeOption,
                  businessType === 'HOMESTAY_HOST' && styles.typeOptionActive,
                ]}
                onPress={() => setBusinessType('HOMESTAY_HOST')}
              >
                <MaterialIcons
                  name="villa"
                  size={16}
                  color={businessType === 'HOMESTAY_HOST' ? '#ffffff' : Colors.primary}
                />
                <Text
                  style={[
                    styles.typeOptionText,
                    businessType === 'HOMESTAY_HOST' && styles.typeOptionTextActive,
                  ]}
                >
                  Homestay / Villa
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Operating City *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Manali, Goa, Jaipur"
              placeholderTextColor={Colors.onSurfaceSubtle}
              value={city}
              onChangeText={setCity}
            />

            <Text style={styles.inputLabel}>Registered Address</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Hadimba Road, Manali, HP"
              placeholderTextColor={Colors.onSurfaceSubtle}
              value={address}
              onChangeText={setAddress}
            />

            <Text style={styles.inputLabel}>Business Contact Phone</Text>
            <TextInput
              style={styles.input}
              placeholder="+91 98765 43210"
              placeholderTextColor={Colors.onSurfaceSubtle}
              keyboardType="phone-pad"
              value={businessPhone}
              onChangeText={setBusinessPhone}
            />

            <Text style={styles.inputLabel}>GSTIN / Tax ID (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 07AAAAA0000A1Z5"
              placeholderTextColor={Colors.onSurfaceSubtle}
              value={taxId}
              onChangeText={setTaxId}
            />

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleCompleteOnboarding}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.submitBtnText}>Complete Registration</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          /* Step 1: Sign In or Register Flow */
          <View>
            <View style={styles.tabHeader}>
              <TouchableOpacity
                style={[styles.tab, mode === 'signin' && styles.tabActive]}
                onPress={() => {
                  setMode('signin');
                  setErrorMsg(null);
                }}
              >
                <Text
                  style={[styles.tabText, mode === 'signin' && styles.tabTextActive]}
                >
                  Partner Sign In
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tab, mode === 'signup' && styles.tabActive]}
                onPress={() => {
                  setMode('signup');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
              >
                <Text
                  style={[styles.tabText, mode === 'signup' && styles.tabTextActive]}
                >
                  Register Partner
                </Text>
              </TouchableOpacity>
            </View>

            {mode === 'signup' && (
              <>
                <Text style={styles.sectionHeader}>Personal Account Details</Text>

                <Text style={styles.inputLabel}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Ramesh Kumar"
                  placeholderTextColor={Colors.onSurfaceSubtle}
                  value={fullName}
                  onChangeText={setFullName}
                />
              </>
            )}

            <Text style={styles.inputLabel}>Email Address *</Text>
            <TextInput
              style={styles.input}
              placeholder="partner@yourhotel.com"
              placeholderTextColor={Colors.onSurfaceSubtle}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={styles.inputLabel}>Password *</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={Colors.onSurfaceSubtle}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            {mode === 'signup' && (
              <>
                <Text style={styles.inputLabel}>Mobile Phone</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+91 98765 43210"
                  placeholderTextColor={Colors.onSurfaceSubtle}
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />

                <Text style={[styles.sectionHeader, { marginTop: Spacing.md }]}>
                  Hospitality Business Profile
                </Text>

                <Text style={styles.inputLabel}>Business / Brand Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Grand Heritage Palace"
                  placeholderTextColor={Colors.onSurfaceSubtle}
                  value={businessName}
                  onChangeText={setBusinessName}
                />

                <Text style={styles.inputLabel}>Business Type *</Text>
                <View style={styles.typeSelectorRow}>
                  <TouchableOpacity
                    style={[
                      styles.typeOption,
                      businessType === 'HOTELIER' && styles.typeOptionActive,
                    ]}
                    onPress={() => setBusinessType('HOTELIER')}
                  >
                    <MaterialIcons
                      name="hotel"
                      size={16}
                      color={businessType === 'HOTELIER' ? '#ffffff' : Colors.primary}
                    />
                    <Text
                      style={[
                        styles.typeOptionText,
                        businessType === 'HOTELIER' && styles.typeOptionTextActive,
                      ]}
                    >
                      Hotelier
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.typeOption,
                      businessType === 'HOMESTAY_HOST' && styles.typeOptionActive,
                    ]}
                    onPress={() => setBusinessType('HOMESTAY_HOST')}
                  >
                    <MaterialIcons
                      name="villa"
                      size={16}
                      color={businessType === 'HOMESTAY_HOST' ? '#ffffff' : Colors.primary}
                    />
                    <Text
                      style={[
                        styles.typeOptionText,
                        businessType === 'HOMESTAY_HOST' && styles.typeOptionTextActive,
                      ]}
                    >
                      Homestay Host
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>Operating City *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Manali, Jaipur, Goa"
                  placeholderTextColor={Colors.onSurfaceSubtle}
                  value={city}
                  onChangeText={setCity}
                />

                <Text style={styles.inputLabel}>Registered Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Station Road, Civil Lines"
                  placeholderTextColor={Colors.onSurfaceSubtle}
                  value={address}
                  onChangeText={setAddress}
                />

                <Text style={styles.inputLabel}>GSTIN / Tax ID (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 07AAAAA0000A1Z5"
                  placeholderTextColor={Colors.onSurfaceSubtle}
                  value={taxId}
                  onChangeText={setTaxId}
                />
              </>
            )}

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={mode === 'signin' ? handleSignIn : handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {mode === 'signin'
                    ? 'Sign In to Portal'
                    : 'Submit Partner Application'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
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
  brandHero: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  heroLogoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: Colors.secondary,
    ...Shadows.md,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primaryDark,
    letterSpacing: 1,
  },
  heroSub: {
    fontSize: 12,
    color: Colors.onSurfaceSubtle,
    marginTop: 2,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    ...Shadows.md,
  },
  tabHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
    backgroundColor: Colors.surfaceLow,
    borderRadius: BorderRadius.md,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  tabActive: {
    backgroundColor: '#ffffff',
    ...Shadows.sm,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurfaceSubtle,
  },
  tabTextActive: {
    color: Colors.primaryDark,
    fontWeight: 'bold',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.xs,
    paddingBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceLow,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onSurface,
    marginBottom: 4,
    marginTop: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.surfaceLow,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: 13,
    color: Colors.onSurface,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: 6,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: 8,
  },
  successText: {
    color: '#065f46',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    lineHeight: 16,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: 2,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceLow,
    gap: 6,
  },
  typeOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeOptionText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  typeOptionTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  submitBtn: {
    backgroundColor: Colors.secondary,
    paddingVertical: Spacing.md - 2,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    marginTop: Spacing.lg,
    ...Shadows.sm,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  stepIndicator: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceLow,
    paddingBottom: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  stepSub: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
});
