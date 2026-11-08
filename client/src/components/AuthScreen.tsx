import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { ApiClient } from '../api/apiClient.js';
import {
  Shield,
  Lock,
  Mail,
  Key,
  Eye,
  EyeOff,
  HelpCircle,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Cpu
} from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { user, isLocked, login, register, unlock, logout, isLoading } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [masterPassword, setMasterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [hint, setHint] = useState('');
  const [iterations, setIterations] = useState(100000); // 100k for snappy demo, 600k for max spec
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hintMessage, setHintMessage] = useState<string | null>(null);

  // If already authenticated but vault is locked:
  const isUnlockMode = isLocked && !!user;

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterPassword) return;
    setError(null);
    const success = await unlock(masterPassword);
    if (!success) {
      setError('Senha mestra incorreta.');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !masterPassword) return;
    setError(null);
    try {
      await login(email.trim(), masterPassword);
    } catch (err: any) {
      setError(err.message || 'Falha ao autenticar.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !masterPassword) return;
    if (masterPassword !== confirmPassword) {
      setError('As senhas mestras digitadas não conferem.');
      return;
    }
    if (masterPassword.length < 8) {
      setError('A senha mestra deve conter no mínimo 8 caracteres.');
      return;
    }

    setError(null);
    try {
      await register(email.trim(), masterPassword, hint.trim() || undefined, iterations);
    } catch (err: any) {
      setError(err.message || 'Falha ao criar conta.');
    }
  };

  const handleRequestHint = async () => {
    if (!email.trim()) {
      setError('Digite seu e-mail para solicitar a dica.');
      return;
    }
    try {
      const res = await ApiClient.requestHint(email.trim());
      if (res.hint) {
        setHintMessage(`Dica cadastrada: "${res.hint}"`);
      } else {
        setHintMessage('Nenhuma dica de senha configurada para esta conta.');
      }
    } catch (err) {
      setHintMessage('Não foi possível recuperar a dica.');
    }
  };

  // Quick Demo Seed helper for evaluation / academic presentation!
  const handleQuickDemo = async () => {
    setEmail('aluno@academico.uf.br');
    setMasterPassword('ProjetoAcademic@2026!');
    setConfirmPassword('ProjetoAcademic@2026!');
    setHint('Ano do projeto acadêmico');
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-bitwarden-500 rounded-2xl text-white shadow-md shadow-bitwarden-500/20">
            <Shield className="w-8 h-8 fill-current" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {isUnlockMode
              ? 'Cofre Bloqueado'
              : mode === 'login'
              ? 'Acessar seu Cofre'
              : 'Criar Novo Cofre'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isUnlockMode
              ? `Digite a senha mestra para desbloquear a conta ${user?.email}`
              : 'Gerenciador de senhas com criptografia Zero-Knowledge ponta a ponta'}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg text-xs text-red-600 dark:text-red-400 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {hintMessage && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-lg text-xs text-blue-600 dark:text-blue-400 flex items-start space-x-2">
            <HelpCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{hintMessage}</span>
          </div>
        )}

        {/* FORMS */}
        {isUnlockMode ? (
          /* UNLOCK FORM */
          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                Senha Mestra
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoFocus
                  required
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  placeholder="Sua senha mestra secreta"
                  className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-bitwarden-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-bitwarden-500 hover:bg-bitwarden-600 text-white font-semibold rounded-lg text-sm shadow-md transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <Lock className="w-4 h-4" />
              <span>{isLoading ? 'Derivando chaves...' : 'Desbloquear Cofre'}</span>
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={logout}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                Encerrar sessão ou trocar de conta
              </button>
            </div>
          </form>
        ) : mode === 'login' ? (
          /* LOGIN FORM */
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                Endereço de E-mail
              </label>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@universidade.edu"
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-bitwarden-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Senha Mestra
                </label>
                <button
                  type="button"
                  onClick={handleRequestHint}
                  className="text-xs text-bitwarden-600 dark:text-bitwarden-400 hover:underline"
                >
                  Obter dica?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-bitwarden-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-bitwarden-500 hover:bg-bitwarden-600 text-white font-semibold rounded-lg text-sm shadow-md transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <span>{isLoading ? 'Derivando PBKDF2 e Autenticando...' : 'Entrar no Cofre'}</span>
            </button>

            <div className="pt-2 text-center text-xs text-slate-500">
              Não tem uma conta?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
                className="text-bitwarden-600 dark:text-bitwarden-400 font-semibold hover:underline"
              >
                Criar conta agora
              </button>
            </div>
          </form>
        ) : (
          /* REGISTER FORM */
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                Endereço de E-mail
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@universidade.edu"
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-bitwarden-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                Senha Mestra
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-bitwarden-500 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                Confirme a Senha Mestra
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita sua senha mestra"
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-bitwarden-500 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                Dica da Senha Mestra (Opcional)
              </label>
              <input
                type="text"
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                placeholder="Ex: Livro favorito de 2024"
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-bitwarden-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                Iterações PBKDF2 (KDF)
              </label>
              <select
                value={iterations}
                onChange={(e) => setIterations(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-bitwarden-500 font-mono"
              >
                <option value={100000}>100.000 iterações (Rápido para Demonstração Acadêmica)</option>
                <option value={600000}>600.000 iterações (Padrão Oficial Bitwarden / OWASP)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-bitwarden-500 hover:bg-bitwarden-600 text-white font-semibold rounded-lg text-sm shadow-md transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <Cpu className="w-4 h-4" />
              <span>{isLoading ? 'Gerando Chaves Criptográficas...' : 'Criar Cofre Criptografado'}</span>
            </button>

            <div className="pt-2 text-center text-xs text-slate-500">
              Já possui conta?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className="text-bitwarden-600 dark:text-bitwarden-400 font-semibold hover:underline"
              >
                Fazer login
              </button>
            </div>
          </form>
        )}

        {/* Academic Quick Seed Pill */}
        {!isUnlockMode && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleQuickDemo}
              className="w-full py-2 px-3 border border-dashed border-purple-300 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Preencher Dados de Demonstração Acadêmica</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
