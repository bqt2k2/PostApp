import { Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

export interface ImageSize {
  width: number;
  height: number;
  quality: number;
}

export const IMAGE_SIZES = {
  thumbnail: { width: 150, height: 150, quality: 0.6 },
  small: { width: 300, height: 300, quality: 0.7 },
  medium: { width: 600, height: 400, quality: 0.8 },
  large: { width: 1200, height: 800, quality: 0.9 },
  avatar: { width: 100, height: 100, quality: 0.8 },
} as const;

export type ImageSizeType = keyof typeof IMAGE_SIZES;

export class ImageOptimizer {
  static generateImageUrl(
    originalUrl: string,
    size: ImageSizeType = 'medium'
  ): string {
    if (!originalUrl) return '';
    
    // For now, return original URL to avoid complexity
    // Can be enhanced later with CDN transformations
    return originalUrl;
  }


}

export default ImageOptimizer; 