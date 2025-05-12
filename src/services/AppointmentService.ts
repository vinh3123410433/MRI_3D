// Appointment data service using IndexedDB for storage

export interface Appointment {
  id: string;
  title: string;
  start: string;
  end?: string;
  patient: {
    id: string;
    name: string;
  };
  description?: string;
  doctorComment?: string;
  backgroundColor?: string;
}

export interface DateNote {
  date: string; // ISO string date format YYYY-MM-DD
  note: string;
}

class AppointmentService {
  private dbName = 'mri_database';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  private appointments: Appointment[] = [];
  private dateNotes: DateNote[] = [];
  private appointmentsStorageKey = 'appointments';
  private dateNotesStorageKey = 'date_notes';
  
  constructor() {
    this.initDatabase().catch(error => {
      console.error('Error initializing appointment database:', error);
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
        
        // Create appointments store if it doesn't exist
        if (!db.objectStoreNames.contains('appointments')) {
          db.createObjectStore('appointments', { keyPath: 'id' });
        }
        
        // Create date notes store if it doesn't exist
        if (!db.objectStoreNames.contains('date_notes')) {
          db.createObjectStore('date_notes', { keyPath: 'date' });
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
      
      // Load appointments
      this.appointments = await this.getAllAppointmentsFromDb(db);
      
      // Load date notes
      this.dateNotes = await this.getAllDateNotesFromDb(db);
    } catch (error) {
      console.error('Error loading data from IndexedDB:', error);
      this.loadFromLocalStorage();
    }
  }
  
  // Get all appointments from the database
  private getAllAppointmentsFromDb(db: IDBDatabase): Promise<Appointment[]> {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('appointments', 'readonly');
      const store = transaction.objectStore('appointments');
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      
      request.onerror = (event) => {
        console.error('Error getting appointments:', event);
        reject(event);
      };
    });
  }
  
