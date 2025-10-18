import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { INewUser } from '@/types';
import { QUERY_KEYS } from './queryKeys';

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
            username: user.username,
            bio: user.bio,
            imageUrl: user.imageUrl,
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
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return true;
    },
  });
};

// -------------------- QUERIES --------------------

// Example: get current user session
export const useGetCurrentUser = () => {
  return useQuery([QUERY_KEYS.GET_CURRENT_USER], async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error) throw error;
    return session?.user || null;
  });
};

// Example placeholder for a song query
export const useGetSongById = (songId: string) => {
  return useQuery([QUERY_KEYS.GET_SONG_BY_ID, songId], async () => {
    // Replace with your Supabase table query
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('id', songId)
      .single();
    if (error) throw error;
    return data;
  });
};