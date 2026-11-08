import React from 'react';
import { useVault } from '../context/VaultContext.js';
import { CipherType } from '../types/index.js';
import {
  Vault,
  Star,
  Trash2,
  Key,
  CreditCard,
  FileText,
  UserCheck,
  Folder,
  FolderPlus,
  Pencil,
  Trash
} from 'lucide-react';

interface SidebarProps {
  onOpenFolderModal: (folderId?: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenFolderModal }) => {
  const { ciphers, folders, activeFilter, setActiveFilter, deleteFolder } = useVault();

  // Counts calculation
  const nonTrashCiphers = ciphers.filter(c => !c.deletedDate);
  const totalCount = nonTrashCiphers.length;
  const favoritesCount = nonTrashCiphers.filter(c => c.favorite).length;
  const trashCount = ciphers.filter(c => !!c.deletedDate).length;

  const loginsCount = nonTrashCiphers.filter(c => c.type === CipherType.Login).length;
  const cardsCount = nonTrashCiphers.filter(c => c.type === CipherType.Card).length;
  const notesCount = nonTrashCiphers.filter(c => c.type === CipherType.SecureNote).length;
  const identitiesCount = nonTrashCiphers.filter(c => c.type === CipherType.Identity).length;

  const handleDeleteFolder = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir esta pasta? Os itens continuarão no cofre desvinculados da pasta.')) {
      deleteFolder(id);
    }
  };

  const handleEditFolder = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onOpenFolderModal(id);
  };

  return (
    <aside className="w-64 bg-slate-100 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-[calc(100vh-3.5rem)] select-none text-sm">
      <div className="flex-1 overflow-y-auto p-3 space-y-6">
        {/* Navigation List */}
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
            Cofre Pessoal
          </div>
          <nav className="space-y-0.5">
            <button
              onClick={() => setActiveFilter('all')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                activeFilter === 'all'
                  ? 'bg-bitwarden-500 text-white'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Vault className="w-4 h-4" />
                <span>Todos os Itens</span>
              </div>
              <span className={`text-xs px-1.5 py-0.2 rounded-full ${
                activeFilter === 'all' ? 'bg-bitwarden-600 text-white' : 'text-slate-400'
              }`}>
                {totalCount}
              </span>
            </button>

            <button
              onClick={() => setActiveFilter('favorites')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                activeFilter === 'favorites'
                  ? 'bg-bitwarden-500 text-white'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>Favoritos</span>
              </div>
              <span className={`text-xs px-1.5 py-0.2 rounded-full ${
                activeFilter === 'favorites' ? 'bg-bitwarden-600 text-white' : 'text-slate-400'
              }`}>
                {favoritesCount}
              </span>
            </button>

            <button
              onClick={() => setActiveFilter('trash')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                activeFilter === 'trash'
                  ? 'bg-bitwarden-500 text-white'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Trash2 className="w-4 h-4 text-red-400" />
                <span>Lixeira</span>
              </div>
              <span className={`text-xs px-1.5 py-0.2 rounded-full ${
                activeFilter === 'trash' ? 'bg-bitwarden-600 text-white' : 'text-slate-400'
              }`}>
                {trashCount}
              </span>
            </button>
          </nav>
        </div>

        {/* Types Filter */}
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
            Tipos de Itens
          </div>
          <nav className="space-y-0.5">
            <button
              onClick={() => setActiveFilter(`type-${CipherType.Login}`)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                activeFilter === `type-${CipherType.Login}`
                  ? 'bg-bitwarden-500 text-white'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Key className="w-4 h-4 text-blue-500" />
                <span>Logins</span>
              </div>
              <span className="text-xs text-slate-400">{loginsCount}</span>
            </button>

            <button
              onClick={() => setActiveFilter(`type-${CipherType.Card}`)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                activeFilter === `type-${CipherType.Card}`
                  ? 'bg-bitwarden-500 text-white'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <CreditCard className="w-4 h-4 text-emerald-500" />
                <span>Cartões</span>
              </div>
              <span className="text-xs text-slate-400">{cardsCount}</span>
            </button>

            <button
              onClick={() => setActiveFilter(`type-${CipherType.SecureNote}`)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                activeFilter === `type-${CipherType.SecureNote}`
                  ? 'bg-bitwarden-500 text-white'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <FileText className="w-4 h-4 text-amber-500" />
                <span>Notas Seguras</span>
              </div>
              <span className="text-xs text-slate-400">{notesCount}</span>
            </button>

            <button
              onClick={() => setActiveFilter(`type-${CipherType.Identity}`)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                activeFilter === `type-${CipherType.Identity}`
                  ? 'bg-bitwarden-500 text-white'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <UserCheck className="w-4 h-4 text-purple-500" />
                <span>Identidades</span>
              </div>
              <span className="text-xs text-slate-400">{identitiesCount}</span>
            </button>
          </nav>
        </div>

        {/* Folders List */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Pastas ({folders.length})
            </span>
            <button
              onClick={() => onOpenFolderModal()}
              className="text-slate-500 hover:text-bitwarden-500 transition-colors p-0.5 rounded"
              title="Criar Pasta"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
          </div>

          <nav className="space-y-0.5">
            {folders.length === 0 ? (
              <p className="px-2 py-1 text-xs text-slate-400 italic">Nenhuma pasta criada</p>
            ) : (
              folders.map(folder => {
                const count = nonTrashCiphers.filter(c => c.folderId === folder.id).length;
                const isActive = activeFilter === `folder-${folder.id}`;
                return (
                  <div
                    key={folder.id}
                    onClick={() => setActiveFilter(`folder-${folder.id}`)}
                    className={`group flex items-center justify-between px-2.5 py-1.5 rounded-md font-medium cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-bitwarden-500 text-white'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <Folder className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-yellow-500'}`} />
                      <span className="truncate">{folder.name}</span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <span className={`text-xs ${isActive ? 'text-white' : 'text-slate-400'}`}>
                        {count}
                      </span>
                      {/* Action buttons on hover */}
                      <div className="hidden group-hover:flex items-center space-x-1 ml-1">
                        <button
                          onClick={(e) => handleEditFolder(e, folder.id)}
                          className="p-1 hover:text-blue-300"
                          title="Editar Pasta"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteFolder(e, folder.id)}
                          className="p-1 hover:text-red-300"
                          title="Excluir Pasta"
                        >
                          <Trash className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </nav>
        </div>
      </div>

      {/* Security Architecture Tag */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
        <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
          <div className="flex items-center justify-between font-mono">
            <span>Criptografia:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">AES-256-GCM</span>
          </div>
          <div className="flex items-center justify-between font-mono">
            <span>Modelo:</span>
            <span className="text-bitwarden-600 dark:text-bitwarden-400 font-semibold">Zero-Knowledge</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

