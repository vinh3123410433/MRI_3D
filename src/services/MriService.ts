// MRI Data storage and management service using IndexedDB

export interface MriData {
  id: string;
  patientId: string;
  name: string;
  date: string;
  data: Float32Array;
  dimensions: [number, number, number];
  slices: {
    x: number;
    y: number;
    z: number;
  };
}

class MriService {
  private mriData: MriData[] = [];
  private storageKey = 'mri_data_index';
  private dbName = 'mri_database';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  private maxRetries = 3;

  constructor() {
    this.initDatabase().catch(error => {
      console.error('Error initializing MRI database:', error);
      // Fallback to localStorage if IndexedDB fails
      this.loadFromLocalStorage();
    });
  }

  // Initialize the IndexedDB database
  private async initDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      let retryCount = 0;
      const tryOpen = () => {
        const request = indexedDB.open(this.dbName, this.dbVersion);
        
        request.onerror = (event) => {
          console.error('IndexedDB error:', event);
          if (retryCount < this.maxRetries) {
            retryCount++;
            console.log(`Retrying database open (attempt ${retryCount})...`);
            setTimeout(tryOpen, 1000);
          } else {
            reject('Failed to open database after multiple attempts');
          }
        };
        
        request.onsuccess = (event) => {
          this.db = (event.target as IDBOpenDBRequest).result;
          
          // Add error handler for the database
          this.db.onerror = (event) => {
            console.error('Database error:', event);
          };
          
          this.loadData();
          resolve();
        };
        
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          
          if (!db.objectStoreNames.contains('mri_data')) {
            const store = db.createObjectStore('mri_data', { keyPath: 'id' });
            store.createIndex('patientId', 'patientId', { unique: false });
            
            // Add validation for data size
            store.createIndex('dataSize', 'dataSize', { unique: false });
          }
        };
      };
      
      tryOpen();
    });
  }

  // Ensure database is initialized with retry mechanism
  private async ensureDbInitialized(): Promise<IDBDatabase> {
    let retries = 0;
    while (!this.db && retries < this.maxRetries) {
      try {
        await this.initDatabase();
        retries++;
        if (!this.db) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`Database initialization retry ${retries} failed:`, error);
      }
    }
    
    if (!this.db) {
      throw new Error('Failed to initialize database');
    }
    
    return this.db;
  }

  // Load data from IndexedDB
  private async loadData(): Promise<void> {
    try {
      const db = await this.ensureDbInitialized();
      this.mriData = await this.getAllMriDataFromDb(db);
    } catch (error) {
      console.error('Error loading data from IndexedDB:', error);
      this.loadFromLocalStorage();
    }
  }

  // Get all MRI data from the database
  private getAllMriDataFromDb(db: IDBDatabase): Promise<MriData[]> {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('mri_data', 'readonly');
      const store = transaction.objectStore('mri_data');
      const request = store.getAll();
      
      request.onsuccess = () => {
        // Convert the ArrayBuffer data back to Float32Array
        const results = request.result || [];
        const convertedResults = results.map(mri => ({
          ...mri,
          data: mri.data instanceof Float32Array ? mri.data : Float32Array.from(mri.data)
        }));
        resolve(convertedResults);
      };
      
      request.onerror = (event) => {
        console.error('Error getting MRI data:', event);
        reject(event);
      };
    });
  }

  // Clean up failed or incomplete uploads
  private async cleanupFailedUploads(): Promise<void> {
    try {
      const db = await this.ensureDbInitialized();
      const transaction = db.transaction('mri_data', 'readwrite');
      const store = transaction.objectStore('mri_data');

      const mriData = await this.getAllMriDataFromDb(db);
      const now = Date.now();
      const ONE_HOUR = 60 * 60 * 1000;

      // Find and remove incomplete uploads (those without proper data)
      const incompleteUploads = mriData.filter(mri => {
        const isIncomplete = !mri.data || 
                           !mri.dimensions || 
                           !mri.slices ||
                           !Array.isArray(mri.dimensions) ||
                           mri.dimensions.length !== 3 ||
                           mri.data.length !== mri.dimensions[0] * mri.dimensions[1] * mri.dimensions[2];

        // Also check if it's a stale upload (older than 1 hour)
        const timestamp = parseInt(mri.id.split('_')[1]);
        const isStale = !isNaN(timestamp) && (now - timestamp) > ONE_HOUR;

        return isIncomplete || isStale;
      });

      // Remove incomplete uploads
      for (const mri of incompleteUploads) {
        await new Promise<void>((resolve, reject) => {
          const request = store.delete(mri.id);
          request.onsuccess = () => resolve();
          request.onerror = () => reject();
        });
        // Also remove from local cache
        this.mriData = this.mriData.filter(m => m.id !== mri.id);
      }

      if (incompleteUploads.length > 0) {
        console.log(`Cleaned up ${incompleteUploads.length} incomplete or stale MRI uploads`);
        // Update localStorage backup
        this.saveToLocalStorage();
      }

    } catch (error) {
      console.error('Error cleaning up failed uploads:', error);
    }
  }

  // Save MRI data for a patient with validation
  async saveMriForPatient(
    patientId: string, 
    name: string,
    data: Float32Array, 
    dimensions: [number, number, number],
    slices: { x: number, y: number, z: number }
  ): Promise<MriData> {
    try {
      // Run cleanup before saving new data
      await this.cleanupFailedUploads();
      
      // Validate input data
      if (!patientId || !name || !data || !dimensions || !slices) {
        throw new Error('Missing required data fields');
      }

      if (!Array.isArray(dimensions) || dimensions.length !== 3 || 
          !dimensions.every(d => Number.isInteger(d) && d > 0)) {
        throw new Error('Invalid dimensions');
      }

      if (!data.length || data.length !== dimensions[0] * dimensions[1] * dimensions[2]) {
        throw new Error('Data size does not match dimensions');
      }

      const id = `mri_${Date.now()}`;
      const date = new Date().toLocaleDateString('vi-VN');

      const mriScan: MriData = {
        id,
        patientId,
        name,
        date,
        data,
        dimensions,
        slices
      };

      const db = await this.ensureDbInitialized();
      const transaction = db.transaction('mri_data', 'readwrite');
      const store = transaction.objectStore('mri_data');

      // Save size information for validation
      const storageMriScan = {
        ...mriScan,
        data: Array.from(data),
        dataSize: data.length * 4 // Size in bytes (Float32 = 4 bytes)
      };

      await new Promise<void>((resolve, reject) => {
        const request = store.add(storageMriScan);
        
        request.onsuccess = () => resolve();
        
        request.onerror = (event) => {
          console.error('Error storing MRI data:', event);
          reject(new Error('Failed to store MRI data'));
        };
      });

      // Update local cache
      this.mriData.push(mriScan);

      // Try to save to localStorage as backup
      try {
        this.saveToLocalStorage();
      } catch (error) {
        console.warn('Failed to save backup to localStorage:', error);
      }

      return mriScan;

    } catch (error) {
      console.error('Error saving MRI data:', error);
      
      // Try to clean up any partial data that may have been saved
      try {
        await this.cleanupFailedUploads();
      } catch (cleanupError) {
        console.warn('Error during cleanup after failed save:', cleanupError);
      }
      
      throw new Error(error instanceof Error ? error.message : 'Failed to save MRI data');
    }
  }

  // Get all MRI data for a specific patient
  getMriDataForPatient(patientId: string): MriData[] {
    return this.mriData.filter(mri => mri.patientId === patientId);
  }

  // Get specific MRI data by ID
  getMriDataById(id: string): MriData | undefined {
    return this.mriData.find(mri => mri.id === id);
  }

  // Delete MRI data
  async deleteMriData(id: string): Promise<boolean> {
    try {
      const db = await this.ensureDbInitialized();
      const transaction = db.transaction('mri_data', 'readwrite');
      const store = transaction.objectStore('mri_data');
      
      await new Promise<void>((resolve, reject) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event);
      });
      
      // Update local cache
      this.mriData = this.mriData.filter(mri => mri.id !== id);
      
      // Fallback save to localStorage
      this.saveToLocalStorage();
      
      return true;
    } catch (error) {
      console.error('Error deleting MRI data:', error);
      
      // Fallback to localStorage only
      this.mriData = this.mriData.filter(mri => mri.id !== id);
      this.saveToLocalStorage();
      
      return true;
    }
  }

  // Save to localStorage as fallback
  private saveToLocalStorage(): void {
    // We need to serialize the data differently because Float32Array can't be JSON stringified directly
    const serializedData = this.mriData.map(mri => ({
      ...mri,
      data: Array.from(mri.data) // Convert Float32Array to regular array for storage
    }));
    
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(serializedData));
    } catch (error) {
      console.error('Error saving MRI data to localStorage:', error);
      // In case the data is too large for localStorage, we can keep it in memory
      // but inform the user that data will be lost on page refresh
      console.warn('MRI data is too large to save locally. Data will be kept in memory only.');
    }
  }

  // Load from localStorage as fallback
  private loadFromLocalStorage(): void {
    const savedData = localStorage.getItem(this.storageKey);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        // Convert regular arrays back to Float32Arrays
        this.mriData = parsedData.map((mri: any) => ({
          ...mri,
          data: Float32Array.from(mri.data)
        }));
      } catch (error) {
        console.error('Error loading MRI data from localStorage:', error);
        this.mriData = [];
      }
    }
  }
}

// Create singleton instance
const mriService = new MriService();
export default mriService;