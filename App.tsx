import React from "react";
import { StatusBar } from "expo-status-bar";
import "react-native-url-polyfill/auto";
import AppNavigator from "./src/navigation/AppNavigator";
import ErrorBoundary from "./src/components/ErrorBoundary";
import { AppProvider } from "./src/contexts/AppContext";

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppNavigator />
        <StatusBar style="auto" />
      </AppProvider>
    </ErrorBoundary>
  );
}
