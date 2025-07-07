import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { authService } from "../../services/auth";
import { ThemeMode, Language } from "../../types";
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

const SettingsScreen: React.FC = () => {
  const { theme, language, toggleTheme, changeLanguage, isDark, texts } =
    useApp();
  const appColors = getAppColors(isDark);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [oldLanguage, setOldLanguage] = useState<Language>(Language.VIETNAMESE);

  const handleThemeToggle = () => {
    toggleTheme();
  };

  const handleLanguageChange = (newLanguage: "vi" | "en") => {
    changeLanguage(newLanguage);
  };

  const handleLogout = async () => {
    Alert.alert(texts.logout, texts.logoutConfirm, [
      { text: texts.cancel, style: "cancel" },
      {
        text: texts.confirm,
        style: "destructive",
        onPress: async () => {
          await authService.signOut();
        },
      },
    ]);
  };

  const renderSettingItem = (
    icon: string,
    title: string,
    subtitle?: string,
    rightComponent?: React.ReactNode,
    onPress?: () => void
  ) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon as any} size={24} color={appColors.primary} />
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, { color: appColors.text }]}>
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[
                styles.settingSubtitle,
                { color: appColors.textSecondary },
              ]}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {rightComponent}
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: appColors.backgroundSecondary },
      ]}
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
        <Text style={[styles.headerTitle, { color: appColors.text }]}>
          {texts.settings}
        </Text>
      </View>

      <View style={styles.content}>
        <View
          style={[
            styles.section,
            { backgroundColor: appColors.cardBackground },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: appColors.text }]}>
            {texts.interface}
          </Text>
          {renderSettingItem(
            isDark ? "moon" : "sunny",
            texts.darkMode,
            texts.darkModeDesc,
            <Switch
              value={isDark}
              onValueChange={handleThemeToggle}
              trackColor={{ false: "#767577", true: appColors.primary }}
              thumbColor={isDark ? "#fff" : "#f4f3f4"}
            />
          )}
        </View>

        <View
          style={[
            styles.section,
            { backgroundColor: appColors.cardBackground },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: appColors.text }]}>
            {texts.language}
          </Text>
          {renderSettingItem(
            "language",
            texts.vietnamese,
            "Vietnamese",
            language === "vi" && (
              <Ionicons name="checkmark" size={24} color={appColors.primary} />
            ),
            () => handleLanguageChange("vi")
          )}
          {renderSettingItem(
            "language",
            texts.english,
            "English",
            language === "en" && (
              <Ionicons name="checkmark" size={24} color={appColors.primary} />
            ),
            () => handleLanguageChange("en")
          )}
        </View>

        <View
          style={[
            styles.section,
            { backgroundColor: appColors.cardBackground },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: appColors.text }]}>
            {texts.information}
          </Text>
          {renderSettingItem(
            "information-circle",
            texts.about,
            texts.version + " 1.0.0",
            <Ionicons
              name="chevron-forward"
              size={20}
              color={appColors.textSecondary}
            />
          )}
          {renderSettingItem(
            "help-circle",
            texts.help,
            texts.helpDesc,
            <Ionicons
              name="chevron-forward"
              size={20}
              color={appColors.textSecondary}
            />
          )}
          {renderSettingItem(
            "shield-checkmark",
            texts.privacy,
            texts.termsandpolicies,
            <Ionicons
              name="chevron-forward"
              size={20}
              color={appColors.textSecondary}
            />
          )}
        </View>

        <View
          style={[
            styles.section,
            { backgroundColor: appColors.cardBackground },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: appColors.text }]}>
            {texts.account}
          </Text>
          {renderSettingItem(
            "log-out",
            texts.logout,
            texts.logoutDesc,
            null,
            handleLogout
          )}
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
    padding: Spacing.lg,
    borderBottomWidth: 1,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    textAlign: "center",
  },
  content: {
    padding: Spacing.lg,
  },
  section: {
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    padding: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingText: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  settingTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  settingSubtitle: {
    fontSize: FontSize.sm,
    marginTop: 2,
  },
});

export default SettingsScreen;
