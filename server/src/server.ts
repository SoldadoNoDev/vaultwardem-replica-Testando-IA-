import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { initDatabase } from './db/database.js';
import { authRouter } from './routes/authRoutes.js';
import { cipherRouter } from './routes/cipherRoutes.js';
import { folderRouter } from './routes/folderRoutes.js';
import { syncRouter } from './routes/syncRoutes.js';
import { academicRouter } from './routes/academicRoutes.js';
import { authMiddleware } from './middleware/auth.js';

export function createServer() {
  initDatabase();

  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Status & Health
  app.get('/api/status', (_req, res) => {
    res.json({
      status: 'online',
      name: 'Vaultwarden Academic Replica API',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  });

  // API Routes
  app.use('/api/accounts', authRouter);
  app.use('/api/ciphers', authMiddleware, cipherRouter);
  app.use('/api/folders', authMiddleware, folderRouter);
  app.use('/api/sync', authMiddleware, syncRouter);
  app.use('/api/academic', authMiddleware, academicRouter);

  // Serve static client build if available (production mode)
  // When running with tsx/esm or compiled
  const clientDistPath = path.resolve(process.cwd(), '../client/dist');
  const directClientDistPath = path.resolve(process.cwd(), 'client/dist');
  const distToServe = fs.existsSync(clientDistPath) ? clientDistPath : (fs.existsSync(directClientDistPath) ? directClientDistPath : null);

  if (distToServe) {
    app.use(express.static(distToServe));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distToServe, 'index.html'));
    });
  }

  return app;
}

