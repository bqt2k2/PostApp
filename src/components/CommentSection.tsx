import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { Comment } from "../types";
import { postsService } from "../services/posts";
import OptimizedImage from "./OptimizedImage";
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSize,
  FontWeight,
} from "../constants/theme";
import { useApp } from "../contexts/AppContext";
import { getAppColors } from "../constants/appTheme";

interface CommentSectionProps {
  postId: string;
  isVisible: boolean;
  onClose: () => void;
}

const COMMENTS_PER_PAGE = 10;

const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  isVisible,
  onClose,
}) => {
  const { isDark, texts } = useApp();
  const appColors = getAppColors(isDark);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadComments = useCallback(
    async (page: number = 0) => {
      try {
        setIsLoading(true);
        const { data, error } = await postsService.getComments(
          postId,
          page,
          COMMENTS_PER_PAGE
        );

        if (error) throw error;

        if (data) {
          if (page === 0) {
            setComments(data);
          } else {
            setComments((prev) => [...prev, ...data]);
          }
          setHasMore(data.length === COMMENTS_PER_PAGE);
        }
      } catch (error) {
        console.error("Error loading comments:", error);
        Alert.alert(
          texts.error,
          "Không thể tải bình luận. Vui lòng thử lại sau."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [postId]
  );

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    try {
      setIsLoadingMore(true);
      const nextPage = currentPage + 1;
      await loadComments(nextPage);
      setCurrentPage(nextPage);
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentPage, hasMore, isLoadingMore, loadComments]);

  const handleSubmitComment = useCallback(async () => {
    if (!newComment.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const { data, error } = await postsService.createComment(
        postId,
        newComment.trim()
      );

      if (error) throw error;

      if (data) {
        setComments((prev) => [data, ...prev]);
        setNewComment("");
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
      Alert.alert(
        texts.error,
        "Không thể đăng bình luận. Vui lòng thử lại sau."
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [postId, newComment, isSubmitting]);

  useEffect(() => {
    if (isVisible) {
      loadComments();
    }
  }, [isVisible, loadComments]);

  if (!isVisible) return null;

  return (
    <View style={[styles.container, { backgroundColor: appColors.background }]}>
      <View style={[styles.header, { borderBottomColor: appColors.border }]}>
        <Text style={[styles.title, { color: appColors.text }]}>
          {texts.commentsTitle}
        </Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color={appColors.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={comments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.commentItem,
              { backgroundColor: appColors.cardBackground },
            ]}
          >
            <View style={styles.commentHeader}>
              {item.user?.avatar_url ? (
                <OptimizedImage
                  source={{ uri: item.user.avatar_url }}
                  style={styles.avatar}
                  contentFit="cover"
                  size="avatar"
                />
              ) : (
                <LinearGradient
                  colors={Colors.gradientPrimary}
                  style={styles.avatarGradient}
                >
                  <Ionicons name="person" size={16} color={Colors.white} />
                </LinearGradient>
              )}
              <View style={styles.commentInfo}>
                <Text style={[styles.userName, { color: appColors.text }]}>
                  {item.user?.full_name || "Người dùng"}
                </Text>
                <Text
                  style={[
                    styles.commentTime,
                    { color: appColors.textSecondary },
                  ]}
                >
                  {new Date(item.created_at).toLocaleDateString("vi-VN")}
                </Text>
              </View>
            </View>
            <Text style={[styles.commentContent, { color: appColors.text }]}>
              {item.content}
            </Text>
          </View>
        )}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          isLoading ? null : (
            <Text
              style={[styles.emptyText, { color: appColors.textSecondary }]}
            >
              {texts.noComments}
            </Text>
          )
        }
        ListFooterComponent={
          isLoadingMore ? (
            <ActivityIndicator
              size="small"
              color={appColors.primary}
              style={styles.loadingMore}
            />
          ) : null
        }
      />

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: appColors.background,
            borderTopColor: appColors.border,
          },
        ]}
      >
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: appColors.inputBackground,
              color: appColors.text,
            },
          ]}
          placeholder={texts.writeComment}
          placeholderTextColor={appColors.textSecondary}
          value={newComment}
          onChangeText={setNewComment}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: appColors.primary },
            (!newComment.trim() || isSubmitting) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmitComment}
          disabled={!newComment.trim() || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Ionicons name="send" size={20} color={Colors.white} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  commentItem: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  commentInfo: {
    marginLeft: Spacing.sm,
  },
  userName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
  },
  commentTime: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  commentContent: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    marginLeft: 40, // Align with username
  },
  inputContainer: {
    flexDirection: "row",
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    color: Colors.textPrimary,
  },
  submitButton: {
    width: 40,
    height: 40,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: Colors.gray400,
  },
  emptyText: {
    textAlign: "center",
    padding: Spacing.lg,
    color: Colors.textSecondary,
  },
  loadingMore: {
    padding: Spacing.md,
  },
});

export default React.memo(CommentSection);
