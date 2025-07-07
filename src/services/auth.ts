import { supabase, supabaseAdmin } from './supabase';
import { User, AuthState } from '../types';
import { TABLES } from '../constants/supabase';

class AuthService {
  async testConnection() {
    try {
      console.log('Testing Supabase connection...');
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select('count')
        .limit(1);

      if (error) {
        console.error('Connection test failed:', error);
        return false;
      }

      console.log('Connection test successful:', data);
      return true;
    } catch (error) {
      console.error('Connection test error:', error);
      return false;
    }
  }

  async createUserProfile(userId: string, email: string, fullName?: string) {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .insert([
          {
            id: userId,
            email: email,
            full_name: fullName,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Create user profile error:', error);
        throw error;
      }

      console.log('User profile created:', data);
      return { data, error: null };
    } catch (error) {
      console.error('Create user profile error:', error);
      return { data: null, error: error as Error };
    }
  }

  async signUp(email: string, password: string, fullName?: string) {
    try {
      // Only sign up with auth, don't create user profile yet
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (authError) {
        console.error('Auth signup error:', authError);
        throw authError;
      }

      console.log('Auth signup successful:', authData);
      return { data: authData, error: null };
    } catch (error) {
      console.error('SignUp error:', error);
      return { data: null, error: error as Error };
    }
  }

  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if user profile exists, if not create it
      if (data.user) {
        const { data: userData, error: userError } = await supabase
          .from(TABLES.USERS)
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (userError && userError.code === 'PGRST116') {
          // User profile doesn't exist, create it
          console.log('User profile not found, creating...');
          const { error: createError } = await this.createUserProfile(
            data.user.id,
            data.user.email || email,
            data.user.user_metadata?.full_name
          );

          if (createError) {
            console.error('Failed to create user profile:', createError);
            // Don't throw error, user can still login
          } else {
            console.log('User profile created successfully');
          }
        } else if (userError) {
          console.error('Error checking user profile:', userError);
        } else {
          console.log('User profile exists:', userData);
        }
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return { user, error: null };
    } catch (error) {
      return { user: null, error: error as Error };
    }
  }

  async updateProfile(updates: Partial<User>) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: updates,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  // Listen to auth changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}

export const authService = new AuthService();
export default authService; 