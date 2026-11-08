import React from 'react';
import { useVault } from '../context/VaultContext.js';
import { CipherType, DecryptedCipher } from '../types/index.js';
import {
  Key,
  CreditCard,
  FileText,
  UserCheck,
  Star,
  Trash2,
  Folder,
  SearchX
} from 'lucide-react';

interface ItemListProps {
  onOpenNewItem: () => void;
}

export const ItemList: React.FC<ItemListProps> = ({ onOpenNewItem }) => {
  const {
    filteredCiphers,
    selectedCipherId,
    setSelectedCipherId,
    activeFilter,
    saveCipher,
    purgeAllTrash,
    folders
  } = useVault();

  const getFilterTitle = () => {
    if (activeFilter === 'all') return 'Todos os Itens';
    if (activeFilter === 'favorites') return 'Favoritos';
    if (activeFilter === 'trash') return 'Lixeira';
    if (activeFilter === `type-${CipherType.Login}`) return 'Logins';
    if (activeFilter === `type-${CipherType.Card}`) return 'Cartões';
    if (activeFilter === `type-${CipherType.SecureNote}`) return 'Notas Seguras';
    if (activeFilter === `type-${CipherType.Identity}`) return 'Identidades';
    if (activeFilter.startsWith('folder-')) {
      const fId = activeFilter.replace('folder-', '');
      const f = folders.find(fold => fold.id === fId);
      return f ? f.name : 'Pasta';
    }
    return 'Itens';
  };

  const getItemIcon = (type: CipherType) => {
    switch (type) {
      case CipherType.Login:
        return <Key className="w-4 h-4 text-blue-500" />;
      case CipherType.Card:
        return <CreditCard className="w-4 h-4 text-emerald-500" />;
      case CipherType.SecureNote:
        return <FileText className="w-4 h-4 text-amber-500" />;
      case CipherType.Identity:
        return <UserCheck className="w-4 h-4 text-purple-500" />;
    }
  };

  const getItemSubtitle = (cipher: DecryptedCipher) => {
    switch (cipher.type) {
      case CipherType.Login:
        return cipher.data.username || (cipher.data.uris && cipher.data.uris[0]) || 'Sem usuário';
      case CipherType.Card:
        return cipher.data.brand ? `${cipher.data.brand} ****` : (cipher.data.cardholderName || 'Cartão');
      case CipherType.SecureNote:
        return 'Nota Criptografada';
      case CipherType.Identity:
        return [cipher.data.firstName, cipher.data.lastName].filter(Boolean).join(' ') || 'Identidade';
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent, cipher: DecryptedCipher) => {
    e.stopPropagation();
    await saveCipher({
      id: cipher.id,
      folderId: cipher.folderId,
      type: cipher.type,
      favorite: !cipher.favorite,
      name: cipher.name,
      notes: cipher.notes || undefined,
      reprompt: cipher.reprompt,
      payload: cipher.data,
    });
  };

  return (
    <section className="w-80 md:w-96 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col h-[calc(100vh-3.5rem)] select-none">
      {/* Header */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
        <div>
          <h2 className="font-semibold text-sm text-slate-800 dark:text-slate-100 flex items-center space-x-2">
            <span>{getFilterTitle()}</span>
            <span className="text-xs bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono px-2 py-0.5 rounded-full">
              {filteredCiphers.length}
            </span>
          </h2>
        </div>

        {activeFilter === 'trash' && filteredCiphers.length > 0 && (
          <button
            onClick={() => {
              if (confirm('Tem certeza que deseja esvaziar a lixeira permanentemente? Esta ação é irreversível.')) {
                purgeAllTrash();
              }
            }}
            className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 font-medium flex items-center space-x-1 px-2 py-1 bg-red-50 dark:bg-red-950/40 rounded border border-red-200 dark:border-red-900/50"
          >
            <Trash2 className="w-3 h-3" />
            <span>Esvaziar</span>
          </button>
        )}
      </div>

      {/* Item List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
        {filteredCiphers.length === 0 ? (
          <div className="p-8 text-center text-slate-400 dark:text-slate-500 space-y-3">
            <SearchX className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="text-sm">Nenhum item encontrado.</p>
            {activeFilter !== 'trash' && (
              <button
                onClick={onOpenNewItem}
                className="text-xs font-medium text-bitwarden-600 dark:text-bitwarden-400 hover:underline"
              >
                + Criar primeiro item
              </button>
            )}
          </div>
        ) : (
          filteredCiphers.map(cipher => {
            const isSelected = selectedCipherId === cipher.id;
            return (
              <div
                key={cipher.id}
                onClick={() => setSelectedCipherId(cipher.id)}
                className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-bitwarden-50/80 dark:bg-bitwarden-900/30 border-l-4 border-bitwarden-500'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-900/70 border-l-4 border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0 pr-2">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center flex-shrink-0">
                    {getItemIcon(cipher.type)}
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {cipher.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {getItemSubtitle(cipher)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 flex-shrink-0">
                  {cipher.deletedDate ? (
                    <span className="text-[10px] text-red-500 bg-red-50 dark:bg-red-950 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-900/60 font-mono">
                      Lixeira
                    </span>
                  ) : (
                    <button
                      onClick={(e) => handleToggleFavorite(e, cipher)}
                      className="p-1 text-slate-300 hover:text-amber-400 transition-colors"
                      title={cipher.favorite ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          cipher.favorite ? 'text-amber-400 fill-amber-400' : 'hover:fill-amber-400/30'
                        }`}
                      />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};

