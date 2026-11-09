---
description: Testing rules for React and React Native - Vitest/Jest, Testing Library, MSW, Playwright, Maestro, coverage
globs: '**/*.test.ts,**/*.test.tsx,**/*.spec.ts,**/*.spec.tsx,e2e/**'
---

# Testing

## Tools

| Layer              | Web (Vite)                                                     | Native (Expo)                                            |
| ------------------ | -------------------------------------------------------------- | -------------------------------------------------------- |
| Unit and component | Vitest + React Testing Library + `@testing-library/user-event` | Jest (`jest-expo` preset) + React Native Testing Library |
| Network mocking    | MSW                                                            | MSW (`msw/native`)                                       |
| End to end         | Playwright                                                     | Maestro (or Detox)                                       |
| Accessibility      | `vitest-axe`, `@axe-core/playwright`                           | RNTL role queries, manual screen reader checks           |

## What to test

- **Pure functions and hooks with logic:** unit tests with edge cases.
- **Components:** what the user sees and does. Render, interact, assert on the result.
- **Feature flows:** integration tests that render a screen with providers and MSW handlers, covering success, error and empty responses.
- **Critical journeys** (sign in, checkout, onboarding): a few E2E tests against a real build.
- **Bug fixes:** add a test that fails without the fix.

Don't test implementation details: internal state, private functions, which hook was called, CSS class names, snapshot dumps of large trees.

## Writing tests

- Arrange, act, assert. One behaviour per test, named as a sentence: `it('shows an error when the email is invalid')`.
- Query in this order: `getByRole` (with `name`), `getByLabelText`, `getByPlaceholderText`, `getByText`, then `getByTestId` as a last resort.
- Use `userEvent` (web) or `userEvent` from RNTL (native), not `fireEvent`, for user interactions.
- Use `findBy…` or `waitFor` for async UI; never `sleep`.
- Mock at the network boundary with MSW. Don't mock your own modules or hooks unless there's no other way.
- Render with the same providers the app uses through a shared `renderWithProviders` helper. Give each test a fresh `QueryClient` with `retry: false`.
- Keep test data in small factories (`buildUser({ role: 'admin' })`) instead of large shared fixtures.
- Reset mocks, timers and MSW handlers after each test.

```tsx
it('lets the user follow someone', async () => {
  const user = userEvent.setup();
  const onFollow = vi.fn();
  render(<UserCard user={buildUser({ id: 'u1', name: 'Ada' })} onFollow={onFollow} />);

  await user.click(screen.getByRole('button', { name: 'Follow Ada' }));

  expect(onFollow).toHaveBeenCalledWith('u1');
});
```

## Coverage

- Team floor: 80% lines and branches on new and changed code. Coverage is a signal, not the goal; don't write assertion-free tests to reach it.
- Exclude generated code, type-only files, stories and config from coverage.

## E2E

- Run against a production build (web: `vite build && vite preview`; native: a release build or an EAS preview build).
- Use roles and accessible names (Playwright `getByRole`) or `testID` (Maestro / Detox) as selectors.
- Seed and clean test data through an API, not through the UI.
- Keep E2E tests few and focused on critical paths; they are slow and flaky by nature.

## CI

- Unit and component tests run on every pull request and must pass before merge.
- E2E tests run on pull requests to `main` or nightly, depending on their run time.
- A flaky test gets fixed or removed within a sprint; never retry it silently.
