import { Router, Response } from 'express';
import { db } from '../db/database.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { UserRecord, CipherRecord, FolderRecord } from '../types/index.js';

export const syncRouter = Router();

syncRouter.get('/', (req: AuthenticatedRequest, res: Response) => {
  const userId = String(req.user!.userId);

  const user = db.prepare('SELECT id, email, encrypted_symmetric_key, kdf, kdf_iterations FROM users WHERE id = ?')
    .get(userId) as unknown as Pick<UserRecord, 'id' | 'email' | 'encrypted_symmetric_key' | 'kdf' | 'kdf_iterations'> | undefined;

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const folders = db.prepare('SELECT * FROM folders WHERE user_id = ? ORDER BY created_at ASC').all(userId) as unknown as FolderRecord[];
  const ciphers = db.prepare('SELECT * FROM ciphers WHERE user_id = ? ORDER BY favorite DESC, updated_at DESC').all(userId) as unknown as CipherRecord[];

  return res.json({
    profile: {
      id: user.id,
      email: user.email,
      key: user.encrypted_symmetric_key,
      kdf: user.kdf,
      kdfIterations: user.kdf_iterations,
    },
    folders,
    ciphers,
  });
});
