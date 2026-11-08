import { Router, Response } from 'express';
import crypto from 'node:crypto';
import { db } from '../db/database.js';
import { FolderRecord } from '../types/index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const folderRouter = Router();

// List folders
folderRouter.get('/', (req: AuthenticatedRequest, res: Response) => {
  const userId = String(req.user!.userId);
  const rows = db.prepare('SELECT * FROM folders WHERE user_id = ? ORDER BY created_at ASC').all(userId) as unknown as FolderRecord[];
  return res.json({ data: rows });
});

// Create folder
folderRouter.post('/', (req: AuthenticatedRequest, res: Response) => {
  const userId = String(req.user!.userId);
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Folder name is required' });
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare('INSERT INTO folders (id, user_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
    .run(id, userId, String(name), now, now);

  const folder = db.prepare('SELECT * FROM folders WHERE id = ?').get(id) as unknown as FolderRecord;
  return res.status(201).json({ data: folder });
});

// Update folder
folderRouter.put('/:id', (req: AuthenticatedRequest, res: Response) => {
  const userId = String(req.user!.userId);
  const folderId = String(req.params.id);
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Folder name is required' });
  }

  const existing = db.prepare('SELECT id FROM folders WHERE id = ? AND user_id = ?').get(folderId, userId);
  if (!existing) {
    return res.status(404).json({ error: 'Folder not found' });
  }

  const now = new Date().toISOString();
  db.prepare('UPDATE folders SET name = ?, updated_at = ? WHERE id = ? AND user_id = ?')
    .run(String(name), now, folderId, userId);

  const updated = db.prepare('SELECT * FROM folders WHERE id = ?').get(folderId) as unknown as FolderRecord;
  return res.json({ data: updated });
});

// Delete folder
folderRouter.delete('/:id', (req: AuthenticatedRequest, res: Response) => {
  const userId = String(req.user!.userId);
  const folderId = String(req.params.id);

  // Unlink ciphers first
  db.prepare('UPDATE ciphers SET folder_id = NULL WHERE folder_id = ? AND user_id = ?').run(folderId, userId);
  db.prepare('DELETE FROM folders WHERE id = ? AND user_id = ?').run(folderId, userId);

  return res.json({ success: true, message: 'Folder deleted' });
});
