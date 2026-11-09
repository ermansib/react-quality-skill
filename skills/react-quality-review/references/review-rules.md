---
description: Rule catalogue for reviewing React and React Native code - every checkable react-quality rule with an id, default severity and how to detect it
globs: ''
---

# Review rule catalogue

Every rule from the react-quality skill that a reviewer can check, with an id to cite in findings. Each section names its source file in `rules/`, which has the reasons and examples.

**Detect** says how to find a violation:

- `scan`: `scripts/scan.mjs` flags it. Confirm each hit by reading the line.
- `lint`: the team ESLint config reports it. If the project doesn't use the team config, check it by hand.
- `read`: needs judgement. Read the code.

**Severity** is the default: B = blocker, M = major, m = minor, n = nit. Adjust it for the case and say why.

## Quick heuristics

Ask these on every change before going rule by rule:

- Is the type honest? Could an invalid state be expressed?
- Could this `useEffect` be a derived value or an event handler?
- Is the prop API small and orthogonal? Any boolean prop explosion?
- Can it be used by keyboard and by screen reader?
- Are errors shown to the user, not just logged to the console?
- Is there a test that would fail if this behaviour broke?
- Does the diff introduce a pattern that conflicts with an existing one?

## Types (TS)

Source: `rules/typescript.md`

| ID    | Check                                                                                                             | Sev | Detect     |
| ----- | ----------------------------------------------------------------------------------------------------------------- | --- | ---------- |
| TS-01 | No `any` (explicit, `as any`, `any[]`, `<any>`). Use `unknown` and narrow.                                        | M   | scan, lint |
| TS-02 | No `@ts-ignore`. `@ts-expect-error` only with a reason and tracking link.                                         | M   | scan, lint |
| TS-03 | No non-null assertion `!` to silence the compiler. Handle `undefined` or narrow.                                  | M   | scan, lint |
| TS-04 | No unchecked `as` casts. Use `satisfies`, a type guard or a schema. `as const` is fine.                           | m   | scan       |
| TS-05 | No `enum`. Use a string literal union or an `as const` object.                                                    | m   | scan, lint |
| TS-06 | Type-only imports use `import type`.                                                                              | n   | lint       |
| TS-07 | Props and most shapes use `type`; `interface` only for `extends` chains or declaration merging.                   | m   | scan, lint |
| TS-08 | No `I` / `T` prefixes on type names (`User`, not `IUser`).                                                        | n   | scan, lint |
| TS-09 | Exported functions and hooks that form a module's API have explicit return types.                                 | m   | read       |
| TS-10 | States with distinct cases use discriminated unions, not contradicting booleans (`isLoading` + `error` + `data`). | M   | read       |
| TS-11 | Props that only make sense together use a discriminated union (`href` xor `onClick`).                             | m   | read       |
| TS-12 | Ids that can be confused (`UserId` vs `PostId`) are branded types.                                                | m   | read       |
| TS-13 | Data crossing a boundary (API, storage, URL, deep link, `postMessage`) is validated with a schema.                | M   | read       |
| TS-14 | `switch` on a union is exhaustive (`never` check in `default`).                                                   | m   | lint, read |
| TS-15 | tsconfig strictness not loosened (`strict`, `noUncheckedIndexedAccess` and the rest stay on).                     | M   | read       |
| TS-16 | Only types other modules need are exported.                                                                       | n   | read       |

## Components (CMP)

Source: `rules/components-and-hooks.md`

