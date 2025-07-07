# PostApp - Ứng dụng Mạng Xã hội React Native

Một ứng dụng mạng xã hội hiện đại được xây dựng với React Native, Expo và Supabase.

## 🚀 Tính năng

- **Xác thực người dùng** - Đăng nhập và đăng ký với email/mật khẩu
- **Bảng tin mạng xã hội** - Xem và tương tác với bài viết của người dùng
- **Tạo bài viết** - Chia sẻ nội dung văn bản với hình ảnh
- **Hệ thống thích** - Thích và bỏ thích bài viết
- **Hồ sơ người dùng** - Xem hồ sơ người dùng và thống kê
- **Cài đặt** - Chuyển đổi chủ đề (Sáng/Tối) và lựa chọn ngôn ngữ
- **Giao diện hiện đại** - Thiết kế sạch sẽ, responsive với hoạt ảnh mượt mà

## 🛠️ Công nghệ sử dụng

- **React Native** - Framework di động đa nền tảng
- **Expo** - Nền tảng phát triển và công cụ build
- **TypeScript** - JavaScript với kiểu dữ liệu an toàn
- **React Navigation** - Navigation và routing
- **Supabase** - Backend as a Service (Xác thực, Cơ sở dữ liệu, Lưu trữ)
- **Vector Icons** - Thư viện biểu tượng cho React Native

## 📦 Cài đặt

### Yêu cầu

- Node.js (v16 hoặc cao hơn)
- npm hoặc yarn
- Expo CLI (`npm install -g expo-cli`)
- Tài khoản Supabase

### Thiết lập

1. **Clone repository**

   ```bash
   git clone https://github.com/bqt2k2/PostApp.git
   cd PostApp
   ```

2. **Cài đặt dependencies**

   ```bash
   npm install
   ```

3. **Cấu hình Supabase**

   - Tạo project mới tại [supabase.com](https://supabase.com)
   - Tạo file `.env` trong thư mục gốc của project:
     ```
     EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
     EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

4. **Thiết lập schema cơ sở dữ liệu**
   Chạy các lệnh SQL trong file `database.sql` trong Supabase SQL editor

5. **Khởi động server phát triển**
   ```bash
   npm start
   ```

## 🗄️ Schema Cơ sở dữ liệu

### Bảng Users

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  full_name VARCHAR,
  avatar_url VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Bảng Posts

```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Bảng Likes

```sql
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);
```

### Bảng Comments

```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 📱 Cấu trúc ứng dụng

```
src/
├── components/          # Các component UI có thể tái sử dụng
├── constants/          # Hằng số và cấu hình ứng dụng
├── navigation/         # Cấu hình navigation
├── screens/           # Các component màn hình
│   ├── auth/         # Màn hình xác thực
│   └── main/         # Màn hình chính của ứng dụng
├── services/         # API và dịch vụ bên ngoài
├── types/           # Định nghĩa kiểu TypeScript
└── utils/           # Các hàm tiện ích
```

## 🔧 Scripts có sẵn

- `npm start` - Khởi động Expo development server
- `npm run android` - Chạy trên thiết bị/emulator Android
- `npm run ios` - Chạy trên iOS simulator
- `npm run web` - Chạy trên trình duyệt web

## 🎨 Hệ thống Theme

Ứng dụng hỗ trợ cả theme sáng và tối:

- Theme sáng (mặc định)
- Theme tối
- Chuyển đổi theme tự động dựa trên tùy chọn hệ thống

## 🌐 Đa ngôn ngữ

Hiện tại hỗ trợ:

- Tiếng Việt (vi)
- Tiếng Anh (en)

## 🔒 Tính năng bảo mật

- Xác thực an toàn với Supabase Auth
- Bảo vệ routes và màn hình
- Xác thực và làm sạch input
- Giao tiếp API an toàn

## 🚀 Triển khai

### Android

```bash
expo build:android
```

### iOS

```bash
expo build:ios
```

### Web

```bash
expo build:web
```

## 📝 Đóng góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/amazing-feature`)
3. Commit các thay đổi (`git commit -m 'Add some amazing feature'`)
4. Push lên branch (`git push origin feature/amazing-feature`)
5. Mở Pull Request

## 📄 Giấy phép

Dự án này được cấp phép theo giấy phép MIT.

## 🙏 Lời cảm ơn

- Đội ngũ Expo cho nền tảng phát triển tuyệt vời
- Supabase cho cơ sở hạ tầng backend
- Cộng đồng React Native cho các thư viện xuất sắc

## 📞 Hỗ trợ

Để được hỗ trợ, email support@postapp.com hoặc tham gia cộng đồng Discord của chúng tôi.

## 🔄 Lịch sử phiên bản

- **v1.0.0** - Phiên bản đầu tiên với các tính năng cốt lõi
  - Xác thực người dùng
  - Tạo và xem bài viết
  - Hệ thống thích
  - Quản lý hồ sơ
  - Cài đặt và chuyển đổi theme
