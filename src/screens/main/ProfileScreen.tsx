import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";

import { userService, UserProfile, UserStats } from "../../services/user";
import PostCard from "../../components/PostCard";
import { Post } from "../../types";
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

const ProfileScreen: React.FC = () => {
  const { isDark, texts } = useApp();
  const appColors = getAppColors(isDark);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);

  const loadUserData = useCallback(async () => {
    try {
      console.log("👤 Đang load dữ liệu user...");

      // Lấy thông tin profile
      const { data: profile, error: profileError } =
        await userService.getCurrentUserProfile();

      if (profileError) {
        console.error("❌ Lỗi lấy profile:", profileError);
        Alert.alert(texts.error, "Không thể tải thông tin cá nhân");
        return;
      }

      if (!profile) {
        console.log("❌ Không có profile");
        Alert.alert(texts.error, "Không tìm thấy thông tin người dùng");
        return;
      }

      setUserProfile(profile);
      console.log("✅ Đã load profile:", profile.full_name);

      // Lấy thống kê
      const { data: stats, error: statsError } = await userService.getUserStats(
        profile.id
      );

      if (statsError) {
        console.error("❌ Lỗi lấy stats:", statsError);
      } else {
        setUserStats(stats);
        console.log("✅ Đã load stats:", stats);
      }

      // Lấy bài viết của user
      setLoadingPosts(true);
      const { data: posts, error: postsError } = await userService.getUserPosts(
        profile.id,
        0,
        10
      );

      if (postsError) {
        console.error("❌ Lỗi lấy posts:", postsError);
      } else {
        setUserPosts(posts || []);
        console.log("✅ Đã load", posts?.length || 0, "bài viết");
      }

      setLoadingPosts(false);
    } catch (error) {
      console.error("💥 Lỗi loadUserData:", error);
      Alert.alert(texts.error, texts.unexpectedError);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    console.log("🔄 Refresh profile");
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  }, [loadUserData]);

  const handlePostUpdate = useCallback(() => {
    // Reload user data when post is updated (liked, etc.)
    loadUserData();
  }, [loadUserData]);

  // Load data when component mounts
  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (!loading) {
        console.log("🎯 Profile screen focused - refreshing");
        loadUserData();
      }
    }, [loadUserData, loading])
  );

  const renderUserInfo = () => {
    if (!userProfile) return null;

    const displayName =
      userProfile.full_name || userProfile.email?.split("@")[0] || "Người dùng";
    const displayEmail = userProfile.email || "Chưa có email";

    return (
      <View style={styles.profileCard}>
        <LinearGradient
          colors={Colors.gradientPrimary}
          style={styles.avatarGradient}
        >
          <Text style={styles.avatarText}>
            {displayName.charAt(0).toUpperCase() || "?"}
          </Text>
        </LinearGradient>
        <Text style={styles.userName}>{displayName}</Text>
        <Text style={styles.userEmail}>{displayEmail}</Text>
        <Text style={styles.joinDate}>
          {texts.joined}:{" "}
          {new Date(userProfile.created_at || "").toLocaleDateString("vi-VN")}
        </Text>
      </View>
    );
  };

  const renderStats = () => {
    if (!userStats) {
      return (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.statLabel}>{texts.loading}</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{userStats.posts_count}</Text>
          <Text style={styles.statLabel}>{texts.posts}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{userStats.likes_received}</Text>
          <Text style={styles.statLabel}>{texts.likes}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{userStats.comments_received}</Text>
          <Text style={styles.statLabel}>{texts.comments}</Text>
        </View>
      </View>
    );
  };

  const renderHeader = () => {
    return (
      <>
        <LinearGradient
          colors={Colors.gradientPrimary}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={[styles.headerTitle, { color: "#FFFFFF" }]}>
            {texts.profile}
          </Text>
        </LinearGradient>

        <View
          style={[
            styles.content,
            { backgroundColor: appColors.backgroundSecondary },
          ]}
        >
          {renderUserInfo()}

          <View
            style={[
              styles.section,
              { backgroundColor: appColors.cardBackground },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: appColors.text }]}>
              {texts.statistics}
            </Text>
            {renderStats()}
          </View>

          <View
            style={[
              styles.section,
              { backgroundColor: appColors.cardBackground },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: appColors.text }]}>
              {texts.myPosts}
            </Text>
          </View>
        </View>
      </>
    );
  };

  const renderEmptyComponent = () => {
    if (loadingPosts) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>{texts.loadingPosts}</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Ionicons name="document-text-outline" size={48} color="#ccc" />
        <Text style={styles.emptyStateText}>{texts.noPostsYet}</Text>
        <Text style={styles.emptyStateSubtext}>
          {texts.createFirstPostDesc}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>{texts.loading}</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={[
        styles.container,
        { backgroundColor: appColors.backgroundSecondary },
      ]}
      data={userPosts}
      renderItem={({ item, index }) => (
        <PostCard
          key={`user-post-${item.id}-${index}`}
          post={item}
          onUpdate={handlePostUpdate}
        />
      )}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={renderEmptyComponent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[appColors.primary]}
          tintColor={appColors.primary}
        />
      }
      contentContainerStyle={styles.flatListContent}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flatListContent: {
    flexGrow: 1,
  },
  header: {
    padding: Spacing.lg,
    paddingTop: 50,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: FontSize.title,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  content: {
    padding: Spacing.lg,
  },
  profileCard: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xxl,
    alignItems: "center",
    marginBottom: Spacing.lg,
    ...Shadow.md,
  },
  avatarGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  avatarText: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  userName: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  userEmail: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  joinDate: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    fontStyle: "italic",
  },
  section: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadow.md,
  },
  sectionTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: FontSize.title,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  statLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    fontWeight: FontWeight.semiBold,
  },
  emptyStateSubtext: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },
});

export default ProfileScreen;
