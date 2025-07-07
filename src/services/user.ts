import { supabase } from './supabase';
import { TABLES } from '../constants/supabase';
import { User } from '../types';

export interface UserStats {
  posts_count: number;
  likes_received: number;
  comments_received: number;
}

export interface UserProfile extends User {
  stats?: UserStats;
}

class UserService {
  async getCurrentUserProfile(): Promise<{ data: UserProfile | null; error: Error | null }> {
    try {
      console.log('🔍 Đang lấy thông tin user hiện tại...');
      
      // Lấy user từ auth
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('❌ Lỗi auth:', authError);
        throw authError;
      }

      if (!authUser) {
        console.log('❌ Không có user đăng nhập');
        return { data: null, error: new Error('Không có user đăng nhập') };
      }

      console.log('✅ Auth user:', authUser.id);

      // Lấy thông tin user từ database
      const { data: userProfile, error: profileError } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileError) {
        console.error('❌ Lỗi lấy profile:', profileError);
        
        // Nếu user chưa có profile, tạo mới
        if (profileError.code === 'PGRST116') {
          console.log('🆕 Tạo profile mới cho user...');
          const { data: newProfile, error: createError } = await supabase
            .from(TABLES.USERS)
            .insert({
              id: authUser.id,
              email: authUser.email,
              full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0],
              avatar_url: null
            })
            .select()
            .single();

          if (createError) {
            console.error('❌ Lỗi tạo profile:', createError);
            throw createError;
          }

          console.log('✅ Đã tạo profile mới:', newProfile);
          return { data: newProfile, error: null };
        }
        
        throw profileError;
      }

      console.log('✅ Đã lấy profile:', userProfile);
      return { data: userProfile, error: null };
    } catch (error) {
      console.error('💥 Lỗi getCurrentUserProfile:', error);
      return { data: null, error: error as Error };
    }
  }

  async getUserStats(userId: string): Promise<{ data: UserStats | null; error: Error | null }> {
    try {
      console.log('📊 Đang lấy thống kê user:', userId);

      // Lấy số bài viết
      const { count: postsCount, error: postsError } = await supabase
        .from(TABLES.POSTS)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (postsError) {
        console.error('❌ Lỗi đếm posts:', postsError);
        throw postsError;
      }

      // Lấy số likes nhận được
      const { count: likesCount, error: likesError } = await supabase
        .from(TABLES.LIKES)
        .select('*, posts!inner(*)', { count: 'exact', head: true })
        .eq('posts.user_id', userId);

      if (likesError) {
        console.error('❌ Lỗi đếm likes:', likesError);
        throw likesError;
      }

      // Lấy số comments nhận được
      const { count: commentsCount, error: commentsError } = await supabase
        .from(TABLES.COMMENTS)
        .select('*, posts!inner(*)', { count: 'exact', head: true })
        .eq('posts.user_id', userId);

      if (commentsError) {
        console.error('❌ Lỗi đếm comments:', commentsError);
        throw commentsError;
      }

      const stats: UserStats = {
        posts_count: postsCount || 0,
        likes_received: likesCount || 0,
        comments_received: commentsCount || 0,
      };

      console.log('✅ Thống kê user:', stats);
      return { data: stats, error: null };
    } catch (error) {
      console.error('💥 Lỗi getUserStats:', error);
      return { data: null, error: error as Error };
    }
  }

  async getUserPosts(userId: string, page: number = 0, limit: number = 10): Promise<{ data: any[] | null; error: Error | null }> {
    try {
      console.log('📝 Đang lấy bài viết của user:', userId, 'trang:', page);
      
      const offset = page * limit;

      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from(TABLES.POSTS)
        .select(`
          *,
          user:${TABLES.USERS}(id, email, full_name, avatar_url)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('❌ Lỗi lấy posts:', error);
        throw error;
      }

      // Get likes and comments count for each post
      const postsWithCounts = await Promise.all(
        (data || []).map(async (post) => {
          const [likesResult, commentsResult, isLikedResult] = await Promise.all([
            supabase
              .from(TABLES.LIKES)
              .select('id', { count: 'exact' })
              .eq('post_id', post.id),
            supabase
              .from(TABLES.COMMENTS)
              .select('id', { count: 'exact' })
              .eq('post_id', post.id),
            user ? supabase
              .from(TABLES.LIKES)
              .select('id')
              .eq('post_id', post.id)
              .eq('user_id', user.id)
              .single() : Promise.resolve({ data: null, error: null })
          ]);

          return {
            ...post,
            likes_count: likesResult.count || 0,
            comments_count: commentsResult.count || 0,
            is_liked: !!isLikedResult.data,
          };
        })
      );

      console.log('✅ Đã lấy', postsWithCounts?.length || 0, 'bài viết');
      return { data: postsWithCounts || [], error: null };
    } catch (error) {
      console.error('💥 Lỗi getUserPosts:', error);
      return { data: null, error: error as Error };
    }
  }

  async updateProfile(updates: Partial<User>): Promise<{ data: User | null; error: Error | null }> {
    try {
      console.log('✏️ Đang cập nhật profile:', updates);

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        throw new Error('Không có user đăng nhập');
      }

      const { data, error } = await supabase
        .from(TABLES.USERS)
        .update(updates)
        .eq('id', authUser.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Lỗi cập nhật profile:', error);
        throw error;
      }

      console.log('✅ Đã cập nhật profile:', data);
      return { data, error: null };
    } catch (error) {
      console.error('💥 Lỗi updateProfile:', error);
      return { data: null, error: error as Error };
    }
  }
}

export const userService = new UserService(); 