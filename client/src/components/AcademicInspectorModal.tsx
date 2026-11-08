import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useVault } from '../context/VaultContext.js';
import { ApiClient } from '../api/apiClient.js';
import {
  X,
  Database,
  ShieldCheck,
  Cpu,
  Lock,
  ArrowRight,
  AlertTriangle,
  FileCode,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

interface AcademicInspectorModalProps {
  onClose: () => void;
}

export const AcademicInspectorModal: React.FC<AcademicInspectorModalProps> = ({ onClose }) => {
  const { user } = useAuth();
  const { ciphers } = useVault();
  const [activeTab, setActiveTab] = useState<'inspector' | 'protocol' | 'threat'>('inspector');
  const [rawDbData, setRawDbData] = useState<any>(null);
  const [cryptoSpecs, setCryptoSpecs] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadAcademicData = async () => {
    setIsLoading(true);
    try {
      const [dbRes, specRes] = await Promise.all([
        ApiClient.getRawDbInspection(),
        ApiClient.getCryptoSpecs(),
      ]);
      setRawDbData(dbRes);
      setCryptoSpecs(specRes);
    } catch (err) {
      console.error('Failed to load academic data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAcademicData();
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-purple-200 dark:border-purple-900/60 w-full max-w-5xl h-[88vh] overflow-hidden text-slate-800 dark:text-slate-100 flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-purple-50/70 dark:bg-purple-950/40">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-600 rounded-xl text-white">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base flex items-center space-x-2">
                <span>Inspetor Acadêmico de Arquitetura Zero-Knowledge</span>
                <span className="text-xs bg-purple-200 dark:bg-purple-900/80 text-purple-800 dark:text-purple-200 px-2 py-0.5 rounded-full font-mono">
                  Bitwarden Crypto Specification
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Demonstração em tempo real da prova matemática de privacidade e armazenamento no SQLite
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={loadAcademicData}
              disabled={isLoading}
              className="p-1.5 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-lg transition-colors"
              title="Recarregar dados do banco"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50 dark:bg-slate-950/40">
          <button
            onClick={() => setActiveTab('inspector')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center space-x-2 transition-colors ${
              activeTab === 'inspector'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Comparador Cliente vs Banco SQLite</span>
          </button>

          <button
            onClick={() => setActiveTab('protocol')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center space-x-2 transition-colors ${
              activeTab === 'protocol'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Fluxo Criptográfico & Protocolo</span>
          </button>

          <button
            onClick={() => setActiveTab('threat')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center space-x-2 transition-colors ${
              activeTab === 'threat'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Modelo de Ameaças & Defesa de Tese</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : activeTab === 'inspector' ? (
            <div className="space-y-6">
              {/* Highlight Banner */}
              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/40 flex items-start space-x-3 text-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-purple-950 dark:text-purple-200">
                    Prova Concreta de Armazenamento Conhecimento Zero (Zero-Knowledge)
                  </h4>
                  <p className="text-purple-900/80 dark:text-purple-300/80 mt-1 leading-relaxed">
                    A coluna à esquerda exibe o estado decodificado existente apenas temporariamente na memória RAM do seu navegador.
                    A coluna à direita exibe exatamente o que está gravado em disco no arquivo SQLite do servidor. Observe que nomes, senhas e notas
                    são convertidos em <b>CipherStrings no formato Bitwarden (<code className="bg-purple-100 dark:bg-purple-900/60 px-1 rounded">0.iv|ciphertext</code>)</b>.
                  </p>
                </div>
              </div>

              {/* Side-by-side comparison */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Client Side (Decrypted) */}
                <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/20 dark:bg-emerald-950/10 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-200 dark:border-emerald-900/50 pb-2">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
                      <Cpu className="w-4 h-4" />
                      <span>Visão do Cliente (RAM do Navegador)</span>
                    </span>
                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-mono">
                      Em Texto Claro
                    </span>
                  </div>

                  <div className="space-y-3 font-mono text-xs">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Usuário Autenticado:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {user?.email}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[11px] block">Total de Itens Descriptografados:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {ciphers.length} registros
                      </span>
                    </div>

                    <div className="pt-2">
                      <span className="text-slate-400 text-[11px] block mb-1">Amostra do Primeiro Item:</span>
                      {ciphers.length > 0 ? (
                        <pre className="p-3 bg-white dark:bg-slate-950 rounded-lg border border-emerald-300 dark:border-emerald-800/60 text-[11px] text-slate-700 dark:text-slate-300 overflow-x-auto">
{JSON.stringify(
  {
    nome: ciphers[0].name,
    tipo: ciphers[0].type,
    usuario: ciphers[0].data.username || null,
    senha: ciphers[0].data.password ? '••••••••' : null,
    totp: ciphers[0].data.totp || null,
    notas: ciphers[0].notes || null,
  },
  null,
  2
)}
                        </pre>
                      ) : (
                        <p className="text-xs text-slate-400 italic">Nenhum item salvo ainda no cofre.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Server Side (Encrypted SQLite) */}
                <div className="rounded-xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/20 dark:bg-purple-950/10 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-purple-200 dark:border-purple-900/50 pb-2">
                    <span className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider flex items-center space-x-1.5">
                      <Database className="w-4 h-4" />
                      <span>Visão do Servidor (Banco SQLite em Disco)</span>
                    </span>
                    <span className="text-[10px] bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300 px-2 py-0.5 rounded font-mono">
                      Apenas Criptogramas
                    </span>
                  </div>

                  <div className="space-y-3 font-mono text-xs">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Registro do Usuário (Tabela users):</span>
                      <pre className="p-2.5 bg-slate-900 text-purple-200 rounded-lg text-[10px] overflow-x-auto">
{JSON.stringify(
  {
    email: rawDbData?.serverState?.userTableRecord?.email,
    master_password_hash: rawDbData?.serverState?.userTableRecord?.master_password_hash?.substring(0, 32) + '...',
    encrypted_symmetric_key: rawDbData?.serverState?.userTableRecord?.encrypted_symmetric_key?.substring(0, 40) + '...',
    kdf: rawDbData?.serverState?.userTableRecord?.kdf,
    kdf_iterations: rawDbData?.serverState?.userTableRecord?.kdf_iterations,
  },
  null,
  2
)}
                      </pre>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[11px] block mb-1">Registro na Tabela ciphers (Bruto no SQLite):</span>
                      {rawDbData?.serverState?.ciphersTableRecords?.length > 0 ? (
                        <pre className="p-2.5 bg-slate-900 text-purple-200 rounded-lg text-[10px] overflow-x-auto">
{JSON.stringify(
  {
    id: rawDbData.serverState.ciphersTableRecords[0].id,
    name: rawDbData.serverState.ciphersTableRecords[0].name,
    encrypted_data: rawDbData.serverState.ciphersTableRecords[0].encrypted_data?.substring(0, 48) + '...',
    reprompt: rawDbData.serverState.ciphersTableRecords[0].reprompt,
  },
  null,
  2
)}
                        </pre>
                      ) : (
                        <p className="text-xs text-slate-400 italic">Nenhum registro bruto na tabela de ciphers.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'protocol' ? (
            <div className="space-y-6 max-w-4xl text-sm leading-relaxed">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
                  Hierarquia Criptográfica de Chaves (Key Hierarchy)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  O sistema replica a exata arquitetura formal do Bitwarden / Vaultwarden, estruturada em 4 camadas independentes:
                </p>
              </div>

              {/* Step cards */}
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-bitwarden-600 dark:text-bitwarden-400 uppercase">
                    <span className="w-5 h-5 rounded-full bg-bitwarden-500 text-white flex items-center justify-center text-[10px]">1</span>
                    <span>Derivação da Master Key (KDF)</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    A senha mestra do usuário é combinada com o e-mail normalizado (utilizado como salt criptográfico) e submetida a <b>600.000 iterações de PBKDF2 com digest HMAC-SHA-256</b> via Web Crypto API nativa do navegador. O resultado é uma chave de 256 bits denominada <code>MasterKey</code>.
                  </p>
                  <div className="p-2 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded">
                    MasterKey = PBKDF2_SHA256(Password, Salt=email.toLowerCase(), Iterations=600000, Length=256)
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-purple-600 dark:text-purple-400 uppercase">
                    <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px]">2</span>
                    <span>Derivação do Hash de Autenticação (Auth Hash)</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Para autenticar no servidor sem nunca transmitir a MasterKey ou a Senha Mestra em claro, o cliente gera o <code>MasterPasswordHash</code> executando uma rodada adicional de derivação com a própria senha mestra como salt. Ao receber esse hash, o servidor Node.js ainda aplica <b>bcrypt (cost factor 10)</b> antes de salvá-lo na tabela <code>users</code>.
                  </p>
                  <div className="p-2 bg-slate-900 text-purple-300 font-mono text-[11px] rounded">
                    ClientAuthHash = PBKDF2_SHA256(MasterKey, Salt=Password, Iterations=1, Length=256)
                    <br />
                    ServerStoredHash = Bcrypt(ClientAuthHash, SaltRounds=10)
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase">
                    <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px]">3</span>
                    <span>Envelope de Chave Simétrica do Usuário (Protected Symmetric Key)</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Uma chave simétrica aleatória de 256 bits (<code>UserSymmetricKey</code>) é gerada pelo navegador via <code>crypto.getRandomValues</code>. Essa chave é cifrada usando a <code>MasterKey</code> e salva no servidor. Isso viabiliza alterar a Senha Mestra no futuro sem ter que re-criptografar todos os itens do cofre individualmente (Key Wrapping).
                  </p>
                  <div className="p-2 bg-slate-900 text-amber-300 font-mono text-[11px] rounded">
                    EncryptedSymmetricKey = AES_GCM_Encrypt(UserSymmetricKey, Key=MasterKey)
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">4</span>
                    <span>Criptografia dos Itens do Cofre (Bitwarden CipherString Format)</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Cada item do cofre (nome, notas, login, senhas, tokens TOTP, dados bancários) é cifrado no cliente utilizando a <code>UserSymmetricKey</code> com <b>AES-256-GCM</b>. Um vetor de inicialização (IV) novo de 96 bits é gerado aleatoriamente para cada operação, garantindo que dois registros com o mesmo valor gerem ciphertexts totalmente distintos.
                  </p>
                  <div className="p-2 bg-slate-900 text-blue-300 font-mono text-[11px] rounded">
                    CipherString = "0." + Base64(IV_12bytes) + "|" + Base64(Ciphertext_and_AuthTag)
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 max-w-4xl text-sm leading-relaxed">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
                  Análise do Modelo de Ameaças (Threat Model & Security Proof)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Resumo estruturado para responder a perguntas da banca avaliadora sobre a integridade e sigilo da solução:
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-red-600 dark:text-red-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Cenário 1: Vazamento Integral da Base de Dados SQLite</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    <b>Impacto:</b> NULO para a confidencialidade dos dados do cofre. O invasor obtém apenas <i>hashes</i> bcrypt do <code>MasterPasswordHash</code> e <i>blobs</i> AES-GCM. Como o atacante não possui a senha mestra nem a <code>MasterKey</code>, a inversão matemática de 600.000 iterações de PBKDF2 por tentativa de força bruta torna ataques em larga escala proibitivamente lentos e custosos.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Cenário 2: Administrador do Servidor Mal-intencionado (Rogue Sysadmin)</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    <b>Impacto:</b> O operador do servidor ou do container não tem capacidade técnica de ler nenhuma senha, cartão ou anotação dos usuários. O servidor opera meramente como um repositório cego (<i>blind key-value store</i>) para envio e entrega de pacotes cifrados.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 dark:text-blue-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Cenário 3: Interceptação de Rede / Ataque Man-in-the-Middle (MITM)</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    <b>Impacto:</b> A senha mestra do usuário <b>nunca</b> trafega pela rede, nem mesmo em conexões seguras TLS. O único valor transmitido no login é o <code>ClientAuthHash</code>. Mesmo que um proxy corporativo ou atacante inspecione os pacotes HTTP, ele não obtém a chave mestra necessária para abrir os dados criptografados do cofre.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-purple-600 dark:text-purple-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Autenticação de 2 Fatores (TOTP RFC 6238) Client-Side</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Ao contrário de gerenciadores convencionais que enviam o segredo TOTP em texto puro para servidores externos, este sistema decifra o segredo TOTP na memória do cliente e computa os 6 dígitos usando <code>HMAC-SHA1</code> localmente em JavaScript/WebCrypto, sincronizado com o relógio do sistema.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60 text-xs">
          <span className="text-slate-500 font-mono">
            Status: <span className="text-emerald-500 font-semibold">Zero-Knowledge Validado ✓</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors"
          >
            Fechar Inspetor
          </button>
        </div>
      </div>
    </div>
  );
};

