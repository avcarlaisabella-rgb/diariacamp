'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { DailyRecord, Worker, WorkerAbsence, User } from '../../types';
import { formatMoney, DEFAULT_AVATAR } from '../../utils/formatters';
import { isWorkerLiberado } from '../../utils/workerStatus';
import { 
  Search, 
  Calendar, 
  Check, 
  X, 
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  ChevronUp,
  UserCheck, 
  AlertCircle,
  Save,
  CheckCircle2,
  FileText,
  Users,
  MapPin,
  Clock
} from 'lucide-react';

interface DiariasViewProps {
  mode?: 'all' | 'my-diarias' | 'approvals' | 'payments';
}

function getWeekInfo(offsetWeeks: number = 0) {
  const current = new Date();
  current.setDate(current.getDate() + (offsetWeeks * 7));
  const day = current.getDay();
  const diffToMonday = current.getDate() - day + (day === 0 ? -6 : 1);
  
  const monday = new Date(current);
  monday.setDate(diffToMonday);
  monday.setHours(0, 0, 0, 0);

  // Semana de trabalho: segunda a sexta (trabalho não é realizado no fim de semana)
  const days: { dateStr: string; dayLabel: string; dayMonth: string }[] = [];
  const dayLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];

  for (let i = 0; i < 5; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayMonth = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    days.push({
      dateStr,
      dayLabel: dayLabels[i],
      dayMonth
    });
  }

  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  return {
    start: days[0].dateStr,
    end: days[4].dateStr,
    formattedLabel: `${days[0].dayMonth} a ${days[4].dayMonth}/${friday.getFullYear()}`,
    days
  };
}

const COMMON_ABSENCE_REASONS = [
  'Consulta médica / Atestado',
  'Problema de transporte',
  'Motivo pessoal justificado',
  'Assunto familiar urgente',
  'Falta sem justificativa'
];

