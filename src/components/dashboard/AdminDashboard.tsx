'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatMoney, formatDate } from '../../utils/formatters';
import { SetorPagamentoSemanal } from '../pagamentos/SetorPagamentoSemanal';
import { DashboardDateFilter } from './DashboardDateFilter';
import { 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle, 
  Hourglass, 
  DollarSign, 
  Layers, 
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  AlertCircle
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { 
    workers, 
    diarias, 
    approveDiaria, 
    payDiaria, 
    setCurrentTab,
    financialPayments 
  } = useApp();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const hasDateFilter = Boolean(startDate || endDate);

  // Filtered Diarias by selected period
  const filteredDiarias = useMemo(() => {
    return diarias.filter(d => {
      if (startDate && d.date < startDate) return false;
      if (endDate && d.date > endDate) return false;
      return true;
    });
  }, [diarias, startDate, endDate]);

  // Filtered Financial Payments by selected period
  const filteredFinancialPayments = useMemo(() => {
    return financialPayments.filter(p => {
      const pDate = p.date ? p.date.split('T')[0] : '';
      if (startDate && pDate && pDate < startDate) return false;
      if (endDate && pDate && pDate > endDate) return false;
      return true;
    });
  }, [financialPayments, startDate, endDate]);

  // Calculations for Admin Cards
  const totalTrabalhadores = workers.length;
  
  // Unique workers with presences in the period
  const trabalhadoresAtivosPeriodo = useMemo(() => {
    const ids = new Set(filteredDiarias.map(d => d.workerId));
    return ids.size;
  }, [filteredDiarias]);

  const diariasNoPeriodo = filteredDiarias.length;
  const diariasHoje = diarias.filter(d => d.date === today).length;

  const trabalhadoresPendentes = workers.filter(w => 
    w.approvalStatus === 'Pendente' || w.status === 'Aguardando Liberação' || (w.status as string) === 'Pendente'
  ).length;

  const diariasAprovadas = filteredDiarias.filter(d => d.status === 'Aprovada' || (d.status as string) === 'Confirmada').length;
  
  // Total pago no financeiro (filtrado pelo período ou geral)
  const totalPagoFinanceiro = filteredFinancialPayments.reduce((acc, p) => acc + p.amount, 0);

  // Valor aguardando pagamento: non-paid diarias no período
  const valorAguardandoPagamento = filteredDiarias
    .filter(d => d.status !== 'Paga' && d.status !== 'Rejeitada' && d.status !== 'Cancelada')
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Valor pago geral no período
  const valorPago = filteredDiarias
    .filter(d => d.status === 'Paga')
    .reduce((acc, curr) => acc + curr.amount, 0) + totalPagoFinanceiro;

  // Total geral de diárias no período
  const totalGeralDiarias = filteredDiarias.length;

  // Recent lists filtered by the active period
  const ultimosLancamentos = useMemo(() => {
    return [...filteredDiarias]
      .sort((a, b) => (b.createdAt || b.date).localeCompare(a.createdAt || a.date))
      .slice(0, 5);
  }, [filteredDiarias]);

  const ultimosPagamentos = useMemo(() => {
    return filteredDiarias.filter(d => d.status === 'Paga').slice(0, 4);
  }, [filteredDiarias]);

  const aguardandoAcao = useMemo(() => {
    return filteredDiarias.filter(d => (d.status as string) === 'Pendente' || d.status === 'Aprovada').slice(0, 5);
  }, [filteredDiarias]);

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Page Title & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
            Painel Geral
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Visão consolidada da campanha.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentTab('diarias')}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>Ver Presença</span>
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
        filteredCount={filteredDiarias.length}
        totalCount={diarias.length}
      />

      {/* 7 Admin Metric Cards (Recalculadas com o Filtro de Período) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Card 1: Trabalhadores */}
        <div 
          onClick={() => setCurrentTab('trabalhadores')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total de Trabalhadores
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {hasDateFilter ? trabalhadoresAtivosPeriodo : totalTrabalhadores}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-medium truncate">
            <span>
              {hasDateFilter 
                ? `Ativos no período (${totalTrabalhadores} cadastrados)` 
                : 'Cadastrados no comitê'}
            </span>
          </div>
        </div>

        {/* Card 2: Diárias no Período ou Lançadas Hoje */}
        <div 
          onClick={() => setCurrentTab('diarias')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {hasDateFilter ? 'Diárias no Período' : 'Em Campo'}
            </span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-105 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {hasDateFilter ? diariasNoPeriodo : diariasHoje}
          </div>
          <div className="text-[11px] text-indigo-600 mt-1 font-medium truncate">
            {hasDateFilter ? 'Lançadas no período' : 'Em atividade no dia'}
          </div>
        </div>

        {/* Card 3: Trabalhadores Aguardando Liberação */}
        <div 
          onClick={() => setCurrentTab('aprovacoes')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Cadastro para Aprovar
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-105 transition-transform">
              <Hourglass className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600">
            {trabalhadoresPendentes}
          </div>
          <div className="text-[11px] text-amber-700/80 mt-1 font-medium truncate">
            Aguardando para trabalhar
          </div>
        </div>

        {/* Card 5: Valor aguardando pagamento no período */}
        <div 
          onClick={() => setCurrentTab('pagamentos')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Aguardando Pgto
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-700 truncate">
            {formatMoney(valorAguardandoPagamento)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium truncate">
            {diariasAprovadas} diária(s) no período
          </div>
        </div>

        {/* Card 6: Valor pago no período */}
        <div 
          onClick={() => setCurrentTab('diarias')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Pago
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 truncate">
            {formatMoney(valorPago)}
          </div>
          {hasDateFilter && (
            <div className="text-[11px] text-emerald-600 mt-1 font-medium truncate">
              Liquidado no período
            </div>
          )}
        </div>

        {/* Card 7: Total geral de diárias no período */}
        <div 
          onClick={() => setCurrentTab('diarias')}
          className="col-span-2 bg-slate-900 p-4 rounded-2xl text-white shadow-xs hover:bg-slate-800 transition-all cursor-pointer group flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {hasDateFilter ? 'Total de Dias no Período' : 'Total Geral de Dias'}
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1">
              {totalGeralDiarias} dias
            </div>
            <div className="text-xs text-emerald-400 mt-1 font-medium">
              {hasDateFilter ? 'Total apurado no intervalo de datas selecionado' : 'Histórico completo de lançamentos'}
            </div>
          </div>
          <div className="p-3 bg-slate-800 rounded-2xl text-emerald-400 group-hover:scale-110 transition-transform">
            <Layers className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Setor de Pagamento de Cada Trabalhador conforme o Relatório Semanal */}
      <SetorPagamentoSemanal 
        title="Setor de Pagamento Semanal por Trabalhador"
        subtitle="Consolidado de presenças da semana, cálculo de diárias (dias × diária) e efetivação de pagamentos PIX."
      />

      {/* Grid: Diárias Aguardando Ação + Últimos Pagamentos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Section 1: Diárias aguardando ação (Aprovação ou Pagamento) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Diárias Aguardando Ação {hasDateFilter && <span className="text-xs font-normal text-slate-500">(no período)</span>}
              </h2>
            </div>
            <button
              onClick={() => setCurrentTab('pagamentos')}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Ver todas</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {aguardandoAcao.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                {hasDateFilter 
                  ? 'Nenhuma diária pendente de ação encontrada no período selecionado.'
                  : 'Nenhuma diária pendente de ação no momento.'}
              </div>
            ) : (
              aguardandoAcao.map((diaria) => (
                <div key={diaria.id} className="p-3.5 sm:p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-slate-900">{diaria.workerName}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                        {diaria.workerRole}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        (diaria.status as string) === 'Pendente'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {(diaria.status as string) === 'Pendente' ? 'Pendente Aprovação' : 'Aprovada (Pagar)'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-3">
                      <span>Coord: <strong>{diaria.coordinatorName}</strong></span>
                      <span>Zona: {diaria.teamZone}</span>
                      <span>Data: {formatDate(diaria.date)}</span>
                      <span>Chave PIX: {diaria.pixKey || 'Não inf.'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-right">
                      <div className="text-xs sm:text-sm font-black text-slate-900">
                        {formatMoney(diaria.amount)}
                      </div>
                      <div className="text-[10px] text-slate-400">{diaria.paymentMethod}</div>
                    </div>

                    {(diaria.status as string) === 'Pendente' ? (
                      <button
                        onClick={() => approveDiaria(diaria.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                      >
                        Aprovar
                      </button>
                    ) : (
                      <button
                        onClick={() => payDiaria(diaria.id)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                      >
                        Confirmar Pgto
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Section 2: Últimos Pagamentos */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Últimos Pagamentos {hasDateFilter && <span className="text-xs font-normal text-slate-500">(no período)</span>}
              </h2>
            </div>
            <button
              onClick={() => setCurrentTab('diarias')}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
            >
              Ver todos
            </button>
          </div>

          <div className="divide-y divide-slate-100 p-2">
            {ultimosPagamentos.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                {hasDateFilter 
                  ? 'Nenhum pagamento registrado no período selecionado.'
                  : 'Nenhum pagamento registrado ainda.'}
              </div>
            ) : (
              ultimosPagamentos.map((pag) => (
                <div key={pag.id} className="p-3 hover:bg-slate-50 rounded-xl transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 truncate">{pag.workerName}</span>
                    <span className="text-xs font-black text-emerald-700">{formatMoney(pag.amount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span>{formatDate(pag.date)} &bull; {pag.workerRole}</span>
                    <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                      Pago
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Section 3: Últimos Lançamentos Geral */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Lançamentos do Sistema {hasDateFilter && <span className="text-xs font-normal text-slate-500">(no período)</span>}
            </h2>
            <p className="text-xs text-slate-400">
              {hasDateFilter ? 'Atividades apuradas no período de datas selecionado' : 'Atividades mais recentes enviadas pelos coordenadores'}
            </p>
          </div>
          <button
            onClick={() => setCurrentTab('diarias')}
            className="text-xs text-emerald-600 hover:text-emerald-700 font-bold"
          >
            Ver Diárias Completas &rarr;
          </button>
        </div>

        {/* Mobile Cards for releases */}
        <div className="divide-y divide-slate-100 sm:hidden">
          {ultimosLancamentos.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs">
              Nenhum lançamento no período selecionado.
            </div>
          ) : (
            ultimosLancamentos.map((item) => (
              <div key={item.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{item.workerName}</span>
                  <span className="text-xs font-black text-slate-900">{formatMoney(item.amount)}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Função: {item.workerRole} &bull; Turno: {item.shift}
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Coord: {item.coordinatorName}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    (item.status as string) === 'Pendente' ? 'bg-amber-100 text-amber-800' :
                    item.status === 'Aprovada' ? 'bg-blue-100 text-blue-800' :
                    item.status === 'Paga' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table - 100% Fit */}
        <div className="hidden sm:block">
          <table className="w-full text-left text-xs table-fixed">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="w-[24%] px-3 py-3">Trabalhador</th>
                <th className="w-[18%] px-3 py-3">Função</th>
                <th className="w-[22%] px-3 py-3">Coordenador / Zona</th>
                <th className="w-[16%] px-3 py-3">Data / Turno</th>
                <th className="w-[10%] px-3 py-3 text-right">Valor</th>
                <th className="w-[10%] px-3 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ultimosLancamentos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-slate-400 text-xs">
                    Nenhum lançamento encontrado no período de datas selecionado.
                  </td>
                </tr>
              ) : (
                ultimosLancamentos.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-3 py-3 font-bold text-slate-900 truncate">{item.workerName}</td>
                    <td className="px-3 py-3 text-slate-600 truncate">{item.workerRole}</td>
                    <td className="px-3 py-3 text-slate-500 truncate">
                      <div className="truncate">{item.coordinatorName}</div>
                      <div className="text-[10px] text-slate-400 truncate">{item.teamZone}</div>
                    </td>
                    <td className="px-3 py-3 text-slate-500 truncate">
                      <div>{formatDate(item.date)}</div>
                      <div className="text-[10px] text-slate-400">{item.shift}</div>
                    </td>
                    <td className="px-3 py-3 font-bold text-slate-900 text-right truncate">{formatMoney(item.amount)}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        (item.status as string) === 'Pendente' ? 'bg-amber-100 text-amber-800' :
                        item.status === 'Aprovada' ? 'bg-blue-100 text-blue-800' :
                        item.status === 'Paga' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
