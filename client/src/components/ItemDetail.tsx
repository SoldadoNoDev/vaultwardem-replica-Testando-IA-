import React, { useState, useEffect } from 'react';
import { useVault } from '../context/VaultContext.js';
import { CipherType } from '../types/index.js';
import { generateTOTP, evaluatePasswordStrength } from '../crypto/webCrypto.js';
import {
  Key,
  CreditCard,
  FileText,
  UserCheck,
  Star,
  Copy,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  Edit,
  Trash2,
  RotateCcw,
  Clock,
  ShieldAlert,
  Code2,
  Folder
} from 'lucide-react';

interface ItemDetailProps {
  onEditItem: (id: string) => void;
}

export const ItemDetail: React.FC<ItemDetailProps> = ({ onEditItem }) => {
  const {
    selectedCipher,
    trashCipher,
    restoreCipher,
    purgeCipher,
    folders
  } = useVault();

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showSecurityCode, setShowSecurityCode] = useState(false);
  const [showRawCrypto, setShowRawCrypto] = useState(false);

  // Live TOTP states
  const [totpToken, setTotpToken] = useState<string>('------');
  const [totpRemaining, setTotpRemaining] = useState<number>(30);

  // Copy helper with animated checkmark
  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  // Live TOTP timer loop
  useEffect(() => {
    if (!selectedCipher || selectedCipher.type !== CipherType.Login || !selectedCipher.data.totp) {
      setTotpToken('------');
      return;
    }

    const secret = selectedCipher.data.totp;
    let isMounted = true;

    const updateOtp = async () => {
      const res = await generateTOTP(secret);
      if (isMounted) {
        setTotpToken(res.token);
        setTotpRemaining(res.secondsRemaining);
      }
    };

    updateOtp();
    const interval = setInterval(updateOtp, 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedCipher]);

  if (!selectedCipher) {
    return (
      <main className="flex-1 bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center justify-center p-8 text-slate-400 select-none">
        <div className="w-16 h-16 rounded-full bg-slate-200/60 dark:bg-slate-800 flex items-center justify-center mb-4">
          <Key className="w-8 h-8 text-slate-300 dark:text-slate-600" />
        </div>
        <h3 className="font-semibold text-slate-600 dark:text-slate-400 text-base">Nenhum item selecionado</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Selecione um item da lista para visualizar os detalhes</p>
      </main>
    );
  }

  const folder = folders.find(f => f.id === selectedCipher.folderId);
  const passwordStrength = selectedCipher.data.password
    ? evaluatePasswordStrength(selectedCipher.data.password)
    : null;

  return (
    <main className="flex-1 bg-white dark:bg-slate-950 flex flex-col h-[calc(100vh-3.5rem)] overflow-y-auto">
      {/* Detail Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-900/30">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
            {selectedCipher.type === CipherType.Login && <Key className="w-6 h-6 text-blue-500" />}
            {selectedCipher.type === CipherType.Card && <CreditCard className="w-6 h-6 text-emerald-500" />}
            {selectedCipher.type === CipherType.SecureNote && <FileText className="w-6 h-6 text-amber-500" />}
            {selectedCipher.type === CipherType.Identity && <UserCheck className="w-6 h-6 text-purple-500" />}
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {selectedCipher.name}
              </h1>
              {selectedCipher.favorite && (
                <Star className="w-5 h-5 text-amber-400 fill-amber-400 flex-shrink-0" />
              )}
            </div>

            <div className="flex items-center space-x-2 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-medium bg-slate-200/70 dark:bg-slate-800 px-2 py-0.5 rounded">
                {selectedCipher.type === CipherType.Login && 'Login'}
                {selectedCipher.type === CipherType.Card && 'Cartão'}
                {selectedCipher.type === CipherType.SecureNote && 'Nota Segura'}
                {selectedCipher.type === CipherType.Identity && 'Identidade'}
              </span>

              {folder && (
                <span className="flex items-center space-x-1 bg-yellow-100 dark:bg-yellow-950/60 text-yellow-800 dark:text-yellow-300 px-2 py-0.5 rounded">
                  <Folder className="w-3 h-3" />
                  <span>{folder.name}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {selectedCipher.deletedDate ? (
            <>
              <button
                onClick={() => restoreCipher(selectedCipher.id)}
                className="flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar</span>
              </button>
              <button
                onClick={() => {
                  if (confirm('Excluir este item permanentemente?')) {
                    purgeCipher(selectedCipher.id);
                  }
                }}
                className="flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onEditItem(selectedCipher.id)}
                className="flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 bg-bitwarden-500 hover:bg-bitwarden-600 text-white rounded-md transition-colors shadow-sm"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Editar</span>
              </button>
              <button
                onClick={() => trashCipher(selectedCipher.id)}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                title="Mover para Lixeira"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Detail Body */}
      <div className="p-6 space-y-6 max-w-3xl">
        {/* LOGIN FIELDS */}
        {selectedCipher.type === CipherType.Login && (
          <div className="space-y-4">
            {/* Username */}
            {selectedCipher.data.username && (
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-medium block">Nome de Usuário</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 select-all font-mono">
                    {selectedCipher.data.username}
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(selectedCipher.data.username || '', 'username')}
                  className="p-2 text-slate-500 hover:text-bitwarden-500 rounded-md transition-colors"
                  title="Copiar Usuário"
                >
                  {copiedField === 'username' ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            )}

            {/* Password */}
            {selectedCipher.data.password && (
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1 pr-4">
                    <span className="text-xs text-slate-400 font-medium block">Senha</span>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 select-all font-mono">
                      {showPassword ? selectedCipher.data.password : '••••••••••••••••'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-md transition-colors"
                      title={showPassword ? 'Ocultar Senha' : 'Exibir Senha'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => copyToClipboard(selectedCipher.data.password || '', 'password')}
                      className="p-2 text-slate-500 hover:text-bitwarden-500 rounded-md transition-colors"
                      title="Copiar Senha"
                    >
                      {copiedField === 'password' ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Password Strength Indicator */}
                {passwordStrength && (
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full ${passwordStrength.color}`}
                          style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                        />
                      </div>
                      <span className="font-medium text-slate-600 dark:text-slate-300">
                        {passwordStrength.label}
                      </span>
                    </div>
                    <span className="text-slate-400 font-mono">
                      ~{passwordStrength.entropy} bits de entropia
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* TOTP 2FA Authenticator */}
            {selectedCipher.data.totp && (
              <div className="p-3.5 rounded-lg border border-purple-200 dark:border-purple-900/50 bg-purple-50/40 dark:bg-purple-950/20 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs text-purple-700 dark:text-purple-300 font-medium">
                      Código de Verificação (TOTP RFC 6238)
                    </span>
                    <span className="text-[10px] bg-purple-200 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 px-1.5 rounded font-mono">
                      2FA Integrado
                    </span>
                  </div>
                  <div className="text-2xl font-bold font-mono tracking-wider text-purple-900 dark:text-purple-100 mt-1">
                    {totpToken.slice(0, 3)} {totpToken.slice(3)}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {/* Countdown circle */}
                  <div className="relative w-8 h-8 flex items-center justify-center">
                    <svg className="w-8 h-8 -rotate-90">
                      <circle
                        cx="16"
                        cy="16"
                        r="12"
                        className="stroke-purple-200 dark:stroke-purple-950 fill-none"
                        strokeWidth="3"
                      />
                      <circle
                        cx="16"
                        cy="16"
                        r="12"
                        className="stroke-purple-600 fill-none transition-all duration-1000"
                        strokeWidth="3"
                        strokeDasharray={75.4}
                        strokeDashoffset={75.4 * (1 - totpRemaining / 30)}
                      />
                    </svg>
                    <span className="absolute text-[10px] font-mono font-bold text-purple-700 dark:text-purple-300">
                      {totpRemaining}
                    </span>
                  </div>

                  <button
                    onClick={() => copyToClipboard(totpToken, 'totp')}
                    className="p-2 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-md transition-colors"
                    title="Copiar Código TOTP"
                  >
                    {copiedField === 'totp' ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* URIs */}
            {selectedCipher.data.uris && selectedCipher.data.uris.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs text-slate-400 font-medium block">URLs do Serviço</span>
                {selectedCipher.data.uris.map((uri, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between text-sm"
                  >
                    <span className="text-slate-700 dark:text-slate-300 truncate font-mono select-all">
                      {uri}
                    </span>
                    <div className="flex items-center space-x-1">
                      <a
                        href={uri.startsWith('http') ? uri : `https://${uri}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-slate-500 hover:text-bitwarden-500 rounded transition-colors"
                        title="Abrir no Navegador"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => copyToClipboard(uri, `uri-${i}`)}
                        className="p-1.5 text-slate-500 hover:text-bitwarden-500 rounded transition-colors"
                        title="Copiar URL"
                      >
                        {copiedField === `uri-${i}` ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CARD FIELDS */}
        {selectedCipher.type === CipherType.Card && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-900 text-white shadow-lg space-y-4 font-mono">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>{selectedCipher.data.brand || 'CARTÃO DE CRÉDITO'}</span>
                <span>CHIP EMV</span>
              </div>

              <div className="text-xl font-bold tracking-widest select-all">
                {selectedCipher.data.number || '•••• •••• •••• ••••'}
              </div>

              <div className="flex justify-between items-end text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">TITULAR</span>
                  <span className="font-semibold uppercase tracking-wider">
                    {selectedCipher.data.cardholderName || 'NOME DO TITULAR'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">VALIDADE</span>
                  <span>
                    {selectedCipher.data.expMonth || 'MM'}/{selectedCipher.data.expYear || 'AA'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">CVV</span>
                  <span>{showSecurityCode ? selectedCipher.data.code : '•••'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={() => setShowSecurityCode(!showSecurityCode)}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center space-x-1"
              >
                {showSecurityCode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showSecurityCode ? 'Ocultar CVV' : 'Revelar CVV'}</span>
              </button>
              {selectedCipher.data.number && (
                <button
                  onClick={() => copyToClipboard(selectedCipher.data.number || '', 'card')}
                  className="text-xs text-bitwarden-600 hover:underline flex items-center space-x-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Número</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* SECURE NOTE FIELDS */}
        {selectedCipher.type === CipherType.SecureNote && (
          <div className="space-y-2">
            <span className="text-xs text-slate-400 font-medium block">Conteúdo Criptografado da Nota</span>
            <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-800 dark:text-slate-200 font-mono text-sm whitespace-pre-wrap select-all leading-relaxed">
              {selectedCipher.data.content || selectedCipher.notes || '(Nota vazia)'}
            </div>
          </div>
        )}

        {/* IDENTITY FIELDS */}
        {selectedCipher.type === CipherType.Identity && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-400 block">Nome Completo</span>
              <span className="text-sm font-semibold select-all">
                {[selectedCipher.data.title, selectedCipher.data.firstName, selectedCipher.data.middleName, selectedCipher.data.lastName].filter(Boolean).join(' ') || '-'}
              </span>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-400 block">E-mail</span>
              <span className="text-sm font-semibold select-all font-mono">
                {selectedCipher.data.email || '-'}
              </span>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-400 block">Telefone</span>
              <span className="text-sm font-semibold select-all font-mono">
                {selectedCipher.data.phone || '-'}
              </span>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-400 block">Documento / CPF / SSN</span>
              <span className="text-sm font-semibold select-all font-mono">
                {selectedCipher.data.ssn || '-'}
              </span>
            </div>
          </div>
        )}

        {/* Notes (General) */}
        {selectedCipher.notes && selectedCipher.type !== CipherType.SecureNote && (
          <div className="space-y-1.5">
            <span className="text-xs text-slate-400 font-medium block">Anotações</span>
            <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap">
              {selectedCipher.notes}
            </div>
          </div>
        )}

        {/* ACADEMIC CRYPTOGRAPHIC INSPECTION SECTION */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Code2 className="w-4 h-4 text-purple-500" />
              <span className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                Inspeção Acadêmica Zero-Knowledge
              </span>
            </div>
            <button
              onClick={() => setShowRawCrypto(!showRawCrypto)}
              className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-mono"
            >
              {showRawCrypto ? 'Ocultar Raw Ciphertext' : 'Visualizar Registro Bruto no SQLite'}
            </button>
          </div>

          {showRawCrypto && selectedCipher.rawRecord && (
            <div className="mt-3 p-3 bg-slate-900 rounded-lg text-slate-300 text-xs font-mono space-y-2 border border-purple-900/50">
              <div>
                <span className="text-purple-400"># Nome Criptografado no DB:</span>
                <p className="break-all text-[11px] text-slate-400">{selectedCipher.rawRecord.name}</p>
              </div>
              <div>
                <span className="text-purple-400"># Payload Sensível Criptografado (encrypted_data):</span>
                <p className="break-all text-[11px] text-slate-400">{selectedCipher.rawRecord.encrypted_data}</p>
              </div>
              <div className="text-[11px] text-emerald-400">
                ✓ O banco de dados SQLite armazena única e exclusivamente esses hashes criptográficos.
              </div>
            </div>
          )}
        </div>

        {/* Timestamps */}
        <div className="pt-4 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <div className="flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Criado em: {new Date(selectedCipher.createdAt).toLocaleString()}</span>
          </div>
          <div>
            <span>Modificado em: {new Date(selectedCipher.updatedAt).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </main>
  );
};

