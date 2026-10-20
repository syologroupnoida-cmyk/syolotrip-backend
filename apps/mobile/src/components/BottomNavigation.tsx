import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../theme/theme';
import { ScreenName } from '../types/travel';

interface BottomNavigationProps {
  currentScreen: ScreenName;
  onSelectScreen: (screen: ScreenName) => void;
}

interface TabItem {
  id: ScreenName;
  label: string;
  iconName: keyof typeof MaterialIcons.glyphMap;
}

const TABS: TabItem[] = [
  { id: 'explore', label: 'Explore', iconName: 'explore' },
  { id: 'flights', label: 'Flights', iconName: 'flight' },
  { id: 'hotels', label: 'Hotels', iconName: 'hotel' },
  { id: 'checkout', label: 'Trips', iconName: 'luggage' },
];

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentScreen,
  onSelectScreen,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        {TABS.map((tab) => {
          const isActive = currentScreen === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabButton, isActive && styles.activeTabButton]}
              onPress={() => onSelectScreen(tab.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrapper, isActive && styles.activeIconWrapper]}>
                <MaterialIcons
                  name={tab.iconName}
                  size={24}
                  color={isActive ? '#ffffff' : Colors.onSurfaceVariant}
                />
              </View>
              <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(250, 248, 255, 0.96)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 80, 125, 0.08)',
    paddingBottom: 8,
    ...Shadows.md,
  },
  navBar: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.sm,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.lg,
  },
  activeTabButton: {
    backgroundColor: Colors.surfaceContainerHigh,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconWrapper: {
    backgroundColor: Colors.secondaryContainer,
    ...Shadows.sm,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  activeTabLabel: {
    color: Colors.primary,
    fontWeight: '800',
  },
});
