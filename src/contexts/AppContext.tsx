import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  version,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ThemeMode = "light" | "dark";
type LanguageType = "vi" | "en";

interface AppContextType {
  theme: ThemeMode;
  language: LanguageType;
  toggleTheme: () => void;
  changeLanguage: (lang: LanguageType) => void;
  isDark: boolean;
  texts: any;
}

// Texts for multilingual support
const texts = {
  vi: {
    // Navigation
    tabHome: "Trang chủ",
    tabProfile: "Cá nhân",
    tabSettings: "Cài đặt",
    // Settings
    settings: "Cài đặt",
    darkMode: "Chế độ tối",
    darkModeDesc: "Chuyển sang giao diện tối",
    language: "Ngôn ngữ",
    vietnamese: "Tiếng Việt",
    english: "English",
    about: "Về ứng dụng",
    help: "Trợ giúp",
    privacy: "Chính sách bảo mật",
    logout: "Đăng xuất",
    logoutConfirm: "Bạn có chắc chắn muốn đăng xuất?",
    cancel: "Hủy",
    confirm: "Đăng xuất",
    interface: "Giao diện",
    version: "Phiên bản",
    termsandpolicies: "Điều khoản và chính sách",
    information: "Thông tin",
    account: "Tài khoản",
    helpDesc: "Câu hỏi thường gặp và hỗ trợ",
    logoutDesc: "Đăng xuất khỏi tài khoản",
    // Home Screen
    homeTitle: "Bảng tin",
    noPosts: "Chưa có bài viết nào",
    createFirstPost: "Tạo bài viết đầu tiên",
    errorLoadingPosts: "Không thể tải bài viết. Vui lòng thử lại.",
    unexpectedError: "Đã xảy ra lỗi không mong muốn",
    retry: "Thử lại",

    // Profile Screen
    profile: "Trang cá nhân",
    statistics: "Thống kê",
    myPosts: "Bài viết của tôi",
    posts: "Bài viết",
    likes: "Lượt thích",
    comments: "Bình luận",
    joined: "Tham gia",
    loading: "Đang tải thông tin...",
    loadingPosts: "Đang tải bài viết...",
    noPostsYet: "Chưa có bài viết nào",
    createFirstPostDesc: "Hãy tạo bài viết đầu tiên của bạn!",

    // Create Post
    createPost: "Tạo bài viết",
    post: "Đăng",
    posting: "Đang đăng...",
    whatAreYouThinking: "Bạn đang nghĩ gì?",
    addPhoto: "Thêm ảnh",

    // Comments
    commentsTitle: "Bình luận",
    writeComment: "Viết bình luận...",
    noComments: "Chưa có bình luận nào. Hãy là người đầu tiên bình luận!",

    // Auth
    welcomeBack: "Chào mừng trở lại!",
    loginToContinue: "Đăng nhập để tiếp tục",
    email: "Email",
    password: "Mật khẩu",
    enterEmail: "Nhập email của bạn",
    enterPassword: "Nhập mật khẩu",
    loggingIn: "Đang đăng nhập...",
    login: "Đăng nhập",
    noAccount: "Chưa có tài khoản?",
    register: "Đăng ký",
    createAccount: "Tạo tài khoản mới",
    registerToStart: "Đăng ký để bắt đầu",
    fullName: "Họ và tên",
    confirmPassword: "Xác nhận mật khẩu",
    enterFullName: "Nhập họ và tên",
    enterPasswordConfirm: "Nhập lại mật khẩu",
    registering: "Đang đăng ký...",
    haveAccount: "Đã có tài khoản?",

    // Alerts
    error: "Lỗi",
    success: "Thành công",
    fillAllFields: "Vui lòng nhập đầy đủ thông tin",
    passwordMismatch: "Mật khẩu xác nhận không khớp",
    passwordTooShort: "Mật khẩu phải có ít nhất 6 ký tự",
    registerSuccess: "Đăng ký thành công!",
    checkEmailConfirm: "Vui lòng kiểm tra email để xác nhận tài khoản.",
    downloadSuccess: "Đã tải hình ảnh về thiết bị",
    downloadError: "Không thể tải hình ảnh. Vui lòng thử lại sau.",
    downloadingImage: "Đang tải hình ảnh...",
    permissionDenied: "Cần cấp quyền truy cập thư viện ảnh để tải hình",
    noImageToDownload: "Không có hình ảnh để tải",
  },
  en: {
    // Navigation
    tabHome: "Home",
    tabProfile: "Profile",
    tabSettings: "Settings",
    // Settings
    settings: "Settings",
    darkMode: "Dark Mode",
    darkModeDesc: "Switch to dark interface",
    language: "Language",
    vietnamese: "Vietnamese",
    english: "English",
    about: "About App",
    help: "Help",
    privacy: "Privacy Policy",
    logout: "Logout",
    logoutConfirm: "Are you sure you want to logout?",
    cancel: "Cancel",
    confirm: "Logout",
    termsandpolicies: "Terms and Policies",
    information: "Information",
    account: "Account",
    version: "Version",
    helpDesc: "FAQ and Support",
    logoutDesc: "Logout from account",
    interface: "Interface",
    // Home Screen
    homeTitle: "Feed",
    noPosts: "No posts yet",
    createFirstPost: "Create your first post",
    errorLoadingPosts: "Unable to load posts. Please try again.",
    unexpectedError: "An unexpected error occurred",
    retry: "Retry",

    // Profile Screen
    profile: "Profile",
    statistics: "Statistics",
    myPosts: "My Posts",
    posts: "Posts",
    likes: "Likes",
    comments: "Comments",
    joined: "Joined",
    loading: "Loading...",
    loadingPosts: "Loading posts...",
    noPostsYet: "No posts yet",
    createFirstPostDesc: "Create your first post!",

    // Create Post
    createPost: "Create Post",
    post: "Post",
    posting: "Posting...",
    whatAreYouThinking: "What are you thinking?",
    addPhoto: "Add Photo",

    // Comments
    commentsTitle: "Comments",
    writeComment: "Write a comment...",
    noComments: "No comments yet. Be the first to comment!",

    // Auth
    welcomeBack: "Welcome Back!",
    loginToContinue: "Login to continue",
    email: "Email",
    password: "Password",
    enterEmail: "Enter your email",
    enterPassword: "Enter password",
    loggingIn: "Logging in...",
    login: "Login",
    noAccount: "Don't have an account?",
    register: "Register",
    createAccount: "Create New Account",
    registerToStart: "Register to get started",
    fullName: "Full Name",
    confirmPassword: "Confirm Password",
    enterFullName: "Enter your full name",
    enterPasswordConfirm: "Re-enter password",
    registering: "Registering...",
    haveAccount: "Already have an account?",

    // Alerts
    error: "Error",
    success: "Success",
    fillAllFields: "Please fill in all fields",
    passwordMismatch: "Passwords do not match",
    passwordTooShort: "Password must be at least 6 characters",
    registerSuccess: "Registration successful!",
    checkEmailConfirm: "Please check your email to confirm your account.",
    downloadSuccess: "Image saved to device",
    downloadError: "Unable to download image. Please try again later.",
    downloadingImage: "Downloading image...",
    permissionDenied: "Need permission to access photo library",
    noImageToDownload: "No image to download",
  },
};

