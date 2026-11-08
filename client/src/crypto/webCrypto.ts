/**
 * Bitwarden / Vaultwarden Cryptographic Engine
 * Implements Zero-Knowledge Client-Side Cryptography using the Web Crypto API
 */

export function bufferToBase64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToBuffer(b64: string): Uint8Array {
  const binary = atob(b64.trim());
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * 1. Derives Master Key from Master Password + Email Salt using PBKDF2-SHA-256
 */
export async function deriveMasterKey(
  password: string,
  email: string,
  iterations = 600000
): Promise<{ cryptoKey: CryptoKey; raw: Uint8Array }> {
  const subtle = window.crypto.subtle;
  const enc = new TextEncoder();

  // Import password string as key material
  const keyMaterial = await subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  // Normalize email as salt (Bitwarden standard)
  const salt = enc.encode(email.trim().toLowerCase());

  // Derive 256-bit key
  const derivedBits = await subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  const raw = new Uint8Array(derivedBits);

  const cryptoKey = await subtle.importKey(
    'raw',
    raw as unknown as BufferSource,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  return { cryptoKey, raw };
}

/**
 * 2. Derives Master Password Hash for Server Authentication
 * PBKDF2(MasterKey, password, 1, SHA-256)
 * Server only ever sees this hash and never the Master Key or Password!
 */
export async function deriveMasterPasswordHash(
  masterKeyRaw: Uint8Array,
  password: string
): Promise<string> {
  const subtle = window.crypto.subtle;
  const enc = new TextEncoder();

  const key = await subtle.importKey(
    'raw',
    masterKeyRaw as unknown as BufferSource,
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: enc.encode(password),
      iterations: 1,
      hash: 'SHA-256',
    },
    key,
    256
  );

  return bufferToBase64(derivedBits);
}

/**
 * 3. Generates a fresh 256-bit User Symmetric Key
 */
export function generateUserSymmetricKeyBytes(): Uint8Array {
  return window.crypto.getRandomValues(new Uint8Array(32));
}

export async function importSymmetricKey(rawBytes: Uint8Array): Promise<CryptoKey> {
  return await window.crypto.subtle.importKey(
    'raw',
    rawBytes as unknown as BufferSource,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * 4. Encrypt User Symmetric Key with Master Key
 */
export async function encryptSymmetricKey(
  symmetricKeyRaw: Uint8Array,
  masterKey: CryptoKey
): Promise<string> {
  const b64 = bufferToBase64(symmetricKeyRaw);
  return await encryptString(b64, masterKey);
}

/**
 * 5. Decrypt User Symmetric Key using Master Key
 */
export async function decryptSymmetricKey(
  encryptedKeyString: string,
  masterKey: CryptoKey
): Promise<CryptoKey> {
  const b64 = await decryptString(encryptedKeyString, masterKey);
  const rawBytes = base64ToBuffer(b64);
  return await importSymmetricKey(rawBytes);
}

/**
 * 6. Encrypts plaintext string to Bitwarden CipherString format:
 * Type 0: `0.<iv_b64>|<ciphertext_b64>` (AES-256-GCM authenticated)
 */
export async function encryptString(plaintext: string, key: CryptoKey): Promise<string> {
  const subtle = window.crypto.subtle;
  const enc = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await subtle.encrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    enc.encode(plaintext)
  );

  return `0.${bufferToBase64(iv)}|${bufferToBase64(encrypted)}`;
}

/**
 * 7. Decrypts Bitwarden CipherString format
 */
export async function decryptString(cipherString: string, key: CryptoKey): Promise<string> {
  if (!cipherString) return '';

  if (!cipherString.startsWith('0.')) {
    throw new Error(`Unsupported CipherString type or format: ${cipherString.substring(0, 5)}...`);
  }

  const parts = cipherString.substring(2).split('|');
  if (parts.length !== 2) {
    throw new Error('Malformed CipherString format');
  }

  const iv = base64ToBuffer(parts[0]);
  const ciphertext = base64ToBuffer(parts[1]);

  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    ciphertext as unknown as BufferSource
  );

  return new TextDecoder().decode(decrypted);
}

/**
 * Base32 RFC 4648 Decoder for TOTP Secret Keys
 */
function base32ToBytes(base32: string): Uint8Array {
  const clean = base32.toUpperCase().replace(/[\s=-]/g, '');
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    const idx = alphabet.indexOf(clean[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return new Uint8Array(output);
}

/**
 * 8. RFC 6238 TOTP Authenticator Generator (Web Crypto API HMAC-SHA1)
 */
export async function generateTOTP(
  secret: string,
  timeStep = 30
): Promise<{ token: string; secondsRemaining: number }> {
  try {
    const cleanSecret = secret.trim();
    if (!cleanSecret) return { token: '------', secondsRemaining: 30 };

    const epochSeconds = Math.floor(Date.now() / 1000);
    const counter = Math.floor(epochSeconds / timeStep);
    const secondsRemaining = timeStep - (epochSeconds % timeStep);

    const secretBytes = base32ToBytes(cleanSecret);
    if (secretBytes.length === 0) {
      return { token: '------', secondsRemaining };
    }

    // Counter buffer 8 bytes big endian
    const counterBuffer = new ArrayBuffer(8);
    const view = new DataView(counterBuffer);
    view.setUint32(0, Math.floor(counter / 0x100000000));
    view.setUint32(4, counter & 0xffffffff);

    const key = await window.crypto.subtle.importKey(
      'raw',
      secretBytes as unknown as BufferSource,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );

    const signature = await window.crypto.subtle.sign('HMAC', key, counterBuffer);
    const hmacBytes = new Uint8Array(signature);

    // Dynamic truncation
    const offset = hmacBytes[hmacBytes.length - 1] & 0x0f;
    const binary =
      ((hmacBytes[offset] & 0x7f) << 24) |
      ((hmacBytes[offset + 1] & 0xff) << 16) |
      ((hmacBytes[offset + 2] & 0xff) << 8) |
      (hmacBytes[offset + 3] & 0xff);

    const otp = binary % 1000000;
    const token = otp.toString().padStart(6, '0');

    return { token, secondsRemaining };
  } catch (err) {
    return { token: 'ERROR', secondsRemaining: 30 };
  }
}

/**
 * 9. Cryptographically Secure Password Generator
 */
export interface PasswordGeneratorOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  special: boolean;
  avoidAmbiguous: boolean;
  minNumbers: number;
  minSpecial: number;
}

export function generatePassword(options: PasswordGeneratorOptions): string {
  let upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let lowerChars = 'abcdefghijklmnopqrstuvwxyz';
  let numberChars = '0123456789';
  let specialChars = '!@#$%^&*()-_=+[]{}|;:,.<>?';

  if (options.avoidAmbiguous) {
    upperChars = upperChars.replace(/[IO]/g, '');
    lowerChars = lowerChars.replace(/[l]/g, '');
    numberChars = numberChars.replace(/[01]/g, '');
    specialChars = specialChars.replace(/[|]/g, '');
  }

  let pool = '';
  if (options.uppercase) pool += upperChars;
  if (options.lowercase) pool += lowerChars;
  if (options.numbers) pool += numberChars;
  if (options.special) pool += specialChars;

  if (!pool) pool = lowerChars + numberChars;

  const getSecureRandomInt = (max: number) => {
    const randomBuffer = new Uint32Array(1);
    window.crypto.getRandomValues(randomBuffer);
    return randomBuffer[0] % max;
  };

  const result: string[] = [];

  // Guarantee minimums
  if (options.numbers && options.minNumbers > 0) {
    for (let i = 0; i < options.minNumbers; i++) {
      result.push(numberChars[getSecureRandomInt(numberChars.length)]);
    }
  }

  if (options.special && options.minSpecial > 0) {
    for (let i = 0; i < options.minSpecial; i++) {
      result.push(specialChars[getSecureRandomInt(specialChars.length)]);
    }
  }

  while (result.length < options.length) {
    result.push(pool[getSecureRandomInt(pool.length)]);
  }

  // Cryptographically shuffle array (Fisher-Yates)
  for (let i = result.length - 1; i > 0; i--) {
    const j = getSecureRandomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result.join('');
}

/**
 * Passphrase Generator (e.g. correct-horse-battery-staple)
 */
const WORDLIST = [
  'academic', 'quantum', 'cipher', 'network', 'polygon', 'orbit', 'matrix',
  'vector', 'entropy', 'horizon', 'nebula', 'protocol', 'galaxy', 'crystal',
  'cascade', 'element', 'gravity', 'vertex', 'dynamic', 'stellar', 'plasma',
  'binary', 'photon', 'kinetic', 'shadow', 'aurora', 'beacon', 'radiant'
];

export function generatePassphrase(wordCount = 4, separator = '-'): string {
  const randomBuffer = new Uint32Array(wordCount);
  window.crypto.getRandomValues(randomBuffer);
  const words: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    words.push(WORDLIST[randomBuffer[i] % WORDLIST.length]);
  }
  return words.join(separator);
}

/**
 * 10. Password Strength & Entropy Evaluator
 */
export function evaluatePasswordStrength(password: string): {
  score: number; // 0-4
  label: string;
  color: string;
  entropy: number;
} {
  if (!password) {
    return { score: 0, label: 'Vazia', color: 'bg-gray-300 dark:bg-gray-700', entropy: 0 };
  }

  let poolSize = 0;
  if (/[a-z]/.test(password)) poolSize += 26;
  if (/[A-Z]/.test(password)) poolSize += 26;
  if (/[0-9]/.test(password)) poolSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) poolSize += 33;

  const entropy = Math.round(password.length * Math.log2(poolSize || 1));

  if (entropy < 28 || password.length < 6) {
    return { score: 1, label: 'Muito Fraca', color: 'bg-red-500', entropy };
  } else if (entropy < 45 || password.length < 8) {
    return { score: 2, label: 'Fraca', color: 'bg-amber-500', entropy };
  } else if (entropy < 65 || password.length < 12) {
    return { score: 3, label: 'Boa', color: 'bg-yellow-500', entropy };
  } else {
    return { score: 4, label: 'Excelente', color: 'bg-emerald-500', entropy };
  }
}
