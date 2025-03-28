import { createContext, useContext, useState, useEffect } from 'react';

// Create the context
const AuthContext = createContext(undefined);

// Create the provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('currentUser');
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find(u => u.email === credentials.email);

      if (!user) {
        throw new Error('User not found');
      }

      if (!user.isActive) {
        throw new Error('Account is deactivated. Please contact administrator.');
      }

      if (user.password !== credentials.password) {
        throw new Error('Invalid password');
      }

      const updatedUser = {
        ...user,
        lastLogin: new Date().toISOString()
      };

      const updatedUsers = users.map(u => 
        u.email === updatedUser.email ? updatedUser : u
      );
      localStorage.setItem('users', JSON.stringify(updatedUsers));

      const userToStore = {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
        lastLogin: updatedUser.lastLogin
      };

      localStorage.setItem('currentUser', JSON.stringify(userToStore));
      setUser(userToStore);
      return userToStore;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('currentUser');
    setUser(null);
  };

  const updateUser = (userData) => {
    try {
      const updatedUser = { ...user, ...userData };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      throw new Error('Failed to update user data');
    }
  };

  const checkAuth = () => !!user;

  const isAdmin = () => user?.role === 'admin';

  const value = {
    user,
    login,
    logout,
    updateUser,
    checkAuth,
    isAdmin,
    loading
  };

  if (loading) {
    return null;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Create the hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Default export
