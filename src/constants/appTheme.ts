// App theme colors for dark/light mode
export const AppColors = {
  light: {
    background: '#FFFFFF',
    backgroundSecondary: '#F8F9FA',
    cardBackground: '#FFFFFF',
    text: '#212529',
    textSecondary: '#6C757D',
    border: '#DEE2E6',
    primary: '#FF6B6B',
    secondary: '#4ECDC4',
    error: '#FF4646',
    success: '#51CF66',
    warning: '#FFD43B',
    inputBackground: '#F8F9FA',
  },
  dark: {
    background: '#121212',
    backgroundSecondary: '#616161',
    cardBackground: '#1F2937',
    text: '#F3F4F6',
    textSecondary: '#9CA3AF',
    border: '#374151',
    primary: '#FF6B6B',
    secondary: '#4ECDC4',
    error: '#FF6B6B',
    success: '#69DB7C',
    warning: '#FFD43B',
    inputBackground: '#2D3748',
  },
};

export const getAppColors = (isDark: boolean) => {
  return isDark ? AppColors.dark : AppColors.light;
}; 