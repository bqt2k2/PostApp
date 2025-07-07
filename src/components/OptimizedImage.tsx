import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Animated,
} from "react-native";
import { Image } from "expo-image";
import ImageOptimizer, { ImageSizeType } from "../utils/imageOptimizer";

const { width: screenWidth } = Dimensions.get("window");

interface OptimizedImageProps {
  source: { uri: string };
  style?: any;
  placeholder?: React.ReactElement | string;
  contentFit?: "cover" | "contain" | "fill" | "scale-down";
  transition?: number;
  onLoad?: () => void;
  onError?: () => void;
  size?: ImageSizeType;
  priority?: "low" | "normal" | "high";
  lazy?: boolean;
  fadeInDuration?: number;
  retryAttempts?: number;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  source,
  style,
  placeholder,
  contentFit = "cover",
  transition = 200,
  onLoad,
  onError,
  size = "medium",
  priority = "normal",
  lazy = false,
  fadeInDuration = 200,
  retryAttempts = 2,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(!lazy);
  const [currentRetryAttempt, setCurrentRetryAttempt] = useState(0);

  const fadeAnim = useRef(new Animated.Value(lazy ? 0 : 1)).current;
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Simple lazy loading trigger
  useEffect(() => {
    if (lazy && !shouldLoad) {
      const timer = setTimeout(() => {
        setShouldLoad(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [lazy, shouldLoad]);

  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    setCurrentRetryAttempt(0);

    // Simple fade in for lazy images only
    if (lazy) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: fadeInDuration,
        useNativeDriver: true,
      }).start();
    }

    onLoad?.();
  }, [fadeAnim, fadeInDuration, onLoad, lazy]);

  const handleError = useCallback(() => {
    setIsLoading(false);

    // Simple retry logic
    if (currentRetryAttempt < retryAttempts) {
      retryTimeoutRef.current = setTimeout(() => {
        setCurrentRetryAttempt((prev) => prev + 1);
        setIsLoading(true);
        setHasError(false);
      }, 1000 * (currentRetryAttempt + 1));
    } else {
      setHasError(true);
      onError?.();
    }
  }, [currentRetryAttempt, retryAttempts, onError]);

  const getOptimizedImageUri = useCallback(() => {
    return ImageOptimizer.generateImageUrl(source.uri, size);
  }, [source.uri, size]);

  const renderPlaceholder = useCallback(() => {
    if (React.isValidElement(placeholder)) {
      return placeholder;
    }
    if (typeof placeholder === "string") {
      return placeholder;
    }
    return `https://via.placeholder.com/50x50/f0f0f0/cccccc?text=...`;
  }, [placeholder]);

  // Show simple placeholder for lazy loading
  if (!shouldLoad) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.placeholderContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Animated.View style={[styles.imageContainer, { opacity: fadeAnim }]}>
        <Image
          source={{ uri: getOptimizedImageUri() }}
          style={[styles.image, style]}
          placeholder={
            typeof placeholder === "string" ? placeholder : undefined
          }
          contentFit={contentFit}
          transition={transition}
          onLoad={handleLoad}
          onError={handleError}
          cachePolicy="memory-disk"
          priority={priority}
          recyclingKey={`${source.uri}-${currentRetryAttempt}`}
        />
      </Animated.View>

      {isLoading && React.isValidElement(placeholder) && placeholder}

      {isLoading && !React.isValidElement(placeholder) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#007AFF" />
        </View>
      )}

      {hasError && (
        <View style={styles.errorOverlay}>
          <View style={styles.errorIcon}>
            <ActivityIndicator size="small" color="#ff6b6b" />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    backgroundColor: "#f8f9fa",
    overflow: "hidden",
  },
  imageContainer: {
    width: "100%",
    height: "100%",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(248, 249, 250, 0.8)",
    borderRadius: 8,
  },
  errorOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 107, 107, 0.1)",
    borderRadius: 8,
  },
  errorIcon: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 107, 107, 0.2)",
  },
});

export default OptimizedImage;
