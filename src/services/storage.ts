import { supabase } from './supabase';
import { STORAGE_BUCKETS } from '../constants/supabase';
import * as FileSystem from 'expo-file-system';

class StorageService {
  async uploadPostImage(uri: string): Promise<{ url: string | null; error: Error | null }> {
    try {
      console.log('🚀 Bắt đầu upload ảnh...', { uri });

      // Tạo tên file unique
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const fileName = `post_${timestamp}_${random}.jpg`;

      console.log('📁 Tên file:', fileName);

      // Kiểm tra file tồn tại
      const fileInfo = await FileSystem.getInfoAsync(uri);
      console.log('📊 Thông tin file:', fileInfo);

      if (!fileInfo.exists) {
        throw new Error('File không tồn tại');
      }

      // Đọc file thành base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      console.log('📝 Đã đọc file, kích thước base64:', base64.length);

      // Chuyển base64 thành binary data
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);

      console.log('🔄 Đã chuyển đổi thành bytes, kích thước:', byteArray.length);

      // Upload lên Supabase với FormData
      console.log('⬆️ Đang upload lên Supabase Storage...');
      
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKETS.POST_IMAGES)
        .upload(fileName, byteArray, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('❌ Lỗi upload Supabase:', error);
        throw error;
      }

      console.log('✅ Upload thành công!', data);

      // Lấy public URL
      const { data: { publicUrl } } = supabase.storage
        .from(STORAGE_BUCKETS.POST_IMAGES)
        .getPublicUrl(fileName);

      console.log('🔗 Public URL:', publicUrl);

      return { url: publicUrl, error: null };
    } catch (error) {
      console.error('💥 Lỗi upload ảnh:', error);
      return { url: null, error: error as Error };
    }
  }

  async deletePostImage(url: string): Promise<{ error: Error | null }> {
    try {
      console.log('🗑️ Đang xóa ảnh...', { url });
      
      // Lấy tên file từ URL
      const fileName = url.split('/').pop();
      if (!fileName) {
        throw new Error('Không thể lấy tên file từ URL');
      }

      console.log('📁 Tên file cần xóa:', fileName);

      const { error } = await supabase.storage
        .from(STORAGE_BUCKETS.POST_IMAGES)
        .remove([fileName]);

      if (error) {
        console.error('❌ Lỗi xóa ảnh:', error);
        throw error;
      }

      console.log('✅ Xóa ảnh thành công!');
      return { error: null };
    } catch (error) {
      console.error('💥 Lỗi xóa ảnh:', error);
      return { error: error as Error };
    }
  }
}

export const storageService = new StorageService(); 