import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useVault } from '../context/VaultContext.js';
import {
  Shield,
  Plus,
  RefreshCw,
  Lock,
  LogOut,
  KeyRound,
  Eye,
  Activity,
  Sun,
  Moon,
  Search,
  CheckCircle2,
  Database
} from 'lucide-react';

interface NavbarProps {
  onOpenNewItem: () => void;
  onOpenGenerator: () => void;
  onOpenAcademicInspector: () => void;
  onOpenHealth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenNewItem,
  onOpenGenerator,
  onOpenAcademicInspector,
  onOpenHealth,
}) => {
  const { user, lock, logout } = useAuth();
  const { syncVault, isSyncing, searchQuery, setSearchQuery } = useVault();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark') ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    }
  };

  return (
    <header className="h-14 bg-bitwarden-700 text-white flex items-center justify-between px-4 select-none shadow-md z-20">
      {/* Brand */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 font-semibold text-lg tracking-tight">
          <div className="bg-white p-1 rounded-md text-bitwarden-700">
            <Shield className="w-5 h-5 fill-current" />
          </div>
          <span>Vaultwarden</span>
          <span className="text-xs bg-bitwarden-900/60 px-2 py-0.5 rounded-full font-mono text-bitwarden-200 border border-bitwarden-500/30">
            Acadêmico
          </span>
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="flex-1 max-w-md mx-6">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-bitwarden-200" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar cofre... (pressione /)"
            className="w-full bg-bitwarden-800/80 hover:bg-bitwarden-800 focus:bg-bitwarden-900 text-white placeholder-bitwarden-200 text-sm rounded-lg pl-9 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all border border-bitwarden-600/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-bitwarden-200 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2">
        {/* New Item */}
        <button
          onClick={onOpenNewItem}
          className="flex items-center space-x-1.5 bg-white text-bitwarden-700 hover:bg-bitwarden-50 font-medium px-3 py-1.5 rounded-md text-sm transition-colors shadow-sm"
          title="Adicionar Novo Item"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Item</span>
        </button>

        {/* Sync Button */}
        <button
          onClick={() => syncVault()}
          disabled={isSyncing}
          className={`p-1.5 hover:bg-bitwarden-600 rounded-md transition-colors ${
            isSyncing ? 'animate-spin text-bitwarden-200' : 'text-white'
          }`}
          title="Sincronizar Cofre"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Academic Inspector Button */}
        <button
          onClick={onOpenAcademicInspector}
          className="flex items-center space-x-1 bg-purple-600 hover:bg-purple-700 text-white px-2.5 py-1.5 rounded-md text-xs font-semibold shadow-sm transition-colors"
          title="Inspetor Zero-Knowledge do Banco de Dados"
        >
          <Database className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Inspetor Acadêmico</span>
        </button>

        {/* Password Generator */}
        <button
          onClick={onOpenGenerator}
          className="p-1.5 hover:bg-bitwarden-600 rounded-md text-white transition-colors"
          title="Gerador de Senha"
        >
          <KeyRound className="w-4 h-4" />
        </button>

        {/* Password Health Audit */}
        <button
          onClick={onOpenHealth}
          className="p-1.5 hover:bg-bitwarden-600 rounded-md text-white transition-colors"
          title="Auditoria de Segurança do Cofre"
        >
          <Activity className="w-4 h-4" />
        </button>

        {/* Dark/Light mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-1.5 hover:bg-bitwarden-600 rounded-md text-white transition-colors"
          title={isDarkMode ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User Profile / Menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-2 pl-2 pr-1 py-1 hover:bg-bitwarden-600 rounded-md transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-bitwarden-900 border border-bitwarden-500/50 flex items-center justify-center font-bold text-xs uppercase text-bitwarden-100">
              {user?.email?.charAt(0) || 'U'}
            </div>
          </button>

          {showProfileMenu && (
            <div
              className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-gray-200 dark:border-slate-800 py-1 text-slate-800 dark:text-slate-200 z-50 text-sm"
              onMouseLeave={() => setShowProfileMenu(false)}
            >
              <div className="px-4 py-2 border-b border-gray-100 dark:border-slate-800">
                <p className="text-xs text-gray-500 dark:text-slate-400">Conectado como</p>
                <p className="font-semibold truncate">{user?.email}</p>
                <div className="mt-1 flex items-center space-x-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>PBKDF2 ({user?.kdfIterations?.toLocaleString() || '600,000'} iterações)</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  onOpenAcademicInspector();
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center space-x-2"
              >
                <Eye className="w-4 h-4 text-purple-500" />
                <span>Verificar Prova Zero-Knowledge</span>
              </button>

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  lock();
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center space-x-2"
              >
                <Lock className="w-4 h-4 text-amber-500" />
                <span>Bloquear Cofre Agora</span>
              </button>

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  logout();
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center space-x-2 text-red-600 dark:text-red-400"
              >
                <LogOut className="w-4 h-4" />
                <span>Encerrar Sessão (Logout)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
