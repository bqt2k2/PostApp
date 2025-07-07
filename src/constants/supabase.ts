// Supabase configuration from environment variables
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://bgovcyyuppgbmueztjku.supabase.co';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnb3ZjeXl1cHBnYm11ZXp0amt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2OTU2NDcsImV4cCI6MjA2NzI3MTY0N30.MGgD0ceT0VCC1vLuXsdndSqEx9XKKdps68wqW4_JcKc';

// Database table names
export const TABLES = {
  USERS: 'users',
  POSTS: 'posts',
  COMMENTS: 'comments',
  LIKES: 'likes',
} as const;

// Storage buckets
export const STORAGE_BUCKETS = {
  AVATARS: 'avatars',
  POST_IMAGES: 'post-images',
} as const;

// Supabase configuration
export const SUPABASE_CONFIG = {
  URL: SUPABASE_URL,
  ANON_KEY: SUPABASE_ANON_KEY
} as const;  