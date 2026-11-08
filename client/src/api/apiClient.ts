import { CipherRecord, FolderRecord, UserProfile } from '../types/index.js';

const API_BASE = '/api';

export class ApiClient {
  private static token: string | null = localStorage.getItem('vw_auth_token');

  public static setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('vw_auth_token', token);
    } else {
      localStorage.removeItem('vw_auth_token');
    }
  }

  public static getToken(): string | null {
    return this.token;
  }

  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || `HTTP error ${res.status}: ${res.statusText}`);
    }

    return data as T;
  }

  // Prelogin - get KDF parameters
  public static async prelogin(email: string): Promise<{
    kdf: number;
    kdfIterations: number;
    kdfMemory?: number | null;
    kdfParallelism?: number | null;
  }> {
    return this.request('/accounts/prelogin', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // Register
  public static async register(payload: {
    email: string;
    masterPasswordHash: string;
    masterPasswordHint?: string;
    key: string;
    kdf: number;
    kdfIterations: number;
  }): Promise<{ success: boolean; id: string }> {
    return this.request('/accounts/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Login
  public static async login(payload: {
    email: string;
    masterPasswordHash: string;
  }): Promise<{
    token: string;
    user: UserProfile;
  }> {
    const res = await this.request<{
      token: string;
      user: UserProfile;
    }>('/accounts/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    this.setToken(res.token);
    return res;
  }

  // Request Master Password Hint
  public static async requestHint(email: string): Promise<{ hint: string | null }> {
    return this.request('/accounts/password-hint', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // Full Vault Sync
  public static async sync(): Promise<{
    profile: UserProfile;
    folders: FolderRecord[];
    ciphers: CipherRecord[];
  }> {
    return this.request('/sync');
  }

  // Ciphers CRUD
  public static async createCipher(payload: {
    folderId?: string | null;
    type: number;
    favorite?: number;
    name: string;
    notes?: string | null;
    encryptedData: string;
    reprompt?: number;
  }): Promise<{ data: CipherRecord }> {
    return this.request('/ciphers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public static async updateCipher(
    id: string,
    payload: {
      folderId?: string | null;
      type: number;
      favorite?: number;
      name: string;
      notes?: string | null;
      encryptedData: string;
      reprompt?: number;
    }
  ): Promise<{ data: CipherRecord }> {
    return this.request(`/ciphers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  public static async deleteCipher(id: string): Promise<{ success: boolean }> {
    return this.request(`/ciphers/${id}`, { method: 'DELETE' });
  }

  public static async restoreCipher(id: string): Promise<{ success: boolean }> {
    return this.request(`/ciphers/${id}/restore`, { method: 'POST' });
  }

  public static async purgeCipher(id: string): Promise<{ success: boolean }> {
    return this.request(`/ciphers/${id}/purge`, { method: 'DELETE' });
  }

  public static async purgeTrash(): Promise<{ success: boolean }> {
    return this.request('/ciphers/purge-trash', { method: 'POST' });
  }

  // Folders CRUD
  public static async getFolders(): Promise<{ data: FolderRecord[] }> {
    return this.request('/folders');
  }

  public static async createFolder(name: string): Promise<{ data: FolderRecord }> {
    return this.request('/folders', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  public static async updateFolder(id: string, name: string): Promise<{ data: FolderRecord }> {
    return this.request(`/folders/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    });
  }

  public static async deleteFolder(id: string): Promise<{ success: boolean }> {
    return this.request(`/folders/${id}`, { method: 'DELETE' });
  }

  // Academic Inspector
  public static async getRawDbInspection(): Promise<any> {
    return this.request('/academic/raw-db-inspector');
  }

  public static async getCryptoSpecs(): Promise<any> {
    return this.request('/academic/crypto-specs');
  }
}
