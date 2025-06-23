export interface User {
  id: number;
  email: string;
  password: string;
  role: 'admin' | 'mitarbeiter';
  name: string;
  permissions: UserPermissions;
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
}

export interface UserPermissions {
  // Dashboard & Overview
  viewDashboard: boolean;
  viewStats: boolean;
  viewTagesinfo: boolean;
  
  // Cookie Management
  viewCookies: boolean;
  editCookies: boolean;
  addCookies: boolean;
  deleteCookies: boolean;
  
  // Daily Operations
  dailyTracking: boolean;
  production: boolean;
  
  // Inventory & Stock
  viewInventory: boolean;
  editInventory: boolean;
  performInventory: boolean;
  viewInventoryLog: boolean;
  
  // Ingredients
  viewIngredients: boolean;
  editIngredients: boolean;
  addIngredients: boolean;
  deleteIngredients: boolean;
  
  // Planning & Tasks
  viewTodos: boolean;
  editTodos: boolean;
  viewProductionPlanning: boolean;
  editProductionPlanning: boolean;
  
  // Recipes & Settings
  viewRecipes: boolean;
  editRecipes: boolean;
  viewSettings: boolean;
  editSettings: boolean;
  
  // User Management (Admin only)
  manageUsers: boolean;
  
  // Data & Reports
  exportData: boolean;
  viewReports: boolean;
  
  // Shopping & Procurement
  viewShoppingList: boolean;
  editShoppingList: boolean;
}

// Default permissions for admin
export const adminPermissions: UserPermissions = {
  viewDashboard: true,
  viewStats: true,
  viewTagesinfo: true,
  viewCookies: true,
  editCookies: true,
  addCookies: true,
  deleteCookies: true,
  dailyTracking: true,
  production: true,
  viewInventory: true,
  editInventory: true,
  performInventory: true,
  viewInventoryLog: true,
  viewIngredients: true,
  editIngredients: true,
  addIngredients: true,
  deleteIngredients: true,
  viewTodos: true,
  editTodos: true,
  viewProductionPlanning: true,
  editProductionPlanning: true,
  viewRecipes: true,
  editRecipes: true,
  viewSettings: true,
  editSettings: true,
  manageUsers: true,
  exportData: true,
  viewReports: true,
  viewShoppingList: true,
  editShoppingList: true,
};

// Default permissions for employee
export const employeePermissions: UserPermissions = {
  viewDashboard: true,
  viewStats: false,
  viewTagesinfo: true,
  viewCookies: true,
  editCookies: false,
  addCookies: false,
  deleteCookies: false,
  dailyTracking: true,
  production: true,
  viewInventory: true,
  editInventory: true,
  performInventory: true,
  viewInventoryLog: false,
  viewIngredients: true,
  editIngredients: true,
  addIngredients: false,
  deleteIngredients: false,
  viewTodos: true,
  editTodos: true,
  viewProductionPlanning: true,
  editProductionPlanning: false,
  viewRecipes: true,
  editRecipes: false,
  viewSettings: false,
  editSettings: false,
  manageUsers: false,
  exportData: false,
  viewReports: false,
  viewShoppingList: true,
  editShoppingList: false,
};

export const users: User[] = [
  { 
    id: 1,
    email: "admin@cookie.com", 
    password: "12345", 
    role: "admin",
    name: "Administrator",
    permissions: adminPermissions,
    createdAt: new Date().toISOString(),
    isActive: true
  }
];

// Helper functions
export const loadUsers = (): User[] => {
  try {
    const stored = localStorage.getItem('users');
    if (stored) {
      const parsedUsers = JSON.parse(stored);
      // Ensure all users have permissions (for backward compatibility)
      return parsedUsers.map((user: any) => ({
        ...user,
        permissions: user.permissions || (user.role === 'admin' ? adminPermissions : employeePermissions)
      }));
    }
    return users;
  } catch {
    return users;
  }
};

export const saveUsers = (userList: User[]) => {
  try {
    localStorage.setItem('users', JSON.stringify(userList));
  } catch (error) {
    console.error('Failed to save users:', error);
  }
};

export const authenticateUser = (loginCode: string): User | null => {
  const userList = loadUsers();
  const user = userList.find(u => u.password === loginCode && u.isActive);
  
  if (user) {
    // Update last login
    user.lastLogin = new Date().toISOString();
    const updatedUsers = userList.map(u => u.id === user.id ? user : u);
    saveUsers(updatedUsers);
    return user;
  }
  
  return null;
};

export const createUser = (userData: Omit<User, 'id' | 'createdAt'>): User => {
  const userList = loadUsers();
  const newUser: User = {
    ...userData,
    id: Math.max(...userList.map(u => u.id), 0) + 1,
    createdAt: new Date().toISOString()
  };
  
  const updatedUsers = [...userList, newUser];
  saveUsers(updatedUsers);
  return newUser;
};

export const updateUser = (userId: number, updates: Partial<User>): User | null => {
  const userList = loadUsers();
  const userIndex = userList.findIndex(u => u.id === userId);
  
  if (userIndex === -1) return null;
  
  const updatedUser = { ...userList[userIndex], ...updates };
  userList[userIndex] = updatedUser;
  saveUsers(userList);
  return updatedUser;
};

export const deleteUser = (userId: number): boolean => {
  const userList = loadUsers();
  const filteredUsers = userList.filter(u => u.id !== userId);
  
  if (filteredUsers.length === userList.length) return false;
  
  saveUsers(filteredUsers);
  return true;
};