import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { hapticTick } from '../lib/pwa';

interface DateNavigatorProps {
  /** Stretch the control to the full row width (phone layout) */
  fullWidth?: boolean;
}

const partsOf = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return {
    weekday: date.toLocaleDateString(undefined, { weekday: 'short' }),
    label: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
  };
};

const todayStr = () => new Date().toISOString().split('T')[0];

/**
 * Expressive date pager:
 * tonal circular arrows + a large animated date pill that flips in the
 * direction you travel, plus a "Today" jump chip when viewing another day.
 */
export const DateNavigator: React.FC<DateNavigatorProps> = ({ fullWidth = false }) => {
  const { selectedDate, setSelectedDate } = useAppData();
  // Direction the content travels on a date change: 'next' → slides in
  // from the right, 'prev' → from the left, null → first paint.
  const [travel, setTravel] = useState<'next' | 'prev' | null>(null);

  const shift = (delta: 1 | -1) => {
    hapticTick();
    setTravel(delta > 0 ? 'next' : 'prev');
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + delta);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const goToday = () => {
    const today = todayStr();
    hapticTick();
    setTravel(selectedDate > today ? 'prev' : 'next');
    setSelectedDate(today);
  };

  const isToday = selectedDate === todayStr();
  const cur = partsOf(selectedDate);

  const flipClass = travel === 'prev' ? 'md-date-in--prev' : travel === 'next' ? 'md-date-in--next' : undefined;

  return (
    <div
      className={`flex items-center gap-2${fullWidth ? ' w-full' : ''}`}
      role="group"
      aria-label="Select date"
    >
      <button
        onClick={() => shift(-1)}
        className="md-date-arrow md-ripple"
        title="Previous day"
        aria-label="Previous day"
      >
        <ChevronLeft className="w-5 h-5" strokeWidth={2.25} />
      </button>

      <div className={`md-date-pill flex-1 min-w-0${fullWidth ? '' : ' min-w-[9rem]'}`}>
        <div
          key={selectedDate}
          className={`md-date-flip ${flipClass ?? ''}`}
          aria-live="polite"
        >
          <span className="md-date-pill__weekday">{cur.weekday}</span>
          <span className="md-date-pill__label">{cur.label}</span>
        </div>

        {!isToday && (
          <button onClick={goToday} className="md-date-today-chip" title="Jump to today">
            Today
          </button>
        )}
      </div>

      <button
        onClick={() => shift(1)}
        className="md-date-arrow md-ripple"
        title="Next day"
        aria-label="Next day"
      >
        <ChevronRight className="w-5 h-5" strokeWidth={2.25} />
      </button>
    </div>
  );
};
