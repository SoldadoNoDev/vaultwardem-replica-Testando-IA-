import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext.js';
import { useVault } from './context/VaultContext.js';
import { AuthScreen } from './components/AuthScreen.js';
import { Navbar } from './components/Navbar.js';
import { Sidebar } from './components/Sidebar.js';
import { ItemList } from './components/ItemList.js';
import { ItemDetail } from './components/ItemDetail.js';
import { ItemEditModal } from './components/ItemEditModal.js';
import { FolderModal } from './components/FolderModal.js';
import { PasswordGeneratorModal } from './components/PasswordGeneratorModal.js';
import { AcademicInspectorModal } from './components/AcademicInspectorModal.js';
import { VaultHealthModal } from './components/VaultHealthModal.js';

export const App: React.FC = () => {
  const { isAuthenticated, isLocked } = useAuth();
  const { setSelectedCipherId } = useVault();

  // Modals state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);

  const [isGeneratorModalOpen, setIsGeneratorModalOpen] = useState(false);
  const [isAcademicModalOpen, setIsAcademicModalOpen] = useState(false);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If user is typing in an input, don't hijack keyboard shortcuts
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Pesquisar"]') as HTMLInputElement | null;
        searchInput?.focus();
      } else if (e.key === 'n' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setEditingItemId(null);
        setIsItemModalOpen(true);
      } else if (e.key === 'g' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setIsGeneratorModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isAuthenticated || isLocked) {
    return <AuthScreen />;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      {/* Top Navigation */}
      <Navbar
        onOpenNewItem={() => {
          setEditingItemId(null);
          setIsItemModalOpen(true);
        }}
        onOpenGenerator={() => setIsGeneratorModalOpen(true)}
        onOpenAcademicInspector={() => setIsAcademicModalOpen(true)}
        onOpenHealth={() => setIsHealthModalOpen(true)}
      />

      {/* 3-Column Vault Workplace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          onOpenFolderModal={(fId) => {
            setEditingFolderId(fId || null);
            setIsFolderModalOpen(true);
          }}
        />

        {/* Center Item List */}
        <ItemList
          onOpenNewItem={() => {
            setEditingItemId(null);
            setIsItemModalOpen(true);
          }}
        />

        {/* Right Detail Pane */}
        <ItemDetail
          onEditItem={(id) => {
            setEditingItemId(id);
            setIsItemModalOpen(true);
          }}
        />
      </div>

      {/* Modals */}
      {isItemModalOpen && (
        <ItemEditModal
          itemId={editingItemId}
          onClose={() => {
            setIsItemModalOpen(false);
            setEditingItemId(null);
          }}
        />
      )}

      {isFolderModalOpen && (
        <FolderModal
          folderId={editingFolderId}
          onClose={() => {
            setIsFolderModalOpen(false);
            setEditingFolderId(null);
          }}
        />
      )}

      {isGeneratorModalOpen && (
        <PasswordGeneratorModal
          onClose={() => setIsGeneratorModalOpen(false)}
        />
      )}

      {isAcademicModalOpen && (
        <AcademicInspectorModal
          onClose={() => setIsAcademicModalOpen(false)}
        />
      )}

      {isHealthModalOpen && (
        <VaultHealthModal
          onClose={() => setIsHealthModalOpen(false)}
          onSelectItem={(id) => setSelectedCipherId(id)}
        />
      )}
    </div>
  );
};

