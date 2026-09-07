'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Worker, WorkerRole, PaymentMethod } from '../../types';
import { formatMoney } from '../../utils/formatters';
import {
  Users,
  Search,
  PlusCircle,
  Phone,
  MapPin,
  X,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit3,
  Power,
  CreditCard,
  Vote,
  UserCheck,
  ChevronRight,
  ChevronLeft,
  Filter,
  Check,
  Building2,
  Calendar,
  Camera,
  Image as ImageIcon,
  Settings,
  Trash2
} from 'lucide-react';

const BRAZIL_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export const TrabalhadoresView: React.FC = () => {
  const { 
    currentUser,
    workers,
    users,
    addWorker,
    updateWorker,
    toggleWorkerActive,
    updateWorkerStatus,
    deleteWorker,
    workerRoles,
    addWorkerRole,
    removeWorkerRole
  } = useApp();

  const canManageRoles = currentUser?.role === 'admin' || currentUser?.role === 'gestor';

  // Filters and Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Em campo' | 'Faltou' | 'Inativo'>('Todos');
  const [coordinatorFilter, setCoordinatorFilter] = useState<string>('Todos');
  const [managerFilter, setManagerFilter] = useState<string>('Todos');
  const [cityFilter, setCityFilter] = useState<string>('Todos');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWorkerId, setEditingWorkerId] = useState<string | null>(null);
  const [viewingWorker, setViewingWorker] = useState<Worker | null>(null);

  // Gerenciar Funções (Admin/Gestor)
  const [isRolesModalOpen, setIsRolesModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleRate, setNewRoleRate] = useState('80');
  const [rolesError, setRolesError] = useState('');

  // Excluir Trabalhador
  const [deletingWorker, setDeletingWorker] = useState<Worker | null>(null);
  const [deleteError, setDeleteError] = useState('');

  // 3-Step Form State
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [formError, setFormError] = useState<string>('');

  // Step 1 - Dados Pessoais
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    birthDate: '',
    phone: '',
    city: 'São Paulo',
    state: 'SP',
    role: 'Panfletagem',
    teamZone: 'Zona Norte - Santana',
    coordinatorId: 'usr_coord1',
    managerId: 'usr_gestor',
    status: 'Ativo' as 'Ativo' | 'Inativo' | 'Em campo',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',

    // Step 2 - Dados Eleitorais
    voterRegistration: '',
    voterZone: '',
    voterSection: '',
    voterCity: 'São Paulo',
    voterState: 'SP',
    voterDocumentPhoto: '',

    // Step 3 - Pagamento
    preferredPaymentMethod: 'PIX' as PaymentMethod,
    pixType: 'CPF' as 'CPF' | 'Telefone' | 'Email' | 'Aleatória',
    pixKey: '',
    pixAccountHolderType: 'Proprio' as 'Proprio' | 'Outro',
    pixAccountHolder: '',
    pixAccountHolderCpf: '',
    bankName: '',
    bankAgency: '',
    bankAccount: '',
    bankAccountType: 'Corrente' as 'Corrente' | 'Poupança',
    standardRate: 80.00
  });

  // Hierarchy enforcement
  const coordinators = useMemo(() => users.filter(u => u.role === 'coordenador'), [users]);
  const managers = useMemo(() => users.filter(u => u.role === 'gestor'), [users]);

  // Distinct cities from existing workers
  const availableCities = useMemo(() => {
    const set = new Set<string>();
    workers.forEach(w => {
      if (w.city) set.add(w.city);
    });
    return Array.from(set);
  }, [workers]);

  // Filtering workers respecting hierarchy
  const filteredWorkers = useMemo(() => {
    return workers.filter((w) => {
      // 1. Hierarchy enforcement:
      // Coordenador sees ONLY their team
      if (currentUser?.role === 'coordenador') {
        if (w.coordinatorId !== currentUser.id) return false;
      }
      // Gestor sees coordinators and teams under them
      if (currentUser?.role === 'gestor') {
        if (w.managerId && w.managerId !== currentUser.id) return false;
      }

      // 2. Status filter
      if (statusFilter !== 'Todos') {
        if (statusFilter === 'Faltou') {
          if (w.status !== 'Faltou' && w.status !== 'Ativo') return false;
        } else if (w.status !== statusFilter) {
          return false;
        }
      }

      // 3. Coordinator filter
      if (coordinatorFilter !== 'Todos' && w.coordinatorId !== coordinatorFilter) {
        return false;
      }

      // 4. Manager filter
      if (managerFilter !== 'Todos' && w.managerId !== managerFilter) {
        return false;
      }

      // 5. City filter
      if (cityFilter !== 'Todos' && w.city !== cityFilter) {
        return false;
      }

      // 6. Search query (Nome, CPF, Título de eleitor)
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const mName = w.name.toLowerCase().includes(q);
        const mCpf = w.cpf.toLowerCase().includes(q);
        const mVoter = w.voterRegistration?.toLowerCase().includes(q);
        const mPix = w.pixKey?.toLowerCase().includes(q);
        const mRole = w.role.toLowerCase().includes(q);
        if (!mName && !mCpf && !mVoter && !mPix && !mRole) return false;
      }

      return true;
    });
  }, [workers, currentUser, statusFilter, coordinatorFilter, managerFilter, cityFilter, searchTerm]);

  // Open Add Modal
  const handleOpenAdd = () => {
    const defaultCoord = currentUser?.role === 'coordenador' 
      ? currentUser 
      : coordinators[0] || users[2];
    
    setEditingWorkerId(null);
    setCurrentStep(1);
    setFormError('');
    setFormData({
      name: '',
      cpf: '',
      birthDate: '',
      phone: '',
      city: 'São Paulo',
      state: 'SP',
      role: workerRoles[0]?.name || 'Panfletagem',
      teamZone: defaultCoord?.teamZone || 'Zona Norte - Santana',
      coordinatorId: defaultCoord?.id || 'usr_coord1',
      managerId: defaultCoord?.managerId || 'usr_gestor',
      status: 'Ativo',
      avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 100000)}?w=120&auto=format&fit=crop&q=80`,
      voterRegistration: '',
      voterZone: '',
      voterSection: '',
      voterCity: 'São Paulo',
      voterState: 'SP',
      voterDocumentPhoto: '',
      preferredPaymentMethod: 'PIX',
      pixType: 'CPF',
      pixKey: '',
      pixAccountHolderType: 'Proprio',
      pixAccountHolder: '',
      pixAccountHolderCpf: '',
      bankName: '',
      bankAgency: '',
      bankAccount: '',
      bankAccountType: 'Corrente',
      standardRate: workerRoles[0]?.defaultRate || 80.00
    });
    setIsFormOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (worker: Worker) => {
    setEditingWorkerId(worker.id);
    setCurrentStep(1);
    setFormError('');
    setFormData({
      name: worker.name,
      cpf: worker.cpf,
      birthDate: worker.birthDate || '',
      phone: worker.phone,
      city: worker.city || 'São Paulo',
      state: worker.state || 'SP',
      role: worker.role,
      teamZone: worker.teamZone,
      coordinatorId: worker.coordinatorId,
      managerId: worker.managerId || 'usr_gestor',
      status: worker.status === 'Inativo' ? 'Inativo' : worker.status === 'Em campo' ? 'Em campo' : 'Ativo',
      avatar: worker.avatar || '',
      voterRegistration: worker.voterRegistration || '',
      voterZone: worker.voterZone || '',
      voterSection: worker.voterSection || '',
      voterCity: worker.voterCity || worker.city || 'São Paulo',
      voterState: worker.voterState || worker.state || 'SP',
      voterDocumentPhoto: worker.voterDocumentPhoto || '',
      preferredPaymentMethod: worker.preferredPaymentMethod || 'PIX',
      pixType:
        worker.pixType === 'Celular' ? 'Telefone' :
        worker.pixType === 'E-mail' ? 'Email' :
        worker.pixType === 'Chave aleatória' ? 'Aleatória' :
        (worker.pixType as 'CPF' | 'Telefone' | 'Email' | 'Aleatória') || 'CPF',
      pixKey: worker.pixKey || '',
      pixAccountHolderType: worker.pixAccountHolderCpf ? 'Outro' : 'Proprio',
      pixAccountHolder: worker.pixAccountHolder || '',
      pixAccountHolderCpf: worker.pixAccountHolderCpf || '',
      bankName: worker.bankName || '',
      bankAgency: worker.bankAgency || '',
      bankAccount: worker.bankAccount || '',
      bankAccountType: worker.bankAccountType || 'Corrente',
      standardRate: worker.standardRate || 80.00
    });
    setIsFormOpen(true);
  };

  // File Upload Handlers (Direct Gallery / Camera)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormData(prev => ({ ...prev, avatar: event.target?.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVoterDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormData(prev => ({ ...prev, voterDocumentPhoto: event.target?.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Step Validation & Transition
  const handleNextStep = () => {
    setFormError('');
    if (currentStep === 1) {
      if (!formData.name.trim()) {
        setFormError('Informe o nome completo do trabalhador.');
        return;
      }
      if (!formData.cpf.trim()) {
        setFormError('Informe o CPF.');
        return;
      }
      if (!formData.phone.trim()) {
        setFormError('Informe o WhatsApp/Telefone.');
        return;
      }
      const duplicateByCpf = findDuplicateWorker(formData.cpf, '', editingWorkerId || undefined);
      if (duplicateByCpf) {
        setFormError(
          `Este CPF já está cadastrado na equipe de "${duplicateByCpf.coordinatorName}" (${duplicateByCpf.teamZone}), com o nome "${duplicateByCpf.name}". Não é permitido cadastrar a mesma pessoa em mais de uma equipe.`
        );
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Electoral data (optional or validate format if filled)
      setCurrentStep(3);
    }
  };

  const handleRoleChange = (role: WorkerRole) => {
    const rate = workerRoles.find(r => r.name === role)?.defaultRate || 80.00;
    setFormData(prev => ({
      ...prev,
      role,
      standardRate: rate
    }));
  };

  // Gerenciar Funções (Admin/Gestor)
  const handleAddRole = (e: React.FormEvent) => {
    e.preventDefault();
    setRolesError('');
    const rate = parseFloat(newRoleRate.replace(',', '.'));
    const result = addWorkerRole(newRoleName, isNaN(rate) ? 80 : rate);
    if (!result.ok) {
      setRolesError(result.error || 'Não foi possível adicionar a função.');
      return;
    }
    setNewRoleName('');
    setNewRoleRate('80');
  };

  const handleRemoveRole = (id: string) => {
    setRolesError('');
    const result = removeWorkerRole(id);
    if (!result.ok) {
      setRolesError(result.error || 'Não foi possível remover a função.');
    }
  };

  // Excluir Trabalhador
  const handleConfirmDeleteWorker = () => {
    if (!deletingWorker) return;
    setDeleteError('');
    const result = deleteWorker(deletingWorker.id);
    if (!result.ok) {
      setDeleteError(result.error || 'Não foi possível excluir este trabalhador.');
      return;
    }
    setDeletingWorker(null);
  };

  // Impede que o mesmo trabalhador (mesmo CPF ou mesmo título de eleitor)
  // seja cadastrado em mais de uma equipe. Retorna o cadastro já existente,
  // se houver, cruzando CPF e dados eleitorais.
  const onlyDigits = (v?: string) => (v || '').replace(/\D/g, '');

  const findDuplicateWorker = (cpf: string, voterRegistration: string, excludeId?: string): Worker | null => {
    const cpfDigits = onlyDigits(cpf);
    const voterDigits = onlyDigits(voterRegistration);

    return workers.find(w => {
      if (excludeId && w.id === excludeId) return false;
      const sameCpf = cpfDigits.length > 0 && onlyDigits(w.cpf) === cpfDigits;
      const sameVoter = voterDigits.length > 0 && onlyDigits(w.voterRegistration) === voterDigits;
      return sameCpf || sameVoter;
    }) || null;
  };

  // Submit Final Form
  const handleSaveWorker = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (formData.preferredPaymentMethod === 'PIX' && !formData.pixKey.trim()) {
      setFormError('Informe a chave PIX.');
      return;
    }

    const duplicate = findDuplicateWorker(formData.cpf, formData.voterRegistration, editingWorkerId || undefined);
    if (duplicate) {
      setFormError(
        `Este trabalhador já está cadastrado na equipe de "${duplicate.coordinatorName}" (${duplicate.teamZone}), com o nome "${duplicate.name}". Não é permitido cadastrar a mesma pessoa em mais de uma equipe.`
      );
      return;
    }

    const coord = users.find(u => u.id === formData.coordinatorId) || users[2];
    const gestor = users.find(u => u.id === formData.managerId) || users[1];

    const workerPayload: Omit<Worker, 'id'> = {
      name: formData.name.trim(),
      cpf: formData.cpf.trim(),
      birthDate: formData.birthDate,
      phone: formData.phone.trim(),
      city: formData.city.trim(),
      state: formData.state,
      role: formData.role,
      teamZone: formData.teamZone.trim(),
      coordinatorId: coord.id,
      coordinatorName: coord.name,
      managerId: gestor.id,
      managerName: gestor.name,
      standardRate: Number(formData.standardRate) || 80.00,
      status: formData.status,
      avatar: formData.avatar,
      // Electoral
      voterRegistration: formData.voterRegistration.trim(),
      voterZone: formData.voterZone.trim(),
      voterSection: formData.voterSection.trim(),
      voterCity: formData.voterCity.trim(),
      voterState: formData.voterState,
      voterDocumentPhoto: formData.voterDocumentPhoto,
      // Payment
      preferredPaymentMethod: formData.preferredPaymentMethod,
      pixType: formData.pixType,
      pixKey: formData.pixKey.trim(),
      pixAccountHolder: formData.pixAccountHolderType === 'Outro' ? formData.pixAccountHolder.trim() : formData.name.trim(),
      pixAccountHolderCpf: formData.pixAccountHolderType === 'Outro' ? formData.pixAccountHolderCpf.trim() : formData.cpf.trim(),
      bankName: formData.bankName.trim(),
      bankAgency: formData.bankAgency.trim(),
      bankAccount: formData.bankAccount.trim(),
      bankAccountType: formData.bankAccountType
    };

    if (editingWorkerId) {
      updateWorker(editingWorkerId, workerPayload);
    } else {
      addWorker(workerPayload);
    }

    setIsFormOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              {currentUser?.role === 'coordenador' ? 'Minha Equipe' : 'Trabalhadores'}
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {filteredWorkers.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastro e dados da equipe.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canManageRoles && (
            <button
              id="btn-gerenciar-funcoes"
              onClick={() => setIsRolesModalOpen(true)}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 active:scale-95 text-slate-700 font-bold rounded-xl text-xs sm:text-sm shadow-xs border border-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Settings className="w-4 h-4 text-slate-500" />
              <span>Funções</span>
            </button>
          )}
          <button
            id="btn-cadastrar-trabalhador"
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold rounded-xl text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span>Novo Trabalhador</span>
          </button>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        {/* Main Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              id="search-workers-input"
              type="text"
              placeholder="Pesquisar por Nome, CPF ou Título de Eleitor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
            />
          </div>

          {/* Status buttons */}
          <div className="sm:col-span-6 grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {(['Todos', 'Em campo', 'Faltou', 'Inativo'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-1 text-center cursor-pointer ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Dropdown Filters: Coordenador, Gestor, Cidade */}
        <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          {/* Filter by Coordenador */}
          {currentUser?.role !== 'coordenador' && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Filtrar por Coordenador:
              </label>
              <select
                id="filter-coordinator-select"
                value={coordinatorFilter}
                onChange={(e) => setCoordinatorFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium text-slate-700"
              >
                <option value="Todos">Todos os Coordenadores</option>
                {coordinators.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.teamZone})</option>
                ))}
              </select>
            </div>
          )}

          {/* Filter by Gestor (Admin only) */}
          {currentUser?.role === 'admin' && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Filtrar por Gestor:
              </label>
              <select
                id="filter-manager-select"
                value={managerFilter}
                onChange={(e) => setManagerFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium text-slate-700"
              >
                <option value="Todos">Todos os Gestores</option>
                {managers.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Filter by Cidade */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Filtrar por Cidade:
            </label>
            <select
              id="filter-city-select"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium text-slate-700"
            >
              <option value="Todos">Todas as Cidades</option>
              {availableCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Workers List / Cards */}
      {filteredWorkers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 shadow-xs">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Nenhum trabalhador localizado</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Não encontramos trabalhadores com os filtros e termos de pesquisa aplicados.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('Todos');
              setCoordinatorFilter('Todos');
              setManagerFilter('Todos');
              setCityFilter('Todos');
            }}
            className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Limpar todos os filtros
          </button>
        </div>
      ) : (
        <>
          {/* MOBILE CARDS */}
          <div className="grid grid-cols-1 gap-3 sm:hidden">
            {filteredWorkers.map((w) => (
              <div 
                key={w.id} 
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <img
                      src={w.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt={w.name}
                      className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-2xs shrink-0"
                    />
                    <div>
                      <h3 className="text-sm font-black text-slate-900 leading-tight">{w.name}</h3>
                      <div className="text-xs text-emerald-700 font-bold mt-0.5">{w.role}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{w.city || 'São Paulo'} - {w.teamZone}</span>
                      </div>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 uppercase tracking-wider ${
                    w.status === 'Em campo' 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                      : (w.status === 'Faltou' || w.status === 'Ativo')
                      ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {w.status === 'Ativo' ? 'Faltou' : w.status}
                  </span>
                </div>

                {/* Info Card Pill */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs space-y-1 font-medium">
                  <div className="flex justify-between text-slate-600">
                    <span>CPF:</span>
                    <span className="font-mono text-slate-900">{w.cpf}</span>
                  </div>
                  {w.voterRegistration && (
                    <div className="flex justify-between text-slate-600">
                      <span>Título de Eleitor:</span>
                      <span className="font-mono text-slate-900">{w.voterRegistration} (Z.{w.voterZone || '-'} / S.{w.voterSection || '-'})</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>Chave PIX ({w.pixType || 'PIX'}):</span>
                    <span className="font-mono text-slate-900 truncate max-w-[180px]">{w.pixKey || '-'}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Diária Padrão:</span>
                    <strong className="text-slate-900">{formatMoney(w.standardRate)}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Coordenação:</span>
                    <span className="text-slate-700 font-semibold">{w.coordinatorName}</span>
                  </div>
                </div>

                {/* Mobile Actions: Visualizar, Editar, Ativar/Desativar */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    onClick={() => setViewingWorker(w)}
                    className="py-2 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver Ficha</span>
                  </button>

                  <button
                    onClick={() => handleOpenEdit(w)}
                    className="py-2 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>

                  <button
                    onClick={() => toggleWorkerActive(w.id)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                      w.status === 'Inativo'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{w.status === 'Inativo' ? 'Ativar' : 'Desativar'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP TABLE - STRICT 100% WIDTH - ZERO HORIZONTAL SCROLLBAR */}
          <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs table-fixed">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="w-[27%] px-3.5 py-3">Trabalhador & CPF</th>
                  <th className="w-[15%] px-3 py-3">Função & Local</th>
                  <th className="w-[15%] px-3 py-3">Coordenação & PIX</th>
                  <th className="w-[11%] px-3 py-3 text-right">Diária Padrão</th>
                  <th className="w-[9%] px-3 py-3 text-center">Status</th>
                  <th className="w-[23%] px-3 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredWorkers.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-3.5 py-3 truncate">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={w.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                          alt={w.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 block truncate">{w.name}</span>
                          <span className="text-[11px] text-slate-400 font-mono truncate">{w.cpf}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 truncate">
                      <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md text-[11px] truncate inline-block">
                        {w.role}
                      </span>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">{w.city || 'São Paulo'} ({w.teamZone || 'Geral'})</div>
                    </td>
                    <td className="px-3 py-3 text-slate-600 truncate">
                      <div className="font-medium text-slate-800 truncate">{w.coordinatorName}</div>
                      <div className="text-[10px] text-slate-400 truncate font-mono">PIX: {w.pixKey || '-'}</div>
                    </td>
                    <td className="px-3 py-3 text-right font-black text-slate-900">
                      {formatMoney(w.standardRate)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-block uppercase tracking-wider ${
                        w.status === 'Em campo' 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                          : (w.status === 'Faltou' || w.status === 'Ativo')
                          ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {w.status === 'Ativo' ? 'Faltou' : w.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingWorker(w)}
                          title="Visualizar Ficha Completa"
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer shrink-0"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(w)}
                          title="Editar Ficha"
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer shrink-0"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => toggleWorkerActive(w.id)}
                          title={w.status === 'Inativo' ? 'Ativar Trabalhador' : 'Desativar Trabalhador'}
                          className={`p-1.5 rounded-lg border cursor-pointer shrink-0 ${
                            w.status === 'Inativo'
                              ? 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                              : 'text-slate-400 hover:text-rose-600 border-slate-200 hover:bg-rose-50'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                        {currentUser?.role === 'admin' && (
                          <button
                            onClick={() => { setDeletingWorker(w); setDeleteError(''); }}
                            title="Excluir Trabalhador"
                            className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg border border-slate-200 hover:border-rose-200 cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* ========================================================================= */}
      {/* 3-STEP REGISTRATION & EDIT MODAL (FICHA DO TRABALHADOR EM 3 ETAPAS) */}
      {/* ========================================================================= */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div 
            id="modal-worker-form" 
            className="bg-white w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 max-h-[94vh] flex flex-col animate-in fade-in slide-in-from-bottom-6"
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white rounded-t-3xl sm:rounded-t-2xl">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-400" />
                  <span>{editingWorkerId ? 'Editar Ficha do Trabalhador' : 'Cadastro de Trabalhador'}</span>
                </h2>
                <p className="text-xs text-slate-400">Dividido em 3 etapas para preenchimento rápido e organizado</p>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Progress Bar */}
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              {[
                { step: 1, label: '1. Dados Pessoais' },
                { step: 2, label: '2. Dados Eleitorais' },
                { step: 3, label: '3. Pagamento' }
              ].map((item) => (
                <button
                  key={item.step}
                  type="button"
                  onClick={() => {
                    if (item.step < currentStep) setCurrentStep(item.step as 1 | 2 | 3);
                  }}
                  className={`flex items-center gap-1.5 text-xs font-bold py-1 px-2.5 rounded-lg transition-all ${
                    currentStep === item.step
                      ? 'bg-slate-900 text-white shadow-xs'
                      : currentStep > item.step
                      ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 cursor-pointer'
                      : 'text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {currentStep > item.step ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <span className="w-4 h-4 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center text-[10px]">
                      {item.step}
                    </span>
                  )}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            {/* Form Content */}
            <form onSubmit={handleSaveWorker} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* ========================================================= */}
              {/* ETAPA 1 — DADOS PESSOAIS */}
              {/* ========================================================= */}
              {currentStep === 1 && (
                <div className="space-y-3.5">
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Foto do Trabalhador (Upload da Galeria / Câmera)
                    </label>
                    <div className="flex items-center gap-3.5">
                      <div className="relative shrink-0">
                        <img 
                          src={formData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                          alt="Foto" 
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md"
                        />
                        <label 
                          htmlFor="worker-avatar-upload" 
                          className="absolute -bottom-1.5 -right-1.5 p-1.5 bg-slate-900 text-white rounded-xl shadow cursor-pointer hover:bg-slate-800 transition-transform active:scale-95"
                          title="Tirar foto ou abrir galeria"
                        >
                          <Camera className="w-3.5 h-3.5 text-emerald-400" />
                        </label>
                      </div>

                      <div className="flex-1 space-y-1.5 min-w-0">
                        <input
                          type="file"
                          id="worker-avatar-upload"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          <label
                            htmlFor="worker-avatar-upload"
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold cursor-pointer shadow-xs transition-colors"
                          >
                            <ImageIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Escolher da Galeria / Câmera</span>
                          </label>
                          {formData.avatar && (
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, avatar: '' }))}
                              className="px-2 py-1.5 text-xs text-rose-600 hover:text-rose-800 font-semibold"
                            >
                              Remover Foto
                            </button>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 block">
                          Selecione da galeria de fotos ou fotografe diretamente.
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1" htmlFor="inp-worker-name">
                      Nome Completo *
                    </label>
                    <input
                      id="inp-worker-name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Carlos Eduardo de Oliveira"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1" htmlFor="inp-worker-cpf">
                        CPF *
                      </label>
                      <input
                        id="inp-worker-cpf"
                        type="text"
                        required
                        value={formData.cpf}
                        onChange={(e) => setFormData(prev => ({ ...prev, cpf: e.target.value }))}
                        placeholder="000.000.000-00"
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1" htmlFor="inp-worker-birth">
                        Data de Nascimento
                      </label>
                      <input
                        id="inp-worker-birth"
                        type="date"
                        value={formData.birthDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1" htmlFor="inp-worker-phone">
                        Telefone / WhatsApp *
                      </label>
                      <input
                        id="inp-worker-phone"
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="(11) 98765-4321"
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-1.5">
                      <div className="col-span-2">
                        <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1" htmlFor="inp-worker-city">
                          Cidade
                        </label>
                        <input
                          id="inp-worker-city"
                          type="text"
                          value={formData.city}
                          onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                          placeholder="Cidade"
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1" htmlFor="inp-worker-uf">
                          UF
                        </label>
                        <select
                          id="inp-worker-uf"
                          value={formData.state}
                          onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                          className="w-full px-2 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 font-bold"
                        >
                          {BRAZIL_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Função na Campanha */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold uppercase text-slate-700" htmlFor="inp-worker-role">
                        Função na Campanha *
                      </label>
                      {canManageRoles && (
                        <button
                          type="button"
                          onClick={() => setIsRolesModalOpen(true)}
                          className="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                        >
                          Gerenciar funções
                        </button>
                      )}
                    </div>
                    <select
                      id="inp-worker-role"
                      value={formData.role}
                      onChange={(e) => handleRoleChange(e.target.value as WorkerRole)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white font-semibold"
                    >
                      {workerRoles.map(r => (
                        <option key={r.id} value={r.name}>{r.name} (Diária padrão: {formatMoney(r.defaultRate)})</option>
                      ))}
                    </select>
                  </div>

                  {/* Coordenador e Gestor Responsável */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1" htmlFor="inp-worker-coord">
                        Coordenador Responsável *
                      </label>
                      <select
                        id="inp-worker-coord"
                        value={formData.coordinatorId}
                        onChange={(e) => {
                          const cId = e.target.value;
                          const foundC = users.find(u => u.id === cId);
                          setFormData(prev => ({
                            ...prev,
                            coordinatorId: cId,
                            teamZone: foundC?.teamZone || prev.teamZone,
                            managerId: foundC?.managerId || prev.managerId
                          }));
                        }}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                      >
                        {coordinators.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1" htmlFor="inp-worker-manager">
                        Gestor Responsável *
                      </label>
                      <select
                        id="inp-worker-manager"
                        value={formData.managerId}
                        onChange={(e) => setFormData(prev => ({ ...prev, managerId: e.target.value }))}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                      >
                        {managers.map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Status: Ativo ou Inativo */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                      Status do Trabalhador
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, status: 'Ativo' }))}
                        className={`py-2 px-3 rounded-xl font-bold border text-center transition-all ${
                          formData.status !== 'Inativo'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        Ativo
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, status: 'Inativo' }))}
                        className={`py-2 px-3 rounded-xl font-bold border text-center transition-all ${
                          formData.status === 'Inativo'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        Inativo
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* ETAPA 2 — DADOS ELEITORAIS */}
              {/* ========================================================= */}
              {currentStep === 2 && (
                <div className="space-y-3.5">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 flex items-center gap-2">
                    <Vote className="w-5 h-5 text-blue-600 shrink-0" />
                    <div>
                      <h4 className="font-bold">Validação de Domicílio Eleitoral</h4>
                      <p className="text-[11px] text-blue-700">Necessário para cumprimento de conformidade e fiscalização de campanha.</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1" htmlFor="inp-worker-voter">
                      Número do Título de Eleitor
                    </label>
                    <input
                      id="inp-worker-voter"
                      type="text"
                      value={formData.voterRegistration}
                      onChange={(e) => setFormData(prev => ({ ...prev, voterRegistration: e.target.value }))}
                      placeholder="Ex: 041289010192"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1" htmlFor="inp-worker-zone">
                        Zona Eleitoral
                      </label>
                      <input
                        id="inp-worker-zone"
                        type="text"
                        value={formData.voterZone}
                        onChange={(e) => setFormData(prev => ({ ...prev, voterZone: e.target.value }))}
                        placeholder="Ex: 249"
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1" htmlFor="inp-worker-section">
                        Seção Eleitoral
                      </label>
                      <input
                        id="inp-worker-section"
                        type="text"
                        value={formData.voterSection}
                        onChange={(e) => setFormData(prev => ({ ...prev, voterSection: e.target.value }))}
                        placeholder="Ex: 0312"
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="col-span-2">
                      <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1" htmlFor="inp-worker-voter-city">
                        Município Eleitoral
                      </label>
                      <input
                        id="inp-worker-voter-city"
                        type="text"
                        value={formData.voterCity}
                        onChange={(e) => setFormData(prev => ({ ...prev, voterCity: e.target.value }))}
                        placeholder="São Paulo"
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1" htmlFor="inp-worker-voter-uf">
                        UF Eleitoral
                      </label>
                      <select
                        id="inp-worker-voter-uf"
                        value={formData.voterState}
                        onChange={(e) => setFormData(prev => ({ ...prev, voterState: e.target.value }))}
                        className="w-full px-2 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 font-bold"
                      >
                        {BRAZIL_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Foto do Título ou Documento (Galeria) */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Foto do Título ou Documento (Upload da Galeria / Câmera)
                    </label>
                    <div className="flex items-center gap-3">
                      {formData.voterDocumentPhoto && (
                        <div className="relative shrink-0">
                          <img 
                            src={formData.voterDocumentPhoto} 
                            alt="Documento" 
                            className="w-16 h-16 rounded-xl object-cover border border-slate-300 shadow-xs"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, voterDocumentPhoto: '' }))}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow"
                            title="Remover anexo"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      <div className="flex-1 space-y-1">
                        <input
                          type="file"
                          id="worker-voter-doc-upload"
                          accept="image/*"
                          onChange={handleVoterDocUpload}
                          className="hidden"
                        />
                        <label
                          htmlFor="worker-voter-doc-upload"
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold cursor-pointer shadow-xs transition-colors"
                        >
                          <Camera className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>{formData.voterDocumentPhoto ? 'Alterar Foto do Documento' : 'Escolher Foto da Galeria / Câmera'}</span>
                        </label>
                        <p className="text-[10px] text-slate-400">
                          Fotografe o título de eleitor ou documento oficial com foto.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* ETAPA 3 — PAGAMENTO */}
              {/* ========================================================= */}
              {currentStep === 3 && (
                <div className="space-y-3.5">
                  {/* Forma preferencial de pagamento */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                      Forma Preferencial de Pagamento *
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['PIX', 'Dinheiro', 'Transferência'] as PaymentMethod[]).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, preferredPaymentMethod: m }))}
                          className={`py-2.5 rounded-xl font-bold border text-center transition-all ${
                            formData.preferredPaymentMethod === m
                              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          {m === 'Dinheiro' ? 'Dinheiro em espécie' : m === 'Transferência' ? 'Transferência bancária' : 'PIX'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* IF PIX */}
                  {formData.preferredPaymentMethod === 'PIX' && (
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                          Tipo de Chave PIX
                        </label>
                        <div className="grid grid-cols-4 gap-1.5">
                          {(['CPF', 'Telefone', 'Email', 'Aleatória'] as const).map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, pixType: t }))}
                              className={`py-1.5 rounded-lg text-xs font-bold border text-center ${
                                formData.pixType === t
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                  : 'bg-white text-slate-600 border-slate-200'
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1" htmlFor="inp-pix-key">
                          Chave PIX *
                        </label>
                        <input
                          id="inp-pix-key"
                          type="text"
                          required
                          value={formData.pixKey}
                          onChange={(e) => setFormData(prev => ({ ...prev, pixKey: e.target.value }))}
                          placeholder={`Informe a chave PIX (${formData.pixType})`}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                      </div>

                      {/* Titular da conta: Próprio ou Outra Pessoa */}
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                          Titular da Conta do PIX
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, pixAccountHolderType: 'Proprio' }))}
                            className={`py-1.5 px-2 rounded-lg text-xs font-bold border ${
                              formData.pixAccountHolderType === 'Proprio'
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-white text-slate-600 border-slate-200'
                            }`}
                          >
                            Mesmo do Trabalhador
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, pixAccountHolderType: 'Outro' }))}
                            className={`py-1.5 px-2 rounded-lg text-xs font-bold border ${
                              formData.pixAccountHolderType === 'Outro'
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-white text-slate-600 border-slate-200'
                            }`}
                          >
                            Outra Pessoa / Terceiro
                          </button>
                        </div>
                      </div>

                      {formData.pixAccountHolderType === 'Outro' && (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                              Nome do Titular
                            </label>
                            <input
                              type="text"
                              value={formData.pixAccountHolder}
                              onChange={(e) => setFormData(prev => ({ ...prev, pixAccountHolder: e.target.value }))}
                              placeholder="Nome do titular da conta"
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                              CPF do Titular
                            </label>
                            <input
                              type="text"
                              value={formData.pixAccountHolderCpf}
                              onChange={(e) => setFormData(prev => ({ ...prev, pixAccountHolderCpf: e.target.value }))}
                              placeholder="000.000.000-00"
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* IF TRANSFERÊNCIA BANCÁRIA */}
                  {formData.preferredPaymentMethod === 'Transferência' && (
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                            Banco
                          </label>
                          <input
                            type="text"
                            value={formData.bankName}
                            onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                            placeholder="Ex: Banco do Brasil"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                            Tipo de Conta
                          </label>
                          <select
                            value={formData.bankAccountType}
                            onChange={(e) => setFormData(prev => ({ ...prev, bankAccountType: e.target.value as 'Corrente' | 'Poupança' }))}
                            className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                          >
                            <option value="Corrente">Corrente</option>
                            <option value="Poupança">Poupança</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                            Agência
                          </label>
                          <input
                            type="text"
                            value={formData.bankAgency}
                            onChange={(e) => setFormData(prev => ({ ...prev, bankAgency: e.target.value }))}
                            placeholder="Ex: 1234-5"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                            Conta com Dígito
                          </label>
                          <input
                            type="text"
                            value={formData.bankAccount}
                            onChange={(e) => setFormData(prev => ({ ...prev, bankAccount: e.target.value }))}
                            placeholder="Ex: 98765-4"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Valor Padrão da Diária (R$) */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1" htmlFor="inp-standard-rate">
                      Valor Padrão da Diária (R$) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">R$</span>
                      <input
                        id="inp-standard-rate"
                        type="number"
                        min="0"
                        step="5"
                        required
                        value={formData.standardRate}
                        onChange={(e) => setFormData(prev => ({ ...prev, standardRate: parseFloat(e.target.value) || 0 }))}
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-black focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Definido automaticamente com base na função [{formData.role}], podendo ser alterado manualmente.
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(prev => (prev - 1) as 1 | 2 | 3)}
                    className="px-4 py-2.5 border border-slate-300 hover:bg-slate-100 font-bold text-slate-700 rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Voltar</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2.5 border border-slate-300 hover:bg-slate-100 font-bold text-slate-700 rounded-xl text-xs cursor-pointer"
                  >
                    Cancelar
                  </button>
                )}

                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <span>Avançar para {currentStep === 1 ? 'Dados Eleitorais' : 'Pagamento'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{editingWorkerId ? 'Salvar Alterações' : 'Concluir Cadastro'}</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW WORKER DETAILS MODAL (FICHA COMPLETA DO TRABALHADOR) */}
      {/* ========================================================================= */}
      {viewingWorker && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col animate-in fade-in slide-in-from-bottom-6">
            
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white rounded-t-3xl sm:rounded-t-2xl">
              <div className="flex items-center gap-3">
                <img
                  src={viewingWorker.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={viewingWorker.name}
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-400"
                />
                <div>
                  <h2 className="text-base font-bold text-white leading-tight">{viewingWorker.name}</h2>
                  <div className="text-xs text-emerald-400 font-bold">{viewingWorker.role}</div>
                </div>
              </div>
              <button
                onClick={() => setViewingWorker(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Details Content */}
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Status and Rate highlight */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[11px]">Diária Padrão:</span>
                  <span className="text-lg font-black text-slate-900">{formatMoney(viewingWorker.standardRate)}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[11px]">Status Atual:</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-block uppercase tracking-wider ${
                    viewingWorker.status === 'Em campo' 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                      : (viewingWorker.status === 'Faltou' || viewingWorker.status === 'Ativo')
                      ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {viewingWorker.status === 'Ativo' ? 'Faltou' : viewingWorker.status}
                  </span>
                </div>
              </div>

              {/* Seção 1: Dados Pessoais */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] border-b pb-1">
                  1. Dados Pessoais
                </h4>
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[10px]">CPF:</span>
                    <strong className="text-slate-900 font-mono">{viewingWorker.cpf}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Telefone/WhatsApp:</span>
                    <a href={`tel:${viewingWorker.phone}`} className="text-blue-600 font-bold">{viewingWorker.phone}</a>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Data de Nascimento:</span>
                    <strong className="text-slate-900">{viewingWorker.birthDate || 'Não informada'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Município / UF:</span>
                    <strong className="text-slate-900">{viewingWorker.city || 'São Paulo'} - {viewingWorker.state || 'SP'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Coordenador:</span>
                    <strong className="text-slate-900">{viewingWorker.coordinatorName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Gestor Responsável:</span>
                    <strong className="text-slate-900">{viewingWorker.managerName || 'Central'}</strong>
                  </div>
                </div>
              </div>

              {/* Seção 2: Dados Eleitorais */}
              <div className="space-y-2 pt-2">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] border-b pb-1">
                  2. Dados Eleitorais
                </h4>
                <div className="grid grid-cols-3 gap-2 text-slate-600">
                  <div className="col-span-3">
                    <span className="text-slate-400 block text-[10px]">Título de Eleitor:</span>
                    <strong className="text-slate-900 font-mono text-sm">{viewingWorker.voterRegistration || 'Não informado'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Zona Eleitoral:</span>
                    <strong className="text-slate-900 font-mono">{viewingWorker.voterZone || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Seção Eleitoral:</span>
                    <strong className="text-slate-900 font-mono">{viewingWorker.voterSection || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Município Eleitoral:</span>
                    <strong className="text-slate-900">{viewingWorker.voterCity || viewingWorker.city || 'São Paulo'}/{viewingWorker.voterState || viewingWorker.state || 'SP'}</strong>
                  </div>
                  {viewingWorker.voterDocumentPhoto && (
                    <div className="col-span-3 pt-2">
                      <span className="text-slate-400 block text-[10px] mb-1">Foto do Documento/Título Anexo:</span>
                      <img 
                        src={viewingWorker.voterDocumentPhoto} 
                        alt="Documento Eleitoral" 
                        className="w-full max-h-48 rounded-xl object-contain bg-slate-900/5 border border-slate-200"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Seção 3: Dados de Pagamento */}
              <div className="space-y-2 pt-2">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] border-b pb-1">
                  3. Dados de Pagamento
                </h4>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Forma Preferencial:</span>
                    <strong className="text-slate-900">{viewingWorker.preferredPaymentMethod || 'PIX'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Chave PIX ({viewingWorker.pixType || 'PIX'}):</span>
                    <strong className="text-slate-900 font-mono">{viewingWorker.pixKey || '-'}</strong>
                  </div>
                  {viewingWorker.pixAccountHolder && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Titular da Conta:</span>
                      <span className="text-slate-800">{viewingWorker.pixAccountHolder} ({viewingWorker.pixAccountHolderCpf || viewingWorker.cpf})</span>
                    </div>
                  )}
                  {viewingWorker.bankName && (
                    <div className="flex justify-between pt-1 border-t border-slate-200">
                      <span className="text-slate-500">Banco / Ag / Conta:</span>
                      <span className="text-slate-900 font-mono">{viewingWorker.bankName} | Ag: {viewingWorker.bankAgency} | CC: {viewingWorker.bankAccount}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    const target = viewingWorker;
                    setViewingWorker(null);
                    handleOpenEdit(target);
                  }}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar Cadastro</span>
                </button>

                <button
                  onClick={() => {
                    toggleWorkerActive(viewingWorker.id);
                    setViewingWorker(prev => prev ? {
                      ...prev,
                      status: prev.status === 'Inativo' ? 'Ativo' : 'Inativo'
                    } : null);
                  }}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer ${
                    viewingWorker.status === 'Inativo'
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{viewingWorker.status === 'Inativo' ? 'Ativar Trabalhador' : 'Desativar Trabalhador'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gerenciar Funções de Trabalhador (Admin/Gestor) */}
      {isRolesModalOpen && canManageRoles && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200 max-h-[85vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-slate-500" />
                  <span>Funções de Trabalhador</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Adicione ou remova funções e suas diárias padrão.</p>
              </div>
              <button
                onClick={() => { setIsRolesModalOpen(false); setRolesError(''); }}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              {rolesError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{rolesError}</span>
                </div>
              )}

              <form onSubmit={handleAddRole} className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1" htmlFor="new-role-name">
                    Nova função
                  </label>
                  <input
                    id="new-role-name"
                    type="text"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    placeholder="Ex: Segurança"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>
                <div className="w-28">
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1" htmlFor="new-role-rate">
                    Diária (R$)
                  </label>
                  <input
                    id="new-role-rate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newRoleRate}
                    onChange={(e) => setNewRoleRate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shrink-0 cursor-pointer"
                  title="Adicionar função"
                >
                  <PlusCircle className="w-4 h-4" />
                </button>
              </form>

              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                {workerRoles.length === 0 ? (
                  <div className="text-center text-slate-400 text-xs py-4">Nenhuma função cadastrada.</div>
                ) : (
                  workerRoles.map(role => {
                    const inUse = workers.some(w => w.role === role.name);
                    return (
                      <div key={role.id} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
                        <div>
                          <div className="text-xs font-bold text-slate-900">{role.name}</div>
                          <div className="text-[11px] text-slate-500">Diária padrão: {formatMoney(role.defaultRate)}</div>
                        </div>
                        <button
                          onClick={() => handleRemoveRole(role.id)}
                          disabled={inUse}
                          title={inUse ? 'Em uso por trabalhadores cadastrados' : 'Remover função'}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer disabled:text-slate-300 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmar Exclusão de Trabalhador */}
      {deletingWorker && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Excluir Trabalhador</h3>
            <p className="text-xs text-slate-600 mt-1 mb-4 leading-relaxed">
              Tem certeza que deseja excluir <strong>{deletingWorker.name}</strong> permanentemente? Essa ação não pode ser desfeita.
              {' '}Se o trabalhador tiver diárias ou pagamentos registrados, use "Desativar" em vez de excluir.
            </p>

            {deleteError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => { setDeletingWorker(null); setDeleteError(''); }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteWorker}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow cursor-pointer"
              >
                Excluir Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
