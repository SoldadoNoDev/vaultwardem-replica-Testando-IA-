# 🛡️ Vaultwarden Academic Replica (Web Vault & Zero-Knowledge Backend)

> **Réplica fiel da arquitetura de segurança, protocolos criptográficos e interface do Vaultwarden / Bitwarden desenvolvida para fins acadêmicos e científicos.**

![Status](https://img.shields.io/badge/Status-100%25_Funcional-emerald?style=flat-square)
![Arquitetura](https://img.shields.io/badge/Arquitetura-Zero--Knowledge-blue?style=flat-square)
![Criptografia](https://img.shields.io/badge/Criptografia-AES--256--GCM_%2B_PBKDF2-purple?style=flat-square)
![Stack](https://img.shields.io/badge/Stack-TypeScript_%7C_React_%7C_Node.js_%7C_SQLite-slate?style=flat-square)

---

## 📖 Visão Geral

Esta aplicação é uma implementação completa e autônoma do ecossistema **Vaultwarden / Bitwarden**, projetada para demonstrações acadêmicas, artigos científicos e defesas de teses sobre **Criptografia Aplicada e Segurança da Informação**.

O sistema opera sob o modelo rigoroso de **Conhecimento Zero (*Zero-Knowledge*)**: **a senha mestra nunca trafega pela rede e o servidor backend não tem capacidade matemática de visualizar os dados do cofre em texto claro.**

---

## ✨ Funcionalidades Implementadas

### 🔐 Camada Criptográfica (Padrão Bitwarden)
- **Derivação de Chaves (KDF)**: PBKDF2 com digest HMAC-SHA256 e 600.000 iterações (configurável para 100.000 para testes rápidos) utilizando o e-mail como salt criptográfico.
- **Hash de Autenticação Segura**: Derivação secundária `PBKDF2(MasterKey, password, 1)` no cliente, estendida no servidor com `Bcrypt(cost=10)` antes de persistir no banco.
- **Envelope de Chave Simétrica (Key Wrapping)**: Chave simétrica do usuário de 256 bits gerada via CSPRNG e cifrada pela Chave Mestra.
- **Formato CipherString**: Itens cifrados no formato padrão `0.iv|ciphertext` utilizando **AES-256-GCM** com vetor de inicialização (IV) de 96 bits renovado a cada gravação.
- **Autenticador 2FA TOTP Integrado (RFC 6238)**: Decodificação Base32, computação HMAC-SHA1 e truncamento dinâmico executados 100% no cliente com contador regressivo animado de 30 segundos.
- **Gerador Avançado de Senhas**: Cálculo de entropia em bits, filtro de caracteres ambíguos, modos de Senha Aleatória e Frase Secreta (*Passphrase*).
- **Purga de Memória no Bloqueio**: Destruição imediata das referências das chaves criptográficas em RAM ao bloquear o cofre ou por inatividade (*Auto-Lock*).

### 🖥️ Web Vault (Interface do Usuário)
- **Layout Fiel ao Bitwarden**: Design em 3 colunas (Navegação lateral, Lista de Itens com busca em tempo real e Painel de Detalhes).
- **Tipos de Itens Suportados**: Logins, Cartões de Crédito, Notas Seguras Criptografadas e Identidades.
- **Gestão Organizacional**: Criação e gestão de Pastas personalizadas e marcação de Favoritos.
- **Lixeira com Recuperação e Purga**: Exclusão temporária e esvaziamento permanente irreversível.
- **Auditoria de Saúde do Cofre (Health Audit)**: Detecção automática de senhas fracas, senhas reutilizadas e contas sem 2FA.
- **Temas**: Suporte completo a Modo Escuro (*Dark Mode*) e Modo Claro (*Light Mode*).

### 🎓 Recursos Exclusivos para Apresentação Acadêmica
- **Inspetor Zero-Knowledge em Tempo Real**: Painel interativo com comparação lado a lado entre **"Dados Decodificados na RAM do Navegador"** vs **"Dados Criptografados Armazenados no Arquivo SQLite"**.
- **Botão de Carga Rápida de Demonstração**: Permite preencher credenciais de teste com 1 clique para agilizar a apresentação perante a banca.
- **Inspecione o CipherString do Item**: Botão dentro de cada item para visualizar o registro bruto exato gravado no banco de dados.

---

## 🚀 Como Executar

### Pré-requisitos
- **Node.js** (versão 20+ ou 22+, incluindo suporte nativo a `node:sqlite`).
- **NPM** instalado.

### 1. Iniciar a Aplicação (Servidor + Web Vault Integrado)

Para rodar o servidor Express com o Web Vault servido na mesma porta:

```bash
# Iniciar a aplicação
npm start
```

Acesse no navegador:
👉 **http://localhost:3001**

---

### 2. Executar os Testes Automatizados de Criptografia e Integração

O projeto inclui suítes de testes automatizados com asserções formais de privacidade:

```bash
# Executar teste unitário da pipeline criptográfica WebCrypto
npm test

# Executar teste de integração End-to-End e Prova de Zero Vazamento no SQLite
npm run test:e2e
```

---

### 3. Modo de Desenvolvimento (Hot-Reload)

Caso queira rodar o servidor e o cliente separadamente com atualização automática de código:

```bash
# No diretório raiz
npm run dev
```
- **Backend API**: `http://localhost:3001`
- **Frontend Vite**: `http://localhost:5173`

---

## 📁 Estrutura do Projeto

```
Réplica/
├── client/                     # Frontend Web Vault (React 18 + Vite + Tailwind CSS)
│   ├── src/
│   │   ├── api/                # Cliente de integração HTTP REST
│   │   ├── components/         # Componentes UI (Navbar, Sidebar, ItemList, Modais)
│   │   ├── context/            # AuthContext (Chaves criptográficas em RAM) e VaultContext
│   │   ├── crypto/             # Implementação da Web Crypto API (PBKDF2, AES-GCM, TOTP)
│   │   └── types/              # Interfaces tipadas em TypeScript
│   ├── index.html
│   └── vite.config.ts
├── server/                     # Backend API (Node.js + Express + node:sqlite)
│   ├── src/
│   │   ├── db/                 # Inicialização do banco relacional SQLite
│   │   ├── middleware/         # Autenticação JWT e validação
│   │   ├── routes/             # Rotas REST (/accounts, /ciphers, /folders, /sync, /academic)
│   │   ├── server.ts           # Configuração do Express e entrega do SPA
│   │   └── index.ts            # Ponto de entrada do servidor
│   └── test/                   # Testes unitários e prova formal de Zero-Knowledge
├── docs/                       # Documentação técnica e científica
│   ├── ARCHITECTURE.md         # Diagramas e modelo de fronteiras de confiança
│   ├── CRYPTOGRAPHY.md         # Fórmulas matemáticas, PBKDF2, AES-GCM e TOTP RFC 6238
│   └── PRESENTATION_GUIDE.md   # Roteiro passo a passo para apresentação para a banca
└── package.json
```

---

## 🔒 Prova Matemática de Conhecimento Zero

No teste automatizado [`server/test/e2e.test.ts`](file:///c:/Users/Home/Documents/ProjetosGravity/Réplica/server/test/e2e.test.ts), o sistema valida formalmente que após o cadastro e inserção de itens:
1. O banco SQLite armazena unicamente hashes Bcrypt e CipherStrings no formato `0.iv|ciphertext`.
2. O servidor **não contém** nenhuma ocorrência em texto claro da senha mestra, usuário ou segredo TOTP.
3. Se o banco de dados for integralmente vazado, o atacante precisará quebrar 600.000 iterações de PBKDF2 por tentativa de força bruta em cada registro individual.

---

## 📚 Documentação Complementar

- [Arquitetura do Sistema e Modelo de Dados](file:///c:/Users/Home/Documents/ProjetosGravity/Réplica/docs/ARCHITECTURE.md)
- [Especificação Criptográfica & Protocolos](file:///c:/Users/Home/Documents/ProjetosGravity/Réplica/docs/CRYPTOGRAPHY.md)
- [Roteiro de Apresentação & Perguntas da Banca](file:///c:/Users/Home/Documents/ProjetosGravity/Réplica/docs/PRESENTATION_GUIDE.md)

---
*Projeto desenvolvido para fins acadêmicos e de pesquisa científica.*

