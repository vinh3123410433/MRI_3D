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
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = (event) => {
        console.error('IndexedDB error:', event);
        reject('Failed to open database');
      };
      
      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        this.loadData();
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create mri_data store if it doesn't exist
        if (!db.objectStoreNames.contains('mri_data')) {
          const store = db.createObjectStore('mri_data', { keyPath: 'id' });
          store.createIndex('patientId', 'patientId', { unique: false });
        }
      };
    });
  }
  
  // Ensure database is initialized
  private async ensureDbInitialized(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initDatabase();
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
  
  // Save MRI data for a patient
  async saveMriForPatient(
    patientId: string, 
    name: string,
    data: Float32Array, 
    dimensions: [number, number, number],
    slices: { x: number, y: number, z: number }
  ): Promise<MriData> {
    // Generate a unique ID for this MRI scan
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
    
    try {
      // Store in IndexedDB
      const db = await this.ensureDbInitialized();
      const transaction = db.transaction('mri_data', 'readwrite');
      const store = transaction.objectStore('mri_data');
      
      // Convert Float32Array to regular array for storage
      const storageMriScan = {
        ...mriScan,
        data: Array.from(data)
      };
      
      await new Promise<void>((resolve, reject) => {
        const request = store.add(storageMriScan);
        request.onsuccess = () => resolve();
        request.onerror = (event) => {
          console.error('Error storing MRI data:', event);
          reject(event);
        };
      });
      
      // Update local cache
      this.mriData.push(mriScan);
      
      // Fallback save to localStorage
      this.saveToLocalStorage();
      
      return mriScan;
    } catch (error) {
      console.error('Error saving MRI data:', error);
      
      // Fallback to localStorage only
      this.mriData.push(mriScan);
      this.saveToLocalStorage();
      
      return mriScan;
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