'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Worker, WorkerRole } from '../../types';
import { formatDate, maskCpf, maskPhone, maskPixKey } from '../../utils/formatters';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Search, 
  Filter, 
  CheckCheck, 
  MapPin, 
  Users, 
  CheckSquare, 
  Square,
  ShieldAlert,
  ShieldCheck,
  X,
  MessageSquare,
  FileCheck2,
  Eye,
  UserCheck,
  CreditCard,
  Vote,
  Phone
} from 'lucide-react';

export const AprovacoesView: React.FC = () => {
  const { 
    currentUser, 
    workers, 
    users,
    liberarWorker,
    rejeitarWorker,
    liberarWorkersBatch
  } = useApp();

  // Active Tab Filter
  const [tabFilter, setTabFilter] = useState<'pendentes' | 'liberados' | 'rejeitados' | 'todos'>('pendentes');
  
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [coordinatorFilter, setCoordinatorFilter] = useState('Todos');
  const [roleFilter, setRoleFilter] = useState('Todos');

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Rejection Modal
  const [rejectingWorker, setRejectingWorker] = useState<Worker | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState('');

  // Details Modal
  const [viewingWorker, setViewingWorker] = useState<Worker | null>(null);

  // Coordinators list for filtering
  const coordinators = useMemo(() => {
    return users.filter(u => u.role === 'coordenador' && u.active);
  }, [users]);

  // Roles list
  const availableRoles = useMemo(() => {
    return Array.from(new Set(workers.map(w => w.role))).filter(Boolean);
  }, [workers]);

  // Base list depending on user hierarchy
  const userWorkers = useMemo(() => {
    return workers.filter(w => {
      if (currentUser?.role === 'gestor') {
        if (w.managerId && w.managerId !== currentUser.id) return false;
      }
      return true;
    });
  }, [workers, currentUser]);

  // Filtered workers
  const filteredWorkers = useMemo(() => {
    return userWorkers.filter(w => {
      const isPendente = w.approvalStatus === 'Pendente' || w.status === 'Aguardando Liberação' || (w.status as string) === 'Pendente';
      const isLiberado = w.approvalStatus === 'Liberado' || (!w.approvalStatus && (w.status === 'Ativo' || w.status === 'Em campo' || w.status === 'Faltou'));
      const isRejeitado = w.approvalStatus === 'Rejeitado';

      // Tab filter
      if (tabFilter === 'pendentes' && !isPendente) return false;
      if (tabFilter === 'liberados' && !isLiberado) return false;
      if (tabFilter === 'rejeitados' && !isRejeitado) return false;

      // Coordinator filter
      if (coordinatorFilter !== 'Todos' && w.coordinatorId !== coordinatorFilter) return false;

      // Role filter
      if (roleFilter !== 'Todos' && w.role !== roleFilter) return false;

      // Search term (name, cpf, coordinator, city)
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const mName = w.name.toLowerCase().includes(q);
        const mCpf = w.cpf.toLowerCase().includes(q);
        const mCoord = w.coordinatorName.toLowerCase().includes(q);
        const mCity = w.city.toLowerCase().includes(q);
        if (!mName && !mCpf && !mCoord && !mCity) return false;
      }

      return true;
    });
  }, [userWorkers, tabFilter, coordinatorFilter, roleFilter, searchTerm]);

  // Pending count for badge
  const pendingCount = useMemo(() => {
    return userWorkers.filter(w => 
      w.approvalStatus === 'Pendente' || w.status === 'Aguardando Liberação' || (w.status as string) === 'Pendente'
    ).length;
  }, [userWorkers]);

  const liberadosCount = useMemo(() => {
    return userWorkers.filter(w => 
      w.approvalStatus === 'Liberado' || (!w.approvalStatus && (w.status === 'Ativo' || w.status === 'Em campo' || w.status === 'Faltou'))
    ).length;
  }, [userWorkers]);

  const rejeitadosCount = useMemo(() => {
    return userWorkers.filter(w => w.approvalStatus === 'Rejeitado').length;
  }, [userWorkers]);

  // Bulk Selection Handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredWorkers.length && filteredWorkers.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredWorkers.map(w => w.id));
    }
  };

  // Bulk Approval
  const handleApproveSelected = () => {
    if (selectedIds.length === 0) return;
    liberarWorkersBatch(selectedIds);
    setSelectedIds([]);
  };

  // Rejection confirmation
  const handleConfirmRejection = () => {
    if (!rejectionReason.trim()) {
      setRejectionError('Por favor, informe a justificativa para não liberar o trabalhador.');
      return;
    }
    if (rejectingWorker) {
      rejeitarWorker(rejectingWorker.id, rejectionReason.trim());
      setRejectingWorker(null);
      setRejectionReason('');
      setRejectionError('');
      setSelectedIds(prev => prev.filter(id => id !== rejectingWorker.id));
    }
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <UserCheck className="w-5 h-5" />
            </span>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              Liberação de Trabalhadores
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Validação cadastral para início de atividades.
          </p>
        </div>

        {/* Global Pending Metric */}
        <div className="flex items-center gap-3">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center gap-3 shrink-0">
            <Clock className="w-5 h-5 text-amber-600" />
            <div>
              <div className="text-[10px] font-bold uppercase text-amber-700">Aguardando Liberação</div>
              <div className="text-lg font-black text-amber-900 leading-none mt-0.5">
                {pendingCount} {pendingCount === 1 ? 'trabalhador' : 'trabalhadores'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 overflow-x-hidden flex-wrap">
        <button
          type="button"
          onClick={() => { setTabFilter('pendentes'); setSelectedIds([]); }}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            tabFilter === 'pendentes'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Aguardando Liberação</span>
          {pendingCount > 0 && (
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
              tabFilter === 'pendentes' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-800'
            }`}>
              {pendingCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => { setTabFilter('liberados'); setSelectedIds([]); }}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            tabFilter === 'liberados'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Liberados para Trabalhar</span>
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
            tabFilter === 'liberados' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700'
          }`}>
            {liberadosCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { setTabFilter('rejeitados'); setSelectedIds([]); }}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            tabFilter === 'rejeitados'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <XCircle className="w-4 h-4" />
          <span>Não Liberados</span>
          {rejeitadosCount > 0 && (
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
              tabFilter === 'rejeitados' ? 'bg-rose-700 text-white' : 'bg-rose-100 text-rose-800'
            }`}>
              {rejeitadosCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => { setTabFilter('todos'); setSelectedIds([]); }}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            tabFilter === 'todos'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Todos ({userWorkers.length})</span>
        </button>
      </div>

      {/* Filters & Actions Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, CPF ou cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
          />
        </div>

        {/* Filters and Batch Actions */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end flex-wrap">
          {/* Coordinator Filter */}
          <select
            value={coordinatorFilter}
            onChange={(e) => setCoordinatorFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="Todos">Todos os Coordenadores</option>
            {coordinators.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="Todos">Todas as Funções</option>
            {availableRoles.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          {/* Bulk Action Button */}
          {tabFilter === 'pendentes' && selectedIds.length > 0 && (
            <button
              type="button"
              onClick={handleApproveSelected}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer shrink-0"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Liberar Selecionados ({selectedIds.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {filteredWorkers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Nenhum trabalhador pendente nesta categoria</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {tabFilter === 'pendentes' 
              ? 'Todos os trabalhadores cadastrados já foram liberados ou avaliados para o início das atividades!'
              : 'Nenhum registro encontrado para os filtros selecionados.'}
          </p>
        </div>
      ) : (
        <>
        {/* MOBILE CARDS */}
        <div className="sm:hidden space-y-3">
          {filteredWorkers.map((w) => {
            const isSelected = selectedIds.includes(w.id);
            const isPendente = w.approvalStatus === 'Pendente' || w.status === 'Aguardando Liberação' || (w.status as string) === 'Pendente';
            const isLiberado = w.approvalStatus === 'Liberado' || (!w.approvalStatus && (w.status === 'Ativo' || w.status === 'Em campo' || w.status === 'Faltou'));
            const isRejeitado = w.approvalStatus === 'Rejeitado';

            return (
              <div
                key={w.id}
                className={`p-3.5 rounded-2xl border space-y-2.5 ${isSelected ? 'bg-emerald-50/40 border-emerald-200' : 'bg-white border-slate-200'}`}
              >
                <div className="flex items-start gap-2.5">
                  {tabFilter === 'pendentes' && (
                    <button
                      type="button"
                      onClick={() => handleToggleSelect(w.id)}
                      className="cursor-pointer shrink-0 mt-1"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300" />
                      )}
                    </button>
                  )}

                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs border border-slate-200 shrink-0 overflow-hidden">
                    {w.avatar ? (
                      <img src={w.avatar} alt={w.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{w.name.charAt(0)}</span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-slate-900 truncate text-xs">{w.name}</div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      CPF: {w.cpf ? maskCpf(w.cpf) : 'Não inf.'}{w.phone && ` • ${maskPhone(w.phone)}`}
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isPendente && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-bold whitespace-nowrap">
                        <Clock className="w-3 h-3" />
                        <span>Pendente</span>
                      </span>
                    )}
                    {isLiberado && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold whitespace-nowrap">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Liberado</span>
                      </span>
                    )}
                    {isRejeitado && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[9px] font-bold whitespace-nowrap">
                        <XCircle className="w-3 h-3" />
                        <span>Não Lib.</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 border-t border-slate-100 pt-2">
                  <span className="font-bold text-emerald-800">{w.role}</span>
                  <span className="text-slate-400"> • Coord: {w.coordinatorName} ({w.teamZone || 'Geral'})</span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {w.voterRegistration ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-semibold border border-blue-100">
                      <Vote className="w-3 h-3" />
                      <span>Título OK</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-medium">
                      Sem título
                    </span>
                  )}
                  {w.pixKey ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-100">
                      <CreditCard className="w-3 h-3" />
                      <span>PIX OK</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-medium">
                      Sem PIX
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setViewingWorker(w)}
                    className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-slate-200 shrink-0"
                    title="Visualizar ficha completa"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {isPendente ? (
                    <>
                      <button
                        type="button"
                        onClick={() => { setRejectingWorker(w); setRejectionReason(''); setRejectionError(''); }}
                        className="flex-1 px-2.5 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg font-bold text-xs transition-colors cursor-pointer"
                      >
                        Não Liberar
                      </button>
                      <button
                        type="button"
                        onClick={() => liberarWorker(w.id)}
                        className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white rounded-lg font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Liberar</span>
                      </button>
                    </>
                  ) : isLiberado ? (
                    <span className="flex-1 text-center text-[11px] text-emerald-700 font-semibold italic">
                      Apto para trabalhar
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => liberarWorker(w.id, 'Reconsiderado e liberado para trabalhar.')}
                      className="flex-1 px-2.5 py-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-slate-200"
                    >
                      Reconsiderar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* DESKTOP TABLE */}
        <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 shadow-xs">
          <table className="w-full text-left text-xs table-fixed">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                {tabFilter === 'pendentes' && (
                  <th className="w-10 px-2 py-3.5 text-center">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="cursor-pointer inline-flex items-center justify-center"
                      title="Selecionar todos"
                    >
                      {selectedIds.length === filteredWorkers.length && filteredWorkers.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </th>
                )}
                <th className={`${tabFilter === 'pendentes' ? 'w-[28%]' : 'w-[30%]'} px-3 py-3.5`}>Trabalhador & Contato</th>
                <th className="w-[18%] px-3 py-3.5">Função & Coordenador</th>
                <th className="w-[18%] px-3 py-3.5">Documentos & Dados</th>
                <th className="w-[14%] px-3 py-3.5 text-center">Status Liberação</th>
                <th className="w-[20%] px-3 py-3.5 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredWorkers.map((w) => {
                const isSelected = selectedIds.includes(w.id);
                const isPendente = w.approvalStatus === 'Pendente' || w.status === 'Aguardando Liberação' || (w.status as string) === 'Pendente';
                const isLiberado = w.approvalStatus === 'Liberado' || (!w.approvalStatus && (w.status === 'Ativo' || w.status === 'Em campo' || w.status === 'Faltou'));
                const isRejeitado = w.approvalStatus === 'Rejeitado';

                return (
                  <tr 
                    key={w.id}
                    className={`transition-colors ${isSelected ? 'bg-emerald-50/40' : 'hover:bg-slate-50/80'}`}
                  >
                    {/* Checkbox */}
                    {tabFilter === 'pendentes' && (
                      <td className="w-10 px-2 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSelect(w.id)}
                          className="cursor-pointer inline-flex items-center justify-center"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 hover:text-slate-400" />
                          )}
                        </button>
                      </td>
                    )}

                    {/* Worker Info */}
                    <td className="px-3 py-3.5 truncate">
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs border border-slate-200 shrink-0 overflow-hidden">
                          {w.avatar ? (
                            <img src={w.avatar} alt={w.name} className="w-full h-full object-cover" />
                          ) : (
                            <span>{w.name.charAt(0)}</span>
                          )}
                        </div>
                        <div className="truncate min-w-0">
                          <div className="font-bold text-slate-900 truncate text-xs">{w.name}</div>
                          <div className="text-[11px] text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                            <span>CPF: {w.cpf ? maskCpf(w.cpf) : 'Não inf.'}</span>
                            {w.phone && (
                              <>
                                <span>•</span>
                                <span>{maskPhone(w.phone)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role & Coordinator */}
                    <td className="px-3 py-3.5 truncate text-slate-600">
                      <div className="font-bold text-emerald-800 truncate text-xs">{w.role}</div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">
                        Coord: {w.coordinatorName} ({w.teamZone || 'Geral'})
                      </div>
                    </td>

                    {/* Documents & Badges */}
                    <td className="px-3 py-3.5 truncate">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {w.voterRegistration ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-semibold border border-blue-100" title={`Título: ${w.voterRegistration}`}>
                            <Vote className="w-3 h-3" />
                            <span>Título OK</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-medium">
                            Sem título
                          </span>
                        )}

                        {w.pixKey ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-100" title={`PIX: ${w.pixKey}`}>
                            <CreditCard className="w-3 h-3" />
                            <span>PIX OK</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-medium">
                            Sem PIX
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3.5 text-center">
                      {isPendente && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                          <Clock className="w-3 h-3" />
                          <span>Pendente</span>
                        </span>
                      )}
                      {isLiberado && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Liberado</span>
                        </span>
                      )}
                      {isRejeitado && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold" title={w.rejectionReason}>
                          <XCircle className="w-3 h-3" />
                          <span>Não Liberado</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setViewingWorker(w)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Visualizar ficha completa"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {isPendente ? (
                          <>
                            <button
                              type="button"
                              onClick={() => { setRejectingWorker(w); setRejectionReason(''); setRejectionError(''); }}
                              className="px-2.5 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 rounded-lg font-bold text-xs transition-colors cursor-pointer shrink-0"
                            >
                              Não Liberar
                            </button>
                            <button
                              type="button"
                              onClick={() => liberarWorker(w.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white rounded-lg font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1 shrink-0"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Liberar</span>
                            </button>
                          </>
                        ) : isLiberado ? (
                          <span className="text-[11px] text-emerald-700 font-semibold italic">
                            Apto para trabalhar
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => liberarWorker(w.id, 'Reconsiderado e liberado para trabalhar.')}
                            className="px-2.5 py-1 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-slate-200"
                          >
                            Reconsiderar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </>
      )}

      {/* Modal Rejection Justification */}
      {rejectingWorker && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertCircle className="w-5 h-5" />
                <h3 className="font-bold text-slate-900 text-base">Não Liberar Trabalhador</h3>
              </div>
              <button
                type="button"
                onClick={() => setRejectingWorker(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600">
              Você está definindo que o candidato <strong>{rejectingWorker.name}</strong> não está apto para começar as atividades. Informe a justificativa abaixo:
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Motivo da Recusa / Não Liberação *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => { setRejectionReason(e.target.value); setRejectionError(''); }}
                placeholder="Ex: Documentação de título irregular, duplicidade cadastral, fora da área de atuação..."
                rows={3}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white resize-none"
              />
              {rejectionError && (
                <p className="text-[11px] text-rose-600 font-semibold mt-1">{rejectionError}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectingWorker(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmRejection}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Confirmar Não Liberação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Viewing Worker Details */}
      {viewingWorker && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Ficha Cadastral do Trabalhador</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingWorker(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Basic Info */}
            <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm overflow-hidden shrink-0">
                {viewingWorker.avatar ? (
                  <img src={viewingWorker.avatar} alt={viewingWorker.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{viewingWorker.name.charAt(0)}</span>
                )}
              </div>
              <div className="truncate">
                <h4 className="font-black text-slate-900 text-sm">{viewingWorker.name}</h4>
                <div className="text-xs text-emerald-700 font-bold">{viewingWorker.role} • R$ {viewingWorker.standardRate.toFixed(2)}/dia</div>
                <div className="text-[11px] text-slate-500">Indicado por: {viewingWorker.coordinatorName}</div>
              </div>
            </div>

            {/* Document Details */}
            <div className="space-y-3 text-xs">
              <div className="bg-white border border-slate-200 p-3 rounded-xl space-y-1.5">
                <div className="font-bold text-slate-800 text-xs border-b border-slate-100 pb-1">Dados Pessoais & Localização</div>
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div><span className="font-semibold text-slate-700">CPF:</span> {maskCpf(viewingWorker.cpf)}</div>
                  <div><span className="font-semibold text-slate-700">Telefone:</span> {maskPhone(viewingWorker.phone)}</div>
                  <div><span className="font-semibold text-slate-700">Cidade/UF:</span> {viewingWorker.city} - {viewingWorker.state}</div>
                  <div><span className="font-semibold text-slate-700">Região:</span> {viewingWorker.teamZone}</div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-3 rounded-xl space-y-1.5">
                <div className="font-bold text-slate-800 text-xs border-b border-slate-100 pb-1">Dados Eleitorais</div>
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div><span className="font-semibold text-slate-700">Título de Eleitor:</span> {viewingWorker.voterRegistration || 'Não informado'}</div>
                  <div><span className="font-semibold text-slate-700">Zona / Seção:</span> {viewingWorker.voterZone || '-'} / {viewingWorker.voterSection || '-'}</div>
                  <div><span className="font-semibold text-slate-700">Município Eleitoral:</span> {viewingWorker.voterCity || viewingWorker.city}</div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-3 rounded-xl space-y-1.5">
                <div className="font-bold text-slate-800 text-xs border-b border-slate-100 pb-1">Dados Bancários / Pagamento</div>
                <div className="space-y-1 text-slate-600">
                  <div><span className="font-semibold text-slate-700">Forma Preferencial:</span> {viewingWorker.preferredPaymentMethod}</div>
                  {viewingWorker.pixKey && (
                    <div><span className="font-semibold text-slate-700">Chave PIX:</span> {viewingWorker.pixKey} ({viewingWorker.pixType || 'PIX'})</div>
                  )}
                  {viewingWorker.bankName && (
                    <div><span className="font-semibold text-slate-700">Banco:</span> {viewingWorker.bankName} - Ag: {viewingWorker.bankAgency} Conta: {viewingWorker.bankAccount}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions inside modal */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewingWorker(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Fechar
              </button>

              {viewingWorker.approvalStatus === 'Pendente' || viewingWorker.status === 'Aguardando Liberação' ? (
                <button
                  type="button"
                  onClick={() => {
                    liberarWorker(viewingWorker.id);
                    setViewingWorker(null);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Liberar para Trabalhar</span>
                </button>
              ) : (
                <span className="text-xs font-bold text-emerald-700">Status: {viewingWorker.approvalStatus || viewingWorker.status}</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
