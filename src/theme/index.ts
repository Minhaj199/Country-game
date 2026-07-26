import { DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationLightTheme } from '@react-navigation/native';
import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

import { colors } from '@/theme/colors';

type Palette = (typeof colors)[keyof typeof colors];

const createTheme = (base: MD3Theme, palette: Palette): MD3Theme => ({
  ...base,
  roundness: 5,
  colors: {
    ...base.colors,
    primary: palette.primary,
    secondary: palette.secondary,
    background: palette.background,
    surface: palette.surface,
    onSurface: palette.onSurface,
    onSurfaceVariant: palette.muted,
    outline: palette.outline,
  },
});

export const lightTheme = {
  ...createTheme(MD3LightTheme, colors.light),
  navigation: {
    ...NavigationLightTheme,
    colors: {
      ...NavigationLightTheme.colors,
      primary: colors.light.primary,
      background: colors.light.background,
      card: colors.light.surface,
      text: colors.light.onSurface,
      border: colors.light.outline,
    },
  },
};

export const darkTheme = {
  ...createTheme(MD3DarkTheme, colors.dark),
  navigation: {
    ...NavigationDarkTheme,
    colors: {
      ...NavigationDarkTheme.colors,
      primary: colors.dark.primary,
      background: colors.dark.background,
      card: colors.dark.surface,
      text: colors.dark.onSurface,
      border: colors.dark.outline,
    },
  },
};
