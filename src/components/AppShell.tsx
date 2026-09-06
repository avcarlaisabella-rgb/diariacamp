'use client';

import React from 'react';
import { useApp } from '../context/AppContext';
import { Header } from './layout/Header';
import { Sidebar } from './layout/Sidebar';
import { MobileNav } from './layout/MobileNav';
import { AdminDashboard } from './dashboard/AdminDashboard';
import { GestorDashboard } from './dashboard/GestorDashboard';
import { CoordenadorDashboard } from './dashboard/CoordenadorDashboard';
import { DiariasView } from './diarias/DiariasView';
import { TrabalhadoresView } from './trabalhadores/TrabalhadoresView';
import { AprovacoesView } from './aprovacoes/AprovacoesView';
import { PagamentosView } from './pagamentos/PagamentosView';
import { RelatoriosView } from './relatorios/RelatoriosView';
import { UsuariosView } from './usuarios/UsuariosView';
import { DatabaseSchemaView } from './database/DatabaseSchemaView';
import { PerfilScreen } from './perfil/PerfilScreen';

export const AppShell: React.FC = () => {
  const { currentUser, currentTab } = useApp();

  if (!currentUser) return null;

  const renderTabContent = () => {
    switch (currentTab) {
      case 'dashboard':
        if (currentUser.role === 'admin') return <AdminDashboard />;
        if (currentUser.role === 'gestor') return <GestorDashboard />;
        return <CoordenadorDashboard />;

      case 'trabalhadores':
        return <TrabalhadoresView />;

      case 'diarias':
        return <DiariasView mode="all" />;

      case 'minhas-diarias':
        return <DiariasView mode="my-diarias" />;

      case 'aprovacoes':
        // Only gestor or admin
        if (currentUser.role === 'coordenador') return <CoordenadorDashboard />;
        return <AprovacoesView />;

      case 'pagamentos':
        // Only admin
        if (currentUser.role !== 'admin') return <AdminDashboard />;
        return <PagamentosView />;

      case 'relatorios':
        return <RelatoriosView />;

      case 'usuarios':
        // Only admin
        if (currentUser.role !== 'admin') return <AdminDashboard />;
        return <UsuariosView />;

      case 'banco-dados':
        return <DatabaseSchemaView />;

      case 'perfil':
        return <PerfilScreen />;

      default:
        return currentUser.role === 'admin'
          ? <AdminDashboard />
          : currentUser.role === 'gestor'
          ? <GestorDashboard />
          : <CoordenadorDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 pb-20 lg:pb-8 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <Header />

      {/* Main Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto min-w-0 overflow-x-hidden">
        {/* Desktop Admin Sidebar */}
        <Sidebar />

        {/* Dynamic Screen View */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 min-w-0 max-w-full overflow-x-hidden">
          {renderTabContent()}
        </main>
      </div>

      {/* Mobile App Bottom Nav Bar */}
      <MobileNav />
    </div>
  );
};
