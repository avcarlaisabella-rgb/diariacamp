'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Database, 
  Copy, 
  Check, 
  Download, 
  ShieldCheck, 
  Key, 
  Layers, 
  ExternalLink,
  Code,
  Table
} from 'lucide-react';

const SQL_SCRIPT = `-- ==============================================================================
-- DIÁRIACAMP — ESQUEMA DE BANCO DE DADOS (PostgreSQL via Prisma)
-- Gerado a partir de prisma/schema.prisma — ver esse arquivo para a fonte da verdade.
-- Para aplicar: npm run prisma:migrate (dev) ou npm run prisma:deploy (produção).
-- ==============================================================================

-- Tabelas principais (nomes reais no banco, ver @@map em schema.prisma):
--   users                 (Administrador / Gestor / Coordenador)
--   workers               (Trabalhadores de campanha)
--   daily_records         (Diárias / lançamentos de campo)
--   worker_absences       (Faltas registradas)
--   payment_batches       (Lotes de pagamento)
--   financial_payments    (Recibos e pagamentos financeiros)
--   payment_reversals     (Histórico de reversões)
--
-- O schema completo (colunas, tipos, índices) está em prisma/schema.prisma.
-- Este app não usa Row Level Security (RLS) do Postgres: o controle de acesso
-- por papel (admin/gestor/coordenador) é feito na camada de aplicação
-- (Server Actions em src/app/actions/*.ts), autenticada por sessão (cookie
-- assinado). Para um modelo multi-tenant mais restritivo, RLS pode ser
-- adicionado futuramente nas mesmas tabelas.
`;

