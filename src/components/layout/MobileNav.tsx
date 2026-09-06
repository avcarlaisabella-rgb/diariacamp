'use client';

import React, { useState } from 'react';
import { useApp, getRoleLabel } from '../../context/AppContext';
import { 
  LayoutDashboard, 
  Users, 
  CalendarDays, 
  User, 
  Plus, 
  CreditCard, 
  CheckSquare, 
  Menu, 
  X, 
  FileBarChart2, 
  UserCheck, 
  Database, 
  LogOut,
  Shield,
  ArrowLeftRight
} from 'lucide-react';
import { NavigationTab } from '../../types';

export const MobileNav: React.FC = () => {
  const { 
    currentUser, 
    currentTab, 
    setCurrentTab, 
    setIsNovaDiariaOpen,
    loginAsRole,
    logout,
    diarias,
    workers
  } = useApp();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (!currentUser) return null;

  // Decide what "Diárias" maps to
  const getDiariasTab = (): NavigationTab => {
    if (currentUser.role === 'coordenador') return 'minhas-diarias';
    return 'diarias';
  };

  const isDiariasActive = 
    currentTab === 'diarias' || 
    currentTab === 'minhas-diarias';

  // Workers awaiting liberation
  const pendingWorkerCount = workers.filter(w => 
    w.approvalStatus === 'Pendente' || w.status === 'Aguardando Liberação' || (w.status as string) === 'Pendente'
  ).length;

  const navigateTo = (tab: NavigationTab) => {
    setCurrentTab(tab);
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Fixed Bottom Navigation Bar (App Bar Style) */}
      <nav id="mobile-bottom-nav" className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 lg:hidden pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="grid grid-cols-5 h-16 items-center px-2 max-w-md mx-auto">
          
          {/* Tab 1: Início */}
          <button
            id="mobile-nav-dashboard"
            onClick={() => setCurrentTab('dashboard')}
            className={`flex flex-col items-center justify-center h-full w-full py-1 min-h-[44px] transition-all active:scale-90 cursor-pointer ${
              currentTab === 'dashboard' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${currentTab === 'dashboard' ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20' : ''}`}>
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <span className={`text-[10px] mt-0.5 tracking-tight ${currentTab === 'dashboard' ? 'font-black text-emerald-700' : 'font-medium text-slate-500'}`}>
              Início
            </span>
          </button>

          {/* Tab 2: Trabalhadores */}
          <button
            id="mobile-nav-trabalhadores"
            onClick={() => setCurrentTab('trabalhadores')}
            className={`flex flex-col items-center justify-center h-full w-full py-1 min-h-[44px] transition-all active:scale-90 cursor-pointer ${
              currentTab === 'trabalhadores' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${currentTab === 'trabalhadores' ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20' : ''}`}>
              <Users className="w-5 h-5" />
            </div>
            <span className={`text-[10px] mt-0.5 tracking-tight ${currentTab === 'trabalhadores' ? 'font-black text-emerald-700' : 'font-medium text-slate-500'}`}>
              Equipe
            </span>
          </button>

          {/* Tab 3: Presença */}
          <button
            id="mobile-nav-diarias"
            onClick={() => setCurrentTab(getDiariasTab())}
            className={`flex flex-col items-center justify-center h-full w-full py-1 min-h-[44px] transition-all active:scale-90 cursor-pointer ${
              isDiariasActive ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${isDiariasActive ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20' : ''}`}>
              <CalendarDays className="w-5 h-5" />
            </div>
            <span className={`text-[10px] mt-0.5 tracking-tight ${isDiariasActive ? 'font-black text-emerald-700' : 'font-medium text-slate-500'}`}>
              Presença
            </span>
          </button>

          {/* Tab 4: Role-specific action */}
          {currentUser.role === 'admin' && (
            <button
              id="mobile-nav-pagamentos"
              onClick={() => setCurrentTab('pagamentos')}
              className={`flex flex-col items-center justify-center h-full w-full py-1 min-h-[44px] relative transition-all active:scale-90 cursor-pointer ${
                currentTab === 'pagamentos' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${currentTab === 'pagamentos' ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20' : ''}`}>
                <CreditCard className="w-5 h-5" />
              </div>
              <span className={`text-[10px] mt-0.5 tracking-tight ${currentTab === 'pagamentos' ? 'font-black text-emerald-700' : 'font-medium text-slate-500'}`}>
                Financeiro
              </span>
            </button>
          )}

          {currentUser.role === 'gestor' && (
            <button
              id="mobile-nav-aprovacoes"
              onClick={() => setCurrentTab('aprovacoes')}
              className={`flex flex-col items-center justify-center h-full w-full py-1 min-h-[44px] relative transition-all active:scale-90 cursor-pointer ${
                currentTab === 'aprovacoes' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${currentTab === 'aprovacoes' ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20' : ''}`}>
                <CheckSquare className="w-5 h-5" />
              </div>
              {pendingWorkerCount > 0 && (
                <span className="absolute top-1 right-3.5 px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[9px] font-black shadow-xs">
                  {pendingWorkerCount}
                </span>
              )}
              <span className={`text-[10px] mt-0.5 tracking-tight ${currentTab === 'aprovacoes' ? 'font-black text-emerald-700' : 'font-medium text-slate-500'}`}>
                Liberação
              </span>
            </button>
          )}

          {currentUser.role === 'coordenador' && (
            <button
              id="mobile-nav-perfil-coord"
              onClick={() => setCurrentTab('perfil')}
              className={`flex flex-col items-center justify-center h-full w-full py-1 min-h-[44px] transition-all active:scale-90 cursor-pointer ${
                currentTab === 'perfil' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${currentTab === 'perfil' ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20' : ''}`}>
                <User className="w-5 h-5" />
              </div>
              <span className={`text-[10px] mt-0.5 tracking-tight ${currentTab === 'perfil' ? 'font-black text-emerald-700' : 'font-medium text-slate-500'}`}>
                Perfil
              </span>
            </button>
          )}

          {/* Tab 5: Menu Mais */}
          <button
            id="mobile-nav-more"
            onClick={() => setIsMenuOpen(true)}
            className={`flex flex-col items-center justify-center h-full w-full py-1 min-h-[44px] transition-all active:scale-90 cursor-pointer ${
              isMenuOpen ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${isMenuOpen ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20' : ''}`}>
              <Menu className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-medium text-slate-500">
              Mais
            </span>
          </button>

        </div>
      </nav>

      {/* Mobile Drawer Menu (Native Bottom Sheet) */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-end lg:hidden animate-in fade-in duration-200">
          <div className="bg-white w-full rounded-t-3xl shadow-2xl p-4 sm:p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-250 pb-safe">
            
            {/* Sheet Handle */}
            <div className="w-10 h-1.5 bg-slate-300 rounded-full mx-auto" />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-2xl object-cover border border-slate-200 shadow-xs"
                />
                <div>
                  <div className="text-sm font-black text-slate-900 leading-tight">{currentUser.name}</div>
                  <div className="text-xs text-emerald-600 font-bold mt-0.5">{getRoleLabel(currentUser.role)}</div>
                </div>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <button
                onClick={() => navigateTo('perfil')}
                className="p-3 bg-slate-50 hover:bg-slate-100 active:scale-98 rounded-2xl flex items-center gap-2.5 text-slate-800 text-left cursor-pointer transition-all border border-slate-100"
              >
                <User className="w-4 h-4 text-slate-600" />
                <span>Meu Perfil</span>
              </button>

              <button
                onClick={() => navigateTo('relatorios')}
                className="p-3 bg-slate-50 hover:bg-slate-100 active:scale-98 rounded-2xl flex items-center gap-2.5 text-slate-800 text-left cursor-pointer transition-all border border-slate-100"
              >
                <FileBarChart2 className="w-4 h-4 text-blue-600" />
                <span>Relatórios</span>
              </button>

              {currentUser.role === 'admin' && (
                <>
                  <button
                    onClick={() => navigateTo('aprovacoes')}
                    className="p-3 bg-slate-50 hover:bg-slate-100 active:scale-98 rounded-2xl flex items-center gap-2.5 text-slate-800 text-left cursor-pointer transition-all border border-slate-100"
                  >
                    <CheckSquare className="w-4 h-4 text-amber-600" />
                    <span>Liberação ({pendingWorkerCount})</span>
                  </button>

                  <button
                    onClick={() => navigateTo('usuarios')}
                    className="p-3 bg-slate-50 hover:bg-slate-100 active:scale-98 rounded-2xl flex items-center gap-2.5 text-slate-800 text-left cursor-pointer transition-all border border-slate-100"
                  >
                    <UserCheck className="w-4 h-4 text-purple-600" />
                    <span>Usuários</span>
                  </button>

                  <button
                    onClick={() => navigateTo('banco-dados')}
                    className="p-3 bg-slate-50 hover:bg-slate-100 active:scale-98 rounded-2xl flex items-center gap-2.5 text-slate-800 text-left cursor-pointer col-span-2 transition-all border border-slate-100"
                  >
                    <Database className="w-4 h-4 text-emerald-600" />
                    <span>Banco de Dados</span>
                  </button>
                </>
              )}

              {currentUser.role === 'gestor' && (
                <>
                  <button
                    onClick={() => navigateTo('pagamentos')}
                    className="p-3 bg-slate-50 hover:bg-slate-100 active:scale-98 rounded-2xl flex items-center gap-2.5 text-slate-800 text-left cursor-pointer transition-all border border-slate-100"
                  >
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <span>Financeiro</span>
                  </button>
                  <button
                    onClick={() => navigateTo('aprovacoes')}
                    className="p-3 bg-slate-50 hover:bg-slate-100 active:scale-98 rounded-2xl flex items-center gap-2.5 text-slate-800 text-left cursor-pointer transition-all border border-slate-100"
                  >
                    <CheckSquare className="w-4 h-4 text-amber-600" />
                    <span>Liberação ({pendingWorkerCount})</span>
                  </button>
                </>
              )}
            </div>

            {/* Role Switcher in Mobile Drawer */}
            <div className="pt-2 border-t border-slate-100">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <ArrowLeftRight className="w-3 h-3" />
                <span>Perfil Ativo</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-center text-xs font-bold">
                <button
                  onClick={() => { loginAsRole('coordenador'); setIsMenuOpen(false); }}
                  className={`py-2 px-1 rounded-xl border transition-all ${currentUser.role === 'coordenador' ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-black shadow-2xs' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                >
                  Coordenador
                </button>
                <button
                  onClick={() => { loginAsRole('gestor'); setIsMenuOpen(false); }}
                  className={`py-2 px-1 rounded-xl border transition-all ${currentUser.role === 'gestor' ? 'bg-blue-50 border-blue-300 text-blue-800 font-black shadow-2xs' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                >
                  Gestor
                </button>
                <button
                  onClick={() => { loginAsRole('admin'); setIsMenuOpen(false); }}
                  className={`py-2 px-1 rounded-xl border transition-all ${currentUser.role === 'admin' ? 'bg-purple-50 border-purple-300 text-purple-800 font-black shadow-2xs' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                >
                  Admin
                </button>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={() => { logout(); setIsMenuOpen(false); }}
              className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 active:scale-98 text-rose-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair da Conta</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
