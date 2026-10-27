import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';

export const Footer: React.FC = () => {
  const handleOpenURL = (url: string) => {
    Linking.openURL(url).catch((err) => console.error('Failed to open URL:', err));
  };

  return (
    <View style={styles.container}>
      {/* ── 1. LOGO & BRANDING ── */}
      <View style={styles.brandRow}>
        <Image
          source={require('../../assets/ss-journey-emblem.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <View style={styles.brandMeta}>
          <View style={styles.titleRow}>
            <Text style={styles.brandTitle}>SYOLO TRIPS</Text>
            <View style={styles.globalBadge}>
              <Text style={styles.globalBadgeText}>GLOBAL</Text>
            </View>
          </View>
          <Text style={styles.tagline}>Explore Beyond!</Text>
        </View>
      </View>

      {/* ── 2. CONTACT INFORMATION ── */}
      <View style={styles.contactContainer}>
        <TouchableOpacity
          style={styles.contactItem}
          onPress={() => handleOpenURL('tel:+919876543210')}
          activeOpacity={0.7}
        >
          <View style={styles.iconCircle}>
            <MaterialIcons name="phone" size={16} color="#008cff" />
          </View>
          <View>
            <Text style={styles.contactLabel}>CALL 24/7</Text>
            <Text style={styles.contactValue}>+91 98765 43210</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.contactItem}
          onPress={() => handleOpenURL('mailto:support@ssjourney.com')}
          activeOpacity={0.7}
        >
          <View style={styles.iconCircle}>
            <MaterialIcons name="mail" size={16} color="#008cff" />
          </View>
          <View>
            <Text style={styles.contactLabel}>EMAIL US</Text>
            <Text style={styles.contactValue}>support@ssjourney.com</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.contactItem}>
          <View style={[styles.iconCircle, { backgroundColor: 'rgba(242, 140, 28, 0.15)' }]}>
            <MaterialIcons name="location-on" size={16} color="#f28c1c" />
          </View>
          <View>
            <Text style={styles.contactLabel}>HEADQUARTERS</Text>
            <Text style={styles.contactValue}>Mumbai &amp; Delhi, India</Text>
          </View>
        </View>
      </View>

      {/* ── 3. SOCIAL MEDIA (INSTA, FB, X) ── */}
      <View style={styles.socialRow}>
        {/* Instagram */}
        <TouchableOpacity
          style={styles.socialButton}
          onPress={() => handleOpenURL('https://instagram.com')}
          activeOpacity={0.8}
        >
          <Ionicons name="logo-instagram" size={20} color="#ffffff" />
        </TouchableOpacity>

        {/* Facebook */}
        <TouchableOpacity
          style={[styles.socialButton, { backgroundColor: '#1877F2' }]}
          onPress={() => handleOpenURL('https://facebook.com')}
          activeOpacity={0.8}
        >
          <Ionicons name="logo-facebook" size={20} color="#ffffff" />
        </TouchableOpacity>

        {/* X (formerly Twitter) */}
        <TouchableOpacity
          style={[styles.socialButton, { backgroundColor: '#000000', borderColor: 'rgba(255,255,255,0.3)' }]}
          onPress={() => handleOpenURL('https://x.com')}
          activeOpacity={0.8}
        >
          <Svg width={16} height={16} viewBox="0 0 24 24">
            <Path
              d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
              fill="#ffffff"
            />
          </Svg>
        </TouchableOpacity>
      </View>

      {/* ── 4. COPYRIGHT ── */}
      <View style={styles.bottomBar}>
        <Text style={styles.copyrightText}>
          © {new Date().getFullYear()} Syolo Trips. All rights reserved.
        </Text>
        <Text style={styles.verifiedText}>100% Verified Travel Platform</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#071426',
    marginTop: 24,
    paddingTop: 24,
    paddingBottom: 28,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  logoImage: {
    width: 48,
    height: 36,
  },
  brandMeta: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  globalBadge: {
    backgroundColor: 'rgba(242, 140, 28, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(242, 140, 28, 0.3)',
  },
  globalBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#f28c1c',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 11,
    color: 'rgba(191, 219, 254, 0.8)',
    marginTop: 2,
    fontWeight: '500',
  },
  contactContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 140, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  contactValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 1,
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 20,
  },
  socialButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 16,
    alignItems: 'center',
    gap: 4,
  },
  copyrightText: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
  },
  verifiedText: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },
});

export default Footer;
