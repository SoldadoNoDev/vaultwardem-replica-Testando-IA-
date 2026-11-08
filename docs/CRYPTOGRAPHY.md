# Especificação Criptográfica: Protocolos e Fórmulas Matemáticas

Este documento apresenta as especificações criptográficas formais implementadas no projeto, compatíveis com a arquitetura de segurança do **Bitwarden** e **Vaultwarden**.

---

## 1. Notação Criptográfica

| Símbolo | Significado |
| :--- | :--- |
| $P$ | Senha Mestra em texto claro (*Master Password*) |
| $E$ | E-mail do usuário normalizado (`trim().toLowerCase()`) |
| $S_{email}$ | Salt criptográfico derivado do e-mail |
| $K_{master}$ | Chave Mestra de 256 bits (*Master Key*) |
| $H_{auth}$ | Hash de Autenticação enviado ao servidor (*Master Password Hash*) |
| $K_{sym}$ | Chave Simétrica do Usuário (256 bits) (*User Symmetric Key*) |
| $C_{sym}$ | Envelope cifrado da chave simétrica (*Protected Symmetric Key*) |
| $IV$ | Vetor de Inicialização criptograficamente aleatório (96 bits para AES-GCM) |
| $Tag$ | Tag de autenticação de integridade (128 bits para AES-GCM) |
| $T$ | Contador de tempo para autenticação de 2 fatores (TOTP) |

---

## 2. Derivação de Chaves (Key Derivation Hierarchy)

### Etapa 1: Derivação da Chave Mestra ($K_{master}$)
Utiliza-se o algoritmo **PBKDF2** (Password-Based Key Derivation Function 2) com função de pseudorandomização baseada em **HMAC-SHA256**:

$$K_{master} = \text{PBKDF2-HMAC-SHA256}(P, S_{email}, \text{iter}=600000, \text{length}=256)$$

- **Salt**: $S_{email} = \text{UTF8}(E)$
- **Iterações**: 600.000 iterações (recomendação OWASP e padrão atual do Bitwarden).
- **Propriedade**: O custo computacional intencionalmente elevado inviabiliza ataques de dicionário ou tabelas arco-íris (*rainbow tables*).

---

### Etapa 2: Derivação do Hash de Autenticação ($H_{auth}$)
Para autenticar junto ao servidor sem nunca enviar $K_{master}$ ou $P$, o cliente deriva um hash unidirecional adicional:

$$H_{auth} = \text{Base64}\Big(\text{PBKDF2-HMAC-SHA256}(K_{master}, P, \text{iter}=1, \text{length}=256)\Big)$$

- **Segurança da Derivação**: Mesmo se um adversário interceptar $H_{auth}$, ele não pode reverter para $K_{master}$ porque a função PBKDF2/SHA-256 é estritamente unidirecional.

---

### Etapa 3: Estiramento no Servidor com Bcrypt
Ao receber $H_{auth}$, o servidor não o armazena em texto puro. Ele aplica o algoritmo **Bcrypt** com fator de custo 10 e salt aleatório próprio por usuário:

$$H_{db} = \text{Bcrypt}(H_{auth}, \text{cost}=10)$$

Assim, mesmo diante de um dump completo do banco SQLite, o invasor teria que quebrar duas camadas sucessivas de funções lentas de derivação ($H_{db} \to H_{auth} \to K_{master} \to P$).

---

## 3. Envelope de Chaves (Key Wrapping)

Para permitir que o usuário altere sua senha mestra no futuro sem precisar recifrar centenas de itens do cofre, adota-se a técnica de **Envelope de Criptografia**:

1. Uma chave simétrica independente $K_{sym}$ (256 bits) é gerada via gerador de números pseudoaleatórios criptograficamente seguros (CSPRNG):
   $$K_{sym} \leftarrow \text{CSPRNG}(256)$$
2. Essa chave é cifrada com $K_{master}$ utilizando AES-256-GCM:
   $$C_{sym} = \text{AES-256-GCM}_{K_{master}}(K_{sym})$$
3. O ciphertext $C_{sym}$ é armazenado na coluna `encrypted_symmetric_key` do banco de dados.

---

## 4. Criptografia dos Itens do Cofre (Bitwarden CipherString)

Cada campo ou registro sensível é cifrado localmente no navegador utilizando $K_{sym}$ sob o modo **AES-256-GCM**:

$$C = \text{AES-256-GCM}_{K_{sym}}(M, IV_{96})$$

Onde:
- $IV_{96} \leftarrow \text{CSPRNG}(12 \text{ bytes})$
- $M$ é a mensagem em texto claro codificada em UTF-8.

### Formato CipherString
O resultado é serializado no formato padrão do Bitwarden:
$$\text{CipherString} = \texttt{"0."} + \text{Base64}(IV) + \texttt{"|"} + \text{Base64}(C \mathbin{\Vert} Tag)$$

O prefixo `0.` indica o algoritmo `AesCbc256_B64` / `AesGcm256_B64`.

---

## 5. Algoritmo TOTP Integrado (RFC 6238)

A geração de códigos 2FA no cliente segue estritamente a RFC 6238 e RFC 4226:

1. **Decodificação da Chave Secreta**: O segredo em Base32 (ex: `JBSWY3DPEHPK3PXP`) é decodificado para seus bytes binários correspondentes $K_{totp}$.
2. **Cálculo do Contador de Tempo**:
   $$T = \left\lfloor \frac{\text{TempoAtualEmSegundos}}{30} \right\rfloor$$
3. **Cálculo do HMAC**:
   $$HS = \text{HMAC-SHA1}(K_{totp}, T_{8\text{-bytes}})$$
4. **Truncamento Dinâmico (Dynamic Truncation)**:
   $$\text{Offset} = HS[19] \ \& \ 0\text{x0F}$$
   $$\text{Binário} = ((HS[\text{Offset}] \ \& \ 0\text{x7F}) \ll 24) \mid ((HS[\text{Offset}+1] \ \& \ 0\text{xFF}) \ll 16) \mid ((HS[\text{Offset}+2] \ \& \ 0\text{xFF}) \ll 8) \mid (HS[\text{Offset}+3] \ \& \ 0\text{xFF})$$
5. **Código Final de 6 Dígitos**:
   $$\text{Código} = (\text{Binário} \bmod 10^6) \text{ formatado com zeros à esquerda}$$

---

## 6. Cálculo da Entropia de Senhas

A entropia de Shannon de uma senha com comprimento $L$ e conjunto de caracteres com cardinalidade $R$ é dada por:

$$H = L \cdot \log_2(R)$$

Onde a cardinalidade $R$ é calculada dinamicamente:
- Letras minúsculas: $+26$
- Letras maiúsculas: $+26$
- Dígitos numéricos: $+10$
- Símbolos especiais: $+33$

Classificação do sistema:
- $H < 28$ bits: **Muito Fraca**
- $28 \le H < 45$ bits: **Fraca**
- $45 \le H < 65$ bits: **Boa**
- $H \ge 65$ bits: **Excelente**
