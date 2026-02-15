import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { INewUser } from '@/types';
import { useNavigate } from 'react-router-dom';


// -------------------- MUTATIONS --------------------

// Create a new user (sign up)
export const useCreateUserAccount = () => {
  return useMutation({
    mutationFn: async (user: INewUser) => {
      const { data, error } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          data: {
            name: user.name,
            username: user.username
          },
        },
      });
      if (error) throw error;
      return data;
    },
  });
};

// Sign in a user
export const useSignInAccount = () => {
  return useMutation({
    mutationFn: async (user: { email: string; password: string }) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: user.password,
      });
      if (error) throw error;
      return data.session;
    },
  });
};

// Sign out the current user
export const useSignOutAccount = () => {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/auth-select")
      return true;
    },
  });
};

// -------------------- QUERIES --------------------
