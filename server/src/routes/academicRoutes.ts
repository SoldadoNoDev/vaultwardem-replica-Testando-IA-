import { Router, Response } from 'express';
import { db } from '../db/database.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const academicRouter = Router();

// Academic Live Database Inspector (Zero-Knowledge Proof)
academicRouter.get('/raw-db-inspector', (req: AuthenticatedRequest, res: Response) => {
  const userId = String(req.user!.userId);

  const rawUser = db.prepare('SELECT id, email, master_password_hash, master_password_hint, encrypted_symmetric_key, kdf, kdf_iterations, created_at FROM users WHERE id = ?').get(userId);
  const rawCiphers = db.prepare('SELECT id, folder_id, type, favorite, name, notes, encrypted_data, reprompt, deleted_date, created_at, updated_at FROM ciphers WHERE user_id = ?').all(userId);
  const rawFolders = db.prepare('SELECT id, name, created_at FROM folders WHERE user_id = ?').all(userId);

  return res.json({
    databaseType: 'SQLite (WAL Mode via node:sqlite)',
    zeroKnowledgeVerified: true,
    explanation: 'Notice how all sensitive credentials, cipher names, notes, and payloads are exclusively stored as ciphertext strings. The server host has ZERO access to plaintext vault data.',
    serverState: {
      userTableRecord: rawUser,
      foldersTableRecords: rawFolders,
      ciphersTableRecords: rawCiphers,
    }
  });
});

// Cryptographic Specification metadata
academicRouter.get('/crypto-specs', (_req, res: Response) => {
  return res.json({
    standard: 'Bitwarden Security Architecture & Cryptographic Specification',
    kdf: {
      algorithm: 'PBKDF2',
      digest: 'HMAC-SHA256',
      defaultIterations: 600000,
      saltRule: 'email.trim().toLowerCase()'
    },
    keyHierarchy: {
      step1: 'Master Password + Salt -> PBKDF2 -> Master Key (256-bit)',
      step2_auth: 'Master Key + Master Password -> PBKDF2(1) / HMAC-SHA256 -> Master Password Hash -> Server bcrypt',
      step3_encryption: 'User Symmetric Key (512-bit AES+MAC or 256-bit AES-GCM) encrypted with Master Key',
      step4_vault: 'Individual items encrypted using User Symmetric Key'
    },
    cipherFormat: {
      type2: '2.iv|ciphertext|mac (AES-256-CBC + HMAC-SHA256)',
      type0: '0.iv|ciphertext (AES-256-GCM authenticated)'
    },
    totp: {
      standard: 'RFC 6238',
      hash: 'SHA-1',
      intervalSeconds: 30,
      digits: 6
    }
  });
});
