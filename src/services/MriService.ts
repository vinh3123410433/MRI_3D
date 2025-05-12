// MRI Data storage and management service using IndexedDB
import dbManager from './DatabaseManager';

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

// Interface for storage format - Float32Array can't be stored directly in IndexedDB
interface StorageMriData {
  id: string;
  patientId: string;
  name: string;
  date: string;
  data: number[]; // Stored as regular array
  dimensions: [number, number, number];
  slices: {
    x: number;
    y: number;
    z: number;
  };
  dataSize: number; // Size in bytes
}

class MriService {
  private mriData: MriData[] = [];
  private storageKey = 'mri_data_index';
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.initialize();
  }
  // Initialize the service
  private initialize(): Promise<void> {
    if (this.isInitialized) {
      return Promise.resolve();
    }
    
    if (!this.initPromise) {
      this.initPromise = this.loadData()
        .then(() => {
          this.isInitialized = true;
        })
        .catch(error => {
          console.error('Error initializing MRI service:', error);
          // Fallback to localStorage if IndexedDB fails
          this.loadFromLocalStorage();
          this.isInitialized = true;
        });
    }
    
    return this.initPromise;
  }// Load data from IndexedDB
  private async loadData(): Promise<void> {
    try {
      console.log('Loading MRI data from IndexedDB...');
      
      // Get all MRI data from database
      const storageMriData = await dbManager.getAll<StorageMriData>('mri_data');
      console.log(`Found ${storageMriData.length} MRI records in database`);
      
      // Convert back to MriData with Float32Array
      const validMriData: MriData[] = [];
      
      for (const storedData of storageMriData) {
        try {
          // Make sure we have valid data to convert
          if (!storedData.data || !Array.isArray(storedData.data)) {
            console.warn(`Invalid MRI data found for ID ${storedData.id}, patientId: ${storedData.patientId}`);
            continue;
          }
          
          validMriData.push({
            id: storedData.id,
            patientId: storedData.patientId,
            name: storedData.name,
            date: storedData.date,
            data: Float32Array.from(storedData.data),
            dimensions: storedData.dimensions,
            slices: storedData.slices
          });
        } catch (err) {
          console.error(`Error processing MRI data for ID ${storedData.id}:`, err);
        }
      }
      
      this.mriData = validMriData;
      console.log(`Successfully loaded ${this.mriData.length} valid MRI records`);
      this.isInitialized = true;
    } catch (error) {
      console.error('Error loading MRI data from IndexedDB:', error);
      this.loadFromLocalStorage();
    }
  }

  // Clean up failed or incomplete uploads
  private async cleanupFailedUploads(): Promise<void> {
    try {
      const now = Date.now();
      const ONE_HOUR = 60 * 60 * 1000;
      
      // Get all MRI data from database
      const mriData = await dbManager.getAll<StorageMriData>('mri_data');

      // Find incomplete uploads (those without proper data)
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
        await dbManager.delete('mri_data', mri.id);
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
    await this.initialize();

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

      // Save size information for validation
      const storageMriScan: StorageMriData = {
        ...mriScan,
        data: Array.from(data),
        dataSize: data.length * 4 // Size in bytes (Float32 = 4 bytes)
      };

      await dbManager.add('mri_data', storageMriScan);

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
  async getMriDataForPatient(patientId: string): Promise<MriData[]> {
    try {
      await this.initialize();
      
      // Ensure we have the latest data by re-querying if needed
      if (!this.isInitialized || this.mriData.length === 0) {
        await this.loadData();
      }
      
      return this.mriData.filter(mri => mri.patientId === patientId);
    } catch (error) {
      console.error(`Error getting MRI data for patient ${patientId}:`, error);
      return [];
    }
  }

  // Get specific MRI data by ID
  async getMriDataById(id: string): Promise<MriData | undefined> {
    await this.initialize();
    return this.mriData.find(mri => mri.id === id);
  }

  // Delete MRI data
  async deleteMriData(id: string): Promise<boolean> {
    await this.initialize();
    
    try {
      await dbManager.delete('mri_data', id);
      
      // Update local cache
      this.mriData = this.mriData.filter(mri => mri.id !== id);
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