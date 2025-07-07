import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { View, ActivityIndicator } from "react-native";

import AuthNavigator from "./AuthNavigator";
import MainNavigator from "./MainNavigator";
import { authService } from "../services/auth";
import { AuthState } from "../types";

const Stack = createStackNavigator();

const AppNavigator: React.FC = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    // Listen to auth state changes
    const { data: authListener } = authService.onAuthStateChange(
      (event, session) => {
        setAuthState((prev) => ({
          ...prev,
          user: session?.user || null,
          isAuthenticated: !!session?.user,
        }));
      }
    );

    // Check current user on app start
    authService.getCurrentUser().then(({ user }) => {
      setAuthState((prev) => ({
        ...prev,
        user,
        isLoading: false,
        isAuthenticated: !!user,
      }));
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  if (authState.isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {authState.isAuthenticated ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
