'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatMoney, formatDate, maskCpf, exportToCsv } from '../../utils/formatters';
import { 
  FileText, 
  Download, 
  Printer, 
  Filter, 
  Calendar, 
  Users, 
  CreditCard, 
  Banknote, 
  CheckCircle2, 
  Clock, 
  Building2, 
  BarChart3, 
  TrendingUp,
  X,
  Search
} from 'lucide-react';

export const RelatoriosView: React.FC = () => {
  const { diarias, workers, currentUser, showNotification } = useApp();

  // Filters State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCity, setSelectedCity] = useState('Todas');
  const [selectedGestor, setSelectedGestor] = useState('Todos');
  const [selectedCoord, setSelectedCoord] = useState('Todos');
  const [selectedWorkerId, setSelectedWorkerId] = useState('Todos');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('Todas');
  const [selectedStatus, setSelectedStatus] = useState('Todas');
  const [searchTerm, setSearchTerm] = useState('');

  // Extract unique filter options
  const cities = useMemo(() => {
    return Array.from(new Set(diarias.map(d => d.city).filter(Boolean)));
  }, [diarias]);

  const gestores = useMemo(() => {
    return Array.from(new Set(diarias.map(d => d.managerName).filter(Boolean))) as string[];
  }, [diarias]);

  const coordenadores = useMemo(() => {
    return Array.from(new Set(diarias.map(d => d.coordinatorName).filter(Boolean))) as string[];
  }, [diarias]);

  // Filtered Diarias
  const filteredDiarias = useMemo(() => {
    return diarias.filter(d => {
      if (startDate && d.date < startDate) return false;
      if (endDate && d.date > endDate) return false;
      if (selectedCity !== 'Todas' && d.city !== selectedCity) return false;
      if (selectedGestor !== 'Todos' && d.managerName !== selectedGestor) return false;
      if (selectedCoord !== 'Todos' && d.coordinatorName !== selectedCoord) return false;
      if (selectedWorkerId !== 'Todos' && d.workerId !== selectedWorkerId) return false;
      if (selectedPaymentMethod !== 'Todas' && d.paymentMethod !== selectedPaymentMethod) return false;
      if (selectedStatus !== 'Todas' && d.status !== selectedStatus) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = d.workerName.toLowerCase().includes(q);
        const matchLoc = d.location.toLowerCase().includes(q);
        const matchRole = d.workerRole.toLowerCase().includes(q);
        return matchName || matchLoc || matchRole;
      }

      return true;
    });
  }, [diarias, startDate, endDate, selectedCity, selectedGestor, selectedCoord, selectedWorkerId, selectedPaymentMethod, selectedStatus, searchTerm]);

  // Metrics calculation
  const metrics = useMemo(() => {
    const totalDiarias = filteredDiarias.length;
    const uniqueWorkers = new Set(filteredDiarias.map(d => d.workerId)).size;

    let totalPago = 0;
    let totalPendente = 0;
    let totalPix = 0;
    let totalDinheiro = 0;

    filteredDiarias.forEach(d => {
      if (d.status === 'Paga') {
        totalPago += d.amount;
      } else if (d.status === 'Aguardando aprovação' || d.status === 'Aguardando pagamento' || (d.status as string) === 'Aprovada') {
        totalPendente += d.amount;
      }

      if (d.paymentMethod === 'PIX') {
        totalPix += d.amount;
      } else if (d.paymentMethod === 'Dinheiro') {
        totalDinheiro += d.amount;
      }
    });

    return {
      totalDiarias,
      uniqueWorkers,
      totalPago,
      totalPendente,
      totalPix,
      totalDinheiro,
      totalGeral: totalPago + totalPendente,
    };
  }, [filteredDiarias]);

  // Breakdown by Role
  const roleBreakdown = useMemo(() => {
    const map = new Map<string, { count: number; amount: number }>();
    filteredDiarias.forEach(d => {
      const roleName = d.workerRole?.trim() || 'Outros';
      const current = map.get(roleName) || { count: 0, amount: 0 };
      map.set(roleName, {
        count: current.count + 1,
        amount: current.amount + (d.amount || 0),
      });
    });
    return Array.from(map.entries())
      .map(([role, data]) => ({ role, ...data }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredDiarias]);

  // Breakdown by City
  const cityBreakdown = useMemo(() => {
    const map = new Map<string, { count: number; amount: number }>();
    filteredDiarias.forEach(d => {
      const cityName = d.city?.trim() || 'Não informada';
      const current = map.get(cityName) || { count: 0, amount: 0 };
      map.set(cityName, {
        count: current.count + 1,
        amount: current.amount + (d.amount || 0),
      });
    });
    return Array.from(map.entries())
      .map(([city, data]) => ({ city, ...data }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredDiarias]);

  // Export to Excel / CSV
  const handleExportCsv = () => {
    if (filteredDiarias.length === 0) {
      showNotification('Não há dados filtrados para exportar.');
      return;
    }

    const headers = [
      'ID Diária',
      'Data',
      'Trabalhador',
      'Função',
      'Atividade',
      'Turno',
      'Cidade',
      'Local',
      'Coordenador',
      'Gestor',
      'Forma Pagamento',
      'Valor (R$)',
      'Status',
      'Data Pagamento',
      'Pago Por',
      'Recibo'
    ];

    const rows = filteredDiarias.map(d => [
      d.id,
      d.date,
      d.workerName,
      d.workerRole,
      d.activityType,
      d.shift || 'Integral',
      d.city,
      d.location,
      d.coordinatorName,
      d.managerName || '',
      d.paymentMethod,
      d.amount.toFixed(2),
      d.status,
      d.paidAt ? formatDate(d.paidAt.split('T')[0]) : '',
      d.paidByName || '',
      d.receiptNumber || d.paymentBatchNumber || ''
    ]);

    const filename = `Relatorio_Diarias_${new Date().toISOString().split('T')[0]}_${filteredDiarias.length}itens`;
    exportToCsv(filename, headers, rows);
    showNotification('Relatório exportado para Excel com sucesso!');
  };

  // Print / PDF Export
  const handlePrint = () => {
    window.print();
  };

  // Clear all filters
  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedCity('Todas');
    setSelectedGestor('Todos');
    setSelectedCoord('Todos');
    setSelectedWorkerId('Todos');
    setSelectedPaymentMethod('Todas');
    setSelectedStatus('Todas');
    setSearchTerm('');
  };

  return (
    <div className="print-receipt-area space-y-6 pb-24 lg:pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              Relatórios
            </h1>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded-full text-[10px] border border-blue-200">
              Métricas
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Demonstrativo financeiro e operacional da campanha.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Exportar Excel</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-400" />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {/* Print-Only Header */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-4">
        <h2 className="text-xl font-black text-slate-900">
          COMITÊ FINANCEIRO DE CAMPANHA ELEITORAL
        </h2>
        <div className="text-xs text-slate-600">
          Relatório Gerencial de Pagamentos de Diárias de Prestação de Serviços
        </div>
        <div className="text-xs text-slate-500 mt-1">
          Emitido em: {new Date().toLocaleDateString('pt-BR')} por {currentUser?.name} ({currentUser?.role})
        </div>
      </div>

      {/* 6 MAIN METRICS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {/* 1. Qtd Diárias */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-slate-400 text-[11px] font-bold uppercase tracking-wider flex items-center justify-between">
            <span>Diárias</span>
            <FileText className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">{metrics.totalDiarias}</div>
          <div className="text-[11px] text-slate-500 font-medium">Lançadas no filtro</div>
        </div>

        {/* 2. Qtd Trabalhadores */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-slate-400 text-[11px] font-bold uppercase tracking-wider flex items-center justify-between">
            <span>Trabalhadores</span>
            <Users className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-600">{metrics.uniqueWorkers}</div>
          <div className="text-[11px] text-slate-500 font-medium">Pessoas únicas</div>
        </div>

        {/* 3. Total Pago */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-slate-400 text-[11px] font-bold uppercase tracking-wider flex items-center justify-between">
            <span>Total Pago</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-emerald-600 truncate">{formatMoney(metrics.totalPago)}</div>
          <div className="text-[11px] text-emerald-700 font-semibold">Liquidado</div>
        </div>

        {/* 4. Total Pendente */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-slate-400 text-[11px] font-bold uppercase tracking-wider flex items-center justify-between">
            <span>Pendente</span>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-amber-600 truncate">{formatMoney(metrics.totalPendente)}</div>
          <div className="text-[11px] text-amber-700 font-semibold">Aguardando</div>
        </div>

        {/* 5. Total por PIX */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-slate-400 text-[11px] font-bold uppercase tracking-wider flex items-center justify-between">
            <span>Total PIX</span>
            <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 truncate">{formatMoney(metrics.totalPix)}</div>
          <div className="text-[11px] text-slate-500 font-medium">Transferência</div>
        </div>

        {/* 6. Total em Dinheiro */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-slate-400 text-[11px] font-bold uppercase tracking-wider flex items-center justify-between">
            <span>Em Dinheiro</span>
            <Banknote className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 truncate">{formatMoney(metrics.totalDinheiro)}</div>
          <div className="text-[11px] text-slate-500 font-medium">Em espécie</div>
        </div>
      </div>

      {/* FILTER CONTROLS (Hidden on print) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3.5 print:hidden">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <Filter className="w-4 h-4 text-slate-400" />
            <span>Filtros Avançados de Relatório</span>
          </div>
          <button
            onClick={handleClearFilters}
            className="text-xs text-slate-500 hover:text-slate-900 font-semibold underline cursor-pointer"
          >
            Limpar Filtros
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Período Início */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
              Data Início
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-slate-900 focus:bg-white"
            />
          </div>

          {/* Período Fim */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
              Data Fim
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-slate-900 focus:bg-white"
            />
          </div>

          {/* Cidade */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
              Cidade
            </label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-slate-900 focus:bg-white"
            >
              <option value="Todas">Todas as Cidades</option>
              {cities.filter(c => Boolean(c) && c !== 'Todas').map((c, idx) => (
                <option key={`rel-city-${c}-${idx}`} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Forma de Pagamento */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
              Forma de Pagamento
            </label>
            <select
              value={selectedPaymentMethod}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-slate-900 focus:bg-white"
            >
              <option value="Todas">Todas (PIX e Dinheiro)</option>
              <option value="PIX">Somente PIX</option>
              <option value="Dinheiro">Somente Dinheiro</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
              Status da Diária
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-slate-900 focus:bg-white"
            >
              <option value="Todas">Todos os Status</option>
              <option value="Aguardando aprovação">Aguardando aprovação</option>
              <option value="Aguardando pagamento">Aguardando pagamento</option>
              <option value="Paga">Paga (Liquidada)</option>
              <option value="Rejeitada">Rejeitada</option>
            </select>
          </div>

          {/* Gestor */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
              Gestor
            </label>
            <select
              value={selectedGestor}
              onChange={(e) => setSelectedGestor(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-slate-900 focus:bg-white"
            >
              <option value="Todos">Todos os Gestores</option>
              {gestores.filter(g => Boolean(g) && g !== 'Todos').map((g, idx) => (
                <option key={`rel-gestor-${g}-${idx}`} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Coordenador */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
              Coordenador
            </label>
            <select
              value={selectedCoord}
              onChange={(e) => setSelectedCoord(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-slate-900 focus:bg-white"
            >
              <option value="Todos">Todos os Coordenadores</option>
              {coordenadores.filter(c => Boolean(c) && c !== 'Todos').map((c, idx) => (
                <option key={`rel-coord-${c}-${idx}`} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Trabalhador Específico */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
              Trabalhador Específico
            </label>
            <select
              value={selectedWorkerId}
              onChange={(e) => setSelectedWorkerId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-slate-900 focus:bg-white"
            >
              <option value="Todos">Todos os Trabalhadores</option>
              {workers.map((w, idx) => (
                <option key={w?.id ? `rel-worker-${w.id}` : `rel-worker-idx-${idx}`} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* CHARTS / BREAKDOWNS (Funções e Cidades) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Funções */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-emerald-500" />
              <span>Distribuição por Função de Campanha</span>
            </h3>
            <span className="text-[11px] text-slate-400">{roleBreakdown.length} funções</span>
          </div>

          <div className="space-y-2.5 text-xs">
            {roleBreakdown.slice(0, 5).map((item, idx) => {
              const pct = metrics.totalGeral > 0 ? (item.amount / metrics.totalGeral) * 100 : 0;
              return (
                <div key={`rel-rolebreak-${item.role || 'outros'}-${idx}`} className="space-y-1">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-slate-800">{item.role} ({item.count} diárias)</span>
                    <span className="font-bold text-slate-900">{formatMoney(item.amount)}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Cidades */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-blue-500" />
              <span>Distribuição por Cidade / Polo</span>
            </h3>
            <span className="text-[11px] text-slate-400">{cityBreakdown.length} cidades</span>
          </div>

          <div className="space-y-2.5 text-xs">
            {cityBreakdown.slice(0, 5).map((item, idx) => {
              const pct = metrics.totalGeral > 0 ? (item.amount / metrics.totalGeral) * 100 : 0;
              return (
                <div key={`rel-citybreak-${item.city || 'geral'}-${idx}`} className="space-y-1">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-slate-800">{item.city} ({item.count} diárias)</span>
                    <span className="font-bold text-slate-900">{formatMoney(item.amount)}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* DETAILED RESULTS SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="font-bold text-sm text-slate-900">
            Detalhamento das Diárias ({filteredDiarias.length} registros encontrados)
          </div>
          <div className="text-xs text-slate-500">
            Total filtrado: <strong className="text-slate-900">{formatMoney(metrics.totalGeral)}</strong>
          </div>
        </div>

        {/* MOBILE CARDS (No horizontal scroll) */}
        <div className="p-3.5 space-y-3 sm:hidden">
          {filteredDiarias.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              Nenhuma diária encontrada para os filtros selecionados.
            </div>
          ) : (
            filteredDiarias.map((d, idx) => (
              <div key={d?.id ? `rel-card-${d.id}-${idx}` : `rel-card-idx-${idx}`} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">{d.workerName}</h4>
                    <span className="text-[10px] text-slate-500 block">{d.workerRole} • {d.activityType}</span>
                  </div>
                  <span className="font-black text-slate-900 text-sm">{formatMoney(d.amount)}</span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 text-[11px] text-slate-600 pt-1 border-t border-slate-200/60">
                  <div>
                    <span className="text-slate-400 block text-[9px]">DATA:</span>
                    <strong>{formatDate(d.date)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px]">COORDENADOR:</span>
                    <span className="truncate block">{d.coordinatorName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px]">GESTOR:</span>
                    <span className="truncate block">{d.managerName || '-'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[10px]">
                  <span className={`px-2 py-0.5 rounded-full font-bold ${
                    d.paymentMethod === 'Dinheiro'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {d.paymentMethod}
                  </span>

                  <span className={`px-2 py-0.5 rounded-full font-bold ${
                    d.status === 'Paga'
                      ? 'bg-emerald-100 text-emerald-800'
                      : d.status === 'Aguardando pagamento'
                      ? 'bg-blue-100 text-blue-800'
                      : d.status === 'Aguardando aprovação'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {d.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* DESKTOP TABLE - STRICT 100% WIDTH - ZERO HORIZONTAL SCROLLBAR */}
        <div className="hidden sm:block w-full overflow-hidden">
          <table className="w-full text-left text-xs table-fixed">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="w-[10%] px-3 py-3">Data</th>
                <th className="w-[26%] px-3 py-3">Trabalhador & CPF</th>
                <th className="w-[18%] px-3 py-3">Função & Atividade</th>
                <th className="w-[16%] px-3 py-3">Coord / Gestor</th>
                <th className="w-[8%] px-2 py-3 text-center">Forma</th>
                <th className="w-[11%] px-3 py-3 text-right">Valor</th>
                <th className="w-[11%] px-2 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDiarias.map((d, idx) => (
                <tr key={d?.id ? `rel-row-${d.id}-${idx}` : `rel-row-idx-${idx}`} className="hover:bg-slate-50">
                  <td className="px-3 py-2.5 font-semibold text-slate-700 truncate">
                    {formatDate(d.date)}
                  </td>
                  <td className="px-3 py-2.5 truncate">
                    <div className="font-bold text-slate-900 truncate">{d.workerName}</div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">
                      CPF: {maskCpf(d.auditLog?.[0]?.details || '***.***.***-**')}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 truncate">
                    <div className="font-semibold text-slate-800 truncate">{d.workerRole}</div>
                    <div className="text-[10px] text-slate-500 truncate">{d.activityType}</div>
                  </td>
                  <td className="px-3 py-2.5 truncate">
                    <div className="font-semibold text-slate-700 truncate">{d.coordinatorName}</div>
                    <div className="text-[10px] text-slate-400 truncate">{d.managerName || '-'}</div>
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-block whitespace-nowrap ${
                      d.paymentMethod === 'Dinheiro'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {d.paymentMethod}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-black text-slate-900 whitespace-nowrap">
                    {formatMoney(d.amount)}
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-block whitespace-nowrap ${
                      d.status === 'Paga'
                        ? 'bg-emerald-100 text-emerald-800'
                        : d.status === 'Aguardando pagamento'
                        ? 'bg-blue-100 text-blue-800'
                        : d.status === 'Aguardando aprovação'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {d.status === 'Aguardando pagamento' ? 'Aguardando' : d.status === 'Aguardando aprovação' ? 'Pendente' : d.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
