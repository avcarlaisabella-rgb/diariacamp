'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginAction, loginAsRoleAction } from '../../app/actions/session';
import { Shield, KeyRound, Mail, Lock, UserCheck, CheckCircle2, AlertCircle, ArrowRight, UserCog, Users } from 'lucide-react';
import { UserRole } from '../../types';

export const LoginScreen: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const goToApp = () => {
    // Navegação completa para garantir que o Server Component raiz
    // busque os dados iniciais já autenticado (cookie de sessão recém-criado).
    window.location.assign('/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Por favor, informe o e-mail e a senha.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await loginAction(email, password);
      if (!result.ok) {
        setError(result.error || 'E-mail ou senha inválidos.');
        return;
      }
      goToApp();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async (role: UserRole) => {
    setError('');
    setIsSubmitting(true);
    try {
      const result = await loginAsRoleAction(role);
      if (!result.ok) {
        setError('Nenhum usuário de demonstração encontrado para este perfil.');
        return;
      }
      goToApp();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotSuccess(true);
    setTimeout(() => {
      setForgotSuccess(false);
      setShowForgotModal(false);
      setForgotEmail('');
    }, 2500);
  };

  return (
    <div id="login-screen-wrapper" className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 font-sans text-slate-900">
      {/* Container */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        
        {/* Top Header / Branding */}
        <div className="bg-slate-900 px-6 py-8 text-center text-white relative">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mb-3 shadow-inner">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Gestão de Campanha</h1>
          <p className="text-xs uppercase tracking-widest text-emerald-400 font-semibold mt-1">
            Gestão Eleitoral & Diárias
          </p>
          <p className="text-slate-400 text-xs mt-2 max-w-xs mx-auto">
            Acesso restrito para coordenadores, gestores e equipe financeira da campanha
          </p>
        </div>

        {/* Login Form */}
        <div className="p-6 sm:p-8">
          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-800 text-sm animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5" htmlFor="login-email">
                E-mail de Acesso
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@campanha.com.br"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600" htmlFor="login-password">
                  Senha
                </label>
                <button
                  id="forgot-password-btn"
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
                >
                  Esqueci minha senha
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="submit-login-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3.5 px-4 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-semibold rounded-xl text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span>{isSubmitting ? 'Entrando...' : 'Entrar no Sistema'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Access Helper for Testing Profiles */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Acesso Rápido de Demonstração
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                3 Perfis
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleQuickLogin('coordenador')}
                className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all flex items-center justify-between group disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-800">
                      Coordenador de Ponto
                    </div>
                    <div className="text-[11px] text-slate-500">Marcos Silveira • Zona Norte</div>
                  </div>
                </div>
                <span className="text-xs text-emerald-600 font-semibold group-hover:translate-x-0.5 transition-transform">
                  Entrar &rarr;
                </span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleQuickLogin('gestor')}
                className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all flex items-center justify-between group disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                    <UserCog className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-blue-800">
                      Gestor de Campanha
                    </div>
                    <div className="text-[11px] text-slate-500">Juliana Vasconcelos • Regional</div>
                  </div>
                </div>
                <span className="text-xs text-blue-600 font-semibold group-hover:translate-x-0.5 transition-transform">
                  Entrar &rarr;
                </span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleQuickLogin('admin')}
                className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-purple-500 hover:bg-purple-50/50 transition-all flex items-center justify-between group disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-purple-800">
                      Administrador Geral
                    </div>
                    <div className="text-[11px] text-slate-500">Carlos Mendonça • Comitê Central</div>
                  </div>
                </div>
                <span className="text-xs text-purple-600 font-semibold group-hover:translate-x-0.5 transition-transform">
                  Entrar &rarr;
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
              <KeyRound className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Recuperar Senha</h3>
            <p className="text-xs text-slate-600 mt-1 mb-4 leading-relaxed">
              Digite o e-mail cadastrado na campanha. Enviaremos um link de redefinição de acesso por SMS ou WhatsApp do comitê.
            </p>

            {forgotSuccess ? (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-800 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Instruções enviadas com sucesso! Verifique seu e-mail ou WhatsApp.</span>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1" htmlFor="forgot-email">
                    E-mail do Usuário
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="seu.email@campanha.com.br"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow"
                  >
                    Enviar Recuperação
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer copyright */}
      <div className="mt-8 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} Gestão de Campanha &bull; Sistema de Campanha Eleitoral
      </div>
    </div>
  );
};
