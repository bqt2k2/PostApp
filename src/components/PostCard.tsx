import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";

import { Post } from "../types";
import { postsService } from "../services/posts";
import OptimizedImage from "./OptimizedImage";
import {
  Spacing,
  BorderRadius,
  FontSize,
  FontWeight,
  Shadow,
} from "../constants/theme";
import { useApp } from "../contexts/AppContext";
import { getAppColors } from "../constants/appTheme";
import CommentSection from "./CommentSection";

const { width: screenWidth } = Dimensions.get("window");

interface PostCardProps {
  post: Post;
  onUpdate: () => void;
  isVisible?: boolean;
}

const PostCard: React.FC<PostCardProps> = React.memo(
  ({ post, onUpdate, isVisible = true }) => {
    const { isDark, texts } = useApp();
    const appColors = getAppColors(isDark);
    const [isLiked, setIsLiked] = useState(post.is_liked || false);
    const [likeCount, setLikeCount] = useState(post.likes_count || 0);
    const [likeAnimation] = useState(new Animated.Value(1));
    const [isLikeLoading, setIsLikeLoading] = useState(false);
    const [isCommentsVisible, setIsCommentsVisible] = useState(false);
    const likeQueueRef = useRef<Promise<any>>(Promise.resolve());
    const isMountedRef = useRef(true);
    const lastLikeActionRef = useRef<{
      id: string;
      action: "like" | "unlike" | null;
    }>({
      id: post.id,
      action: null,
    });

    // Automatically close comments when post is not visible
    useEffect(() => {
      if (!isVisible && isCommentsVisible) {
        setIsCommentsVisible(false);
      }
    }, [isVisible]);

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        isMountedRef.current = false;
      };
    }, []);

    const animateLikeButton = useCallback(() => {
      Animated.sequence([
        Animated.timing(likeAnimation, {
          toValue: 1.2,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(likeAnimation, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }, [likeAnimation]);

    const handleLike = useCallback(async () => {
      if (isLikeLoading || lastLikeActionRef.current.action !== null) {
        return;
      }

      try {
        setIsLikeLoading(true);
        animateLikeButton();

        // Optimistic update
        const newIsLiked = !isLiked;
        const newLikeCount = newIsLiked ? likeCount + 1 : likeCount - 1;
        setIsLiked(newIsLiked);
        setLikeCount(newLikeCount);

        // Add to queue and track current action
        const currentAction = newIsLiked ? "like" : "unlike";
        lastLikeActionRef.current = { id: post.id, action: currentAction };

        likeQueueRef.current = likeQueueRef.current.then(async () => {
          try {
            const result = newIsLiked
              ? await postsService.likePost(post.id)
              : await postsService.unlikePost(post.id);

            if (result.error) {
              throw result.error;
            }

            // Verify if the action is still relevant
            if (
              isMountedRef.current &&
              lastLikeActionRef.current.id === post.id &&
              lastLikeActionRef.current.action === currentAction
            ) {
              // Get latest like count from server to ensure accuracy
              const likesResult = await postsService.getPostLikes(post.id);
              if (likesResult.error) {
                throw likesResult.error;
              }

              if (isMountedRef.current) {
                setLikeCount(likesResult.count);
              }
            }
          } catch (error) {
            // Revert optimistic update if there was an error
            if (
              isMountedRef.current &&
              lastLikeActionRef.current.id === post.id &&
              lastLikeActionRef.current.action === currentAction
            ) {
              console.error("Like error:", error);
              setIsLiked(!newIsLiked);
              setLikeCount(newIsLiked ? likeCount : likeCount);
              Alert.alert(
                texts.error,
                "Không thể thực hiện hành động. Vui lòng thử lại sau."
              );
            }
          } finally {
            if (
              isMountedRef.current &&
              lastLikeActionRef.current.id === post.id &&
              lastLikeActionRef.current.action === currentAction
            ) {
              lastLikeActionRef.current = { id: post.id, action: null };
              setIsLikeLoading(false);
            }
          }
        });
      } catch (error) {
        if (isMountedRef.current) {
          console.error("Like queue error:", error);
          lastLikeActionRef.current = { id: post.id, action: null };
          setIsLikeLoading(false);
        }
      }
    }, [post.id, isLiked, likeCount, isLikeLoading, animateLikeButton]);

    const formattedDate = useMemo(() => {
      const date = new Date(post.created_at);
      const now = new Date();
      const diffInMilliseconds = now.getTime() - date.getTime();
      const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
      const diffInHours = Math.floor(diffInMinutes / 60);
      const diffInDays = Math.floor(diffInHours / 24);

      if (diffInMinutes < 1) {
        return "Vừa xong";
      } else if (diffInMinutes < 60) {
        return `${diffInMinutes} phút trước`;
      } else if (diffInHours < 24) {
        return `${diffInHours} giờ trước`;
      } else if (diffInDays < 7) {
        return `${diffInDays} ngày trước`;
      } else {
        return date.toLocaleDateString("vi-VN");
      }
    }, [post.created_at]);

    const handleMorePress = useCallback(() => {
      // Handle more button press
    }, []);

    const handleCommentPress = useCallback(() => {
      setIsCommentsVisible(true);
    }, []);

    const handleSharePress = useCallback(() => {
      // Handle share button press
    }, []);

    const handleBookmarkPress = useCallback(() => {
      // Handle bookmark button press
    }, []);

    const handleDownloadImage = useCallback(async () => {
      try {
        if (!post.image_url) {
          Alert.alert(texts.error, texts.noImageToDownload);
          return;
        }

        // Xin quyền truy cập media library
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(texts.error, texts.permissionDenied);
          return;
        }

        // Hiển thị thông báo đang tải
        Alert.alert("Thông báo", texts.downloadingImage);

        // Xử lý tên file và phần mở rộng
        let fileName = post.image_url.split("/").pop();
        if (!fileName) {
          fileName = `postapp_${Date.now()}.jpg`;
        } else {
          // Đảm bảo file có phần mở rộng
          if (!fileName.includes(".")) {
            fileName += ".jpg";
          }
        }

        // Tạo đường dẫn tạm thời
        const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

        try {
          // Tải file
          const downloadResult = await FileSystem.downloadAsync(
            post.image_url,
            fileUri
          );

          if (downloadResult.status !== 200) {
            throw new Error("Không thể tải hình ảnh");
          }

          // Lưu vào thư viện ảnh
          const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);

          // Tạo album nếu chưa có
          try {
            const album = await MediaLibrary.getAlbumAsync("PostApp");
            if (album) {
              await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
            } else {
              await MediaLibrary.createAlbumAsync("PostApp", asset, false);
            }
          } catch (albumError) {
            console.error("Lỗi tạo/thêm vào album:", albumError);
            // Vẫn tiếp tục vì hình đã được lưu vào thư viện
          }

          // Xóa file tạm
          try {
            await FileSystem.deleteAsync(fileUri, { idempotent: true });
          } catch (deleteError) {
            console.error("Lỗi xóa file tạm:", deleteError);
            // Không ảnh hưởng đến người dùng nên bỏ qua
          }

          Alert.alert(texts.success, texts.downloadSuccess);
        } catch (downloadError) {
          console.error("Lỗi tải hình:", downloadError);
          throw new Error("Không thể tải hoặc lưu hình ảnh");
        }
      } catch (error) {
        console.error("Lỗi tải hình:", error);
        Alert.alert(
          texts.error,
          texts.downloadError +
            "\n" +
            (error instanceof Error ? error.message : "Lỗi không xác định")
        );
      }
    }, [post.image_url]);

    return (
      <View
        style={[
          styles.container,
          { backgroundColor: appColors.cardBackground },
        ]}
      >
        <View style={[styles.header, { borderBottomColor: appColors.border }]}>
          <View style={styles.userInfo}>
            <View
              style={[
                styles.avatar,
                { backgroundColor: appColors.backgroundSecondary },
              ]}
            >
              {post.user?.avatar_url ? (
                <OptimizedImage
                  source={{ uri: post.user.avatar_url }}
                  style={styles.avatarImage}
                  placeholder={
                    <LinearGradient
                      colors={[appColors.backgroundSecondary, appColors.border]}
                      style={styles.avatarGradient}
                    >
                      <Ionicons
                        name="person"
                        size={24}
                        color={appColors.textSecondary}
                      />
                    </LinearGradient>
                  }
                />
              ) : (
                <LinearGradient
                  colors={[appColors.backgroundSecondary, appColors.border]}
                  style={styles.avatarGradient}
                >
                  <Ionicons
                    name="person"
                    size={24}
                    color={appColors.textSecondary}
                  />
                </LinearGradient>
              )}
            </View>
            <View style={styles.userDetails}>
              <Text style={[styles.userName, { color: appColors.text }]}>
                {post.user?.full_name || "Unknown User"}
              </Text>
              <Text
                style={[styles.postTime, { color: appColors.textSecondary }]}
              >
                {formattedDate}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.moreButton,
              { backgroundColor: appColors.backgroundSecondary },
            ]}
            onPress={handleMorePress}
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={20}
              color={appColors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {post.content && (
            <Text style={[styles.postText, { color: appColors.text }]}>
              {post.content}
            </Text>
          )}
          {post.image_url && (
            <View style={styles.imageContainer}>
              <OptimizedImage
                source={{ uri: post.image_url }}
                style={styles.postImage}
                placeholder={
                  <View
                    style={[
                      styles.postImage,
                      { backgroundColor: appColors.backgroundSecondary },
                    ]}
                  />
                }
              />
              <TouchableOpacity
                style={styles.downloadButton}
                onPress={handleDownloadImage}
              >
                <Ionicons name="download" size={24} color={"#212529"} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View
          style={[
            styles.actions,
            {
              backgroundColor: appColors.backgroundSecondary,
              borderTopColor: appColors.border,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: appColors.cardBackground },
            ]}
            onPress={handleLike}
            disabled={isLikeLoading}
          >
            <Animated.View style={{ transform: [{ scale: likeAnimation }] }}>
              <Ionicons
                name={isLiked ? "heart" : "heart-outline"}
                size={24}
                color={isLiked ? "#FF6B6B" : appColors.textSecondary}
              />
            </Animated.View>
            <Text
              style={[styles.actionText, { color: appColors.textSecondary }]}
            >
              {likeCount}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: appColors.cardBackground },
            ]}
            onPress={handleCommentPress}
          >
            <Ionicons
              name="chatbubble-outline"
              size={24}
              color={appColors.textSecondary}
            />
            <Text
              style={[styles.actionText, { color: appColors.textSecondary }]}
            >
              {post.comments_count || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: appColors.cardBackground },
            ]}
            onPress={handleSharePress}
          >
            <Ionicons
              name="share-outline"
              size={24}
              color={appColors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: appColors.cardBackground },
            ]}
            onPress={handleBookmarkPress}
          >
            <Ionicons
              name="bookmark-outline"
              size={24}
              color={appColors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {isCommentsVisible && (
          <CommentSection
            postId={post.id}
            isVisible={isCommentsVisible}
            onClose={() => setIsCommentsVisible(false)}
          />
        )}
      </View>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.post.id === nextProps.post.id &&
      prevProps.post.likes_count === nextProps.post.likes_count &&
      prevProps.post.is_liked === nextProps.post.is_liked &&
      prevProps.post.comments_count === nextProps.post.comments_count
    );
  }
);

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
    ...Shadow.md,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
    overflow: "hidden",
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    marginBottom: 2,
  },
  postTime: {
    fontSize: FontSize.xs,
  },
  moreButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.xl,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  postText: {
    fontSize: FontSize.md,
    lineHeight: 24,
    marginBottom: Spacing.md,
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    marginTop: Spacing.md,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  postImage: {
    width: "100%",
    height: 220,
    borderRadius: BorderRadius.md,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderTopWidth: 1,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.sm,
    borderRadius: BorderRadius.xl,
    minWidth: 60,
    justifyContent: "center",
    ...Shadow.sm,
  },
  actionText: {
    fontSize: FontSize.sm,
    marginLeft: Spacing.xs,
    fontWeight: FontWeight.medium,
  },
  downloadButton: {
    position: "absolute",
    bottom: Spacing.md,
    right: Spacing.md,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: BorderRadius.full,
    padding: Spacing.sm,
    ...Shadow.md,
  },
});

export default PostCard;
