import React from 'react';
import { useVault } from '../context/VaultContext.js';
import { CipherType, DecryptedCipher } from '../types/index.js';
import { evaluatePasswordStrength } from '../crypto/webCrypto.js';
import {
  X,
  Activity,
  AlertTriangle,
  Copy,
  ShieldAlert,
  ShieldCheck,
  Key,
  Shield,
  Clock
} from 'lucide-react';

interface VaultHealthModalProps {
  onClose: () => void;
  onSelectItem: (id: string) => void;
}

export const VaultHealthModal: React.FC<VaultHealthModalProps> = ({ onClose, onSelectItem }) => {
  const { ciphers } = useVault();

  const logins = ciphers.filter(c => !c.deletedDate && c.type === CipherType.Login);

  // 1. Weak passwords
  const weakLogins: { cipher: DecryptedCipher; entropy: number }[] = [];
  // 2. Reused passwords
  const passwordUsageMap = new Map<string, DecryptedCipher[]>();
  // 3. Inactive 2FA
  const missing2FaLogins: DecryptedCipher[] = [];

  logins.forEach(login => {
    const pwd = login.data.password || '';
    if (pwd) {
      const evaluation = evaluatePasswordStrength(pwd);
      if (evaluation.score <= 2) {
        weakLogins.push({ cipher: login, entropy: evaluation.entropy });
      }

      const existing = passwordUsageMap.get(pwd) || [];
      existing.push(login);
      passwordUsageMap.set(pwd, existing);
    }

    if (!login.data.totp) {
      missing2FaLogins.push(login);
    }
  });

  const reusedGroups: { password: string; items: DecryptedCipher[] }[] = [];
  passwordUsageMap.forEach((items, pwd) => {
    if (items.length > 1) {
      reusedGroups.push({ password: pwd, items });
    }
  });

  // Security Health Score calculation
  let healthScore = 100;
  if (logins.length > 0) {
    const weakPenalty = (weakLogins.length / logins.length) * 40;
    const reusedPenalty = (reusedGroups.length / logins.length) * 35;
    const missing2FaPenalty = (missing2FaLogins.length / logins.length) * 25;
    healthScore = Math.max(10, Math.round(100 - weakPenalty - reusedPenalty - missing2FaPenalty));
  }

  const getScoreColor = () => {
    if (healthScore >= 80) return 'text-emerald-500 border-emerald-500';
    if (healthScore >= 50) return 'text-amber-500 border-amber-500';
    return 'text-red-500 border-red-500';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl max-h-[85vh] overflow-hidden text-slate-800 dark:text-slate-100 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-bitwarden-500" />
            <h2 className="font-bold text-base">Relatório de Saúde & Auditoria do Cofre</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Health Score Overview */}
          <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Índice Geral de Higiene de Segurança
              </span>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {healthScore >= 80 ? 'Cofre Altamente Protegido' : healthScore >= 50 ? 'Atenção Necessária' : 'Risco Crítico de Segurança'}
              </h3>
              <p className="text-xs text-slate-500">
                Análise baseada em entropia de senhas, reutilização entre contas e proteção por 2FA.
              </p>
            </div>

            <div className={`w-18 h-18 rounded-full border-4 flex flex-col items-center justify-center p-4 ${getScoreColor()}`}>
              <span className="text-2xl font-bold font-mono">{healthScore}%</span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50/30 dark:bg-red-950/20">
              <span className="text-xs text-red-600 dark:text-red-400 font-medium block">
                Senhas Fracas
              </span>
              <span className="text-2xl font-bold text-red-700 dark:text-red-300 font-mono">
                {weakLogins.length}
              </span>
            </div>

            <div className="p-3.5 rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/20">
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium block">
                Senhas Reutilizadas
              </span>
              <span className="text-2xl font-bold text-amber-700 dark:text-amber-300 font-mono">
                {reusedGroups.length}
              </span>
            </div>

            <div className="p-3.5 rounded-lg border border-blue-200 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-950/20">
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium block">
                Sem Autenticador 2FA
              </span>
              <span className="text-2xl font-bold text-blue-700 dark:text-blue-300 font-mono">
                {missing2FaLogins.length}
              </span>
            </div>
          </div>

          {/* Weak Passwords List */}
          {weakLogins.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-red-600 uppercase tracking-wider flex items-center space-x-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Senhas Fracas Detectadas ({weakLogins.length})</span>
              </h4>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-lg border border-slate-200 dark:border-slate-800">
                {weakLogins.map(({ cipher, entropy }) => (
                  <div
                    key={cipher.id}
                    onClick={() => {
                      onSelectItem(cipher.id);
                      onClose();
                    }}
                    className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        {cipher.name}
                      </span>
                      <span className="text-slate-400 font-mono">{cipher.data.username || 'Sem usuário'}</span>
                    </div>
                    <span className="text-red-500 font-mono bg-red-50 dark:bg-red-950 px-2 py-0.5 rounded border border-red-200 dark:border-red-900">
                      Entropia baixa (~{entropy} bits)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reused Passwords List */}
          {reusedGroups.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center space-x-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Senhas Idênticas em Serviços Diferentes ({reusedGroups.length} grupos)</span>
              </h4>
              <div className="space-y-2">
                {reusedGroups.map((group, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/20 dark:bg-amber-950/10 text-xs space-y-1.5"
                  >
                    <span className="font-semibold text-amber-700 dark:text-amber-400 block">
                      Reutilizada em {group.items.length} contas:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {group.items.map(item => (
                        <button
                          key={item.id}
                          onClick={() => {
                            onSelectItem(item.id);
                            onClose();
                          }}
                          className="bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 hover:border-bitwarden-500 font-medium"
                        >
                          {item.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {weakLogins.length === 0 && reusedGroups.length === 0 && (
            <div className="p-8 text-center text-slate-500 space-y-2">
              <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto" />
              <p className="font-semibold text-sm">Parabéns! Nenhuma vulnerabilidade crítica de senha encontrada.</p>
              <p className="text-xs text-slate-400">Todas as suas senhas atendem aos requisitos de alta entropia.</p>
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-950/60">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-md transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
