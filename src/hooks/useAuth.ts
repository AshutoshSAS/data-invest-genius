import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, db, Profile } from '@/lib/supabase';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      const profile = await db.profiles.get(userId);
      console.log('Profile found:', profile);
      setProfile(profile);
      return profile;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      
      // If profile doesn't exist, wait a bit and try again (trigger might be delayed)
      if (user) {
        console.log('Profile not found, waiting for trigger to create it...');
        setTimeout(async () => {
          try {
            const retryProfile = await db.profiles.get(userId);
            console.log('Profile found on retry:', retryProfile);
            setProfile(retryProfile);
            return retryProfile;
          } catch (retryError) {
            console.error('Profile still not found after retry:', retryError);
            setLoading(false);
            return null;
          }
        }, 2000); // Wait 2 seconds for trigger
      }
      return null;
    }
  };

  const refreshProfile = async () => {
    if (!user) return null;
    return await fetchUserProfile(user.id);
  };

  useEffect(() => {
    console.log('🔄 Starting auth flow...');

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        console.log('✅ User found, fetching profile...');
        fetchUserProfile(session.user.id);
      }
      
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('✅ Auth change - User found, fetching profile...');
          fetchUserProfile(session.user.id);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Add timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log('Auth loading timeout - forcing loading to false');
      setLoading(false);
    }, 10000); // 10 seconds timeout

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) throw new Error('No user logged in');
    
    try {
      const updatedProfile = await db.profiles.update(user.id, updates);
      setProfile(updatedProfile);
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const isAdmin = () => profile?.role === 'admin';
  const isAnalyst = () => profile?.role === 'analyst' || isAdmin();
  const isResearcher = () => profile?.role === 'researcher' || isAnalyst();
  const isViewer = () => profile?.role === 'viewer' || isResearcher();

  return {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshProfile,
    isAdmin,
    isAnalyst,
    isResearcher,
    isViewer
  };
}; 