| ID     | Check                                                                                                                   | Sev | Detect     |
| ------ | ----------------------------------------------------------------------------------------------------------------------- | --- | ---------- |
| CMP-01 | Function components only; no class components (use `react-error-boundary` for boundaries).                              | M   | scan       |
| CMP-02 | No `React.FC` / `FC`; annotate the props parameter.                                                                     | m   | scan, lint |
| CMP-03 | No `defaultProps`; defaults go in destructuring.                                                                        | m   | scan, lint |
| CMP-04 | Named exports. Default exports only where a framework requires them (Expo Router routes, `lazy` targets, config files). | m   | scan, lint |
| CMP-05 | Never define a component inside another component.                                                                      | M   | lint, read |
| CMP-06 | Render is pure: no side effects, no mutating props or state, no `Date.now()` / `Math.random()` in render.               | M   | lint, read |
| CMP-07 | List keys are stable ids from the data; no index keys on lists that reorder, filter or insert.                          | M   | scan, lint |
| CMP-08 | No keys generated during render (`Math.random()`, `Date.now()`, `crypto.randomUUID()`).                                 | B   | scan       |
| CMP-09 | Numbers guarded in conditional rendering (`count > 0 && …`, not `count && …`).                                          | M   | scan, lint |
| CMP-10 | No nested ternaries in JSX; early return for loading, error and empty states.                                           | m   | lint, read |
| CMP-11 | One job per component; over ~200 lines or more than ~5 `useState` calls is a signal to split.                           | m   | scan, read |
| CMP-12 | One component per file, except small private helpers.                                                                   | n   | read       |
| CMP-13 | Variant union instead of several boolean style props (`primary`, `ghost`, `danger`).                                    | m   | read       |
| CMP-14 | Props are few and specific (more than ~7 is a hint to split); pass what's needed, not whole objects.                    | n   | read       |
| CMP-15 | Props not copied into state; reset with `key` instead.                                                                  | M   | read       |
| CMP-16 | Event handler props typed with React's event types, not redeclared.                                                     | n   | read       |
| CMP-17 | React 19: `ref` as a prop, no `forwardRef` (unless supporting React 18).                                                | m   | scan       |
| CMP-18 | React 19: `<Context>` as the provider, not `<Context.Provider>`.                                                        | n   | scan       |
| CMP-19 | `...rest` spread only onto the wrapped element, before controlled props.                                                | n   | read       |
| CMP-20 | `useImperativeHandle` only when a parent must call into a child, with the smallest API.                                 | m   | read       |

## Hooks and effects (HK)

Source: `rules/components-and-hooks.md`

| ID    | Check                                                                                                       | Sev | Detect     |
| ----- | ----------------------------------------------------------------------------------------------------------- | --- | ---------- |
| HK-01 | Rules of Hooks: no hooks in conditions, loops or after early returns.                                       | B   | lint       |
| HK-02 | Effect dependency arrays complete; any `eslint-disable` for `exhaustive-deps` has a reason.                 | M   | lint, scan |
| HK-03 | No fetching in a raw `useEffect`; use the server-state library (TanStack Query).                            | M   | scan, read |
| HK-04 | No effect that only derives state from props or state; compute it during render.                            | M   | lint, read |
| HK-05 | No chained effects (effect A sets state that effect B reacts to).                                           | M   | read       |
| HK-06 | Effects that subscribe, listen, time or request return a cleanup (`AbortController` for requests).          | M   | read       |
| HK-07 | Async effects guard against races (ignore stale results).                                                   | M   | read       |
| HK-08 | Custom hooks are named `use…` and call another hook; otherwise a plain function.                            | m   | read       |
| HK-09 | One concern per hook; loading and error states explicit in the return type.                                 | m   | read       |
| HK-10 | 3+ `useState` calls that change together become `useReducer`.                                               | m   | read       |
| HK-11 | No manual `useMemo` / `useCallback` / `memo` when the React Compiler is on; without it, only with a reason. | m   | scan, read |
| HK-12 | Forms use Actions / `useActionState` / `useFormStatus` in new React 19 code where it fits.                  | n   | read       |

## State and data (ST)

Source: `rules/state-and-data.md`

| ID    | Check                                                                                               | Sev | Detect |
| ----- | --------------------------------------------------------------------------------------------------- | --- | ------ |
| ST-01 | State lives in the smallest sensible home (local, lifted, composition, context, store).             | m   | read   |
| ST-02 | Server data lives in the query cache, not copied into `useState`, Redux or Zustand.                 | M   | read   |
| ST-03 | Components never call `fetch` / axios directly; each endpoint has a typed hook per feature.         | M   | scan   |
| ST-04 | Query keys come from a key factory; mutations invalidate or update the cache.                       | m   | read   |
| ST-05 | Responses parsed with a schema inside the query function.                                           | M   | read   |
| ST-06 | One context per concern, with a typed hook that throws outside the provider; no giant `AppContext`. | m   | read   |
| ST-07 | Contexts split by update frequency; stores read with selectors.                                     | m   | read   |
| ST-08 | One store per domain; actions next to the state; state serializable.                                | m   | read   |
| ST-09 | One API client handles base URL, auth, timeouts and maps errors to a typed `ApiError`.              | m   | read   |
| ST-10 | Forms beyond 2–3 fields use React Hook Form + Zod; submit disabled while submitting.                | m   | read   |
| ST-11 | Web: shareable state (filters, search, page, tab) lives in the URL, parsed with a schema.           | m   | read   |
| ST-12 | No second library added for a job one already does (state, dates, forms, styling, fetching).        | M   | read   |

## Project structure (STR)

