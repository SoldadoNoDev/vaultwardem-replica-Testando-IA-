import React, { useState, useEffect } from 'react';
import {
  generatePassword,
  generatePassphrase,
  evaluatePasswordStrength,
  PasswordGeneratorOptions
} from '../crypto/webCrypto.js';
import { X, RefreshCw, Copy, Check, KeyRound } from 'lucide-react';

interface PasswordGeneratorModalProps {
  onClose: () => void;
  onApply?: (password: string) => void;
}

export const PasswordGeneratorModal: React.FC<PasswordGeneratorModalProps> = ({
  onClose,
  onApply,
}) => {
  const [mode, setMode] = useState<'password' | 'passphrase'>('password');
  const [options, setOptions] = useState<PasswordGeneratorOptions>({
    length: 18,
    uppercase: true,
    lowercase: true,
    numbers: true,
    special: true,
    avoidAmbiguous: false,
    minNumbers: 2,
    minSpecial: 2,
  });

  const [passphraseWordCount, setPassphraseWordCount] = useState(4);
  const [passphraseSeparator, setPassphraseSeparator] = useState('-');

  const [generatedResult, setGeneratedResult] = useState('');
  const [copied, setCopied] = useState(false);

  const regenerate = () => {
    if (mode === 'password') {
      const pwd = generatePassword(options);
      setGeneratedResult(pwd);
    } else {
      const phrase = generatePassphrase(passphraseWordCount, passphraseSeparator);
      setGeneratedResult(phrase);
    }
    setCopied(false);
  };

  useEffect(() => {
    regenerate();
  }, [mode, options, passphraseWordCount, passphraseSeparator]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const strength = evaluatePasswordStrength(generatedResult);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden text-slate-800 dark:text-slate-100">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center space-x-2">
            <KeyRound className="w-5 h-5 text-bitwarden-500" />
            <h2 className="font-bold text-base">Gerador de Senhas Seguras</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Mode Tabs */}
          <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
            <button
              onClick={() => setMode('password')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                mode === 'password'
                  ? 'bg-white dark:bg-slate-900 text-bitwarden-600 dark:text-bitwarden-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Senha Aleatória
            </button>
            <button
              onClick={() => setMode('passphrase')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                mode === 'passphrase'
                  ? 'bg-white dark:bg-slate-900 text-bitwarden-600 dark:text-bitwarden-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Frase Secreta (Passphrase)
            </button>
          </div>

          {/* Generated Result Box */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 space-y-3">
            <div className="text-center font-mono font-bold text-lg md:text-xl tracking-wider break-all text-slate-900 dark:text-white select-all">
              {generatedResult}
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold text-white ${strength.color}`}>
                  {strength.label}
                </span>
                <span className="text-slate-400 font-mono">
                  ~{strength.entropy} bits
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={regenerate}
                  className="p-1.5 text-slate-500 hover:text-bitwarden-500 rounded-md transition-colors"
                  title="Gerar Outra Senha"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCopy}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-bitwarden-500 hover:bg-bitwarden-600 text-white rounded-md font-medium transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Configuration controls */}
          {mode === 'password' ? (
            <div className="space-y-4 text-sm">
              <div>
                <div className="flex justify-between text-xs mb-1 font-medium">
                  <span>Comprimento: {options.length} caracteres</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="64"
                  value={options.length}
                  onChange={(e) => setOptions({ ...options, length: Number(e.target.value) })}
                  className="w-full accent-bitwarden-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.uppercase}
                    onChange={(e) => setOptions({ ...options, uppercase: e.target.checked })}
                    className="w-4 h-4 text-bitwarden-600 rounded"
                  />
                  <span>Maiúsculas (A-Z)</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.lowercase}
                    onChange={(e) => setOptions({ ...options, lowercase: e.target.checked })}
                    className="w-4 h-4 text-bitwarden-600 rounded"
                  />
                  <span>Minúsculas (a-z)</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.numbers}
                    onChange={(e) => setOptions({ ...options, numbers: e.target.checked })}
                    className="w-4 h-4 text-bitwarden-600 rounded"
                  />
                  <span>Números (0-9)</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.special}
                    onChange={(e) => setOptions({ ...options, special: e.target.checked })}
                    className="w-4 h-4 text-bitwarden-600 rounded"
                  />
                  <span>Especiais (!@#$%...)</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer col-span-2">
                  <input
                    type="checkbox"
                    checked={options.avoidAmbiguous}
                    onChange={(e) => setOptions({ ...options, avoidAmbiguous: e.target.checked })}
                    className="w-4 h-4 text-bitwarden-600 rounded"
                  />
                  <span>Evitar caracteres ambíguos (l, 1, I, 0, O)</span>
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-sm">
              <div>
                <div className="flex justify-between text-xs mb-1 font-medium">
                  <span>Quantidade de Palavras: {passphraseWordCount}</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="8"
                  value={passphraseWordCount}
                  onChange={(e) => setPassphraseWordCount(Number(e.target.value))}
                  className="w-full accent-bitwarden-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium block mb-1">Separador</label>
                <input
                  type="text"
                  maxLength={3}
                  value={passphraseSeparator}
                  onChange={(e) => setPassphraseSeparator(e.target.value)}
                  className="w-20 px-3 py-1.5 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md font-mono text-center"
                />
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-950/60">
          {onApply && (
            <button
              onClick={() => {
                onApply(generatedResult);
                onClose();
              }}
              className="mr-2 px-4 py-1.5 text-xs font-semibold text-white bg-bitwarden-500 hover:bg-bitwarden-600 rounded-md"
            >
              Aplicar ao Item
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

