// Appointment data service using IndexedDB for storage
import dbManager from './DatabaseManager';

export interface Appointment {
  id: string;
  title: string;
  start: string; // ISO date string
  end?: string; // ISO date string
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
  private appointments: Appointment[] = [];
  private dateNotes: DateNote[] = [];
  private appointmentsStorageKey = 'appointments';
  private dateNotesStorageKey = 'date_notes';
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
        console.error('Error initializing appointment service:', error);
        // Fallback to localStorage if IndexedDB fails
        this.loadFromLocalStorage();
      });
    }
    
    return this.initPromise;
  }
  
  // Load data from IndexedDB
  private async loadData(): Promise<void> {
    try {
      // Load appointments
      this.appointments = await dbManager.getAll<Appointment>('appointments');
      
      // Load date notes
      this.dateNotes = await dbManager.getAll<DateNote>('date_notes');
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Error loading data from IndexedDB:', error);
      this.loadFromLocalStorage();
    }
  }
  
  // Load from localStorage as fallback
  private loadFromLocalStorage(): void {
    try {
      // Load appointments
      const appointmentsData = localStorage.getItem(this.appointmentsStorageKey);
      if (appointmentsData) {
        this.appointments = JSON.parse(appointmentsData);
      }
      
      // Load date notes
      const dateNotesData = localStorage.getItem(this.dateNotesStorageKey);
      if (dateNotesData) {
        this.dateNotes = JSON.parse(dateNotesData);
      }
    } catch (error) {
      console.error('Error loading appointment data from localStorage:', error);
      this.appointments = [];
      this.dateNotes = [];
    }
  }
  
  // Save to localStorage as fallback
  private saveAppointmentsToLocalStorage(): void {
    try {
      localStorage.setItem(this.appointmentsStorageKey, JSON.stringify(this.appointments));
    } catch (error) {
      console.error('Error saving appointments to localStorage:', error);
    }
  }
  
  private saveDateNotesToLocalStorage(): void {
    try {
      localStorage.setItem(this.dateNotesStorageKey, JSON.stringify(this.dateNotes));
    } catch (error) {
      console.error('Error saving date notes to localStorage:', error);
    }
  }
  
  // Get all appointments
  async getAllAppointments(): Promise<Appointment[]> {
    await this.initialize();
    return [...this.appointments];
  }
  
  // Get appointment by ID
  async getAppointmentById(id: string): Promise<Appointment | undefined> {
    await this.initialize();
    return this.appointments.find(appointment => appointment.id === id);
  }
  
  // Get appointments for a specific patient
  async getAppointmentsByPatientId(patientId: string): Promise<Appointment[]> {
    await this.initialize();
    return this.appointments.filter(appointment => appointment.patient.id === patientId);
  }
  
  // Get appointments for a date range
  async getAppointmentsForDateRange(start: Date, end: Date): Promise<Appointment[]> {
    await this.initialize();
    
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];
    
    return this.appointments.filter(appointment => {
      const appointmentDate = appointment.start.split('T')[0];
      return appointmentDate >= startStr && appointmentDate <= endStr;
    });
  }
  
  // Add a new appointment
  async addAppointment(appointmentData: Omit<Appointment, 'id'>): Promise<Appointment> {
    await this.initialize();
    
    const newAppointment: Appointment = {
      ...appointmentData,
      id: `apt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    };
    
    try {
      await dbManager.add('appointments', newAppointment);
      
      // Update local cache
      this.appointments.push(newAppointment);
      this.saveAppointmentsToLocalStorage();
      
      return newAppointment;
    } catch (error) {
      console.error('IndexedDB error, falling back to localStorage:', error);
      
      // Fallback save to localStorage
      this.appointments.push(newAppointment);
      this.saveAppointmentsToLocalStorage();
      
      return newAppointment;
    }
  }
  
  // Update an existing appointment
  async updateAppointment(appointment: Appointment): Promise<Appointment> {
    await this.initialize();
    
    try {
      await dbManager.put('appointments', appointment);
      
      // Update local cache
      const index = this.appointments.findIndex(a => a.id === appointment.id);
      if (index >= 0) {
        this.appointments[index] = appointment;
      } else {
        this.appointments.push(appointment);
      }
      this.saveAppointmentsToLocalStorage();
      
      return appointment;
    } catch (error) {
      console.error('IndexedDB error, falling back to localStorage:', error);
      
      // If IndexedDB fails, continue with localStorage only
      const index = this.appointments.findIndex(a => a.id === appointment.id);
      if (index >= 0) {
        this.appointments[index] = appointment;
      } else {
        this.appointments.push(appointment);
      }
      this.saveAppointmentsToLocalStorage();
      
      return appointment;
    }
  }
  
  // Delete an appointment
  async deleteAppointment(appointmentId: string): Promise<boolean> {
    await this.initialize();
    
    try {
      await dbManager.delete('appointments', appointmentId);
      
      // Update local cache
      this.appointments = this.appointments.filter(a => a.id !== appointmentId);
      this.saveAppointmentsToLocalStorage();
      
      return true;
    } catch (error) {
      console.error('IndexedDB error, falling back to localStorage:', error);
      
      // Fallback delete from localStorage
      this.appointments = this.appointments.filter(a => a.id !== appointmentId);
      this.saveAppointmentsToLocalStorage();
      
      return true;
    }
  }
  
  // Get all date notes
  async getAllDateNotes(): Promise<DateNote[]> {
    await this.initialize();
    return [...this.dateNotes];
  }
  
  // Get a specific date note
  async getDateNote(date: string): Promise<DateNote | undefined> {
    await this.initialize();
    return this.dateNotes.find(note => note.date === date);
  }
  
  // Save a date note
  async saveDateNote(date: string, note: string): Promise<DateNote> {
    await this.initialize();
    
    const dateNote: DateNote = { date, note };
    
    try {
      await dbManager.put('date_notes', dateNote);
      
      // Update local cache
      const index = this.dateNotes.findIndex(n => n.date === date);
      if (index >= 0) {
        this.dateNotes[index] = dateNote;
      } else {
        this.dateNotes.push(dateNote);
      }
      this.saveDateNotesToLocalStorage();
      
      return dateNote;
    } catch (error) {
      console.error('Error saving date note:', error);
      
      // Fallback to localStorage
      const index = this.dateNotes.findIndex(n => n.date === date);
      if (index >= 0) {
        this.dateNotes[index] = dateNote;
      } else {
        this.dateNotes.push(dateNote);
      }
      this.saveDateNotesToLocalStorage();
      
      return dateNote;
    }
  }
  
  // Delete a date note
  async deleteDateNote(date: string): Promise<boolean> {
    await this.initialize();
    
    try {
      await dbManager.delete('date_notes', date);
      
      // Update local cache
      this.dateNotes = this.dateNotes.filter(n => n.date !== date);
      this.saveDateNotesToLocalStorage();
      
      return true;
    } catch (error) {
      console.error('IndexedDB error, falling back to localStorage:', error);
      
      // Fallback delete from localStorage
      this.dateNotes = this.dateNotes.filter(n => n.date !== date);
      this.saveDateNotesToLocalStorage();
      
      return true;
    }
  }
  
  // Check if a time slot has a conflict with existing appointments
  hasTimeConflict(startTime: Date, endTime: Date, excludeAppointmentId?: string): boolean {
    // Convert to timestamps for easier comparison
    const startTimestamp = startTime.getTime();
    const endTimestamp = endTime.getTime();
    
    return this.appointments.some(appointment => {
      // Skip the appointment with excludeAppointmentId if provided
      if (excludeAppointmentId && appointment.id === excludeAppointmentId) {
        return false;
      }
      
      // Get the existing appointment start and end times
      const existingStart = new Date(appointment.start).getTime();
      const existingEnd = appointment.end 
        ? new Date(appointment.end).getTime() 
        : existingStart + (60 * 60 * 1000); // Default to 1 hour if no end time
      
      // Check for overlap
      return (
        (startTimestamp >= existingStart && startTimestamp < existingEnd) || // New start time within existing appointment
        (endTimestamp > existingStart && endTimestamp <= existingEnd) || // New end time within existing appointment
        (startTimestamp <= existingStart && endTimestamp >= existingEnd) // New appointment completely covers existing one
      );
    });
  }
}

// Create singleton instance
const appointmentService = new AppointmentService();
export default appointmentService;