Source: `rules/project-structure.md`

| ID     | Check                                                                                                                                                                                                                                | Sev | Detect     |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --- | ---------- |
| STR-01 | Feature-based layout; files go in the matching feature or shared folder.                                                                                                                                                             | m   | read       |
| STR-02 | No imports of another feature's internals; only its `index.ts`.                                                                                                                                                                      | M   | scan       |
| STR-03 | Shared folders (`components`, `hooks`, `lib`, `utils`) never import from `features/`.                                                                                                                                                | M   | scan       |
| STR-04 | No circular imports.                                                                                                                                                                                                                 | M   | lint       |
| STR-05 | `@/` alias outside the current feature; relative imports inside it.                                                                                                                                                                  | n   | read       |
| STR-06 | Barrels only at the feature level, exporting the public API.                                                                                                                                                                         | n   | read       |
| STR-07 | Env vars read in one module (`lib/env.ts`) that parses them with a schema.                                                                                                                                                           | m   | scan, lint |
| STR-08 | Files ≤ 300 lines, functions ≤ 120, complexity ≤ 10, nesting ≤ 4 (tests excluded).                                                                                                                                                   | m   | scan, lint |
| STR-09 | Naming: `PascalCase` components and types, `useCamelCase` hooks, `camelCase` functions (verbs) and values (nouns), `UPPER_SNAKE_CASE` constants, booleans `is/has/can/should`, `on*` props and `handle*` handlers, file names match. | m   | lint, read |
| STR-10 | No magic numbers or strings in logic; named constants or design tokens.                                                                                                                                                              | m   | read       |

## Error handling (ERR)

Source: `rules/error-handling.md`

| ID     | Check                                                                                                                  | Sev | Detect                                                 |
| ------ | ---------------------------------------------------------------------------------------------------------------------- | --- | ------------------------------------------------------ |
| ERR-01 | Every async screen handles loading, error, empty and success.                                                          | M   | read                                                   |
| ERR-02 | App root and each route or screen wrapped in an error boundary with a clear message and a way out (retry, back, home). | M   | read                                                   |
| ERR-03 | No empty `catch {}`; handle, rethrow or log with context.                                                              | M   | scan                                                   |
| ERR-04 | Throw `Error` objects, never strings.                                                                                  | m   | scan, lint                                             |
| ERR-05 | Caught values narrowed (`catch (error: unknown)` + `instanceof`); typed error classes for expected failures.           | m   | read                                                   |
| ERR-06 | No floating promises; `void` only for fire-and-forget calls that handle their own errors.                              | M   | lint                                                   |
| ERR-07 | Errors shown to the user, not only logged to the console.                                                              | M   | read                                                   |
| ERR-08 | `?.` and `??` instead of `&&` chains and `                                                                             |     | ` defaults; missing arrays normalised at the boundary. | m   | lint, read |
| ERR-09 | No `console.log` / `console.debug` / `console.info` in shipped code; use the logger.                                   | m   | scan, lint                                             |
| ERR-10 | Toasts not used for errors the user must act on; form errors next to the field.                                        | m   | read                                                   |
| ERR-11 | Offline state detected and shown (native, PWA).                                                                        | m   | read                                                   |

## Performance (PERF)

Source: `rules/performance.md`

| ID      | Check                                                                                                           | Sev | Detect     |
| ------- | --------------------------------------------------------------------------------------------------------------- | --- | ---------- |
| PERF-01 | No re-render storms from a frequently changing context high in the tree.                                        | M   | read       |
| PERF-02 | Memoization only for measured hot spots or `memo` children (or none with the React Compiler).                   | m   | read       |
| PERF-03 | Web: every route lazy-loaded; heavy, rarely used components (charts, editors, maps) lazy-loaded.                | m   | read       |
| PERF-04 | Web: lists over ~100 rows virtualized.                                                                          | M   | read       |
| PERF-05 | Native: no `ScrollView` + `.map()` for data that can grow; `FlatList` / `FlashList` with stable `keyExtractor`. | M   | scan, read |
| PERF-06 | Only what's used is imported from large libraries; no large library for a small job.                            | m   | read       |
| PERF-07 | Web images: `width` / `height` set, `loading="lazy"` below the fold, modern formats.                            | m   | read       |
| PERF-08 | Search inputs debounced; `useTransition` / `useDeferredValue` for heavy updates while typing.                   | m   | read       |
| PERF-09 | Large data sets paginated; unneeded requests cancelled; sensible `staleTime`.                                   | m   | read       |
| PERF-10 | Native: animations and gestures on the UI thread (Reanimated, Gesture Handler), not `setState` per frame.       | M   | read       |

