import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, PenLine } from 'lucide-react';
import type { JournalEntry } from '../types';

interface JournalCalendarProps {
  entriesByDate: Record<string, number>;
  entries: JournalEntry[];
  onSelectEntry: (entry: JournalEntry) => void;
  onNewEntryForDate?: (dateStr: string) => void;
}

export const JournalCalendar: React.FC<JournalCalendarProps> = ({
  entriesByDate,
  entries,
  onSelectEntry,
  onNewEntryForDate,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Days calculation
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonthDays = new Date(year, month, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDateStr(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDateStr(null);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Selected date entries
  const selectedEntries = selectedDateStr
    ? entries.filter((e) => e.created_at.startsWith(selectedDateStr))
    : [];

  return (
    <div className="bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-500/30">
            <CalendarIcon className="w-4 h-4 text-teal-300" />
          </div>
          <div>
            <h3 className="font-medium text-white text-base">Journal Calendar</h3>
            <p className="text-2xs text-slate-400 font-light">Days marked with glowing dots contain private entries</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-semibold text-slate-200 mr-1">
            {monthNames[month]} {year}
          </span>
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {daysOfWeek.map((day) => (
          <div key={day} className="text-2xs font-semibold text-slate-400 py-1 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Day Cells Grid */}
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {/* Fillers from previous month */}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => {
          const dayNum = prevMonthDays - firstDayOfMonth + i + 1;
          return (
            <div key={`prev-${i}`} className="h-10 sm:h-12 rounded-xl flex items-center justify-center text-xs text-slate-600 opacity-40 font-light">
              {dayNum}
            </div>
          );
        })}

        {/* Days of current month */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const monthStr = String(month + 1).padStart(2, '0');
          const dayStr = String(dayNum).padStart(2, '0');
          const fullDateKey = `${year}-${monthStr}-${dayStr}`;

          const entryCount = entriesByDate[fullDateKey] || 0;
          const isToday = fullDateKey === todayStr;
          const isSelected = fullDateKey === selectedDateStr;

          return (
            <button
              key={fullDateKey}
              onClick={() => setSelectedDateStr(fullDateKey === selectedDateStr ? null : fullDateKey)}
              className={`h-10 sm:h-12 rounded-xl flex flex-col items-center justify-center relative transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-indigo-500 text-white border-indigo-400 shadow-md shadow-indigo-500/30 font-bold'
                  : isToday
                  ? 'bg-white/10 text-teal-300 border-teal-400/40 font-semibold'
                  : entryCount > 0
                  ? 'bg-white/5 hover:bg-white/10 text-slate-200 border-white/10'
                  : 'hover:bg-white/5 text-slate-400 border-transparent'
              }`}
            >
              <span className="text-xs">{dayNum}</span>
              {entryCount > 0 && (
                <div className="flex items-center gap-0.5 mt-0.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected ? 'bg-white' : 'bg-teal-400'
                    } shadow-xs`}
                  />
                  {entryCount > 1 && (
                    <span className="text-3xs text-teal-300 opacity-90 font-bold">
                      +{entryCount}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Day Entries Drawer */}
      {selectedDateStr && (
        <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-indigo-300 font-medium">
              Entries on {new Date(selectedDateStr + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} ({selectedEntries.length})
            </span>
            {onNewEntryForDate && (
              <button
                onClick={() => onNewEntryForDate(selectedDateStr)}
                className="inline-flex items-center gap-1 text-2xs text-teal-400 hover:text-teal-300 cursor-pointer"
              >
                <PenLine className="w-3 h-3" />
                <span>Write on this date</span>
              </button>
            )}
          </div>

          {selectedEntries.length === 0 ? (
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-2xs text-slate-400 text-center font-light">
              No entries logged on this date.
            </div>
          ) : (
            <div className="space-y-2">
              {selectedEntries.map((e) => (
                <div
                  key={e.id}
                  onClick={() => onSelectEntry(e)}
                  className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between group cursor-pointer transition-all"
                >
                  <div className="min-w-0">
                    <h5 className="text-xs font-medium text-white group-hover:text-indigo-300 truncate">
                      {e.title}
                    </h5>
                    <p className="text-2xs text-slate-400 truncate mt-0.5">
                      Mood: {e.mood} • {e.content.slice(0, 70)}...
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 group-hover:text-white shrink-0 ml-2">→</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
