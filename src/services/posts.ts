import { supabase } from './supabase';
import { Post, Comment } from '../types';
import { TABLES } from '../constants/supabase';

class PostsService {
  async createPost(content: string, imageUrl?: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from(TABLES.POSTS)
        .insert({
          user_id: user.id,
          content,
          image_url: imageUrl,
        })
        .select(`
          *,
          user:${TABLES.USERS}(id, email, full_name, avatar_url)
        `)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async getPosts(page: number = 0, limit: number = 10) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const offset = page * limit;

      const { data, error } = await supabase
        .from(TABLES.POSTS)
        .select(`
          *,
          user:${TABLES.USERS}(id, email, full_name, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

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

      return { data: postsWithCounts, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async getPostById(postId: string) {
    try {
      const { data, error } = await supabase
        .from(TABLES.POSTS)
        .select(`
          *,
          user:users(id, email, full_name, avatar_url),
          likes_count:likes(count),
          comments_count:comments(count)
        `)
        .eq('id', postId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async updatePost(postId: string, updates: Partial<Post>) {
    try {
      const { data, error } = await supabase
        .from(TABLES.POSTS)
        .update(updates)
        .eq('id', postId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async deletePost(postId: string) {
    try {
      const { error } = await supabase
        .from(TABLES.POSTS)
        .delete()
        .eq('id', postId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async likePost(postId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from(TABLES.LIKES)
        .insert({
          post_id: postId,
          user_id: user.id,
        });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async unlikePost(postId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from(TABLES.LIKES)
        .delete()
        .match({ post_id: postId, user_id: user.id });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async isPostLiked(postId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from(TABLES.LIKES)
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    } catch (error) {
      return false;
    }
  }

  async getPostLikes(postId: string) {
    try {
      const { count, error } = await supabase
        .from(TABLES.LIKES)
        .select('id', { count: 'exact' })
        .eq('post_id', postId);

      if (error) throw error;
      return { count: count || 0, error: null };
    } catch (error) {
      return { count: 0, error: error as Error };
    }
  }

  async getComments(postId: string, page: number = 0, limit: number = 10) {
    try {
      const offset = page * limit;
      const { data, error } = await supabase
        .from(TABLES.COMMENTS)
        .select(`
          *,
          user:${TABLES.USERS}(id, email, full_name, avatar_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async createComment(postId: string, content: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from(TABLES.COMMENTS)
        .insert({
          post_id: postId,
          user_id: user.id,
          content,
        })
        .select(`
          *,
          user:${TABLES.USERS}(id, email, full_name, avatar_url)
        `)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }
}

export const postsService = new PostsService();
export default postsService; 