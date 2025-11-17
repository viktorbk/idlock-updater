import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Fallback in-memory storage
const inMemoryStorage: Record<string, string> = {};

// Try to initialize MMKV, but don't fail if it doesn't work
let mmkvStorage: {
  setItem: (name: string, value: string) => void;
  getItem: (name: string) => string | null;
  removeItem: (name: string) => void;
};

// Check if MMKV module is available before trying to use it
let mmkvAvailable = false;
let storageInstance: any = null;

// Use a function to safely check for MMKV
// Wrap in immediate function to catch any errors during require
(function tryInitMMKV() {
  try {
    // Use a more defensive require that won't throw if module doesn't exist
    let mmkvModule: any;
    try {
      mmkvModule = require('react-native-mmkv');
    } catch (requireError: any) {
      // require() itself failed - native module not linked
      return;
    }
    
    if (mmkvModule && mmkvModule.MMKV && typeof mmkvModule.MMKV === 'function') {
      try {
        storageInstance = new mmkvModule.MMKV({ id: 'idlock-updater' });
        mmkvAvailable = true;
      } catch (initError: any) {
        // MMKV constructor failed
        return;
      }
    }
  } catch (error: any) {
    // Any other error - silently ignore
    return;
  }
})();

if (mmkvAvailable && storageInstance) {
  mmkvStorage = {
    setItem: (name: string, value: string) => {
      try {
        storageInstance.set(name, value);
      } catch (error) {
        // Fallback to in-memory
        inMemoryStorage[name] = value;
      }
    },
    getItem: (name: string) => {
      try {
        const value = storageInstance.getString(name);
        return value ?? inMemoryStorage[name] ?? null;
      } catch (error) {
        return inMemoryStorage[name] ?? null;
      }
    },
    removeItem: (name: string) => {
      try {
        if (typeof storageInstance.delete === 'function') {
          storageInstance.delete(name);
        } else if (typeof storageInstance.remove === 'function') {
          storageInstance.remove(name);
        }
        delete inMemoryStorage[name];
      } catch (error) {
        delete inMemoryStorage[name];
      }
    },
  };
}

// If MMKV is not available, use in-memory storage
if (!mmkvAvailable) {
  console.warn('MMKV not available, using in-memory storage');
  mmkvStorage = {
    setItem: (name: string, value: string) => {
      inMemoryStorage[name] = value;
    },
    getItem: (name: string) => {
      return inMemoryStorage[name] ?? null;
    },
    removeItem: (name: string) => {
      delete inMemoryStorage[name];
    },
  };
}

// AppState interface
export interface BleDevice {
  id: string;
  type: string;
  rssi: number;
  name: string;
  series: string;
  version: string;
  inVersion: string;
  outVersion: string;
}

interface AppState {
  lockId: string;
  type: string;
  filesData: string;
  selectedLock: BleDevice | null;
  setLockId: (lockId: string) => void;
  setType: (type: string) => void;
  setFilesData: (filesData: string) => void;
  setSelectedLock: (lock: BleDevice | null) => void;
  reset: () => void;
}
// Initial state
const initialState = {
  type: '',
  lockId: '',
  filesData: '',
  selectedLock: null as BleDevice | null,
};

// Create the store with persistence
// Wrap in try-catch to ensure store is always created even if persistence fails
export const useAppStore = (() => {
  try {
    return create<AppState>()(
      persist(
        (set) => ({
          ...initialState,
          setLockId: (lockId: string) => set({ lockId }),
          setType: (type: string) => set({ type }),
          setFilesData: (filesData: string) => set({ filesData }),
          setSelectedLock: (lock: BleDevice | null) => set({ selectedLock: lock }),
          reset: () => set({
            ...initialState,
            type: '',
          }),
        }),
        {
          name: 'idlock-updater-storage',
          storage: createJSONStorage(() => mmkvStorage),
        }
      )
    );
  } catch (error) {
    console.error('Failed to create store with persistence, creating without persistence:', error);
    // Fallback: create store without persistence
    return create<AppState>()((set) => ({
      ...initialState,
      setLockId: (lockId: string) => set({ lockId }),
      setType: (type: string) => set({ type }),
      setFilesData: (filesData: string) => set({ filesData }),
      setSelectedLock: (lock: BleDevice | null) => set({ selectedLock: lock }),
      reset: () => set(initialState),
    }));
  }
})();

