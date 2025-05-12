// Authentication service using DatabaseManager

import dbManager from './DatabaseManager';

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
  private initialized = false;
  private currentUser: User | null = null;
  
  constructor() {
    this.initialize().catch(error => {
      console.error('Error initializing auth service:', error);
    });
  }
  
  // Initialize the service
  private async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      await this.checkAutoLogin();
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize AuthService:', error);
      throw error;
    }
  }
  
  // Ensure service is initialized
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }
    // Check for auto login from saved session
  private async checkAutoLogin(): Promise<void> {
    try {
      const session = await dbManager.get<{id: string, userId: string, expiry: string}>('sessions', 'current_session');
      
      if (session) {
        const { userId, expiry } = session;
        
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
    } catch (error) {
      console.error('Error during auto login:', error);
    }
  }
    // Get user by ID
  private async getUserById(id: string): Promise<User | null> {
    try {
      await this.ensureInitialized();
      return await dbManager.get<User>('users', id);
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }
    // Get user by email
  private async getUserByEmail(email: string): Promise<User | null> {
    try {
      await this.ensureInitialized();
      
      // Since dbManager doesn't have a direct index query method,
      // we need to get all users and filter
      const users = await dbManager.getAll<User>('users');
      return users.find(user => user.email === email) || null;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  }
    // Update user
  private async updateUser(user: User): Promise<User> {
    try {
      await this.ensureInitialized();
      await dbManager.put('users', user);
      return user;
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Failed to update user');
    }
  }
    // Save session
  private async saveSession(userId: string): Promise<void> {
    try {
      await this.ensureInitialized();
      
      // Create session that expires in 7 days
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7);
      
      const session = {
        id: 'current_session',
        userId,
        expiry: expiryDate.toISOString()
      };
      
      await dbManager.put('sessions', session);
    } catch (error) {
      console.error('Error saving session:', error);
      throw new Error('Failed to save session');
    }
  }
    // Clear session
  private async clearSession(): Promise<void> {
    try {
      await this.ensureInitialized();
      await dbManager.delete('sessions', 'current_session');
    } catch (error) {
      console.error('Error clearing session:', error);
      // Don't throw here as we want logout to succeed even if session deletion fails
    }
  }
    // Register a new user
  async registerUser(username: string, email: string, password: string, role: 'admin' | 'doctor' | 'nurse' | 'technician'): Promise<User> {
    try {
      await this.ensureInitialized();
      
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
      
      await dbManager.add('users', user);
      return user;
    } catch (error) {
      console.error('Error registering user:', error);
      if (error instanceof Error) {
        throw error; // Rethrow the existing error
      } else {
        throw new Error('Username or email already exists');
      }
    }
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