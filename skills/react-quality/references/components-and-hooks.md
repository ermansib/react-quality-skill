---
description: Component design, props, composition, hooks and effects rules for React and React Native
globs: '**/*.tsx,**/use*.ts'
---

# Components and hooks

## Components

- **Function components only.** Class components only for an error boundary, and prefer `react-error-boundary` over writing one.
- **Named exports** (`export function UserCard`). Default exports only where a framework requires them (for example Expo Router route files or `React.lazy` targets).
- **One component per file**, except small private helpers used only by that file.
- **Never define a component inside another component.** It remounts on every render and loses its state. Move it to module scope.
- **Keep render pure.** No side effects, no mutation of props or state, no reading `Date.now()` or random values that change the output (pass them in or put them in state).
- **Split when a component does more than one job.** Signs: over ~200 lines, more than ~5 `useState` calls, deep JSX nesting, comments like `// --- header section ---`.
- **Container and view split** when it helps testing: a hook gets the data and the component renders it.
- **Composition over configuration.** Prefer `children` and slot props to a growing list of booleans.

```tsx
// ❌ Boolean props pile up
<Card showHeader showFooter headerTitle="…" footerAction={…} compact />

// ✅ Compose
<Card>
  <Card.Header title="…" />
  <Card.Body>…</Card.Body>
  <Card.Footer>…</Card.Footer>
</Card>
```

## Props

- Keep props few and specific. More than about 7 props is a hint to split or compose.
- Pass the data a component needs, not a whole object "just in case".
- Don't copy props into state. If you need to reset state when a prop changes, give the component a `key`.
- Default values go in the destructuring: `function Button({ variant = 'primary' }: ButtonProps)`.
- Spread `...rest` only onto the one element you are wrapping, and put it before props you must control.

## Lists and keys

- Keys are stable, unique ids from the data. Never use the array index for lists that can reorder, filter or insert.
- Don't generate keys during render (`crypto.randomUUID()` in JSX remounts every item every render).

## Conditional rendering

- Guard numbers explicitly: `{count > 0 && <Badge count={count} />}`, not `{count && …}` (renders `0`, and crashes on native outside `<Text>`).
- Early-return for loading, error and empty states before the main JSX.

## Hooks

- Follow the Rules of Hooks: top level only, only from components or hooks. ESLint enforces this.
- A function is a hook (named `use…`) only if it calls another hook.
- A custom hook does one thing and returns a small, typed API (an object for 3+ values, a tuple for 2).
- Put reusable stateful logic (fetching, subscriptions, form logic, media queries) in a custom hook; put stateless logic in a plain function.

## Effects

Effects are for syncing with something outside React. Before writing `useEffect`, ask whether it is really needed.

| Instead of an effect that…           | Do this                                                     |
| ------------------------------------ | ----------------------------------------------------------- |
| Computes a value from props or state | Compute it during render (memoize only if measured as slow) |
| Resets state when a prop changes     | Pass a `key` to the component                               |
| Runs logic after a user action       | Put it in the event handler                                 |
| Fetches data                         | Use TanStack Query (or the project's data layer)            |
| Notifies a parent of a state change  | Call the parent's callback in the same event handler        |
| Subscribes to an external store      | Use `useSyncExternalStore`                                  |

When an effect is right:

- List every dependency. Don't disable `react-hooks/exhaustive-deps`; restructure instead (move the function inside the effect, or use an effect event).
- Return a cleanup for subscriptions, timers, listeners and requests (`AbortController`).
- Guard against races: ignore results from stale requests.

```tsx
useEffect(() => {
  const controller = new AbortController();
  void connect(roomId, { signal: controller.signal });
  return () => controller.abort();
}, [roomId]);
```

## Memoization

- If the project uses the React Compiler, don't add `useMemo`, `useCallback` or `React.memo` by hand. The compiler does it and manual memoization gets in its way.
- Without the compiler, memoize only when you have a reason: a measured slow computation, a prop passed to a `memo` component, or a value used as an effect dependency.

## React 19 features to prefer in new code

- `ref` as a prop instead of `forwardRef`.
- Actions with `useActionState` and `useFormStatus` for form submissions; `useOptimistic` for optimistic UI.
- `use(promise)` with `Suspense` where the data layer supports it.
- `<Context>` as a provider directly instead of `<Context.Provider>`.
