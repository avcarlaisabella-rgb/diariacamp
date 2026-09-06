'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatMoney } from '../../utils/formatters';
import { 
  X, 
  Calendar, 
  UserCheck, 
  Check, 
  Search, 
  CheckSquare, 
  Square,
  AlertCircle
} from 'lucide-react';

export const NovaDiariaModal: React.FC = () => {
  const { 
    currentUser, 
    workers, 
    diarias,
    isNovaDiariaOpen, 
    setIsNovaDiariaOpen, 
    markDailyAttendance
  } = useApp();

  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [presenceMap, setPresenceMap] = useState<Record<string, boolean>>({});

  // Filter workers for coordinator's team, or all active workers for gestor/admin
  const eligibleWorkers = useMemo(() => {
    return workers.filter(w => {
      if (w.status === 'Inativo') return false;
      if (currentUser?.role === 'coordenador') {
        return w.coordinatorId === currentUser.id;
      }
      return true;
    });
  }, [workers, currentUser]);

  // When date changes or modal opens, pre-fill attendance state based on existing daily records for that date
  useEffect(() => {
    if (isNovaDiariaOpen) {
      const initialMap: Record<string, boolean> = {};
      eligibleWorkers.forEach(w => {
        const hasWorked = diarias.some(
          d => d.workerId === w.id && d.date === date && d.status !== 'Cancelada' && d.status !== 'Rejeitada'
        );
        initialMap[w.id] = hasWorked;
      });
      setPresenceMap(initialMap);
    }
  }, [isNovaDiariaOpen, date, eligibleWorkers, diarias]);

  if (!isNovaDiariaOpen || !currentUser) return null;

  const toggleWorkerPresence = (workerId: string) => {
    setPresenceMap(prev => ({
      ...prev,
      [workerId]: !prev[workerId]
    }));
  };

  const markAll = (worked: boolean) => {
    const updated: Record<string, boolean> = {};
    filteredWorkers.forEach(w => {
      updated[w.id] = worked;
    });
    setPresenceMap(prev => ({ ...prev, ...updated }));
  };

  const filteredWorkers = eligibleWorkers.filter(w => 
    w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const presentCount = Object.values(presenceMap).filter(Boolean).length;
  const totalAmountEstimated = eligibleWorkers.reduce((acc, w) => {
    return presenceMap[w.id] ? acc + (w.standardRate || 80) : acc;
  }, 0);

  const handleSave = () => {
    const records = eligibleWorkers.map(w => ({
      workerId: w.id,
      worked: !!presenceMap[w.id]
    }));

    markDailyAttendance(date, records);
    setIsNovaDiariaOpen(false);
  };

  const setRelativeDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    setDate(d.toISOString().split('T')[0]);
  };

  const isToday = date === new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header - Clean and Direct */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                Dar Presença da Equipe
              </h2>
              <p className="text-xs text-slate-500">
                Marque quem trabalhou hoje. O total semanal calcula dias × diária.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsNovaDiariaOpen(false)}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Date Selector & Quick Filters */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 space-y-3 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Data do Ponto:
              </span>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            {/* Quick date shortcuts */}
            <div className="flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setRelativeDate(-1)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium cursor-pointer"
              >
                Ontem
              </button>
              <button
                type="button"
                onClick={() => setRelativeDate(0)}
                className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${
                  isToday 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Hoje
              </button>
            </div>
          </div>

          {/* Search and Bulk Select */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nome ou função..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => markAll(true)}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-bold px-2 py-1 bg-emerald-50 rounded-lg cursor-pointer"
              >
                Marcar Todos
              </button>
              <button
                type="button"
                onClick={() => markAll(false)}
                className="text-xs text-slate-500 hover:text-slate-700 font-medium px-2 py-1 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Desmarcar Todos
              </button>
            </div>
          </div>
        </div>

        {/* Worker List for Roll Call */}
        <div className="p-3.5 sm:p-4 overflow-y-auto flex-1 space-y-2">
          {filteredWorkers.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              Nenhum integrante encontrado na equipe.
            </div>
          ) : (
            filteredWorkers.map(w => {
              const isPresent = !!presenceMap[w.id];

              return (
                <div
                  key={w.id}
                  onClick={() => toggleWorkerPresence(w.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isPresent
                      ? 'bg-emerald-50/70 border-emerald-300 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={w.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt={w.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                        {w.name}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium">{w.role}</span>
                        <span>•</span>
                        <span className="font-semibold text-emerald-700">
                          {formatMoney(w.standardRate || 80)} / dia
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Presence Toggle Button */}
                  <div className="shrink-0">
                    {isPresent ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Trabalhou</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 font-semibold text-xs border border-slate-200 hover:bg-slate-200">
                        <span>Faltou</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Summary & Action */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs">
            <span className="font-bold text-slate-900">
              {presentCount} de {eligibleWorkers.length} presentes
            </span>
            <span className="text-slate-400 mx-1.5">•</span>
            <span className="text-slate-600">
              Total do dia: <strong className="text-emerald-700 font-black">{formatMoney(totalAmountEstimated)}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsNovaDiariaOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Presenças</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
