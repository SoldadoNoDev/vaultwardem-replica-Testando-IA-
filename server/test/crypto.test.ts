import { test } from 'node:test';
import assert from 'node:assert';

// Isomorphic WebCrypto tests
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
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// 1. Derive Master Key
async function deriveMasterKey(password: string, email: string, iterations = 100000): Promise<{ cryptoKey: CryptoKey, raw: Uint8Array }> {
  const enc = new TextEncoder();
  const passwordKey = await subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  const salt = enc.encode(email.trim().toLowerCase());
  const derivedBits = await subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256'
    },
    passwordKey,
    256
  );

  const raw = new Uint8Array(derivedBits);
  const cryptoKey = await subtle.importKey(
    'raw',
    raw,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  return { cryptoKey, raw };
}

// 2. Derive Auth Hash (sent to server)
async function deriveMasterPasswordHash(masterKeyRaw: Uint8Array, password: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await subtle.importKey(
    'raw',
    masterKeyRaw,
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: enc.encode(password),
      iterations: 1,
      hash: 'SHA-256'
    },
    key,
    256
  );

  return bufferToBase64(derivedBits);
}

// 3. Encrypt & Decrypt String (Type 0: AES-GCM)
async function encryptString(plaintext: string, key: CryptoKey): Promise<string> {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plaintext)
  );

  return `0.${bufferToBase64(iv)}|${bufferToBase64(encrypted)}`;
}

async function decryptString(cipherString: string, key: CryptoKey): Promise<string> {
  if (!cipherString.startsWith('0.')) {
    throw new Error('Unsupported cipher format: ' + cipherString);
  }

  const parts = cipherString.substring(2).split('|');
  if (parts.length !== 2) throw new Error('Malformed cipherstring');

  const iv = base64ToBuffer(parts[0]);
  const ciphertext = base64ToBuffer(parts[1]);

  const decrypted = await subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}

test('Bitwarden Zero-Knowledge Cryptography Pipeline', async () => {
  const email = 'alice@academic.edu';
  const masterPassword = 'MySecretAcademicMasterPassword!2026';

  console.log('Deriving Master Key from password + email salt...');
  const { cryptoKey: masterKey, raw: masterKeyRaw } = await deriveMasterKey(masterPassword, email, 10000);
  assert.strictEqual(masterKeyRaw.length, 32);

  console.log('Generating Master Password Auth Hash...');
  const authHash = await deriveMasterPasswordHash(masterKeyRaw, masterPassword);
  assert(authHash.length > 20);

  console.log('Generating User Symmetric Key...');
  const userSymRaw = crypto.getRandomValues(new Uint8Array(32));
  const userSymKey = await subtle.importKey('raw', userSymRaw, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);

  console.log('Encrypting User Symmetric Key with Master Key...');
  const encSymKeyString = await encryptString(bufferToBase64(userSymRaw), masterKey);
  assert(encSymKeyString.startsWith('0.'));

  console.log('Decrypting User Symmetric Key with Master Key...');
  const decSymKeyB64 = await decryptString(encSymKeyString, masterKey);
  const decSymRaw = base64ToBuffer(decSymKeyB64);
  assert.deepStrictEqual(decSymRaw, userSymRaw);

  console.log('Encrypting Vault Item Secret...');
  const secretData = JSON.stringify({
    username: 'alice_admin',
    password: 'SuperComplexPassword123#',
    totp: 'JBSWY3DPEHPK3PXP'
  });

  const cipherString = await encryptString(secretData, userSymKey);
  console.log('Encrypted CipherString:', cipherString);
  assert(cipherString.startsWith('0.'));

  console.log('Decrypting Vault Item Secret...');
  const decryptedData = await decryptString(cipherString, userSymKey);
  assert.strictEqual(decryptedData, secretData);

  console.log('All Cryptographic Assertions Passed with 100% Fidelity!');
});