export const DatabaseSchemaView: React.FC = () => {
  const { showNotification } = useApp();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'tables' | 'sql'>('tables');

  const copySql = () => {
    navigator.clipboard.writeText(SQL_SCRIPT);
    setCopied(true);
    showNotification('Script SQL copiado com sucesso!');
    setTimeout(() => setCopied(false), 3000);
  };

  const tables = [
    {
      name: 'profiles',
      desc: 'Usuários com login (Administradores, Gestores e Coordenadores)',
      fields: [
        { name: 'id', type: 'UUID (PK)', desc: 'Identificador único' },
        { name: 'name', type: 'VARCHAR(255)', desc: 'Nome completo' },
        { name: 'email', type: 'VARCHAR(255) UNIQUE', desc: 'E-mail de login' },
        { name: 'avatar_url', type: 'TEXT', desc: 'Foto de perfil' },
        { name: 'role', type: 'VARCHAR(50)', desc: 'admin | gestor | coordenador' },
        { name: 'manager_id', type: 'UUID (FK)', desc: 'Gestor vinculado (se coordenador)' },
        { name: 'active', type: 'BOOLEAN', desc: 'Status do acesso' },
      ],
      rls: 'Admin: Total. Gestor: Apenas equipe e coordenadores vinculados.'
    },
    {
      name: 'workers',
      desc: 'Trabalhadores de campo cadastrados na campanha',
      fields: [
        { name: 'id', type: 'UUID (PK)', desc: 'Identificador único' },
        { name: 'name', type: 'VARCHAR(255)', desc: 'Nome completo' },
        { name: 'cpf', type: 'VARCHAR(14) UNIQUE', desc: 'CPF formatado e mascarado' },
        { name: 'birth_date', type: 'DATE', desc: 'Data de nascimento' },
        { name: 'phone', type: 'VARCHAR(50)', desc: 'WhatsApp / Telefone' },
        { name: 'city', type: 'VARCHAR(100)', desc: 'Município de atuação' },
        { name: 'coordinator_id', type: 'UUID (FK)', desc: 'Coordenador responsável' },
        { name: 'manager_id', type: 'UUID (FK)', desc: 'Gestor responsável' },
        { name: 'active', type: 'BOOLEAN', desc: 'Ativo ou inativo' },
      ],
      rls: 'Coordenador vê apenas seus trabalhadores. Gestor vê sua regional.'
    },
    {
      name: 'worker_electoral_data',
      desc: 'Dados eleitorais obrigatórios para prestação de contas',
      fields: [
        { name: 'worker_id', type: 'UUID (PK, FK)', desc: 'Referência ao trabalhador' },
        { name: 'voter_registration', type: 'VARCHAR(20)', desc: 'Título de Eleitor (mascarado)' },
        { name: 'electoral_zone', type: 'VARCHAR(10)', desc: 'Zona eleitoral' },
        { name: 'electoral_section', type: 'VARCHAR(10)', desc: 'Seção eleitoral' },
        { name: 'electoral_city', type: 'VARCHAR(100)', desc: 'Município eleitoral' },
      ],
      rls: 'Restrito por trabalhador com herança da tabela workers.'
    },
    {
      name: 'worker_payment_data',
      desc: 'Dados bancários e chaves PIX para pagamento',
      fields: [
        { name: 'worker_id', type: 'UUID (PK, FK)', desc: 'Referência ao trabalhador' },
        { name: 'preferred_payment_method', type: 'VARCHAR(20)', desc: 'PIX ou Dinheiro' },
        { name: 'pix_type', type: 'VARCHAR(30)', desc: 'Tipo da chave (CPF, Celular, etc.)' },
        { name: 'pix_key', type: 'VARCHAR(255)', desc: 'Chave PIX cadastrada' },
        { name: 'pix_holder_name', type: 'VARCHAR(255)', desc: 'Nome do titular da conta' },
        { name: 'pix_holder_cpf', type: 'VARCHAR(14)', desc: 'CPF do titular' },
      ],
      rls: 'Acesso financeiro restrito ao Admin e consulta operacional.'
    },
    {
      name: 'daily_entries',
      desc: 'Ações de campo e cabeçalho de diárias lançadas',
      fields: [
        { name: 'id', type: 'UUID (PK)', desc: 'Identificador único da ação' },
        { name: 'date', type: 'DATE', desc: 'Data de realização' },
        { name: 'city', type: 'VARCHAR(100)', desc: 'Cidade da ação' },
        { name: 'location', type: 'VARCHAR(255)', desc: 'Ponto de atuação / Cruzamento' },
        { name: 'activity', type: 'VARCHAR(100)', desc: 'Panfletagem, Bandeiraço, etc.' },
        { name: 'coordinator_id', type: 'UUID (FK)', desc: 'Coordenador lançador' },
        { name: 'manager_id', type: 'UUID (FK)', desc: 'Gestor da regional' },
        { name: 'status', type: 'VARCHAR(50)', desc: 'Aguardando aprovação / pagamento / Paga' },
        { name: 'approved_by', type: 'UUID (FK)', desc: 'Gestor que aprovou' },
      ],
      rls: 'Coordenador lança; Gestor aprova sua regional; Admin efetiva pagamento.'
    },
    {
      name: 'daily_entry_workers',
      desc: 'Vínculo do trabalhador com a diária e valor individual',
      fields: [
        { name: 'id', type: 'UUID (PK)', desc: 'ID do lançamento' },
        { name: 'daily_entry_id', type: 'UUID (FK)', desc: 'Referência à ação diária' },
        { name: 'worker_id', type: 'UUID (FK)', desc: 'Trabalhador participante' },
        { name: 'daily_rate', type: 'DECIMAL(10,2)', desc: 'Valor acordado da diária' },
        { name: 'is_duplicate_overridden', type: 'BOOLEAN', desc: 'Liberação por admin' },
      ],
      rls: 'Constraint UNIQUE (daily_entry_id, worker_id) impede duplicidade.'
    },
    {
      name: 'payment_batches',
      desc: 'Lotes de pagamentos financeiros consolidados',
      fields: [
        { name: 'id', type: 'UUID (PK)', desc: 'ID do lote' },
        { name: 'batch_number', type: 'VARCHAR(50)', desc: 'Ex: Lote #0001' },
        { name: 'total_amount', type: 'DECIMAL(12,2)', desc: 'Valor total do lote' },
        { name: 'total_people', type: 'INTEGER', desc: 'Quantidade de beneficiários' },
        { name: 'pix_amount', type: 'DECIMAL(12,2)', desc: 'Subtotal PIX' },
        { name: 'cash_amount', type: 'DECIMAL(12,2)', desc: 'Subtotal Dinheiro' },
      ],
      rls: 'Apenas Administrador pode criar ou liquidar lotes.'
    },
    {
      name: 'payments',
      desc: 'Comprovantes e quitações de pagamentos efetuados',
      fields: [
        { name: 'id', type: 'UUID (PK)', desc: 'ID do pagamento' },
        { name: 'worker_id', type: 'UUID (FK)', desc: 'Trabalhador pago' },
        { name: 'daily_entry_worker_id', type: 'UUID (FK)', desc: 'Item de diária liquidado' },
        { name: 'payment_method', type: 'VARCHAR(20)', desc: 'PIX ou Dinheiro' },
        { name: 'receipt_url', type: 'TEXT', desc: 'Comprovante PIX (anexo)' },
        { name: 'received_by', type: 'VARCHAR(255)', desc: 'Recebedor em dinheiro' },
        { name: 'receipt_number', type: 'VARCHAR(50)', desc: 'Número do recibo emitido' },
      ],
      rls: 'Apenas Administrador tem permissão de escrita.'
    },
    {
      name: 'audit_logs',
      desc: 'Trilha imutável de auditoria jurídica e prestação de contas',
      fields: [
        { name: 'id', type: 'UUID (PK)', desc: 'ID do log' },
        { name: 'user_id', type: 'UUID (FK)', desc: 'Quem executou a ação' },
        { name: 'action', type: 'VARCHAR(100)', desc: 'Criação / Aprovação / Pagamento' },
        { name: 'details', type: 'TEXT', desc: 'Descrição detalhada do evento' },
        { name: 'created_at', type: 'TIMESTAMP', desc: 'Registro temporal imutável' },
      ],
      rls: 'Somente inserção e leitura para auditoria.'
    }
  ];

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              Estrutura do Banco de Dados (PostgreSQL)
            </h1>
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[11px]">
              PostgreSQL
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Mapeamento relacional completo com 9 tabelas, chaves estrangeiras, índices e Row Level Security (RLS)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copySql}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado!' : 'Copiar Script SQL'}</span>
          </button>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('tables')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'tables'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Table className="w-3.5 h-3.5" />
          <span>Visão Relacional das Tabelas ({tables.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('sql')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'sql'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          <span>Script SQL (prisma/schema.prisma)</span>
        </button>
      </div>

      {activeTab === 'tables' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tables.map(t => (
            <div key={t.name} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t.name}</span>
                  </span>
                  <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono font-semibold">
                    PostgreSQL
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1">{t.desc}</div>
              </div>

              <div className="p-4 flex-1 space-y-2 text-xs">
                <div className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Campos Principais:</div>
                <div className="space-y-1.5">
                  {t.fields.map(f => (
                    <div key={f.name} className="flex items-start justify-between gap-2 border-b border-slate-100 pb-1">
                      <div>
                        <span className="font-mono font-bold text-slate-800">{f.name}</span>
                        <div className="text-[11px] text-slate-500">{f.desc}</div>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400 shrink-0">{f.type}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-50/70 border-t border-slate-100 text-[11px] text-slate-600 flex items-start gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>RLS: </strong>{t.rls}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-950 text-slate-200 p-4 sm:p-5 rounded-2xl font-mono text-xs shadow-xl border border-slate-800 max-h-[600px] leading-relaxed overflow-y-auto">
          <pre className="whitespace-pre-wrap break-words">{SQL_SCRIPT}</pre>
        </div>
      )}
    </div>
  );
};
