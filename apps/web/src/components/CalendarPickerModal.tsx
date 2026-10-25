import React, { useState, useEffect } from 'react';

interface CalendarPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  selectedDate: string; // YYYY-MM-DD
  minDate?: string; // YYYY-MM-DD
  onSelectDate: (dateStr: string) => void;
}

export const CalendarPickerModal: React.FC<CalendarPickerModalProps> = ({
  isOpen,
  onClose,
  title,
  selectedDate,
  minDate,
  onSelectDate,
}) => {
  // Parse initial year and month from selectedDate or today
  const parseDate = (dStr: string) => {
    const parts = dStr.split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return new Date();
  };

  const initialDate = parseDate(selectedDate);
  const [currentMonth, setCurrentMonth] = useState<Date>(
    new Date(initialDate.getFullYear(), initialDate.getMonth(), 1)
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const minAllowedDate = minDate ? parseDate(minDate) : today;
  minAllowedDate.setHours(0, 0, 0, 0);

  useEffect(() => {
    if (isOpen) {
      const d = parseDate(selectedDate);
      setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  }, [isOpen, selectedDate]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    const prev = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    const minMonth = new Date(minAllowedDate.getFullYear(), minAllowedDate.getMonth(), 1);
    if (prev >= minMonth) {
      setCurrentMonth(prev);
    }
  };

  // Quick preset handlers
  const handleQuickPreset = (offsetDays: number) => {
    const target = new Date();
    target.setDate(target.getDate() + offsetDays);
    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, '0');
    const dd = String(target.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    onSelectDate(dateStr);
    onClose();
  };

  const handleNextWeekend = () => {
    const target = new Date();
    const day = target.getDay(); // 0 is Sunday, 6 is Saturday
    const daysUntilSaturday = (6 - day + 7) % 7 || 7;
    target.setDate(target.getDate() + daysUntilSaturday);
    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, '0');
    const dd = String(target.getDate()).padStart(2, '0');
    onSelectDate(`${yyyy}-${mm}-${dd}`);
    onClose();
  };

  // Build calendar month days
  const renderMonthGrid = (monthDate: Date) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const monthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0: Sun ... 6: Sat
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Blank padding for days of previous month
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<div key={`blank-${i}`} className="w-10 h-10 sm:w-11 sm:h-11" />);
    }

    // Days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      d.setHours(0, 0, 0, 0);

      const isPast = d < minAllowedDate;
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isSelected = selectedDate === dateStr;
      const isToday = d.getTime() === today.getTime();

      days.push(
        <button
          key={dateStr}
          type="button"
          disabled={isPast}
          onClick={() => {
            onSelectDate(dateStr);
            onClose();
          }}
          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex flex-col items-center justify-center text-sm font-semibold transition-all relative group ${
            isSelected
              ? 'bg-[#008cff] text-white shadow-md shadow-blue-500/30 scale-105 z-10'
              : isPast
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-700 hover:bg-blue-50 hover:text-[#008cff] cursor-pointer'
          } ${isToday && !isSelected ? 'border border-[#008cff] text-[#008cff]' : ''}`}
        >
          <span>{day}</span>
          {isToday && !isSelected && (
            <span className="text-[8px] font-bold text-[#008cff] leading-none -mt-0.5">Today</span>
          )}
        </button>
      );
    }

    return (
      <div className="flex-1 min-w-[280px]">
        <div className="text-center font-bold text-gray-800 text-sm mb-3">
          {monthName}
        </div>
        <div className="grid grid-cols-7 gap-1 text-center mb-1">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((wd, idx) => (
            <div
              key={wd}
              className={`text-[11px] font-bold py-1 ${
                idx === 0 || idx === 6 ? 'text-rose-500' : 'text-gray-400'
              }`}
            >
              {wd}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>
      </div>
    );
  };

  const secondMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-white">
          <div className="flex items-center space-x-2">
            <span className="material-symbols-outlined text-[#008cff] text-xl">calendar_month</span>
            <div>
              <h3 className="font-bold text-gray-900 text-base">{title}</h3>
              <p className="text-xs text-gray-500">
                Selected: <span className="font-bold text-[#008cff]">{selectedDate}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Quick Presets Bar */}
        <div className="px-5 py-2.5 bg-gray-50/70 border-b border-gray-100 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-gray-400 text-[11px] font-bold uppercase tracking-wider mr-1">Quick Select:</span>
          <button
            type="button"
            onClick={() => handleQuickPreset(0)}
            className="px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-700 hover:border-[#008cff] hover:text-[#008cff] font-medium transition cursor-pointer text-xs"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset(1)}
            className="px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-700 hover:border-[#008cff] hover:text-[#008cff] font-medium transition cursor-pointer text-xs"
          >
            Tomorrow
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset(3)}
            className="px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-700 hover:border-[#008cff] hover:text-[#008cff] font-medium transition cursor-pointer text-xs"
          >
            +3 Days
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset(7)}
            className="px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-700 hover:border-[#008cff] hover:text-[#008cff] font-medium transition cursor-pointer text-xs"
          >
            +1 Week
          </button>
          <button
            type="button"
            onClick={handleNextWeekend}
            className="px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#008cff] hover:bg-blue-100 font-semibold transition cursor-pointer text-xs"
          >
            Next Weekend
          </button>
        </div>

        {/* Month Navigation & Dual Calendar View */}
        <div className="p-5 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={prevMonth}
              className="w-8 h-8 rounded-full border border-gray-200 hover:bg-gray-100 flex items-center justify-center text-gray-700 transition cursor-pointer shadow-2xs"
            >
              <span className="material-symbols-outlined text-base">chevron_left</span>
            </button>
            <span className="text-xs font-semibold text-gray-500">
              Select date to continue
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="w-8 h-8 rounded-full border border-gray-200 hover:bg-gray-100 flex items-center justify-center text-gray-700 transition cursor-pointer shadow-2xs"
            >
              <span className="material-symbols-outlined text-base">chevron_right</span>
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-6 justify-center">
            {renderMonthGrid(currentMonth)}
            <div className="hidden md:block w-px bg-gray-100" />
            <div className="hidden md:block flex-1 min-w-[280px]">
              {renderMonthGrid(secondMonth)}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center space-x-3 text-xs text-gray-500">
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#008cff]" />
              <span>Selected</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full border border-[#008cff]" />
              <span>Today</span>
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#008cff] hover:bg-[#0077db] text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
