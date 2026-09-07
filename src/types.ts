export type UserRole = 'admin' | 'gestor' | 'coordenador';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  avatar: string;
  teamZone?: string;
  phone?: string;
  active: boolean;
  managerId?: string; // Hierarquia: Gestor responsável
  managerName?: string;
}

// Função do trabalhador: string livre, gerenciável em tempo de execução por
// Administrador e Gestor (ver AppContext.addWorkerRole/removeWorkerRole).
// As opções abaixo são apenas o conjunto inicial usado no seed do banco.
export type WorkerRole = string;

export const DEFAULT_ROLE_RATES: Record<string, number> = {
  'Apoio Logístico': 100.00,
  'Mobilizador': 120.00,
  'Motorista': 150.00,
  'Panfletagem': 80.00,
  'Bandeirada': 90.00,
  'Fiscal de Campanha': 130.00,
  'Carro de Som': 150.00,
  'Cabo Eleitoral': 100.00,
};

/** Função de trabalhador cadastrável (nome + diária padrão), persistida no banco. */
export interface WorkerRoleType {
  id: string;
  name: string;
  defaultRate: number;
}

export type PaymentMethod = 'PIX' | 'Dinheiro' | 'Transferência';

export type PixKeyType = 'CPF' | 'Celular' | 'Telefone' | 'E-mail' | 'Email' | 'Chave aleatória' | 'Aleatória';

export type WorkerApprovalStatus = 'Pendente' | 'Liberado' | 'Rejeitado';

export interface Worker {
  id: string;
  // ETAPA 1 — DADOS PESSOAIS
  avatar?: string;
  name: string;
  cpf: string;
  birthDate?: string;
  phone: string;
  city: string;
  state: string; // UF (Ex: SP, RJ, etc.)
  role: WorkerRole;
  teamZone: string; // Região / Bairro / Setor
  coordinatorId: string;
  coordinatorName: string;
  managerId?: string;
  managerName?: string;
  status: 'Ativo' | 'Inativo' | 'Em campo' | 'Faltou' | 'Pendente' | 'Aguardando Liberação';
  standardRate: number; // in BRL

  // ETAPA 2 — DADOS ELEITORAIS
  voterRegistration?: string; // Número do título de eleitor
  voterZone?: string;         // Zona eleitoral
  voterSection?: string;      // Seção eleitoral
  voterCity?: string;         // Município eleitoral
  voterState?: string;        // UF eleitoral
  voterDocumentPhoto?: string; // Foto do título ou documento (galeria/câmera)

  // ETAPA 3 — PAGAMENTO
  preferredPaymentMethod: PaymentMethod;
  pixType?: PixKeyType;
  pixKey?: string;
  pixAccountHolder?: string;    // Nome do titular da conta
  pixAccountHolderCpf?: string; // CPF do titular da conta
  bankName?: string;
  bankAgency?: string;
  bankAccount?: string;
  bankAccountType?: 'Corrente' | 'Poupança';

  // LIBERAÇÃO PARA COMEÇAR A TRABALHAR (APROVAÇÃO)
  approvalStatus?: WorkerApprovalStatus;
  approvalDate?: string;
  approvedById?: string;
  approvedByName?: string;
  approvalNotes?: string;
  rejectionReason?: string;
  registrationDate?: string;
}

export type DailyStatus = 
  | 'Rascunho' 
  | 'Aguardando aprovação' 
  | 'Aprovada' 
  | 'Rejeitada' 
  | 'Aguardando pagamento' 
  | 'Paga' 
  | 'Cancelada';

export type ActivityType = 
  | 'Panfletagem'
  | 'Bandeiraço'
  | 'Bandeirada'
  | 'Caminhada'
  | 'Comício'
  | 'Reunião'
  | 'Carreata'
  | 'Fiscalização'
  | 'Mobilização' 
  | 'Evento' 
  | 'Apoio' 
  | 'Outro';

export interface AuditLogEntry {
  id: string;
  action: 'Criação' | 'Aprovação' | 'Rejeição' | 'Pagamento' | 'Alteração' | 'Cancelamento' | 'Exceção de Duplicidade';
  userId: string;
  userName: string;
  userRole: UserRole;
  timestamp: string;
  details?: string;
}

