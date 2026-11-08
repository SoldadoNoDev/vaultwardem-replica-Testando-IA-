import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { UserProfile } from '../types/index.js';
import { ApiClient } from '../api/apiClient.js';
import {
  deriveMasterKey,
  deriveMasterPasswordHash,
  generateUserSymmetricKeyBytes,
  encryptSymmetricKey,
  decryptSymmetricKey,
  importSymmetricKey
} from '../crypto/webCrypto.js';

interface AuthContextType {
  user: UserProfile | null;
  userSymmetricKey: CryptoKey | null;
  isAuthenticated: boolean;
  isLocked: boolean;
  isLoading: boolean;
  lockTimeout: number; // in minutes, 0 = never
  setLockTimeout: (minutes: number) => void;
  login: (email: string, masterPassword: string) => Promise<void>;
  register: (email: string, masterPassword: string, hint?: string, iterations?: number) => Promise<void>;
  lock: () => void;
  unlock: (masterPassword: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('vw_user_profile');
    return saved ? JSON.parse(saved) : null;
  });
  const [userSymmetricKey, setUserSymmetricKey] = useState<CryptoKey | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    // If token exists but no symmetric key in memory, it is locked
    return !!localStorage.getItem('vw_auth_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lockTimeout, setLockTimeoutState] = useState<number>(() => {
    return Number(localStorage.getItem('vw_lock_timeout') || 15);
  });

  const setLockTimeout = (mins: number) => {
    setLockTimeoutState(mins);
    localStorage.setItem('vw_lock_timeout', String(mins));
  };

  const lock = useCallback(() => {
    // Clear decrypted crypto keys from browser memory!
    setUserSymmetricKey(null);
    setIsLocked(true);
    console.log('[Zero-Knowledge] Vault locked. Cryptographic keys purged from memory.');
  }, []);

  const logout = useCallback(() => {
    ApiClient.setToken(null);
    setUser(null);
    setUserSymmetricKey(null);
    setIsLocked(false);
    localStorage.removeItem('vw_user_profile');
    localStorage.removeItem('vw_auth_token');
  }, []);

  // Auto-lock inactivity listener
  useEffect(() => {
    if (!userSymmetricKey || lockTimeout === 0) return;

    let timer: ReturnType<typeof setTimeout>;
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        console.log('[Security] Auto-lock triggered due to inactivity');
        lock();
      }, lockTimeout * 60 * 1000);
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [userSymmetricKey, lockTimeout, lock]);

  // Login implementation
  const login = async (email: string, masterPassword: string) => {
    setIsLoading(true);
    try {
      // 1. Prelogin: Fetch KDF iterations from server
      const prelogin = await ApiClient.prelogin(email);

      // 2. Client-Side: Derive Master Key
      const { cryptoKey: masterKey, raw: masterKeyRaw } = await deriveMasterKey(
        masterPassword,
        email,
        prelogin.kdfIterations || 600000
      );

      // 3. Client-Side: Derive Auth Hash (PBKDF2 of MasterKey)
      const masterPasswordHash = await deriveMasterPasswordHash(masterKeyRaw, masterPassword);

      // 4. Authenticate with server
      const res = await ApiClient.login({
        email,
        masterPasswordHash,
      });

      // 5. Decrypt User's Symmetric Key using Master Key
      const decryptedSymKey = await decryptSymmetricKey(res.user.key, masterKey);

      setUser(res.user);
      setUserSymmetricKey(decryptedSymKey);
      setIsLocked(false);
      localStorage.setItem('vw_user_profile', JSON.stringify(res.user));
    } finally {
      setIsLoading(false);
    }
  };

  // Register implementation
  const register = async (email: string, masterPassword: string, hint?: string, iterations = 600000) => {
    setIsLoading(true);
    try {
      // 1. Derive Master Key
      const { cryptoKey: masterKey, raw: masterKeyRaw } = await deriveMasterKey(
        masterPassword,
        email,
        iterations
      );

      // 2. Derive Auth Hash for server storage
      const masterPasswordHash = await deriveMasterPasswordHash(masterKeyRaw, masterPassword);

      // 3. Generate User Symmetric Key (256-bit AES-GCM)
      const symKeyBytes = generateUserSymmetricKeyBytes();

      // 4. Encrypt User Symmetric Key with Master Key
      const encryptedKeyString = await encryptSymmetricKey(symKeyBytes, masterKey);

      // 5. Send registration payload to server
      await ApiClient.register({
        email,
        masterPasswordHash,
        masterPasswordHint: hint,
        key: encryptedKeyString,
        kdf: 0,
        kdfIterations: iterations,
      });

      // Auto login right after registration
      const importedSymKey = await importSymmetricKey(symKeyBytes);
      const loginRes = await ApiClient.login({ email, masterPasswordHash });

      setUser(loginRes.user);
      setUserSymmetricKey(importedSymKey);
      setIsLocked(false);
      localStorage.setItem('vw_user_profile', JSON.stringify(loginRes.user));
    } finally {
      setIsLoading(false);
    }
  };

  // Unlock vault using Master Password
  const unlock = async (masterPassword: string): Promise<boolean> => {
    if (!user) return false;
    setIsLoading(true);
    try {
      const { cryptoKey: masterKey } = await deriveMasterKey(
        masterPassword,
        user.email,
        user.kdfIterations || 600000
      );

      const decryptedSymKey = await decryptSymmetricKey(user.key, masterKey);
      setUserSymmetricKey(decryptedSymKey);
      setIsLocked(false);
      return true;
    } catch (err) {
      console.error('Failed to unlock vault:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userSymmetricKey,
        isAuthenticated: !!user && !!ApiClient.getToken(),
        isLocked,
        isLoading,
        lockTimeout,
        setLockTimeout,
        login,
        register,
        lock,
        unlock,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
