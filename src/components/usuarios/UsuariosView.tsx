'use client';

import React, { useState } from 'react';
import { useApp, getRoleLabel } from '../../context/AppContext';
import { User, UserRole } from '../../types';
import { 
  UserCheck, 
  PlusCircle, 
  Search, 
  ShieldCheck, 
  Mail, 
  Phone, 
  MapPin, 
  X,
  AlertCircle,
  KeyRound,
  Edit2,
  Trash2,
  Lock,
  UserX,
  ShieldAlert,
  CheckCircle2,
  Info,
  Camera,
  Image as ImageIcon,
  Eye,
  EyeOff,
  Check
} from 'lucide-react';

export const UsuariosView: React.FC = () => {
  const { 
    currentUser, 
    users, 
    addUser, 
    updateUser, 
    toggleUserActive, 
    resetUserPassword, 
    canDeleteUser, 
    showNotification 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'Todos' | UserRole>('Todos');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Ativo' | 'Inativo'>('Todos');

  // New user modal state
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('coordenador');
  const [teamZone, setTeamZone] = useState('');
  const [phone, setPhone] = useState('');
  const [managerId, setManagerId] = useState('');
  const [initialPassword, setInitialPassword] = useState('123');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [formError, setFormError] = useState('');

  // Edit user modal state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('coordenador');
  const [editTeamZone, setEditTeamZone] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editManagerId, setEditManagerId] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [editPassword, setEditPassword] = useState('');
  const [editConfirmPassword, setEditConfirmPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editPasswordError, setEditPasswordError] = useState('');

  // Password change modal state (Exclusivo Administrador)
  const [passwordResetUser, setPasswordResetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Deletion block dialog
  const [deletionBlockReason, setDeletionBlockReason] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'admin';

  // List of all active gestores for hierarchy binding
  const gestores = users.filter(u => u.role === 'gestor' && u.active !== false);

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'Todos' && u.role !== roleFilter) return false;
    if (statusFilter !== 'Todos') {
      const isActive = u.active !== false;
      if (statusFilter === 'Ativo' && !isActive) return false;
      if (statusFilter === 'Inativo' && isActive) return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) || 
        u.email.toLowerCase().includes(q) || 
        (u.teamZone || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Open Edit Modal
  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditRole(u.role);
    setEditTeamZone(u.teamZone || '');
    setEditPhone(u.phone || '');
    setEditManagerId(u.managerId || '');
    setEditAvatar(u.avatar);
    setEditActive(u.active !== false);
    setEditPassword('');
    setEditConfirmPassword('');
    setShowEditPassword(false);
    setEditPasswordError('');
  };

  const handleUserPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatarUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditUserPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setEditAvatar(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit New User
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim() || !email.trim()) {
      setFormError('Informe o nome e o e-mail do usuário.');
      return;
    }

    if (role === 'coordenador' && !managerId && gestores.length > 0) {
      setFormError('Vincule o Gestor responsável pelo coordenador.');
      return;
    }

    addUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: initialPassword.trim() || '123',
      role,
      teamZone: teamZone.trim() || 'Comitê Central',
      phone: phone.trim() || '(11) 90000-0000',
      managerId: role === 'coordenador' ? managerId : undefined,
      active: true,
      avatar: avatarUrl.trim() || `https://images.unsplash.com/photo-${1520000000000 + Math.floor(Math.random() * 100000)}?w=150&auto=format&fit=crop&q=80`
    });

    setIsAddUserOpen(false);
    setName('');
    setEmail('');
    setTeamZone('');
    setPhone('');
    setManagerId('');
    setInitialPassword('123');
    setAvatarUrl('');
  };

  // Submit Edit User
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditPasswordError('');

    if (editPassword.trim()) {
      if (editPassword.trim().length < 3) {
        setEditPasswordError('A nova senha deve ter no mínimo 3 caracteres.');
        return;
      }
      if (editPassword.trim() !== editConfirmPassword.trim()) {
        setEditPasswordError('A confirmação da nova senha não confere.');
        return;
      }
    }

    updateUser(editingUser.id, {
      name: editName.trim(),
      email: editEmail.trim().toLowerCase(),
      role: editRole,
      teamZone: editTeamZone.trim(),
      phone: editPhone.trim(),
      managerId: editRole === 'coordenador' ? editManagerId : undefined,
      avatar: editAvatar.trim() || editingUser.avatar,
      active: editActive,
      password: editPassword.trim() ? editPassword.trim() : editingUser.password,
    });

    setEditingUser(null);
  };

  // Submit Admin Password Change
  const handleSavePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !passwordResetUser) return;
    setPasswordError('');

    if (!newPassword.trim()) {
      setPasswordError('Digite a nova senha para o usuário.');
      return;
    }

    if (newPassword.trim().length < 3) {
      setPasswordError('A nova senha deve ter no mínimo 3 caracteres.');
      return;
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      setPasswordError('As senhas digitadas não coincidem.');
      return;
    }

    resetUserPassword(passwordResetUser.id, newPassword.trim());
    setPasswordResetUser(null);
    setNewPassword('');
    setConfirmPassword('');
  };

  // Delete attempt handler
  const handleDeleteAttempt = (user: User) => {
    const check = canDeleteUser(user.id);
    if (!check.canDelete) {
      setDeletionBlockReason(check.reason || 'Usuário possui registros associados.');
    } else {
      toggleUserActive(user.id);
    }
  };

  return (
    <div className="space-y-5 pb-24 lg:pb-8">
      {/* Non-admin notice */}
      {!isAdmin && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3 text-amber-800">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <span className="font-bold">Modo Consulta: </span>
            Apenas o <strong className="font-bold text-amber-900">Administrador</strong> tem permissão para cadastrar, editar, desativar ou redefinir senhas de Gestores e Coordenadores.
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              Usuários
            </h1>
            <span className="px-2 py-0.5 bg-purple-50 text-purple-700 font-bold rounded-full text-[10px] border border-purple-200">
              Acessos
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Controle de acessos e permissões do sistema.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsAddUserOpen(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold rounded-xl text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span>Novo Usuário</span>
          </button>
        )}
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Buscar por nome, e-mail ou região..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-slate-900 focus:bg-white"
            >
              <option value="Todos">Perfil: Todos</option>
              <option value="admin">Administrador</option>
              <option value="gestor">Gestor</option>
              <option value="coordenador">Coordenador</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-slate-900 focus:bg-white"
            >
              <option value="Todos">Status: Todos</option>
              <option value="Ativo">Apenas Ativos</option>
              <option value="Inativo">Apenas Inativos</option>
            </select>
          </div>
        </div>
      </div>

      {/* MOBILE CARDS */}
      <div className="grid grid-cols-1 gap-3.5 sm:hidden">
        {filteredUsers.map((u) => {
          const isActive = u.active !== false;
          const manager = users.find(m => m.id === u.managerId);

          return (
            <div 
              key={u.id} 
              className={`bg-white p-4 rounded-2xl border transition-all ${
                isActive ? 'border-slate-200 shadow-xs' : 'border-slate-200 bg-slate-50/70 opacity-80'
              }`}
            >
              <div className="flex items-start gap-3">
                <img
                  src={u.avatar}
                  alt={u.name}
                  className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 truncate">{u.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      u.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                      u.role === 'gestor' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {getRoleLabel(u.role)}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 truncate">{u.email}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{u.teamZone || 'Comitê Central'}</div>
                  {u.role === 'coordenador' && manager && (
                    <div className="text-[11px] text-blue-600 font-semibold mt-0.5">
                      Gestor: {manager.name}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className={`font-bold text-[11px] flex items-center gap-1 ${
                  isActive ? 'text-emerald-700' : 'text-slate-400'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  {isActive ? 'Ativo' : 'Inativo'}
                </span>

                {isAdmin && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => handleOpenEdit(u)}
                      className="p-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 cursor-pointer"
                      title="Editar Usuário"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setPasswordResetUser(u);
                        setNewPassword('');
                        setConfirmPassword('');
                        setShowNewPassword(false);
                        setShowConfirmPassword(false);
                        setPasswordError('');
                      }}
                      className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 active:scale-95 text-blue-700 border border-blue-200/80 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                      title="Alterar Senha deste Usuário (Exclusivo Administrador)"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                      <span>Alterar Senha</span>
                    </button>
                    <button
                      onClick={() => toggleUserActive(u.id)}
                      className={`px-2.5 py-1.5 rounded-xl font-bold text-xs cursor-pointer ${
                        isActive
                          ? 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                      }`}
                    >
                      {isActive ? 'Desativar' : 'Ativar'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* DESKTOP TABLE - STRICT 100% WIDTH - ZERO HORIZONTAL SCROLLBAR */}
      <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs table-fixed">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
            <tr>
              <th className="w-[28%] px-3.5 py-3">Usuário & E-mail</th>
              <th className="w-[16%] px-3 py-3">Região / Zona</th>
              <th className="w-[16%] px-3 py-3">Hierarquia (Gestor)</th>
              <th className="w-[11%] px-3 py-3 text-center">Perfil</th>
              <th className="w-[9%] px-2 py-3 text-center">Status</th>
              {isAdmin && <th className="w-[20%] px-3 py-3 text-right">Ações</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.map((u) => {
              const isActive = u.active !== false;
              const manager = users.find(m => m.id === u.managerId);

              return (
                <tr key={u.id} className={`hover:bg-slate-50/80 transition-colors ${!isActive ? 'bg-slate-50/50' : ''}`}>
                  <td className="px-3.5 py-3 truncate">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={u.avatar}
                        alt={u.name}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 block truncate">{u.name}</span>
                        <span className="text-[11px] text-slate-400 block truncate">{u.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-slate-600 truncate">{u.teamZone || 'Comitê Central'}</td>
                  <td className="px-3 py-3 truncate">
                    {u.role === 'coordenador' ? (
                      manager ? (
                        <span className="font-semibold text-blue-700 block truncate">{manager.name}</span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Sem gestor vinculado</span>
                      )
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center truncate">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-block ${
                      u.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                      u.role === 'gestor' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {getRoleLabel(u.role)}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                          title="Editar Dados"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setPasswordResetUser(u);
                            setNewPassword('');
                            setConfirmPassword('');
                            setShowNewPassword(false);
                            setShowConfirmPassword(false);
                            setPasswordError('');
                          }}
                          className="px-2 py-1 bg-blue-50 hover:bg-blue-100 active:scale-95 text-blue-700 border border-blue-200/80 rounded-lg text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1 shrink-0"
                          title="Alterar Senha deste Usuário (Exclusivo Administrador)"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                          <span>Senha</span>
                        </button>
                        <button
                          onClick={() => toggleUserActive(u.id)}
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {isActive ? 'Desativar' : 'Ativar'}
                        </button>
                        <button
                          onClick={() => handleDeleteAttempt(u)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Excluir (com proteção de auditoria)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL: NOVO USUÁRIO */}
      {isAddUserOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full sm:max-w-lg rounded-2xl shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white rounded-t-2xl">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-bold text-white">Cadastrar Novo Usuário</h2>
              </div>
              <button
                onClick={() => setIsAddUserOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="p-5 sm:p-6 space-y-3.5 overflow-y-auto flex-1 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1" htmlFor="new-name">
                  Nome Completo *
                </label>
                <input
                  id="new-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Roberto Silveira"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-slate-900 focus:bg-white"
                />
              </div>

              {/* Photo Upload from Gallery / Camera */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
                <img 
                  src={avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                  alt="Avatar" 
                  className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-xs shrink-0" 
                />
                <div className="flex-1 space-y-1">
                  <input
                    type="file"
                    id="new-user-photo"
                    accept="image/*"
                    onChange={handleUserPhotoUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="new-user-photo"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold cursor-pointer shadow-xs transition-colors"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Carregar Foto da Galeria / Câmera</span>
                  </label>
                  <p className="text-[10px] text-slate-400">Opcional - selecione da galeria ou tire foto</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1" htmlFor="new-email">
                    E-mail de Acesso *
                  </label>
                  <input
                    id="new-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nome@campanha.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1" htmlFor="new-phone">
                    Telefone / WhatsApp *
                  </label>
                  <input
                    id="new-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1" htmlFor="new-role">
                    Tipo de Usuário *
                  </label>
                  <select
                    id="new-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  >
                    <option value="coordenador">Coordenador (Equipe de Campo)</option>
                    <option value="gestor">Gestor (Aprovação Regional)</option>
                    <option value="admin">Administrador (Controle Total & Financeiro)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1" htmlFor="new-password">
                    Senha Inicial *
                  </label>
                  <input
                    id="new-password"
                    type="text"
                    required
                    value={initialPassword}
                    onChange={(e) => setInitialPassword(e.target.value)}
                    placeholder="123"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              {/* Hierarchy Rule: Coordenador must have a Gestor vinculado */}
              {role === 'coordenador' && (
                <div className="bg-blue-50 p-3.5 rounded-xl border border-blue-200 space-y-1.5">
                  <label className="block text-xs font-bold uppercase text-blue-900" htmlFor="new-manager">
                    Gestor Responsável Vinculado *
                  </label>
                  <select
                    id="new-manager"
                    value={managerId}
                    onChange={(e) => setManagerId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-blue-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="">Selecione o Gestor...</option>
                    {gestores.map(g => (
                      <option key={g.id} value={g.id}>{g.name} ({g.teamZone || 'Regional'})</option>
                    ))}
                  </select>
                  <span className="text-[11px] text-blue-700 block">
                    As diárias lançadas por este coordenador serão encaminhadas para aprovação deste Gestor.
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1" htmlFor="new-zone">
                  Zona Eleitoral / Regional
                </label>
                <input
                  id="new-zone"
                  type="text"
                  value={teamZone}
                  onChange={(e) => setTeamZone(e.target.value)}
                  placeholder="Ex: Zona Norte - Santana / Tucuruvi"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-slate-900 focus:bg-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow-md cursor-pointer"
                >
                  Cadastrar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR USUÁRIO */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full sm:max-w-lg rounded-2xl shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white rounded-t-2xl">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-bold text-white">Editar Usuário</h2>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 sm:p-6 space-y-3.5 overflow-y-auto flex-1 text-xs">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-xs sm:text-sm focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* Photo Upload from Gallery in Edit Modal */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
                <img 
                  src={editAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                  alt="Avatar" 
                  className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-xs shrink-0" 
                />
                <div className="flex-1 space-y-1">
                  <input
                    type="file"
                    id="edit-user-photo"
                    accept="image/*"
                    onChange={handleEditUserPhotoUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="edit-user-photo"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold cursor-pointer shadow-xs transition-colors"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Alterar Foto da Galeria / Câmera</span>
                  </label>
                  <p className="text-[10px] text-slate-400">Carregue nova foto da galeria do aparelho</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    E-mail *
                  </label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Perfil
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="coordenador">Coordenador</option>
                    <option value="gestor">Gestor</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Status do Acesso
                  </label>
                  <select
                    value={editActive ? 'Ativo' : 'Inativo'}
                    onChange={(e) => setEditActive(e.target.value === 'Ativo')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="Ativo">Ativo (Pode acessar)</option>
                    <option value="Inativo">Inativo (Acesso bloqueado)</option>
                  </select>
                </div>
              </div>

              {/* Coordenador Gestor binding in edit */}
              {editRole === 'coordenador' && (
                <div className="bg-blue-50 p-3.5 rounded-xl border border-blue-200">
                  <label className="block text-xs font-bold uppercase text-blue-900 mb-1">
                    Gestor Responsável Vinculado
                  </label>
                  <select
                    value={editManagerId}
                    onChange={(e) => setEditManagerId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-blue-300 rounded-xl text-xs font-semibold"
                  >
                    <option value="">Nenhum Gestor</option>
                    {gestores.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Região / Polo
                </label>
                <input
                  type="text"
                  value={editTeamZone}
                  onChange={(e) => setEditTeamZone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              {/* Seção Alterar Senha no Modal de Edição (Opcional) */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Alterar Senha do Usuário (Opcional)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Preencha os campos abaixo caso deseje alterar a credencial de acesso deste usuário.
                </p>

                {editPasswordError && (
                  <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-semibold">
                    {editPasswordError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Nova Senha
                    </label>
                    <div className="relative">
                      <input
                        type={showEditPassword ? 'text' : 'password'}
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        placeholder="Deixe em branco para manter"
                        className="w-full px-3 py-2 pr-9 bg-white border border-slate-300 rounded-xl text-xs font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEditPassword(!showEditPassword)}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                        title={showEditPassword ? 'Ocultar' : 'Exibir'}
                      >
                        {showEditPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Confirmar Senha
                    </label>
                    <input
                      type={showEditPassword ? 'text' : 'password'}
                      value={editConfirmPassword}
                      onChange={(e) => setEditConfirmPassword(e.target.value)}
                      placeholder="Repita a nova senha"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl shadow-md cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ALTERAR SENHA DE USUÁRIO (EXCLUSIVO ADMINISTRADOR) */}
      {isAdmin && passwordResetUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full sm:max-w-md rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            
            {/* Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200/80 flex items-center justify-center shrink-0">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Alterar Senha de Usuário</h3>
                  <p className="text-xs text-slate-500">Exclusivo Administrador da Campanha</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPasswordResetUser(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target User Info Card */}
            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex items-center gap-3">
              <img
                src={passwordResetUser.avatar}
                alt={passwordResetUser.name}
                className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm text-slate-900 truncate">{passwordResetUser.name}</div>
                <div className="text-xs text-slate-500 truncate">{passwordResetUser.email}</div>
              </div>
              <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 shrink-0">
                {getRoleLabel(passwordResetUser.role)}
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Como administrador, você pode definir uma nova senha direta para este usuário. A alteração passa a valer imediatamente.
            </p>

            {passwordError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleSavePasswordReset} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Nova Senha *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 3 caracteres"
                    autoFocus
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={showNewPassword ? 'Ocultar' : 'Exibir'}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Confirmar Nova Senha *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={showConfirmPassword ? 'Ocultar' : 'Exibir'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Status / Quick shortcuts */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="text-[11px]">
                  {newPassword && confirmPassword ? (
                    newPassword === confirmPassword ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-600" /> Senhas conferem
                      </span>
                    ) : (
                      <span className="text-rose-600 font-bold">Senhas não conferem</span>
                    )
                  ) : (
                    <span className="text-slate-400">Mínimo 3 caracteres</span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setNewPassword('123');
                      setConfirmPassword('123');
                    }}
                    className="text-[11px] font-semibold text-blue-700 hover:underline cursor-pointer"
                  >
                    Padrão "123"
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={() => {
                      const gen = 'Camp#' + Math.floor(100 + Math.random() * 900);
                      setNewPassword(gen);
                      setConfirmPassword(gen);
                      setShowNewPassword(true);
                      setShowConfirmPassword(true);
                    }}
                    className="text-[11px] font-semibold text-blue-700 hover:underline cursor-pointer"
                  >
                    Gerar Segura
                  </button>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setPasswordResetUser(null)}
                  className="px-4 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newPassword || !confirmPassword || newPassword !== confirmPassword || newPassword.length < 3}
                  className={`px-5 py-2.5 font-black rounded-xl text-xs shadow-md flex items-center gap-1.5 cursor-pointer ${
                    !newPassword || !confirmPassword || newPassword !== confirmPassword || newPassword.length < 3
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Salvar Nova Senha</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIALOG: AVISO DE AUDITORIA / BLOQUEIO DE EXCLUSÃO */}
      {deletionBlockReason && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full sm:max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-black text-base text-slate-900">
                Ação Bloqueada por Conformidade Eleitoral
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed text-justify">
                {deletionBlockReason}
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600">
              <span className="font-bold block text-slate-800 mb-1">Como proceder:</span>
              Clique no botão <strong>"Desativar"</strong> na listagem para impedir qualquer novo acesso ou lançamento deste usuário, preservando o histórico para a prestação de contas.
            </div>

            <div className="pt-2 flex justify-center">
              <button
                onClick={() => setDeletionBlockReason(null)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
