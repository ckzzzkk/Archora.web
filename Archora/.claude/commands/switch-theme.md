# /switch-theme

Switch the app colour theme.

## Usage
```
/switch-theme [theme]
```
Themes: `drafting` | `blueprint` | `sketchbook` | `studio` | `night_shift` | `copper`

## What this does
1. Calls `useTheme().setTheme(themeName)`
2. Theme is persisted to MMKV
3. All components re-render with new palette via `useTheme()` hook

## Key files
- `src/theme/colors.ts` — `COLOR_THEMES` map
- `src/hooks/useTheme.ts` — `setTheme`, `colors`
- `src/screens/account/ThemeCustomiserScreen.tsx`
