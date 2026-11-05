import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, Shadows } from '../theme/theme';
import { loginMobileApi, registerMobileApi, demoLoginMobileApi, logoutMobileApi } from '../services/api';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  user?: any | null;
  onLoginSuccess: (user: any) => void;
  onLogout: () => void;
  onNavigateToTrips?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  visible,
  onClose,
  user,
  onLoginSuccess,
  onLogout,
  onNavigateToTrips,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async () => {
    setErrorMsg(null);
    if (!email || !password) {
      setErrorMsg('Please enter email and password.');
      return;
    }
    if (mode === 'register' && !fullName) {
      setErrorMsg('Please enter your full legal name.');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'login') {
        const res = await loginMobileApi(email.trim(), password);
        onLoginSuccess(res.user);
        onClose();
      } else {
        const res = await registerMobileApi({
          email: email.trim(),
          full_name: fullName.trim(),
          password,
          phone: phone.trim() || undefined,
        });
        onLoginSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstantBypassLogin = async () => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const res = await demoLoginMobileApi('CUSTOMER');
      onLoginSuccess(res.user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Demo bypass login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = () => {
    setMode('login');
    setEmail('customer@ssjourney.com');
    setPassword('Customer@123456');
    setErrorMsg(null);
  };

  const handleSignOut = async () => {
    await logoutMobileApi();
    onLogout();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header Bar */}
          <LinearGradient
            colors={['#071a3d', '#0c2d6b', '#143d8a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.headerGradient}
          >
            <View style={styles.headerRow}>
              <View style={styles.brandRow}>
                <View style={styles.logoBadge}>
                  <MaterialIcons name="flight-takeoff" size={18} color="#f28c1c" />
                </View>
                <Text style={styles.brandTitle}>SYOLO TRIPS</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                <MaterialIcons name="close" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* User Profile View if Logged In */}
          {user ? (
            <View style={styles.body}>
              <View style={styles.profileBadge}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>
                    {(user.full_name || user.fullName || 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.userName}>{user.full_name || user.fullName}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                <View style={styles.rolePill}>
                  <Text style={styles.rolePillText}>Verified Customer</Text>
                </View>
              </View>

              {onNavigateToTrips && (
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: Colors.surfaceContainerHigh,
                    borderRadius: BorderRadius.lg,
                    paddingVertical: Spacing.sm + 2,
                    marginBottom: Spacing.sm,
                    gap: 8,
                  }}
                  onPress={() => {
                    onClose();
                    onNavigateToTrips();
                  }}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="luggage" size={18} color={Colors.primary} />
                  <Text style={{ color: Colors.primary, fontWeight: '700', fontSize: 14 }}>
                    View My Trips & Bookings
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut} activeOpacity={0.8}>
                <MaterialIcons name="logout" size={16} color="#ffffff" />
                <Text style={styles.logoutBtnText}>Sign Out of Syolo Trips</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
              {/* Tab Selector */}
              <View style={styles.tabRow}>
                <TouchableOpacity
                  style={[styles.tabBtn, mode === 'login' && styles.tabBtnActive]}
                  onPress={() => {
                    setMode('login');
                    setErrorMsg(null);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tabBtnText, mode === 'login' && styles.tabBtnTextActive]}>
                    Sign In
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tabBtn, mode === 'register' && styles.tabBtnActive]}
                  onPress={() => {
                    setMode('register');
                    setErrorMsg(null);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tabBtnText, mode === 'register' && styles.tabBtnTextActive]}>
                    Register
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Error Message */}
              {errorMsg && (
                <View style={styles.errorBox}>
                  <MaterialIcons name="error-outline" size={16} color={Colors.error} />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              )}

              {/* Inputs */}
              <View style={styles.inputsStack}>
                {mode === 'register' && (
                  <View>
                    <Text style={styles.inputLabel}>FULL LEGAL NAME</Text>
                    <TextInput
                      value={fullName}
                      onChangeText={setFullName}
                      placeholder="e.g. John Doe"
                      placeholderTextColor={Colors.onSurfaceVariant}
                      style={styles.textInput}
                    />
                  </View>
                )}

                <View>
                  <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholder="name@example.com"
                    placeholderTextColor={Colors.onSurfaceVariant}
                    style={styles.textInput}
                  />
                </View>

                {mode === 'register' && (
                  <View>
                    <Text style={styles.inputLabel}>MOBILE PHONE (OPTIONAL)</Text>
                    <TextInput
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      placeholder="+91 98765 43210"
                      placeholderTextColor={Colors.onSurfaceVariant}
                      style={styles.textInput}
                    />
                  </View>
                )}

                <View>
                  <Text style={styles.inputLabel}>PASSWORD</Text>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    placeholder="••••••••"
                    placeholderTextColor={Colors.onSurfaceVariant}
                    style={styles.textInput}
                  />
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSubmit}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <MaterialIcons name="lock-outline" size={16} color="#ffffff" />
                    <Text style={styles.submitBtnText}>
                      {mode === 'login' ? 'Sign In to Account' : 'Create Free Account'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Quick Customer Demo Fill & Instant Bypass */}
              <View style={styles.demoSection}>
                <TouchableOpacity
                  style={styles.bypassBtn}
                  onPress={handleInstantBypassLogin}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="bolt" size={16} color="#d97706" />
                  <Text style={styles.bypassBtnText}>Instant Security Bypass Login (1-Click)</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.demoBtn} onPress={handleQuickDemo} activeOpacity={0.8}>
                  <MaterialIcons name="edit" size={13} color={Colors.primary} />
                  <Text style={styles.demoBtnText}>Auto-fill Customer Credentials</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  headerGradient: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logoBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    padding: Spacing.md,
    maxHeight: 480,
  },
  body: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  profileBadge: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.onSurface,
  },
  userEmail: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  rolePill: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  rolePillText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#10b981',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    width: '100%',
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.error,
  },
  logoutBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: BorderRadius.lg,
    padding: 3,
    marginBottom: Spacing.md,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: Spacing.xs + 2,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  tabBtnActive: {
    backgroundColor: Colors.primary,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  tabBtnTextActive: {
    color: '#ffffff',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    marginBottom: Spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: 11,
    color: Colors.error,
  },
  inputsStack: {
    gap: Spacing.sm,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: Colors.onSurfaceVariant,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    color: Colors.onSurface,
    fontSize: 13,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary,
    ...Shadows.md,
  },
  submitBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  demoSection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  demoLabel: {
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    marginBottom: 6,
  },
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(20, 61, 138, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(20, 61, 138, 0.4)',
  },
  demoBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  bypassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
    paddingVertical: 9,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fcd34d',
    marginBottom: 8,
  },
  bypassBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#92400e',
  },
});
