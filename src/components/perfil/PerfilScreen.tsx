'use client';

import React, { useState } from 'react';
import { useApp, getRoleLabel } from '../../context/AppContext';
import { 
  User, 
  Mail, 
  Lock, 
  Camera, 
  ShieldCheck, 
  LogOut, 
  CheckCircle2, 
  AlertCircle, 
  Check, 
  MapPin,
  Sparkles,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react';

const AVATAR_HOMEM = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="32" fill="%230284c7"/><circle cx="60" cy="48" r="22" fill="%23fed7aa"/><path d="M38 43c0-13 10-23 22-23 13 0 23 10 23 23 0 2-.3 4-.8 6-3-8-11-14-20-14-9 0-17 6-21 15-.8-2-1.2-4.5-1.2-7z" fill="%231e293b"/><path d="M24 106c0-20 16-34 36-34s36 14 36 34v4H24v-4z" fill="%230f172a"/><path d="M52 72h16l-8 12z" fill="%2338bdf8"/></svg>`;

const AVATAR_MULHER = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="32" fill="%23ec4899"/><circle cx="60" cy="48" r="21" fill="%23fed7aa"/><path d="M36 47c0-14 11-25 24-25s24 11 24 25c0 10-3 20-6 26-2-8-3-15-3-18-4 5-9 7-15 7s-11-2-15-7c0 3-1 10-3 18-3-6-6-16-6-26z" fill="%23451a03"/><path d="M24 106c0-20 16-34 36-34s36 14 36 34v4H24v-4z" fill="%239d174d"/><circle cx="60" cy="76" r="6" fill="%23fbcfe8"/></svg>`;

const AVATAR_OPTIONS = [
  {
    id: 'homem',
    label: 'Homem',
    description: 'Ícone masculino',
    url: AVATAR_HOMEM,
  },
  {
    id: 'mulher',
    label: 'Mulher',
    description: 'Ícone feminino',
    url: AVATAR_MULHER,
  },
];

export const PerfilScreen: React.FC = () => {
  const { currentUser, updateCurrentUserProfile, logout } = useApp();

  if (!currentUser) return null;

  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [avatar, setAvatar] = useState(currentUser.avatar);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [passwordSavedSuccess, setPasswordSavedSuccess] = useState(false);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('O nome não pode estar em branco.');
      return;
    }

    if (!email.trim()) {
      setError('O e-mail não pode estar em branco.');
      return;
    }

    updateCurrentUserProfile({
      name: name.trim(),
      email: email.trim(),
      avatar,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (!password.trim()) {
      setPasswordError('Digite a nova senha desejada.');
      return;
    }

    if (password.length < 3) {
      setPasswordError('A nova senha deve possuir no mínimo 3 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError('A confirmação da nova senha não confere.');
      return;
    }

    updateCurrentUserProfile({
      name: currentUser.name,
      email: currentUser.email,
      avatar: currentUser.avatar,
      password: password.trim(),
    });

    setPasswordSavedSuccess(true);
    setPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordSavedSuccess(false), 4000);
  };

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatar(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
          Meu Perfil
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Dados pessoais e segurança da conta.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-semibold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Dados do perfil atualizados com sucesso!</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-sm font-semibold">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-8 space-y-6">
        
        {/* Foto de Perfil & Access Level Display */}
        <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6 pb-6 border-b border-slate-100">
          <div className="relative group">
            <img
              src={avatar}
              alt={name}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-white shadow-md"
            />
            <label 
              htmlFor="avatar-upload"
              className="absolute -bottom-2 -right-2 p-2.5 bg-slate-900 text-white rounded-2xl shadow-lg hover:bg-slate-800 cursor-pointer transition-transform group-hover:scale-110"
              title="Trocar foto"
            >
              <Camera className="w-4 h-4 text-emerald-400" />
            </label>
            <input 
              id="avatar-upload" 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleAvatarFile} 
            />
          </div>

          <div className="text-center sm:text-left space-y-2 flex-1">
            <h2 className="text-lg font-bold text-slate-900">{name}</h2>
            <p className="text-xs text-slate-500">{email}</p>
            
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Nível de acesso: <strong className="text-slate-900">{getRoleLabel(currentUser.role)}</strong></span>
            </div>
            
            <p className="text-[11px] text-slate-400 block">
              * O nível de acesso é definido pela administração da campanha e não pode ser alterado.
            </p>
          </div>
        </div>

        {/* Avatar Selection: Homem e Mulher */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
            Ou escolha um modelo de avatar:
          </label>
          <div className="grid grid-cols-2 gap-3 sm:max-w-md">
            {AVATAR_OPTIONS.map((opt) => {
              const isSelected = avatar === opt.url;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setAvatar(opt.url)}
                  className={`flex items-center gap-3 p-2.5 sm:px-3.5 sm:py-3 rounded-2xl border-2 transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-600'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
                  }`}
                >
                  <img 
                    src={opt.url} 
                    alt={opt.label} 
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover shadow-2xs shrink-0" 
                  />
                  <div className="flex-1 min-w-0">
                    <span className="block text-xs sm:text-sm font-bold text-slate-900 truncate">{opt.label}</span>
                    <span className="block text-[10px] sm:text-[11px] text-slate-400 truncate">{opt.description}</span>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Form fields: dados cadastrais */}
        <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
          {/* Nome */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5" htmlFor="profile-name">
              Nome Completo *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                id="profile-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white font-medium"
              />
            </div>
          </div>

          {/* E-mail */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5" htmlFor="profile-email">
              E-mail de Acesso *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="profile-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white font-medium"
              />
            </div>
          </div>

          {/* Read-only Access Level representation in form */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Tipo de Usuário (Bloqueado)
            </label>
            <div className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-600 flex items-center justify-between cursor-not-allowed">
              <span>Nível de acesso: {getRoleLabel(currentUser.role)}</span>
              <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded uppercase">
                Não editável
              </span>
            </div>
          </div>

          {/* Save Button for Profile Data */}
          <div className="pt-2">
            <button
              id="save-profile-btn"
              type="submit"
              className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Salvar Dados do Perfil</span>
            </button>
          </div>
        </form>

      </div>

      {/* CARD DEDICADO: SEGURANÇA E ALTERAÇÃO DE SENHA */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-8 space-y-5">
        <div className="flex items-start gap-3.5 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200/80 flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Alterar Senha de Acesso
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Defina uma nova senha para acessar sua conta. A alteração passa a valer imediatamente.
            </p>
          </div>
        </div>

        {passwordSavedSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-semibold animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Sua nova senha foi atualizada com sucesso! Utilize-a em seus próximos acessos.</span>
          </div>
        )}

        {passwordError && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-sm font-semibold">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handleSavePassword} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nova Senha */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5" htmlFor="profile-new-password">
                Nova Senha *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="profile-new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 3 caracteres"
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirmar Nova Senha */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5" htmlFor="profile-confirm-password">
                Confirmar Nova Senha *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="profile-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showConfirmPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Validações em tempo real */}
          {password && (
            <div className="flex items-center gap-3 text-xs pt-1">
              <span className={`inline-flex items-center gap-1 font-semibold ${password.length >= 3 ? 'text-emerald-700' : 'text-slate-400'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${password.length >= 3 ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                Mínimo 3 caracteres
              </span>

              {confirmPassword && (
                <span className={`inline-flex items-center gap-1 font-semibold ${password === confirmPassword ? 'text-emerald-700' : 'text-rose-600'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${password === confirmPassword ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                  {password === confirmPassword ? 'As senhas conferem' : 'As senhas não conferem'}
                </span>
              )}
            </div>
          )}

          <div className="pt-2">
            <button
              id="save-profile-password-btn"
              type="submit"
              disabled={!password || !confirmPassword || password !== confirmPassword || password.length < 3}
              className={`w-full py-3.5 px-4 font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                !password || !confirmPassword || password !== confirmPassword || password.length < 3
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white cursor-pointer'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>Atualizar Senha de Acesso</span>
            </button>
          </div>
        </form>
      </div>

      {/* Sair da Conta */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6">
        <button
          id="logout-btn"
          type="button"
          onClick={logout}
          className="w-full py-3 px-4 bg-rose-50 hover:bg-rose-100 active:scale-[0.99] border border-rose-200 text-rose-700 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair da conta</span>
        </button>
      </div>

    </div>
  );
};

