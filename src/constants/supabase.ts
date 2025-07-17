// Supabase configuration from environment variables
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ;

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