export const DiariasView: React.FC<DiariasViewProps> = ({ mode = 'all' }) => {
  const { 
    currentUser, 
    diarias, 
    workers,
    users,
    absences,
    markDailyAttendance,
    setWorkerAbsence,
  } = useApp();

  // Selected date for Daily Attendance (defaults to today)
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  
  // Week navigation offset for Weekly Report
  const [weekOffset, setWeekOffset] = useState<number>(0);
  
  // Global search input for filtering workers
  const [searchTerm, setSearchTerm] = useState('');

  // Coordinator Block filter for Gestor / Admin ('all' or coordinatorId)
  const [selectedCoordinatorFilter, setSelectedCoordinatorFilter] = useState<string>('all');

  // Daily attendance state for selected date: workerId -> { status: 'presente' | 'faltou' | 'pendente', reason: string }
  const [attendanceState, setAttendanceState] = useState<Record<string, { status: 'presente' | 'faltou' | 'pendente'; reason: string }>>({});

  // Quick feedback banner after saving
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // Modal to add/edit absence justification directly from weekly report
  const [absenceModalWorker, setAbsenceModalWorker] = useState<{ worker: Worker; date: string; existingReason?: string } | null>(null);
  const [modalReasonInput, setModalReasonInput] = useState('');

  // Collapsible Coordinator lists (so each coordinator list only appears when clicking the downward arrow)
  const [expandedCoordinators, setExpandedCoordinators] = useState<Record<string, boolean>>({});

  const toggleCoordinatorExpand = (coordinatorId: string) => {
    setExpandedCoordinators(prev => ({
      ...prev,
      [coordinatorId]: !prev[coordinatorId]
    }));
  };

  const expandAllCoordinators = () => {
    const all: Record<string, boolean> = {};
    displayedCoordinatorGroups.forEach(g => {
      all[g.coordinatorId] = true;
    });
    setExpandedCoordinators(all);
  };

  const collapseAllCoordinators = () => {
    setExpandedCoordinators({});
  };

  // Week range data
  const weekInfo = useMemo(() => getWeekInfo(weekOffset), [weekOffset]);

  // Is the current logged in user a coordinator?
  const isCoordinator = currentUser?.role === 'coordenador';

  // Eligible workers based on user permissions (só quem já foi liberado pode ter frequência lançada)
  const eligibleWorkers = useMemo(() => {
    return workers.filter(w => {
      if (w.status === 'Inativo') return false;
      if (!isWorkerLiberado(w)) return false;
      if (isCoordinator) {
        return w.coordinatorId === currentUser?.id;
      }
      return true;
    });
  }, [workers, currentUser, isCoordinator]);

  // Sync attendance state when selectedDate, eligibleWorkers, diarias, or absences change
  useEffect(() => {
    const map: Record<string, { status: 'presente' | 'faltou' | 'pendente'; reason: string }> = {};
    eligibleWorkers.forEach(w => {
      const hasDaily = diarias.some(
        d => d.workerId === w.id && d.date === selectedDate && d.status !== 'Cancelada' && d.status !== 'Rejeitada'
      );
      const absenceRec = absences.find(a => a.workerId === w.id && a.date === selectedDate);

      if (hasDaily) {
        map[w.id] = { status: 'presente', reason: '' };
      } else if (absenceRec) {
        map[w.id] = { status: 'faltou', reason: absenceRec.reason };
      } else {
        map[w.id] = { status: 'pendente', reason: '' };
      }
    });
    setAttendanceState(map);
  }, [selectedDate, eligibleWorkers, diarias, absences]);

  // Group workers into Coordinator Blocks
  const coordinatorGroups = useMemo(() => {
    const map = new Map<string, {
      coordinatorId: string;
      coordinatorName: string;
      teamZone: string;
      coordinatorUser?: User;
      workers: Worker[];
    }>();

    eligibleWorkers.forEach(w => {
      const cId = w.coordinatorId || 'sem_coordenador';
      const cName = w.coordinatorName || 'Equipe Geral';
      const zone = w.teamZone || 'Zona Central';

      if (!map.has(cId)) {
        const coordUser = users.find(u => u.id === cId);
        map.set(cId, {
          coordinatorId: cId,
          coordinatorName: cName,
          teamZone: zone,
          coordinatorUser: coordUser,
          workers: []
        });
      }
      map.get(cId)!.workers.push(w);
    });

    return Array.from(map.values()).map(g => {
      const total = g.workers.length;
      let present = 0;
      let absent = 0;
      let pending = 0;
      let estimatedAmount = 0;

      g.workers.forEach(w => {
        const entry = attendanceState[w.id];
        if (entry?.status === 'presente') {
          present++;
          estimatedAmount += (w.standardRate || 80);
        } else if (entry?.status === 'faltou') {
          absent++;
        } else {
          pending++;
        }
      });

      return {
        ...g,
        stats: {
          total,
          present,
          absent,
          pending,
          estimatedAmount,
          isFullyMarked: pending === 0
        }
      };
    });
  }, [eligibleWorkers, users, attendanceState]);

  // Filter groups if a coordinator is chosen in the filter
  const displayedCoordinatorGroups = useMemo(() => {
    if (isCoordinator) {
      return coordinatorGroups.filter(g => g.coordinatorId === currentUser?.id);
    }
    if (selectedCoordinatorFilter === 'all') {
      return coordinatorGroups;
    }
    return coordinatorGroups.filter(g => g.coordinatorId === selectedCoordinatorFilter);
  }, [coordinatorGroups, isCoordinator, currentUser, selectedCoordinatorFilter]);

  // Date Navigation Helpers
  const shiftDate = (days: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + days);
    setSelectedDate(dateObj.toISOString().split('T')[0]);
  };

  const setToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  // Formatted date string (e.g. "Sexta-feira, 04/09/2026")
  const formattedSelectedDate = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const weekday = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' });
    const formattedDate = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${formattedDate}`;
  }, [selectedDate]);

  // Bulk actions within a specific coordinator's team
  const setTeamAttendance = (teamWorkers: Worker[], status: 'presente' | 'faltou') => {
    setAttendanceState(prev => {
      const updated = { ...prev };
      teamWorkers.forEach(w => {
        updated[w.id] = {
          status,
          reason: status === 'faltou' ? (updated[w.id]?.reason || 'Falta sem justificativa') : ''
        };
      });
      return updated;
    });
  };

  // Individual toggle
  const setWorkerStatus = (workerId: string, status: 'presente' | 'faltou') => {
    setAttendanceState(prev => ({
      ...prev,
      [workerId]: {
        status,
        reason: status === 'faltou' ? (prev[workerId]?.reason || '') : ''
      }
    }));
  };

  const updateWorkerReason = (workerId: string, reason: string) => {
    setAttendanceState(prev => ({
      ...prev,
      [workerId]: {
        status: 'faltou',
        reason
      }
    }));
  };

  // Save attendance for a specific coordinator team or all
  const handleSaveTeamAttendance = (teamWorkers: Worker[], teamName: string) => {
    const records = teamWorkers.map(w => {
      const entry = attendanceState[w.id];
      const worked = entry?.status === 'presente';
      return {
        workerId: w.id,
        worked,
        absenceReason: !worked && entry?.status === 'faltou' ? (entry.reason || 'Falta sem justificativa') : undefined
      };
    });

    markDailyAttendance(selectedDate, records);
    setSaveFeedback(`Presenças da ${teamName} salvas com sucesso!`);
    setTimeout(() => setSaveFeedback(null), 4000);
  };

  const handleSaveAllAttendance = () => {
    const records = eligibleWorkers.map(w => {
      const entry = attendanceState[w.id];
      const worked = entry?.status === 'presente';
      return {
        workerId: w.id,
        worked,
        absenceReason: !worked && entry?.status === 'faltou' ? (entry.reason || 'Falta sem justificativa') : undefined
      };
    });

    markDailyAttendance(selectedDate, records);
    setSaveFeedback(`Presenças de todas as equipes salvas com sucesso para o dia ${selectedDate.split('-').reverse().join('/')}!`);
    setTimeout(() => setSaveFeedback(null), 4000);
  };

  // Stats for the selected day across all eligible workers
  const totalPresentToday = useMemo(() => {
    return eligibleWorkers.filter(w => attendanceState[w.id]?.status === 'presente').length;
  }, [eligibleWorkers, attendanceState]);

  const totalAbsentToday = useMemo(() => {
    return eligibleWorkers.filter(w => attendanceState[w.id]?.status === 'faltou').length;
  }, [eligibleWorkers, attendanceState]);

  // Save reason from the modal in weekly report
  const handleSaveModalAbsenceReason = () => {
    if (!absenceModalWorker) return;
    const { worker, date } = absenceModalWorker;
    if (!modalReasonInput.trim()) {
      setWorkerAbsence(worker.id, date, 'Falta sem justificativa');
    } else {
      setWorkerAbsence(worker.id, date, modalReasonInput.trim());
    }
    setAbsenceModalWorker(null);
    setModalReasonInput('');
  };

  return (
    <div className="space-y-6 max-w-full">
      
      {/* SECTION 1: DAR PRESENÇA DIÁRIA EM BLOCOS POR COORDENADOR */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Section Header with Date Navigation */}
        <div className="p-3 sm:p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {isCoordinator ? 'Presença Diária' : 'Presença por Coordenação'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isCoordinator 
                ? 'Registro de presença e faltas da equipe.' 
                : 'Gestão de presença por coordenador de equipe.'}
            </p>
          </div>

          {/* Date Selector Controls */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center bg-white border border-slate-300 rounded-xl px-2 py-1 shadow-xs">
              <button
                onClick={() => shiftDate(-1)}
                title="Dia anterior"
                className="p-1 text-slate-600 hover:text-slate-950 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-transparent px-2 py-0.5 border-none focus:outline-hidden cursor-pointer"
              />

              <button
                onClick={() => shiftDate(1)}
                title="Próximo dia"
                className="p-1 text-slate-600 hover:text-slate-950 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={setToday}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                selectedDate === new Date().toISOString().split('T')[0]
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Hoje
            </button>
          </div>
        </div>

        {/* Global Filter Bar for Gestor/Admin */}
        <div className="p-3 sm:px-4 bg-white border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 flex-wrap">
            <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold text-slate-900">{formattedSelectedDate}</span>
            <span className="text-slate-400 font-normal">
              ({totalPresentToday} presentes, {totalAbsentToday} faltas no total)
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Search */}
            <div className="relative flex-1 sm:w-44">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar trabalhador..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-hidden"
              />
            </div>

            {/* Coordinator Filter Tabs for Gestor */}
            {!isCoordinator && coordinatorGroups.length > 1 && (
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs">
                <button
                  onClick={() => setSelectedCoordinatorFilter('all')}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                    selectedCoordinatorFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Todos ({coordinatorGroups.length} Equipes)
                </button>
                {coordinatorGroups.map(g => (
                  <button
                    key={g.coordinatorId}
                    onClick={() => setSelectedCoordinatorFilter(g.coordinatorId)}
                    className={`px-2 py-1 rounded-md font-bold transition-all cursor-pointer truncate max-w-[130px] ${
                      selectedCoordinatorFilter === g.coordinatorId
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title={g.coordinatorName}
                  >
                    {g.coordinatorName.split(' ')[0]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Feedback Alert */}
        {saveFeedback && (
          <div className="m-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveFeedback}</span>
          </div>
        )}

        {/* Bar to expand/collapse all coordinators */}
        {displayedCoordinatorGroups.length > 1 && (
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span className="font-medium text-[11px]">
              {displayedCoordinatorGroups.length} equipes • Clique na setinha de cada coordenador para exibir ou recolher os integrantes
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={expandAllCoordinators}
                className="text-[11px] font-bold text-blue-700 hover:text-blue-800 hover:underline cursor-pointer"
              >
                Expandir todas
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={collapseAllCoordinators}
                className="text-[11px] font-bold text-slate-600 hover:text-slate-800 hover:underline cursor-pointer"
              >
                Recolher todas
              </button>
            </div>
          </div>
        )}

        {/* LIST OF COORDINATOR BLOCKS */}
        <div className="divide-y divide-slate-200">
          {displayedCoordinatorGroups.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Nenhuma equipe ou trabalhador encontrado.
            </div>
          ) : (
            displayedCoordinatorGroups.map(group => {
              const matchingWorkers = group.workers.filter(w => {
                if (!searchTerm.trim()) return true;
                const q = searchTerm.toLowerCase();
                return w.name.toLowerCase().includes(q) || w.role.toLowerCase().includes(q);
              });

              const isExpanded = !!expandedCoordinators[group.coordinatorId] || (searchTerm.trim().length > 0 && matchingWorkers.length > 0);

              return (
                <div key={group.coordinatorId} className={`p-3.5 sm:p-4 bg-white transition-all ${isExpanded ? 'space-y-3' : ''}`}>
                  
                  {/* COORDINATOR BLOCK HEADER */}
                  <div className={`p-3 border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors ${
                    isExpanded 
                      ? 'bg-slate-50 border-slate-300 shadow-2xs' 
                      : 'bg-slate-50/70 hover:bg-slate-100/80 border-slate-200'
                  }`}>
                    
                    {/* Coordinator info - clickable */}
                    <div 
                      onClick={() => toggleCoordinatorExpand(group.coordinatorId)}
                      className="flex items-center gap-2.5 min-w-0 cursor-pointer select-none group/coord"
                      title={isExpanded ? "Clique para recolher a equipe" : "Clique para ver os integrantes desta equipe"}
                    >
                      <div className="relative shrink-0">
                        <img
                          src={group.coordinatorUser?.avatar || DEFAULT_AVATAR}
                          alt={group.coordinatorName}
                          className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500/50 group-hover/coord:border-blue-500 transition-colors"
                        />
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                          C
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-slate-900 text-sm truncate group-hover/coord:text-blue-700 transition-colors">
                            Equipe: {group.coordinatorName}
                          </span>
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-md flex items-center gap-1 shrink-0">
                            <MapPin className="w-3 h-3 text-blue-600" />
                            {group.teamZone}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                          <span>Coordenador de Equipe</span>
                          <span>•</span>
                          <span>{group.stats.total} integrantes</span>
                          <span>•</span>
                          <span className="font-bold text-slate-700">
                            Estimativa: {formatMoney(group.stats.estimatedAmount)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Pill, Action Buttons & Expand Toggle Button (Setinha pra baixo) */}
                    <div className="flex items-center gap-2 flex-wrap self-start sm:self-center shrink-0">
                      {/* Coordinator Submission Status */}
                      {group.stats.isFullyMarked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-lg">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Preenchido ({group.stats.present} pres. / {group.stats.absent} faltas)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-800 text-[11px] font-bold rounded-lg">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>{group.stats.pending} pendente(s) pelo coordenador</span>
                        </span>
                      )}

                      {/* Quick block action */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTeamAttendance(group.workers, 'presente');
                        }}
                        className="px-2 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                        title="Marcar todos os integrantes desta equipe como presentes"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Equipe Toda Trabalhou</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveTeamAttendance(group.workers, `Equipe de ${group.coordinatorName}`);
                        }}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                        title="Salvar apenas as presenças desta equipe"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Salvar Bloco</span>
                      </button>

                      {/* Setinha pra baixo / cima */}
                      <button
                        type="button"
                        onClick={() => toggleCoordinatorExpand(group.coordinatorId)}
                        className={`px-2.5 py-1 rounded-lg border font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                          isExpanded 
                            ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-800' 
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                        title={isExpanded ? "Ocultar integrantes da equipe" : "Mostrar integrantes da equipe (clique para abrir)"}
                        aria-expanded={isExpanded}
                      >
                        <span className="text-[11px]">
                          {isExpanded ? 'Ocultar' : `Ver Equipe (${matchingWorkers.length})`}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 text-current" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-current" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* WORKERS LIST INSIDE THIS COORDINATOR BLOCK - ONLY SHOWN WHEN EXPANDED */}
                  {isExpanded && (
                    <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100 animate-in fade-in duration-150">
                    {matchingWorkers.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        Nenhum trabalhador desta equipe corresponde ao filtro.
                      </div>
                    ) : (
                      matchingWorkers.map(w => {
                        const currentStatus = attendanceState[w.id]?.status || 'pendente';
                        const currentReason = attendanceState[w.id]?.reason || '';

                        return (
                          <div 
                            key={w.id}
                            className={`p-3 transition-colors ${
                              currentStatus === 'presente'
                                ? 'bg-emerald-50/20'
                                : currentStatus === 'faltou'
                                ? 'bg-rose-50/20'
                                : 'hover:bg-slate-50/50'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                              {/* Worker Details */}
                              <div className="flex items-center gap-2.5 min-w-0">
                                <img
                                  src={w.avatar || DEFAULT_AVATAR}
                                  alt={w.name}
                                  className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                                />
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                                    {w.name}
                                  </div>
                                  <div className="text-[11px] text-slate-500 truncate flex items-center gap-2">
                                    <span>{w.role}</span>
                                    <span>•</span>
                                    <span className="font-semibold text-slate-700">Diária: {formatMoney(w.standardRate || 80)}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center gap-1.5 self-start sm:self-center shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setWorkerStatus(w.id, 'presente')}
                                  className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                    currentStatus === 'presente'
                                      ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-400'
                                      : 'bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700'
                                  }`}
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Trabalhou</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setWorkerStatus(w.id, 'faltou')}
                                  className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                    currentStatus === 'faltou'
                                      ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-400'
                                      : 'bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700'
                                  }`}
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Faltou</span>
                                </button>
                              </div>
                            </div>

                            {/* Inline reason when marked as 'Faltou' */}
                            {currentStatus === 'faltou' && (
                              <div className="mt-2 pt-2 border-t border-rose-100/80 space-y-1.5">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                  <label className="text-[11px] font-bold text-rose-800 shrink-0 flex items-center gap-1">
                                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                                    <span>Por que faltou?</span>
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="Adicione o motivo da falta..."
                                    value={currentReason}
                                    onChange={e => updateWorkerReason(w.id, e.target.value)}
                                    className="flex-1 px-3 py-1 bg-white border border-rose-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-rose-400"
                                  />
                                </div>

                                <div className="flex items-center gap-1 flex-wrap pl-0 sm:pl-24">
                                  <span className="text-[10px] text-slate-400">Sugestões:</span>
                                  {COMMON_ABSENCE_REASONS.map(reason => (
                                    <button
                                      key={reason}
                                      type="button"
                                      onClick={() => updateWorkerReason(w.id, reason)}
                                      className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors cursor-pointer ${
                                        currentReason === reason
                                          ? 'bg-rose-700 text-white font-bold'
                                          : 'bg-rose-50 hover:bg-rose-100 text-rose-800'
                                      }`}
                                    >
                                      {reason}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Global Footer with Primary Save Button */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-600">
            <span className="font-bold text-slate-900">{totalPresentToday} presentes</span> de {eligibleWorkers.length} trabalhadores no total.
            {totalAbsentToday > 0 && (
              <span className="text-rose-700 font-bold ml-2">({totalAbsentToday} faltas registradas)</span>
            )}
          </div>

          <button
            id="btn-salvar-presencas-global"
            onClick={handleSaveAllAttendance}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white text-xs sm:text-sm font-black rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4 text-emerald-400" />
            <span>Salvar Presenças de Todas as Equipes ({selectedDate.split('-').reverse().join('/')})</span>
          </button>
        </div>
      </section>

      {/* SECTION 2: RELATÓRIO SEMANAL ORGANIZADO EM BLOCOS POR COORDENADOR */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-0">
        
        {/* Header with Week Navigator */}
        <div className="p-3.5 sm:p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Relatório Semanal de Presenças & Faltas por Coordenador
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Consolidado semanal agrupado por equipe de coordenador, com dias trabalhados e motivos das faltas.
            </p>
          </div>

          {/* Week Selector */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center bg-white border border-slate-300 rounded-xl px-2 py-1 shadow-xs text-xs">
              <button
                onClick={() => setWeekOffset(prev => prev - 1)}
                title="Semana anterior"
                className="p-1 text-slate-600 hover:text-slate-950 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-black text-slate-900 px-3 min-w-[150px] text-center">
                Semana: {weekInfo.formattedLabel}
              </span>
              <button
                onClick={() => setWeekOffset(prev => prev + 1)}
                title="Próxima semana"
                className="p-1 text-slate-600 hover:text-slate-950 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {weekOffset !== 0 && (
              <button
                onClick={() => setWeekOffset(0)}
                className="px-2.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl cursor-pointer"
              >
                Semana Atual
              </button>
            )}
          </div>
        </div>

        {/* Legend strip */}
        <div className="px-4 py-2 bg-white border-b border-slate-100 flex items-center gap-4 text-[11px] text-slate-600 flex-wrap">
          <span className="font-bold text-slate-800">Legenda:</span>
          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
            <span className="w-3 h-3 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px]">✓</span>
            Trabalhou
          </span>
          <span className="inline-flex items-center gap-1 text-rose-700 font-semibold">
            <span className="w-3 h-3 rounded-full bg-rose-600 text-white flex items-center justify-center text-[9px]">✗</span>
            Faltou (com motivo)
          </span>
          <span className="inline-flex items-center gap-1 text-slate-400">
            <span className="w-3 h-3 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[9px]">-</span>
            Folga / Sem registro
          </span>
        </div>

        {/* WEEKLY REPORT IN COORDINATOR BLOCKS */}
        <div className="divide-y divide-slate-200">
          {displayedCoordinatorGroups.map(group => {
            const groupWeeklyData = group.workers.map(w => {
              const daysStatus = weekInfo.days.map(day => {
                const hasDaily = diarias.some(
                  d => d.workerId === w.id && d.date === day.dateStr && d.status !== 'Cancelada' && d.status !== 'Rejeitada'
                );
                const absence = absences.find(a => a.workerId === w.id && a.date === day.dateStr);

                return {
                  dateStr: day.dateStr,
                  dayLabel: day.dayLabel,
                  dayMonth: day.dayMonth,
                  worked: hasDaily,
                  absenceReason: absence ? absence.reason : null
                };
              });

              const workedDaysCount = daysStatus.filter(d => d.worked).length;
              const rate = w.standardRate || 80;
              const totalPayable = workedDaysCount * rate;
              const weekAbsences = daysStatus.filter(d => d.absenceReason !== null);

              return {
                worker: w,
                daysStatus,
                workedDaysCount,
                rate,
                totalPayable,
                weekAbsences
              };
            }).filter(item => {
              if (!searchTerm.trim()) return true;
              const q = searchTerm.toLowerCase();
              return item.worker.name.toLowerCase().includes(q) || item.worker.role.toLowerCase().includes(q);
            });

            const teamTotalPayable = groupWeeklyData.reduce((acc, curr) => acc + curr.totalPayable, 0);
            const teamTotalDays = groupWeeklyData.reduce((acc, curr) => acc + curr.workedDaysCount, 0);

            return (
              <div key={`week_${group.coordinatorId}`} className="p-3.5 sm:p-4 space-y-3">
                
                {/* Coordinator Weekly Block Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={group.coordinatorUser?.avatar || DEFAULT_AVATAR}
                      alt={group.coordinatorName}
                      className="w-8 h-8 rounded-full object-cover border border-slate-300"
                    />
                    <div>
                      <div className="font-bold text-slate-900 text-xs sm:text-sm">
                        Equipe: {group.coordinatorName} ({group.teamZone})
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {group.workers.length} integrantes sob gestão deste coordenador
                      </div>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <div className="font-black text-slate-900 text-xs sm:text-sm">
                      Total da Equipe: {formatMoney(teamTotalPayable)}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {teamTotalDays} diárias realizadas nesta semana
                    </div>
                  </div>
                </div>

                {/* Mobile view for this block */}
                <div className="divide-y divide-slate-100 sm:hidden">
                  {groupWeeklyData.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      Nenhum trabalhador nesta equipe para o filtro.
                    </div>
                  ) : (
                    groupWeeklyData.map(({ worker, daysStatus, workedDaysCount, rate, totalPayable, weekAbsences }) => (
                      <div key={worker.id} className="p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <img
                              src={worker.avatar || DEFAULT_AVATAR}
                              alt={worker.name}
                              className="w-7 h-7 rounded-full object-cover border border-slate-200"
                            />
                            <div>
                              <div className="font-bold text-slate-900 text-xs">{worker.name}</div>
                              <div className="text-[10px] text-slate-500">{worker.role}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-black text-slate-900 text-xs">{formatMoney(totalPayable)}</div>
                            <div className="text-[10px] text-slate-400">{workedDaysCount} dias × {formatMoney(rate)}</div>
                          </div>
                        </div>

                        {/* Days pills (Seg-Sex) */}
                        <div className="grid grid-cols-5 gap-1 text-center text-[10px]">
                          {daysStatus.map(d => (
                            <div
                              key={d.dateStr}
                              className={`p-1 rounded-md border ${
                                d.worked
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold'
                                  : d.absenceReason
                                  ? 'bg-rose-50 border-rose-200 text-rose-800 font-bold'
                                  : 'bg-slate-50 border-slate-200 text-slate-400'
                              }`}
                            >
                              <span className="block text-[8px]">{d.dayLabel}</span>
                              <span>{d.worked ? '✓' : d.absenceReason ? '✗' : '-'}</span>
                            </div>
                          ))}
                        </div>

                        {/* Absences */}
                        {weekAbsences.length > 0 && (
                          <div className="space-y-1">
                            {weekAbsences.map(a => (
                              <div key={a.dateStr} className="flex items-center justify-between text-[11px] bg-rose-50 border border-rose-200 text-rose-900 p-1.5 rounded-lg">
                                <span className="truncate">
                                  <strong>{a.dayLabel}:</strong> {a.absenceReason}
                                </span>
                                <button
                                  onClick={() => {
                                    setAbsenceModalWorker({ worker, date: a.dateStr, existingReason: a.absenceReason || '' });
                                    setModalReasonInput(a.absenceReason || '');
                                  }}
                                  className="text-[10px] font-bold text-blue-700 underline shrink-0 cursor-pointer ml-1"
                                >
                                  Editar
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Desktop Table for this block - STRICT 100% WIDTH - ZERO OVERFLOW */}
                <div className="hidden sm:block overflow-hidden border border-slate-100 rounded-xl">
                  <table className="w-full text-left text-xs table-fixed">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="w-[24%] px-4 py-2.5">Trabalhador</th>
                        <th className="w-[28%] px-3 py-2.5 text-center">Dias da Semana</th>
                        <th className="w-[12%] px-3 py-2.5 text-center">Dias Trab.</th>
                        <th className="w-[14%] px-3 py-2.5 text-right">Total Semana</th>
                        <th className="w-[22%] px-4 py-2.5">Faltas & Motivo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {groupWeeklyData.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                            Nenhum trabalhador encontrado.
                          </td>
                        </tr>
                      ) : (
                        groupWeeklyData.map(({ worker, daysStatus, workedDaysCount, rate, totalPayable, weekAbsences }) => (
                          <tr key={worker.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-2 min-w-0">
                                <img
                                  src={worker.avatar || DEFAULT_AVATAR}
                                  alt={worker.name}
                                  className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                                />
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 truncate">{worker.name}</div>
                                  <div className="text-[10px] text-slate-500 truncate">{worker.role}</div>
                                </div>
                              </div>
                            </td>

                            <td className="px-3 py-2.5 text-center">
                              <div className="grid grid-cols-5 gap-1 max-w-[150px] mx-auto">
                                {daysStatus.map(d => (
                                  <div
                                    key={d.dateStr}
                                    title={
                                      d.worked 
                                        ? `${d.dayLabel} (${d.dayMonth}): Trabalhou (R$ ${rate.toFixed(2)})` 
                                        : d.absenceReason 
                                        ? `${d.dayLabel} (${d.dayMonth}): Faltou — ${d.absenceReason}` 
                                        : `${d.dayLabel} (${d.dayMonth}): Folga`
                                    }
                                    className={`py-0.5 rounded-md text-[9px] flex flex-col items-center justify-center border transition-all ${
                                      d.worked
                                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                                        : d.absenceReason
                                        ? 'bg-rose-50 border-rose-300 text-rose-800 font-bold'
                                        : 'bg-slate-50 border-slate-200 text-slate-400'
                                    }`}
                                  >
                                    <span className="text-[8px] text-slate-400 leading-none">{d.dayLabel}</span>
                                    <span className="leading-tight">{d.worked ? '✓' : d.absenceReason ? '✗' : '-'}</span>
                                  </div>
                                ))}
                              </div>
                            </td>

                            <td className="px-3 py-2.5 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-bold ${
                                workedDaysCount > 0 ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-400'
                              }`}>
                                {workedDaysCount} d
                              </span>
                            </td>

                            <td className="px-3 py-2.5 text-right">
                              <div className="font-black text-slate-900 text-xs">{formatMoney(totalPayable)}</div>
                              <div className="text-[9px] text-slate-400 font-mono">{workedDaysCount} × {formatMoney(rate)}</div>
                            </td>

                            <td className="px-4 py-2.5">
                              {weekAbsences.length === 0 ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                                  <Check className="w-3 h-3" />
                                  100% Presença
                                </span>
                              ) : (
                                <div className="space-y-1">
                                  {weekAbsences.map(a => (
                                    <div 
                                      key={a.dateStr} 
                                      className="p-1 bg-rose-50 border border-rose-200 rounded-md flex items-center justify-between gap-1 text-[10px] text-rose-900"
                                    >
                                      <span className="truncate">
                                        <strong>{a.dayLabel}:</strong> {a.absenceReason}
                                      </span>
                                      <button
                                        onClick={() => {
                                          setAbsenceModalWorker({ worker, date: a.dateStr, existingReason: a.absenceReason || '' });
                                          setModalReasonInput(a.absenceReason || '');
                                        }}
                                        title="Editar motivo da falta"
                                        className="text-[9px] font-bold text-blue-700 hover:text-blue-900 underline shrink-0 cursor-pointer ml-1"
                                      >
                                        Editar
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

              </div>
            );
          })}
        </div>
      </section>

      {/* MODAL: ADICIONAR / EDITAR MOTIVO DA FALTA */}
      {absenceModalWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <h3 className="font-bold text-slate-900 text-sm">Adicionar Motivo da Falta</h3>
              </div>
              <button 
                onClick={() => setAbsenceModalWorker(null)} 
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-2 text-slate-600">
              <p>
                <strong>Trabalhador:</strong> {absenceModalWorker.worker.name} ({absenceModalWorker.worker.role})
              </p>
              <p>
                <strong>Data da Falta:</strong> {absenceModalWorker.date.split('-').reverse().join('/')}
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Por que faltou?
                </label>
                <input
                  type="text"
                  placeholder="Informe a justificativa ou motivo..."
                  value={modalReasonInput}
                  onChange={e => setModalReasonInput(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Suggestions */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 block font-medium">Motivos frequentes:</span>
                <div className="flex flex-wrap gap-1">
                  {COMMON_ABSENCE_REASONS.map(reason => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setModalReasonInput(reason)}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] rounded-md cursor-pointer transition-colors"
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setAbsenceModalWorker(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveModalAbsenceReason}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs"
              >
                Salvar Motivo da Falta
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
