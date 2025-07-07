import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

import { authService } from "../../services/auth";
import { AuthStackParamList } from "../../navigation/AuthNavigator";
import { useApp } from "../../contexts/AppContext";
import { getAppColors } from "../../constants/appTheme";

type LoginScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  "Login"
>;

const LoginScreen: React.FC = () => {
  const { isDark } = useApp();
  const appColors = getAppColors(isDark);
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await authService.signIn(email, password);

      if (error) {
        Alert.alert("Lỗi đăng nhập", error.message);
      } else {
        // Navigation sẽ tự động chuyển do auth state change
        console.log("Đăng nhập thành công:", data);
      }
    } catch (error) {
      Alert.alert("Lỗi", "Đã xảy ra lỗi không mong muốn");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: appColors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: appColors.text }]}>
            Chào mừng trở lại!
          </Text>
          <Text style={[styles.subtitle, { color: appColors.textSecondary }]}>
            Đăng nhập để tiếp tục
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: appColors.text }]}>Email</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: appColors.inputBackground,
                  color: appColors.text,
                  borderColor: appColors.border,
                },
              ]}
              value={email}
              onChangeText={setEmail}
              placeholder="Nhập email của bạn"
              placeholderTextColor={appColors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: appColors.text }]}>
              Mật khẩu
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: appColors.inputBackground,
                  color: appColors.text,
                  borderColor: appColors.border,
                },
              ]}
              value={password}
              onChangeText={setPassword}
              placeholder="Nhập mật khẩu"
              placeholderTextColor={appColors.textSecondary}
              secureTextEntry
              autoComplete="password"
            />
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: appColors.primary },
              loading && styles.buttonDisabled,
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate("Register")}
          >
            <Text style={[styles.linkText, { color: appColors.textSecondary }]}>
              Chưa có tài khoản?{" "}
              <Text style={[styles.linkTextBold, { color: appColors.primary }]}>
                Đăng ký
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  form: {
    width: "100%",
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  linkButton: {
    marginTop: 20,
    alignItems: "center",
  },
  linkText: {
    fontSize: 16,
    color: "#666",
  },
  linkTextBold: {
    fontWeight: "600",
    color: "#007AFF",
  },
});

export default LoginScreen;
