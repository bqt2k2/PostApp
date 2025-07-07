import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Dimensions } from "react-native";

const { width: screenWidth } = Dimensions.get("window");

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = "100%",
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["#f0f0f0", "#e0e0e0"],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor,
        },
        style,
      ]}
    />
  );
};

const PostCardSkeleton: React.FC = () => {
  return (
    <View style={styles.postSkeleton}>
      {/* Header */}
      <View style={styles.headerSkeleton}>
        <SkeletonLoader width={40} height={40} borderRadius={20} />
        <View style={styles.userInfoSkeleton}>
          <SkeletonLoader width={120} height={16} />
          <SkeletonLoader width={80} height={12} style={{ marginTop: 4 }} />
        </View>
      </View>

      {/* Content */}
      <View style={styles.contentSkeleton}>
        <SkeletonLoader width="100%" height={16} />
        <SkeletonLoader width="80%" height={16} style={{ marginTop: 8 }} />
        <SkeletonLoader width="60%" height={16} style={{ marginTop: 8 }} />

        {/* Image placeholder */}
        <SkeletonLoader
          width="100%"
          height={200}
          borderRadius={8}
          style={{ marginTop: 12 }}
        />
      </View>

      {/* Actions */}
      <View style={styles.actionsSkeleton}>
        <SkeletonLoader width={60} height={32} borderRadius={16} />
        <SkeletonLoader width={60} height={32} borderRadius={16} />
        <SkeletonLoader width={60} height={32} borderRadius={16} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: "#f0f0f0",
  },
  postSkeleton: {
    backgroundColor: "#fff",
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerSkeleton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  userInfoSkeleton: {
    flex: 1,
    marginLeft: 12,
  },
  contentSkeleton: {
    marginBottom: 16,
  },
  actionsSkeleton: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
});

export { SkeletonLoader, PostCardSkeleton };
