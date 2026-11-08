import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'vaultwarden.db');

// Ensure directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new DatabaseSync(dbPath);

// Enable WAL mode and foreign keys for high performance and integrity
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      master_password_hash TEXT NOT NULL,
      master_password_hint TEXT,
      encrypted_symmetric_key TEXT NOT NULL,
      kdf INTEGER NOT NULL DEFAULT 0,
      kdf_iterations INTEGER NOT NULL DEFAULT 600000,
      kdf_memory INTEGER,
      kdf_parallelism INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS folders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ciphers (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      folder_id TEXT,
      type INTEGER NOT NULL DEFAULT 1,
      favorite INTEGER NOT NULL DEFAULT 0,
      name TEXT NOT NULL,
      notes TEXT,
      encrypted_data TEXT NOT NULL,
      reprompt INTEGER NOT NULL DEFAULT 0,
      deleted_date TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_ciphers_user ON ciphers(user_id);
    CREATE INDEX IF NOT EXISTS idx_ciphers_folder ON ciphers(folder_id);
    CREATE INDEX IF NOT EXISTS idx_folders_user ON folders(user_id);
  `);
}

