---
description: Component design, props, composition, hooks and effects rules for React and React Native
globs: '**/*.tsx,**/use*.ts'
---

<!-- Copied from skills/react-quality by scripts/build-cursor-rules.mjs. Edit the original, not this copy. -->

# Components and hooks

## Components

- **Function components only.** No class components (use `react-error-boundary` instead of writing a class boundary). No `React.FC`; annotate the props parameter. No `defaultProps`; it is deprecated for function components.
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

### Composition patterns, in order of preference

1. **`children` and named slots** (`header={<Title />}`) for layout and wrappers.
2. **Compound components** for related pieces that share state: `<Tabs><Tabs.List><Tabs.Tab /></Tabs.List><Tabs.Panels /></Tabs>`, sharing state through a private context.
3. **Custom hooks** to share behaviour without sharing markup.
4. **Render props** only for genuinely dynamic rendering a hook can't express (for example a virtualized row renderer).
5. **Polymorphic `as` prop** only for primitives that must render as different elements (`<Text as="label">`). Type it so the element's own props follow the `as` value, or use a library primitive (Radix `Slot` / `asChild`).

## Props

- **Required vs optional:** a prop is required if the component can't work without it. Make a prop optional (`?`) only when `undefined` has a sensible meaning.
- **Variants, not booleans:** one `variant: 'primary' | 'secondary' | 'ghost' | 'danger'` instead of `primary?`, `secondary?`, `ghost?`, `danger?` booleans that can be set together.
- **Props that only make sense together** use a discriminated union (see `typescript.md`).
- Keep props few and specific. More than about 7 props is a hint to split or compose.
- Pass the data a component needs, not a whole object "just in case".
- Don't copy props into state. If you need to reset state when a prop changes, give the component a `key`.
- Default values go in the destructuring: `function Button({ variant = 'primary' }: ButtonProps)`.
- Type event handler props with React's types (`React.MouseEvent<HTMLButtonElement>`, `React.ChangeEvent<HTMLInputElement>`); don't redeclare them.
- Refs: in React 19 accept `ref` as a normal prop. Use `useImperativeHandle` only when a parent genuinely must call into a child (focus, scroll, play), and expose the smallest API possible.
- Spread `...rest` only onto the one element you are wrapping, and put it before props you must control.

## Lists and keys

- Keys are stable, unique ids from the data. Never use the array index for lists that can reorder, filter or insert.
- Never generate keys during render (`Math.random()`, `Date.now()`, `crypto.randomUUID()`); every item remounts on every render.
- An index key is acceptable only for a static list that never reorders, filters or inserts.

## Conditional rendering

- Guard numbers explicitly: `{count > 0 && <Badge count={count} />}`, not `{count && …}` (renders `0`, and crashes on native outside `<Text>`).
- Early-return for loading, error and empty states before the main JSX.
- Short conditions inline (`&&` with a boolean, or a ternary); extract a component or a variable for anything longer. No nested ternaries.

## Hooks

Follow the Rules of Hooks (non-negotiable): call hooks only at the top level of a component or another hook, never inside conditions, loops or nested functions. ESLint enforces this.

### Which built-in hook

| Hook                                 | Use it for                                                                                                                  |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `useState`                           | Local values that change and affect rendering                                                                               |
| `useReducer`                         | Several related fields or complex transitions; switch when 3+ `useState` calls change together                              |
| `useRef`                             | Mutable values that must not re-render (timers, previous value) and DOM or native handles. Not a substitute for state       |
| `useEffect`                          | Syncing with an external system (see below). Most effects shouldn't exist                                                   |
| `useLayoutEffect`                    | Measuring layout before paint. Rarely; it blocks paint                                                                      |
| `useMemo` / `useCallback`            | Expensive calculations, or values passed to memoized children or hook deps. Not for cheap work, not with the React Compiler |
| `use` / `useContext`                 | Reading context, wrapped in a custom hook that throws when the provider is missing                                          |
| `useId`                              | Stable ids for label, `aria-describedby` and `aria-labelledby` links. Never for list keys                                   |
| `useTransition` / `useDeferredValue` | Keeping input responsive during expensive renders                                                                           |
| `useSyncExternalStore`               | Subscribing to an external store                                                                                            |
| `useActionState` / `useOptimistic`   | Form actions and optimistic updates (React 19)                                                                              |

### Custom hooks

- Named `use…`, and only if it calls another hook. Stateless logic is a plain function.
- One concern per hook: `useUserPermissions` doesn't also fetch the user.
- Return a value, a tuple (2 values) or an object (3+). Be consistent across the codebase.
- Make loading and error states explicit in the return type; don't swallow errors.
- Hooks with side effects clean up after themselves and accept an `AbortSignal` where they start async work.
- Put reusable stateful logic (subscriptions, form logic, media queries, debouncing) in a hook.

```ts
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(value);
    }, delayMs);
    return () => {
      clearTimeout(timer);
    };
  }, [value, delayMs]);

  return debounced;
}
```

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

- List every dependency. Restructure instead of omitting one (move the function inside the effect, or use `useEffectEvent`). If omitting one is truly intended, disable the rule for that line only, with a comment saying why. Never disable it for a file.
- Don't chain effects (effect A sets state that effect B reacts to). Combine them, or do the work in the event handler.
- Don't call `Math.random()` or `Date.now()` during render; do it in an event handler, an effect or a lazy state initializer.
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
