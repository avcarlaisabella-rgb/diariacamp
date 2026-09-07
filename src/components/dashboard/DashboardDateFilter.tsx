'use client';

import React from 'react';
import { Calendar, Filter, X, Clock, Check } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

export type DatePeriodPreset = 
  | 'tudo' 
  | 'hoje' 
  | 'ontem' 
  | 'esta-semana' 
  | 'semana-passada' 
  | 'este-mes' 
  | 'ultimos-30' 
  | 'custom';

interface DashboardDateFilterProps {
  startDate: string;
  endDate: string;
  onDateChange: (start: string, end: string, preset: DatePeriodPreset) => void;
  filteredCount?: number;
  totalCount?: number;
}

export const DashboardDateFilter: React.FC<DashboardDateFilterProps> = ({
  startDate,
  endDate,
  onDateChange,
  filteredCount,
  totalCount,
}) => {
  // Helper to format Date to YYYY-MM-DD
  const toISO = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Determine current active preset based on startDate & endDate
  const getCurrentPreset = (): DatePeriodPreset => {
    if (!startDate && !endDate) return 'tudo';

    const now = new Date();
    const todayStr = toISO(now);

    if (startDate === todayStr && endDate === todayStr) return 'hoje';

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = toISO(yesterday);
    if (startDate === yesterdayStr && endDate === yesterdayStr) return 'ontem';

    // This week (Monday to Friday — trabalho não é realizado no fim de semana)
    const day = now.getDay();
    const diffToMonday = (day === 0 ? -6 : 1) - day;
    const mon = new Date(now);
    mon.setDate(now.getDate() + diffToMonday);
    const fri = new Date(mon);
    fri.setDate(mon.getDate() + 4);
    if (startDate === toISO(mon) && endDate === toISO(fri)) return 'esta-semana';

    // This month
    const firstDayMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    if (startDate === toISO(firstDayMonth) && endDate === toISO(lastDayMonth)) return 'este-mes';

    return 'custom';
  };

  const activePreset = getCurrentPreset();

  const handleApplyPreset = (preset: DatePeriodPreset) => {
    const now = new Date();

    if (preset === 'tudo') {
      onDateChange('', '', 'tudo');
      return;
    }

    if (preset === 'hoje') {
      const todayStr = toISO(now);
      onDateChange(todayStr, todayStr, 'hoje');
      return;
    }

    if (preset === 'ontem') {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = toISO(yesterday);
      onDateChange(yStr, yStr, 'ontem');
      return;
    }

    if (preset === 'esta-semana') {
      const day = now.getDay();
      const diffToMonday = (day === 0 ? -6 : 1) - day;
      const mon = new Date(now);
      mon.setDate(now.getDate() + diffToMonday);
      const fri = new Date(mon);
      fri.setDate(mon.getDate() + 4);
      onDateChange(toISO(mon), toISO(fri), 'esta-semana');
      return;
    }

    if (preset === 'semana-passada') {
      const day = now.getDay();
      const diffToMonday = (day === 0 ? -6 : 1) - day;
      const thisMon = new Date(now);
      thisMon.setDate(now.getDate() + diffToMonday);
      const lastMon = new Date(thisMon);
      lastMon.setDate(thisMon.getDate() - 7);
      const lastFri = new Date(lastMon);
      lastFri.setDate(lastMon.getDate() + 4);
      onDateChange(toISO(lastMon), toISO(lastFri), 'semana-passada');
      return;
    }

    if (preset === 'este-mes') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      onDateChange(toISO(firstDay), toISO(lastDay), 'este-mes');
      return;
    }

    if (preset === 'ultimos-30') {
      const past30 = new Date(now);
      past30.setDate(now.getDate() - 29);
      onDateChange(toISO(past30), toISO(now), 'ultimos-30');
      return;
    }
  };

  const handleStartChange = (val: string) => {
    onDateChange(val, endDate, 'custom');
  };

  const handleEndChange = (val: string) => {
    onDateChange(startDate, val, 'custom');
  };

  const handleClear = () => {
    onDateChange('', '', 'tudo');
  };

  const hasFilter = Boolean(startDate || endDate);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-3.5">
      {/* Top Bar: Title & Active Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-xl">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
              Filtro por Período de Datas
            </span>
            <p className="text-[11px] text-slate-500">
              Personalize o período de análise para recalcular todos os indicadores e relatórios do painel.
            </p>
          </div>
        </div>

        {/* Status indicator badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {hasFilter ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              <span>
                {startDate && endDate
                  ? `${formatDate(startDate)} até ${formatDate(endDate)}`
                  : startDate
                  ? `A partir de ${formatDate(startDate)}`
                  : `Até ${formatDate(endDate)}`}
              </span>
              {filteredCount !== undefined && (
                <span className="ml-1 px-1.5 py-0.2 bg-blue-200/80 rounded text-blue-900 text-[10px]">
                  {filteredCount} diária(s)
                </span>
              )}
            </div>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>Todo o Histórico</span>
              {totalCount !== undefined && (
                <span className="text-slate-400 text-[10px]">({totalCount} diárias)</span>
              )}
            </span>
          )}

          {hasFilter && (
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors font-bold cursor-pointer"
              title="Limpar filtro de período e exibir todo o histórico"
            >
              <X className="w-3.5 h-3.5" />
              <span>Limpar</span>
            </button>
          )}
        </div>
      </div>

      {/* Preset Quick Buttons & Custom Range Inputs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleApplyPreset('esta-semana')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activePreset === 'esta-semana'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
            }`}
          >
            Semana
          </button>

          <button
            type="button"
            onClick={() => handleApplyPreset('este-mes')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activePreset === 'este-mes'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
            }`}
          >
            Mensal
          </button>
        </div>

        {/* Custom Date Inputs */}
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 self-start lg:self-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase text-slate-500 pl-1">De:</span>
            <input
              id="dashboard-filter-start-date"
              type="date"
              value={startDate}
              onChange={(e) => handleStartChange(e.target.value)}
              className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase text-slate-500">Até:</span>
            <input
              id="dashboard-filter-end-date"
              type="date"
              value={endDate}
              onChange={(e) => handleEndChange(e.target.value)}
              className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
