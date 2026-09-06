'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { DailyRecord, Worker, FinancialPayment, PaymentMethod } from '../../types';
import { formatMoney, formatDate, maskPixKey, maskCpf, exportToCsv } from '../../utils/formatters';
import { ReciboAssinaturaModal } from '../financeiro/ReciboAssinaturaModal';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  Copy, 
  Check, 
  Download, 
  FileText, 
  AlertCircle, 
  DollarSign, 
  Users, 
  Calendar,
  X,
  ShieldCheck,
  Building2,
  Send,
  RotateCcw,
  History,
  FileSignature,
  Banknote,
  Printer,
  ExternalLink
} from 'lucide-react';

interface SetorPagamentoSemanalProps {
  /** If provided, limits the workers to those belonging to these coordinator IDs */
  allowedCoordinatorIds?: string[];
  /** Custom title for the section */
  title?: string;
  /** Subtitle description */
  subtitle?: string;
  /** Whether this is rendered in Gestor view */
  isGestorProfile?: boolean;
  /** Callback to open the full receipts tab when rendered inside PagamentosView */
  onOpenReceiptsTab?: () => void;
}

export const SetorPagamentoSemanal: React.FC<SetorPagamentoSemanalProps> = ({
  allowedCoordinatorIds,
  title = 'Setor de Pagamento de Cada Trabalhador (Relatório Semanal)',
  subtitle = 'Consolidação financeira semanal: acompanhe presenças, valor total calculado (dias × diária) e realize os pagamentos via PIX.',
  isGestorProfile = false,
  onOpenReceiptsTab,
}) => {
  const { 
    currentUser, 
    workers, 
    diarias, 
    absences,
    executeBatchPayment,
    payWorkerWeekly,
    revertPayment,
    paymentReversals,
    financialPayments,
    togglePaymentSigned,
    addDiaria,
    approveDiaria,
    showNotification 
  } = useApp();

  const isAdmin = currentUser?.role === 'admin';
  const isGestor = currentUser?.role === 'gestor' || isGestorProfile;

  // Week offset state (0 = current week, -1 = last week, +1 = next week)
  const [weekOffset, setWeekOffset] = useState<number>(0);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCoord, setSelectedCoord] = useState('Todos');
  const [selectedStatus, setSelectedStatus] = useState<'Todos' | 'Aguardando Pagamento' | 'Pago' | 'Pendente Aprovação' | 'Sem Diárias'>('Todos');

  // Multi-selection for batch payment in the current week
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);

  // Modal for confirming worker's weekly payment
  const [payingWorkerData, setPayingWorkerData] = useState<{
    worker: Worker;
    diariasToPay: DailyRecord[];
    totalAmount: number;
    daysCount: number;
  } | null>(null);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('PIX');
  const [payModalNotes, setPayModalNotes] = useState('');
  const [isSubmittingPay, setIsSubmittingPay] = useState(false);

  // Active receipt modal:
  const [activeReceiptPayment, setActiveReceiptPayment] = useState<FinancialPayment | null>(null);

  // Receipts Drawer / Area state:
  const [isReceiptsAreaOpen, setIsReceiptsAreaOpen] = useState(false);
  const [receiptsSearchTerm, setReceiptsSearchTerm] = useState('');
  const [receiptsMethodFilter, setReceiptsMethodFilter] = useState<'Todas' | 'PIX' | 'Dinheiro' | 'Transferência'>('Todas');

  // Modal for reverting worker's weekly payment with registered justification
  const [revertingWorkerData, setRevertingWorkerData] = useState<{
    worker: Worker;
    paidDiarias: DailyRecord[];
    totalAmount: number;
    referencePeriod: string;
  } | null>(null);
  const [revertReason, setRevertReason] = useState('');
  const [revertError, setRevertError] = useState('');
  const [isSubmittingRevert, setIsSubmittingRevert] = useState(false);

  // Viewing reversals audit modal state
  const [viewingReversalsWorker, setViewingReversalsWorker] = useState<Worker | null>(null);

  // Copied PIX feedback state: workerId -> boolean
  const [copiedPixWorkerId, setCopiedPixWorkerId] = useState<string | null>(null);

  // 1. Calculate the 7 days of the selected week (Monday to Sunday)
  const weekInfo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + (weekOffset * 7));
    // Monday of this week
    const day = d.getDay(); // 0 is Sunday, 1 is Monday...
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));

    const days = [];
    const dayNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    for (let i = 0; i < 7; i++) {
      const current = new Date(monday);
      current.setDate(monday.getDate() + i);
      const dateStr = current.toISOString().split('T')[0];
      const dayMonth = `${String(current.getDate()).padStart(2, '0')}/${String(current.getMonth() + 1).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayLabel: dayNames[i],
        dayMonth,
        fullDate: current
      });
    }

    const startStr = days[0].dayMonth;
    const endStr = days[6].dayMonth;
    return {
      monday,
      days,
      formattedLabel: `${startStr} a ${endStr}`,
      year: monday.getFullYear(),
      isCurrentWeek: weekOffset === 0
    };
  }, [weekOffset]);

  // 2. Base list of workers (filtered by allowedCoordinatorIds if provided)
  const baseWorkers = useMemo(() => {
    if (!allowedCoordinatorIds || allowedCoordinatorIds.length === 0) {
      return workers;
    }
    return workers.filter(w => allowedCoordinatorIds.includes(w.coordinatorId));
  }, [workers, allowedCoordinatorIds]);

  // Available coordinators for dropdown filter
  const availableCoordinators = useMemo(() => {
    const list = Array.from(new Set(baseWorkers.map(w => w.coordinatorName).filter(Boolean)));
    return list.sort();
  }, [baseWorkers]);

  // 3. Consolidate weekly data for each worker
  const weeklyWorkersData = useMemo(() => {
    return baseWorkers.map(worker => {
      // Find all diarias for this worker in the 7 days of the week
      const weekDiarias = diarias.filter(d => 
        d.workerId === worker.id && 
        weekInfo.days.some(day => day.dateStr === d.date) &&
        d.status !== 'Cancelada' &&
        d.status !== 'Rejeitada'
      );

      // Build daily breakdown
      const daysStatus = weekInfo.days.map(day => {
        const diaria = weekDiarias.find(d => d.date === day.dateStr);
        const absence = absences.find(a => a.workerId === worker.id && a.date === day.dateStr);

        return {
          dateStr: day.dateStr,
          dayLabel: day.dayLabel,
          dayMonth: day.dayMonth,
          hasDiaria: !!diaria,
          diaria,
          absenceReason: absence ? absence.reason : null
        };
      });

      const workedDaysCount = daysStatus.filter(d => d.hasDiaria).length;
      const rate = worker.standardRate || 80;
      const totalWeeklyAmount = workedDaysCount * rate;

      // Classify financial status for the week:
      const paidDiarias = weekDiarias.filter(d => d.status === 'Paga');
      const approvedDiarias = weekDiarias.filter(d => d.status === 'Aprovada');
      const pendingDiarias = weekDiarias.filter(d => (d.status as string) === 'Pendente' || d.status === 'Aguardando aprovação');
      const unpaidDiarias = weekDiarias.filter(d => d.status !== 'Paga' && d.status !== 'Rejeitada' && d.status !== 'Cancelada');

      const amountPaid = paidDiarias.reduce((acc, curr) => acc + curr.amount, 0);
      const amountApproved = approvedDiarias.reduce((acc, curr) => acc + curr.amount, 0);
      const amountPending = pendingDiarias.reduce((acc, curr) => acc + curr.amount, 0);
      const amountUnpaid = unpaidDiarias.reduce((acc, curr) => acc + curr.amount, 0);

      let paymentStatus: 'Sem Diárias' | 'Pago' | 'Aguardando Pagamento' | 'Pendente Aprovação' = 'Sem Diárias';
      if (weekDiarias.length > 0 || workedDaysCount > 0) {
        if ((paidDiarias.length > 0 && unpaidDiarias.length === 0) || (workedDaysCount > 0 && amountPaid >= totalWeeklyAmount && totalWeeklyAmount > 0)) {
          paymentStatus = 'Pago';
        } else if (unpaidDiarias.length > 0 || workedDaysCount > 0) {
          paymentStatus = 'Aguardando Pagamento';
        } else {
          paymentStatus = 'Sem Diárias';
        }
      }

      return {
        worker,
        daysStatus,
        workedDaysCount,
        rate,
        totalWeeklyAmount,
        weekDiarias,
        paidDiarias,
        approvedDiarias,
        pendingDiarias,
        unpaidDiarias,
        amountPaid,
        amountApproved,
        amountPending,
        amountUnpaid,
        paymentStatus
      };
    });
  }, [baseWorkers, diarias, absences, weekInfo]);

  // 4. Apply filters (search, coordinator, status)
  const filteredData = useMemo(() => {
    return weeklyWorkersData.filter(item => {
      // Coordinator filter
      if (selectedCoord !== 'Todos' && item.worker.coordinatorName !== selectedCoord) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'Todos' && item.paymentStatus !== selectedStatus) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = item.worker.name.toLowerCase().includes(q);
        const matchRole = item.worker.role.toLowerCase().includes(q);
        const matchCoord = item.worker.coordinatorName.toLowerCase().includes(q);
        const matchPix = (item.worker.pixKey || '').toLowerCase().includes(q);
        if (!matchName && !matchRole && !matchCoord && !matchPix) {
          return false;
        }
      }

      return true;
    });
  }, [weeklyWorkersData, selectedCoord, selectedStatus, searchTerm]);

  // 5. Aggregate KPIs for this week
  const kpis = useMemo(() => {
    let totalPayable = 0;
    let totalPaid = 0;
    let totalPendingApproval = 0;
    let totalDaysWorked = 0;
    let workersWithActivity = 0;

    weeklyWorkersData.forEach(item => {
      totalPayable += item.amountApproved;
      totalPaid += item.amountPaid;
      totalPendingApproval += item.amountPending;
      totalDaysWorked += item.workedDaysCount;
      if (item.workedDaysCount > 0) {
        workersWithActivity++;
      }
    });

    return {
      totalPayable,
      totalPaid,
      totalPendingApproval,
      totalDaysWorked,
      workersWithActivity,
      grandTotalWeek: totalPayable + totalPaid + totalPendingApproval
    };
  }, [weeklyWorkersData]);

  // Copy PIX handler
  const handleCopyPix = (worker: Worker) => {
    if (!worker.pixKey) {
      showNotification('Este trabalhador não possui chave PIX cadastrada.');
      return;
    }
    navigator.clipboard.writeText(worker.pixKey);
    setCopiedPixWorkerId(worker.id);
    showNotification(`Chave PIX de ${worker.name} copiada!`);
    setTimeout(() => {
      setCopiedPixWorkerId(null);
    }, 2500);
  };

  // Helper to find or generate receipt for a worker
  const getWorkerReceipt = (worker: Worker, paidDiarias: DailyRecord[]): FinancialPayment => {
    // 1. Try to find an existing receipt for this worker in financialPayments
    const existing = financialPayments.find(p => p.workerId === worker.id);
    if (existing) return existing;

    // 2. Fallback receipt on-the-fly
    const totalAmount = paidDiarias.reduce((acc, d) => acc + d.amount, 0) || worker.standardRate;
    return {
      id: `rec_sem_${worker.id}_${Date.now()}`,
      receiptNumber: `REC-${new Date().getFullYear()}-${worker.id.slice(-4).toUpperCase()}`,
      workerId: worker.id,
      workerName: worker.name,
      workerCpf: worker.cpf,
      workerRole: worker.role,
      date: paidDiarias[0]?.date || new Date().toISOString().split('T')[0],
      amount: totalAmount,
      paymentMethod: worker.preferredPaymentMethod || 'PIX',
      referencePeriod: `Semana ${weekInfo.formattedLabel}`,
      diariaIds: paidDiarias.map(d => d.id),
      pixKey: worker.pixKey,
      pixType: worker.pixType,
      bankName: worker.bankName,
      deliveredByName: currentUser?.name || 'Administração Financeira',
      notes: `Pagamento semanal referente a ${paidDiarias.length} diária(s)`,
      createdAt: new Date().toISOString(),
      createdById: currentUser?.id || 'admin',
      createdByName: currentUser?.name || 'Administração'
    };
  };

  // Open worker weekly payment modal to choose payment method & review details
  const handleOpenPayModal = (item: typeof weeklyWorkersData[0]) => {
    let toPay = item.unpaidDiarias;

    // If there are days marked present that don't have diárias yet, create them so they are registered and paid
    if (toPay.length === 0 && item.workedDaysCount > 0) {
      const datesToCreate = item.daysStatus
        .filter(ds => ds.hasDiaria && !ds.diaria)
        .map(ds => ds.dateStr);

      datesToCreate.forEach(date => {
        addDiaria({
          workerId: item.worker.id,
          workerName: item.worker.name,
          workerRole: item.worker.role,
          coordinatorId: item.worker.coordinatorId,
          coordinatorName: item.worker.coordinatorName,
          teamZone: item.worker.teamZone,
          city: item.worker.city || 'Belém',
          location: item.worker.teamZone || 'Zona de Campanha',
          activityType: 'Panfletagem',
          date: date,
          amount: item.rate,
          paymentMethod: item.worker.preferredPaymentMethod || 'PIX',
          shift: 'Integral',
          notes: `Presença confirmada semana ${weekInfo.formattedLabel}`
        });
      });
      toPay = item.unpaidDiarias.length > 0 ? item.unpaidDiarias : item.approvedDiarias;
    }

    if (toPay.length === 0 && item.workedDaysCount === 0) {
      if (item.paidDiarias.length > 0) {
        showNotification('Todas as diárias desta semana já estão quitadas.');
      } else {
        showNotification('Nenhuma presença registrada para pagamento nesta semana.');
      }
      return;
    }

    const calculatedAmount = toPay.reduce((acc, d) => acc + d.amount, 0) || (item.totalWeeklyAmount - item.amountPaid) || item.rate;
    const daysCount = toPay.length > 0 ? toPay.length : item.workedDaysCount;

    setPayingWorkerData({
      worker: item.worker,
      diariasToPay: toPay,
      totalAmount: calculatedAmount,
      daysCount: daysCount
    });
    setPayMethod(item.worker.preferredPaymentMethod || 'PIX');
    setPayModalNotes(`Pagamento Fechamento Semanal (${weekInfo.formattedLabel})`);
  };

  // Direct payment trigger redirects to the modal so user can view/confirm method & receive receipt
  const handleDirectPayWorker = (item: typeof weeklyWorkersData[0]) => {
    handleOpenPayModal(item);
  };

  // Open revert payment modal
  const handleOpenRevertModal = (item: typeof weeklyWorkersData[0]) => {
    if (item.paidDiarias.length === 0) {
      showNotification('Não há pagamentos registrados para este trabalhador nesta semana para reverter.');
      return;
    }
    setRevertingWorkerData({
      worker: item.worker,
      paidDiarias: item.paidDiarias,
      totalAmount: item.amountPaid,
      referencePeriod: `Semana ${weekInfo.formattedLabel}`
    });
    setRevertReason('');
    setRevertError('');
  };

  // Confirm reversal with mandatory justification
  const handleConfirmReversal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revertingWorkerData) return;

    if (!revertReason.trim()) {
      setRevertError('A justificativa é obrigatória para registrar a reversão.');
      return;
    }

    setIsSubmittingRevert(true);
    try {
      const success = revertPayment({
        workerId: revertingWorkerData.worker.id,
        diariaIds: revertingWorkerData.paidDiarias.map(d => d.id),
        reason: revertReason.trim(),
        referencePeriod: revertingWorkerData.referencePeriod
      });

      if (success) {
        setRevertingWorkerData(null);
      }
    } catch (err) {
      showNotification('Erro ao reverter pagamento.');
    } finally {
      setIsSubmittingRevert(false);
    }
  };

  // Confirm single worker weekly payment and generate receipt for signature/print
  const handleConfirmWeeklyPayment = () => {
    if (!payingWorkerData) return;
    setIsSubmittingPay(true);

    try {
      const diariaIds = payingWorkerData.diariasToPay.map(d => d.id);
      
      const receipt = payWorkerWeekly(
        payingWorkerData.worker.id,
        diariaIds,
        {
          method: payMethod,
          notes: payModalNotes,
          referencePeriod: `Semana ${weekInfo.formattedLabel}`
        }
      );

      showNotification(`Pagamento de ${formatMoney(payingWorkerData.totalAmount)} para ${payingWorkerData.worker.name} realizado via ${payMethod}!`);
      
      const resultingReceipt = receipt || getWorkerReceipt(payingWorkerData.worker, payingWorkerData.diariasToPay);
      setPayingWorkerData(null);

      // Immediately display receipt for signature/print
      if (resultingReceipt) {
        setActiveReceiptPayment(resultingReceipt);
      }
    } catch (e) {
      showNotification('Erro ao processar pagamento semanal.');
    } finally {
      setIsSubmittingPay(false);
    }
  };

  // Quick Gestor batch approval of worker's week diarias
  const handleApproveWorkerWeek = (item: typeof weeklyWorkersData[0]) => {
    const toApprove = item.pendingDiarias;
    if (toApprove.length === 0) return;

    toApprove.forEach(d => approveDiaria(d.id));
    showNotification(`${toApprove.length} diárias de ${item.worker.name} aprovadas com sucesso!`);
  };

  // Batch Payment for selected workers in this week (Admin only)
  const handlePaySelectedWorkers = () => {
    if (selectedWorkerIds.length === 0) return;

    const allDiariasToPay: string[] = [];
    let totalSelectedAmount = 0;

    weeklyWorkersData.forEach(item => {
      if (selectedWorkerIds.includes(item.worker.id)) {
        item.approvedDiarias.forEach(d => {
          allDiariasToPay.push(d.id);
          totalSelectedAmount += d.amount;
        });
      }
    });

    if (allDiariasToPay.length === 0) {
      showNotification('Os trabalhadores selecionados não possuem diárias com status "Aprovada" para pagamento nesta semana.');
      return;
    }

    executeBatchPayment(allDiariasToPay, {
      deliveredByName: currentUser?.name || 'Administração',
      notes: `Pagamento em lote semanal (${weekInfo.formattedLabel})`
    });

    showNotification(`Pagamento em lote de ${formatMoney(totalSelectedAmount)} para ${selectedWorkerIds.length} trabalhadores processado com sucesso!`);
    setSelectedWorkerIds([]);
  };

  // Select all eligible workers
  const handleToggleSelectAll = () => {
    const eligible = filteredData.filter(i => i.approvedDiarias.length > 0).map(i => i.worker.id);
    if (selectedWorkerIds.length === eligible.length && eligible.length > 0) {
      setSelectedWorkerIds([]);
    } else {
      setSelectedWorkerIds(eligible);
    }
  };

  // Export CSV Report
  const handleExportCsv = () => {
    const headers = [
      'Trabalhador',
      'Função',
      'Coordenador',
      'Zona/Região',
      'Semana',
      'Dias Trabalhados',
      'Valor Diária (R$)',
      'Total Semanal (R$)',
      'Valor Pago (R$)',
      'Valor a Pagar (R$)',
      'Status Pagamento',
      'Tipo PIX',
      'Chave PIX',
      'Banco'
    ];

    const rows = filteredData.map(item => [
      item.worker.name,
      item.worker.role,
      item.worker.coordinatorName,
      item.worker.teamZone || 'Geral',
      weekInfo.formattedLabel,
      item.workedDaysCount,
      item.rate.toFixed(2),
      item.totalWeeklyAmount.toFixed(2),
      item.amountPaid.toFixed(2),
      item.amountApproved.toFixed(2),
      item.paymentStatus,
      item.worker.pixType || 'Não informado',
      item.worker.pixKey || '',
      item.worker.bankName || ''
    ]);

    exportToCsv(`fechamento_semanal_pagamentos_${weekInfo.formattedLabel.replace(/\s+/g, '_')}.csv`, headers, rows);
    showNotification('Relatório semanal exportado em CSV com sucesso!');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-0 w-full max-w-full">
      
      {/* 1. Header with Title and Week Navigator */}
      <div className="p-4 sm:p-5 bg-slate-50/90 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-2xs">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {title}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Week Selector Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-white border border-slate-300 rounded-xl px-2 py-1 shadow-2xs text-xs">
            <button
              onClick={() => setWeekOffset(prev => prev - 1)}
              title="Semana anterior"
              className="p-1.5 text-slate-600 hover:text-slate-950 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 px-2.5 sm:px-3 justify-center text-center">
              <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="font-black text-slate-900 text-xs truncate">
                Semana: {weekInfo.formattedLabel}
              </span>
            </div>
            <button
              onClick={() => setWeekOffset(prev => prev + 1)}
              title="Próxima semana"
              className="p-1.5 text-slate-600 hover:text-slate-950 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {!weekInfo.isCurrentWeek && (
            <button
              onClick={() => setWeekOffset(0)}
              className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all cursor-pointer"
            >
              Semana Atual
            </button>
          )}

          {/* Botão Área de Recibos */}
          <button
            type="button"
            onClick={() => {
              if (onOpenReceiptsTab) {
                onOpenReceiptsTab();
              } else {
                setIsReceiptsAreaOpen(true);
              }
            }}
            className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Abrir Área de Recibos Emitidos para Assinatura"
          >
            <FileSignature className="w-3.5 h-3.5 text-blue-600" />
            <span>Área de Recibos</span>
            <span className="px-1.5 py-0.2 bg-blue-600 text-white rounded-full text-[10px] font-bold">
              {financialPayments.length}
            </span>
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Exportar dados da semana em planilha CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Summary Strip for the Week */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-slate-50/40 border-b border-slate-200">
        
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Aguardando Pgto</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-amber-700">
            {formatMoney(kpis.totalPayable)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
            Diárias aprovadas para liberação
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Já Quitado</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg sm:text-xl font-black text-emerald-700">
            {formatMoney(kpis.totalPaid)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
            Pagamentos PIX confirmados
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Diárias Realizadas</span>
            <Calendar className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900">
            {kpis.totalDaysWorked} diárias
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
            Presenças validadas na semana
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Trabalhadores</span>
            <Users className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900">
            {kpis.workersWithActivity} / {baseWorkers.length}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
            Com presença ativa nesta semana
          </div>
        </div>

      </div>

      {/* 3. Search and Filters Bar */}
      <div className="p-3.5 sm:p-4 bg-white border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-lg">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por trabalhador, função ou chave PIX..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              title="Limpar busca"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Coordinator filter */}
          {availableCoordinators.length > 1 && (
            <select
              value={selectedCoord}
              onChange={e => setSelectedCoord(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="Todos">Todos os Coordenadores</option>
              {availableCoordinators.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="Todos">Todos os Status</option>
            <option value="Aguardando Pagamento">Aguardando Pagamento</option>
            <option value="Pago">100% Pago</option>
            <option value="Pendente Aprovação">Pendente Aprovação</option>
            <option value="Sem Diárias">Sem Diárias</option>
          </select>

          {/* Admin Batch Pay Action Button */}
          {isAdmin && selectedWorkerIds.length > 0 && (
            <button
              onClick={handlePaySelectedWorkers}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Pagar Selecionados ({selectedWorkerIds.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. Desktop Table View - 100% FIT - ZERO HORIZONTAL SCROLLBAR */}
      <div className="hidden md:block">
        <table className="w-full text-left text-xs table-fixed">
          <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200">
            <tr>
              <th className="w-[28%] px-3 py-3">
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <input
                      type="checkbox"
                      checked={
                        selectedWorkerIds.length > 0 &&
                        selectedWorkerIds.length === filteredData.filter(i => i.approvedDiarias.length > 0).length
                      }
                      onChange={handleToggleSelectAll}
                      className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                      title="Selecionar todos com diárias aprovadas"
                    />
                  )}
                  <span>Trabalhador</span>
                </div>
              </th>
              <th className="w-[19%] px-2 py-3 text-center">Presenças ({weekInfo.formattedLabel})</th>
              <th className="w-[13%] px-2 py-3 text-right">Total Semana</th>
              <th className="w-[13%] px-2 py-3 text-center">Status</th>
              <th className="w-[12%] px-2 py-3 text-center">Recibo</th>
              <th className="w-[15%] px-3 py-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">
                  Nenhum trabalhador encontrado para os filtros selecionados nesta semana.
                </td>
              </tr>
            ) : (
              filteredData.map(item => {
                const isSelected = selectedWorkerIds.includes(item.worker.id);
                const canPay = item.unpaidDiarias.length > 0 || (item.workedDaysCount > 0 && item.amountPaid < item.totalWeeklyAmount);
                const canRevert = item.paidDiarias.length > 0;
                const workerReversals = paymentReversals.filter(r => r.workerId === item.worker.id);
                const isCopied = copiedPixWorkerId === item.worker.id;

                return (
                  <tr 
                    key={item.worker.id}
                    className={`hover:bg-slate-50/70 transition-colors ${isSelected ? 'bg-emerald-50/40' : ''}`}
                  >
                    {/* Trabalhador info + checkbox */}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        {isAdmin && (
                          <input
                            type="checkbox"
                            disabled={!canPay}
                            checked={isSelected}
                            onChange={() => {
                              if (isSelected) {
                                setSelectedWorkerIds(prev => prev.filter(id => id !== item.worker.id));
                              } else {
                                setSelectedWorkerIds(prev => [...prev, item.worker.id]);
                              }
                            }}
                            className={`w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 shrink-0 ${
                              canPay ? 'cursor-pointer' : 'opacity-30 cursor-not-allowed'
                            }`}
                          />
                        )}
                        <img 
                          src={item.worker.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'} 
                          alt={item.worker.name} 
                          className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0" 
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-900 truncate text-xs">{item.worker.name}</div>
                          <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                            <span className="font-semibold text-emerald-700 truncate">{item.worker.role}</span>
                            <span>&bull;</span>
                            <span className="truncate">{item.worker.coordinatorName}</span>
                          </div>

                          {/* Chave PIX / Banco em baixo da função */}
                          {item.worker.pixKey ? (
                            <div className="flex items-center gap-1 min-w-0 mt-0.5">
                              <span className="text-[9px] bg-slate-100 text-slate-700 px-1 py-0.2 rounded font-bold shrink-0">
                                {item.worker.pixType || 'PIX'}
                              </span>
                              <span className="font-mono text-[10px] text-slate-600 truncate" title={item.worker.pixKey}>
                                {maskPixKey(item.worker.pixKey, item.worker.pixType)}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyPix(item.worker)}
                                className="p-0.5 text-slate-400 hover:text-emerald-700 rounded transition-colors cursor-pointer shrink-0"
                                title="Copiar Chave PIX"
                              >
                                {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              </button>
                              {item.worker.bankName && (
                                <span className="text-[9px] text-slate-400 truncate hidden sm:inline" title={item.worker.bankName}>
                                  &bull; {item.worker.bankName}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="text-[9px] text-slate-400 italic mt-0.5">Sem PIX</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 7 Days Attendance Pills */}
                    <td className="px-2 py-2.5 text-center">
                      <div className="inline-flex items-center gap-0.5 justify-center">
                        {item.daysStatus.map(day => (
                          <div
                            key={day.dateStr}
                            title={`${day.dayLabel} (${day.dayMonth}): ${
                              day.hasDiaria 
                                ? `Trabalhou (${day.diaria?.status})` 
                                : day.absenceReason 
                                ? `Faltou: ${day.absenceReason}` 
                                : 'Sem registro'
                            }`}
                            className={`w-5 h-6 rounded flex flex-col items-center justify-center text-[8px] font-bold border transition-all ${
                              day.hasDiaria
                                ? day.diaria?.status === 'Paga'
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                : day.diaria?.status === 'Aprovada'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-amber-100 text-amber-800 border-amber-300'
                                : day.absenceReason
                                ? 'bg-rose-100 text-rose-700 border-rose-200'
                                : 'bg-slate-50 text-slate-300 border-slate-200'
                            }`}
                          >
                            <span className="text-[7px] leading-none opacity-75">{day.dayLabel}</span>
                            <span className="leading-none mt-0.5">{day.hasDiaria ? '✓' : day.absenceReason ? '✗' : '-'}</span>
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Dias × Diária & Total Semanal */}
                    <td className="px-2 py-2.5 text-right">
                      <div className="text-xs font-black text-slate-900 truncate">
                        {formatMoney(item.totalWeeklyAmount)}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {item.workedDaysCount}d × {formatMoney(item.rate)}
                      </div>
                      {item.amountPaid > 0 && item.amountPaid < item.totalWeeklyAmount && (
                        <div className="text-[9px] text-emerald-700 font-bold truncate">
                          Pago: {formatMoney(item.amountPaid)}
                        </div>
                      )}
                    </td>

                    {/* Status do Pagamento */}
                    <td className="px-2 py-2.5 text-center">
                      {item.paymentStatus === 'Pago' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full text-[11px] font-bold whitespace-nowrap shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span>100% Quitado</span>
                        </span>
                      ) : canPay ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200/80 rounded-full text-[11px] font-bold whitespace-nowrap shadow-2xs" title="Aguardando pagamento">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                          <span>Aguardando</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-400 rounded-full text-[10px] font-medium whitespace-nowrap">
                          Sem Diárias
                        </span>
                      )}
                    </td>

                    {/* Coluna Dedicada para RECIBO */}
                    <td className="px-2 py-2.5 text-center">
                      {canRevert ? (
                        <button
                          id={`btn-recibo-${item.worker.id}`}
                          type="button"
                          onClick={() => {
                            const receipt = getWorkerReceipt(item.worker, item.paidDiarias);
                            setActiveReceiptPayment(receipt);
                          }}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 active:scale-95 text-blue-700 border border-blue-200/80 rounded-lg text-xs font-semibold shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                          title="Visualizar ou imprimir recibo oficial da semana"
                        >
                          <FileSignature className="w-3.5 h-3.5 text-blue-600" />
                          <span>Recibo</span>
                        </button>
                      ) : (
                        <span className="text-slate-300 text-xs">-</span>
                      )}
                    </td>

                    {/* Coluna Dedicada para AÇÕES FINANCEIRAS (PAGAR / REVERTER) */}
                    <td className="px-3 py-2.5 text-center">
                      {canPay ? (
                        <button
                          id={`btn-pagar-${item.worker.id}`}
                          type="button"
                          onClick={() => handleOpenPayModal(item)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                          title={`Pagar trabalhador e emitir recibo (${formatMoney(item.amountUnpaid || (item.totalWeeklyAmount - item.amountPaid))})`}
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Pagar</span>
                        </button>
                      ) : canRevert ? (
                        <div className="inline-flex items-center justify-center gap-1.5">
                          <button
                            id={`btn-reverter-${item.worker.id}`}
                            type="button"
                            onClick={() => handleOpenRevertModal(item)}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 border border-rose-200/80 rounded-lg text-xs font-semibold shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1"
                            title="Reverter pagamento efetuado por engano (registra justificativa)"
                          >
                            <RotateCcw className="w-3 h-3 text-rose-600" />
                            <span>Reverter</span>
                          </button>

                          {workerReversals.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setViewingReversalsWorker(item.worker)}
                              className="p-1.5 text-amber-600 hover:bg-amber-100/80 bg-amber-50 rounded-lg border border-amber-200/80 transition-colors cursor-pointer shrink-0"
                              title={`Ver histórico de reversão (${workerReversals.length} registro(s))`}
                            >
                              <History className="w-3.5 h-3.5 text-amber-600" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 5. Mobile Cards View */}
      <div className="divide-y divide-slate-100 md:hidden">
        {filteredData.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs">
            Nenhum trabalhador encontrado para os filtros selecionados nesta semana.
          </div>
        ) : (
          filteredData.map(item => {
            const canPay = item.unpaidDiarias.length > 0 || (item.workedDaysCount > 0 && item.amountPaid < item.totalWeeklyAmount);
            const canRevert = item.paidDiarias.length > 0;
            const workerReversals = paymentReversals.filter(r => r.workerId === item.worker.id);
            const isCopied = copiedPixWorkerId === item.worker.id;

            return (
              <div key={item.worker.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={item.worker.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                      alt={item.worker.name}
                      className="w-9 h-9 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <div className="font-bold text-slate-900 text-xs sm:text-sm">{item.worker.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {item.worker.role} &bull; Coord: {item.worker.coordinatorName}
                      </div>
                      {/* Chave PIX em baixo da função */}
                      {item.worker.pixKey ? (
                        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-600">
                          <span className="text-[9px] bg-slate-100 text-slate-700 px-1 py-0.2 rounded font-bold">
                            {item.worker.pixType || 'PIX'}
                          </span>
                          <span className="font-mono text-[10px] text-slate-700 truncate">
                            {maskPixKey(item.worker.pixKey, item.worker.pixType)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyPix(item.worker)}
                            className="p-0.5 text-slate-400 hover:text-emerald-700 cursor-pointer"
                            title="Copiar PIX"
                          >
                            {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400 italic mt-0.5">Sem PIX</div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-black text-slate-900">{formatMoney(item.totalWeeklyAmount)}</div>
                    <div className="text-[10px] text-slate-400">{item.workedDaysCount} dias × {formatMoney(item.rate)}</div>
                  </div>
                </div>

                {/* 7 Days Attendance Grid */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {item.daysStatus.map(day => (
                    <div
                      key={day.dateStr}
                      className={`p-1 rounded-md border text-[9px] font-bold ${
                        day.hasDiaria
                          ? day.diaria?.status === 'Paga'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : day.absenceReason
                          ? 'bg-rose-50 text-rose-800 border-rose-300'
                          : 'bg-slate-50 text-slate-300 border-slate-200'
                      }`}
                    >
                      <span className="block text-[7.5px] opacity-75">{day.dayLabel}</span>
                      <span>{day.hasDiaria ? '✓' : day.absenceReason ? '✗' : '-'}</span>
                    </div>
                  ))}
                </div>

                {/* Status & Bank Strip */}
                <div className="flex items-center justify-between gap-2 pt-1 text-xs border-t border-slate-100">
                  <div className="text-[10px] text-slate-500 truncate">
                    {item.worker.bankName ? (
                      <span>Banco: {item.worker.bankName}</span>
                    ) : (
                      <span>Pagamento Semanal</span>
                    )}
                  </div>

                  <div>
                    {item.paymentStatus === 'Pago' ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                        100% Quitado
                      </span>
                    ) : canPay ? (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold">
                        Aguardando
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded-full text-[10px]">
                        Sem Diárias
                      </span>
                    )}
                  </div>
                </div>

                {/* Mobile Actions */}
                <div className="flex flex-col gap-2 pt-1">
                  <div className="grid grid-cols-2 gap-2">
                    {canPay && (
                      <button
                        type="button"
                        onClick={() => handleOpenPayModal(item)}
                        className="col-span-2 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Pagar ({formatMoney(item.amountUnpaid || (item.totalWeeklyAmount - item.amountPaid))})</span>
                      </button>
                    )}

                    {canRevert && (
                      <button
                        type="button"
                        onClick={() => {
                          const receipt = getWorkerReceipt(item.worker, item.paidDiarias);
                          setActiveReceiptPayment(receipt);
                        }}
                        className="py-2 bg-blue-50 hover:bg-blue-100 active:scale-98 text-blue-700 border border-blue-200/80 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                      >
                        <FileSignature className="w-3.5 h-3.5 text-blue-600" />
                        <span>Recibo</span>
                      </button>
                    )}

                    {canRevert && (
                      <button
                        type="button"
                        onClick={() => handleOpenRevertModal(item)}
                        className="py-2 bg-rose-50 hover:bg-rose-100 active:scale-98 text-rose-700 border border-rose-200/80 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                        <span>Reverter</span>
                      </button>
                    )}
                  </div>

                  {workerReversals.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setViewingReversalsWorker(item.worker)}
                      className="w-full py-1 text-center text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 font-medium transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <History className="w-3 h-3 text-amber-600" />
                      <span>Ver {workerReversals.length} reversão(ões) com justificativa</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 6. Modal Confirmar Pagamento Semanal & Emitir Recibo */}
      {payingWorkerData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base">Registrar Pagamento & Emitir Recibo</h3>
                  <p className="text-xs text-slate-400">Escolha a forma de quitação e gere o recibo de assinatura</p>
                </div>
              </div>
              <button
                onClick={() => setPayingWorkerData(null)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              
              {/* Worker & Week info */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm overflow-hidden shrink-0 border border-slate-300">
                  {payingWorkerData.worker.avatar ? (
                    <img
                      src={payingWorkerData.worker.avatar}
                      alt={payingWorkerData.worker.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{payingWorkerData.worker.name.charAt(0)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 text-sm truncate">{payingWorkerData.worker.name}</div>
                  <div className="text-xs text-slate-500 truncate">
                    {payingWorkerData.worker.role} • CPF: {maskCpf(payingWorkerData.worker.cpf)}
                  </div>
                  <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                    Semana: {weekInfo.formattedLabel} &bull; {payingWorkerData.daysCount} diária(s) aprovada(s)
                  </div>
                </div>
              </div>

              {/* Total Amount Callout */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-center">
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider block">
                  Valor Total a Pagar
                </span>
                <span className="text-2xl sm:text-3xl font-black text-emerald-700 block mt-0.5">
                  {formatMoney(payingWorkerData.totalAmount)}
                </span>
                <span className="text-[11px] text-emerald-800 block mt-1">
                  Correspondente a {payingWorkerData.daysCount} dia(s) × {formatMoney(payingWorkerData.worker.standardRate || 80)}
                </span>
              </div>

              {/* FORMA DE PAGAMENTO SELECTION */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Forma de Pagamento *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['PIX', 'Dinheiro', 'Transferência'] as PaymentMethod[]).map((method) => {
                    const isSelected = payMethod === method;
                    return (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPayMethod(method)}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/80 text-emerald-800 shadow-2xs'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        {method === 'PIX' && <CreditCard className="w-4 h-4 text-emerald-600" />}
                        {method === 'Dinheiro' && <Banknote className="w-4 h-4 text-emerald-600" />}
                        {method === 'Transferência' && <Building2 className="w-4 h-4 text-emerald-600" />}
                        <span>{method}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Detalhes específicos de acordo com a Forma de Pagamento */}
              {payMethod === 'PIX' && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Chave PIX Cadastrada</span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      {payingWorkerData.worker.pixType || 'PIX'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono text-xs text-slate-800 break-all select-all">
                      {payingWorkerData.worker.pixKey || 'Não cadastrada'}
                    </div>
                    {payingWorkerData.worker.pixKey && (
                      <button
                        type="button"
                        onClick={() => handleCopyPix(payingWorkerData.worker)}
                        className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar</span>
                      </button>
                    )}
                  </div>

                  {payingWorkerData.worker.bankName && (
                    <div className="text-[11px] text-slate-500">
                      Titular: <strong className="text-slate-700">{payingWorkerData.worker.pixAccountHolder || payingWorkerData.worker.name}</strong> • Banco: <strong className="text-slate-700">{payingWorkerData.worker.bankName}</strong>
                    </div>
                  )}
                </div>
              )}

              {payMethod === 'Dinheiro' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                  <Banknote className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Pagamento Presencial em Espécie:</span> O valor de <strong>{formatMoney(payingWorkerData.totalAmount)}</strong> deve ser entregue em mãos. O recibo com campo de assinatura de quitação será aberto imediatamente após a confirmação.
                  </div>
                </div>
              )}

              {payMethod === 'Transferência' && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                  <div className="font-bold text-slate-700">Dados Bancários para Transferência:</div>
                  <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1">
                    <div>Banco: <strong className="text-slate-800">{payingWorkerData.worker.bankName || 'Não informado'}</strong></div>
                    <div>Titular: <strong className="text-slate-800">{payingWorkerData.worker.pixAccountHolder || payingWorkerData.worker.name}</strong></div>
                  </div>
                </div>
              )}

              {/* Notes / Comprovante */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Observações / Detalhes do Comprovante
                </label>
                <input
                  type="text"
                  value={payModalNotes}
                  onChange={e => setPayModalNotes(e.target.value)}
                  placeholder="Ex: Quitação semanal em mãos / Transferência via app"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Informação sobre emissão de recibo */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2 text-xs text-blue-900">
                <FileSignature className="w-4 h-4 text-blue-600 shrink-0" />
                <span>O <strong>Recibo Oficial de Quitação</strong> será gerado automaticamente para impressão ou assinatura.</span>
              </div>

            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setPayingWorkerData(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSubmittingPay}
                onClick={handleConfirmWeeklyPayment}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-black shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmittingPay ? 'Processando...' : 'Confirmar Pagamento & Emitir Recibo'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: ÁREA DE RECIBOS EMITIDOS (quando aberto pelo botão do cabeçalho) */}
      {isReceiptsAreaOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl">
                  <FileSignature className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Área de Recibos Emitidos para Assinatura</h3>
                  <p className="text-xs text-slate-400">Consulte, imprima ou visualize todos os recibos emitidos para os trabalhadores</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReceiptsAreaOpen(false)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por recibo, nome ou CPF..."
                  value={receiptsSearchTerm}
                  onChange={(e) => setReceiptsSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <select
                  value={receiptsMethodFilter}
                  onChange={(e) => setReceiptsMethodFilter(e.target.value as any)}
                  className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Todas">Todas as Formas</option>
                  <option value="PIX">PIX</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Transferência">Transferência</option>
                </select>
                <span className="text-xs text-slate-500 font-bold whitespace-nowrap">
                  Total: {financialPayments.length} recibo(s)
                </span>
              </div>
            </div>

            {/* Receipts List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {financialPayments
                .filter(p => {
                  const matchText = !receiptsSearchTerm || 
                    p.workerName.toLowerCase().includes(receiptsSearchTerm.toLowerCase()) ||
                    p.receiptNumber.toLowerCase().includes(receiptsSearchTerm.toLowerCase()) ||
                    (p.workerCpf && p.workerCpf.includes(receiptsSearchTerm));
                  const matchMethod = receiptsMethodFilter === 'Todas' || p.paymentMethod === receiptsMethodFilter;
                  return matchText && matchMethod;
                })
                .length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <FileSignature className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-sm font-bold text-slate-600">Nenhum recibo emitido encontrado</p>
                  <p className="text-xs">Ao clicar em "Pagar" para qualquer trabalhador, o recibo oficial de quitação será arquivado aqui.</p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
                      <tr>
                        <th className="px-3 py-2.5">Recibo</th>
                        <th className="px-3 py-2.5">Data</th>
                        <th className="px-3 py-2.5">Trabalhador</th>
                        <th className="px-3 py-2.5">Forma</th>
                        <th className="px-3 py-2.5 text-right">Valor</th>
                        <th className="px-3 py-2.5 text-center">Status</th>
                        <th className="px-3 py-2.5 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {financialPayments
                        .filter(p => {
                          const matchText = !receiptsSearchTerm || 
                            p.workerName.toLowerCase().includes(receiptsSearchTerm.toLowerCase()) ||
                            p.receiptNumber.toLowerCase().includes(receiptsSearchTerm.toLowerCase()) ||
                            (p.workerCpf && p.workerCpf.includes(receiptsSearchTerm));
                          const matchMethod = receiptsMethodFilter === 'Todas' || p.paymentMethod === receiptsMethodFilter;
                          return matchText && matchMethod;
                        })
                        .map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-3 py-2.5 font-mono font-bold text-blue-700">
                              {p.receiptNumber}
                            </td>
                            <td className="px-3 py-2.5 text-slate-600">
                              {formatDate(p.date)}
                            </td>
                            <td className="px-3 py-2.5 font-bold text-slate-900">
                              {p.workerName}
                              <div className="text-[10px] text-slate-400 font-normal">
                                {p.workerRole} {p.workerCpf ? `• ${maskCpf(p.workerCpf)}` : ''}
                              </div>
                            </td>
                            <td className="px-3 py-2.5">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                {p.paymentMethod}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-right font-black text-emerald-700">
                              {formatMoney(p.amount)}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              {p.signedByWorker ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                  <Check className="w-3 h-3" /> Assinado
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                  <Clock className="w-3 h-3" /> Pendente
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveReceiptPayment(p);
                                }}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                              >
                                <FileSignature className="w-3 h-3" />
                                <span>Ver Recibo</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-right">
              <button
                type="button"
                onClick={() => setIsReceiptsAreaOpen(false)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE RECIBO OFICIAL PARA VISUALIZAÇÃO E ASSINATURA */}
      {activeReceiptPayment && (
        <ReciboAssinaturaModal
          payment={activeReceiptPayment}
          onClose={() => setActiveReceiptPayment(null)}
          onToggleSignature={togglePaymentSigned}
        />
      )}

      {/* 7. Modal Reverter Pagamento com Justificativa Registrada */}
      {revertingWorkerData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-rose-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base">Reverter Pagamento</h3>
                  <p className="text-xs text-rose-100">Estorno de quitação com registro obrigatório de justificativa</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRevertingWorkerData(null)}
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
                    {revertingWorkerData.worker.avatar ? (
                      <img src={revertingWorkerData.worker.avatar} alt={revertingWorkerData.worker.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{revertingWorkerData.worker.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 text-sm truncate">{revertingWorkerData.worker.name}</div>
                    <div className="text-xs text-slate-500 truncate">
                      {revertingWorkerData.worker.role} • {revertingWorkerData.worker.coordinatorName}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[11px] text-slate-500 font-medium">Valor a Estornar</div>
                  <div className="text-base font-black text-rose-700">
                    {formatMoney(revertingWorkerData.totalAmount)}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {revertingWorkerData.paidDiarias.length} diária(s) quitadas
                  </div>
                </div>
              </div>

              {/* Warning Notice */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold">Atenção:</span> O status das diárias voltará para pendente de pagamento para que você possa pagar novamente ou efetuar ajustes. A justificativa informada abaixo ficará permanentemente registrada no histórico de auditoria.
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
                  onClick={() => setRevertingWorkerData(null)}
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

      {/* 8. Modal Histórico de Reversões de Pagamento */}
      {viewingReversalsWorker && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm">Histórico de Reversões</h3>
                  <p className="text-xs text-slate-400">{viewingReversalsWorker.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingReversalsWorker(null)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 max-h-[70vh] overflow-y-auto space-y-3">
              {paymentReversals.filter(r => r.workerId === viewingReversalsWorker.id).length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  Nenhuma reversão registrada para este trabalhador.
                </div>
              ) : (
                paymentReversals
                  .filter(r => r.workerId === viewingReversalsWorker.id)
                  .map((rev) => (
                    <div key={rev.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900">
                          {formatMoney(rev.amount)}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {formatDate(rev.date)}
                        </span>
                      </div>
                      <div className="text-xs text-rose-900 bg-rose-50 border border-rose-100 p-2.5 rounded-lg leading-relaxed">
                        <span className="font-bold">Justificativa: </span>
                        {rev.reason}
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                        <span>Responsável: <strong className="text-slate-700">{rev.revertedByName}</strong> ({rev.revertedByRole})</span>
                        {rev.referencePeriod && <span className="font-medium text-slate-600">{rev.referencePeriod}</span>}
                      </div>
                    </div>
                  ))
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 text-right">
              <button
                type="button"
                onClick={() => setViewingReversalsWorker(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
