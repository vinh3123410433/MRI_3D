// DatabaseManager.ts - Centralized IndexedDB management
// This service coordinates database access across the application

type ObjectStoreConfig = {
  name: string;
  keyPath: string;
  indexes?: { name: string; keyPath: string; unique: boolean }[];
};

class DatabaseManager {
  private static instance: DatabaseManager;  private dbName = 'mri_database';
  private dbVersion = 3; // Increment version to trigger schema updates
  private db: IDBDatabase | null = null;
  private dbInitPromise: Promise<IDBDatabase> | null = null;  private objectStores: ObjectStoreConfig[] = [
    {
      name: 'patients',
      keyPath: 'id',
      indexes: [
        { name: 'name', keyPath: 'name', unique: false },
        { name: 'phone', keyPath: 'phone', unique: false }
      ]
    },
    {
      name: 'appointments',
      keyPath: 'id',
      indexes: [
        { name: 'patientId', keyPath: 'patient.id', unique: false },
        { name: 'start', keyPath: 'start', unique: false }
      ]
    },
    {
      name: 'date_notes',
      keyPath: 'date',
      indexes: []
    },
    {
      name: 'mri_data',
      keyPath: 'id',
      indexes: [
        { name: 'patientId', keyPath: 'patientId', unique: false },
        { name: 'dataSize', keyPath: 'dataSize', unique: false }
      ]
    },
    {
      name: 'mri_files',
      keyPath: 'id',
      indexes: [
        { name: 'patientId', keyPath: 'patientId', unique: false }
      ]
    },
    {
      name: 'users',
      keyPath: 'id',
      indexes: [
        { name: 'email', keyPath: 'email', unique: true },
        { name: 'role', keyPath: 'role', unique: false }
      ]
    },
    {
      name: 'sessions',
      keyPath: 'id',
      indexes: [
        { name: 'userId', keyPath: 'userId', unique: false },
        { name: 'expiry', keyPath: 'expiry', unique: false }
      ]
    }
  ];

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public async getDatabase(): Promise<IDBDatabase> {
    if (this.db && this.isConnectionAlive(this.db)) {
      return this.db;
    }

    if (!this.dbInitPromise) {
      this.dbInitPromise = this.initDatabase();
    }

    try {
      this.db = await this.dbInitPromise;
      return this.db;
    } catch (error) {
      console.error('Failed to initialize database:', error);
      this.dbInitPromise = null;
      throw error;
    }
  }
  private isConnectionAlive(db: IDBDatabase): boolean {
    try {
      // If transaction throws an exception, the connection is likely dead
      db.transaction(db.objectStoreNames[0], 'readonly');
      return true;
    } catch (error) {
      console.warn('Database connection is no longer active');
      this.db = null;
      return false;
    }
  }

  private async initDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = (event) => {
        console.error('IndexedDB error:', event);
        reject(new Error('Failed to open database'));
      };
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Handle unexpected connection closures
        db.onclose = () => {
          console.warn('Database connection was closed unexpectedly');
          this.db = null;
          this.dbInitPromise = null;
        };
        
        db.onerror = (event) => {
          console.error('Database error:', event);
        };
        
        db.onversionchange = () => {
          console.log('Database version changed in another tab, closing connection');
          db.close();
          this.db = null;
          this.dbInitPromise = null;
        };
        
