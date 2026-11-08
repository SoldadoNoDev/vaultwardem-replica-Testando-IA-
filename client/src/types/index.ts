export enum CipherType {
  Login = 1,
  SecureNote = 2,
  Card = 3,
  Identity = 4,
}

export interface LoginPayload {
  username?: string;
  password?: string;
  totp?: string; // Secret key for TOTP (e.g. JBSWY3DPEHPK3PXP)
  uris?: string[];
}

export interface CardPayload {
  cardholderName?: string;
  brand?: string;
  number?: string;
  expMonth?: string;
  expYear?: string;
  code?: string;
}

export interface SecureNotePayload {
  content?: string;
}

export interface IdentityPayload {
  title?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  username?: string;
  company?: string;
  ssn?: string;
  passportNumber?: string;
  licenseNumber?: string;
  email?: string;
  phone?: string;
  address1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export type DecryptedCipherData = LoginPayload & CardPayload & SecureNotePayload & IdentityPayload;

// Raw record stored on server / in database
export interface CipherRecord {
  id: string;
  user_id: string;
  folder_id: string | null;
  type: number;
  favorite: number;
  name: string; // CipherString
  notes: string | null; // CipherString
  encrypted_data: string; // CipherString
  reprompt: number;
  deleted_date: string | null;
  created_at: string;
  updated_at: string;
}

// Client-side decrypted cipher
export interface DecryptedCipher {
  id: string;
  folderId: string | null;
  type: CipherType;
  favorite: boolean;
  name: string; // Decrypted plaintext
  notes: string | null; // Decrypted plaintext
  data: DecryptedCipherData; // Decrypted object
  reprompt: boolean;
  deletedDate: string | null;
  createdAt: string;
  updatedAt: string;
  rawRecord?: CipherRecord; // Reference for academic inspector
}

export interface FolderRecord {
  id: string;
  user_id: string;
  name: string; // CipherString
  created_at: string;
  updated_at: string;
}

export interface DecryptedFolder {
  id: string;
  name: string; // Decrypted plaintext
  createdAt: string;
  updatedAt: string;
  rawRecord?: FolderRecord;
}

export interface UserProfile {
  id: string;
  email: string;
  key: string; // Encrypted symmetric key
  kdf: number;
  kdfIterations: number;
  createdAt?: string;
}

export interface PasswordStrengthResult {
  score: number; // 0 (Very Weak) to 4 (Very Strong)
  label: string;
  color: string;
  entropy: number;
  feedback: string[];
}