const AppContext = createContext<AppContextType>({
  theme: "light",
  language: "vi",
  toggleTheme: () => {},
  changeLanguage: () => {},
  isDark: false,
  texts: texts.vi,
});

export const useApp = () => useContext(AppContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [language, setLanguage] = useState<LanguageType>("vi");
  const [currentTexts, setCurrentTexts] = useState(texts.vi);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    setCurrentTexts(texts[language]);
  }, [language]);

  const loadSettings = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem("@app_theme");
      const savedLanguage = await AsyncStorage.getItem("@app_language");

      if (savedTheme) setTheme(savedTheme as ThemeMode);
      if (savedLanguage) {
        setLanguage(savedLanguage as LanguageType);
        setCurrentTexts(texts[savedLanguage as LanguageType]);
      }
    } catch (error) {
      console.log("Error loading settings:", error);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = theme === "light" ? "dark" : "light";
      await AsyncStorage.setItem("@app_theme", newTheme);
      setTheme(newTheme);
    } catch (error) {
      console.log("Error saving theme:", error);
    }
  };

  const changeLanguage = async (lang: LanguageType) => {
    try {
      await AsyncStorage.setItem("@app_language", lang);
      setLanguage(lang);
      setCurrentTexts(texts[lang]);
    } catch (error) {
      console.log("Error saving language:", error);
    }
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        language,
        toggleTheme,
        changeLanguage,
        isDark: theme === "dark",
        texts: currentTexts,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
