'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatMoney, formatDate, DEFAULT_AVATAR } from '../../utils/formatters';
import { DashboardDateFilter } from './DashboardDateFilter';
import { 
  Users, 
  Calendar, 
  CalendarDays,
  Hourglass, 
  CheckCircle, 
  UserCheck, 
  PlusCircle, 
  MapPin, 
  Phone, 
  Check, 
  X, 
  Clock, 
  ArrowRight, 
  Sparkles
} from 'lucide-react';

export const CoordenadorDashboard: React.FC = () => {
  const { 
    currentUser, 
    workers, 
    diarias, 
    absences, 
    setCurrentTab, 
    updateWorkerStatus 
  } = useApp();

  if (!currentUser) return null;

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const hasDateFilter = Boolean(startDate || endDate);

  const today = new Date().toISOString().split('T')[0];

  // Filter for coordinator's team
  const equipeTrabalhadores = workers.filter(w => w.coordinatorId === currentUser.id);
  const equipeWorkerIds = equipeTrabalhadores.map(w => w.id);

  // Daily records of this coordinator
  const equipeDiariasBase = useMemo(() => {
    return diarias.filter(d => 
      d.coordinatorId === currentUser.id || equipeWorkerIds.includes(d.workerId)
    );
  }, [diarias, currentUser.id, equipeWorkerIds]);

  // Filtered by period
  const equipeDiarias = useMemo(() => {
    return equipeDiariasBase.filter(d => {
      if (startDate && d.date < startDate) return false;
      if (endDate && d.date > endDate) return false;
      return true;
    });
  }, [equipeDiariasBase, startDate, endDate]);

  // 1. Trabalhadores da sua equipe
  const totalEquipe = equipeTrabalhadores.length;

  // 3. Diárias aguardando aprovação no período
  const diariasPendentes = equipeDiarias.filter(d => d.status === 'Aguardando aprovação').length;

  // 4. Diárias aprovadas no período
  const diariasAprovadas = equipeDiarias.filter(d => d.status === 'Aprovada' || d.status === 'Paga').length;

  // 5. Total de pessoas trabalhando hoje (either 'Em campo' or have a daily record today)
  const pessoasTrabalhandoHoje = equipeTrabalhadores.filter(w => 
    w.status === 'Em campo' || equipeDiariasBase.some(d => d.workerId === w.id && d.date === today)
  ).length;

  // Recent daily records
  const recentes = useMemo(() => {
    return [...equipeDiarias].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  }, [equipeDiarias]);

  return (
    <div className="space-y-5 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      
      {/* Coordinator Greeting & Zone Info */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold uppercase tracking-wider">
                Área de Ponto
              </span>
              <span className="text-xs text-slate-300 font-medium">
                {currentUser.teamZone || 'Zona de Campanha'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Olá, {currentUser.name.split(' ')[0]}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-md">
              Controle de presença diária e equipe de campo.
            </p>
          </div>

          <button
            id="coord-big-presenca-btn"
            onClick={() => setCurrentTab('minhas-diarias')}
            className="w-full md:w-auto px-5 py-3 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black rounded-2xl shadow-lg shadow-emerald-950/40 text-sm flex items-center justify-center gap-2 transition-all cursor-pointer group"
          >
            <CalendarDays className="w-5 h-5 text-slate-950 group-hover:scale-110 transition-transform" />
            <span>Fazer Presença Hoje</span>
            <ArrowRight className="w-4 h-4 text-slate-950 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-8 translate-y-8">
          <Calendar className="w-64 h-64 text-white" />
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

      {/* 4 Coordenador Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Card 1: Trabalhadores da sua equipe */}
        <div 
          onClick={() => setCurrentTab('trabalhadores')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Sua Equipe
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {totalEquipe}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            Pessoas cadastradas
          </div>
        </div>

        {/* Card 3: Diárias aguardando aprovação */}
        <div 
          onClick={() => setCurrentTab('minhas-diarias')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Aguardando para Aprovação
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-105 transition-transform">
              <Hourglass className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600">
            {diariasPendentes}
          </div>
          <div className="text-[11px] text-amber-700/80 mt-1 font-medium">
            Com o gestor
          </div>
        </div>

        {/* Card 4: Diárias aprovadas */}
        <div 
          onClick={() => setCurrentTab('minhas-diarias')}
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
            {diariasAprovadas}
          </div>
          <div className="text-[11px] text-emerald-700/80 mt-1 font-medium">
            Validadas para pgto
          </div>
        </div>

        {/* Card 5: Total de pessoas trabalhando hoje */}
        <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-emerald-100 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Trabalhando Hoje
            </span>
            <div className="p-2 bg-emerald-700 text-white rounded-xl">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {pessoasTrabalhandoHoje}
          </div>
          <div className="text-[11px] text-emerald-100 mt-1 font-medium">
            Em atividade no campo
          </div>
        </div>

      </div>

      {/* Grid: Trabalhadores da Equipe + Últimas Diárias Lançadas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Section: Trabalhadores da Equipe com Lançamento Rápido */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Pessoas da Sua Equipe
              </h2>
              <p className="text-xs text-slate-400">Clique para lançar a diária do dia rapidamente</p>
            </div>
            <button
              onClick={() => setCurrentTab('trabalhadores')}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-bold"
            >
              Ver equipe ({totalEquipe})
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {equipeTrabalhadores.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Nenhum trabalhador vinculado à sua coordenação.
              </div>
            ) : (
              equipeTrabalhadores.map((worker) => {
                const hasDiariaToday = equipeDiarias.some(d => d.workerId === worker.id && d.date === today && d.status !== 'Cancelada');
                const isAbsentToday = absences.some(a => a.workerId === worker.id && a.date === today) || worker.status === 'Faltou' || (!hasDiariaToday && worker.status !== 'Inativo');

                return (
                  <div key={worker.id} className="p-3.5 sm:p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={worker.avatar || DEFAULT_AVATAR}
                        alt={worker.name}
                        className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 truncate">{worker.name}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                            isAbsentToday || worker.status === 'Faltou'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : (hasDiariaToday || worker.status === 'Em campo')
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {isAbsentToday || worker.status === 'Faltou' ? 'Faltou' : (hasDiariaToday ? 'Em campo' : worker.status)}
                          </span>
                        </div>
                        {/* Only Name and Role (Função) displayed to keep layout clean */}
                        <div className="text-xs text-slate-500 font-medium mt-0.5 truncate">
                          {worker.role}
                        </div>
                      </div>
                    </div>

                    {/* Standardized Green and Red Status Badges of identical size */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {hasDiariaToday ? (
                        <button
                          type="button"
                          onClick={() => setCurrentTab('minhas-diarias')}
                          title="Clique para gerenciar presença na aba Presença"
                          className="w-36 h-9 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer active:scale-98"
                        >
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[2.5]" />
                          <span>Presente Hoje</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setCurrentTab('minhas-diarias')}
                          title="Clique para gerenciar presença na aba Presença"
                          className="w-36 h-9 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100/80 text-rose-800 font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer active:scale-98"
                        >
                          <X className="w-4 h-4 text-rose-600 shrink-0 stroke-[2.5]" />
                          <span>Faltou Hoje</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Section: Minhas Últimas Diárias */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Suas Últimas Diárias
            </h2>
            <button
              onClick={() => setCurrentTab('minhas-diarias')}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
            >
              Ver todas
            </button>
          </div>

          <div className="divide-y divide-slate-100 p-2">
            {recentes.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                Nenhuma diária lançada ainda. Clique em "+ Nova Diária" acima para começar!
              </div>
            ) : (
              recentes.map((d) => (
                <div key={d.id} className="p-3 hover:bg-slate-50 rounded-xl transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 truncate">{d.workerName}</span>
                    <span className="text-xs font-black text-slate-900">{formatMoney(d.amount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span>{formatDate(d.date)} &bull; {d.workerRole}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      (d.status as string) === 'Pendente' ? 'bg-amber-100 text-amber-800' :
                      d.status === 'Aprovada' ? 'bg-blue-100 text-blue-800' :
                      d.status === 'Paga' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {d.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
