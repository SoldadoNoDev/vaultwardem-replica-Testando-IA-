# Roteiro de Apresentação Acadêmica & Defesa de Projeto

Este guia foi elaborado para apoiar a apresentação do projeto perante bancas avaliadoras, professores e avaliadores acadêmicos.

---

## 1. Roteiro Cronológico Sugerido (10 a 15 Minutos)

### Parte 1: Introdução e Contextualização (2 min)
- **O Problema**: Vulnerabilidade em bancos de dados centralizados de senhas e riscos de vazamentos de credenciais.
- **A Solução**: O princípio do **Conhecimento Zero (*Zero-Knowledge*)**, onde o servidor armazena os dados sem nunca possuir a chave necessária para lê-los.
- **A Referência**: O ecossistema Bitwarden e a sua implementação de código aberto Vaultwarden.

### Parte 2: Demonstração Prática do Web Vault (5 min)
1. **Criação de Conta / Demonstração Rápida**:
   - Abrir o navegador em `http://localhost:3001`.
   - Clicar em *"Preencher Dados de Demonstração Acadêmica"* ou cadastrar nova conta.
   - Destacar o seletor de iterações do PBKDF2 (100.000 ou 600.000 iterações).
2. **Navegação & Adição de Itens**:
   - Adicionar um item de login com nome, usuário, URL e senha forte gerada.
   - Inserir uma chave de 2FA TOTP (ex: `JBSWY3DPEHPK3PXP`) e mostrar o **contador animado de 30 segundos** gerando o token no cliente.
   - Criar pastas personalizadas e marcar itens favoritos.
3. **Auditoria de Saúde do Cofre (Health Report)**:
   - Clicar no ícone de pulso (*Auditoria de Segurança*).
   - Mostrar os índices de senhas fracas, reutilizadas e detecção de contas sem 2FA.

### Parte 3: O "Momento de Ouro" — O Inspetor Acadêmico Zero-Knowledge (5 min)
1. Clicar no botão **"Inspetor Acadêmico"** (destacado em roxo no topo).
2. Apresentar a **tela comparativa lado a lado**:
   - **Lado Esquerdo**: Dados decodificados na memória RAM do navegador.
   - **Lado Direito**: Consulta em tempo real à base de dados SQLite (`node:sqlite`).
3. **Ponto Crítico**: Mostrar aos professores que na tabela SQLite:
   - A senha mestra NÃO existe.
   - O e-mail só é associado a um hash Bcrypt de derivação secundária.
   - O nome dos itens, as notas e os usuários são strings cifradas no formato `0.iv|ciphertext`.
   - **Conclusão demonstrada**: Se o servidor for invadido ou o arquivo do banco for copiado, nada pode ser lido.
4. Mostrar o bloqueio do cofre (*Lock Vault*):
   - Explicar como a `UserSymmetricKey` e `MasterKey` são destruídas da memória RAM ao bloquear.

---

## 2. Perguntas Frequentes da Banca e Respostas Técnicas

### P1: "Se o servidor não sabe a senha mestra, como ele autentica o login?"
> **Resposta:** O cliente realiza duas derivações. Primeiro, calcula a `MasterKey` com PBKDF2 (600.000 iterações). Depois, calcula um segundo hash (`MasterPasswordHash`) com PBKDF2(1 iteração) e envia apenas este segundo valor ao servidor. O servidor recebe esse hash e ainda aplica Bcrypt com salt próprio antes de comparar com o banco. O servidor valida a autenticação sem nunca conhecer a `MasterKey` que abre os dados.

### P2: "Como funciona a troca de senha mestra sem ter que decifrar todas as senhas do cofre?"
> **Resposta:** Por meio de **Envelope de Criptografia (*Key Wrapping*)**. Todos os itens do cofre são cifrados com uma chave intermediária de 256 bits (`UserSymmetricKey`). Esta chave é que fica envelopada (cifrada) pela `MasterKey`. Quando o usuário troca a senha mestra, apenas a `UserSymmetricKey` é recifrada com a nova `MasterKey` e enviada ao servidor. Os itens do cofre permanecem intocados.

### P3: "Por que AES-256-GCM em vez de AES-CBC?"
> **Resposta:** O modo GCM (Galois/Counter Mode) é um esquema de **Criptografia Autenticada com Dados Associados (AEAD)**. Ele fornece simultaneamente confidencialidade e integridade garantida por hardware (via tag de autenticação GMAC de 128 bits), sendo matematicamente imune a ataques de oráculo de preenchimento (*Padding Oracle Attacks*) que historicamente afetaram o modo CBC.

### P4: "O gerador de senhas e o TOTP usam bibliotecas externas opacas?"
> **Resposta:** Não. Todo o pipeline criptográfico foi implementado diretamente sobre a **Web Crypto API nativa do W3C (`window.crypto.subtle`)**, incluindo o cálculo de HMAC-SHA1 e o truncamento dinâmico da RFC 6238 para o TOTP, e `crypto.getRandomValues` para geração de números aleatórios de grau criptográfico.
