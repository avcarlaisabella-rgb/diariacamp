'use client';

import React, { useState } from 'react';
import { FinancialPayment } from '../../types';
import { formatMoney, formatDate, maskCpf, maskPixKey } from '../../utils/formatters';
import { numeroPorExtenso } from '../../utils/numeroPorExtenso';
import { 
  Printer, 
  X, 
  ShieldCheck, 
  Copy, 
  Check, 
  FileText, 
  Download,
  AlertCircle
} from 'lucide-react';

interface ReciboAssinaturaModalProps {
  payment: FinancialPayment;
  onClose: () => void;
  onToggleSignature?: (paymentId: string) => void;
}

export const ReciboAssinaturaModal: React.FC<ReciboAssinaturaModalProps> = ({
  payment,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  const valorExtenso = numeroPorExtenso(payment.amount);
  
  // Format long date: "05 de setembro de 2026"
  const formattedDate = new Date(payment.date + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const textToCopy = `
RECIBO DE PAGAMENTO DE PRESTAÇÃO DE SERVIÇOS - ${payment.receiptNumber}
VALOR: ${formatMoney(payment.amount)} (${valorExtenso})
TRABALHADOR: ${payment.workerName} - CPF: ${payment.workerCpf}
CARGO/FUNÇÃO: ${payment.workerRole}
REFERÊNCIA: ${payment.referencePeriod}
FORMA DE PAGAMENTO: ${payment.paymentMethod}
LOCAL E DATA: Belém - PA, ${formattedDate}
PAGADOR: Comitê Financeiro de Campanha
    `.trim();

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      {/* Modal Container */}
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none">
        
        {/* Top Header - Hidden on Print */}
        <div className="print:hidden p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                <span>Recibo de Pagamento para Assinatura</span>
                <span className="text-xs font-mono font-bold bg-slate-800 text-emerald-400 px-2 py-0.5 rounded border border-slate-700">
                  {payment.receiptNumber}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Documento oficial pronto para impressão e assinatura física</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyText}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Copiar dados"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span className="hidden sm:inline">{copied ? 'Copiado' : 'Copiar'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Recibo</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper */}
        <div
          id="recibo-documento"
          className="print-receipt-area p-6 sm:p-10 overflow-y-auto flex-1 space-y-6 text-slate-800 bg-white font-sans print:p-6 print:space-y-5 print:text-black print:overflow-visible"
        >
          {/* Header of Document */}
          <div className="border-b-2 border-slate-800 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Comitê Financeiro de Campanha Eleitoral
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                  RECIBO DE PAGAMENTO DE PRESTAÇÃO DE SERVIÇOS
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Quitação e Comprovante de Pagamento de Atividades em Campo
                </p>
              </div>

              <div className="text-left sm:text-right shrink-0 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Nº do Documento</div>
                <div className="font-mono text-sm sm:text-base font-black text-slate-900 tracking-wider">
                  {payment.receiptNumber}
                </div>
                <div className="text-[11px] font-bold text-slate-600 mt-0.5">
                  Data: {formatDate(payment.date)}
                </div>
              </div>
            </div>
          </div>

          {/* Highlighted Value Banner */}
          <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase text-slate-500 block">
                Valor Líquido Recebido:
              </span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                {formatMoney(payment.amount)}
              </div>
            </div>
            <div className="sm:text-right max-w-sm">
              <span className="text-[11px] font-bold uppercase text-slate-400 block">Extenso:</span>
              <div className="text-xs sm:text-sm font-semibold text-slate-700 italic capitalize">
                ({valorExtenso})
              </div>
            </div>
          </div>

          {/* Identification Block */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50/70 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                Prestador de Serviços / Beneficiário:
              </span>
              <div className="font-black text-sm text-slate-900">{payment.workerName}</div>
              <div className="text-slate-600 mt-0.5">
                <span className="font-semibold">CPF:</span> {payment.workerCpf ? maskCpf(payment.workerCpf) : 'Não informado'}
              </div>
              <div className="text-slate-600">
                <span className="font-semibold">Função/Cargo:</span> {payment.workerRole}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                Dados do Pagamento & Liquidação:
              </span>
              <div className="text-slate-700">
                <span className="font-semibold">Forma:</span>{' '}
                <span className="font-bold text-slate-900">{payment.paymentMethod}</span>
              </div>
              {payment.pixKey && (
                <div className="text-slate-600 truncate">
                  <span className="font-semibold">Chave PIX:</span> {maskPixKey(payment.pixKey, payment.pixType)} ({payment.pixType || 'PIX'})
                </div>
              )}
              {payment.bankName && (
                <div className="text-slate-600 truncate">
                  <span className="font-semibold">Banco:</span> {payment.bankName}
                </div>
              )}
              <div className="text-slate-600 mt-0.5">
                <span className="font-semibold">Referência:</span> {payment.referencePeriod}
              </div>
            </div>
          </div>

          {/* Legal Discharge Statement */}
          <div className="text-xs text-slate-700 leading-relaxed bg-white border border-slate-200 p-4 rounded-xl text-justify">
            <p>
              Recebi(emos) do <strong>COMITÊ FINANCEIRO DE CAMPANHA ELEITORAL</strong> a importância líquida supra de{' '}
              <strong>{formatMoney(payment.amount)} ({valorExtenso})</strong>, através de <strong>{payment.paymentMethod}</strong>, 
              referente à remuneração por prestação de serviços de <strong>{payment.workerRole}</strong> no período de{' '}
              <strong>{payment.referencePeriod}</strong>.
            </p>
            <p className="mt-2 text-slate-600">
              Pelo presente, dou plena, rasa, geral e irrevogável quitação de todas as parcelas e valores decorrentes 
              das atividades acima especificadas, nada mais tendo a reclamar a qualquer título, judicial ou extrajudicialmente.
            </p>
          </div>

          {/* Location and Date */}
          <div className="text-right text-xs text-slate-600 font-semibold pr-2">
            Local e Data: <span className="text-slate-900">Belém - PA, {formattedDate}</span>
          </div>

          {/* Physical Signature Lines */}
          <div className="pt-6 sm:pt-10 grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12">
            {/* Worker Signature */}
            <div className="text-center flex flex-col items-center">
              <div className="w-full border-b border-slate-900 mb-2"></div>
              <div className="font-black text-slate-900 text-xs sm:text-sm">{payment.workerName}</div>
              <div className="text-[11px] text-slate-600 font-medium">
                CPF: {payment.workerCpf ? maskCpf(payment.workerCpf) : '___.___.___-__'}
              </div>
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">
                Assinatura do Trabalhador / Beneficiário
              </div>
            </div>

            {/* Payer Signature */}
            <div className="text-center flex flex-col items-center">
              <div className="w-full border-b border-slate-900 mb-2"></div>
              <div className="font-black text-slate-900 text-xs sm:text-sm">
                {payment.deliveredByName || 'Comitê Financeiro'}
              </div>
              <div className="text-[11px] text-slate-600 font-medium">
                Responsável Financeiro / Pagador
              </div>
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">
                Assinatura do Responsável
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center text-[10px] text-slate-400 border-t border-slate-100 pt-3">
            Este recibo foi gerado pelo Sistema de Gestão Eleitoral 2026. Documento comprobatório de despesa de campanha.
          </div>
        </div>

        {/* Modal Bottom Actions - Hidden on Print */}
        <div className="print:hidden p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-medium">
            Imprima o recibo para coleta de assinatura física do trabalhador.
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Imprimir / Salvar PDF</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
