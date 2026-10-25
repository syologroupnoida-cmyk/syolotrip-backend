import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface CalendarModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  initialDate?: string; // e.g. "15 Oct 2026" or "2026-10-15"
  minDate?: string;
  onSelectDate: (formattedDate: string, dayOfWeek: string, isoDate: string) => void;
}

const { width } = Dimensions.get('window');

const parseToDate = (input?: string): Date => {
  if (!input) return new Date();

  // Try ISO format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const [y, m, d] = input.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  // Try "DD MMM YYYY" like "15 Oct 2026"
  const parsed = new Date(input);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  return new Date();
};

export const CalendarModal: React.FC<CalendarModalProps> = ({
  visible,
  onClose,
  title,
  initialDate,
  minDate,
  onSelectDate,
}) => {
  const [selectedDateObj, setSelectedDateObj] = useState<Date>(parseToDate(initialDate));
  const [viewMonth, setViewMonth] = useState<Date>(
    new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), 1)
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const minAllowedDate = minDate ? parseToDate(minDate) : today;
  minAllowedDate.setHours(0, 0, 0, 0);

  useEffect(() => {
    if (visible) {
      const d = parseToDate(initialDate);
      setSelectedDateObj(d);
      setViewMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  }, [visible, initialDate]);

  const nextMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    const prev = new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1);
    const minMonth = new Date(minAllowedDate.getFullYear(), minAllowedDate.getMonth(), 1);
    if (prev >= minMonth) {
      setViewMonth(prev);
    }
  };

  const applyDate = (date: Date) => {
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const year = date.getFullYear();
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
    const formatted = `${day} ${month} ${year}`;
    const iso = `${year}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    onSelectDate(formatted, dayOfWeek, iso);
    onClose();
  };

  const handleQuickPreset = (offsetDays: number) => {
    const target = new Date();
    target.setDate(target.getDate() + offsetDays);
    setSelectedDateObj(target);
    applyDate(target);
  };

  const handleNextWeekend = () => {
    const target = new Date();
    const day = target.getDay(); // 0 Sun, 6 Sat
    const daysUntilSaturday = (6 - day + 7) % 7 || 7;
    target.setDate(target.getDate() + daysUntilSaturday);
    setSelectedDateObj(target);
    applyDate(target);
  };

  // Build current month calendar grid
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const monthLabel = viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 Sun ... 6 Sat
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const dayCells = [];
  // Blank padding cells
  for (let i = 0; i < firstDayIndex; i++) {
    dayCells.push(<View key={`pad-${i}`} style={styles.dayCell} />);
  }

  // Days of month
  for (let d = 1; d <= daysInMonth; d++) {
    const cellDate = new Date(year, month, d);
    cellDate.setHours(0, 0, 0, 0);

    const isPast = cellDate < minAllowedDate;
    const isSelected =
      selectedDateObj.getDate() === d &&
      selectedDateObj.getMonth() === month &&
      selectedDateObj.getFullYear() === year;
    const isToday = cellDate.getTime() === today.getTime();

    dayCells.push(
      <TouchableOpacity
        key={`day-${d}`}
        style={[
          styles.dayCell,
          isSelected && styles.dayCellSelected,
          isToday && !isSelected && styles.dayCellToday,
        ]}
        disabled={isPast}
        onPress={() => {
          setSelectedDateObj(cellDate);
          applyDate(cellDate);
        }}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.dayCellText,
            isSelected && styles.dayCellTextSelected,
            isPast && styles.dayCellTextDisabled,
            isToday && !isSelected && styles.dayCellTextToday,
          ]}
        >
          {d}
        </Text>
        {isToday && !isSelected && (
          <Text style={styles.todaySmallBadge}>Today</Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        
        <View style={styles.sheetContainer}>
          {/* Header Handle */}
          <View style={styles.handleBar} />

          {/* Top Bar with Title and Close Button */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleWrap}>
              <MaterialIcons name="event" size={22} color="#005cab" style={{ marginRight: 6 }} />
              <Text style={styles.headerTitle}>{title}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <MaterialIcons name="close" size={20} color="#475569" />
            </TouchableOpacity>
          </View>

          {/* Quick Select Presets Carousel */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.presetsRow}
          >
            <TouchableOpacity
              style={styles.presetChip}
              onPress={() => handleQuickPreset(0)}
              activeOpacity={0.75}
            >
              <Text style={styles.presetChipText}>Today</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.presetChip}
              onPress={() => handleQuickPreset(1)}
              activeOpacity={0.75}
            >
              <Text style={styles.presetChipText}>Tomorrow</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.presetChip}
              onPress={() => handleQuickPreset(3)}
              activeOpacity={0.75}
            >
              <Text style={styles.presetChipText}>+3 Days</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.presetChip}
              onPress={() => handleQuickPreset(7)}
              activeOpacity={0.75}
            >
              <Text style={styles.presetChipText}>+1 Week</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.presetChip, styles.presetChipHighlight]}
              onPress={handleNextWeekend}
              activeOpacity={0.75}
            >
              <Text style={styles.presetChipTextHighlight}>Next Weekend</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Month Header with Navigation Buttons */}
          <View style={styles.monthHeaderRow}>
            <TouchableOpacity onPress={prevMonth} style={styles.monthNavBtn} activeOpacity={0.7}>
              <MaterialIcons name="chevron-left" size={24} color="#005cab" />
            </TouchableOpacity>
            <Text style={styles.monthLabelText}>{monthLabel}</Text>
            <TouchableOpacity onPress={nextMonth} style={styles.monthNavBtn} activeOpacity={0.7}>
              <MaterialIcons name="chevron-right" size={24} color="#005cab" />
            </TouchableOpacity>
          </View>

          {/* Days of Week Row */}
          <View style={styles.weekHeaderRow}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((w, index) => (
              <View key={`wd-${index}`} style={styles.weekDayHeaderCell}>
                <Text
                  style={[
                    styles.weekDayHeaderText,
                    (index === 0 || index === 6) && styles.weekDayWeekendText,
                  ]}
                >
                  {w}
                </Text>
              </View>
            ))}
          </View>

          {/* Calendar Day Grid */}
          <View style={styles.calendarGrid}>
            {dayCells}
          </View>

          {/* Confirm Footer */}
          <View style={styles.footerRow}>
            <View style={styles.selectionSummary}>
              <Text style={styles.selectionLabel}>Selected Date</Text>
              <Text style={styles.selectionValue}>
                {selectedDateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={() => applyDate(selectedDateObj)}
              activeOpacity={0.85}
            >
              <Text style={styles.confirmBtnText}>Confirm Date</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 10,
    paddingBottom: 28,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
  },
  handleBar: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetsRow: {
    paddingVertical: 4,
    gap: 8,
    marginBottom: 14,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  presetChipHighlight: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  presetChipTextHighlight: {
    fontSize: 12,
    fontWeight: '700',
    color: '#005cab',
  },
  monthHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  monthNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabelText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  weekHeaderRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekDayHeaderCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  weekDayHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
  },
  weekDayWeekendText: {
    color: '#f43f5e',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginVertical: 1,
  },
  dayCellSelected: {
    backgroundColor: '#005cab',
    shadowColor: '#005cab',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: '#005cab',
  },
  dayCellText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  dayCellTextSelected: {
    color: '#ffffff',
    fontWeight: '800',
  },
  dayCellTextDisabled: {
    color: '#cbd5e1',
  },
  dayCellTextToday: {
    color: '#005cab',
    fontWeight: '800',
  },
  todaySmallBadge: {
    fontSize: 8,
    fontWeight: '700',
    color: '#005cab',
    position: 'absolute',
    bottom: 2,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  selectionSummary: {
    flex: 1,
  },
  selectionLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  selectionValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  confirmBtn: {
    backgroundColor: '#005cab',
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 14,
    shadowColor: '#005cab',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
