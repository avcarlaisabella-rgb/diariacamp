'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Worker, DailyRecord, FinancialPayment, PaymentMethod } from '../../types';
import { formatMoney, formatDate, maskCpf, maskPixKey, exportToCsv } from '../../utils/formatters';
import { ReciboAssinaturaModal } from '../financeiro/ReciboAssinaturaModal';
import { SetorPagamentoSemanal } from './SetorPagamentoSemanal';
import { 
  CreditCard, 
  Banknote, 
  Search, 
  Calendar, 
  MapPin, 
  UserCheck, 
  CheckCircle2, 
  FileText, 
  Download, 
  PlusCircle,
  X, 
  AlertCircle, 
  Check, 
  Eye, 
  Copy, 
  Clock,
  Printer,
  PenTool,
  FileSignature,
  DollarSign,
  Users,
  ShieldCheck,
  ArrowRight,
  RotateCcw,
  History
} from 'lucide-react';

export const PagamentosView: React.FC = () => {
  const { 
    currentUser, 
    diarias, 
    workers, 
    financialPayments,
    paymentReversals,
    registerWorkerPayment,
    payWorkerWeekly,
    revertPayment,
    togglePaymentSigned,
    showNotification 
  } = useApp();

  // Navigation tab inside Financial Module
  const [activeTab, setActiveTab] = useState<'trabalhadores' | 'recibos' | 'semanal' | 'reversoes'>('trabalhadores');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [coordinatorFilter, setCoordinatorFilter] = useState('Todos');
  const [methodFilter, setMethodFilter] = useState<'Todas' | PaymentMethod>('Todas');

  // Modal: Register Worker Payment & Generate Receipt
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [referencePeriod, setReferencePeriod] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [deliveredBy, setDeliveredBy] = useState(currentUser?.name || 'Comitê Financeiro');
  const [selectedDiariaIds, setSelectedDiariaIds] = useState<string[]>([]);
  const [formError, setFormError] = useState('');

  // Active Receipt Modal (Print / Signature)
  const [activeReceiptPayment, setActiveReceiptPayment] = useState<FinancialPayment | null>(null);

  // Modal: Revert Payment with recorded justification
  const [revertingPaymentData, setRevertingPaymentData] = useState<{
    workerId: string;
    workerName: string;
    workerRole: string;
    coordinatorName?: string;
    avatar?: string;
    diariaIds: string[];
    amount: number;
    referencePeriod: string;
  } | null>(null);
  const [revertReason, setRevertReason] = useState('');
  const [revertError, setRevertError] = useState('');
  const [isSubmittingRevert, setIsSubmittingRevert] = useState(false);

  // Selected Worker object
  const activeWorker = useMemo(() => {
    return workers.find(w => w.id === selectedWorkerId);
  }, [workers, selectedWorkerId]);

  // Unpaid diarias of selected worker
  const workerUnpaidDiarias = useMemo(() => {
    if (!selectedWorkerId) return [];
    return diarias.filter(d => 
      d.workerId === selectedWorkerId && 
      d.status !== 'Paga' && 
      d.status !== 'Rejeitada' && 
      d.status !== 'Cancelada'
    );
  }, [diarias, selectedWorkerId]);

  // Coordinators list for filter
  const availableCoordinators = useMemo(() => {
    return Array.from(new Set(workers.map(w => w.coordinatorName).filter(Boolean)));
  }, [workers]);

  // Consolidated Worker balances
  const workerPaymentStats = useMemo(() => {
    return workers.map(w => {
      const workerDiarias = diarias.filter(d => d.workerId === w.id);
      const paidDiarias = workerDiarias.filter(d => d.status === 'Paga');
      const unpaidDiarias = workerDiarias.filter(d => 
        d.status !== 'Paga' && d.status !== 'Rejeitada' && d.status !== 'Cancelada'
      );

      const totalAccrued = workerDiarias.reduce((acc, d) => acc + d.amount, 0);
      const totalPaid = paidDiarias.reduce((acc, d) => acc + d.amount, 0);
      const pendingBalance = unpaidDiarias.reduce((acc, d) => acc + d.amount, 0);

      const workerReceipts = financialPayments.filter(p => p.workerId === w.id);

      return {
        worker: w,
        totalDiarias: workerDiarias.length,
        unpaidCount: unpaidDiarias.length,
        totalAccrued,
        totalPaid,
        pendingBalance,
        receiptsCount: workerReceipts.length,
        lastReceipt: workerReceipts[0] || null,
      };
    });
  }, [workers, diarias, financialPayments]);

  // Filtered workers list
  const filteredWorkerStats = useMemo(() => {
    return workerPaymentStats.filter(stat => {
      const w = stat.worker;
      if (coordinatorFilter !== 'Todos' && w.coordinatorName !== coordinatorFilter) return false;
      if (methodFilter !== 'Todas' && w.preferredPaymentMethod !== methodFilter) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const mName = w.name.toLowerCase().includes(q);
        const mCpf = w.cpf.toLowerCase().includes(q);
        const mPix = w.pixKey?.toLowerCase().includes(q);
        const mCoord = w.coordinatorName.toLowerCase().includes(q);
        if (!mName && !mCpf && !mPix && !mCoord) return false;
      }
      return true;
    });
  }, [workerPaymentStats, coordinatorFilter, methodFilter, searchTerm]);

  // Filtered receipts list
  const filteredReceipts = useMemo(() => {
    return financialPayments.filter(p => {
      if (methodFilter !== 'Todas' && p.paymentMethod !== methodFilter) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const mNum = p.receiptNumber.toLowerCase().includes(q);
        const mName = p.workerName.toLowerCase().includes(q);
        const mCpf = p.workerCpf.toLowerCase().includes(q);
        const mRef = p.referencePeriod.toLowerCase().includes(q);
        if (!mNum && !mName && !mCpf && !mRef) return false;
      }
      return true;
    });
  }, [financialPayments, methodFilter, searchTerm]);

  // Financial KPIs
  const totalAmountPaid = useMemo(() => {
    return financialPayments.reduce((acc, p) => acc + p.amount, 0);
  }, [financialPayments]);

  const totalPendingAmount = useMemo(() => {
    return workerPaymentStats.reduce((acc, s) => acc + s.pendingBalance, 0);
  }, [workerPaymentStats]);

  const workersWithPendingBalance = useMemo(() => {
    return workerPaymentStats.filter(s => s.pendingBalance > 0).length;
  }, [workerPaymentStats]);

  // Open payment registration modal for a worker
  const handleOpenPaymentModal = (worker: Worker) => {
    setSelectedWorkerId(worker.id);
    const unpaid = diarias.filter(d => 
      d.workerId === worker.id && 
      d.status !== 'Paga' && 
      d.status !== 'Rejeitada' && 
      d.status !== 'Cancelada'
    );
    const unpaidIds = unpaid.map(d => d.id);
    setSelectedDiariaIds(unpaidIds);
    
    const sum = unpaid.reduce((acc, d) => acc + d.amount, 0);
    setPaymentAmount(sum > 0 ? sum : worker.standardRate);
    setPaymentMethod(worker.preferredPaymentMethod || 'PIX');
    setPaymentDate(new Date().toISOString().split('T')[0]);

    // Build default reference text
    if (unpaid.length > 0) {
      setReferencePeriod(`Referente a ${unpaid.length} diária(s) de ${worker.role}`);
    } else {
      setReferencePeriod(`Pagamento de diária - ${worker.role}`);
    }

    setPaymentNotes('');
    setFormError('');
    setIsRegisterModalOpen(true);
  };

  // Toggle diaria checkbox in modal
  const handleToggleDiaria = (diariaId: string, amount: number) => {
    if (selectedDiariaIds.includes(diariaId)) {
      const next = selectedDiariaIds.filter(id => id !== diariaId);
      setSelectedDiariaIds(next);
      const newTotal = workerUnpaidDiarias
        .filter(d => next.includes(d.id))
        .reduce((acc, d) => acc + d.amount, 0);
      setPaymentAmount(newTotal);
    } else {
      const next = [...selectedDiariaIds, diariaId];
      setSelectedDiariaIds(next);
      const newTotal = workerUnpaidDiarias
        .filter(d => next.includes(d.id))
        .reduce((acc, d) => acc + d.amount, 0);
      setPaymentAmount(newTotal);
    }
  };

  // Submit Payment & Generate Receipt
  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorker) {
      setFormError('Selecione o trabalhador.');
      return;
    }
    if (paymentAmount <= 0) {
      setFormError('Informe um valor de pagamento válido maior que zero.');
      return;
    }
    if (!referencePeriod.trim()) {
      setFormError('Informe a referência ou período do pagamento.');
      return;
    }

    // Register payment and get the created receipt
    const newReceipt = registerWorkerPayment({
      workerId: activeWorker.id,
      workerName: activeWorker.name,
      workerCpf: activeWorker.cpf,
      workerRole: activeWorker.role,
      date: paymentDate,
      amount: paymentAmount,
      paymentMethod,
      referencePeriod: referencePeriod.trim(),
      description: paymentNotes.trim() || undefined,
      diariaIds: selectedDiariaIds,
      pixKey: activeWorker.pixKey,
      pixType: activeWorker.pixType,
      bankName: activeWorker.bankName,
      deliveredByName: deliveredBy.trim(),
      notes: paymentNotes.trim(),
    });

    setIsRegisterModalOpen(false);
    // Immediately open the generated receipt for signature or printing!
    setActiveReceiptPayment(newReceipt);
  };

  // Direct Pay worker action
  const handleDirectPayWorker = (worker: Worker) => {
    const unpaid = diarias.filter(d => 
      d.workerId === worker.id && 
      d.status !== 'Paga' && 
      d.status !== 'Rejeitada' && 
      d.status !== 'Cancelada'
    );
    const unpaidIds = unpaid.map(d => d.id);
    
    if (unpaidIds.length === 0) {
      showNotification('Não há diárias pendentes para este trabalhador.');
      return;
    }

    payWorkerWeekly(
      worker.id,
      unpaidIds,
      {
        method: worker.preferredPaymentMethod || 'PIX',
        referencePeriod: `Quitação imediata - ${worker.role}`
      }
    );
  };

  // Open Reversal Modal for a worker
  const handleOpenRevertForWorker = (worker: Worker) => {
    const paidDiarias = diarias.filter(d => d.workerId === worker.id && d.status === 'Paga');
    if (paidDiarias.length === 0) {
      showNotification('Não há pagamentos registrados para este trabalhador para reverter.');
      return;
    }

    const totalPaid = paidDiarias.reduce((acc, d) => acc + d.amount, 0);
    setRevertingPaymentData({
      workerId: worker.id,
      workerName: worker.name,
      workerRole: worker.role,
      coordinatorName: worker.coordinatorName,
      avatar: worker.avatar,
      diariaIds: paidDiarias.map(d => d.id),
      amount: totalPaid,
      referencePeriod: `Quitação recente de ${paidDiarias.length} diária(s)`
    });
    setRevertReason('');
    setRevertError('');
  };

  // Open Reversal Modal for a specific receipt
  const handleOpenRevertForReceipt = (payment: FinancialPayment) => {
    setRevertingPaymentData({
      workerId: payment.workerId,
      workerName: payment.workerName,
      workerRole: payment.workerRole,
      diariaIds: payment.diariaIds || [],
      amount: payment.amount,
      referencePeriod: `Recibo #${payment.receiptNumber} (${payment.referencePeriod})`
    });
    setRevertReason('');
    setRevertError('');
  };

  // Submit reversal with recorded justification
  const handleConfirmReversal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revertingPaymentData) return;

    if (!revertReason.trim()) {
      setRevertError('A justificativa é obrigatória para registrar a reversão.');
      return;
    }

    setIsSubmittingRevert(true);
    try {
      const success = revertPayment({
        workerId: revertingPaymentData.workerId,
        diariaIds: revertingPaymentData.diariaIds,
        reason: revertReason.trim(),
        referencePeriod: revertingPaymentData.referencePeriod
      });
      if (success) {
        setRevertingPaymentData(null);
      }
    } catch (err) {
      showNotification('Erro ao reverter pagamento.');
    } finally {
      setIsSubmittingRevert(false);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = ['Nº Recibo', 'Data', 'Trabalhador', 'CPF', 'Cargo', 'Valor (R$)', 'Forma', 'Referência', 'Assinatura'];
    const rows = financialPayments.map(p => [
      p.receiptNumber,
      formatDate(p.date),
      p.workerName,
      p.workerCpf,
      p.workerRole,
      p.amount.toFixed(2),
      p.paymentMethod,
      p.referencePeriod,
      p.signedByWorker ? 'Assinado Digital' : 'Pendente'
    ]);
    exportToCsv(`relatorio_financeiro_${new Date().toISOString().split('T')[0]}`, headers, rows);
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <CreditCard className="w-5 h-5" />
            </span>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              Financeiro
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Pagamentos, quitação de diárias e recibos.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Exportar (CSV)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (workers.length > 0) {
                handleOpenPaymentModal(workers[0]);
              }
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Registrar Pagamento</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Pago Registrado</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2 truncate">
            {formatMoney(totalAmountPaid)}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">
            {financialPayments.length} recibos gerados
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Saldo a Pagar (Pendente)</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-900 mt-2 truncate">
            {formatMoney(totalPendingAmount)}
          </div>
          <div className="text-[11px] text-amber-700 font-semibold mt-1">
            {workersWithPendingBalance} trabalhadores com saldo
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Recibos Emitidos</span>
            <FileSignature className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
            {financialPayments.length}
          </div>
          <div className="text-[11px] text-slate-500 font-semibold mt-1">
            Prontos para assinatura
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Trabalhadores Cadastrados</span>
            <Users className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
            {workers.length}
          </div>
          <div className="text-[11px] text-slate-500 font-semibold mt-1">
            Em atividade de campo
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 overflow-x-hidden flex-wrap">
        <button
          type="button"
          onClick={() => setActiveTab('trabalhadores')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'trabalhadores'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Pagamentos por Trabalhador</span>
          {workersWithPendingBalance > 0 && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'trabalhadores' ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {workersWithPendingBalance} pendentes
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('recibos')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'recibos'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <FileSignature className="w-4 h-4" />
          <span>Recibos Emitidos para Assinatura</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
            activeTab === 'recibos' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700'
          }`}>
            {financialPayments.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('semanal')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'semanal'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Matriz de Presença Semanal</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reversoes')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'reversoes'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4 text-amber-500" />
          <span>Histórico de Reversões</span>
          {paymentReversals.length > 0 && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'reversoes' ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-800'
            }`}>
              {paymentReversals.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: TRABALHADORES & PAGAMENTOS */}
      {activeTab === 'trabalhadores' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por trabalhador, CPF ou PIX..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto justify-end flex-wrap">
              <select
                value={coordinatorFilter}
                onChange={(e) => setCoordinatorFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Todos">Todos os Coordenadores</option>
                {availableCoordinators.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value as any)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Todas">Todas as Formas</option>
                <option value="PIX">PIX</option>
                <option value="Dinheiro">Dinheiro</option>
                <option value="Transferência">Transferência</option>
              </select>
            </div>
          </div>

          {/* Mobile Cards (App-like layout for phones and narrow screens) */}
          <div className="block md:hidden space-y-3">
            {filteredWorkerStats.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
                Nenhum trabalhador encontrado com os filtros selecionados.
              </div>
            ) : (
              filteredWorkerStats.map(({ worker: w, totalDiarias, unpaidCount, totalPaid, pendingBalance, lastReceipt }) => (
                <div key={w.id} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
                  {/* Worker Header */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-sm border border-slate-200 shrink-0 overflow-hidden">
                        {w.avatar ? (
                          <img src={w.avatar} alt={w.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{w.name.charAt(0)}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 text-sm truncate">{w.name}</h4>
                        <div className="text-xs text-slate-500 truncate">
                          <span className="font-semibold text-emerald-800">{w.role}</span>
                          <span> • CPF: {maskCpf(w.cpf)}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          Coord: {w.coordinatorName}
                        </div>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 shrink-0">
                      {w.preferredPaymentMethod}
                    </span>
                  </div>

                  {/* Financial Stats Strip */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase">Saldo a Pagar</span>
                      <span className={`font-black text-sm ${pendingBalance > 0 ? 'text-amber-800' : 'text-slate-400'}`}>
                        {formatMoney(pendingBalance)}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {unpaidCount} diária(s) pendente(s)
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase">Total Pago</span>
                      <span className="font-black text-sm text-emerald-700">
                        {formatMoney(totalPaid)}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {totalDiarias} realizada(s)
                      </span>
                    </div>
                  </div>

                  {/* Mobile Actions Grid */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                    {pendingBalance > 0 && (
                      <button
                        id={`btn-pagar-direto-mob-${w.id}`}
                        type="button"
                        onClick={() => handleDirectPayWorker(w)}
                        className="py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white transition-all cursor-pointer shadow-xs col-span-2"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Pagar {formatMoney(pendingBalance)}</span>
                      </button>
                    )}

                    {lastReceipt ? (
                      <button
                        type="button"
                        onClick={() => setActiveReceiptPayment(lastReceipt)}
                        className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 active:scale-95 text-blue-700 border border-blue-200 transition-all cursor-pointer ${
                          totalPaid > 0 ? 'col-span-1' : 'col-span-2'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        <span>Ver Recibo</span>
                      </button>
                    ) : pendingBalance > 0 ? (
                      <button
                        type="button"
                        onClick={() => handleOpenPaymentModal(w)}
                        className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 border border-slate-200 transition-all cursor-pointer ${
                          totalPaid > 0 ? 'col-span-1' : 'col-span-2'
                        }`}
                      >
                        <FileSignature className="w-3.5 h-3.5 text-slate-600" />
                        <span>Gerar Recibo</span>
                      </button>
                    ) : null}

                    {totalPaid > 0 && (
                      <button
                        id={`btn-reverter-worker-mob-${w.id}`}
                        type="button"
                        onClick={() => handleOpenRevertForWorker(w)}
                        className="py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 border border-rose-200 transition-all cursor-pointer col-span-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                        <span>Reverter</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Workers Table (100% Proportional, Zero Overlap, No Button Clipping) */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
            <table className="w-full text-left text-xs table-fixed min-w-[760px]">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="w-[28%] px-3.5 py-3.5">Trabalhador & Cargo</th>
                  <th className="w-[18%] px-3.5 py-3.5">Dados de Pagamento</th>
                  <th className="w-[18%] px-3.5 py-3.5 text-right">Saldo a Pagar</th>
                  <th className="w-[36%] px-3.5 py-3.5 text-right">Ação Financeira</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredWorkerStats.map(({ worker: w, unpaidCount, totalPaid, pendingBalance, lastReceipt }) => (
                  <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Worker Info */}
                    <td className="px-3.5 py-3.5 truncate">
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
                          <div className="text-[11px] text-slate-500 truncate mt-0.5">
                            <span className="font-semibold text-emerald-800">{w.role}</span>
                            <span> • CPF: {maskCpf(w.cpf)}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            Coord: {w.coordinatorName}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Payment Data (Sem Diária Padrão redundante) */}
                    <td className="px-3.5 py-3.5 truncate">
                      <div className="truncate">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                          {w.preferredPaymentMethod}
                        </span>
                        {w.pixKey && (
                          <div className="text-[11px] text-slate-600 truncate mt-1 font-mono">
                            {maskPixKey(w.pixKey, w.pixType)} ({w.pixType || 'PIX'})
                          </div>
                        )}
                        {!w.pixKey && w.bankName && (
                          <div className="text-[11px] text-slate-600 truncate mt-1">
                            {w.bankName}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Pending Amount & Diárias (Unificados sem redundância com espaço amplo) */}
                    <td className="px-3.5 py-3.5 text-right truncate">
                      <div className={`font-black text-sm ${pendingBalance > 0 ? 'text-amber-800' : 'text-slate-400'}`}>
                        {formatMoney(pendingBalance)}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                        {unpaidCount > 0 ? (
                          <span className="font-semibold text-amber-700">{unpaidCount} pendente(s)</span>
                        ) : (
                          <span className="text-emerald-700 font-semibold">Quitado</span>
                        )}
                        {totalPaid > 0 && <span> • Pago: {formatMoney(totalPaid)}</span>}
                      </div>
                    </td>

                    {/* Action Financeira - Espaço amplo, 100% visível, sem corte no botão Pagar */}
                    <td className="px-3.5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                        {/* Botão Pagar direto */}
                        {pendingBalance > 0 && (
                          <button
                            id={`btn-pagar-direto-${w.id}`}
                            type="button"
                            onClick={() => handleDirectPayWorker(w)}
                            className="h-8 px-3 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white transition-all cursor-pointer shrink-0 shadow-2xs whitespace-nowrap"
                            title={`Efetivar pagamento imediato de ${formatMoney(pendingBalance)}`}
                          >
                            <CreditCard className="w-3.5 h-3.5 shrink-0" />
                            <span>Pagar</span>
                          </button>
                        )}

                        {/* Botão Reverter (apenas quando já houver pagamento efetuado) */}
                        {totalPaid > 0 && (
                          <button
                            id={`btn-reverter-worker-${w.id}`}
                            type="button"
                            onClick={() => handleOpenRevertForWorker(w)}
                            className="h-8 px-2.5 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 border border-rose-200 transition-all cursor-pointer shrink-0 shadow-2xs whitespace-nowrap"
                            title="Reverter pagamento efetuado (registra justificativa)"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span>Reverter</span>
                          </button>
                        )}

                        {/* Botão Único de Recibo */}
                        {lastReceipt ? (
                          <button
                            type="button"
                            onClick={() => setActiveReceiptPayment(lastReceipt)}
                            className="h-8 px-2.5 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 active:scale-95 text-blue-700 border border-blue-200 transition-all cursor-pointer shrink-0 shadow-2xs whitespace-nowrap"
                            title={`Visualizar recibo gerado #${lastReceipt.receiptNumber}`}
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>Recibo</span>
                          </button>
                        ) : pendingBalance > 0 ? (
                          <button
                            type="button"
                            onClick={() => handleOpenPaymentModal(w)}
                            className="h-8 px-2.5 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 border border-slate-200 transition-all cursor-pointer shrink-0 shadow-2xs whitespace-nowrap"
                            title="Personalizar pagamento e emitir recibo"
                          >
                            <FileSignature className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                            <span>Recibo</span>
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: RECIBOS EMITIDOS PARA ASSINATURA */}
      {activeTab === 'recibos' && (
        <div className="space-y-4">
          {/* Filter Receipts */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por recibo, nome ou CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value as any)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Todas">Todas as Formas</option>
                <option value="PIX">PIX</option>
                <option value="Dinheiro">Dinheiro</option>
                <option value="Transferência">Transferência</option>
              </select>
            </div>
          </div>

          {filteredReceipts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
              <FileSignature className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-700">Nenhum recibo emitido encontrado</h3>
              <p className="text-xs text-slate-400 mt-1">
                Ao registrar pagamentos para os trabalhadores, os recibos oficiais de quitação aparecerão aqui.
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Receipts Cards */}
              <div className="block md:hidden space-y-3">
                {filteredReceipts.map(p => (
                  <div key={p.id} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="font-mono font-bold text-slate-900 text-xs">{p.receiptNumber}</span>
                        <div className="text-[10px] text-slate-500 mt-0.5">{formatDate(p.date)}</div>
                      </div>
                      <div>
                        {p.isReverted ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                            <RotateCcw className="w-3 h-3 text-rose-600" />
                            <span>Estornado</span>
                          </span>
                        ) : p.signedByWorker ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Assinado</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                            <Clock className="w-3 h-3" />
                            <span>Pendente</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-b border-slate-100 py-2">
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{p.workerName}</div>
                        <div className="text-[11px] text-slate-500">CPF: {maskCpf(p.workerCpf)}</div>
                        <div className="text-[10px] text-emerald-700 font-bold mt-0.5">
                          {p.paymentMethod} • {p.workerRole}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-semibold block uppercase">Valor Líquido</span>
                        <span className="font-black text-sm text-slate-900">{formatMoney(p.amount)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setActiveReceiptPayment(p)}
                        className="flex-1 h-9 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-2xs active:scale-95"
                      >
                        <Printer className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Imprimir / Ver Recibo</span>
                      </button>

                      {!p.isReverted && (
                        <button
                          id={`btn-reverter-recibo-mob-${p.id}`}
                          type="button"
                          onClick={() => handleOpenRevertForReceipt(p)}
                          className="h-9 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-2xs active:scale-95"
                          title="Reverter este pagamento"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                          <span>Reverter</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Receipts Table */}
              <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <table className="w-full text-left text-xs table-fixed">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="w-[16%] px-3 py-3.5">Nº Recibo & Data</th>
                      <th className="w-[28%] px-3 py-3.5">Trabalhador & CPF</th>
                      <th className="w-[20%] px-3 py-3.5">Referência / Função</th>
                      <th className="w-[14%] px-3 py-3.5 text-right">Valor Líquido</th>
                      <th className="w-[22%] px-3 py-3.5 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredReceipts.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-3 py-3.5 truncate">
                          <div className="font-mono font-bold text-slate-900 text-xs">{p.receiptNumber}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{formatDate(p.date)}</div>
                        </td>

                        <td className="px-3 py-3.5 truncate">
                          <div className="font-bold text-slate-900 truncate text-xs">{p.workerName}</div>
                          <div className="text-[11px] text-slate-500 truncate mt-0.5">
                            CPF: {maskCpf(p.workerCpf)}
                          </div>
                        </td>

                        <td className="px-3 py-3.5 truncate text-slate-600">
                          <div className="font-semibold text-slate-800 truncate">{p.referencePeriod}</div>
                          <div className="text-[10px] text-emerald-700 font-bold mt-0.5">
                            {p.paymentMethod} • {p.workerRole}
                          </div>
                        </td>

                        <td className="px-3 py-3.5 text-right font-black text-slate-900 text-sm truncate">
                          {formatMoney(p.amount)}
                        </td>

                        <td className="px-3 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setActiveReceiptPayment(p)}
                              className="h-8 px-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs whitespace-nowrap active:scale-95"
                              title="Visualizar ou imprimir recibo"
                            >
                              <Printer className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>Recibo</span>
                            </button>

                            {!p.isReverted && (
                              <button
                                id={`btn-reverter-recibo-${p.id}`}
                                type="button"
                                onClick={() => handleOpenRevertForReceipt(p)}
                                className="h-8 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs whitespace-nowrap active:scale-95"
                                title="Reverter este pagamento com justificativa registrada"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                <span>Reverter</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 3: MATRIZ DE PRESENÇAS SEMANAL */}
      {activeTab === 'semanal' && (
        <div className="space-y-4">
          <SetorPagamentoSemanal onOpenReceiptsTab={() => setActiveTab('recibos')} />
        </div>
      )}

      {/* TAB 4: HISTÓRICO DE REVERSÕES DE PAGAMENTO */}
      {activeTab === 'reversoes' && (
        <div className="space-y-4">
          {/* Header Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Total de Reversões</span>
              <div className="text-xl font-black text-rose-700 mt-1">
                {paymentReversals.length}
              </div>
              <span className="text-[11px] text-slate-400">Estornos com justificativa auditada</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Valor Total Revertido</span>
              <div className="text-xl font-black text-slate-900 mt-1">
                {formatMoney(paymentReversals.reduce((acc, r) => acc + r.amount, 0))}
              </div>
              <span className="text-[11px] text-emerald-700 font-medium">Valores estornados para novo pagamento</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Trabalhadores Impactados</span>
              <div className="text-xl font-black text-amber-700 mt-1">
                {new Set(paymentReversals.map(r => r.workerId)).size}
              </div>
              <span className="text-[11px] text-slate-400">Registros corrigidos no sistema</span>
            </div>
          </div>

          {/* Reversals List Table */}
          {paymentReversals.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2 shadow-xs">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <History className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Nenhum pagamento revertido até o momento</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Quando um pagamento for cancelado ou estornado por engano, a justificativa e os dados da transação ficarão registrados aqui para conformidade e auditoria.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs table-fixed">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="w-[20%] px-3 py-3.5">Data & Hora</th>
                    <th className="w-[25%] px-3 py-3.5">Trabalhador</th>
                    <th className="w-[15%] px-3 py-3.5 text-right">Valor Revertido</th>
                    <th className="w-[25%] px-3 py-3.5">Justificativa Registrada</th>
                    <th className="w-[15%] px-3 py-3.5 text-right">Responsável</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paymentReversals.map((rev) => (
                    <tr key={rev.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-3 py-3.5 truncate">
                        <div className="font-semibold text-slate-900">{formatDate(rev.date)}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(rev.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      <td className="px-3 py-3.5 truncate">
                        <div className="font-bold text-slate-900 truncate">{rev.workerName}</div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {rev.referencePeriod || 'Semana de trabalho'}
                        </div>
                      </td>

                      <td className="px-3 py-3.5 text-right font-black text-rose-700 text-sm truncate">
                        {formatMoney(rev.amount)}
                      </td>

                      <td className="px-3 py-3.5">
                        <div className="p-2 bg-rose-50 border border-rose-100 rounded-lg text-rose-950 text-xs font-medium leading-relaxed">
                          {rev.reason}
                        </div>
                      </td>

                      <td className="px-3 py-3.5 text-right truncate">
                        <div className="font-bold text-slate-900 truncate">{rev.revertedByName}</div>
                        <div className="text-[10px] text-slate-400 truncate">{rev.revertedByRole}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL: REGISTRAR PAGAMENTO E GERAR RECIBO */}
      {isRegisterModalOpen && activeWorker && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 p-5 sm:p-6 space-y-4 max-h-[95vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Registrar Pagamento de Trabalhador</h3>
                  <p className="text-[11px] text-slate-500">Gera recibo oficial para assinatura e quita as diárias selecionadas</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Worker Preview Card */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center font-bold text-slate-700 overflow-hidden shrink-0">
                {activeWorker.avatar ? (
                  <img src={activeWorker.avatar} alt={activeWorker.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{activeWorker.name.charAt(0)}</span>
                )}
              </div>
              <div className="truncate min-w-0">
                <div className="font-bold text-slate-900 text-sm truncate">{activeWorker.name}</div>
                <div className="text-xs text-emerald-700 font-semibold truncate">
                  {activeWorker.role} • CPF: {maskCpf(activeWorker.cpf)}
                </div>
                {activeWorker.pixKey && (
                  <div className="text-[10px] text-slate-500 truncate">
                    Chave PIX: {maskPixKey(activeWorker.pixKey, activeWorker.pixType)} ({activeWorker.pixType || 'PIX'})
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-4 text-xs">
              {/* Diarias selection (if any) */}
              {workerUnpaidDiarias.length > 0 ? (
                <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-2">
                  <div className="flex items-center justify-between font-bold text-slate-700 text-xs">
                    <span>Diárias Pendentes a Quitar:</span>
                    <span className="text-emerald-700 text-[11px]">
                      {selectedDiariaIds.length} de {workerUnpaidDiarias.length} selecionada(s)
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {workerUnpaidDiarias.map(d => {
                      const isChecked = selectedDiariaIds.includes(d.id);
                      return (
                        <label
                          key={d.id}
                          className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                            isChecked ? 'bg-emerald-50/60 border-emerald-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleDiaria(d.id, d.amount)}
                              className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                            <div className="truncate">
                              <span className="font-bold text-slate-800">{formatDate(d.date)}</span>
                              <span className="text-slate-500 ml-1.5">({d.activityType} - {d.shift || 'Integral'})</span>
                            </div>
                          </div>
                          <span className="font-bold text-slate-900 shrink-0 ml-2">
                            {formatMoney(d.amount)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-700">
                  ℹ️ Não há diárias pendentes registradas no sistema para este trabalhador. O pagamento será registrado como adiantamento ou pagamento avulso.
                </div>
              )}

              {/* Amount and Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Valor a Pagar (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={paymentAmount || ''}
                    onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm font-black text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Forma de Pagamento *
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="PIX">PIX</option>
                    <option value="Dinheiro">Dinheiro em Espécie</option>
                    <option value="Transferência">Transferência / TED</option>
                  </select>
                </div>
              </div>

              {/* Reference and Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Referência / Período do Recibo *
                  </label>
                  <input
                    type="text"
                    value={referencePeriod}
                    onChange={(e) => setReferencePeriod(e.target.value)}
                    placeholder="Ex: Semana 31/08 a 06/09"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Data do Pagamento *
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    required
                  />
                </div>
              </div>

              {/* Delivered By */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Responsável pelo Pagamento / Pagador
                </label>
                <input
                  type="text"
                  value={deliveredBy}
                  onChange={(e) => setDeliveredBy(e.target.value)}
                  placeholder="Nome do responsável financeiro"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Observações / Detalhes da Transação (Opcional)
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="ID da transação PIX ou detalhes da entrega"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              {formError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <FileSignature className="w-4 h-4" />
                  <span>Registrar Pagamento & Gerar Recibo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ACTIVE RECEIPT MODAL (FOR IMMEDIATE SIGNATURE OR PRINTING) */}
      {activeReceiptPayment && (
        <ReciboAssinaturaModal
          payment={activeReceiptPayment}
          onClose={() => setActiveReceiptPayment(null)}
          onToggleSignature={togglePaymentSigned}
        />
      )}

      {/* REVERSAL MODAL WITH JUSTIFICATION */}
      {revertingPaymentData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-rose-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base">Reverter Pagamento</h3>
                  <p className="text-xs text-rose-100">Estorno com registro obrigatório de justificativa</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRevertingPaymentData(null)}
                className="p-1 hover:bg-white/10 rounded-lg text-rose-200 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleConfirmReversal} className="p-5 space-y-4">
              {/* Worker Details & Amount */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm overflow-hidden shrink-0">
                    {revertingPaymentData.avatar ? (
                      <img src={revertingPaymentData.avatar} alt={revertingPaymentData.workerName} className="w-full h-full object-cover" />
                    ) : (
                      <span>{revertingPaymentData.workerName.charAt(0)}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 text-sm truncate">{revertingPaymentData.workerName}</div>
                    <div className="text-xs text-slate-500 truncate">
                      {revertingPaymentData.workerRole} {revertingPaymentData.coordinatorName ? `• ${revertingPaymentData.coordinatorName}` : ''}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[11px] text-slate-500 font-medium">Valor a Estornar</div>
                  <div className="text-base font-black text-rose-700">
                    {formatMoney(revertingPaymentData.amount)}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {revertingPaymentData.diariaIds.length} diária(s) quitadas
                  </div>
                </div>
              </div>

              {/* Warning Notice */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold">Atenção:</span> As diárias vinculadas voltarão ao status de aguardando pagamento para que possam ser reprocessadas. A justificativa informada abaixo ficará permanentemente registrada no histórico de auditoria financeira.
                </div>
              </div>

              {/* Justification Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Justificativa da Reversão (Obrigatório) *
                </label>
                <textarea
                  value={revertReason}
                  onChange={(e) => {
                    setRevertReason(e.target.value);
                    if (revertError) setRevertError('');
                  }}
                  rows={3}
                  placeholder="Ex: Pagamento registrado por engano no sistema, valor divergente ou necessidade de reprocessar comprovante..."
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white resize-none"
                  required
                />

                {/* Fast Suggestions */}
                <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-400 font-medium">Sugestões rápidas:</span>
                  {[
                    'Clicado por engano no sistema',
                    'Valor incorreto ou divergente',
                    'Falta não computada previamente',
                    'Necessidade de retificação cadastral'
                  ].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => {
                        setRevertReason(sug);
                        if (revertError) setRevertError('');
                      }}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                    >
                      {sug}
                    </button>
                  ))}
                </div>

                {revertError && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{revertError}</span>
                  </p>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRevertingPaymentData(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!revertReason.trim() || isSubmittingRevert}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isSubmittingRevert ? 'Revertendo...' : 'Confirmar Reversão'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
