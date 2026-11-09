---
description: Performance rules for React web and React Native - re-renders, memoization, code splitting, lists, images, bundle size, Web Vitals
globs: '**/*.tsx'
---

<!-- Copied from skills/react-quality by scripts/build-cursor-rules.mjs. Edit the original, not this copy. -->

# Performance

Measure first. Use the React DevTools Profiler, Chrome Performance panel and Lighthouse on web, and the React Native DevTools / Perf Monitor on native. Fix the biggest measured problem, then measure again.

## Rendering

- The most common slowdown is a re-render storm from a context that changes too often, not a missing `useMemo`. Check that first.
- Keep state as low in the tree as possible so updates re-render less.
- Use `key={id}` to reset a component when switching entities instead of syncing state in an effect.
- Split contexts by how often they change; pass selectors, not whole stores, to components.
- Memoize (`memo`, `useMemo`, `useCallback`) only when a profile shows a child re-rendering expensively because it gets new object, array or function references, or a calculation is genuinely expensive (sorting or filtering large lists). Each hook has its own cost.
- Don't create new objects or arrays in JSX props for memoized children unless the React Compiler is handling it.
- With the React Compiler on, don't add manual `useMemo` / `useCallback` / `memo`. Without it, memoize only measured hot spots or props of `memo` components.
- Use `useTransition` or `useDeferredValue` to keep typing and scrolling responsive during heavy updates.
- Debounce search inputs and other expensive reactions to typing.

## Lists

- Web: virtualize lists over about 100 rows (`@tanstack/react-virtual` or `react-window`). Never render thousands of DOM nodes.
- Native: never `.map()` a long list inside a `ScrollView`. Use `FlatList` or `FlashList` with a stable `keyExtractor`, and make `renderItem` a stable function rendering a memoized row.
- Paginate or infinite-load large data sets instead of fetching everything.

## Code splitting (web)

- Lazy-load every route: `const Settings = lazy(() => import('./features/settings/SettingsPage'))`.
- Lazy-load heavy, rarely used components (charts, editors, maps), and load below-the-fold widgets when they become visible, on hover, or when the browser is idle (`requestIdleCallback`).
- Don't split small components on the critical path; they belong in the main bundle.
- Import only what you use from large libraries (`import debounce from 'lodash-es/debounce'`).
- Keep an eye on the bundle with `rollup-plugin-visualizer`. Team budget: initial JS under 200 KB gzipped.

## Images and assets

- Web: serve modern formats (AVIF / WebP), set `width` and `height` to avoid layout shift, `loading="lazy"` and `decoding="async"` below the fold, `fetchpriority="high"` for the main hero image.
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
