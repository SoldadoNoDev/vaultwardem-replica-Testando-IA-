import { Router, Response } from 'express';
import crypto from 'node:crypto';
import { db } from '../db/database.js';
import { CipherRecord } from '../types/index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const cipherRouter = Router();

// List ciphers
cipherRouter.get('/', (req: AuthenticatedRequest, res: Response) => {
  const userId = String(req.user!.userId);
  const includeDeleted = req.query.includeDeleted === 'true';

  let sql = 'SELECT * FROM ciphers WHERE user_id = ?';
  if (!includeDeleted) {
    sql += ' AND deleted_date IS NULL';
  }
  sql += ' ORDER BY favorite DESC, updated_at DESC';

  const rows = db.prepare(sql).all(userId) as unknown as CipherRecord[];
  return res.json({ data: rows });
});

// Get single cipher
cipherRouter.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const userId = String(req.user!.userId);
  const cipherId = String(req.params.id);

  const cipher = db.prepare('SELECT * FROM ciphers WHERE id = ? AND user_id = ?').get(cipherId, userId) as unknown as CipherRecord | undefined;
  if (!cipher) {
    return res.status(404).json({ error: 'Cipher not found' });
  }

  return res.json({ data: cipher });
});

// Create cipher
cipherRouter.post('/', (req: AuthenticatedRequest, res: Response) => {
  const userId = String(req.user!.userId);
  const { folderId, type = 1, favorite = 0, name, notes, encryptedData, reprompt = 0 } = req.body;

  if (!name || !encryptedData) {
    return res.status(400).json({ error: 'Name and encryptedData are required' });
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const insert = db.prepare(`
    INSERT INTO ciphers (
      id, user_id, folder_id, type, favorite, name, notes,
      encrypted_data, reprompt, deleted_date, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)
  `);

  insert.run(
    id,
    userId,
    folderId ? String(folderId) : null,
    Number(type),
    favorite ? 1 : 0,
    String(name),
    notes ? String(notes) : null,
    String(encryptedData),
    reprompt ? 1 : 0,
    now,
    now
  );

  const created = db.prepare('SELECT * FROM ciphers WHERE id = ?').get(id) as unknown as CipherRecord;
  return res.status(201).json({ data: created });
});

// Update cipher
cipherRouter.put('/:id', (req: AuthenticatedRequest, res: Response) => {
  const userId = String(req.user!.userId);
  const cipherId = String(req.params.id);
  const { folderId, type = 1, favorite = 0, name, notes, encryptedData, reprompt = 0 } = req.body;

  const existing = db.prepare('SELECT id FROM ciphers WHERE id = ? AND user_id = ?').get(cipherId, userId);
  if (!existing) {
    return res.status(404).json({ error: 'Cipher not found' });
  }

  const now = new Date().toISOString();
  const update = db.prepare(`
    UPDATE ciphers SET
      folder_id = ?,
      type = ?,
      favorite = ?,
      name = ?,
      notes = ?,
      encrypted_data = ?,
      reprompt = ?,
      updated_at = ?
    WHERE id = ? AND user_id = ?
  `);

  update.run(
    folderId ? String(folderId) : null,
    Number(type),
    favorite ? 1 : 0,
    String(name),
    notes ? String(notes) : null,
    String(encryptedData),
    reprompt ? 1 : 0,
    now,
    cipherId,
    userId
  );

  const updated = db.prepare('SELECT * FROM ciphers WHERE id = ?').get(cipherId) as unknown as CipherRecord;
  return res.json({ data: updated });
});

// Soft delete (Move to Trash)
cipherRouter.delete('/:id', (req: AuthenticatedRequest, res: Response) => {
  const userId = String(req.user!.userId);
  const cipherId = String(req.params.id);

  const existing = db.prepare('SELECT id FROM ciphers WHERE id = ? AND user_id = ?').get(cipherId, userId);
  if (!existing) {
    return res.status(404).json({ error: 'Cipher not found' });
  }

  const now = new Date().toISOString();
  db.prepare('UPDATE ciphers SET deleted_date = ?, updated_at = ? WHERE id = ? AND user_id = ?')
    .run(now, now, cipherId, userId);

  return res.json({ success: true, message: 'Cipher moved to trash' });
});

// Restore from Trash
cipherRouter.post('/:id/restore', (req: AuthenticatedRequest, res: Response) => {
  const userId = String(req.user!.userId);
  const cipherId = String(req.params.id);

  const existing = db.prepare('SELECT id FROM ciphers WHERE id = ? AND user_id = ?').get(cipherId, userId);
  if (!existing) {
    return res.status(404).json({ error: 'Cipher not found' });
  }

  const now = new Date().toISOString();
  db.prepare('UPDATE ciphers SET deleted_date = NULL, updated_at = ? WHERE id = ? AND user_id = ?')
    .run(now, cipherId, userId);

  return res.json({ success: true, message: 'Cipher restored from trash' });
});

// Permanently delete (Purge single item)
cipherRouter.delete('/:id/purge', (req: AuthenticatedRequest, res: Response) => {
  const userId = String(req.user!.userId);
  const cipherId = String(req.params.id);

  db.prepare('DELETE FROM ciphers WHERE id = ? AND user_id = ?').run(cipherId, userId);
  return res.json({ success: true, message: 'Cipher permanently deleted' });
});

// Purge all trash
cipherRouter.post('/purge-trash', (req: AuthenticatedRequest, res: Response) => {
  const userId = String(req.user!.userId);
  db.prepare('DELETE FROM ciphers WHERE user_id = ? AND deleted_date IS NOT NULL').run(userId);
  return res.json({ success: true, message: 'Trash emptied successfully' });
});