## Accessibility (A11Y)

Source: `rules/accessibility.md`

| ID      | Check                                                                                                                                     | Sev | Detect     |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --- | ---------- |
| A11Y-01 | Web: semantic elements; no `onClick` on `<div>` / `<span>`; `<a href>` for navigation.                                                    | M   | scan, lint |
| A11Y-02 | Every interactive element has an accessible name (text, `<label>`, `aria-label` for icon-only).                                           | M   | lint, read |
| A11Y-03 | Images have meaningful `alt`, or `alt=""` when decorative; decorative icons `aria-hidden`.                                                | M   | scan, lint |
| A11Y-04 | Focus always visible; no `outline: none` without a replacement.                                                                           | M   | scan       |
| A11Y-05 | No positive `tabIndex`.                                                                                                                   | m   | scan, lint |
| A11Y-06 | Buttons that don't submit have `type="button"`.                                                                                           | n   | scan       |
| A11Y-07 | Dialogs: label, `aria-modal`, focus trap, Escape to close, focus returned (prefer a tested library).                                      | M   | read       |
| A11Y-08 | Ids for label / description links come from `useId`.                                                                                      | m   | read       |
| A11Y-09 | Error and help text linked with `aria-describedby`; invalid fields `aria-invalid`.                                                        | m   | read       |
| A11Y-10 | Async results announced (`role="status"` / `aria-live`); loading regions `aria-busy`.                                                     | m   | read       |
| A11Y-11 | Colour not the only signal; contrast 4.5:1 text, 3:1 large text and UI.                                                                   | m   | read       |
| A11Y-12 | Native: touchables have `accessibilityRole` and a label when there's no visible text; `accessibilityState` for disabled/selected/checked. | M   | read       |
| A11Y-13 | Touch targets at least 44×44 (`hitSlop` for small icons).                                                                                 | m   | read       |
| A11Y-14 | Native: font scaling not disabled (`allowFontScaling={false}`).                                                                           | m   | scan       |
| A11Y-15 | Reduced motion respected; headings marked (`accessibilityRole="header"` on native).                                                       | m   | read       |

## Security (SEC)

Source: `rules/security.md`

| ID     | Check                                                                                                                       | Sev | Detect     |
| ------ | --------------------------------------------------------------------------------------------------------------------------- | --- | ---------- |
| SEC-01 | No secrets in client code or `VITE_*` / `EXPO_PUBLIC_*` vars; `.env` with real values not committed.                        | B   | scan, read |
| SEC-02 | No `dangerouslySetInnerHTML` without DOMPurify in a shared helper.                                                          | B   | scan, lint |
| SEC-03 | Web: no tokens in `localStorage` / `sessionStorage`. Native: tokens in SecureStore, not `AsyncStorage` / MMKV.              | B   | scan       |
| SEC-04 | No `eval`, `new Function`, or `setTimeout` / `setInterval` with a string.                                                   | B   | scan, lint |
| SEC-05 | URLs validated before use in `href`, `src`, `Linking.openURL`; no `javascript:` / `data:`.                                  | B   | scan, read |
| SEC-06 | `target="_blank"` links have `rel="noopener noreferrer"`.                                                                   | m   | scan, lint |
| SEC-07 | Personal data and tokens not in URLs, logs, analytics or error reports.                                                     | M   | read       |
| SEC-08 | `postMessage` handlers check `event.origin`; deep links validated and can't trigger sensitive actions without confirmation. | M   | read       |
| SEC-09 | Tokens and cached user data (including the query cache) cleared on logout.                                                  | M   | read       |
| SEC-10 | Hidden UI isn't treated as authorization; the server checks.                                                                | M   | read       |
| SEC-11 | New dependencies are maintained and justified; lockfile committed; GitHub Actions pinned.                                   | m   | read       |
| SEC-12 | Native: no cleartext HTTP exceptions; no sensitive `__DEV__` paths; permissions asked only when needed.                     | M   | read       |

## Testing (TEST)

Source: `rules/testing.md`

