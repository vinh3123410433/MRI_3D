// Patient data service using IndexedDB for storage
import dbManager from './DatabaseManager';

export interface Patient {
  id: string;
  name: string;
  phone: string;
  condition: string;
  nextAppointment: string;
  birthDate: string;
  gender: string;
  medical_history: string;
  email?: string;
  address?: string;
}

class PatientService {
  private patients: Patient[] = [];
  private patientsStorageKey = 'patients';
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
      this.initPromise = this.loadData().catch(error => {
        console.error('Error initializing patient service:', error);
        // Fallback to localStorage if IndexedDB fails
        this.loadFromLocalStorage();
      });
    }
    
    return this.initPromise;
  }
  
  // Load data from IndexedDB
  private async loadData(): Promise<void> {
    try {
      this.patients = await dbManager.getAll<Patient>('patients');
      this.isInitialized = true;
    } catch (error) {
      console.error('Error loading data from IndexedDB:', error);
      this.loadFromLocalStorage();
    }
  }
  
  // Load from localStorage as fallback
  private loadFromLocalStorage(): void {
    try {
      const data = localStorage.getItem(this.patientsStorageKey);
      if (data) {
        this.patients = JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading patient data from localStorage:', error);
      this.patients = [];
    }
  }
  
  // Save to localStorage as fallback
  private saveToLocalStorage(): void {
    try {
      localStorage.setItem(this.patientsStorageKey, JSON.stringify(this.patients));
    } catch (error) {
      console.error('Error saving patient data to localStorage:', error);
    }
  }
  
  // Get all patients
  getAllPatients(): Patient[] {
    return [...this.patients];
  }
  
  // Get patient by ID
  getPatientById(id: string): Patient | undefined {
    return this.patients.find(patient => patient.id === id);
  }
  
  // Search patients by name or phone
  searchPatients(query: string): Patient[] {
    const lowercaseQuery = query.toLowerCase();
    return this.patients.filter(
      patient => patient.name.toLowerCase().includes(lowercaseQuery) || 
                patient.phone.toLowerCase().includes(lowercaseQuery)
    );
  }
  
  // Add a new patient
  async addPatient(patientData: Omit<Patient, 'id'>): Promise<Patient> {
    await this.initialize();
    
    const newPatient: Patient = {
      ...patientData,
      id: `pat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    };
    
    try {
      await dbManager.add('patients', newPatient);
      
      // Update local cache
      this.patients.push(newPatient);
      this.saveToLocalStorage();
      
      return newPatient;
    } catch (error) {
      console.error('IndexedDB error, falling back to localStorage:', error);
      
      // Fallback save to localStorage
      this.patients.push(newPatient);
      this.saveToLocalStorage();
      
      return newPatient;
    }
  }
  
  // Update an existing patient
  async updatePatient(patient: Patient): Promise<Patient> {
    await this.initialize();
    
    try {
      await dbManager.put('patients', patient);
      
      // Update local cache
      const index = this.patients.findIndex(p => p.id === patient.id);
      if (index >= 0) {
        this.patients[index] = patient;
      } else {
        this.patients.push(patient);
      }
      this.saveToLocalStorage();
      
      return patient;
    } catch (error) {
      console.error('IndexedDB error, falling back to localStorage:', error);
      
      // If IndexedDB fails, continue with localStorage only
      const index = this.patients.findIndex(p => p.id === patient.id);
      if (index >= 0) {
        this.patients[index] = patient;
      } else {
        this.patients.push(patient);
      }
      this.saveToLocalStorage();
      
      return patient;
    }
  }
  
  // Delete a patient
  async deletePatient(patientId: string): Promise<boolean> {
    await this.initialize();
    
    try {
      await dbManager.delete('patients', patientId);
      
      // Update local cache
      this.patients = this.patients.filter(p => p.id !== patientId);
      this.saveToLocalStorage();
      
      return true;
    } catch (error) {
      console.error('IndexedDB error, falling back to localStorage:', error);
      
      // Fallback delete from localStorage
      this.patients = this.patients.filter(p => p.id !== patientId);
      this.saveToLocalStorage();
      
      return true;
    }
  }
  
  // Save MRI file for a patient
  async saveMriFile(patientId: string, mriFile: File): Promise<string> {
    await this.initialize();
    
    try {
      // Create a unique identifier for the MRI file
      const mriId = `mri_${Date.now()}`;
      
      // Read the file as an ArrayBuffer
      const fileData = await this.readFileAsArrayBuffer(mriFile);
      
      // Store the MRI file in the database
      await dbManager.add('mri_files', {
        id: mriId,
        patientId,
        filename: mriFile.name,
        data: fileData,
        timestamp: Date.now()
      });
      
      return mriId;
    } catch (error) {
      console.error('Error saving MRI file:', error);
      throw new Error('Failed to save MRI file');
    }
  }
  
  // Helper method to read a file as ArrayBuffer
  private readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read file as ArrayBuffer'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  }
  
  // Get MRI file by ID
  async getMriFile(mriId: string): Promise<{ id: string, patientId: string, filename: string, data: ArrayBuffer, timestamp: number } | null> {
    await this.initialize();
    
    try {
      return await dbManager.get('mri_files', mriId);
    } catch (error) {
      console.error('Error retrieving MRI file:', error);
      return null;
    }
  }
  
  // Get all MRI files for a patient
  async getPatientMriFiles(patientId: string): Promise<{ id: string, filename: string, timestamp: number }[]> {
    await this.initialize();
    
    try {
      const allFiles = await dbManager.getAll('mri_files');
        return allFiles
        .filter((file: any) => file.patientId === patientId)
        .map((file: any) => ({ 
          id: file.id, 
          filename: file.filename, 
          timestamp: file.timestamp 
        }));
    } catch (error) {
      console.error('Error retrieving patient MRI files:', error);
      return [];
    }
  }
}

// Create singleton instance
const patientService = new PatientService();
export default patientService;