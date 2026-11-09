---
description: Error boundaries, loading/error/empty states, typed API errors and logging for React and React Native
globs: '**/*.ts,**/*.tsx'
---

<!-- Copied from skills/react-quality by scripts/build-cursor-rules.mjs. Edit the original, not this copy. -->

# Error handling

## Error boundaries

- Wrap the app root and each route or screen in an error boundary (`react-error-boundary`). A crash in one screen must not blank the whole app.
- The fallback says what happened in plain words (not just "Something went wrong") and offers a way out (retry, go back, go home).
- Reset the boundary when the user navigates (`resetKeys={[location.pathname]}`) or retries.
- Report caught errors to the monitoring tool in `onError`.
- Error boundaries don't catch errors in event handlers or async code. Handle those with `try` / `catch` or the data layer's error state.

```tsx
<ErrorBoundary FallbackComponent={ScreenError} onError={reportError} resetKeys={[pathname]}>
  <Suspense fallback={<ScreenSkeleton />}>
    <OrdersScreen />
  </Suspense>
</ErrorBoundary>
```

## The four states

Every screen or widget that loads data handles all four:

1. **Loading:** a skeleton or spinner that keeps the layout stable. Announce it to screen readers when it takes a while.
2. **Error:** a message and a retry. Never show raw error text or stack traces to users.
3. **Empty:** say there is nothing yet and what to do next.
4. **Success:** the content.

## Errors in code

- Never swallow errors: no empty `catch {}`. Handle it, rethrow it, or log it with context.
- Throw `Error` objects (or subclasses), never strings.
- Model request errors in the state union (`{ status: 'error'; error: ApiError }`) or use the query library's error state, and show them to the user; don't only log to the console.
- Narrow caught values: `catch (error: unknown)` then `if (error instanceof ApiError)`.
- Use typed error classes for expected failures (`ApiError`, `ValidationError`) so the UI can react to `status` or `code`.
- For expected failures in pure logic, return a result type instead of throwing:

```ts
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };
```

- Always handle promise rejections. ESLint's `no-floating-promises` flags unhandled ones; use `void` only for fire-and-forget calls that handle their own errors.

## Null and undefined

- Use optional chaining (`user?.address?.city`) and nullish coalescing (`value ?? fallback`) instead of `&&` chains and `||` (which also replaces `0` and `''`).
- Normalise at the boundary: default a possibly missing array with `?? []` where the data enters (API mapper, schema `.default([])`), not deep inside components.

## User feedback

- Form errors appear next to the field. Server errors that aren't tied to a field appear at the top of the form and get focus.
- Toasts are for success and non-blocking info, not for errors the user must act on.
- Offline (native and PWA): detect it (`@react-native-community/netinfo` or `navigator.onLine`) and say so instead of failing silently.

## Logging and monitoring

- Use a monitoring tool (for example Sentry) for both web and native, with source maps uploaded in CI.
- No `console.log` in committed code. Use a small `logger` module that is silent in production and forwards errors to monitoring.
- Never log tokens, passwords or personal data. Scrub them before sending events.
- Add context to reports: route or screen, user id (not email), app version, release.
