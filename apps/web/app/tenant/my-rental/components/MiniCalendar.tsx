"use client";

import DashboardCard from "./DashboardCard";
import { CALENDAR_DAYS } from "../constants";

export default function MiniCalendar() {
  const TODAY = 24;

  return (
    <DashboardCard>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">April 2025</span>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="text-[10px] font-medium text-zinc-400 py-0.5">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center">
        {CALENDAR_DAYS.map((day, i) => {
          if (day === null) return <div key={i} />;
          if (day === TODAY) {
            return (
              <div key={i} className="flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[11px] font-medium flex items-center justify-center">
                  {day}
                </div>
              </div>
            );
          }
          return (
            <div key={i} className="text-[12px] text-zinc-500 dark:text-zinc-400 py-1">{day}</div>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-1.5">
        <div className="flex items-center gap-2 text-[12px] text-zinc-500">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          May 1 — Rent due
        </div>
        <div className="flex items-center gap-2 text-[12px] text-zinc-400">
          <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-600" />
          Apr 30 — Month end
        </div>
      </div>
    </DashboardCard>
  );
}
