import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { useAuth } from './AuthContext.js';
import { ApiClient } from '../api/apiClient.js';
import { CipherType, DecryptedCipher, DecryptedFolder, CipherRecord, FolderRecord, DecryptedCipherData } from '../types/index.js';
import { encryptString, decryptString } from '../crypto/webCrypto.js';

interface VaultContextType {
  ciphers: DecryptedCipher[];
  folders: DecryptedFolder[];
  filteredCiphers: DecryptedCipher[];
  selectedCipher: DecryptedCipher | null;
  selectedCipherId: string | null;
  setSelectedCipherId: (id: string | null) => void;
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSyncing: boolean;
  syncVault: () => Promise<void>;
  saveCipher: (data: {
    id?: string;
    folderId?: string | null;
    type: CipherType;
    favorite: boolean;
    name: string;
    notes?: string;
    reprompt?: boolean;
    payload: DecryptedCipherData;
  }) => Promise<void>;
  trashCipher: (id: string) => Promise<void>;
  restoreCipher: (id: string) => Promise<void>;
  purgeCipher: (id: string) => Promise<void>;
  purgeAllTrash: () => Promise<void>;
  createFolder: (name: string) => Promise<void>;
  updateFolder: (id: string, name: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export const VaultProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { userSymmetricKey, isAuthenticated, isLocked } = useAuth();
  const [ciphers, setCiphers] = useState<DecryptedCipher[]>([]);
  const [folders, setFolders] = useState<DecryptedFolder[]>([]);
  const [selectedCipherId, setSelectedCipherId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Decrypt an individual raw cipher record
  const decryptCipherRecord = useCallback(async (record: CipherRecord, key: CryptoKey): Promise<DecryptedCipher> => {
    let name = '[Decryption Error]';
    let notes: string | null = null;
    let data: DecryptedCipherData = {};

    try {
      name = await decryptString(record.name, key);
    } catch (e) {
      console.error('Failed to decrypt cipher name:', e);
    }

    if (record.notes) {
      try {
        notes = await decryptString(record.notes, key);
      } catch (e) {
        console.error('Failed to decrypt notes:', e);
      }
    }

    if (record.encrypted_data) {
      try {
        const decryptedJson = await decryptString(record.encrypted_data, key);
        data = JSON.parse(decryptedJson);
      } catch (e) {
        console.error('Failed to decrypt cipher data:', e);
      }
    }

    return {
      id: record.id,
      folderId: record.folder_id,
      type: record.type as CipherType,
      favorite: record.favorite === 1,
      name,
      notes,
      data,
      reprompt: record.reprompt === 1,
      deletedDate: record.deleted_date,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      rawRecord: record,
    };
  }, []);

  // Decrypt folder record
  const decryptFolderRecord = useCallback(async (record: FolderRecord, key: CryptoKey): Promise<DecryptedFolder> => {
    let name = '[Folder]';
    try {
      name = await decryptString(record.name, key);
    } catch (e) {
      console.error('Failed to decrypt folder name:', e);
    }
    return {
      id: record.id,
      name,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      rawRecord: record,
    };
  }, []);

  // Sync vault items from server and decrypt
  const syncVault = useCallback(async () => {
    if (!userSymmetricKey || !isAuthenticated || isLocked) return;

    setIsSyncing(true);
    try {
      const syncData = await ApiClient.sync();

      // Decrypt folders
      const decryptedFolders = await Promise.all(
        syncData.folders.map(f => decryptFolderRecord(f, userSymmetricKey))
      );
      setFolders(decryptedFolders);

      // Decrypt ciphers
      const decryptedCiphers = await Promise.all(
        syncData.ciphers.map(c => decryptCipherRecord(c, userSymmetricKey))
      );
      setCiphers(decryptedCiphers);
    } catch (err) {
      console.error('Failed to sync vault:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [userSymmetricKey, isAuthenticated, isLocked, decryptCipherRecord, decryptFolderRecord]);

  // Trigger sync whenever user unlocks or logs in
  useEffect(() => {
    if (userSymmetricKey && isAuthenticated && !isLocked) {
      syncVault();
    } else {
      setCiphers([]);
      setFolders([]);
      setSelectedCipherId(null);
    }
  }, [userSymmetricKey, isAuthenticated, isLocked, syncVault]);

  // Save or update cipher
  const saveCipher = async (data: {
    id?: string;
    folderId?: string | null;
    type: CipherType;
    favorite: boolean;
    name: string;
    notes?: string;
    reprompt?: boolean;
    payload: DecryptedCipherData;
  }) => {
    if (!userSymmetricKey) throw new Error('Vault is locked');

    // 1. Encrypt all sensitive attributes client-side!
    const encryptedName = await encryptString(data.name, userSymmetricKey);
    const encryptedNotes = data.notes ? await encryptString(data.notes, userSymmetricKey) : null;
    const encryptedData = await encryptString(JSON.stringify(data.payload), userSymmetricKey);

    if (data.id) {
      // Update
      const res = await ApiClient.updateCipher(data.id, {
        folderId: data.folderId,
        type: data.type,
        favorite: data.favorite ? 1 : 0,
        name: encryptedName,
        notes: encryptedNotes,
        encryptedData,
        reprompt: data.reprompt ? 1 : 0,
      });

      const updated = await decryptCipherRecord(res.data, userSymmetricKey);
      setCiphers(prev => prev.map(c => (c.id === updated.id ? updated : c)));
      setSelectedCipherId(updated.id);
    } else {
      // Create new
      const res = await ApiClient.createCipher({
        folderId: data.folderId,
        type: data.type,
        favorite: data.favorite ? 1 : 0,
        name: encryptedName,
        notes: encryptedNotes,
        encryptedData,
        reprompt: data.reprompt ? 1 : 0,
      });

      const created = await decryptCipherRecord(res.data, userSymmetricKey);
      setCiphers(prev => [created, ...prev]);
      setSelectedCipherId(created.id);
    }
  };

  // Move to trash
  const trashCipher = async (id: string) => {
    await ApiClient.deleteCipher(id);
    setCiphers(prev =>
      prev.map(c => (c.id === id ? { ...c, deletedDate: new Date().toISOString() } : c))
    );
  };

  // Restore from trash
  const restoreCipher = async (id: string) => {
    await ApiClient.restoreCipher(id);
    setCiphers(prev =>
      prev.map(c => (c.id === id ? { ...c, deletedDate: null } : c))
    );
  };

  // Purge single item permanently
  const purgeCipher = async (id: string) => {
    await ApiClient.purgeCipher(id);
    setCiphers(prev => prev.filter(c => c.id !== id));
    if (selectedCipherId === id) setSelectedCipherId(null);
  };

  // Empty trash
  const purgeAllTrash = async () => {
    await ApiClient.purgeTrash();
    setCiphers(prev => prev.filter(c => !c.deletedDate));
  };

  // Folders management
  const createFolder = async (name: string) => {
    if (!userSymmetricKey) throw new Error('Vault is locked');
    const encryptedName = await encryptString(name, userSymmetricKey);
    const res = await ApiClient.createFolder(encryptedName);
    const decrypted = await decryptFolderRecord(res.data, userSymmetricKey);
    setFolders(prev => [...prev, decrypted]);
  };

  const updateFolder = async (id: string, name: string) => {
    if (!userSymmetricKey) throw new Error('Vault is locked');
    const encryptedName = await encryptString(name, userSymmetricKey);
    const res = await ApiClient.updateFolder(id, encryptedName);
    const decrypted = await decryptFolderRecord(res.data, userSymmetricKey);
    setFolders(prev => prev.map(f => (f.id === id ? decrypted : f)));
  };

  const deleteFolder = async (id: string) => {
    await ApiClient.deleteFolder(id);
    setFolders(prev => prev.filter(f => f.id !== id));
    setCiphers(prev => prev.map(c => (c.folderId === id ? { ...c, folderId: null } : c)));
  };

  // Filtered and searched items
  const filteredCiphers = useMemo(() => {
    let list = ciphers;

    // Filter by category / folder
    if (activeFilter === 'trash') {
      list = list.filter(c => c.deletedDate !== null);
    } else {
      // Exclude trash for all non-trash filters
      list = list.filter(c => c.deletedDate === null);

      if (activeFilter === 'favorites') {
        list = list.filter(c => c.favorite);
      } else if (activeFilter.startsWith('type-')) {
        const typeNum = Number(activeFilter.replace('type-', ''));
        list = list.filter(c => c.type === typeNum);
      } else if (activeFilter.startsWith('folder-')) {
        const fId = activeFilter.replace('folder-', '');
        list = list.filter(c => c.folderId === fId);
      }
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(c => {
        const nameMatch = c.name.toLowerCase().includes(q);
        const userMatch = c.data.username?.toLowerCase().includes(q);
        const notesMatch = c.notes?.toLowerCase().includes(q);
        const uriMatch = c.data.uris?.some(u => u.toLowerCase().includes(q));
        return nameMatch || userMatch || notesMatch || uriMatch;
      });
    }

    return list;
  }, [ciphers, activeFilter, searchQuery]);

  const selectedCipher = useMemo(() => {
    return ciphers.find(c => c.id === selectedCipherId) || null;
  }, [ciphers, selectedCipherId]);

  return (
    <VaultContext.Provider
      value={{
        ciphers,
        folders,
        filteredCiphers,
        selectedCipher,
        selectedCipherId,
        setSelectedCipherId,
        activeFilter,
        setActiveFilter,
        searchQuery,
        setSearchQuery,
        isSyncing,
        syncVault,
        saveCipher,
        trashCipher,
        restoreCipher,
        purgeCipher,
        purgeAllTrash,
        createFolder,
        updateFolder,
        deleteFolder,
      }}
    >
      {children}
    </VaultContext.Provider>
  );
};

export const useVault = () => {
  const context = useContext(VaultContext);
  if (!context) throw new Error('useVault must be used within a VaultProvider');
  return context;
};

