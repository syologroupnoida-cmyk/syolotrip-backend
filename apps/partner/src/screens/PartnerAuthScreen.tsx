import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ImageBackground,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../theme/theme';
import { usePartnerAuth } from '../context/PartnerAuthContext';

interface PartnerAuthScreenProps {
  onSuccess: () => void;
}

const PROPERTY_CATEGORIES = [
  'Hotel',
  'Homestay / Villa',
  'Resort',
  'Guest House',
  'Apartment',
] as const;

type PropertyCategory = typeof PROPERTY_CATEGORIES[number];

const ROOM_UNIT_OPTIONS = [
  '1 - 5 Rooms (Homestay / Boutique)',
  '6 - 15 Rooms (Boutique / Heritage)',
  '16 - 50 Rooms (Mid-scale Hotel)',
  '50+ Rooms (Luxury Resort / Chain)',
];

export const PartnerAuthScreen: React.FC<PartnerAuthScreenProps> = ({ onSuccess }) => {
  const { user, partnerProfile, login, demoLogin, registerPartnerFlow, registerProfile } = usePartnerAuth();

  const scrollViewRef = useRef<any>(null);
  const isSubmittingRef = useRef(false);

  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [loading, setLoading] = useState(false);
  const [loadingStepText, setLoadingStepText] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [partialNotice, setPartialNotice] = useState<string | null>(null);

  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRoomsDropdown, setShowRoomsDropdown] = useState(false);

  // Form fields matching reference design
  const [selectedCategory, setSelectedCategory] = useState<PropertyCategory>('Hotel');
  const [ownerAndBusinessName, setOwnerAndBusinessName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [taxId, setTaxId] = useState('');
  const [selectedRooms, setSelectedRooms] = useState(ROOM_UNIT_OPTIONS[0]);

  // Sign in fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const needsOnboarding = !!user && !partnerProfile;

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => {
      setKeyboardVisible(true);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleFocusLowerField = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 120);
  };

  const handleSignIn = async () => {
    if (loading || isSubmittingRef.current) return;

    if (!loginEmail.trim() || !loginPassword) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    setPartialNotice(null);
    isSubmittingRef.current = true;
    setLoading(true);
    setLoadingStepText('Verifying credentials...');
    try {
      await login(loginEmail.trim().toLowerCase(), loginPassword);
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
      setLoadingStepText(null);
    }
  };

  const handleInstantBypassLogin = async () => {
    if (loading || isSubmittingRef.current) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setPartialNotice(null);
    isSubmittingRef.current = true;
    setLoading(true);
    setLoadingStepText('Authorizing Demo Partner...');
    try {
      await demoLogin('PARTNER');
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Demo bypass login failed.');
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
      setLoadingStepText(null);
    }
  };

  const handleRegister = async () => {
    if (loading || isSubmittingRef.current) return;

    if (!ownerAndBusinessName.trim()) {
      setErrorMsg('Please enter your Owner and Business / Property name.');
      return;
    }
    if (!mobileNumber.trim() || mobileNumber.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!email.trim()) {
      setErrorMsg('Please enter your contact email address.');
      return;
    }
    if (!city.trim()) {
      setErrorMsg('Please enter your property city or location.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    // Parse owner name and business name
    let ownerName = ownerAndBusinessName.trim();
    let bizName = ownerAndBusinessName.trim();
    if (ownerAndBusinessName.includes('/')) {
      const parts = ownerAndBusinessName.split('/');
      ownerName = parts[0].trim() || bizName;
      bizName = parts.slice(1).join('/').trim() || ownerName;
    }

    const businessTypeVal = selectedCategory.includes('Homestay') ? 'HOMESTAY_HOST' : 'HOTELIER';

    setErrorMsg(null);
    setSuccessMsg(null);
    setPartialNotice(null);
    isSubmittingRef.current = true;
    setLoading(true);
    setLoadingStepText('Creating partner account...');

    try {
      const result = await registerPartnerFlow(
        {
          email: email.trim().toLowerCase(),
          full_name: ownerName,
          password,
          phone: `+91${mobileNumber.trim()}`,
          business_name: bizName,
          business_type: businessTypeVal,
          business_phone: `+91${mobileNumber.trim()}`,
          city: city.trim(),
          address: address.trim() || undefined,
          tax_id: taxId.trim() || undefined,
        },
        (step) => {
          if (step === 'ACCOUNT') {
            setLoadingStepText('Step 1 of 2: Creating partner account...');
          } else if (step === 'PROFILE') {
            setLoadingStepText('Step 2 of 2: Registering property profile...');
          }
        }
      );

      if (!result.success && result.partialState?.accountCreated) {
        setLoginEmail(email.trim().toLowerCase());
        setMode('signin');
        setPartialNotice(
          `Your partner account was created. Please sign in with your password to complete your profile.`
        );
        return;
      }

      setLoginEmail(email.trim().toLowerCase());
      setMode('signin');
      setSuccessMsg(
        result.message ||
          'Registration submitted successfully! Your partner application is under review. Please sign in with your email and password.'
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
      setLoadingStepText(null);
    }
  };

  const handleCompleteOnboarding = async () => {
    if (loading || isSubmittingRef.current) return;

    if (!city.trim()) {
      setErrorMsg('Operating city is required.');
      return;
    }
    setErrorMsg(null);
    isSubmittingRef.current = true;
    setLoading(true);
    setLoadingStepText('Saving hospitality business profile...');
    try {
      await registerProfile({
        business_name: ownerAndBusinessName.trim() || 'My Property',
        business_type: selectedCategory.includes('Homestay') ? 'HOMESTAY_HOST' : 'HOTELIER',
        phone: mobileNumber ? `+91${mobileNumber.trim()}` : user?.phone,
        city: city.trim(),
        address: address.trim() || undefined,
        tax_id: taxId.trim() || undefined,
      });
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete partner profile onboarding.');
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
      setLoadingStepText(null);
    }
  };

  return (
    <ImageBackground
      source={{
        uri: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
      }}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.backgroundOverlay} />
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
      >
      <ScrollView
        ref={scrollViewRef}
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: isKeyboardVisible ? 280 : Spacing.xxl + 30 },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Header */}
        <View style={styles.brandHero}>
          <View style={styles.heroLogoCircle}>
            <MaterialIcons name="business" size={28} color="#008cff" />
          </View>
          <Text style={styles.heroTitle}>SYOLO TRAVELS PARTNER</Text>
          <Text style={styles.heroSub}>
            Extranet Portal for Hotels, Homestays &amp; Resorts
          </Text>
        </View>

        {/* Main Floating Card matching reference design */}
        <View style={styles.card}>
          {/* Top Pill Tab Switcher */}
          <View style={styles.tabHeaderPill}>
            <TouchableOpacity
              style={[styles.tabPill, mode === 'signup' && styles.tabPillActive]}
              onPress={() => {
                if (loading) return;
                setMode('signup');
                setErrorMsg(null);
                setSuccessMsg(null);
                setPartialNotice(null);
              }}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabPillText, mode === 'signup' && styles.tabPillTextActive]}>
                Register Property (Free)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabPill, mode === 'signin' && styles.tabPillActive]}
              onPress={() => {
                if (loading) return;
                setMode('signin');
                setErrorMsg(null);
                setPartialNotice(null);
              }}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabPillText, mode === 'signin' && styles.tabPillTextActive]}>
                Partner Login
              </Text>
            </TouchableOpacity>
          </View>

          {/* Feedback Messages */}
          {errorMsg && (
            <View style={styles.errorBox}>
              <MaterialIcons name="error-outline" size={16} color="#dc2626" />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          {partialNotice && (
            <View style={styles.partialBox}>
              <MaterialIcons name="info" size={18} color="#b45309" />
              <Text style={styles.partialText}>{partialNotice}</Text>
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
            <View style={styles.formSection}>
              <Text style={styles.mainTitle}>Complete Business Profile</Text>
              <Text style={styles.mainSub}>
                Register your hospitality business to start listing inventory.
              </Text>

              <Text style={styles.inputLabel}>Operating City *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Manali, Goa, Jaipur"
                placeholderTextColor="#94a3b8"
                value={city}
                onChangeText={setCity}
                editable={!loading}
              />

              <Text style={styles.inputLabel}>Registered Address</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Hadimba Road, Manali, HP"
                placeholderTextColor="#94a3b8"
                value={address}
                onChangeText={setAddress}
                editable={!loading}
              />

              <Text style={styles.inputLabel}>GSTIN / Tax ID (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 07AAAAA0000A1Z5"
                placeholderTextColor="#94a3b8"
                value={taxId}
                onChangeText={setTaxId}
                editable={!loading}
              />

              <TouchableOpacity
                style={[styles.orangeSubmitBtn, loading && styles.btnDisabled]}
                onPress={handleCompleteOnboarding}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.orangeSubmitBtnText}>Complete Registration</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : mode === 'signup' ? (
            /* MODE 1: REGISTER PROPERTY FORM (Matches Reference Screenshot) */
            <View style={styles.formSection}>
              <Text style={styles.mainTitle}>Sign up &amp; List Your Property</Text>
              <Text style={styles.mainSub}>
                Register directly on the official Syolo Travels Partner Network.
              </Text>

              {/* PROPERTY CATEGORY Pills */}
              <Text style={styles.categoryLabel}>PROPERTY CATEGORY</Text>
              <View style={styles.categoryPillsRow}>
                {PROPERTY_CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.catPill,
                        isSelected && styles.catPillActive,
                      ]}
                      onPress={() => setSelectedCategory(cat)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.catPillText,
                          isSelected && styles.catPillTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Owner / Property Business Name * */}
              <Text style={styles.inputLabel}>Owner / Property Business Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Vikramaditya Rathore / Royal Retreats"
                placeholderTextColor="#94a3b8"
                value={ownerAndBusinessName}
                onChangeText={setOwnerAndBusinessName}
                editable={!loading}
              />

              {/* Mobile Number (10 Digits) * */}
              <Text style={styles.inputLabel}>Mobile Number (10 Digits) *</Text>
              <View style={styles.phoneInputRow}>
                <View style={styles.countryCodeBadge}>
                  <Text style={styles.countryCodeText}>IN +91</Text>
                </View>
                <TextInput
                  style={[styles.input, styles.phoneInput]}
                  placeholder="9876543210"
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={mobileNumber}
                  onChangeText={(val) => setMobileNumber(val.replace(/\D/g, ''))}
                  editable={!loading}
                />
              </View>

              {/* 2-Column: Email Address & City */}
              <View style={styles.twoColRow}>
                <View style={styles.colHalf}>
                  <Text style={styles.inputLabel}>Email Address *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="partner@hotel.com"
                    placeholderTextColor="#94a3b8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    editable={!loading}
                  />
                </View>
                <View style={styles.colHalf}>
                  <Text style={styles.inputLabel}>City / Location *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Goa, Jaipur"
                    placeholderTextColor="#94a3b8"
                    value={city}
                    onChangeText={setCity}
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Create Extranet Password * */}
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>Create Extranet Password *</Text>
                <Text style={styles.hintLabel}>Min 6 characters</Text>
              </View>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={[styles.input, { flex: 1, borderWidth: 0, paddingRight: 36 }]}
                  placeholder="Choose a secure password"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeIconBtn}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <MaterialIcons
                    name={showPassword ? 'visibility-off' : 'lock-outline'}
                    size={18}
                    color="#94a3b8"
                  />
                </TouchableOpacity>
              </View>

              {/* 2-Column: Address & GSTIN */}
              <View style={styles.twoColRow}>
                <View style={styles.colHalf}>
                  <Text style={styles.inputLabel}>Address / Locality</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Beach Road, Calangute"
                    placeholderTextColor="#94a3b8"
                    value={address}
                    onChangeText={setAddress}
                    onFocus={handleFocusLowerField}
                    editable={!loading}
                  />
                </View>
                <View style={styles.colHalf}>
                  <Text style={styles.inputLabel}>GSTIN / Tax ID (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="E.G. 29AAAAA0000A1Z5"
                    placeholderTextColor="#94a3b8"
                    autoCapitalize="characters"
                    value={taxId}
                    onChangeText={setTaxId}
                    onFocus={handleFocusLowerField}
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Total Number of Rooms / Units */}
              <Text style={styles.inputLabel}>Total Number of Rooms / Units</Text>
              <View style={styles.dropdownContainer}>
                <TouchableOpacity
                  style={styles.dropdownSelector}
                  onPress={() => setShowRoomsDropdown(!showRoomsDropdown)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownSelectorText}>{selectedRooms}</Text>
                  <MaterialIcons
                    name={showRoomsDropdown ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                    size={20}
                    color="#64748b"
                  />
                </TouchableOpacity>
                {showRoomsDropdown && (
                  <View style={styles.dropdownMenu}>
                    {ROOM_UNIT_OPTIONS.map((opt) => {
                      const isOptSelected = selectedRooms === opt;
                      return (
                        <TouchableOpacity
                          key={opt}
                          style={[
                            styles.dropdownMenuItem,
                            isOptSelected && styles.dropdownMenuItemActive,
                          ]}
                          onPress={() => {
                            setSelectedRooms(opt);
                            setShowRoomsDropdown(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.dropdownMenuItemText,
                              isOptSelected && styles.dropdownMenuItemTextActive,
                            ]}
                          >
                            {opt}
                          </Text>
                          {isOptSelected && (
                            <MaterialIcons name="check" size={16} color="#008cff" />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Vibrant Orange Action Button */}
              <TouchableOpacity
                style={[styles.orangeSubmitBtn, loading && styles.btnDisabled]}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.88}
              >
                {loading ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator color="#ffffff" size="small" />
                    <Text style={styles.orangeSubmitBtnText}>
                      {loadingStepText || 'Submitting...'}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.btnContentRow}>
                    <Text style={styles.orangeSubmitBtnText}>
                      SUBMIT PARTNER APPLICATION
                    </Text>
                    <MaterialIcons name="arrow-forward" size={18} color="#ffffff" />
                  </View>
                )}
              </TouchableOpacity>

              {/* Footer Compliance Text */}
              <Text style={styles.complianceText}>
                By proceeding, you agree to Syolo Travels'{' '}
                <Text style={styles.complianceLink}>Partner Terms of Service</Text> and{' '}
                <Text style={styles.complianceLink}>Compliance Verification Policy</Text>.
              </Text>
            </View>
          ) : (
            /* MODE 2: PARTNER SIGN IN FORM */
            <View style={styles.formSection}>
              <Text style={styles.mainTitle}>Partner Extranet Login</Text>
              <Text style={styles.mainSub}>
                Sign in to manage your property, rates, inventory and guest check-ins.
              </Text>

              <Text style={styles.inputLabel}>Partner Email Address *</Text>
              <TextInput
                style={styles.input}
                placeholder="partner@hotel.com"
                placeholderTextColor="#94a3b8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={loginEmail}
                onChangeText={setLoginEmail}
                editable={!loading}
              />

              <Text style={styles.inputLabel}>Extranet Password *</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={[styles.input, { flex: 1, borderWidth: 0, paddingRight: 36 }]}
                  placeholder="Enter your password"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showPassword}
                  value={loginPassword}
                  onChangeText={setLoginPassword}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeIconBtn}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <MaterialIcons
                    name={showPassword ? 'visibility-off' : 'lock-outline'}
                    size={18}
                    color="#94a3b8"
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.blueSubmitBtn, loading && styles.btnDisabled]}
                onPress={handleSignIn}
                disabled={loading}
                activeOpacity={0.88}
              >
                {loading ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator color="#ffffff" size="small" />
                    <Text style={styles.blueSubmitBtnText}>Signing In...</Text>
                  </View>
                ) : (
                  <View style={styles.btnContentRow}>
                    <Text style={styles.blueSubmitBtnText}>SIGN IN TO EXTRANET</Text>
                    <MaterialIcons name="arrow-forward" size={18} color="#ffffff" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* 1-Click Instant Security Bypass Login (Demo) */}
          <TouchableOpacity
            style={styles.bypassBtn}
            onPress={handleInstantBypassLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            <MaterialIcons name="bolt" size={18} color="#d97706" />
            <Text style={styles.bypassBtnText}>
              ⚡ 1-Click Quick Demo (Verified Partner)
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </ImageBackground>
);
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 22, 40, 0.55)',
  },
  keyboardAvoidingView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
    alignItems: 'center',
  },
  brandHero: {
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  heroLogoCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    ...Shadows.md,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 1.2,
  },
  heroSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 3,
    fontWeight: '500',
  },
  card: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: Spacing.lg,
    ...Shadows.lg,
  },
  tabHeaderPill: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 30,
    padding: 3,
    marginBottom: Spacing.md,
  },
  tabPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPillActive: {
    backgroundColor: '#ffffff',
    ...Shadows.xs,
  },
  tabPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  tabPillTextActive: {
    fontWeight: '800',
    color: '#0f172a',
  },
  formSection: {
    marginBottom: Spacing.sm,
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  mainSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    marginBottom: Spacing.md,
    fontWeight: '500',
  },
  categoryLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  categoryPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.md,
  },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  catPillActive: {
    borderColor: '#008cff',
    borderWidth: 1.5,
    backgroundColor: '#eff6ff',
  },
  catPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  catPillTextActive: {
    color: '#008cff',
    fontWeight: '800',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
    marginTop: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hintLabel: {
    fontSize: 10,
    color: '#94a3b8',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 11,
    fontSize: 13,
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  phoneInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  countryCodeBadge: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    borderRadius: 22,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countryCodeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
  },
  phoneInput: {
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 10,
  },
  colHalf: {
    flex: 1,
  },
  passwordInputContainer: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  eyeIconBtn: {
    padding: 10,
  },
  dropdownContainer: {
    marginTop: 4,
    position: 'relative',
    zIndex: 20,
  },
  dropdownSelector: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 11,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownSelectorText: {
    fontSize: 12,
    color: '#1e293b',
    fontWeight: '500',
  },
  dropdownMenu: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    ...Shadows.md,
  },
  dropdownMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownMenuItemActive: {
    backgroundColor: '#f0f9ff',
  },
  dropdownMenuItemText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
  },
  dropdownMenuItemTextActive: {
    color: '#008cff',
    fontWeight: '700',
  },
  orangeSubmitBtn: {
    backgroundColor: '#ff6b00',
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
    ...Shadows.md,
  },
  orangeSubmitBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  blueSubmitBtn: {
    backgroundColor: '#008cff',
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
    ...Shadows.md,
  },
  blueSubmitBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  btnContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  complianceText: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
    marginTop: Spacing.md,
    lineHeight: 14,
  },
  complianceLink: {
    textDecorationLine: 'underline',
    fontWeight: '700',
    color: '#334155',
  },
  bypassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingVertical: 11,
    marginTop: Spacing.md,
    gap: 6,
  },
  bypassBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400e',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    gap: 6,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  partialBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fef3c7',
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    gap: 6,
  },
  partialText: {
    color: '#b45309',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    gap: 6,
  },
  successText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
});
