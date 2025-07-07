# Image Loading Optimization Guide

## 📸 Tổng quan về Image Loading Strategies

Ứng dụng PostApp sử dụng nhiều chiến lược loading hình ảnh khác nhau để tối ưu hóa performance và user experience.

## 🚀 Các Component Image

### 1. **OptimizedImage** - Component cơ bản

- **Mục đích**: Tối ưu hóa cơ bản với retry logic và caching
- **Sử dụng**: Cho các hình ảnh cần load ngay lập tức
- **Tính năng**:
  - Image optimization với multiple sizes
  - Retry logic với exponential backoff
  - Memory và disk caching
  - Fade-in animation

### 2. **SmartImage** - Component thông minh

- **Mục đích**: Tự động chọn loading strategy dựa trên context
- **Sử dụng**: Cho hình ảnh trong bài posts
- **Tính năng**:
  - Auto loading strategy detection
  - Intersection observer simulation
  - Priority-based loading
  - Adaptive lazy loading

### 3. **LazyImage** - Component lazy loading thuần túy

- **Mục đích**: Lazy loading nghiêm ngặt
- **Sử dụng**: Cho galleries hoặc long lists
- **Tính năng**:
  - Chỉ load khi vào viewport
  - Viewport detection với threshold
  - Memory efficient

## 🎯 Loading Strategies

### **Eager Loading** (`loadingStrategy="eager"`)

```typescript
<SmartImage
  source={{ uri: imageUrl }}
  loadingStrategy="eager"
  priority="high"
/>
```

- **Khi nào sử dụng**: Avatar, featured images, above-the-fold content
- **Ưu điểm**: Load ngay lập tức, UX tốt
- **Nhược điểm**: Tốn bandwidth, có thể chậm initial load

### **Lazy Loading** (`loadingStrategy="lazy"`)

```typescript
<SmartImage source={{ uri: imageUrl }} loadingStrategy="lazy" threshold={0.2} />
```

- **Khi nào sử dụng**: Images trong long lists, galleries
- **Ưu điểm**: Tiết kiệm bandwidth, faster initial load
- **Nhược điểm**: Có thể có delay khi scroll

### **Auto Strategy** (`loadingStrategy="auto"`)

```typescript
<SmartImage
  source={{ uri: imageUrl }}
  loadingStrategy="auto"
  priority="high"
  size="avatar"
/>
```

- **Logic tự động**:
  - `priority="high"` → Eager loading
  - `size="avatar"` → Eager loading
  - Còn lại → Lazy loading

## 🔧 Cấu hình tối ưu cho từng trường hợp

### **Avatar Images**

```typescript
<OptimizedImage
  source={{ uri: avatarUrl }}
  size="avatar"
  priority="high"
  fadeInDuration={150}
  retryAttempts={3}
/>
```

### **Post Images**

```typescript
<SmartImage
  source={{ uri: postImageUrl }}
  size="medium"
  priority="high"
  loadingStrategy="eager"
  fadeInDuration={200}
  retryAttempts={3}
  threshold={0.3}
/>
```

### **Gallery Images**

```typescript
<LazyImage
  source={{ uri: galleryImageUrl }}
  size="small"
  priority="normal"
  threshold={0.1}
  fadeInDuration={300}
/>
```

## 📊 Performance Optimizations

### **1. Image Size Optimization**

```typescript
// ImageOptimizer tự động chọn size phù hợp
const sizes = {
  thumbnail: 150,
  small: 300,
  medium: 600,
  large: 1200,
  avatar: 100,
};
```

### **2. Caching Strategy**

```typescript
cachePolicy="memory-disk"  // Cache both in memory and disk
recyclingKey={`${uri}-${retryAttempt}`}  // Unique key for retry
```

### **3. Priority System**

- **High**: Avatar, featured images, above-the-fold
- **Normal**: Regular post images
- **Low**: Background images, decorative elements

### **4. Retry Logic**

```typescript
// Exponential backoff: 1s, 2s, 4s, 8s...
const retryDelay = Math.pow(2, currentRetryAttempt) * 1000;
```

## 🎨 Visual Feedback

### **Loading States**

1. **Placeholder**: Hiển thị spinner khi chưa load
2. **Loading Overlay**: Spinner overlay khi đang load
3. **Retry Indicator**: Orange spinner khi retry
4. **Error State**: Red indicator khi lỗi

### **Animations**

- **Fade In**: Smooth transition khi load xong
- **Scale Animation**: Micro-interaction cho like button
- **Skeleton Loading**: Placeholder animation

## 🚨 Troubleshooting

### **Images không hiển thị**

1. Kiểm tra `shouldLoad` state
2. Verify `loadingStrategy` configuration
3. Check network connectivity
4. Validate image URLs

### **Performance Issues**

1. Sử dụng `loadingStrategy="lazy"` cho long lists
2. Giảm `retryAttempts` nếu cần
3. Tăng `threshold` để load sớm hơn
4. Sử dụng smaller image sizes

### **Memory Issues**

1. Enable `allowDownscaling={true}`
2. Sử dụng `cachePolicy="memory-disk"`
3. Limit số lượng images trong viewport
4. Clear cache định kỳ

## 📈 Best Practices

### **1. Choose Right Strategy**

- **Critical images**: Eager loading
- **Below-the-fold**: Lazy loading
- **Mixed content**: Auto strategy

### **2. Optimize Image Sizes**

- Avatar: 100px
- Thumbnails: 150px
- Post images: 600px
- Full-screen: 1200px

### **3. Handle Edge Cases**

- Slow network: Increase retry attempts
- No network: Show cached images
- Large images: Use progressive loading

### **4. Monitor Performance**

- Track loading times
- Monitor cache hit rates
- Analyze user scroll behavior
- A/B test loading strategies

## 🔍 Debugging Tools

### **Console Logs**

```typescript
// Enable debug mode
const DEBUG_IMAGE_LOADING = __DEV__;

if (DEBUG_IMAGE_LOADING) {
  console.log("Image loading:", uri, strategy, priority);
}
```

### **Performance Metrics**

```typescript
// Track loading performance
crashReporter.logPerformance("image_load_time", loadTime, "ms");
```

## 🎯 Kết luận

Hệ thống image loading của PostApp được thiết kế để:

- **Tối ưu hóa performance**: Lazy loading, caching, size optimization
- **Cải thiện UX**: Smooth animations, loading states, retry logic
- **Tiết kiệm bandwidth**: Smart loading strategies, image compression
- **Xử lý lỗi**: Retry mechanism, error states, fallback images

Việc lựa chọn đúng component và strategy sẽ giúp ứng dụng chạy mượt mà và tiết kiệm tài nguyên.
