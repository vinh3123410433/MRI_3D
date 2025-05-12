// Authentication service using IndexedDB

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string; // In a real app, this would be properly hashed
  role: 'admin' | 'doctor' | 'nurse' | 'technician';
  createdAt: string;
  lastLogin?: string;
}

class AuthService {
  private dbName = 'mri_database';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  private currentUser: User | null = null;
  
  constructor() {
    this.initDatabase().catch(error => {
      console.error('Error initializing auth database:', error);
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
        this.checkAutoLogin();
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create users object store if it doesn't exist
        if (!db.objectStoreNames.contains('users')) {
          const userStore = db.createObjectStore('users', { keyPath: 'id' });
          userStore.createIndex('email', 'email', { unique: true });
          userStore.createIndex('username', 'username', { unique: true });
        }
        
        // Create sessions store
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
          sessionStore.createIndex('userId', 'userId', { unique: true });
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
  
  // Check for auto login from saved session
  private async checkAutoLogin(): Promise<void> {
    try {
      const db = await this.ensureDbInitialized();
      
      const transaction = db.transaction('sessions', 'readonly');
      const store = transaction.objectStore('sessions');
      const request = store.get('current_session');
      
      request.onsuccess = async () => {
        if (request.result) {
          const { userId, expiry } = request.result;
          
          // Check if session is expired
          if (new Date(expiry) > new Date()) {
            // Valid session, get user
            const user = await this.getUserById(userId);
            if (user) {
              this.currentUser = user;
              // Update last login
              user.lastLogin = new Date().toISOString();
              await this.updateUser(user);
            }
          } else {
            // Expired session, remove it
            await this.clearSession();
          }
        }
      };
    } catch (error) {
      console.error('Error during auto login:', error);
    }
  }
  
  // Get user by ID
  private async getUserById(id: string): Promise<User | null> {
    const db = await this.ensureDbInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('users', 'readonly');
      const store = transaction.objectStore('users');
      const request = store.get(id);
      
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      
      request.onerror = (event) => {
        console.error('Error getting user by ID:', event);
        reject(event);
      };
    });
  }
  
  // Get user by email
  private async getUserByEmail(email: string): Promise<User | null> {
    const db = await this.ensureDbInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('users', 'readonly');
      const store = transaction.objectStore('users');
      const index = store.index('email');
      const request = index.get(email);
      
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      
      request.onerror = (event) => {
        console.error('Error getting user by email:', event);
        reject(event);
      };
    });
  }
  
  // Update user
  private async updateUser(user: User): Promise<User> {
    const db = await this.ensureDbInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('users', 'readwrite');
      const store = transaction.objectStore('users');
      const request = store.put(user);
      
      request.onsuccess = () => {
        resolve(user);
      };
      
      request.onerror = (event) => {
        console.error('Error updating user:', event);
        reject(event);
      };
    });
  }
  
  // Save session
  private async saveSession(userId: string): Promise<void> {
    const db = await this.ensureDbInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('sessions', 'readwrite');
      const store = transaction.objectStore('sessions');
      
      // Create session that expires in 7 days
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7);
      
      const session = {
        id: 'current_session',
        userId,
        expiry: expiryDate.toISOString()
      };
      
      const request = store.put(session);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = (event) => {
        console.error('Error saving session:', event);
        reject(event);
      };
    });
  }
  
  // Clear session
  private async clearSession(): Promise<void> {
    const db = await this.ensureDbInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('sessions', 'readwrite');
      const store = transaction.objectStore('sessions');
      const request = store.delete('current_session');
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = (event) => {
        console.error('Error clearing session:', event);
        reject(event);
      };
    });
  }
  
  // Register a new user
  async registerUser(username: string, email: string, password: string, role: 'admin' | 'doctor' | 'nurse' | 'technician'): Promise<User> {
    // Check if email is already registered
    const existingUser = await this.getUserByEmail(email);
    if (existingUser) {
      throw new Error('Email is already registered');
    }
    
    // In a real app, you'd properly hash the password
    const passwordHash = password; // FIXME: This should be properly hashed in production
    
    const user: User = {
      id: `user_${Date.now()}`,
      username,
      email,
      passwordHash,
      role,
      createdAt: new Date().toISOString(),
    };
    
    const db = await this.ensureDbInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('users', 'readwrite');
      const store = transaction.objectStore('users');
      const request = store.add(user);
      
      request.onsuccess = () => {
        resolve(user);
      };
      
      request.onerror = (event) => {
        console.error('Error registering user:', event);
        reject(new Error('Username or email already exists'));
      };
    });
  }
  
  // Login user
  async login(email: string, password: string): Promise<User> {
    const user = await this.getUserByEmail(email);
    
    if (!user) {
      throw new Error('Invalid email or password');
    }
    
    // In a real app, you'd properly compare the hashed password
    if (user.passwordHash !== password) {
      throw new Error('Invalid email or password');
    }
    
    // Update last login
    user.lastLogin = new Date().toISOString();
    await this.updateUser(user);
    
    // Save session
    await this.saveSession(user.id);
    
    this.currentUser = user;
    return user;
  }
  
  // Logout user
  async logout(): Promise<void> {
    await this.clearSession();
    this.currentUser = null;
  }
  
  // Check if user is logged in
  isLoggedIn(): boolean {
    return this.currentUser !== null;
  }
  
  // Get current logged in user
  getCurrentUser(): User | null {
    return this.currentUser;
  }
  
  // Check if user has specific role
  hasRole(role: 'admin' | 'doctor' | 'nurse' | 'technician'): boolean {
    return this.currentUser?.role === role;
  }
}

// Create singleton instance
const authService = new AuthService();
export default authService;