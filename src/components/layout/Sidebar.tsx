'use client';

import React from 'react';
import { useApp, getRoleLabel } from '../../context/AppContext';
import { 
  LayoutDashboard, 
  Users, 
  CalendarDays, 
  CreditCard, 
  UserCheck, 
  CheckSquare, 
  User, 
  PlusCircle, 
  LogOut,
  ShieldAlert,
  MapPin,
  FileBarChart2,
  Database
} from 'lucide-react';
import { NavigationTab, UserRole } from '../../types';

interface MenuItem {
  id: NavigationTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  isAction?: boolean;
}

export const Sidebar: React.FC = () => {
  const { 
    currentUser, 
    currentTab, 
    setCurrentTab, 
    logout,
    diarias,
    workers
  } = useApp();

  if (!currentUser) return null;

  // Compute pending badges: Workers awaiting liberation
  const pendingWorkerCount = workers.filter(w => 
    w.approvalStatus === 'Pendente' || w.status === 'Aguardando Liberação' || (w.status as string) === 'Pendente'
  ).length;

  const getMenuItems = (role: UserRole): MenuItem[] => {
    switch (role) {
      case 'admin':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'trabalhadores', label: 'Trabalhadores', icon: Users },
          { id: 'diarias', label: 'Presença', icon: CalendarDays },
          { id: 'aprovacoes', label: 'Liberação', icon: UserCheck, badge: pendingWorkerCount },
          { id: 'pagamentos', label: 'Financeiro', icon: CreditCard },
          { id: 'relatorios', label: 'Relatórios', icon: FileBarChart2 },
          { id: 'usuarios', label: 'Usuários', icon: UserCheck },
          { id: 'banco-dados', label: 'Banco de Dados', icon: Database },
          { id: 'perfil', label: 'Perfil', icon: User },
        ];
      case 'gestor':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'trabalhadores', label: 'Trabalhadores', icon: Users },
          { id: 'diarias', label: 'Presença', icon: CalendarDays },
          { id: 'aprovacoes', label: 'Liberação', icon: UserCheck, badge: pendingWorkerCount },
          { id: 'pagamentos', label: 'Financeiro', icon: CreditCard },
          { id: 'relatorios', label: 'Relatórios', icon: FileBarChart2 },
          { id: 'perfil', label: 'Perfil', icon: User },
        ];
      case 'coordenador':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'trabalhadores', label: 'Equipe', icon: Users },
          { id: 'minhas-diarias', label: 'Presença', icon: CalendarDays },
          { id: 'perfil', label: 'Perfil', icon: User },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems(currentUser.role);

  return (
    <aside id="desktop-sidebar" className="hidden lg:flex flex-col w-64 bg-slate-900 text-slate-300 min-h-[calc(100vh-3.5rem)] border-r border-slate-800 p-4 select-none">
      {/* User Card inside Sidebar */}
      <div className="bg-slate-800/80 rounded-2xl p-3.5 border border-slate-700/60 mb-6 flex items-center gap-3">
        <img
          src={currentUser.avatar}
          alt={currentUser.name}
          className="w-10 h-10 rounded-xl object-cover border border-slate-600 shrink-0"
        />
        <div className="overflow-hidden">
          <div className="text-xs font-bold text-white truncate">{currentUser.name}</div>
          <div className="text-[11px] text-emerald-400 font-semibold truncate flex items-center gap-1">
            <span>{getRoleLabel(currentUser.role)}</span>
          </div>
          {currentUser.teamZone && (
            <div className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
              <MapPin className="w-2.5 h-2.5 shrink-0" />
              <span className="truncate">{currentUser.teamZone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Label */}
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
        Menu Principal
      </div>

      {/* Navigation Links */}
      <nav className="space-y-1.5 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-800 text-white font-bold border border-slate-700 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="text-[10px] bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded-full font-bold">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info & Logout in Sidebar */}
      <div className="pt-4 border-t border-slate-800">
        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair da conta</span>
        </button>
      </div>
    </aside>
  );
};
