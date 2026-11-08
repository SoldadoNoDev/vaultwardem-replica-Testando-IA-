export interface UserRecord {
  id: string;
  email: string;
  master_password_hash: string;
  master_password_hint: string | null;
  encrypted_symmetric_key: string; // Encrypted with MasterKey
  kdf: number; // 0 = PBKDF2_SHA256
  kdf_iterations: number;
  kdf_memory?: number | null;
  kdf_parallelism?: number | null;
  created_at: string;
  updated_at: string;
}

export interface CipherRecord {
  id: string;
  user_id: string;
  folder_id: string | null;
  type: number; // 1 = Login, 2 = SecureNote, 3 = Card, 4 = Identity
  favorite: number; // 0 or 1
  name: string; // CipherString
  notes: string | null; // CipherString
  encrypted_data: string; // CipherString containing sensitive json payload
  reprompt: number; // 0 or 1
  deleted_date: string | null; // ISO string if in trash
  created_at: string;
  updated_at: string;
}

export interface FolderRecord {
  id: string;
  user_id: string;
  name: string; // CipherString
  created_at: string;
  updated_at: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
}