| ID      | Check                                                                                              | Sev | Detect     |
| ------- | -------------------------------------------------------------------------------------------------- | --- | ---------- |
| TEST-01 | New logic ships with a colocated test; bug fixes have a test that failed before the fix.           | M   | read       |
| TEST-02 | Tests check behaviour; queries by role and label first, `getByTestId` last.                        | m   | scan, lint |
| TEST-03 | `userEvent`, not `fireEvent`, for interactions.                                                    | m   | scan, lint |
| TEST-04 | Async UI uses `findBy…` / `waitFor`, never sleeps or fixed timeouts.                               | m   | read       |
| TEST-05 | Network mocked with MSW; own modules and hooks not mocked without need.                            | m   | read       |
| TEST-06 | No focused or skipped tests (`.only`, `.skip`) committed.                                          | M   | scan       |
| TEST-07 | Edge cases covered: empty, error, long text, loading → success and loading → error.                | m   | read       |
| TEST-08 | One behaviour per test, named as a sentence; fresh `QueryClient` with `retry: false`; mocks reset. | n   | read       |
| TEST-09 | Coverage floor 80% lines and branches on new code, without assertion-free tests.                   | m   | read       |
| TEST-10 | Web components get an axe check (`vitest-axe` / `jest-axe`).                                       | m   | read       |

## Web with Vite (WEB)

Source: `rules/web-vite.md`

| ID     | Check                                                                                                               | Sev | Detect     |
| ------ | ------------------------------------------------------------------------------------------------------------------- | --- | ---------- |
| WEB-01 | Env vars typed in `vite-env.d.ts` and parsed once in `lib/env.ts`; only `VITE_*` reach the client.                  | m   | read       |
| WEB-02 | `@/` alias defined in tsconfig `paths` and mirrored in `vite.config.ts`.                                            | n   | read       |
| WEB-03 | Each route has an error element and a loading fallback; document title set per route.                               | m   | read       |
| WEB-04 | Styling approach consistent; design tokens, no hard-coded hex colours in components; `clsx` / `cn` for class names. | m   | scan, read |
| WEB-05 | Browser-only APIs guarded (`typeof window !== 'undefined'`) where code runs in tests or SSR.                        | m   | read       |
| WEB-06 | `npm run build` runs `tsc -b` first; bundle size checked; source maps not served publicly.                          | m   | read       |

## React Native with Expo (RN)

Source: `rules/react-native.md`

| ID    | Check                                                                                                               | Sev | Detect     |
| ----- | ------------------------------------------------------------------------------------------------------------------- | --- | ---------- |
| RN-01 | All text inside `<Text>`; conditional numbers guarded (crash otherwise).                                            | B   | lint, read |
| RN-02 | `Pressable`, not `Touchable*`, with a role, label, pressed style and 44×44 hit area.                                | m   | scan, lint |
| RN-03 | `expo-image`, not React Native's `Image`, for remote images.                                                        | m   | scan, lint |
| RN-04 | Styles via `StyleSheet.create` or the project's styling library; no inline styles or colour literals; theme tokens. | m   | lint       |
| RN-05 | Safe areas respected (`react-native-safe-area-context`); keyboard handled on forms.                                 | m   | read       |
| RN-06 | Platform differences via `Platform.select` or `.ios.tsx` / `.android.tsx` with the same props.                      | n   | read       |
| RN-07 | Route params typed (typed routes in Expo Router); deep link params validated.                                       | M   | read       |
| RN-08 | Lists: stable `keyExtractor`, memoized row, `renderItem` outside JSX, `getItemLayout` / `estimatedItemSize`.        | m   | read       |
| RN-09 | Subscriptions (location, sensors, `AppState`, `Keyboard`, `Linking`) cleaned up.                                    | M   | read       |
| RN-10 | Native packages installed with `npx expo install`; config in typed `app.config.ts` when env-driven.                 | n   | read       |
| RN-11 | Permission denied and "don't ask again" handled with a path to Settings.                                            | m   | read       |

## Housekeeping (HYG)

Source: `rules/core.md`

| ID     | Check                                                                                     | Sev | Detect     |
| ------ | ----------------------------------------------------------------------------------------- | --- | ---------- |
| HYG-01 | Type check, ESLint (0 warnings), Prettier and tests pass.                                 | B   | gates      |
| HYG-02 | No `eslint-disable` without a `--` reason; never file-wide without one.                   | m   | scan, lint |
| HYG-03 | No commented-out code.                                                                    | n   | read       |
| HYG-04 | User-facing strings go through the i18n layer when the project has one.                   | m   | read       |
| HYG-05 | PR is small and focused, with a description that says why and screenshots for UI changes. | n   | read       |
| HYG-06 | Conventional Commit messages (`feat:`, `fix:`, `refactor:` …).                            | n   | read       |
| HYG-07 | No new dependency without asking; `npm audit --audit-level=high` clean.                   | m   | read       |
| GEN    | Something is wrong that no rule above covers. Explain the impact.                         | —   | read       |
