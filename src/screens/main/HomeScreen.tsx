import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  Animated,
  ViewabilityConfig,
  ViewToken,
} from "react-native";
import {
  useNavigation,
  useFocusEffect,
  useRoute,
} from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { postsService } from "../../services/posts";
import { authService } from "../../services/auth";
import { Post } from "../../types";
import { MainStackParamList } from "../../navigation/MainNavigator";
import PostCard from "../../components/PostCard";
import { PostCardSkeleton } from "../../components/SkeletonLoader";
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSize,
  FontWeight,
  Shadow,
} from "../../constants/theme";
import { useApp } from "../../contexts/AppContext";
import { getAppColors } from "../../constants/appTheme";

const { width: screenWidth } = Dimensions.get("window");

type HomeScreenNavigationProp = StackNavigationProp<MainStackParamList>;

const POSTS_PER_PAGE = 10;
const SCROLL_THRESHOLD = 500;

const viewabilityConfig: ViewabilityConfig = {
  itemVisiblePercentThreshold: 50, // Item được coi là visible khi hiển thị ít nhất 50%
};

const HomeScreen: React.FC = () => {
  const { isDark, texts } = useApp();
  const appColors = getAppColors(isDark);
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const route = useRoute();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [visiblePostIds, setVisiblePostIds] = useState<string[]>([]);

  // Refs for better scroll handling
  const flatListRef = useRef<FlatList>(null);
  const loadingRef = useRef(false);
  const pageRef = useRef(0);
  const lastFocusTime = useRef<number>(0);

  const fetchPosts = useCallback(
    async (pageNumber: number = 0, isRefresh: boolean = false) => {
      // Prevent multiple simultaneous requests
      if (loadingRef.current && !isRefresh) return;

      loadingRef.current = true;
      setError(null);

      if (pageNumber === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        console.log("🔄 Đang tải posts, trang:", pageNumber);
        const { data, error } = await postsService.getPosts(
          pageNumber,
          POSTS_PER_PAGE
        );

        if (error) {
          setError(texts.errorLoadingPosts);
          if (pageNumber === 0) {
            Alert.alert(texts.error, texts.errorLoadingPosts);
          }
        } else {
          const newPosts = data || [];
          console.log("✅ Đã tải được", newPosts.length, "posts");

          if (isRefresh || pageNumber === 0) {
            setPosts(newPosts);
            pageRef.current = 0;
            setLastRefreshTime(Date.now());
            console.log("🔄 Reset posts list với", newPosts.length, "posts");
          } else {
            setPosts((prevPosts) => {
              // Remove duplicates
              const existingIds = new Set(prevPosts.map((p) => p.id));
              const uniqueNewPosts = newPosts.filter(
                (p) => !existingIds.has(p.id)
              );
              const updatedPosts = [...prevPosts, ...uniqueNewPosts];
              console.log(
                "➕ Thêm",
                uniqueNewPosts.length,
                "posts mới, tổng:",
                updatedPosts.length
              );
              return updatedPosts;
            });
          }

          setHasMore(newPosts.length === POSTS_PER_PAGE);
          setPage(pageNumber);
          pageRef.current = pageNumber;
        }
      } catch (error) {
        console.error("💥 Lỗi tải posts:", error);
        setError(texts.unexpectedError);
        if (pageNumber === 0) {
          Alert.alert(texts.error, texts.unexpectedError);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
        loadingRef.current = false;
        setIsInitialLoad(false);
      }
    },
    []
  );

  const onRefresh = useCallback(async () => {
    console.log("🔄 Pull to refresh");
    setRefreshing(true);
    setHasMore(true);
    await fetchPosts(0, true);
    setRefreshing(false);
  }, [fetchPosts]);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore || loadingMore) return;

    console.log("Loading more posts, current page:", pageRef.current);
    await fetchPosts(pageRef.current + 1);
  }, [fetchPosts, hasMore, loadingMore]);

  const handleLogout = async () => {
    Alert.alert(texts.logout, texts.logoutConfirm, [
      { text: texts.cancel, style: "cancel" },
      {
        text: texts.logout,
        style: "destructive",
        onPress: async () => {
          await authService.signOut();
        },
      },
    ]);
  };

  const handleCreatePost = () => {
    navigation.navigate("CreatePost");
  };

  const handleRetry = () => {
    fetchPosts(0, true);
  };

  // Load posts when component mounts
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Smart refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const checkAndRefresh = async () => {
        const currentTime = Date.now();

        // Skip refresh on initial load
        if (isInitialLoad) {
          lastFocusTime.current = currentTime;
          return;
        }

        // Check if there's a new post created
        const lastPostCreatedAt = await AsyncStorage.getItem(
          "lastPostCreatedAt"
        );
        let shouldRefreshForNewPost = false;

        if (lastPostCreatedAt) {
          const postCreatedTime = new Date(lastPostCreatedAt).getTime();
          const timeSincePostCreated = currentTime - postCreatedTime;

          // If post was created within last 10 seconds and we haven't refreshed since
          if (
            timeSincePostCreated < 10000 &&
            postCreatedTime > lastRefreshTime
          ) {
            shouldRefreshForNewPost = true;
            // Clear the flag after using it
            await AsyncStorage.removeItem("lastPostCreatedAt");
          }
        }

        // Only refresh if:
        // 1. New post was created
        // 2. Been away for more than 5 minutes
        const timeSinceLastFocus = currentTime - lastFocusTime.current;
        const timeSinceLastRefresh = currentTime - lastRefreshTime;
        const shouldRefreshForTime =
          timeSinceLastFocus > 300000 || // 5 minutes
          timeSinceLastRefresh > 600000; // 10 minutes

        if (shouldRefreshForNewPost || shouldRefreshForTime) {
          console.log(
            "🎯 Screen focused - refreshing posts (reason:",
            shouldRefreshForNewPost ? "new post created" : "time-based",
            ")"
          );
          fetchPosts(0, true);
        } else {
          console.log(
            "🎯 Screen focused - không cần refresh (last refresh:",
            Math.round(timeSinceLastRefresh / 1000),
            "giây trước)"
          );
        }

        lastFocusTime.current = currentTime;
      };

      checkAndRefresh();
    }, [fetchPosts, isInitialLoad, lastRefreshTime])
  );

  const renderPost = useCallback(
    ({ item }: { item: Post }) => (
      <PostCard
        post={item}
        onUpdate={() => fetchPosts(0, true)}
        isVisible={visiblePostIds.includes(item.id)}
      />
    ),
    [fetchPosts, visiblePostIds]
  );

  const renderFooter = () => {
    if (!hasMore && posts.length > 0) {
      return (
        <View style={styles.endMessage}>
          <Text style={styles.endMessageText}>Đã hiển thị tất cả bài viết</Text>
        </View>
      );
    }

    if (loadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.loadingText}>Đang tải thêm...</Text>
        </View>
      );
    }

    return null;
  };

  const renderHeader = () => (
    <LinearGradient colors={Colors.gradientPrimary} style={styles.header}>
      <Text style={styles.headerTitle}>{texts.homeTitle}</Text>
      <View style={styles.headerActions}>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreatePost}
        >
          <Ionicons name="add" size={24} color={Colors.white} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name="document-text-outline"
        size={64}
        color={appColors.textSecondary}
      />
      <Text style={[styles.emptyStateText, { color: appColors.text }]}>
        {texts.noPosts}
      </Text>
      <TouchableOpacity
        style={styles.createFirstPostButton}
        onPress={handleCreatePost}
      >
        <LinearGradient
          colors={Colors.gradientPrimary}
          style={styles.createFirstPostGradient}
        >
          <Text style={styles.createFirstPostText}>
            {texts.createFirstPost}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorState}>
      <Ionicons name="alert-circle-outline" size={64} color={appColors.error} />
      <Text style={[styles.errorText, { color: appColors.text }]}>{error}</Text>
      <TouchableOpacity
        style={[styles.retryButton, { backgroundColor: appColors.primary }]}
        onPress={handleRetry}
      >
        <Text style={styles.retryButtonText}>{texts.retry}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSkeletonLoader = () => (
    <View>
      {[...Array(5)].map((_, index) => (
        <PostCardSkeleton key={`skeleton-${index}`} />
      ))}
    </View>
  );

  const keyExtractor = useCallback((item: Post, index: number) => {
    return `post-${item.id}-${item.created_at}-${index}`;
  }, []);

  const onEndReached = useCallback(() => {
    if (!loadingRef.current && hasMore && !loadingMore) {
      loadMore();
    }
  }, [hasMore, loadingMore, loadMore]);

  const getItemLayout = useCallback(
    (data: any, index: number) => ({
      length: 320, // More accurate height estimate
      offset: 320 * index,
      index,
    }),
    []
  );

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        const shouldShow = offsetY > 500; // Hiện nút khi cuộn xuống 500px

        if (shouldShow !== showScrollTop) {
          setShowScrollTop(shouldShow);
          Animated.timing(fadeAnim, {
            toValue: shouldShow ? 1 : 0,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }
      },
    }
  );

  const scrollToTop = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      setVisiblePostIds(viewableItems.map((item) => (item.item as Post).id));
    },
    []
  );

  const viewabilityConfigCallbackPairs = useRef([
    { viewabilityConfig, onViewableItemsChanged },
  ]);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: appColors.backgroundSecondary },
      ]}
    >
      {renderHeader()}
      {loading ? (
        renderSkeletonLoader()
      ) : error && posts.length === 0 ? (
        renderErrorState()
      ) : (
        <FlatList
          ref={flatListRef}
          data={posts}
          renderItem={renderPost}
          keyExtractor={keyExtractor}
          contentContainerStyle={[
            styles.feedContainer,
            posts.length === 0 && styles.emptyContainer,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[appColors.primary]}
              tintColor={appColors.primary}
            />
          }
          ListEmptyComponent={!loading ? renderEmptyState : null}
          ListFooterComponent={renderFooter}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={3}
          windowSize={5}
          initialNumToRender={3}
          updateCellsBatchingPeriod={100}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          viewabilityConfigCallbackPairs={
            viewabilityConfigCallbackPairs.current
          }
        />
      )}

      <Animated.View
        style={[
          styles.scrollTopButton,
          {
            opacity: fadeAnim,
            transform: [
              {
                scale: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              },
            ],
          },
        ]}
        pointerEvents={showScrollTop ? "auto" : "none"}
      >
        <TouchableOpacity
          onPress={scrollToTop}
          style={styles.scrollTopButtonTouchable}
        >
          <Ionicons name="arrow-up" size={24} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: Spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: FontSize.title,
    fontWeight: FontWeight.bold,
    color: "#FFFFFF",
  },
  headerActions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  createButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.xxl,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  logoutButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.xxl,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  feedContainer: {
    paddingVertical: Spacing.sm,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
  },
  footerLoader: {
    paddingVertical: Spacing.xl,
    alignItems: "center",
  },
  loadingText: {
    marginTop: Spacing.sm,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  endMessage: {
    paddingVertical: Spacing.xl,
    alignItems: "center",
  },
  endMessageText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    fontStyle: "italic",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  emptyStateText: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  createFirstPostButton: {
    borderRadius: BorderRadius.xxl,
    overflow: "hidden",
  },
  createFirstPostGradient: {
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
  },
  createFirstPostText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semiBold,
  },
  errorState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: Spacing.xl,
  },
  errorText: {
    fontSize: FontSize.md,
    color: Colors.error,
    textAlign: "center",
    marginTop: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  retryButton: {
    backgroundColor: Colors.info,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semiBold,
  },
  scrollTopButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: Colors.primary,
    borderRadius: 30,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    ...Shadow.md,
  },
  scrollTopButtonTouchable: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default HomeScreen;
