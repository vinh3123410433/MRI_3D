// Patient data service using IndexedDB for storage

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
  private dbName = 'mri_database';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  private patients: Patient[] = [];
  private patientsStorageKey = 'patients';
  
  constructor() {
    this.initDatabase().catch(error => {
      console.error('Error initializing patient database:', error);
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
        
        // Create patients store if it doesn't exist
        if (!db.objectStoreNames.contains('patients')) {
          const store = db.createObjectStore('patients', { keyPath: 'id' });
          store.createIndex('name', 'name', { unique: false });
          store.createIndex('phone', 'phone', { unique: false });
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
      this.patients = await this.getAllPatientsFromDb(db);
    } catch (error) {
      console.error('Error loading data from IndexedDB:', error);
      this.loadFromLocalStorage();
    }
  }
  
  // Get all patients from the database
  private getAllPatientsFromDb(db: IDBDatabase): Promise<Patient[]> {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('patients', 'readonly');
      const store = transaction.objectStore('patients');
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      
      request.onerror = (event) => {
        console.error('Error getting patients:', event);
        reject(event);
      };
    });
  }
  
  // Fallback to localStorage if IndexedDB fails
  private loadFromLocalStorage(): void {
    try {
      const data = localStorage.getItem(this.patientsStorageKey);
      if (data) {
        this.patients = JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      this.patients = [];
    }
  }
  
  // Save to localStorage as fallback
  private saveToLocalStorage(): void {
    try {
      localStorage.setItem(this.patientsStorageKey, JSON.stringify(this.patients));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }
  
  // Public methods
  
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
    if (!query) return this.getAllPatients();
    
    const lowercaseQuery = query.toLowerCase();
    return this.patients.filter(
      patient => 
        patient.name.toLowerCase().includes(lowercaseQuery) ||
        patient.phone.includes(lowercaseQuery)
    );
  }
  
  // Add a new patient
  async addPatient(patient: Partial<Patient>): Promise<Patient> {
    try {
      // Ensure all required fields are present
      const newPatient: Patient = {
        id: patient.id || `patient_${Date.now()}`,
        name: patient.name || '',
        phone: patient.phone || '',
        condition: patient.condition || '',
        nextAppointment: patient.nextAppointment || '',
        birthDate: patient.birthDate || '',
        gender: patient.gender || '',
        medical_history: patient.medical_history || '',
        email: patient.email,
        address: patient.address
      };
      
      try {
        // Store in IndexedDB
        const db = await this.ensureDbInitialized();
        const transaction = db.transaction('patients', 'readwrite');
        const store = transaction.objectStore('patients');
        
        await new Promise<void>((resolve, reject) => {
          const request = store.add(newPatient);
          request.onsuccess = () => resolve();
          request.onerror = (event) => reject(event);
        });
        
        // Update local cache
        this.patients.push(newPatient);
        
        // Fallback save to localStorage
        this.saveToLocalStorage();
      } catch (dbError) {
        console.error('IndexedDB error, falling back to localStorage:', dbError);
        // Update local cache
        this.patients.push(newPatient);
        
        // Fallback save to localStorage
        this.saveToLocalStorage();
      }
      
      return newPatient;
    } catch (error) {
      console.error('Error adding patient:', error);
      
      // If all else fails, create a patient with the minimal required data
      const newPatient: Patient = {
        id: patient.id || `patient_${Date.now()}`,
        name: patient.name || '',
        phone: patient.phone || '',
        condition: patient.condition || '',
        nextAppointment: patient.nextAppointment || '',
        birthDate: patient.birthDate || '',
        gender: patient.gender || '',
        medical_history: patient.medical_history || '',
        email: patient.email,
        address: patient.address
      };
      
      this.patients.push(newPatient);
      this.saveToLocalStorage();
      
      return newPatient;
    }
  }
  
  // Update an existing patient
  async updatePatient(patient: Patient): Promise<Patient> {
    try {
      const db = await this.ensureDbInitialized();
      const transaction = db.transaction('patients', 'readwrite');
      const store = transaction.objectStore('patients');
      
      await new Promise<void>((resolve, reject) => {
        const request = store.put(patient);
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event);
      });
      
      // Update local cache
      const index = this.patients.findIndex(p => p.id === patient.id);
      if (index >= 0) {
        this.patients[index] = patient;
      } else {
        this.patients.push(patient);
      }
      
      // Fallback save to localStorage
      this.saveToLocalStorage();
      
      return patient;
    } catch (error) {
      console.error('Error updating patient:', error);
      
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
    try {
      const db = await this.ensureDbInitialized();
      const transaction = db.transaction('patients', 'readwrite');
      const store = transaction.objectStore('patients');
      
      await new Promise<void>((resolve, reject) => {
        const request = store.delete(patientId);
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event);
      });
      
      // Update local cache
      this.patients = this.patients.filter(p => p.id !== patientId);
      
      // Fallback save to localStorage
      this.saveToLocalStorage();
      
      return true;
    } catch (error) {
      console.error('Error deleting patient:', error);
      
      // If IndexedDB fails, continue with localStorage only
      this.patients = this.patients.filter(p => p.id !== patientId);
      this.saveToLocalStorage();
      
      return true;
    }
  }
  
  // Import patients from JSON
  async importPatients(patientsData: Patient[]): Promise<number> {
    try {
      const db = await this.ensureDbInitialized();
      const transaction = db.transaction('patients', 'readwrite');
      const store = transaction.objectStore('patients');
      
      let importCount = 0;
      
      for (const patient of patientsData) {
        // Generate ID if not present
        if (!patient.id) {
          patient.id = `patient_${Date.now()}_${importCount}`;
        }
        
        await new Promise<void>((resolve, reject) => {
          const request = store.put(patient);
          request.onsuccess = () => {
            importCount++;
            resolve();
          };
          request.onerror = (event) => reject(event);
        });
      }
      
      // Reload data to update local cache
      await this.loadData();
      
      return importCount;
    } catch (error) {
      console.error('Error importing patients:', error);
      
      // Fallback to localStorage if IndexedDB fails
      let importCount = 0;
      
      for (const patient of patientsData) {
        // Generate ID if not present
        if (!patient.id) {
          patient.id = `patient_${Date.now()}_${importCount}`;
        }
        
        // Check if patient already exists
        const index = this.patients.findIndex(p => p.id === patient.id);
        if (index >= 0) {
          this.patients[index] = patient;
        } else {
          this.patients.push(patient);
        }
        
        importCount++;
      }
      
      this.saveToLocalStorage();
      
      return importCount;
    }
  }
  
  // Save MRI file for a patient
  async saveMriFile(patientId: string, mriFile: File): Promise<string> {
    try {
      // Create a unique identifier for the MRI file
      const mriId = `mri_${Date.now()}`;
      
      // Read the file as an ArrayBuffer
      const fileData = await this.readFileAsArrayBuffer(mriFile);
      
      // Store the file in IndexedDB
      const db = await this.ensureDbInitialized();
      
      // Make sure the mri_files store exists
      if (!db.objectStoreNames.contains('mri_files')) {
        // Close the database and upgrade its version to add the new store
        db.close();
        
        await new Promise<void>((resolve, reject) => {
          const request = indexedDB.open(this.dbName, this.dbVersion + 1);
          
          request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains('mri_files')) {
              db.createObjectStore('mri_files', { keyPath: 'id' });
            }
          };
          
          request.onsuccess = () => {
            this.db = request.result;
            this.dbVersion++;
            resolve();
          };
          
          request.onerror = () => reject(new Error('Failed to upgrade database'));
        });
      }
      
      // Now store the MRI file
      const transaction = this.db!.transaction('mri_files', 'readwrite');
      const store = transaction.objectStore('mri_files');
      
      await new Promise<void>((resolve, reject) => {
        const request = store.add({
          id: mriId,
          patientId,
          filename: mriFile.name,
          data: fileData,
          timestamp: Date.now()
        });
        
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event);
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
        resolve(reader.result as ArrayBuffer);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  }
  
  // Get MRI file by ID
  async getMriFile(mriId: string): Promise<{ id: string, patientId: string, filename: string, data: ArrayBuffer, timestamp: number } | null> {
    try {
      const db = await this.ensureDbInitialized();
      
      // Check if the mri_files store exists
      if (!db.objectStoreNames.contains('mri_files')) {
        return null;
      }
      
      const transaction = db.transaction('mri_files', 'readonly');
      const store = transaction.objectStore('mri_files');
      
      return new Promise((resolve, reject) => {
        const request = store.get(mriId);
        
        request.onsuccess = () => {
          resolve(request.result || null);
        };
        
        request.onerror = (event) => {
          console.error('Error getting MRI file:', event);
          reject(new Error('Failed to get MRI file'));
        };
      });
    } catch (error) {
      console.error('Error retrieving MRI file:', error);
      return null;
    }
  }
  
  // Get all MRI files for a patient
  async getPatientMriFiles(patientId: string): Promise<{ id: string, filename: string, timestamp: number }[]> {
    try {
      const db = await this.ensureDbInitialized();
      
      // Check if the mri_files store exists
      if (!db.objectStoreNames.contains('mri_files')) {
        return [];
      }
      
      const transaction = db.transaction('mri_files', 'readonly');
      const store = transaction.objectStore('mri_files');
      const request = store.getAll();
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const allFiles = request.result || [];
          const patientFiles = allFiles
            .filter(file => file.patientId === patientId)
            .map(({ id, filename, timestamp }) => ({ id, filename, timestamp }));
          
          resolve(patientFiles);
        };
        
        request.onerror = (event) => {
          console.error('Error getting patient MRI files:', event);
          reject(new Error('Failed to get patient MRI files'));
        };
      });
    } catch (error) {
      console.error('Error retrieving patient MRI files:', error);
      return [];
    }
  }
}

// Create singleton instance
const patientService = new PatientService();
export default patientService;