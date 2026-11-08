import React, { useState, useEffect } from 'react';
import { useVault } from '../context/VaultContext.js';
import { X, Folder } from 'lucide-react';

interface FolderModalProps {
  folderId?: string | null;
  onClose: () => void;
}

export const FolderModal: React.FC<FolderModalProps> = ({ folderId, onClose }) => {
  const { folders, createFolder, updateFolder } = useVault();
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (folderId) {
      const f = folders.find(fold => fold.id === folderId);
      if (f) setName(f.name);
    }
  }, [folderId, folders]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    setError(null);
    try {
      if (folderId) {
        await updateFolder(folderId, name.trim());
      } else {
        await createFolder(name.trim());
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Falha ao salvar pasta');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden text-slate-800 dark:text-slate-100">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center space-x-2">
            <Folder className="w-5 h-5 text-yellow-500" />
            <h2 className="font-bold text-base">
              {folderId ? 'Editar Pasta' : 'Nova Pasta'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-md text-xs text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
              Nome da Pasta *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Trabalho, Finanças, Pessoal..."
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-bitwarden-500"
            />
            <span className="text-[11px] text-slate-400 block mt-1">
              O nome da pasta também é criptografado localmente antes de ser enviado ao servidor.
            </span>
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-sm font-semibold text-white bg-bitwarden-500 hover:bg-bitwarden-600 rounded-md transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Criptografando...' : 'Salvar Pasta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

