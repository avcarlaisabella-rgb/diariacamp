'use client';

import React, { createContext, useContext, useState } from 'react';
import {
  User,
  Worker,
  DailyRecord,
  NavigationTab,
  UserRole,
  ActivityType,
  AuditLogEntry,
  PaymentBatch,
  WorkerAbsence,
  FinancialPayment,
  PaymentMethod,
  PaymentReversal,
  WorkerRoleType,
} from '../types';
import { loginAsRoleAction, logoutAction } from '../app/actions/session';
import {
  persistCreateWorker,
  persistUpdateWorker,
  persistUpdateWorkersMany,
  persistDeleteWorker,
} from '../app/actions/workers';
import { persistCreateWorkerRole, persistDeleteWorkerRole } from '../app/actions/workerRoles';
import {
  persistCreateDiaria,
  persistCreateDiariasBatch,
  persistUpdateDiaria,
  persistUpdateDiariasMany,
  persistDeleteDiaria,
  persistUpsertAbsence,
  persistRemoveAbsence,
  persistCreatePaymentBatch,
} from '../app/actions/diarias';
import {
  persistCreateFinancialPayment,
  persistUpdateFinancialPayment,
  persistUpdateFinancialPaymentsMany,
  persistCreatePaymentReversal,
} from '../app/actions/payments';
import {
  persistUpdateProfile,
  persistCreateUser,
  persistUpdateUser,
  persistResetPassword,
} from '../app/actions/users';

export interface BatchWorkerItem {
  workerId: string;
  amount: number;
  overrideDuplicate?: boolean;
}

export interface BatchDiariaInput {
  date: string;
  city: string;
  location: string;
  activityType: ActivityType;
  notes?: string;
  shift?: 'Manhã' | 'Tarde' | 'Integral' | 'Noturno';
  workers: BatchWorkerItem[];
}

export interface PixPaymentInput {
  paymentDate?: string;
  receiptUrl?: string;
  receiptFileName?: string;
  notes?: string;
}

export interface CashPaymentInput {
  paymentDate?: string;
  receivedBy: string;
  deliveredByName?: string;
  receiptConfirmed: boolean;
  cashNotes?: string;
}

export interface BootstrapData {
  users: User[];
  workers: Worker[];
  diarias: DailyRecord[];
  absences: WorkerAbsence[];
  paymentBatches: PaymentBatch[];
  financialPayments: FinancialPayment[];
  paymentReversals: PaymentReversal[];
  workerRoles: WorkerRoleType[];
}

