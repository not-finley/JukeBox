import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { IUser, IContextType } from '@/types';

export const INITIAL_USER: IUser = {
  id: '',
  name: '',
  username: '',
  email: '',
  imageUrl: '',
  bio: '',
};

const INITIAL_STATE: IContextType = {
  user: INITIAL_USER,
  isLoading: true,
  isAuthenticated: false,
  setUser: () => {},
  setIsAuthenticated: () => {},
  checkAuthUser: async () => false,
  logout: async () => {},
};

const AuthContext = createContext<IContextType>(INITIAL_STATE);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<IUser>(INITIAL_USER);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuthUser = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) throw error;

      if (session?.user) {
        const u = session.user;
        setUser({
          id: u.id,
          name: u.user_metadata?.name ?? '',
          username: u.user_metadata?.username ?? '',
          email: u.email ?? '',
          imageUrl: u.user_metadata?.imageUrl ?? '',
          bio: u.user_metadata?.bio ?? '',
        });
        setIsAuthenticated(true);
        return true;
      }

      setUser(INITIAL_USER);
      setIsAuthenticated(false);
      return false;
    } catch (err) {
      console.error('checkAuthUser error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(INITIAL_USER);
      setIsAuthenticated(false);
      navigate('/sign-in');
    } catch (err) {
      console.error('logout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Run once on mount
    checkAuthUser();

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAuthUser();
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isAuthenticated,
        setIsAuthenticated,
        isLoading,
        checkAuthUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

export const useUserContext = () => useContext(AuthContext);
