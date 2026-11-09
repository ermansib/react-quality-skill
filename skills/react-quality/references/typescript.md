---
description: TypeScript rules for React and React Native code - strictness, type vs interface, unknown over any, discriminated unions, branded types, runtime validation
globs: '**/*.ts,**/*.tsx'
---

# TypeScript

## Compiler settings

Use the team `tsconfig` presets in `configs/tsconfig/`. They turn on `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `verbatimModuleSyntax` and `isolatedModules`. Don't loosen them per file. If something can't be typed, fix the type, not the config.

`exactOptionalPropertyTypes` is worth turning on in new projects (it stops `prop?: string` from accepting an explicit `undefined`). It is off in the shared preset because some libraries' types don't support it yet.

## Rules

- **No `any`.** Use `unknown` and narrow it with a type guard or a schema. If a library forces `any`, wrap it once in a typed helper.
- **No `@ts-ignore`.** If you must, use `@ts-expect-error` with a comment explaining the upstream bug and a tracking link, so it breaks when the error goes away.
- **No non-null assertion (`!`)** to silence an error. Handle the `undefined` case or narrow first.
- **Avoid `as` casts.** A cast is a claim the compiler can't check. Prefer `satisfies`, a type guard or a schema parse. `as const` is fine.
- **No `enum`.** Use a union of string literals or an `as const` object. Enums produce runtime code and don't work with `erasableSyntaxOnly`.
- **Type-only imports** use `import type { … }`. `verbatimModuleSyntax` enforces this.
- **Explicit return types** on exported functions and hooks that are part of a module's public API. Let TypeScript infer the rest.
- **`type` for props and most shapes.** It handles unions, intersections and mapped types, and can't be merged by accident. Use `interface` only when you need `extends` chains or declaration merging (for example augmenting a library's types). ESLint enforces `type`.
- **Export only what others need.** Internal helper types stay in the file. Exported types are part of the module's API: name them carefully and document edge cases.
- **Model states with discriminated unions**, so impossible states can't be represented.

```ts
// ❌ Booleans that can contradict each other (loading and error at once? success without data?)
type RequestState = {
  isLoading: boolean;
  error?: Error;
  data?: User;
};

// ✅ One state at a time, each carrying exactly what it needs
type RequestState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; error: Error }
  | { status: 'success'; data: T };
```

- **Discriminated unions for props** when some props only make sense together:

```ts
type ButtonProps =
  | { variant: 'primary'; onClick: () => void; href?: never }
  | { variant: 'link'; href: string; onClick?: never };
```

- **Branded types for ids** so a `PostId` can't be passed where a `UserId` is expected:

```ts
type Brand<T, B extends string> = T & { readonly __brand: B };

export type UserId = Brand<string, 'UserId'>;
export type PostId = Brand<string, 'PostId'>;

// Create branded values in one place, ideally in the schema: z.string().brand<'UserId'>()
export const toUserId = (value: string): UserId => value as UserId;
```

- **Exhaustive switches.** End a `switch` over a union with an `assertNever(value)` default so a new case is a compile error.

```ts
export function assertNever(value: never): never {
  throw new Error(`Unhandled value: ${JSON.stringify(value)}`);
}
```

## Validate at the boundary

Types disappear at runtime. Anything coming from outside the app must be parsed (Zod or Valibot): API responses, `localStorage` / `AsyncStorage`, URL and search params, deep links, `postMessage`, env vars.

```ts
import { z } from 'zod';

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  role: z.enum(['admin', 'member']),
});

export type User = z.infer<typeof userSchema>;

export async function fetchUser(id: string): Promise<User> {
  const response = await apiClient.get(`/users/${id}`);
  return userSchema.parse(response);
}
```

Derive the TypeScript type from the schema (`z.infer`) so there is one source of truth.

## React-specific typing

- Type props with a `type` named `<Component>Props`. Don't use `React.FC` (it hides the props type and gets in the way of generics); type the props parameter instead.
- No `defaultProps` on function components; put defaults in the destructuring.
- `children` is `React.ReactNode`. Use `PropsWithChildren<Props>` only if it reads better.
- Extend native element props when wrapping one: `type ButtonProps = ComponentPropsWithoutRef<'button'> & { variant: 'primary' | 'secondary' }`. On native, intersect with `PressableProps`.
- In React 19, `ref` is a normal prop. Use `ComponentPropsWithRef<'input'>` instead of `forwardRef` in new code.
- Event handlers: `React.ChangeEvent<HTMLInputElement>`, `React.FormEvent<HTMLFormElement>`; on native use the handler types from the component's props (`TextInputProps['onChangeText']`).
- Generic components are fine when the type genuinely flows through: `function Select<T>({ options, getLabel }: SelectProps<T>)`.
- Type `useState` only when the initial value doesn't describe it: `useState<User | null>(null)`.
- Type `useRef` for DOM nodes as `useRef<HTMLDivElement>(null)`.

## Utility types worth knowing

`Pick`, `Omit`, `Partial`, `Required`, `Readonly`, `Record`, `ReturnType`, `Parameters`, `Awaited`, `NonNullable`, `ComponentProps<typeof X>`. Use them to derive types from one source instead of copying fields, and don't re-implement them.
