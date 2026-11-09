---
description: Where to keep state in React and React Native apps - local, context, stores, server state with TanStack Query, URL state, forms
globs: '**/*.ts,**/*.tsx'
---

# State and data

## Choose the smallest home

| Kind of state                                                                 | Where it lives                                                       |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| UI state used by one component (open, hover, input text)                      | `useState` / `useReducer` in that component                          |
| UI state shared by a few nearby components                                    | Lift it to the closest common parent                                 |
| Rarely changing app-wide values (theme, locale, current user, feature flags)  | React Context                                                        |
| Frequently changing client state shared across the app (cart, editor, wizard) | A store: Zustand, or Redux Toolkit if the project already uses it    |
| Data that lives on a server                                                   | TanStack Query (or RTK Query in a Redux project)                     |
| Filters, sorting, pagination, selected tab (web)                              | URL search params                                                    |
| Form fields and validation                                                    | React Hook Form + Zod, or React 19 form actions for simple forms     |
| Values that persist across launches (native)                                  | MMKV or AsyncStorage for non-sensitive data, SecureStore for secrets |

Never copy server data into a store or into `useState`. Read it from the query cache.

## Context

- One context per concern. Don't build one giant `AppContext`.
- Provide a typed hook that throws outside the provider:

```tsx
const AuthContext = createContext<AuthValue | null>(null);

export function useAuth(): AuthValue {
  const value = use(AuthContext);
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>');
  return value;
}
```

- Context re-renders every consumer when its value changes. For fast-changing values use a store with selectors instead.

## Stores (Zustand)

- One store per domain, not one global store.
- Read with selectors so components re-render only on the slice they use: `const count = useCartStore((s) => s.items.length)`.
- Keep actions in the store next to the state they change.
- Keep state serializable (no class instances, no functions in state other than actions).

## Server state (TanStack Query)

- Wrap every endpoint in a typed hook per feature (`useUser(id)`, `useUpdateUser()`); components never call `fetch` directly.
- Build query keys from a factory so invalidation is consistent:

```ts
export const userKeys = {
  all: ['users'] as const,
  detail: (id: string) => [...userKeys.all, 'detail', id] as const,
  list: (filters: UserFilters) => [...userKeys.all, 'list', filters] as const,
};
```

- Parse responses with a schema inside the query function.
- Invalidate or update the cache in the mutation's `onSuccess`; use optimistic updates for actions that should feel instant.
- Set a sensible `staleTime` per query instead of refetching everything all the time.
- Handle `isPending`, `isError` and empty data in the UI. On native, enable `refetchOnReconnect` and use `focusManager` with `AppState`.

## API layer

- One API client module (fetch wrapper or axios instance) handles base URL, auth headers, timeouts, JSON parsing and error mapping.
- Map HTTP errors to a typed `ApiError` with a status and a user-safe message.
- Feature folders own their endpoints: `features/users/api.ts`.

## Forms

- React Hook Form with `zodResolver` for anything beyond two or three fields; share the Zod schema with the API layer where possible.
- Show validation errors next to the field and link them with `aria-describedby` (web) or `accessibilityHint` (native).
- Disable the submit button while submitting and prevent double submits.
- Validate on the server too. Client validation is for user experience, not security.

## URL state (web)

- Anything a user would want to bookmark or share (filters, search, page, tab) belongs in the URL.
- Parse search params with a schema, with defaults for missing or invalid values.
