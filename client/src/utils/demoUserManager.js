// Demo User Management Utilities
export class DemoUserManager {
  static STORAGE_KEY = 'demo_users';

  // Get all demo users
  static getAllUsers() {
    return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
  }

  // Check if a user exists
  static userExists(email) {
    const users = this.getAllUsers();
    return !!users[email];
  }

  // Get user count for demo mode info
  static getUserCount() {
    const users = this.getAllUsers();
    return Object.keys(users).length;
  }

  // Clear all demo users (for testing)
  static clearAllUsers() {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // Get user without password for safe display
  static getSafeUserInfo(email) {
    const users = this.getAllUsers();
    const user = users[email];
    if (user) {
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt
      };
    }
    return null;
  }

  // Validate email format
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate password strength
  static isValidPassword(password) {
    return password && password.length >= 6;
  }

  // Get demo status message
  static getDemoStatusMessage() {
    const userCount = this.getUserCount();
    if (userCount === 0) {
      return "No demo accounts created yet. You can sign up to create your first account!";
    } else {
      return `${userCount} demo account${userCount === 1 ? '' : 's'} created locally.`;
    }
  }
}

export default DemoUserManager; 