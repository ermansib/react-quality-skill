---
description: Performance rules for React web and React Native - re-renders, memoization, code splitting, lists, images, bundle size, Web Vitals
globs: '**/*.tsx'
---

# Performance

Measure first. Use the React DevTools Profiler, Chrome Performance panel and Lighthouse on web, and the React Native DevTools / Perf Monitor on native. Fix the biggest measured problem, then measure again.

## Rendering

- Keep state as low in the tree as possible so updates re-render less.
- Split contexts by how often they change; use store selectors for fast-changing state.
- Don't create new objects or arrays in JSX props for memoized children unless the React Compiler is handling it.
- With the React Compiler on, don't add manual `useMemo` / `useCallback` / `memo`. Without it, memoize only measured hot spots or props of `memo` components.
- Use `useTransition` or `useDeferredValue` to keep typing and scrolling responsive during heavy updates.
- Debounce search inputs and other expensive reactions to typing.

## Lists

- Web: virtualize lists over about 100 rows (`@tanstack/react-virtual`).
- Native: never `.map()` a long list inside a `ScrollView`. Use `FlatList` or `FlashList` with a stable `keyExtractor`, and make `renderItem` a stable function rendering a memoized row.
- Paginate or infinite-load large data sets instead of fetching everything.

## Code splitting (web)

- Lazy-load every route: `const Settings = lazy(() => import('./features/settings/SettingsPage'))`.
- Lazy-load heavy, rarely used components (charts, editors, maps).
- Import only what you use from large libraries (`import debounce from 'lodash-es/debounce'`).
- Keep an eye on the bundle with `rollup-plugin-visualizer`. Team budget: initial JS under 200 KB gzipped.

## Images and assets

- Web: serve modern formats (AVIF / WebP), set `width` and `height` to avoid layout shift, `loading="lazy"` below the fold, `fetchpriority="high"` for the main hero image.
- Native: use `expo-image` (caching, placeholders) and request images sized for the device.
- Load fonts with `font-display: swap` (web) or `expo-font` before hiding the splash screen (native).

## Data

- Cache server data with TanStack Query; set `staleTime` so screens don't refetch on every mount.
- Prefetch the next likely screen's data on hover (web) or on focus (native).
- Cancel requests that are no longer needed (`AbortController`, which TanStack Query passes as `signal`).

## Web Vitals targets

| Metric                    | Target   |
| ------------------------- | -------- |
| Largest Contentful Paint  | ≤ 2.5 s  |
| Interaction to Next Paint | ≤ 200 ms |
| Cumulative Layout Shift   | ≤ 0.1    |

Track them in production with the `web-vitals` package or your monitoring tool.

## Native specifics

- Use Hermes (the default) and the New Architecture.
- Run animations and gestures on the UI thread with Reanimated and Gesture Handler, not with `setState` on every frame.
- Defer non-critical work until after interactions and navigation transitions.
- Keep the JS bundle small: avoid large web-only libraries, check with `npx expo export` and a source-map explorer.
- Test performance on a low-end Android device in a release build, not in debug mode.