interface AppContextType {
  currentUser: User | null;
  users: User[];
  workers: Worker[];
  diarias: DailyRecord[];
  absences: WorkerAbsence[];
  paymentBatches: PaymentBatch[];
  financialPayments: FinancialPayment[];
  paymentReversals: PaymentReversal[];
  workerRoles: WorkerRoleType[];
  currentTab: NavigationTab;
  setCurrentTab: (tab: NavigationTab) => void;
  isNovaDiariaOpen: boolean;
  setIsNovaDiariaOpen: (open: boolean) => void;
  // Financial Actions & Receipts
  registerWorkerPayment: (data: Omit<FinancialPayment, 'id' | 'receiptNumber' | 'createdAt' | 'createdById' | 'createdByName'>) => FinancialPayment;
  payWorkerWeekly: (workerId: string, diariaIds: string[], options?: { method?: PaymentMethod; notes?: string; referencePeriod?: string }) => FinancialPayment | null;
  revertPayment: (options: { workerId: string; diariaIds: string[]; reason: string; referencePeriod?: string }) => boolean;
  togglePaymentSigned: (paymentId: string) => void;
  // Diaria Actions
  addDiaria: (diaria: Omit<DailyRecord, 'id' | 'createdAt' | 'status' | 'createdById' | 'createdByName'>) => void;
  addDiariasBatch: (input: BatchDiariaInput) => { success: boolean; createdCount: number; errors: string[] };
  markDailyAttendance: (date: string, records: { workerId: string; worked: boolean; absenceReason?: string }[]) => { success: boolean; createdCount: number; removedCount: number };
  setWorkerAbsence: (workerId: string, date: string, reason: string) => void;
  removeWorkerAbsence: (workerId: string, date: string) => void;
  checkWorkerDuplicate: (workerId: string, date: string) => { isDuplicate: boolean; existingRecord?: DailyRecord };
  approveDiaria: (id: string) => void;
  approveDiariaBatch: (batchId: string) => void;
  approveAllPendingDiarias: () => void;
  rejectDiaria: (id: string, reason: string) => void;
  rejectDiariaBatch: (batchId: string, reason: string) => void;
  payDiaria: (id: string) => void;
  executePixPayment: (diariaId: string, data: PixPaymentInput) => void;
  executeCashPayment: (diariaId: string, data: CashPaymentInput) => void;
  executeBatchPayment: (diariaIds: string[], options?: { deliveredByName?: string; notes?: string }) => { batchNumber: string; totalAmount: number; pixCount: number; cashCount: number } | null;
  // Worker Actions
  addWorker: (worker: Omit<Worker, 'id'>) => void;
  updateWorker: (id: string, data: Partial<Worker>) => void;
  toggleWorkerActive: (id: string) => void;
  updateWorkerStatus: (id: string, status: 'Ativo' | 'Em campo' | 'Inativo') => void;
  deleteWorker: (id: string) => { ok: boolean; error?: string };
  canDeleteWorker: (id: string) => { canDelete: boolean; reason?: string };
  // Funções de Trabalhador (Admin/Gestor)
  addWorkerRole: (name: string, defaultRate: number) => { ok: boolean; error?: string };
  removeWorkerRole: (id: string) => { ok: boolean; error?: string };
  // Liberação de Trabalhador para Início de Trabalho (Área de Aprovação)
  liberarWorker: (workerId: string, notes?: string) => void;
  rejeitarWorker: (workerId: string, reason: string) => void;
  liberarWorkersBatch: (workerIds: string[], notes?: string) => void;
  // User Profile & Management Actions
  updateCurrentUserProfile: (data: { name: string; email: string; avatar: string; password?: string }) => void;
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, data: Partial<User>) => void;
  toggleUserActive: (id: string) => void;
  resetUserPassword: (id: string, newPassword?: string) => void;
  canDeleteUser: (id: string) => { canDelete: boolean; reason?: string };
  // Auth
  loginAsRole: (role: UserRole) => void;
  logout: () => void;
  notification: string | null;
  showNotification: (msg: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{
  children: React.ReactNode;
  initialUser: User | null;
  initialData: BootstrapData;
}> = ({ children, initialUser, initialData }) => {
  const [users, setUsers] = useState<User[]>(initialData.users);
  const [currentUser, setCurrentUser] = useState<User | null>(initialUser);
  const [workers, setWorkers] = useState<Worker[]>(initialData.workers);
  const [diarias, setDiarias] = useState<DailyRecord[]>(initialData.diarias);
  const [absences, setAbsences] = useState<WorkerAbsence[]>(initialData.absences);
  const [paymentBatches, setPaymentBatches] = useState<PaymentBatch[]>(initialData.paymentBatches);
  const [financialPayments, setFinancialPayments] = useState<FinancialPayment[]>(initialData.financialPayments);
  const [paymentReversals, setPaymentReversals] = useState<PaymentReversal[]>(initialData.paymentReversals);
  const [workerRoles, setWorkerRoles] = useState<WorkerRoleType[]>(initialData.workerRoles);

  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [isNovaDiariaOpen, setIsNovaDiariaOpen] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  /** Persiste em segundo plano no Postgres; nunca bloqueia a UI otimista. */
  const sync = (promise: Promise<unknown>, errorMsg = 'Falha ao sincronizar com o servidor. Tente novamente.') => {
    promise.catch((err) => {
      console.error(err);
      showNotification(errorMsg);
    });
  };

  const loginAsRole = (role: UserRole) => {
    loginAsRoleAction(role).then((result) => {
      if (result.ok && result.user) {
        setCurrentUser(result.user);
        setCurrentTab('dashboard');
        showNotification(`Alternado para perfil: ${getRoleLabel(role)} (${result.user.name})`);
      }
    });
  };

  const logout = () => {
    setCurrentUser(null);
    logoutAction();
  };

  // Duplicate check for worker on same date
  const checkWorkerDuplicate = (workerId: string, date: string) => {
    const existing = diarias.find(
      d => d.workerId === workerId && d.date === date && d.status !== 'Cancelada' && d.status !== 'Rejeitada'
    );
    return {
      isDuplicate: !!existing,
      existingRecord: existing,
    };
  };

  // Add individual daily record
  const addDiaria = (newDiariaData: Omit<DailyRecord, 'id' | 'createdAt' | 'status' | 'createdById' | 'createdByName'>) => {
    if (!currentUser) return;
    const now = new Date().toISOString();

    // Check duplicate
    const dupCheck = checkWorkerDuplicate(newDiariaData.workerId, newDiariaData.date);
    if (dupCheck.isDuplicate && currentUser.role !== 'admin') {
      showNotification(`Este trabalhador já possui uma diária registrada nesta data.`);
      return;
    }

    const newRecord: DailyRecord = {
      ...newDiariaData,
      id: `dia_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      status: 'Aguardando aprovação',
      createdById: currentUser.id,
      createdByName: currentUser.name,
      createdAt: now,
      auditLog: [
        {
          id: `log_${Date.now()}`,
          action: 'Criação',
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.role,
          timestamp: now,
          details: `Lançamento de diária no valor de R$ ${newDiariaData.amount.toFixed(2)}`
        }
      ]
    };

    setDiarias(prev => [newRecord, ...prev]);
    sync(persistCreateDiaria(newRecord));

    // Also update worker status to 'Em campo' if date is today
    const today = now.split('T')[0];
    if (newRecord.date === today) {
      setWorkers(prev => prev.map(w => w.id === newRecord.workerId ? { ...w, status: 'Em campo' } : w));
      sync(persistUpdateWorker(newRecord.workerId, { status: 'Em campo' }));
    }

    showNotification(`Diária de ${newRecord.workerName} lançada com sucesso (R$ ${newRecord.amount.toFixed(2)})!`);
  };

  // Add Batch of daily records (Rapid flow for coordinators)
  const addDiariasBatch = (input: BatchDiariaInput) => {
    if (!currentUser) return { success: false, createdCount: 0, errors: ['Usuário não autenticado'] };
    const now = new Date().toISOString();
    const batchId = `batch_${Date.now()}`;
    const newRecords: DailyRecord[] = [];
    const errors: string[] = [];

    for (const item of input.workers) {
      const worker = workers.find(w => w.id === item.workerId);
      if (!worker) continue;

      // Duplicate check
      const dup = checkWorkerDuplicate(worker.id, input.date);
      if (dup.isDuplicate) {
        if (currentUser.role === 'admin' && item.overrideDuplicate) {
          // Admin allowed exception
        } else {
          errors.push(`${worker.name}: Este trabalhador já possui uma diária registrada nesta data.`);
          continue;
        }
      }

      const logEntry: AuditLogEntry = {
        id: `log_${Date.now()}_${worker.id}`,
        action: dup.isDuplicate ? 'Exceção de Duplicidade' : 'Criação',
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        timestamp: now,
        details: dup.isDuplicate
          ? `Diária lançada com liberação de exceção pelo Administrador`
          : `Diária em lote [${input.activityType}] criada por ${currentUser.name}`
      };

      const record: DailyRecord = {
        id: `dia_${Date.now()}_${worker.id}`,
        batchId,
        workerId: worker.id,
        workerName: worker.name,
        workerRole: worker.role,
        coordinatorId: currentUser.role === 'coordenador' ? currentUser.id : worker.coordinatorId,
        coordinatorName: currentUser.role === 'coordenador' ? currentUser.name : worker.coordinatorName,
        managerId: worker.managerId || 'usr_gestor',
        managerName: worker.managerName || 'Juliana Vasconcelos',
        teamZone: worker.teamZone,
        city: input.city,
        location: input.location,
        activityType: input.activityType,
        date: input.date,
        amount: item.amount,
        paymentMethod: worker.preferredPaymentMethod || 'PIX',
        status: 'Aguardando aprovação',
        shift: input.shift || 'Manhã',
        notes: input.notes,
        createdById: currentUser.id,
        createdByName: currentUser.name,
        createdAt: now,
        isDuplicateOverridden: dup.isDuplicate,
        overrideAdminId: dup.isDuplicate ? currentUser.id : undefined,
        overrideAdminName: dup.isDuplicate ? currentUser.name : undefined,
        pixType: worker.pixType,
        pixKey: worker.pixKey,
        pixAccountHolder: worker.pixAccountHolder,
        pixAccountHolderCpf: worker.pixAccountHolderCpf,
        auditLog: [logEntry]
      };

      newRecords.push(record);
    }

    if (newRecords.length > 0) {
      setDiarias(prev => [...newRecords, ...prev]);
      sync(persistCreateDiariasBatch(newRecords));

      // Update worker status if today
      const today = now.split('T')[0];
      if (input.date === today) {
        const assignedIds = Array.from(new Set(newRecords.map(r => r.workerId)));
        setWorkers(prev => prev.map(w => assignedIds.includes(w.id) ? { ...w, status: 'Em campo' } : w));
        sync(persistUpdateWorkersMany(assignedIds, { status: 'Em campo' }));
      }

      showNotification(`Lote de ${newRecords.length} diárias enviado para aprovação com sucesso!`);
      return { success: true, createdCount: newRecords.length, errors };
    }

    return { success: false, createdCount: 0, errors };
  };

  // Mark Daily Attendance for team members (Presença Diária com Motivo de Falta)
  const markDailyAttendance = (
    date: string,
    records: { workerId: string; worked: boolean; absenceReason?: string }[]
  ) => {
    if (!currentUser) return { success: false, createdCount: 0, removedCount: 0 };
    const now = new Date().toISOString();
    let createdCount = 0;
    let removedCount = 0;
    const createdDiariaIds: string[] = [];
    const removedDiariaIds: string[] = [];

    setDiarias(prev => {
      let updated = [...prev];
      for (const item of records) {
        const worker = workers.find(w => w.id === item.workerId);
        if (!worker) continue;

        const existingIndex = updated.findIndex(
          d => d.workerId === worker.id && d.date === date && d.status !== 'Cancelada'
        );

        if (item.worked) {
          if (existingIndex === -1) {
            // Register presence at the worker's standard rate
            const newRec: DailyRecord = {
              id: `dia_${Date.now()}_${worker.id}_${Math.random().toString(36).substring(2, 6)}`,
              workerId: worker.id,
              workerName: worker.name,
              workerRole: worker.role,
              coordinatorId: currentUser.role === 'coordenador' ? currentUser.id : worker.coordinatorId,
              coordinatorName: currentUser.role === 'coordenador' ? currentUser.name : worker.coordinatorName,
              managerId: worker.managerId || 'usr_gestor',
              managerName: worker.managerName || 'Juliana Vasconcelos',
              teamZone: worker.teamZone,
              city: worker.city || 'Belém',
              location: worker.teamZone || 'Zona de Campanha',
              activityType: 'Panfletagem',
              date: date,
              amount: worker.standardRate || 80.00,
              paymentMethod: worker.preferredPaymentMethod || 'PIX',
              status: currentUser.role === 'admin' ? 'Aprovada' : (currentUser.role === 'gestor' ? 'Aprovada' : 'Aguardando aprovação'),
              shift: 'Integral',
              notes: 'Presença confirmada',
              createdById: currentUser.id,
              createdByName: currentUser.name,
              createdAt: now,
              auditLog: [{
                id: `log_${Date.now()}_${worker.id}`,
                action: 'Criação',
                userId: currentUser.id,
                userName: currentUser.name,
                userRole: currentUser.role,
                timestamp: now,
                details: `Presença registrada no dia ${date} (Diária: R$ ${(worker.standardRate || 80).toFixed(2)})`
              }]
            };
            updated = [newRec, ...updated];
            createdCount++;
            createdDiariaIds.push(newRec.id);
            sync(persistCreateDiaria(newRec));
          }
        } else {
          // If not worked, remove any unpaid presence for that date
          if (existingIndex !== -1) {
            const existing = updated[existingIndex];
            if (existing.status !== 'Paga') {
              updated.splice(existingIndex, 1);
              removedCount++;
              removedDiariaIds.push(existing.id);
              sync(persistDeleteDiaria(existing.id));
            }
          }
        }
      }
      return updated;
    });

    // Update Absences list
    setAbsences(prev => {
      let updatedAbs = [...prev];
      for (const item of records) {
        const worker = workers.find(w => w.id === item.workerId);
        if (!worker) continue;

        if (item.worked) {
          // Remove any recorded absence for this worker on this date
          updatedAbs = updatedAbs.filter(a => !(a.workerId === item.workerId && a.date === date));
          sync(persistRemoveAbsence(item.workerId, date));
        } else {
          // Worker missed work
          const existingAbsIdx = updatedAbs.findIndex(a => a.workerId === item.workerId && a.date === date);
          const reason = item.absenceReason?.trim() || 'Falta sem justificativa';
          if (existingAbsIdx !== -1) {
            if (item.absenceReason?.trim()) {
              updatedAbs[existingAbsIdx] = {
                ...updatedAbs[existingAbsIdx],
                reason: item.absenceReason.trim(),
                recordedById: currentUser.id,
                recordedByName: currentUser.name
              };
              sync(persistUpsertAbsence(updatedAbs[existingAbsIdx]));
            }
          } else {
            const newAbsence: WorkerAbsence = {
              id: `abs_${Date.now()}_${item.workerId}`,
              workerId: item.workerId,
              workerName: worker.name,
              date,
              reason,
              recordedById: currentUser.id,
              recordedByName: currentUser.name,
              createdAt: now
            };
            updatedAbs.push(newAbsence);
            sync(persistUpsertAbsence(newAbsence));
          }
        }
      }
      return updatedAbs;
    });

    // Update worker statuses if date is today
    const today = now.split('T')[0];
    if (date === today) {
      setWorkers(prev => prev.map(w => {
        const match = records.find(r => r.workerId === w.id);
        if (match) {
          return { ...w, status: match.worked ? 'Em campo' : 'Faltou' };
        }
        return w;
      }));
      const workedIds = records.filter(r => r.worked).map(r => r.workerId);
      const notWorkedIds = records.filter(r => !r.worked).map(r => r.workerId);
      if (workedIds.length > 0) sync(persistUpdateWorkersMany(workedIds, { status: 'Em campo' }));
      if (notWorkedIds.length > 0) sync(persistUpdateWorkersMany(notWorkedIds, { status: 'Faltou' }));
    }

    showNotification(`Presenças do dia ${date.split('-').reverse().join('/')} salvas com sucesso!`);
    return { success: true, createdCount, removedCount };
  };

  // Add or update absence justification directly
  const setWorkerAbsence = (workerId: string, date: string, reason: string) => {
    if (!currentUser) return;
    const worker = workers.find(w => w.id === workerId);
    if (!worker) return;
    const now = new Date().toISOString();
    const trimmedReason = reason.trim() || 'Falta sem justificativa';

    setAbsences(prev => {
      const idx = prev.findIndex(a => a.workerId === workerId && a.date === date);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          reason: trimmedReason,
          recordedById: currentUser.id,
          recordedByName: currentUser.name
        };
        sync(persistUpsertAbsence(updated[idx]));
        return updated;
      }
      const newAbsence: WorkerAbsence = {
        id: `abs_${Date.now()}_${workerId}`,
        workerId,
        workerName: worker.name,
        date,
        reason: trimmedReason,
        recordedById: currentUser.id,
        recordedByName: currentUser.name,
        createdAt: now
      };
      sync(persistUpsertAbsence(newAbsence));
      return [newAbsence, ...prev];
    });

    // If absence is for today, update worker status to Faltou
    const today = now.split('T')[0];
    if (date === today) {
      setWorkers(prev => prev.map(w => w.id === workerId ? { ...w, status: 'Faltou' } : w));
      sync(persistUpdateWorker(workerId, { status: 'Faltou' }));
    }

    // Remove any unpaid daily record for that date
    const toRemove = diarias.filter(d => d.workerId === workerId && d.date === date && d.status !== 'Paga');
    setDiarias(prev => prev.filter(d => !(d.workerId === workerId && d.date === date && d.status !== 'Paga')));
    toRemove.forEach(d => sync(persistDeleteDiaria(d.id)));

    showNotification(`Motivo da falta atualizado com sucesso.`);
  };

  // Remove worker absence (e.g. excused/cleared)
  const removeWorkerAbsence = (workerId: string, date: string) => {
    setAbsences(prev => prev.filter(a => !(a.workerId === workerId && a.date === date)));
    sync(persistRemoveAbsence(workerId, date));
    showNotification(`Registro de falta removido.`);
  };

  // Approve single diaria
  const approveDiaria = (id: string) => {
    if (!currentUser) return;
    const now = new Date().toISOString();

    setDiarias(prev =>
      prev.map(d => {
        if (d.id === id) {
          const newLog: AuditLogEntry = {
            id: `log_${Date.now()}`,
            action: 'Aprovação',
            userId: currentUser.id,
            userName: currentUser.name,
            userRole: currentUser.role,
            timestamp: now,
            details: 'Aprovada pelo Gestor/Admin para pagamento'
          };
          const updated: DailyRecord = {
            ...d,
            status: 'Aguardando pagamento',
            approvedAt: now,
            approvedById: currentUser.id,
            approvedByName: currentUser.name,
            auditLog: [...(d.auditLog || []), newLog]
          };
          sync(persistUpdateDiaria(id, {
            status: updated.status,
            approvedAt: updated.approvedAt,
            approvedById: updated.approvedById,
            approvedByName: updated.approvedByName,
            auditLog: updated.auditLog,
          }));
          return updated;
        }
        return d;
      })
    );
    showNotification('Diária aprovada e encaminhada para pagamento!');
  };

  // Approve batch of diarias
  const approveDiariaBatch = (batchId: string) => {
    if (!currentUser) return;
    const now = new Date().toISOString();
    const affectedIds: string[] = [];

    setDiarias(prev =>
      prev.map(d => {
        if (d.batchId === batchId && (d.status === 'Aguardando aprovação' || (d.status as string) === 'Pendente')) {
          affectedIds.push(d.id);
          const newLog: AuditLogEntry = {
            id: `log_${Date.now()}_${d.id}`,
            action: 'Aprovação',
            userId: currentUser.id,
            userName: currentUser.name,
            userRole: currentUser.role,
            timestamp: now,
            details: 'Aprovada em lote'
          };
          return {
            ...d,
            status: 'Aguardando pagamento',
            approvedAt: now,
            approvedById: currentUser.id,
            approvedByName: currentUser.name,
            auditLog: [...(d.auditLog || []), newLog]
          };
        }
        return d;
      })
    );
    if (affectedIds.length > 0) {
      sync(persistUpdateDiariasMany(affectedIds, {
        status: 'Aguardando pagamento',
        approvedAt: now,
        approvedById: currentUser.id,
        approvedByName: currentUser.name,
      }));
    }
    showNotification('Lote de diárias aprovado com sucesso!');
  };

  // Approve all pending diarias (Option "Aprovar todas")
  const approveAllPendingDiarias = () => {
    if (!currentUser) return;
    const now = new Date().toISOString();
    const affectedIds: string[] = [];

    setDiarias(prev =>
      prev.map(d => {
        if (d.status === 'Aguardando aprovação' || (d.status as string) === 'Pendente') {
          affectedIds.push(d.id);
          const newLog: AuditLogEntry = {
            id: `log_${Date.now()}_${d.id}`,
            action: 'Aprovação',
            userId: currentUser.id,
            userName: currentUser.name,
            userRole: currentUser.role,
            timestamp: now,
            details: 'Aprovada via ação em massa "Aprovar Todas"'
          };
          return {
            ...d,
            status: 'Aguardando pagamento',
            approvedAt: now,
            approvedById: currentUser.id,
            approvedByName: currentUser.name,
            auditLog: [...(d.auditLog || []), newLog]
          };
        }
        return d;
      })
    );
    if (affectedIds.length > 0) {
      sync(persistUpdateDiariasMany(affectedIds, {
        status: 'Aguardando pagamento',
        approvedAt: now,
        approvedById: currentUser.id,
        approvedByName: currentUser.name,
      }));
    }
    showNotification('Todas as diárias pendentes foram aprovadas com sucesso!');
  };

  // Reject single diaria (Reason mandatory!)
  const rejectDiaria = (id: string, reason: string) => {
    if (!currentUser) return;
    const now = new Date().toISOString();

    setDiarias(prev =>
      prev.map(d => {
        if (d.id === id) {
          const newLog: AuditLogEntry = {
            id: `log_${Date.now()}`,
            action: 'Rejeição',
            userId: currentUser.id,
            userName: currentUser.name,
            userRole: currentUser.role,
            timestamp: now,
            details: `Motivo: ${reason}`
          };
          const updated: DailyRecord = {
            ...d,
            status: 'Rejeitada',
            rejectedAt: now,
            rejectedById: currentUser.id,
            rejectedByName: currentUser.name,
            rejectionReason: reason,
            auditLog: [...(d.auditLog || []), newLog]
          };
          sync(persistUpdateDiaria(id, {
            status: updated.status,
            rejectedAt: updated.rejectedAt,
            rejectedById: updated.rejectedById,
            rejectedByName: updated.rejectedByName,
            rejectionReason: updated.rejectionReason,
            auditLog: updated.auditLog,
          }));
          return updated;
        }
        return d;
      })
    );
    showNotification('Diária rejeitada com justificativa registrada.');
  };

  // Reject batch of diarias
  const rejectDiariaBatch = (batchId: string, reason: string) => {
    if (!currentUser) return;
    const now = new Date().toISOString();
    const affectedIds: string[] = [];

    setDiarias(prev =>
      prev.map(d => {
        if (d.batchId === batchId && (d.status === 'Aguardando aprovação' || (d.status as string) === 'Pendente')) {
          affectedIds.push(d.id);
          const newLog: AuditLogEntry = {
            id: `log_${Date.now()}_${d.id}`,
            action: 'Rejeição',
            userId: currentUser.id,
            userName: currentUser.name,
            userRole: currentUser.role,
            timestamp: now,
            details: `Motivo: ${reason}`
          };
          return {
            ...d,
            status: 'Rejeitada',
            rejectedAt: now,
            rejectedById: currentUser.id,
            rejectedByName: currentUser.name,
            rejectionReason: reason,
            auditLog: [...(d.auditLog || []), newLog]
          };
        }
        return d;
      })
    );
    if (affectedIds.length > 0) {
      sync(persistUpdateDiariasMany(affectedIds, {
        status: 'Rejeitada',
        rejectedAt: now,
        rejectedById: currentUser.id,
        rejectedByName: currentUser.name,
        rejectionReason: reason,
      }));
    }
    showNotification('Lote de diárias rejeitado com justificativa.');
  };

  // Pay diaria (Legacy fallback / quick test)
  const payDiaria = (id: string) => {
    executePixPayment(id, {});
  };

  // PIX Payment execution (Admin only)
  const executePixPayment = (diariaId: string, data: PixPaymentInput) => {
    if (!currentUser) return;
    if (currentUser.role !== 'admin') {
      showNotification('Somente o Administrador poderá efetivar pagamentos.');
      return;
    }

    const now = new Date().toISOString();
    const payDate = data.paymentDate || now.split('T')[0];

    setDiarias(prev =>
      prev.map(d => {
        if (d.id === diariaId) {
          const newLog: AuditLogEntry = {
            id: `log_${Date.now()}`,
            action: 'Pagamento',
            userId: currentUser.id,
            userName: currentUser.name,
            userRole: currentUser.role,
            timestamp: now,
            details: `Pagamento PIX efetuado (R$ ${d.amount.toFixed(2)}). Comprovante ${data.receiptFileName ? `anexado (${data.receiptFileName})` : 'registrado'}.`
          };
          const updated: DailyRecord = {
            ...d,
            status: 'Paga',
            paymentMethod: 'PIX',
            paidAt: `${payDate}T${now.split('T')[1] || '12:00:00Z'}`,
            paidById: currentUser.id,
            paidByName: currentUser.name,
            receiptUrl: data.receiptUrl,
            receiptFileName: data.receiptFileName,
            notes: data.notes ? `${d.notes ? `${d.notes} | ` : ''}Obs Pgto: ${data.notes}` : d.notes,
            auditLog: [...(d.auditLog || []), newLog]
          };
          sync(persistUpdateDiaria(diariaId, {
            status: updated.status,
            paymentMethod: updated.paymentMethod,
            paidAt: updated.paidAt,
            paidById: updated.paidById,
            paidByName: updated.paidByName,
            receiptUrl: updated.receiptUrl,
            receiptFileName: updated.receiptFileName,
            notes: updated.notes,
            auditLog: updated.auditLog,
          }));
          return updated;
        }
        return d;
      })
    );
    showNotification('Pagamento via PIX confirmado com sucesso! Status alterado para "Paga".');
  };

  // Dinheiro Payment execution (Admin only)
  const executeCashPayment = (diariaId: string, data: CashPaymentInput) => {
    if (!currentUser) return;
    if (currentUser.role !== 'admin') {
      showNotification('Somente o Administrador poderá efetivar pagamentos.');
      return;
    }

    if (!data.receivedBy || !data.receivedBy.trim()) {
      showNotification('É obrigatório informar quem recebeu o pagamento em dinheiro.');
      return;
    }

    const now = new Date().toISOString();
    const payDate = data.paymentDate || now.split('T')[0];
    const receiptNum = `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    setDiarias(prev =>
      prev.map(d => {
        if (d.id === diariaId) {
          const newLog: AuditLogEntry = {
            id: `log_${Date.now()}`,
            action: 'Pagamento',
            userId: currentUser.id,
            userName: currentUser.name,
            userRole: currentUser.role,
            timestamp: now,
            details: `Pagamento em dinheiro (R$ ${d.amount.toFixed(2)}). Recebido por: ${data.receivedBy}. Entregue por: ${data.deliveredByName || currentUser.name}. Recibo nº ${receiptNum}.`
          };
          const updated: DailyRecord = {
            ...d,
            status: 'Paga',
            paymentMethod: 'Dinheiro',
            paidAt: `${payDate}T${now.split('T')[1] || '12:00:00Z'}`,
            paidById: currentUser.id,
            paidByName: currentUser.name,
            receivedBy: data.receivedBy.trim(),
            deliveredByName: data.deliveredByName?.trim() || currentUser.name,
            receiptConfirmed: data.receiptConfirmed,
            cashNotes: data.cashNotes,
            receiptNumber: receiptNum,
            notes: data.cashNotes ? `${d.notes ? `${d.notes} | ` : ''}Obs Dinheiro: ${data.cashNotes}` : d.notes,
            auditLog: [...(d.auditLog || []), newLog]
          };
          sync(persistUpdateDiaria(diariaId, {
            status: updated.status,
            paymentMethod: updated.paymentMethod,
            paidAt: updated.paidAt,
            paidById: updated.paidById,
            paidByName: updated.paidByName,
            receivedBy: updated.receivedBy,
            deliveredByName: updated.deliveredByName,
            receiptConfirmed: updated.receiptConfirmed,
            cashNotes: updated.cashNotes,
            receiptNumber: updated.receiptNumber,
            notes: updated.notes,
            auditLog: updated.auditLog,
          }));
          return updated;
        }
        return d;
      })
    );
    showNotification(`Pagamento em dinheiro confirmado com sucesso! Recibo ${receiptNum} gerado.`);
  };

  // Pagamento em Lote (Batch Payment)
  const executeBatchPayment = (diariaIds: string[], options?: { deliveredByName?: string; notes?: string }) => {
    if (!currentUser) return null;
    if (currentUser.role !== 'admin') {
      showNotification('Somente o Administrador poderá efetivar pagamentos.');
      return null;
    }

    if (!diariaIds || diariaIds.length === 0) {
      showNotification('Nenhuma diária selecionada para pagamento em lote.');
      return null;
    }

    const targetDiarias = diarias.filter(d => diariaIds.includes(d.id));
    if (targetDiarias.length === 0) return null;

    const now = new Date().toISOString();
    const today = now.split('T')[0];
    const nextBatchNum = `Lote #${String(paymentBatches.length + 1).padStart(4, '0')}`;
    const batchId = `batch_pay_${Date.now()}`;

    let pixCount = 0;
    let pixAmount = 0;
    let cashCount = 0;
    let cashAmount = 0;
    let totalAmount = 0;

    targetDiarias.forEach(d => {
      totalAmount += d.amount;
      if (d.paymentMethod === 'Dinheiro') {
        cashCount++;
        cashAmount += d.amount;
      } else {
        pixCount++;
        pixAmount += d.amount;
      }
    });

    const newBatch: PaymentBatch = {
      id: batchId,
      batchNumber: nextBatchNum,
      date: today,
      totalAmount,
      totalPeople: targetDiarias.length,
      pixCount,
      pixAmount,
      cashCount,
      cashAmount,
      dailyIds: diariaIds,
      createdById: currentUser.id,
      createdByName: currentUser.name,
      createdAt: now,
      notes: options?.notes || 'Processamento de lote financeiro de diárias'
    };

    setPaymentBatches(prev => [newBatch, ...prev]);
    sync(persistCreatePaymentBatch(newBatch));

    // Update all matching records to "Paga"
    setDiarias(prev =>
      prev.map(d => {
        if (diariaIds.includes(d.id)) {
          const logEntry: AuditLogEntry = {
            id: `log_${Date.now()}_${d.id}`,
            action: 'Pagamento',
            userId: currentUser.id,
            userName: currentUser.name,
            userRole: currentUser.role,
            timestamp: now,
            details: `Pagamento efetuado via ${nextBatchNum} (${d.paymentMethod === 'Dinheiro' ? 'Dinheiro' : 'PIX'}).`
          };

          const updated: DailyRecord = {
            ...d,
            status: 'Paga',
            paidAt: now,
            paidById: currentUser.id,
            paidByName: currentUser.name,
            paymentBatchId: batchId,
            paymentBatchNumber: nextBatchNum,
            deliveredByName: d.paymentMethod === 'Dinheiro' ? (options?.deliveredByName || currentUser.name) : undefined,
            receivedBy: d.paymentMethod === 'Dinheiro' ? (d.receivedBy || d.workerName) : undefined,
            receiptNumber: d.paymentMethod === 'Dinheiro' ? `REC-${newBatch.batchNumber.replace(/\D/g, '')}-${d.id.slice(-4)}` : undefined,
            auditLog: [...(d.auditLog || []), logEntry]
          };
          sync(persistUpdateDiaria(d.id, {
            status: updated.status,
            paidAt: updated.paidAt,
            paidById: updated.paidById,
            paidByName: updated.paidByName,
            paymentBatchId: updated.paymentBatchId,
            paymentBatchNumber: updated.paymentBatchNumber,
            deliveredByName: updated.deliveredByName,
            receivedBy: updated.receivedBy,
            receiptNumber: updated.receiptNumber,
            auditLog: updated.auditLog,
          }));
          return updated;
        }
        return d;
      })
    );

    showNotification(`${nextBatchNum} processado com sucesso! ${targetDiarias.length} pagamentos realizados.`);
    return {
      batchNumber: nextBatchNum,
      totalAmount,
      pixCount,
      cashCount
    };
  };

  // Worker operations
  const addWorker = (workerData: Omit<Worker, 'id'>) => {
    const now = new Date().toISOString();
    const newWorker: Worker = {
      ...workerData,
      id: `wrk_${Date.now()}`,
      status: currentUser?.role === 'admin' ? (workerData.status || 'Ativo') : 'Aguardando Liberação',
      approvalStatus: currentUser?.role === 'admin' ? 'Liberado' : 'Pendente',
      registrationDate: now.split('T')[0],
      approvedByName: currentUser?.role === 'admin' ? currentUser.name : undefined,
      approvalDate: currentUser?.role === 'admin' ? now : undefined,
    };
    setWorkers(prev => [newWorker, ...prev]);
    sync(persistCreateWorker(newWorker));
    showNotification(`Trabalhador ${newWorker.name} cadastrado com sucesso!`);
  };

  // Liberação de Trabalhador para Início de Trabalho (Área de Aprovação)
  const liberarWorker = (workerId: string, notes?: string) => {
    const now = new Date().toISOString();
    const patch: Partial<Worker> = {
      status: 'Ativo',
      approvalStatus: 'Liberado',
      approvedById: currentUser?.id,
      approvedByName: currentUser?.name,
      approvalDate: now,
      approvalNotes: notes || 'Liberado para começar a trabalhar.'
    };
    setWorkers(prev => prev.map(w => w.id === workerId ? { ...w, ...patch } : w));
    sync(persistUpdateWorker(workerId, patch));
    showNotification('Trabalhador liberado com sucesso para iniciar as atividades!');
  };

  const rejeitarWorker = (workerId: string, reason: string) => {
    const now = new Date().toISOString();
    const patch: Partial<Worker> = {
      status: 'Inativo',
      approvalStatus: 'Rejeitado',
      approvedById: currentUser?.id,
      approvedByName: currentUser?.name,
      approvalDate: now,
      rejectionReason: reason || 'Cadastro não liberado para início de trabalho.'
    };
    setWorkers(prev => prev.map(w => w.id === workerId ? { ...w, ...patch } : w));
    sync(persistUpdateWorker(workerId, patch));
    showNotification('Cadastro do trabalhador não liberado.');
  };

  const liberarWorkersBatch = (workerIds: string[], notes?: string) => {
    const now = new Date().toISOString();
    const patch: Partial<Worker> = {
      status: 'Ativo',
      approvalStatus: 'Liberado',
      approvedById: currentUser?.id,
      approvedByName: currentUser?.name,
      approvalDate: now,
      approvalNotes: notes || 'Liberação em lote efetuada com sucesso.'
    };
    setWorkers(prev => prev.map(w => workerIds.includes(w.id) ? { ...w, ...patch } : w));
    sync(persistUpdateWorkersMany(workerIds, patch));
    showNotification(`${workerIds.length} trabalhadores liberados com sucesso para trabalhar!`);
  };

  // Financial Payment Registration & Receipt Generation
  const registerWorkerPayment = (
    data: Omit<FinancialPayment, 'id' | 'receiptNumber' | 'createdAt' | 'createdById' | 'createdByName'>
  ): FinancialPayment => {
    const year = new Date().getFullYear();
    const count = financialPayments.length + 1;
    const receiptNumber = `REC-${year}-${String(count).padStart(4, '0')}`;
    const now = new Date().toISOString();

    const newPayment: FinancialPayment = {
      ...data,
      id: `pay_${Date.now()}`,
      receiptNumber,
      createdById: currentUser?.id || 'system',
      createdByName: currentUser?.name || 'Comitê Financeiro',
      createdAt: now,
      deliveredByName: data.deliveredByName || currentUser?.name || 'Comitê Financeiro',
      receivedBy: data.receivedBy || data.workerName,
    };

    setFinancialPayments(prev => [newPayment, ...prev]);
    sync(persistCreateFinancialPayment(newPayment));

    // If diariaIds were included, mark those diarias as paid and link receipt
    if (data.diariaIds && data.diariaIds.length > 0) {
      setDiarias(prev => prev.map(d => {
        if (data.diariaIds!.includes(d.id)) {
          return {
            ...d,
            status: 'Paga',
            paidById: currentUser?.id,
            paidByName: currentUser?.name,
            paidAt: now,
            paymentMethod: data.paymentMethod,
            receiptNumber,
          };
        }
        return d;
      }));
      sync(persistUpdateDiariasMany(data.diariaIds, {
        status: 'Paga',
        paidById: currentUser?.id,
        paidByName: currentUser?.name,
        paidAt: now,
        paymentMethod: data.paymentMethod,
        receiptNumber,
      }));
    }

    showNotification(`Pagamento registrado com sucesso! Recibo ${receiptNumber} emitido.`);
    return newPayment;
  };

  // Pay worker weekly (Direct execution of payment with receipt generation)
  const payWorkerWeekly = (
    workerId: string,
    diariaIds: string[],
    options?: { method?: PaymentMethod; notes?: string; referencePeriod?: string }
  ): FinancialPayment | null => {
    if (!currentUser) {
      showNotification('Usuário não autenticado.');
      return null;
    }
    const worker = workers.find(w => w.id === workerId);
    if (!worker) {
      showNotification('Trabalhador não encontrado.');
      return null;
    }

    const now = new Date().toISOString();
    const today = now.split('T')[0];
    const year = new Date().getFullYear();
    const count = financialPayments.length + 1;
    const receiptNumber = `REC-${year}-${String(count).padStart(4, '0')}`;
    const method: PaymentMethod = options?.method || worker.preferredPaymentMethod || 'PIX';

    // Target diarias to pay
    const targetDiarias = diarias.filter(d => diariaIds.includes(d.id));
    const amount = targetDiarias.length > 0
      ? targetDiarias.reduce((acc, d) => acc + d.amount, 0)
      : worker.standardRate;

    // Update Diarias to 'Paga'
    setDiarias(prev => prev.map(d => {
      if (diariaIds.includes(d.id)) {
        const newLog: AuditLogEntry = {
          id: `log_${Date.now()}_${d.id}`,
          action: 'Pagamento',
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.role,
          timestamp: now,
          details: `Pagamento efetuado via ${method} (R$ ${d.amount.toFixed(2)}). Recibo ${receiptNumber}.`
        };

        return {
          ...d,
          status: 'Paga',
          paidAt: now,
          paidById: currentUser.id,
          paidByName: currentUser.name,
          paymentMethod: method,
          receiptNumber,
          auditLog: [...(d.auditLog || []), newLog]
        };
      }
      return d;
    }));
    diariaIds.forEach(id => {
      const d = diarias.find(x => x.id === id);
      sync(persistUpdateDiaria(id, {
        status: 'Paga',
        paidAt: now,
        paidById: currentUser.id,
        paidByName: currentUser.name,
        paymentMethod: method,
        receiptNumber,
        auditLog: [
          ...((d?.auditLog) || []),
          {
            id: `log_${Date.now()}_${id}`,
            action: 'Pagamento',
            userId: currentUser.id,
            userName: currentUser.name,
            userRole: currentUser.role,
            timestamp: now,
            details: `Pagamento efetuado via ${method}. Recibo ${receiptNumber}.`
          }
        ],
      }));
    });

    // Register Financial Receipt
    const newPayment: FinancialPayment = {
      id: `pay_${Date.now()}_${worker.id}`,
      receiptNumber,
      workerId: worker.id,
      workerName: worker.name,
      workerCpf: worker.cpf,
      workerRole: worker.role,
      date: today,
      amount,
      paymentMethod: method,
      referencePeriod: options?.referencePeriod || `Semana de Trabalho - ${targetDiarias.length} diária(s)`,
      notes: options?.notes || `Pagamento efetuado via painel financeiro (${method})`,
      diariaIds: diariaIds,
      pixKey: worker.pixKey,
      pixType: worker.pixType,
      bankName: worker.bankName,
      createdById: currentUser.id,
      createdByName: currentUser.name,
      createdAt: now,
      deliveredByName: currentUser.name,
      receivedBy: worker.name
    };

    setFinancialPayments(prev => [newPayment, ...prev]);
    sync(persistCreateFinancialPayment(newPayment));
    showNotification(`Pagamento de R$ ${amount.toFixed(2)} efetuado para ${worker.name}! Recibo ${receiptNumber} gerado.`);
    return newPayment;
  };

  // Revert payment with mandatory justification
  const revertPayment = (options: {
    workerId: string;
    diariaIds: string[];
    reason: string;
    referencePeriod?: string;
  }): boolean => {
    if (!currentUser) {
      showNotification('Usuário não autenticado.');
      return false;
    }

    const trimmedReason = options.reason?.trim();
    if (!trimmedReason) {
      showNotification('É obrigatório registrar uma justificativa para reverter o pagamento.');
      return false;
    }

    const worker = workers.find(w => w.id === options.workerId);
    const workerName = worker?.name || 'Trabalhador';
    const now = new Date().toISOString();
    const today = now.split('T')[0];

    // Target diarias being reverted
    const targetDiarias = diarias.filter(d => options.diariaIds.includes(d.id));
    const revertedAmount = targetDiarias.length > 0
      ? targetDiarias.reduce((acc, d) => acc + d.amount, 0)
      : (worker?.standardRate || 0);

    // Update Diarias: revert from 'Paga' back to 'Aguardando pagamento'
    setDiarias(prev => prev.map(d => {
      if (options.diariaIds.includes(d.id)) {
        const revertLog: AuditLogEntry = {
          id: `log_rev_${Date.now()}_${d.id}`,
          action: 'Cancelamento',
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.role,
          timestamp: now,
          details: `Reversão de pagamento efetuada. Motivo: "${trimmedReason}" por ${currentUser.name} (${currentUser.role}).`
        };

        return {
          ...d,
          status: 'Aguardando pagamento',
          paidAt: undefined,
          paidById: undefined,
          paidByName: undefined,
          reversalReason: trimmedReason,
          reversalAt: now,
          revertedByName: currentUser.name,
          auditLog: [...(d.auditLog || []), revertLog]
        };
      }
      return d;
    }));
    options.diariaIds.forEach(id => {
      const d = diarias.find(x => x.id === id);
      sync(persistUpdateDiaria(id, {
        status: 'Aguardando pagamento',
        paidAt: undefined,
        paidById: undefined,
        paidByName: undefined,
        reversalReason: trimmedReason,
        reversalAt: now,
        revertedByName: currentUser.name,
        auditLog: [
          ...((d?.auditLog) || []),
          {
            id: `log_rev_${Date.now()}_${id}`,
            action: 'Cancelamento',
            userId: currentUser.id,
            userName: currentUser.name,
            userRole: currentUser.role,
            timestamp: now,
            details: `Reversão de pagamento. Motivo: "${trimmedReason}".`
          }
        ],
      }));
    });

    // Update associated Financial Payments / Receipts to marked as reverted
    const revertedPaymentIds: string[] = [];
    setFinancialPayments(prev => prev.map(p => {
      const hasDiariaMatch = p.diariaIds?.some(id => options.diariaIds.includes(id));
      const isWorkerMatch = p.workerId === options.workerId && !p.isReverted;
      if (hasDiariaMatch || (options.diariaIds.length === 0 && isWorkerMatch)) {
        revertedPaymentIds.push(p.id);
        return {
          ...p,
          isReverted: true,
          reversalReason: trimmedReason,
          reversalAt: now,
          revertedByName: currentUser.name
        };
      }
      return p;
    }));
    if (revertedPaymentIds.length > 0) {
      sync(persistUpdateFinancialPaymentsMany(revertedPaymentIds, {
        isReverted: true,
        reversalReason: trimmedReason,
        reversalAt: now,
        revertedByName: currentUser.name,
      }));
    }

    // Record Reversal History Record
    const newReversal: PaymentReversal = {
      id: `rev_${Date.now()}`,
      workerId: options.workerId,
      workerName,
      amount: revertedAmount,
      reason: trimmedReason,
      date: today,
      revertedById: currentUser.id,
      revertedByName: currentUser.name,
      revertedByRole: currentUser.role,
      diariaIds: options.diariaIds,
      referencePeriod: options.referencePeriod
    };

    setPaymentReversals(prev => [newReversal, ...prev]);
    sync(persistCreatePaymentReversal(newReversal));
    showNotification(`Pagamento revertido com sucesso! Justificativa registrada no histórico.`);
    return true;
  };

  const togglePaymentSigned = (paymentId: string) => {
    setFinancialPayments(prev => prev.map(p => {
      if (p.id === paymentId) {
        const nextSigned = !p.signedByWorker;
        const patch = {
          signedByWorker: nextSigned,
          signedAt: nextSigned ? new Date().toISOString() : undefined,
        };
        sync(persistUpdateFinancialPayment(paymentId, patch));
        return {
          ...p,
          ...patch,
        };
      }
      return p;
    }));
    showNotification('Status de assinatura do recibo atualizado!');
  };

  const updateWorker = (id: string, data: Partial<Worker>) => {
    setWorkers(prev => prev.map(w => w.id === id ? { ...w, ...data } : w));
    sync(persistUpdateWorker(id, data));
    showNotification('Ficha do trabalhador atualizada com sucesso!');
  };

  const toggleWorkerActive = (id: string) => {
    setWorkers(prev => prev.map(w => {
      if (w.id === id) {
        const nextStatus = w.status === 'Inativo' ? 'Ativo' : 'Inativo';
        showNotification(`${w.name} agora está ${nextStatus}.`);
        sync(persistUpdateWorker(id, { status: nextStatus }));
        return { ...w, status: nextStatus };
      }
      return w;
    }));
  };

  const updateWorkerStatus = (id: string, status: 'Ativo' | 'Em campo' | 'Inativo') => {
    setWorkers(prev => prev.map(w => w.id === id ? { ...w, status } : w));
    sync(persistUpdateWorker(id, { status }));
    showNotification(`Status do trabalhador atualizado para: ${status}`);
  };

  // Funções de Trabalhador (gerenciável por Admin/Gestor)
  const addWorkerRole = (name: string, defaultRate: number): { ok: boolean; error?: string } => {
    const trimmed = name.trim();
    if (!trimmed) {
      return { ok: false, error: 'Informe o nome da função.' };
    }
    if (workerRoles.some(r => r.name.toLowerCase() === trimmed.toLowerCase())) {
      return { ok: false, error: 'Já existe uma função com esse nome.' };
    }
    const newRole: WorkerRoleType = {
      id: `role_${Date.now()}`,
      name: trimmed,
      defaultRate: defaultRate > 0 ? defaultRate : 80,
    };
    setWorkerRoles(prev => [...prev, newRole].sort((a, b) => a.name.localeCompare(b.name)));
    sync(persistCreateWorkerRole(newRole));
    showNotification(`Função "${newRole.name}" adicionada com sucesso!`);
    return { ok: true };
  };

  const removeWorkerRole = (id: string): { ok: boolean; error?: string } => {
    const role = workerRoles.find(r => r.id === id);
    if (!role) return { ok: false, error: 'Função não encontrada.' };

    const inUse = workers.some(w => w.role === role.name);
    if (inUse) {
      return {
        ok: false,
        error: `Não é possível excluir "${role.name}": existem trabalhadores cadastrados com essa função.`,
      };
    }

    setWorkerRoles(prev => prev.filter(r => r.id !== id));
    sync(persistDeleteWorkerRole(id));
    showNotification(`Função "${role.name}" removida com sucesso!`);
    return { ok: true };
  };

  // Rule: Do NOT delete workers with history (diárias, pagamentos)!
  const canDeleteWorker = (id: string): { canDelete: boolean; reason?: string } => {
    const hasDiarias = diarias.some(d => d.workerId === id);
    const hasPayments = financialPayments.some(p => p.workerId === id);

    if (hasDiarias || hasPayments) {
      return {
        canDelete: false,
        reason: 'Este trabalhador possui histórico vinculado na campanha (diárias ou pagamentos registrados). Para manter a integridade da prestação de contas, você deve apenas desativar o cadastro.',
      };
    }
    return { canDelete: true };
  };

  const deleteWorker = (id: string): { ok: boolean; error?: string } => {
    const worker = workers.find(w => w.id === id);
    if (!worker) return { ok: false, error: 'Trabalhador não encontrado.' };

    const check = canDeleteWorker(id);
    if (!check.canDelete) {
      showNotification(check.reason || 'Não é possível excluir este trabalhador.');
      return { ok: false, error: check.reason };
    }

    setWorkers(prev => prev.filter(w => w.id !== id));
    sync(persistDeleteWorker(id));
    showNotification(`Trabalhador ${worker.name} excluído com sucesso!`);
    return { ok: true };
  };

  const updateCurrentUserProfile = (data: { name: string; email: string; avatar: string; password?: string }) => {
    if (!currentUser) return;
    const updated: User = {
      ...currentUser,
      name: data.name,
      email: data.email,
      avatar: data.avatar,
    };
    setCurrentUser(updated);
    setUsers(prev => prev.map(u => (u.id === currentUser.id ? updated : u)));
    sync(persistUpdateProfile(currentUser.id, data));
    showNotification('Perfil atualizado com sucesso!');
  };

  const addUser = (userData: Omit<User, 'id'> & { password?: string }) => {
    const newUser: User = {
      ...userData,
      id: `usr_${Date.now()}`,
    };
    setUsers(prev => [...prev, newUser]);
    sync(persistCreateUser(newUser));
    showNotification(`Usuário ${newUser.name} cadastrado como ${getRoleLabel(newUser.role)}!`);
  };

  const updateUser = (id: string, data: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u));
    sync(persistUpdateUser(id, data));
    showNotification('Usuário atualizado com sucesso!');
  };

  const toggleUserActive = (id: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        const nextActive = !u.active;
        showNotification(`Usuário ${u.name} agora está ${nextActive ? 'Ativo' : 'Inativo'}.`);
        sync(persistUpdateUser(id, { active: nextActive }));
        return { ...u, active: nextActive };
      }
      return u;
    }));
  };

  const resetUserPassword = (id: string, newPassword?: string) => {
    const pass = newPassword?.trim() || '123';
    const target = users.find(u => u.id === id);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, password: pass } : u));
    sync(persistResetPassword(id, pass));
    if (currentUser && currentUser.id === id) {
      setCurrentUser(prev => prev ? { ...prev, password: pass } : null);
    }
    showNotification(`Senha do usuário ${target?.name ? `"${target.name}"` : ''} alterada com sucesso!`);
  };

  // Rule: Do NOT delete users with history!
  const canDeleteUser = (id: string): { canDelete: boolean; reason?: string } => {
    const hasDiarias = diarias.some(d => d.coordinatorId === id || d.managerId === id || d.createdById === id || d.approvedById === id || d.paidById === id);
    const hasWorkers = workers.some(w => w.coordinatorId === id || w.managerId === id);

    if (hasDiarias || hasWorkers) {
      return {
        canDelete: false,
        reason: 'Este usuário possui histórico vinculado na campanha (diárias registradas, aprovadas ou trabalhadores sob sua gestão). Para manter a integridade jurídica e a auditoria das contas de campanha, você deve apenas desativar o acesso.'
      };
    }
    return { canDelete: true };
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        workers,
        diarias,
        absences,
        paymentBatches,
        financialPayments,
        paymentReversals,
        workerRoles,
        currentTab,
        setCurrentTab,
        isNovaDiariaOpen,
        setIsNovaDiariaOpen,
        registerWorkerPayment,
        payWorkerWeekly,
        revertPayment,
        togglePaymentSigned,
        addDiaria,
        addDiariasBatch,
        markDailyAttendance,
        setWorkerAbsence,
        removeWorkerAbsence,
        checkWorkerDuplicate,
        approveDiaria,
        approveDiariaBatch,
        approveAllPendingDiarias,
        rejectDiaria,
        rejectDiariaBatch,
        payDiaria,
        executePixPayment,
        executeCashPayment,
        executeBatchPayment,
        addWorker,
        updateWorker,
        toggleWorkerActive,
        updateWorkerStatus,
        deleteWorker,
        canDeleteWorker,
        addWorkerRole,
        removeWorkerRole,
        liberarWorker,
        rejeitarWorker,
        liberarWorkersBatch,
        updateCurrentUserProfile,
        addUser,
        updateUser,
        toggleUserActive,
        resetUserPassword,
        canDeleteUser,
        loginAsRole,
        logout,
        notification,
        showNotification,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case 'admin':
      return 'Administrador';
    case 'gestor':
      return 'Gestor';
    case 'coordenador':
      return 'Coordenador';
    default:
      return role;
  }
}