export interface DailyRecord {
  id: string;
  batchId?: string; // Agrupador de lote da atividade
  workerId: string;
  workerName: string;
  workerRole: WorkerRole;
  coordinatorId: string;
  coordinatorName: string;
  managerId?: string;
  managerName?: string;
  teamZone: string;
  city: string;
  location: string; // Local / Ponto
  activityType: ActivityType;
  date: string; // YYYY-MM-DD
  amount: number; // in BRL
  paymentMethod: 'PIX' | 'Dinheiro' | 'Transferência';
  status: DailyStatus;
  notes?: string;
  shift: 'Manhã' | 'Tarde' | 'Integral' | 'Noturno';
  
  // Auditoria e Rastreabilidade obrigatórias
  createdById: string;
  createdByName: string;
  createdAt: string;
  
  approvedById?: string;
  approvedByName?: string;
  approvedAt?: string;
  
  rejectedById?: string;
  rejectedByName?: string;
  rejectedAt?: string;
  rejectionReason?: string; // Motivo obrigatório da rejeição
  
  updatedById?: string;
  updatedByName?: string;
  updatedAt?: string;

  paidById?: string;
  paidByName?: string;
  paidAt?: string;

  // Detalhes do Pagamento Efetuado (Parte 3)
  receiptUrl?: string;            // Comprovante PIX (Imagem ou PDF em base64/URL)
  receiptFileName?: string;
  deliveredByName?: string;       // Responsável pela entrega (em dinheiro)
  receivedBy?: string;            // Recebido por (em dinheiro)
  receiptConfirmed?: boolean;     // Confirmação de recebimento
  cashNotes?: string;             // Observação do pagamento em dinheiro
  receiptNumber?: string;         // Número do recibo simples gerado
  paymentBatchId?: string;        // ID do lote de pagamento
  paymentBatchNumber?: string;    // Ex: "Lote #0001"

  isDuplicateOverridden?: boolean; // Se foi liberado por administrador
  overrideAdminId?: string;
  overrideAdminName?: string;

  pixKey?: string;
  pixType?: string;
  pixAccountHolder?: string;
  pixAccountHolderCpf?: string;

  auditLog?: AuditLogEntry[];
  reversalReason?: string;
  reversalAt?: string;
  revertedByName?: string;
}

export interface WorkerAbsence {
  id: string;
  workerId: string;
  workerName: string;
  date: string; // YYYY-MM-DD
  reason: string; // Motivo da falta
  recordedById?: string;
  recordedByName?: string;
  createdAt: string;
}

export interface PaymentBatch {
  id: string;
  batchNumber: string; // Ex: "Lote #0001"
  date: string;
  totalAmount: number;
  totalPeople: number;
  pixCount: number;
  pixAmount: number;
  cashCount: number;
  cashAmount: number;
  dailyIds: string[];
  createdById: string;
  createdByName: string;
  createdAt: string;
  notes?: string;
}

export interface DailyBatchSummary {
  batchId: string;
  date: string;
  city: string;
  location: string;
  activityType: ActivityType;
  coordinatorId: string;
  coordinatorName: string;
  managerId?: string;
  managerName?: string;
  totalWorkers: number;
  totalAmount: number;
  status: DailyStatus;
  diariaIds: string[];
  notes?: string;
  createdAt: string;
}

export interface FinancialPayment {
  id: string;
  receiptNumber: string; // Ex: "REC-2026-0001"
  workerId: string;
  workerName: string;
  workerCpf: string;
  workerRole: WorkerRole;
  date: string; // YYYY-MM-DD
  amount: number;
  paymentMethod: PaymentMethod;
  referencePeriod: string; // Ex: "Semana 31/08 a 06/09" ou "Diárias de Panfletagem"
  description?: string;
  diariaIds?: string[];
  pixKey?: string;
  pixType?: string;
  bankName?: string;
  notes?: string;
  createdById: string;
  createdByName: string;
  createdAt: string;
  deliveredByName?: string;
  receivedBy?: string;
  signedByWorker?: boolean;
  signedAt?: string;
  isReverted?: boolean;
  reversalReason?: string;
  reversalAt?: string;
  revertedByName?: string;
}

export interface PaymentReversal {
  id: string;
  workerId: string;
  workerName: string;
  amount: number;
  reason: string;
  date: string;
  revertedById: string;
  revertedByName: string;
  revertedByRole: UserRole;
  diariaIds: string[];
  receiptNumber?: string;
  referencePeriod?: string;
}

export type NavigationTab = 
  | 'dashboard' 
  | 'trabalhadores' 
  | 'diarias' 
  | 'nova-diaria' 
  | 'minhas-diarias' 
  | 'aprovacoes' 
  | 'pagamentos' 
  | 'relatorios' 
  | 'usuarios' 
  | 'perfil' 
  | 'banco-dados';
