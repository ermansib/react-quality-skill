---
description: Checklist for reviewing React and React Native pull requests - correctness, types, design, state, a11y, security, performance, tests
globs: ''
---

# Code review checklist

Use this when reviewing a pull request or a diff. Report findings ordered by severity: bugs and security first, then accessibility and correctness risks, then maintainability, then style nits (mark nits as optional). For each finding give the file and line, what is wrong, and a concrete fix.

## Quick heuristics

Ask these first; they catch most problems:

- Is the type honest? Could an invalid state be expressed?
- Could this `useEffect` be a derived value or an event handler?
- Is the prop API small and orthogonal? Any boolean prop explosion?
- Can it be used by keyboard and by screen reader?
- Are errors shown to the user, not just logged to the console?
- Is there a test that would fail if this behaviour broke?
- Does the diff introduce a pattern that conflicts with an existing one?

## Correctness

- [ ] The change does what the PR says, and handles edge cases (empty, null, very long, slow network, offline).
- [ ] Loading, error and empty states are handled.
- [ ] No stale closures, race conditions or missing effect cleanups.
- [ ] No state derived by an effect that could be computed during render.
- [ ] Keys are stable ids, not indexes, for dynamic lists.
- [ ] Async errors are caught and shown or reported; no floating promises.

## Types

- [ ] No `any`, `@ts-ignore`, unchecked `as` casts or `!` assertions.
- [ ] External data (API, storage, URL, deep link) is validated with a schema.
- [ ] Union states instead of contradictory booleans; exhaustive switches.
- [ ] Props declared with `type`; no `React.FC`, `defaultProps` or `forwardRef` (React 19).

## Design and readability

- [ ] Components and functions do one thing; files and functions within size limits.
- [ ] Names say what things are and do; booleans read as questions.
- [ ] No duplicated logic that should be a hook or a utility.
- [ ] No magic numbers or strings; tokens used for styles.
- [ ] Follows the folder structure and import boundaries; no new circular imports.
- [ ] No new dependency without a good reason; no second library for an existing job.

## State and data

- [ ] State lives in the smallest sensible place.
- [ ] Server data comes from the query layer, not copied into state or a store.
- [ ] Query keys come from the key factory; mutations invalidate or update the cache.

## Accessibility

- [ ] Semantic elements (web) or roles and labels (native) on every interactive element.
- [ ] Works by keyboard with visible focus (web); touch targets at least 44×44 (native).
- [ ] Images have correct `alt` text; icon-only buttons have labels.
- [ ] Colour is not the only signal; contrast is sufficient.

## Security

- [ ] No secrets in client code or public env vars.
- [ ] No unsanitized `dangerouslySetInnerHTML`; URLs validated before use.
- [ ] Tokens stored safely (httpOnly cookies / SecureStore).
- [ ] No personal data in logs, URLs or analytics.

## Performance

- [ ] No obvious unnecessary re-renders of large trees; context split sensibly.
- [ ] New routes and heavy components are lazy-loaded (web).
- [ ] Long lists are virtualized (web) or use FlatList / FlashList (native).
- [ ] Images sized and lazy-loaded; no large library added for a small task.

## Tests

- [ ] New logic and bug fixes have tests.
- [ ] Tests check behaviour through roles and labels, not implementation details.
- [ ] Network mocked with MSW; no reliance on test order or real time.

## Housekeeping

- [ ] Lint, type check, format and tests pass in CI.
- [ ] No `console.log`, commented-out code or unexplained `eslint-disable`.
- [ ] PR is small and focused; the description explains why, with screenshots for UI changes.
- [ ] Conventional Commit messages.
