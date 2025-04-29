// MRI Data storage and management service

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
  
  constructor() {
    this.loadIndex();
  }
  
  // Save MRI data for a patient
  saveMriForPatient(
    patientId: string, 
    name: string,
    data: Float32Array, 
    dimensions: [number, number, number],
    slices: { x: number, y: number, z: number }
  ): MriData {
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
    
    // Store the MRI data
    this.mriData.push(mriScan);
    this.saveIndex();
    
    return mriScan;
  }
  
  // Get all MRI data for a specific patient
  getMriDataForPatient(patientId: string): MriData[] {
    return this.mriData.filter(mri => mri.patientId === patientId);
  }
  
  // Get specific MRI data by ID
  getMriDataById(id: string): MriData | undefined {
    return this.mriData.find(mri => mri.id === id);
  }
  
  // Save index to local storage
  private saveIndex() {
    // We need to serialize the data differently because Float32Array can't be JSON stringified directly
    const serializedData = this.mriData.map(mri => ({
      ...mri,
      data: Array.from(mri.data) // Convert Float32Array to regular array for storage
    }));
    
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(serializedData));
    } catch (error) {
      console.error('Error saving MRI data:', error);
      // In case the data is too large for localStorage, we can keep it in memory
      // but inform the user that data will be lost on page refresh
      alert('MRI data is too large to save locally. Data will be lost on page refresh.');
    }
  }
  
  // Load index from local storage
  private loadIndex() {
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
        console.error('Error loading MRI data:', error);
        this.mriData = [];
      }
    }
  }
}

// Create singleton instance
const mriService = new MriService();
export default mriService;