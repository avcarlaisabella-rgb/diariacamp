'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatMoney, formatDate } from '../../utils/formatters';
import { SetorPagamentoSemanal } from '../pagamentos/SetorPagamentoSemanal';
import { DashboardDateFilter } from './DashboardDateFilter';
import { 
  Users, 
  UserCheck, 
  Hourglass, 
  CheckCircle, 
  DollarSign, 
  ArrowUpRight,
  ShieldCheck,
  Check,
  X,
  MapPin,
  Calendar
} from 'lucide-react';

export const GestorDashboard: React.FC = () => {
  const { 
    currentUser, 
    workers, 
    diarias, 
    users, 
    liberarWorker, 
    rejeitarWorker, 
    setCurrentTab 
  } = useApp();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const hasDateFilter = Boolean(startDate || endDate);

  // Coordinators linked to this gestor
  const coordenadoresVinculados = users.filter(u => u.role === 'coordenador');
  const coordIds = coordenadoresVinculados.map(c => c.id);

  // Workers linked to those coordinators
  const trabalhadoresVinculados = workers.filter(w => coordIds.includes(w.coordinatorId));
  const workerIds = trabalhadoresVinculados.map(w => w.id);

  // Daily records of this manager's team
  const equipeDiariasBase = useMemo(() => {
    return diarias.filter(d => 
      coordIds.includes(d.coordinatorId) || workerIds.includes(d.workerId)
    );
  }, [diarias, coordIds, workerIds]);

  // Filtered by period
  const equipeDiarias = useMemo(() => {
    return equipeDiariasBase.filter(d => {
      if (startDate && d.date < startDate) return false;
      if (endDate && d.date > endDate) return false;
      return true;
    });
  }, [equipeDiariasBase, startDate, endDate]);

  // Workers awaiting liberation list
  const trabalhadoresPendentesLista = trabalhadoresVinculados.filter(w => 
    w.approvalStatus === 'Pendente' || w.status === 'Aguardando Liberação' || (w.status as string) === 'Pendente'
  );

  // Metrics:
  const totalTrabalhadores = trabalhadoresVinculados.length;
  const trabalhadoresAtivosPeriodo = useMemo(() => {
    return new Set(equipeDiarias.map(d => d.workerId)).size;
  }, [equipeDiarias]);

  const totalCoordenadores = coordenadoresVinculados.length;
  const trabalhadoresAguardandoLiberacao = trabalhadoresPendentesLista.length;
  const totalAprovadas = equipeDiarias.filter(d => d.status === 'Aprovada' || d.status === 'Paga').length;
  const valorTotalEquipe = equipeDiarias.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
            Gestão Regional
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Controle de coordenadores, liberação e diárias da regional.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentTab('aprovacoes')}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Fila de Liberação ({trabalhadoresAguardandoLiberacao})</span>
          </button>
        </div>
      </div>

      {/* Date Period Filter Bar */}
      <DashboardDateFilter
        startDate={startDate}
        endDate={endDate}
        onDateChange={(start, end) => {
          setStartDate(start);
          setEndDate(end);
        }}
        filteredCount={equipeDiarias.length}
        totalCount={equipeDiariasBase.length}
      />

      {/* 5 Required Gestor Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        
        {/* Card 1: Trabalhadores vinculados */}
        <div 
          onClick={() => setCurrentTab('trabalhadores')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Trabalhadores
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {totalTrabalhadores}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            Equipe vinculada
          </div>
        </div>

        {/* Card 2: Coordenadores vinculados */}
        <div 
          onClick={() => setCurrentTab('trabalhadores')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Coordenadores
            </span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-105 transition-transform">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {totalCoordenadores}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            Líderes de ponto
          </div>
        </div>

        {/* Card 3: Trabalhadores aguardando liberação */}
        <div 
          onClick={() => setCurrentTab('aprovacoes')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Liberação
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-105 transition-transform">
              <Hourglass className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600">
            {trabalhadoresAguardandoLiberacao}
          </div>
          <div className="text-[11px] text-amber-700/80 mt-1 font-medium">
            Aguardando para trabalhar
          </div>
        </div>

        {/* Card 4: Diárias aprovadas */}
        <div 
          onClick={() => setCurrentTab('diarias')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Aprovadas
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-105 transition-transform">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600">
            {totalAprovadas}
          </div>
          <div className="text-[11px] text-emerald-700/80 mt-1 font-medium">
            Validadas / Pagas
          </div>
        </div>

        {/* Card 5: Valor total da sua equipe */}
        <div className="col-span-2 lg:col-span-1 bg-slate-900 text-white p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total Equipe
            </span>
            <div className="p-2 bg-slate-800 text-emerald-400 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400">
            {formatMoney(valorTotalEquipe)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">
            Volume de diárias
          </div>
        </div>

      </div>

      {/* Setor de Pagamento de Cada Trabalhador conforme o Relatório Semanal */}
      <SetorPagamentoSemanal 
        allowedCoordinatorIds={coordIds}
        isGestorProfile={true}
        title="Setor de Pagamento Semanal da Regional"
        subtitle="Consolidado semanal da equipe: presenças, cálculo de diárias (dias × diária), dados bancários/PIX e status financeiro."
      />

      {/* Grid: Diárias Aguardando Aprovação + Coordenadores vinculados */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Section: Diárias Aguardando Aprovação */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Hourglass className="w-4 h-4 text-amber-500" />
                <span>Trabalhadores Aguardando Liberação</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Libere os trabalhadores cadastrados para que possam iniciar as atividades e receber diárias</p>
            </div>
            <button
              onClick={() => setCurrentTab('aprovacoes')}
              className="text-xs text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
            >
              Ver todos ({trabalhadoresAguardandoLiberacao})
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {trabalhadoresPendentesLista.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Excelente! Nenhum trabalhador com liberação pendente no momento.
              </div>
            ) : (
              trabalhadoresPendentesLista.slice(0, 5).map((worker) => (
                <div key={worker.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={worker.avatar}
                      alt={worker.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{worker.name}</span>
                        <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md font-semibold border border-amber-200">
                          {worker.role}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex flex-wrap gap-x-3">
                        <span>Coord: <strong>{worker.coordinatorName}</strong></span>
                        <span>Zona: {worker.teamZone}</span>
                        <span>Diária: {formatMoney(worker.standardRate)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <button
                      onClick={() => rejeitarWorker(worker.id, 'Cadastro incompleto ou não autorizado')}
                      title="Recusar liberação"
                      className="px-3 py-1.5 border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-rose-600 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Recusar</span>
                    </button>
                    <button
                      onClick={() => liberarWorker(worker.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Liberar Trabalhador</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Section: Coordenadores Vinculados */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-purple-600" />
              <span>Coordenadores da Regional</span>
            </h2>
            <span className="text-xs text-slate-400 font-semibold">{coordenadoresVinculados.length} líderes</span>
          </div>

          <div className="divide-y divide-slate-100 p-2">
            {coordenadoresVinculados.map((coord) => {
              const coordWorkers = workers.filter(w => w.coordinatorId === coord.id);
              const activeNow = coordWorkers.filter(w => w.status === 'Em campo').length;

              return (
                <div key={coord.id} className="p-3 hover:bg-slate-50 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <img
                      src={coord.avatar}
                      alt={coord.name}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">{coord.name}</div>
                      <div className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                        <span>{coord.teamZone}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-medium">
                          {coordWorkers.length} trabalhadores
                        </span>
                        {activeNow > 0 && (
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold">
                            {activeNow} em campo
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
