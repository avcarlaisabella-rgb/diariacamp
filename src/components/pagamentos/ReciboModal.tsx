'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { DailyRecord } from '../../types';
import { formatMoney, formatDate, maskCpf } from '../../utils/formatters';
import { Printer, X, CheckCircle, ShieldCheck } from 'lucide-react';

interface ReciboModalProps {
  diaria: DailyRecord;
  receivedBy: string;
  deliveredByName: string;
  cashNotes?: string;
  onClose: () => void;
  onConfirmAndPay?: () => void;
  isAlreadyPaid?: boolean;
}

// Helper to convert number to simple Portuguese words
function numeroParaExtenso(valor: number): string {
  const inteiros = Math.floor(valor);
  const centavos = Math.round((valor - inteiros) * 100);

  const numeros: Record<number, string> = {
    80: 'oitenta reais',
    90: 'noventa reais',
    100: 'cem reais',
    120: 'cento e vinte reais',
    130: 'cento e trinta reais',
    150: 'cento e cinquenta reais',
    160: 'cento e sessenta reais',
    180: 'cento e oitenta reais',
    200: 'duzentos reais',
  };

  if (numeros[inteiros]) {
    return numeros[inteiros] + (centavos > 0 ? ` e ${centavos} centavos` : '');
  }

  return `${formatMoney(valor)} (valor em moeda corrente nacional)`;
}

export const ReciboModal: React.FC<ReciboModalProps> = ({
  diaria,
  receivedBy,
  deliveredByName,
  cashNotes,
  onClose,
  onConfirmAndPay,
  isAlreadyPaid = false,
}) => {
  const receiptNum = diaria.receiptNumber || `REC-${new Date().getFullYear()}-${diaria.id.replace(/\D/g, '').slice(-4) || '1042'}`;
  const todayFormatted = formatDate(diaria.paidAt?.split('T')[0] || diaria.date || new Date().toISOString().split('T')[0]);

  const handlePrint = () => {
    window.print();
  };

  return createPortal(
    <div className="receipt-print-portal fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar (Hidden on print) */}
        <div className="print:hidden p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm sm:text-base">Recibo de Pagamento em Dinheiro</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>Imprimir Recibo</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div className="print-receipt-area p-6 sm:p-8 overflow-y-auto flex-1 space-y-6 text-slate-800 bg-white" id="printable-receipt">
          {/* Receipt Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                RECIBO DE DIÁRIA DE PRESTAÇÃO DE SERVIÇOS
              </h2>
            </div>
            <div className="sm:text-right">
              <span className="text-xs font-mono font-bold bg-slate-100 px-2.5 py-1 rounded-md border border-slate-300">
                {receiptNum}
              </span>
              <div className="text-xs text-slate-500 mt-1 font-semibold">
                VALOR: <span className="text-slate-900 font-bold text-sm">{formatMoney(diaria.amount)}</span>
              </div>
            </div>
          </div>

          {/* Value in words */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs sm:text-sm">
            <span className="font-bold text-slate-700">Valor por extenso: </span>
            <span className="font-semibold text-slate-900 capitalize">
              {numeroParaExtenso(diaria.amount)}.
            </span>
          </div>

          {/* Receipt Statement */}
          <div className="text-xs sm:text-sm text-slate-700 leading-relaxed text-justify space-y-3">
            <p>
              Recebi a importância líquida de{' '}
              <strong className="text-slate-900">{formatMoney(diaria.amount)}</strong> ({numeroParaExtenso(diaria.amount)}), em moeda corrente nacional (dinheiro em espécie), referente à diária de serviços de{' '}
              <strong className="text-slate-900">{diaria.workerRole} ({diaria.activityType})</strong> prestados no dia{' '}
              <strong className="text-slate-900">{formatDate(diaria.date)}</strong> na cidade de{' '}
              <strong className="text-slate-900">{diaria.city}</strong>, no local: <em>{diaria.location}</em>.
            </p>
            <p>
              Pelo presente, dou plena, rasa e irrevogável quitação da referida diária para todos os fins de direito e prestação de contas eleitoral.
            </p>
          </div>

          {/* Identification Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px]">Beneficiário (Trabalhador)</span>
              <div className="font-bold text-slate-900">{diaria.workerName}</div>
              <div className="text-slate-600 font-mono text-[11px]">CPF: {maskCpf(diaria.auditLog?.[0]?.details || '***.***.***-**')}</div>
              <div className="text-slate-500">Função: {diaria.workerRole}</div>
            </div>

            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px]">Atividade & Local</span>
              <div className="font-semibold text-slate-900">{diaria.activityType} ({diaria.shift})</div>
              <div className="text-slate-600 truncate">{diaria.location}</div>
              <div className="text-slate-500">Coord: {diaria.coordinatorName}</div>
            </div>

            {cashNotes && (
              <div className="sm:col-span-2 pt-2 border-t border-slate-200">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Observações</span>
                <div className="text-slate-700 italic">{cashNotes}</div>
              </div>
            )}
          </div>

          {/* Signature Section */}
          <div className="pt-8 grid grid-cols-1 sm:grid-cols-2 gap-8 text-center text-xs">
            <div className="space-y-1.5">
              <div className="border-t border-slate-400 pt-2 font-bold text-slate-900">
                {receivedBy || diaria.workerName}
              </div>
              <div className="text-[11px] text-slate-500">
                Assinatura do Recebedor (Trabalhador)
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="border-t border-slate-400 pt-2 font-bold text-slate-900">
                {deliveredByName || 'Responsável Financeiro'}
              </div>
              <div className="text-[11px] text-slate-500">
                Responsável pela Entrega / Comitê
              </div>
            </div>
          </div>

          <div className="text-center text-[11px] text-slate-400 pt-3">
            {diaria.city}, {todayFormatted} — Sistema Gestão de Campanha (Autenticação Digital: {receiptNum})
          </div>
        </div>

        {/* Footer actions (Hidden on print) */}
        <div className="print:hidden p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Fechar
          </button>

          {!isAlreadyPaid && onConfirmAndPay && (
            <button
              onClick={onConfirmAndPay}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Confirmar Pagamento e Emitir</span>
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
