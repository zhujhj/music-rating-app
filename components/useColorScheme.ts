import { useColorScheme as useRNColorScheme } from 'react-native';

// React Native's ColorSchemeName also includes 'unspecified'; treat anything
// that isn't dark as light so callers can index Colors safely.
export function useColorScheme(): 'light' | 'dark' {
  return useRNColorScheme() === 'dark' ? 'dark' : 'light';
}
