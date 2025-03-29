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

  const login = async (userData) => {
    try {
      // Store the complete user data
      const userToStore = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        token: userData.token,
        isActive: userData.isActive
      };

      // Save to localStorage
      localStorage.setItem('currentUser', JSON.stringify(userToStore));
      
      // Update the user state
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
