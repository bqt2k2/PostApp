import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  Platform,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { postsService } from "../../services/posts";
import { storageService } from "../../services/storage";
import { MainStackParamList } from "../../navigation/MainNavigator";
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

type CreatePostScreenNavigationProp = StackNavigationProp<
  MainStackParamList,
  "CreatePost"
>;

const CreatePostScreen: React.FC = () => {
  const { isDark, texts } = useApp();
  const appColors = getAppColors(isDark);
  const navigation = useNavigation<CreatePostScreenNavigationProp>();
  const [content, setContent] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handlePickImage = async () => {
    try {
      // Request permissions first
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Cần quyền truy cập",
          "Ứng dụng cần quyền truy cập thư viện ảnh để chọn ảnh.",
          [{ text: "OK" }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        console.log("Image picked:", result.assets[0]);
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Lỗi", "Không thể chọn ảnh. Vui lòng thử lại.");
    }
  };

  const handleRemoveImage = () => {
    setImageUri(null);
    setUploadProgress(0);
  };

  const handleCreatePost = async () => {
    if (!content.trim()) {
      Alert.alert(texts.error, texts.fillAllFields);
      return;
    }

    setLoading(true);
    try {
      let imageUrl: string | undefined;

      // Upload image if selected
      if (imageUri) {
        setUploadProgress(10);
        console.log("🚀 Bắt đầu quá trình upload ảnh...");

        const { url, error: uploadError } =
          await storageService.uploadPostImage(imageUri);

        if (uploadError) {
          console.error("❌ Lỗi upload:", uploadError);
          Alert.alert(
            "Lỗi tải ảnh",
            "Không thể tải lên hình ảnh. Vui lòng thử lại sau."
          );
          return;
        }

        if (!url) {
          console.error("❌ Không có URL trả về");
          Alert.alert(
            "Lỗi",
            "Không nhận được URL hình ảnh. Vui lòng thử lại sau."
          );
          return;
        }

        imageUrl = url;
        console.log("✅ Upload ảnh thành công:", imageUrl);
        setUploadProgress(100);
      }

      // Create post with uploaded image URL
      console.log("📝 Đang tạo bài viết với ảnh:", imageUrl);
      const { data, error } = await postsService.createPost(
        content.trim(),
        imageUrl
      );

      if (error) {
        console.error("❌ Lỗi tạo bài viết:", error);
        // If post creation fails, try to delete the uploaded image
        if (imageUrl) {
          await storageService.deletePostImage(imageUrl);
        }
        Alert.alert(
          texts.error,
          "Không thể tạo bài viết. Vui lòng thử lại sau."
        );
      } else {
        console.log("✅ Tạo bài viết thành công:", data);
        Alert.alert(texts.success + " 🎉", "Bài viết đã được tạo thành công!");
        navigation.navigate("MainTabs");
        setContent("");
        setImageUri(null);
        setUploadProgress(0);
        await AsyncStorage.setItem(
          "lastPostCreatedAt",
          new Date().toISOString()
        );
      }
    } catch (error) {
      console.error("💥 Lỗi không mong muốn:", error);
      Alert.alert(
        texts.error,
        texts.unexpectedError + ". Vui lòng thử lại sau."
      );
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: appColors.background }]}
    >
      <View
        style={[
          styles.header,
          {
            backgroundColor: appColors.background,
            borderBottomColor: appColors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.cancelText, { color: appColors.textSecondary }]}>
            {texts.cancel}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: appColors.text }]}>
          {texts.createPost}
        </Text>
        <TouchableOpacity
          style={[
            styles.postButton,
            loading && styles.postButtonDisabled,
            { backgroundColor: appColors.primary },
          ]}
          onPress={handleCreatePost}
          disabled={loading}
        >
          <Text style={styles.postButtonText}>
            {loading ? texts.posting : texts.post}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <TextInput
          style={[
            styles.textInput,
            {
              color: appColors.text,
              backgroundColor: appColors.inputBackground,
            },
          ]}
          placeholder={texts.whatAreYouThinking}
          placeholderTextColor={appColors.textSecondary}
          multiline
          value={content}
          onChangeText={setContent}
          autoFocus
        />

        {imageUri && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.selectedImage} />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={handleRemoveImage}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            {uploadProgress > 0 && uploadProgress < 100 && (
              <View style={styles.uploadProgressContainer}>
                <View
                  style={[
                    styles.uploadProgressBar,
                    { width: `${uploadProgress}%` },
                  ]}
                />
                <Text style={styles.uploadProgressText}>{uploadProgress}%</Text>
              </View>
            )}
          </View>
        )}

        <View style={[styles.actions, { borderTopColor: appColors.border }]}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: appColors.backgroundSecondary },
            ]}
            onPress={handlePickImage}
            disabled={loading}
          >
            <Ionicons name="image" size={24} color={appColors.primary} />
            <Text style={[styles.actionText, { color: appColors.primary }]}>
              Thêm ảnh
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cancelButton: {
    padding: Spacing.sm,
  },
  cancelText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
  },
  postButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  postButtonDisabled: {
    backgroundColor: Colors.gray400,
  },
  postButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semiBold,
  },
  content: {
    padding: Spacing.lg,
  },
  textInput: {
    fontSize: FontSize.lg,
    lineHeight: 24,
    color: Colors.textPrimary,
    minHeight: 120,
    textAlignVertical: "top",
    marginBottom: Spacing.xl,
  },
  imageContainer: {
    position: "relative",
    marginBottom: Spacing.xl,
  },
  selectedImage: {
    width: "100%",
    height: 200,
    borderRadius: BorderRadius.sm,
    resizeMode: "cover",
  },
  removeImageButton: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    width: 32,
    height: 32,
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  actions: {
    flexDirection: "row",
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.md,
  },
  actionText: {
    fontSize: FontSize.md,
    color: Colors.primary,
    marginLeft: Spacing.sm,
  },
  uploadProgressContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: Spacing.sm,
  },
  uploadProgressBar: {
    height: 4,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xs,
  },
  uploadProgressText: {
    color: Colors.white,
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
    textAlign: "center",
  },
});

export default CreatePostScreen;
