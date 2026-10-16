import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useAppData } from '../context/AppDataContext';

interface DateNavigatorProps {
  /** Stretch the segmented control to the full row width (phone layout) */
  fullWidth?: boolean;
}

/** MD3 segmented date pager — shared by the top app bar (tablet+) and the Today screen (phone). */
export const DateNavigator: React.FC<DateNavigatorProps> = ({ fullWidth = false }) => {
  const { selectedDate, setSelectedDate } = useAppData();

  const handlePrevDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() - 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleSetToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
  };

  const isSelectedDateToday = selectedDate === new Date().toISOString().split('T')[0];

  const formatDisplayDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div
      className={`md-segmented${fullWidth ? ' w-full' : ''}`}
      role="group"
      aria-label="Select date"
    >
      <button
        onClick={handlePrevDay}
        className="md-segmented__item md-ripple px-2 shrink-0"
        title="Previous Day"
        aria-label="Previous day"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button
        onClick={handleSetToday}
        className={`md-segmented__item md-ripple px-2${fullWidth ? ' flex-1 min-w-0' : ' min-w-[5rem]'}`}
        title={isSelectedDateToday ? 'Today' : `Selected: ${formatDisplayDate(selectedDate)}`}
      >
        <Calendar className="w-4 h-4 shrink-0" />
        <span className="md-label-large truncate">
          {isSelectedDateToday ? 'Today' : formatDisplayDate(selectedDate)}
        </span>
      </button>
      <button
        onClick={handleNextDay}
        className="md-segmented__item md-ripple px-2 shrink-0"
        title="Next Day"
        aria-label="Next day"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};
