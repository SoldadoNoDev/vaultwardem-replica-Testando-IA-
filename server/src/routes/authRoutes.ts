import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/database.js';
import { UserRecord } from '../types/index.js';
import { authMiddleware, AuthenticatedRequest, JWT_SECRET } from '../middleware/auth.js';

export const authRouter = Router();

// Prelogin - returns KDF parameters to client for key derivation
authRouter.post('/prelogin', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const stmt = db.prepare('SELECT kdf, kdf_iterations, kdf_memory, kdf_parallelism FROM users WHERE email = ?');
  const user = stmt.get(normalizedEmail) as unknown as Pick<UserRecord, 'kdf' | 'kdf_iterations' | 'kdf_memory' | 'kdf_parallelism'> | undefined;

  if (user) {
    return res.json({
      kdf: user.kdf,
      kdfIterations: user.kdf_iterations,
      kdfMemory: user.kdf_memory,
      kdfParallelism: user.kdf_parallelism,
    });
  }

  // Bitwarden anti-enumeration default response
  return res.json({
    kdf: 0, // PBKDF2_SHA256
    kdfIterations: 600000,
    kdfMemory: null,
    kdfParallelism: null,
  });
});

// Register - create new account with Zero-Knowledge parameters
authRouter.post('/register', (req: Request, res: Response) => {
  const { email, masterPasswordHash, masterPasswordHint, key, kdf = 0, kdfIterations = 600000 } = req.body;

  if (!email || !masterPasswordHash || !key) {
    return res.status(400).json({ error: 'Missing required registration parameters' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const checkUser = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (checkUser) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const id = crypto.randomUUID();
  const serverHashedAuth = bcrypt.hashSync(masterPasswordHash, 10);
  const now = new Date().toISOString();

  const insert = db.prepare(`
    INSERT INTO users (
      id, email, master_password_hash, master_password_hint,
      encrypted_symmetric_key, kdf, kdf_iterations, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insert.run(
    id,
    normalizedEmail,
    serverHashedAuth,
    masterPasswordHint ? String(masterPasswordHint).slice(0, 200) : null,
    key,
    Number(kdf),
    Number(kdfIterations),
    now,
    now
  );

  return res.status(201).json({
    success: true,
    message: 'Account registered successfully',
    id
  });
});

// Login - authenticate and return token with encrypted symmetric key
authRouter.post('/login', (req: Request, res: Response) => {
  const { email, masterPasswordHash } = req.body;

  if (!email || !masterPasswordHash) {
    return res.status(400).json({ error: 'Email and master password hash are required' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail) as unknown as UserRecord | undefined;

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or master password' });
  }

  const isValid = bcrypt.compareSync(masterPasswordHash, user.master_password_hash);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid email or master password' });
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  return res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      key: user.encrypted_symmetric_key,
      kdf: user.kdf,
      kdfIterations: user.kdf_iterations,
    }
  });
});

// Password hint request
authRouter.post('/password-hint', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = db.prepare('SELECT master_password_hint FROM users WHERE email = ?').get(normalizedEmail) as unknown as Pick<UserRecord, 'master_password_hint'> | undefined;

  if (user && user.master_password_hint) {
    return res.json({ hint: user.master_password_hint });
  }
  return res.json({ hint: null });
});

// Profile - get authenticated user info
authRouter.get('/profile', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const user = db.prepare(`
    SELECT id, email, encrypted_symmetric_key, kdf, kdf_iterations, created_at, updated_at
    FROM users WHERE id = ?
  `).get(String(req.user!.userId)) as unknown as Omit<UserRecord, 'master_password_hash'> | undefined;

  if (!user) return res.status(404).json({ error: 'User not found' });

  return res.json({
    id: user.id,
    email: user.email,
    key: user.encrypted_symmetric_key,
    kdf: user.kdf,
    kdfIterations: user.kdf_iterations,
    createdAt: user.created_at
  });
});
