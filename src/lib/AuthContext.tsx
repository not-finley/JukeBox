import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { IUser, IContextType } from '@/types';
import LoaderMusic from '@/components/shared/loaderMusic';

export const INITIAL_USER: IUser = {
  accountId: '',
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
  setUser: () => { },
  setIsAuthenticated: () => { },
  checkAuthUser: async () => false,
  logout: async () => { },
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

        // Fetch additional info from users table
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("bio")
          .eq("user_id", u.id)
          .single();

        // follower and following counts 
        const { data: followersData, error: followersError } = await supabase
          .from("followers")
          .select("follower_id", { count: 'exact' })
          .eq("following_id", u.id);
          
        const { data: followingData, error: followingError } = await supabase
          .from("followers")
          .select("following_id", { count: 'exact' })
          .eq("follower_id", u.id);
        if (followersError) console.error("Error fetching followers count:", followersError);
        if (followingError) console.error("Error fetching following count:", followingError);
        
        const followersCount = followersData ? followersData.length : 0;
        const followingCount = followingData ? followingData.length : 0;


        const { data: signedData, error: signedError } = await supabase.storage
          .from("profiles")
          .createSignedUrl(`${u.id}/profile.jpg`, 60 * 60 * 2); // 2 hours

        if (signedError) {
          console.error("Error creating signed URL:", signedError);
        }

        if (userError) throw userError;

        setUser({
          accountId: u.id,
          name: u.user_metadata?.name ?? '',
          username: u.user_metadata?.username ?? '',
          email: u.email ?? '',
          imageUrl : signedData?.signedUrl ?? u.user_metadata?.imageUrl ?? '',
          bio: userData?.bio ?? u.user_metadata?.bio ?? '',
          followersCount,
          followingCount,
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
    return <div className='flex-center'><LoaderMusic /></div>;
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
