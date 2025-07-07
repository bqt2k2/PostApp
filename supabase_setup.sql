-- =================================================================
-- POSTAPP - SUPABASE SETUP SCRIPT
-- =================================================================
-- Script này sẽ thiết lập toàn bộ backend cho PostApp trên Supabase
-- This script will set up the complete backend for PostApp on Supabase
-- 
-- Bao gồm / Includes:
-- 1. Database Schema (Users, Posts, Likes, Comments)
-- 2. Row Level Security (RLS) Policies
-- 3. Storage Setup cho Post Images / Storage Setup for Post Images
-- 4. Functions và Views / Functions and Views
-- =================================================================

-- -------------------------------
-- PHẦN 1: THIẾT LẬP CƠ BẢN
-- PART 1: BASIC SETUP
-- -------------------------------

-- Enable các extension cần thiết / Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "storage" SCHEMA extensions;

-- -------------------------------
-- PHẦN 2: TẠO BẢNG DỮ LIỆU
-- PART 2: CREATE TABLES
-- -------------------------------

-- Bảng users / Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR UNIQUE NOT NULL,
    full_name VARCHAR,
    avatar_url VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bảng posts / Posts table
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    image_url VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bảng likes / Likes table
CREATE TABLE IF NOT EXISTS likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Bảng comments / Comments table
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -------------------------------
-- PHẦN 3: TẠO INDEXES
-- PART 3: CREATE INDEXES
-- -------------------------------

-- Tạo indexes để tối ưu hiệu suất / Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);

-- -------------------------------
-- PHẦN 4: FUNCTIONS VÀ TRIGGERS
-- PART 4: FUNCTIONS AND TRIGGERS
-- -------------------------------

-- Function tự động cập nhật updated_at / Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tạo triggers cho updated_at / Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function lấy thống kê người dùng / Function to get user stats
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS TABLE(
    posts_count BIGINT,
    likes_received BIGINT,
    comments_received BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT p.id) as posts_count,
        COUNT(DISTINCT l.id) as likes_received,
        COUNT(DISTINCT c.id) as comments_received
    FROM users u
    LEFT JOIN posts p ON u.id = p.user_id
    LEFT JOIN likes l ON p.id = l.post_id
    LEFT JOIN comments c ON p.id = c.post_id
    WHERE u.id = user_uuid
    GROUP BY u.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -------------------------------
-- PHẦN 5: THIẾT LẬP STORAGE
-- PART 5: STORAGE SETUP
-- -------------------------------

-- Tạo bucket cho post images / Create bucket for post images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-images',
  'post-images', 
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Enable RLS cho storage.objects / Enable RLS for storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- -------------------------------
-- PHẦN 6: THIẾT LẬP RLS
-- PART 6: RLS SETUP
-- -------------------------------

-- Enable RLS cho các bảng / Enable RLS for tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- RLS cho bảng users / RLS for users table
CREATE POLICY "Users can view all users" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- RLS cho bảng posts / RLS for posts table
CREATE POLICY "Anyone can view posts" ON posts
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own posts" ON posts
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own posts" ON posts
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own posts" ON posts
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- RLS cho bảng likes / RLS for likes table
CREATE POLICY "Anyone can view likes" ON likes
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own likes" ON likes
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own likes" ON likes
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- RLS cho bảng comments / RLS for comments table
CREATE POLICY "Anyone can view comments" ON comments
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own comments" ON comments
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own comments" ON comments
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own comments" ON comments
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- RLS cho storage / RLS for storage
CREATE POLICY "Allow authenticated users to upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'post-images');

CREATE POLICY "Allow public to view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'post-images');

CREATE POLICY "Allow users to delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'post-images' AND auth.uid() = owner);

CREATE POLICY "Allow users to update their own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'post-images' AND auth.uid() = owner);

-- -------------------------------
-- PHẦN 7: VIEWS
-- PART 7: VIEWS
-- -------------------------------

-- View hiển thị posts với thống kê / View to display posts with stats
CREATE OR REPLACE VIEW posts_with_stats AS
SELECT 
    p.*,
    u.full_name as user_full_name,
    u.avatar_url as user_avatar_url,
    COUNT(DISTINCT l.id) as likes_count,
    COUNT(DISTINCT c.id) as comments_count,
    EXISTS(
        SELECT 1 FROM likes l2 
        WHERE l2.post_id = p.id 
        AND l2.user_id::text = auth.uid()::text
    ) as is_liked
FROM posts p
LEFT JOIN users u ON p.user_id = u.id
LEFT JOIN likes l ON p.id = l.post_id
LEFT JOIN comments c ON p.id = c.post_id
GROUP BY p.id, u.id, u.full_name, u.avatar_url
ORDER BY p.created_at DESC;

-- -------------------------------
-- PHẦN 8: PHÂN QUYỀN
-- PART 8: PERMISSIONS
-- -------------------------------

-- Cấp quyền cho users / Grant permissions to users
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT USAGE ON BUCKET post-images TO authenticated;
GRANT USAGE ON BUCKET post-images TO anon;

-- -------------------------------
-- PHẦN 9: KIỂM TRA THIẾT LẬP
-- PART 9: VERIFY SETUP
-- -------------------------------

-- Kiểm tra bucket / Check bucket setup
SELECT 
  'SUCCESS: Bucket created' as status,
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'post-images';

-- Kiểm tra policies / Check policies
SELECT 
  'SUCCESS: Policies created' as status,
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
AND policyname LIKE '%post-images%' OR policyname LIKE '%authenticated%' OR policyname LIKE '%public%';

-- -------------------------------
-- KẾT THÚC SCRIPT / END OF SCRIPT
-- ------------------------------- 