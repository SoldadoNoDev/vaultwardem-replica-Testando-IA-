import React, { useState, useEffect } from 'react';
import { useVault } from '../context/VaultContext.js';
import { CipherType, DecryptedCipherData } from '../types/index.js';
import { generatePassword, evaluatePasswordStrength } from '../crypto/webCrypto.js';
import {
  X,
  Key,
  CreditCard,
  FileText,
  UserCheck,
  Star,
  Eye,
  EyeOff,
  Wand2,
  Plus,
  Trash
} from 'lucide-react';

interface ItemEditModalProps {
  itemId?: string | null;
  onClose: () => void;
}

export const ItemEditModal: React.FC<ItemEditModalProps> = ({ itemId, onClose }) => {
  const { ciphers, folders, saveCipher } = useVault();

  const [type, setType] = useState<CipherType>(CipherType.Login);
  const [name, setName] = useState('');
  const [folderId, setFolderId] = useState<string>('');
  const [favorite, setFavorite] = useState(false);
  const [notes, setNotes] = useState('');

  // Login fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [totp, setTotp] = useState('');
  const [uris, setUris] = useState<string[]>(['']);

  // Card fields
  const [cardholderName, setCardholderName] = useState('');
  const [brand, setBrand] = useState('Visa');
  const [cardNumber, setCardNumber] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [code, setCode] = useState('');

  // Secure Note fields
  const [noteContent, setNoteContent] = useState('');

  // Identity fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [ssn, setSsn] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing item if editing
  useEffect(() => {
    if (itemId) {
      const existing = ciphers.find(c => c.id === itemId);
      if (existing) {
        setType(existing.type);
        setName(existing.name);
        setFolderId(existing.folderId || '');
        setFavorite(existing.favorite);
        setNotes(existing.notes || '');

        if (existing.type === CipherType.Login) {
          setUsername(existing.data.username || '');
          setPassword(existing.data.password || '');
          setTotp(existing.data.totp || '');
          setUris(existing.data.uris && existing.data.uris.length > 0 ? existing.data.uris : ['']);
        } else if (existing.type === CipherType.Card) {
          setCardholderName(existing.data.cardholderName || '');
          setBrand(existing.data.brand || 'Visa');
          setCardNumber(existing.data.number || '');
          setExpMonth(existing.data.expMonth || '');
          setExpYear(existing.data.expYear || '');
          setCode(existing.data.code || '');
        } else if (existing.type === CipherType.SecureNote) {
          setNoteContent(existing.data.content || '');
        } else if (existing.type === CipherType.Identity) {
          setFirstName(existing.data.firstName || '');
          setLastName(existing.data.lastName || '');
          setEmail(existing.data.email || '');
          setPhone(existing.data.phone || '');
          setSsn(existing.data.ssn || '');
        }
      }
    }
  }, [itemId, ciphers]);

  const handleGenerateInlinePassword = () => {
    const generated = generatePassword({
      length: 18,
      uppercase: true,
      lowercase: true,
      numbers: true,
      special: true,
      avoidAmbiguous: false,
      minNumbers: 2,
      minSpecial: 2,
    });
    setPassword(generated);
    setShowPassword(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('O nome do item é obrigatório');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const payload: DecryptedCipherData = {};

      if (type === CipherType.Login) {
        payload.username = username.trim() || undefined;
        payload.password = password || undefined;
        payload.totp = totp.trim() || undefined;
        const cleanUris = uris.map(u => u.trim()).filter(Boolean);
        payload.uris = cleanUris.length > 0 ? cleanUris : undefined;
      } else if (type === CipherType.Card) {
        payload.cardholderName = cardholderName.trim() || undefined;
        payload.brand = brand;
        payload.number = cardNumber.trim() || undefined;
        payload.expMonth = expMonth.trim() || undefined;
        payload.expYear = expYear.trim() || undefined;
        payload.code = code.trim() || undefined;
      } else if (type === CipherType.SecureNote) {
        payload.content = noteContent;
      } else if (type === CipherType.Identity) {
        payload.firstName = firstName.trim() || undefined;
        payload.lastName = lastName.trim() || undefined;
        payload.email = email.trim() || undefined;
        payload.phone = phone.trim() || undefined;
        payload.ssn = ssn.trim() || undefined;
      }

      await saveCipher({
        id: itemId || undefined,
        folderId: folderId || null,
        type,
        favorite,
        name: name.trim(),
        notes: notes.trim() || undefined,
        payload,
      });

      onClose();
    } catch (err: any) {
      setError(err.message || 'Falha ao salvar item');
    } finally {
      setIsSaving(false);
    }
  };

  const strength = password ? evaluatePasswordStrength(password) : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl my-8 overflow-hidden text-slate-800 dark:text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
          <h2 className="font-bold text-base">
            {itemId ? 'Editar Item do Cofre' : 'Adicionar Novo Item'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-md text-xs text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Type Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
              Tipo de Item
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { t: CipherType.Login, label: 'Login', icon: Key },
                { t: CipherType.Card, label: 'Cartão', icon: CreditCard },
                { t: CipherType.SecureNote, label: 'Nota', icon: FileText },
                { t: CipherType.Identity, label: 'Identidade', icon: UserCheck },
              ].map(({ t, label, icon: Icon }) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-medium transition-all ${
                    type === t
                      ? 'border-bitwarden-500 bg-bitwarden-50 dark:bg-bitwarden-950/50 text-bitwarden-600 dark:text-bitwarden-400 font-semibold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 mb-1" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* General: Name, Folder, Favorite */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                Nome do Item *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Google, GitHub, Banco Inter..."
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-bitwarden-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  Pasta
                </label>
                <select
                  value={folderId}
                  onChange={(e) => setFolderId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-bitwarden-500"
                >
                  <option value="">(Sem Pasta)</option>
                  {folders.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end pb-2">
                <label className="flex items-center space-x-2 text-sm cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={favorite}
                    onChange={(e) => setFavorite(e.target.checked)}
                    className="w-4 h-4 text-bitwarden-600 rounded border-slate-300 focus:ring-bitwarden-500"
                  />
                  <span className="flex items-center space-x-1 font-medium">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span>Favorito</span>
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* TYPE SPECIFIC FIELDS */}
          {type === CipherType.Login && (
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  Nome de Usuário / E-mail
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="usuario@exemplo.com"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-bitwarden-500 font-mono"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Senha
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateInlinePassword}
                    className="text-xs text-bitwarden-600 dark:text-bitwarden-400 hover:underline flex items-center space-x-1"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Gerar Senha Forte</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3 py-2 pr-10 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-bitwarden-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {strength && (
                  <div className="mt-1.5 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Força da Senha:</span>
                    <span className="font-medium font-mono text-emerald-500">
                      {strength.label} ({strength.entropy} bits)
                    </span>
                  </div>
                )}
              </div>

              {/* TOTP */}
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  Chave Secreta TOTP (Autenticador 2FA)
                </label>
                <input
                  type="text"
                  value={totp}
                  onChange={(e) => setTotp(e.target.value)}
                  placeholder="Ex: JBSWY3DPEHPK3PXP"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-bitwarden-500 font-mono uppercase"
                />
                <span className="text-[11px] text-slate-400 block mt-1">
                  Insira a chave Base32 fornecida pelo serviço (o código será gerado automaticamente).
                </span>
              </div>

              {/* URIs */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    URLs do Website
                  </label>
                  <button
                    type="button"
                    onClick={() => setUris([...uris, ''])}
                    className="text-xs text-bitwarden-600 dark:text-bitwarden-400 hover:underline flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar URL</span>
                  </button>
                </div>

                {uris.map((uri, idx) => (
                  <div key={idx} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={uri}
                      onChange={(e) => {
                        const copy = [...uris];
                        copy[idx] = e.target.value;
                        setUris(copy);
                      }}
                      placeholder="https://exemplo.com/login"
                      className="flex-1 px-3 py-1.5 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md font-mono focus:outline-none focus:ring-2 focus:ring-bitwarden-500"
                    />
                    {uris.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setUris(uris.filter((_, i) => i !== idx))}
                        className="p-1.5 text-slate-400 hover:text-red-500"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CARD SPECIFIC */}
          {type === CipherType.Card && (
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Titular do Cartão
                  </label>
                  <input
                    type="text"
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    placeholder="JOAO DA SILVA"
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Bandeira
                  </label>
                  <select
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md"
                  >
                    <option value="Visa">Visa</option>
                    <option value="Mastercard">Mastercard</option>
                    <option value="American Express">American Express</option>
                    <option value="Elo">Elo</option>
                    <option value="Hipercard">Hipercard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  Número do Cartão
                </label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="0000 0000 0000 0000"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md font-mono"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Mês Exp.
                  </label>
                  <input
                    type="text"
                    value={expMonth}
                    onChange={(e) => setExpMonth(e.target.value)}
                    placeholder="MM"
                    maxLength={2}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Ano Exp.
                  </label>
                  <input
                    type="text"
                    value={expYear}
                    onChange={(e) => setExpYear(e.target.value)}
                    placeholder="AAAA"
                    maxLength={4}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Código (CVV)
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="123"
                    maxLength={4}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECURE NOTE SPECIFIC */}
          {type === CipherType.SecureNote && (
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  Conteúdo da Nota Criptografada
                </label>
                <textarea
                  rows={8}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Escreva anotações confidenciais, chaves SSH, seeds de criptomoedas, etc..."
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md font-mono"
                />
              </div>
            </div>
          )}

          {/* IDENTITY SPECIFIC */}
          {type === CipherType.Identity && (
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Primeiro Nome
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Sobrenome
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  CPF / Número de Documento
                </label>
                <input
                  type="text"
                  value={ssn}
                  onChange={(e) => setSsn(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md font-mono"
                />
              </div>
            </div>
          )}

          {/* General Notes */}
          {type !== CipherType.SecureNote && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                Anotações Adicionais (Criptografadas)
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações complementares..."
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md"
              />
            </div>
          )}
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-3 bg-slate-50 dark:bg-slate-950/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 text-sm font-semibold text-white bg-bitwarden-500 hover:bg-bitwarden-600 rounded-md transition-colors shadow-sm disabled:opacity-50"
          >
            {isSaving ? 'Criptografando...' : 'Salvar Item'}
          </button>
        </div>
      </div>
    </div>
  );
};