  // Get all date notes from the database
  private getAllDateNotesFromDb(db: IDBDatabase): Promise<DateNote[]> {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('date_notes', 'readonly');
      const store = transaction.objectStore('date_notes');
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      
      request.onerror = (event) => {
        console.error('Error getting date notes:', event);
        reject(event);
      };
    });
  }
  
  // Fallback to localStorage if IndexedDB fails
  private loadFromLocalStorage(): void {
    try {
      const appointmentsData = localStorage.getItem(this.appointmentsStorageKey);
      if (appointmentsData) {
        this.appointments = JSON.parse(appointmentsData);
      }
      
      const dateNotesData = localStorage.getItem(this.dateNotesStorageKey);
      if (dateNotesData) {
        this.dateNotes = JSON.parse(dateNotesData);
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      // Initialize with empty arrays if loading fails
      this.appointments = [];
      this.dateNotes = [];
    }
  }
  
  // Save to localStorage as fallback
  private saveToLocalStorage(): void {
    try {
      localStorage.setItem(this.appointmentsStorageKey, JSON.stringify(this.appointments));
      localStorage.setItem(this.dateNotesStorageKey, JSON.stringify(this.dateNotes));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }
  
  // Public methods
  
  // Get all appointments (from memory cache)
  getAllAppointments(): Appointment[] {
    return [...this.appointments];
  }
  
  // Get all date notes (from memory cache)
  getAllDateNotes(): DateNote[] {
    return [...this.dateNotes];
  }
  
  // Add a new appointment
  async addAppointment(appointment: Appointment): Promise<Appointment> {
    try {
      const db = await this.ensureDbInitialized();
      
      // Ensure the appointment has an ID
      if (!appointment.id) {
        appointment.id = `appointment_${Date.now()}`;
      }
      
      // Store in IndexedDB
      const transaction = db.transaction('appointments', 'readwrite');
      const store = transaction.objectStore('appointments');
      await new Promise<void>((resolve, reject) => {
        const request = store.add(appointment);
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event);
      });
      
      // Update local cache
      this.appointments.push(appointment);
      
      // Fallback save to localStorage
      this.saveToLocalStorage();
      
      return appointment;
    } catch (error) {
      console.error('Error adding appointment:', error);
      
      // Fallback to localStorage only
      this.appointments.push(appointment);
      this.saveToLocalStorage();
      
      return appointment;
    }
  }
  
  // Update an existing appointment
  async updateAppointment(appointment: Appointment): Promise<Appointment> {
    try {
      const db = await this.ensureDbInitialized();
      
      // Store in IndexedDB
      const transaction = db.transaction('appointments', 'readwrite');
      const store = transaction.objectStore('appointments');
      await new Promise<void>((resolve, reject) => {
        const request = store.put(appointment);
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event);
      });
      
      // Update local cache
      const index = this.appointments.findIndex(apt => apt.id === appointment.id);
      if (index >= 0) {
        this.appointments[index] = appointment;
      } else {
        this.appointments.push(appointment);
      }
      
      // Fallback save to localStorage
      this.saveToLocalStorage();
      
      return appointment;
    } catch (error) {
      console.error('Error updating appointment:', error);
      
      // Fallback to localStorage only
      const index = this.appointments.findIndex(apt => apt.id === appointment.id);
      if (index >= 0) {
        this.appointments[index] = appointment;
      } else {
        this.appointments.push(appointment);
      }
      this.saveToLocalStorage();
      
      return appointment;
    }
  }
  
  // Delete an appointment
  async deleteAppointment(appointmentId: string): Promise<boolean> {
    try {
      const db = await this.ensureDbInitialized();
      
      // Delete from IndexedDB
      const transaction = db.transaction('appointments', 'readwrite');
      const store = transaction.objectStore('appointments');
      await new Promise<void>((resolve, reject) => {
        const request = store.delete(appointmentId);
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event);
      });
      
      // Update local cache
      this.appointments = this.appointments.filter(apt => apt.id !== appointmentId);
      
      // Fallback save to localStorage
      this.saveToLocalStorage();
      
      return true;
    } catch (error) {
      console.error('Error deleting appointment:', error);
      
      // Fallback to localStorage only
      this.appointments = this.appointments.filter(apt => apt.id !== appointmentId);
      this.saveToLocalStorage();
      
      return true;
    }
  }
  
  // Save a date note
  async saveDateNote(dateNote: DateNote): Promise<DateNote> {
    try {
      const db = await this.ensureDbInitialized();
      
      // Store in IndexedDB
      const transaction = db.transaction('date_notes', 'readwrite');
      const store = transaction.objectStore('date_notes');
      await new Promise<void>((resolve, reject) => {
        const request = store.put(dateNote);
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event);
      });
      
      // Update local cache
      const index = this.dateNotes.findIndex(note => note.date === dateNote.date);
      if (index >= 0) {
        this.dateNotes[index] = dateNote;
      } else {
        this.dateNotes.push(dateNote);
      }
      
      // Fallback save to localStorage
      this.saveToLocalStorage();
      
      return dateNote;
    } catch (error) {
      console.error('Error saving date note:', error);
      
      // Fallback to localStorage only
      const index = this.dateNotes.findIndex(note => note.date === dateNote.date);
      if (index >= 0) {
        this.dateNotes[index] = dateNote;
      } else {
        this.dateNotes.push(dateNote);
      }
      this.saveToLocalStorage();
      
      return dateNote;
    }
  }
  
  // Delete a date note
  async deleteDateNote(date: string): Promise<boolean> {
    try {
      const db = await this.ensureDbInitialized();
      
      // Delete from IndexedDB
      const transaction = db.transaction('date_notes', 'readwrite');
      const store = transaction.objectStore('date_notes');
      await new Promise<void>((resolve, reject) => {
        const request = store.delete(date);
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event);
      });
      
      // Update local cache
      this.dateNotes = this.dateNotes.filter(note => note.date !== date);
      
      // Fallback save to localStorage
      this.saveToLocalStorage();
      
      return true;
    } catch (error) {
      console.error('Error deleting date note:', error);
      
      // Fallback to localStorage only
      this.dateNotes = this.dateNotes.filter(note => note.date !== date);
      this.saveToLocalStorage();
      
      return true;
    }
  }
  
  // Check if a time slot has a conflict with existing appointments
  hasTimeConflict(startTime: Date, endTime: Date, excludeAppointmentId?: string): boolean {
    return this.appointments.some(appointment => {
      // Skip the appointment being updated
      if (excludeAppointmentId && appointment.id === excludeAppointmentId) {
        return false;
      }
      
      const appointmentStart = new Date(appointment.start);
      const appointmentEnd = appointment.end ? new Date(appointment.end) : new Date(appointmentStart.getTime() + 30 * 60000);
      
      // Check if the time slots overlap
      return (
        (startTime >= appointmentStart && startTime < appointmentEnd) ||
        (endTime > appointmentStart && endTime <= appointmentEnd) ||
        (startTime <= appointmentStart && endTime >= appointmentEnd)
      );
    });
  }
}

// Create singleton instance
const appointmentService = new AppointmentService();
export default appointmentService;