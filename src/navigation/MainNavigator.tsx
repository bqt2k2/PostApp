import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../contexts/AppContext";

import HomeScreen from "../screens/main/HomeScreen";
import ProfileScreen from "../screens/main/ProfileScreen";
import SettingsScreen from "../screens/main/SettingsScreen";
import CreatePostScreen from "../screens/main/CreatePostScreen";

export type MainTabParamList = {
  Home: undefined;
  Profile: undefined;
  Settings: undefined;
};

export type MainStackParamList = {
  MainTabs: undefined;
  CreatePost: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createStackNavigator<MainStackParamList>();

const MainTabs: React.FC = () => {
  const app = useApp();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          } else if (route.name === "Settings") {
            iconName = focused ? "settings" : "settings-outline";
          } else {
            iconName = "home";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: app.isDark ? "#60A5FA" : "#007AFF",
        tabBarInactiveTintColor: app.isDark ? "#6B7280" : "#6B7280",
        headerShown: false,
        tabBarStyle: {
          backgroundColor: app.isDark ? "#1F2937" : "#FFFFFF",
          borderTopColor: app.isDark ? "#374151" : "#E5E7EB",
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: app.texts?.tabHome || "Home" }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: app.texts?.tabProfile || "Profile" }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarLabel: app.texts?.tabSettings || "Settings" }}
      />
    </Tab.Navigator>
  );
};

const MainNavigator: React.FC = () => {
  const app = useApp();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: app.isDark ? "#1F2937" : "#FFFFFF",
        },
        headerTintColor: app.isDark ? "#FFFFFF" : "#000000",
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={{
          headerShown: true,
          title: app.texts?.createPost || "Create Post",
          presentation: "modal",
          headerStyle: {
            backgroundColor: app.isDark ? "#1F2937" : "#FFFFFF",
          },
          headerTintColor: app.isDark ? "#FFFFFF" : "#000000",
        }}
      />
    </Stack.Navigator>
  );
};

export default MainNavigator;