        resolve(db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // For schema upgrades, ensure all required object stores exist
        for (const storeConfig of this.objectStores) {
          let objectStore: IDBObjectStore;
          
          // Create the store if it doesn't exist
          if (!db.objectStoreNames.contains(storeConfig.name)) {
            objectStore = db.createObjectStore(storeConfig.name, { keyPath: storeConfig.keyPath });
            console.log(`Created object store: ${storeConfig.name}`);
          } else {
            objectStore = request.transaction!.objectStore(storeConfig.name);
          }
          
          // Create indexes if they don't exist
          if (storeConfig.indexes) {
            for (const indexConfig of storeConfig.indexes) {
              if (!objectStore.indexNames.contains(indexConfig.name)) {
                objectStore.createIndex(indexConfig.name, indexConfig.keyPath, { unique: indexConfig.unique });
                console.log(`Created index ${indexConfig.name} on ${storeConfig.name}`);
              }
            }
          }
        }
      };
    });
  }

  public async runTransaction<T>(
    storeName: string, 
    mode: IDBTransactionMode, 
    callback: (store: IDBObjectStore) => Promise<T>
  ): Promise<T> {
    const maxRetries = 3;
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        const db = await this.getDatabase();
        
        return new Promise((resolve, reject) => {
          if (!db.objectStoreNames.contains(storeName)) {
            reject(new Error(`Object store ${storeName} does not exist`));
            return;
          }
          
          const transaction = db.transaction(storeName, mode);
          const store = transaction.objectStore(storeName);
          
          transaction.onerror = (event) => {
            console.error(`Transaction error for ${storeName}:`, event);
            reject(new Error(`Transaction error for ${storeName}`));
          };
          
          transaction.onabort = (event) => {
            console.error(`Transaction aborted for ${storeName}:`, event);
            reject(new Error(`Transaction aborted for ${storeName}`));
          };
          
          // Execute the callback with the store object
          callback(store)
            .then(resolve)
            .catch(reject);
        });
      } catch (error) {
        retries++;
        console.warn(`Database operation failed, retry ${retries}/${maxRetries}:`, error);
        
        // If connection issue, reset connection and try again after a delay
        this.db = null;
        this.dbInitPromise = null;
        
        if (retries < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 500 * retries));
        } else {
          throw error;
        }
      }
    }
    
    throw new Error(`Failed to execute transaction after ${maxRetries} retries`);
  }

  // Common utility functions for services
  public async getAll<T>(storeName: string): Promise<T[]> {
    return this.runTransaction(storeName, 'readonly', async (store) => {
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        
        request.onsuccess = () => {
          resolve(request.result || []);
        };
        
        request.onerror = (event) => {
          reject(new Error(`Failed to get all items from ${storeName}`));
        };
      });
    });
  }

  public async get<T>(storeName: string, key: IDBValidKey): Promise<T | null> {
    return this.runTransaction(storeName, 'readonly', async (store) => {
      return new Promise((resolve, reject) => {
        const request = store.get(key);
        
        request.onsuccess = () => {
          resolve(request.result || null);
        };
        
        request.onerror = (event) => {
          reject(new Error(`Failed to get item with key ${String(key)} from ${storeName}`));
        };
      });
    });
  }

  public async add<T>(storeName: string, item: T): Promise<IDBValidKey> {
    return this.runTransaction(storeName, 'readwrite', async (store) => {
      return new Promise((resolve, reject) => {
        const request = store.add(item);
        
        request.onsuccess = () => {
          resolve(request.result);
        };
        
        request.onerror = (event) => {
          reject(new Error(`Failed to add item to ${storeName}`));
        };
      });
    });
  }

  public async put<T>(storeName: string, item: T): Promise<IDBValidKey> {
    return this.runTransaction(storeName, 'readwrite', async (store) => {
      return new Promise((resolve, reject) => {
        const request = store.put(item);
        
        request.onsuccess = () => {
          resolve(request.result);
        };
        
        request.onerror = (event) => {
          reject(new Error(`Failed to update item in ${storeName}`));
        };
      });
    });
  }

  public async delete(storeName: string, key: IDBValidKey): Promise<void> {
    return this.runTransaction(storeName, 'readwrite', async (store) => {
      return new Promise((resolve, reject) => {
        const request = store.delete(key);
        
        request.onsuccess = () => {
          resolve();
        };
        
        request.onerror = (event) => {
          reject(new Error(`Failed to delete item with key ${String(key)} from ${storeName}`));
        };
      });
    });
  }

  public async clearObjectStore(storeName: string): Promise<void> {
    return this.runTransaction(storeName, 'readwrite', async (store) => {
      return new Promise((resolve, reject) => {
        const request = store.clear();
        
        request.onsuccess = () => {
          resolve();
        };
        
        request.onerror = (event) => {
          reject(new Error(`Failed to clear object store ${storeName}`));
        };
      });
    });
  }
}

export const dbManager = DatabaseManager.getInstance();
export default dbManager;
