# Country Quest

An offline-first country flag quiz built with Expo, React Native, and TypeScript.

## Phase 1 architecture

- `App.tsx` composes the safe-area, Paper, navigation, status-bar, and theme providers.
- `src/navigation` owns the typed root stack; screens never construct navigation routes as untyped strings.
- `src/theme` is the single source for light and dark palettes and the Paper/React Navigation theme adapters.
- `src/components` contains reusable layout and game-mode card primitives.
- `src/store` contains UI state; gameplay persistence and repositories will be added with their respective phases.
- `src/assets`, `repository`, `services`, `hooks`, `utils`, and `animations` are reserved for the data and feature layers planned next.

## Run locally

```bash
npm install
npm run android
```

Use `npm run typecheck` to run the TypeScript check once dependencies are installed.

## Current scope

Phase 1 is complete: project configuration, absolute imports, typed navigation, a responsive home screen, a quiz placeholder, and a functional light/dark theme switch. Country data, flags, and game logic begin in Phase 2.
