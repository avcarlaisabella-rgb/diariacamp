'use client';

import React, { useState } from 'react';
import { useApp, getRoleLabel } from '../../context/AppContext';
import { 
  Shield, 
  User, 
  LogOut, 
  CheckCircle2, 
  ChevronDown, 
  ArrowLeftRight,
  Sparkles
} from 'lucide-react';
import { UserRole } from '../../types';

export const Header: React.FC = () => {
  const { 
    currentUser, 
    setCurrentTab, 
    currentTab, 
    logout, 
    loginAsRole, 
    notification 
  } = useApp();
  
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  if (!currentUser) return null;

  const roleColors: Record<UserRole, { badge: string; text: string }> = {
    admin: { badge: 'bg-purple-100 text-purple-800 border-purple-200', text: 'text-purple-600' },
    gestor: { badge: 'bg-blue-100 text-blue-800 border-blue-200', text: 'text-blue-600' },
    coordenador: { badge: 'bg-emerald-100 text-emerald-800 border-emerald-200', text: 'text-emerald-600' },
  };

  return (
    <>
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-slate-900 text-white rounded-full shadow-2xl flex items-center gap-2 text-xs font-medium border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Header (App Top Bar) */}
      <header id="main-app-header" className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between">
          
          {/* Logo and Brand */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentTab('dashboard')}
              className="flex items-center gap-2 text-left focus:outline-none group cursor-pointer active:scale-95 transition-transform"
            >
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-xs group-hover:bg-slate-800 transition-colors">
                <Shield className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-base font-black tracking-tight text-slate-900 leading-tight flex items-center gap-1.5">
                <span>DiáriaCamp</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              </div>
            </button>
          </div>

          {/* Center / Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Quick Role Switcher Pill */}
            <div className="relative">
              <button
                id="role-switcher-btn"
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold cursor-pointer transition-all active:scale-95 ${roleColors[currentUser.role].badge}`}
                title="Alternar perfil"
              >
                <ArrowLeftRight className="w-3 h-3 opacity-70" />
                <span>{getRoleLabel(currentUser.role)}</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {/* Role Dropdown */}
              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Perfil</span>
                  </div>

                  <button
                    onClick={() => { loginAsRole('coordenador'); setShowRoleMenu(false); }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between ${currentUser.role === 'coordenador' ? 'font-bold text-emerald-700 bg-emerald-50/50' : 'text-slate-700'}`}
                  >
                    <div>
                      <div className="font-bold">Coordenador</div>
                      <div className="text-[10px] text-slate-400">Marcos Silveira</div>
                    </div>
                    {currentUser.role === 'coordenador' && <span className="text-emerald-600 text-xs font-black">✓</span>}
                  </button>

                  <button
                    onClick={() => { loginAsRole('gestor'); setShowRoleMenu(false); }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between ${currentUser.role === 'gestor' ? 'font-bold text-blue-700 bg-blue-50/50' : 'text-slate-700'}`}
                  >
                    <div>
                      <div className="font-bold">Gestor</div>
                      <div className="text-[10px] text-slate-400">Juliana Vasconcelos</div>
                    </div>
                    {currentUser.role === 'gestor' && <span className="text-blue-600 text-xs font-black">✓</span>}
                  </button>

                  <button
                    onClick={() => { loginAsRole('admin'); setShowRoleMenu(false); }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between ${currentUser.role === 'admin' ? 'font-bold text-purple-700 bg-purple-50/50' : 'text-slate-700'}`}
                  >
                    <div>
                      <div className="font-bold">Administrador</div>
                      <div className="text-[10px] text-slate-400">Carlos Mendonça</div>
                    </div>
                    {currentUser.role === 'admin' && <span className="text-purple-600 text-xs font-black">✓</span>}
                  </button>
                </div>
              )}
            </div>

            {/* Profile Avatar Button */}
            <button
              id="header-profile-btn"
              onClick={() => setCurrentTab('perfil')}
              className={`p-0.5 rounded-full border-2 transition-all cursor-pointer active:scale-95 ${currentTab === 'perfil' ? 'border-emerald-600 ring-2 ring-emerald-100' : 'border-slate-200 hover:border-slate-400'}`}
              title="Meu Perfil"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </button>

            {/* Desktop Logout Button */}
            <button
              onClick={logout}
              className="hidden lg:flex items-center gap-1 text-slate-500 hover:text-rose-600 p-2 text-xs font-semibold rounded-lg hover:bg-rose-50 transition-colors ml-1 cursor-pointer"
              title="Sair da conta"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>
    </>
  );
};
