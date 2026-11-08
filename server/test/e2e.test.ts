import { test } from 'node:test';
import assert from 'node:assert';

const subtle = globalThis.crypto.subtle;

function bufferToBase64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(b64: string): Uint8Array {
  const binary = atob(b64.trim());
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function deriveMasterKey(password: string, email: string, iterations = 10000) {
  const enc = new TextEncoder();
  const keyMaterial = await subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits', 'deriveKey']);
  const salt = enc.encode(email.trim().toLowerCase());
  const derivedBits = await subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, keyMaterial, 256);
  const raw = new Uint8Array(derivedBits);
  const cryptoKey = await subtle.importKey('raw', raw, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  return { cryptoKey, raw };
}

async function deriveMasterPasswordHash(masterKeyRaw: Uint8Array, password: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await subtle.importKey('raw', masterKeyRaw, 'PBKDF2', false, ['deriveBits']);
  const derivedBits = await subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(password), iterations: 1, hash: 'SHA-256' }, key, 256);
  return bufferToBase64(derivedBits);
}

async function encryptString(plaintext: string, key: CryptoKey): Promise<string> {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext));
  return `0.${bufferToBase64(iv)}|${bufferToBase64(encrypted)}`;
}

async function decryptString(cipherString: string, key: CryptoKey): Promise<string> {
  const parts = cipherString.substring(2).split('|');
  const iv = base64ToBuffer(parts[0]);
  const ciphertext = base64ToBuffer(parts[1]);
  const decrypted = await subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return new TextDecoder().decode(decrypted);
}

test('End-to-End Vaultwarden Academic Flow & Zero-Knowledge Verification', async () => {
  const email = `aluno_${Date.now()}@academico.uf.br`;
  const password = 'MinhaSenhaMestraSegura!2026';
  const BASE_URL = 'http://localhost:3001/api';

  console.log('1. Testing Prelogin...');
  const preloginRes = await fetch(`${BASE_URL}/accounts/prelogin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  }).then(r => r.json());
  assert.strictEqual(preloginRes.kdf, 0);

  console.log('2. Deriving Master Key & Auth Hash on Client...');
  const { cryptoKey: masterKey, raw: masterKeyRaw } = await deriveMasterKey(password, email, 10000);
  const authHash = await deriveMasterPasswordHash(masterKeyRaw, password);

  console.log('3. Generating and Encrypting User Symmetric Key...');
  const userSymRaw = crypto.getRandomValues(new Uint8Array(32));
  const userSymKey = await subtle.importKey('raw', userSymRaw, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  const encryptedSymKey = await encryptString(bufferToBase64(userSymRaw), masterKey);

  console.log('4. Registering account on Server...');
  const regRes = await fetch(`${BASE_URL}/accounts/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      masterPasswordHash: authHash,
      masterPasswordHint: 'Ano da tese acadêmica',
      key: encryptedSymKey,
      kdf: 0,
      kdfIterations: 10000
    })
  }).then(r => r.json());
  assert(regRes.success);

  console.log('5. Logging into Server...');
  const loginRes = await fetch(`${BASE_URL}/accounts/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, masterPasswordHash: authHash })
  }).then(r => r.json());
  assert(loginRes.token);
  const token = loginRes.token;

  console.log('6. Creating Folder (Encrypted)...');
  const encFolderName = await encryptString('Pesquisa Criptográfica', userSymKey);
  const folderRes = await fetch(`${BASE_URL}/folders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ name: encFolderName })
  }).then(r => r.json());
  assert(folderRes.data.id);
  const folderId = folderRes.data.id;

  console.log('7. Creating Vault Items (Login with TOTP)...');
  const encItemName = await encryptString('Portal Acadêmico UF', userSymKey);
  const itemPayload = JSON.stringify({
    username: 'estudante_2026',
    password: 'SuperPassword123!',
    totp: 'JBSWY3DPEHPK3PXP',
    uris: ['https://portal.universidade.edu/login']
  });
  const encItemData = await encryptString(itemPayload, userSymKey);

  const cipherRes = await fetch(`${BASE_URL}/ciphers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      folderId,
      type: 1,
      favorite: 1,
      name: encItemName,
      encryptedData: encItemData
    })
  }).then(r => r.json());
  assert(cipherRes.data.id);

  console.log('8. Syncing full vault...');
  const syncRes = await fetch(`${BASE_URL}/sync`, {
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(r => r.json());
  assert.strictEqual(syncRes.ciphers.length, 1);
  assert.strictEqual(syncRes.folders.length, 1);

  console.log('9. Client-Side Decrypting Synced Item...');
  const decryptedName = await decryptString(syncRes.ciphers[0].name, userSymKey);
  const decryptedData = JSON.parse(await decryptString(syncRes.ciphers[0].encrypted_data, userSymKey));
  assert.strictEqual(decryptedName, 'Portal Acadêmico UF');
  assert.strictEqual(decryptedData.username, 'estudante_2026');
  assert.strictEqual(decryptedData.password, 'SuperPassword123!');
  assert.strictEqual(decryptedData.totp, 'JBSWY3DPEHPK3PXP');

  console.log('10. Academic Zero-Knowledge Raw SQLite Inspection...');
  const inspectRes = await fetch(`${BASE_URL}/academic/raw-db-inspector`, {
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(r => r.json());

  assert.strictEqual(inspectRes.zeroKnowledgeVerified, true);
  console.log('Server-side user record:', inspectRes.serverState.userTableRecord.email);
  console.log('Server-side cipher record name:', inspectRes.serverState.ciphersTableRecords[0].name);

  // Assert plaintext password or username DOES NOT exist in server table record!
  const serverJsonString = JSON.stringify(inspectRes.serverState);
  assert(!serverJsonString.includes('SuperPassword123!'), 'Plaintext password leaked to server database!');
  assert(!serverJsonString.includes('estudante_2026'), 'Plaintext username leaked to server database!');
  assert(!serverJsonString.includes('JBSWY3DPEHPK3PXP'), 'Plaintext TOTP secret leaked to server database!');

  console.log('🎉 ZERO-KNOWLEDGE PROOF CONFIRMED: 0% data leakage to SQLite database!');
});

