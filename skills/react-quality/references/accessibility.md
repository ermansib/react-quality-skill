---
description: Accessibility (a11y) rules for React web (WCAG 2.2 AA) and React Native - semantics, labels, keyboard, focus, screen readers, touch targets
globs: '**/*.tsx'
---

# Accessibility

Target WCAG 2.2 level AA on web and the equivalent on native. `eslint-plugin-jsx-a11y` catches some issues on web; the rest needs manual checks with a keyboard and a screen reader (VoiceOver, TalkBack, NVDA).

## Web

### Semantics first

- Use the right element: `<button>` for actions, `<a href>` for navigation, `<label>` for inputs, headings in order, `<nav>`, `<main>`, `<header>`, `<footer>`, lists for lists, `<table>` for tabular data.
- Never put `onClick` on a `<div>` or `<span>`. If you think you need to, you need a `<button>`.
- Use ARIA only when no native element does the job, and follow the WAI-ARIA Authoring Practices pattern for that widget. No ARIA is better than wrong ARIA.
- Set `type="button"` on buttons that don't submit a form.
- Set the page `<title>` and `lang` attribute; update the title on route change.

### Names and descriptions

- Every interactive element has an accessible name: visible text, a `<label>`, or `aria-label` for icon-only buttons.
- Images: meaningful `alt` text; `alt=""` for decorative images.
- Icons: `aria-hidden="true"` when decorative; otherwise give the icon or its button an `aria-label`.
- Generate ids for label and description links with `useId`, never by hand.
- Link text makes sense out of context ("View invoice 1042", not "Click here").
- Link error and help text to inputs with `aria-describedby`; mark invalid fields with `aria-invalid`.

### Keyboard and focus

- Everything works with a keyboard: Tab, Shift+Tab, Enter, Space, Escape, arrow keys inside composite widgets.
- Focus is always visible. Never remove the outline without a replacement.
- Dialogs use `role="dialog"` and `aria-modal="true"` (or the native `<dialog>` element), have a label, trap focus, close on Escape and return focus to the trigger. Prefer a tested library (Radix, React Aria, Headless UI) over building your own.
- Move focus to the new page's heading or main region after client-side navigation.
- Don't use a positive `tabIndex`.

### Visual

- Text contrast at least 4.5:1 (3:1 for large text and UI components).
- Don't rely on colour alone to convey meaning.
- Respect `prefers-reduced-motion` and `prefers-color-scheme`.
- The layout works at 200% zoom and 320 px width without horizontal scrolling.
- Touch and click targets at least 24×24 CSS px (44×44 recommended).

### Dynamic content

- Announce async results and toasts with `role="status"` or an `aria-live="polite"` region (`role="alert"` / `assertive` only for urgent errors).
- Loading regions get `aria-busy="true"`.

## React Native

- Give every touchable `accessibilityRole` (`button`, `link`, `checkbox`, `header`, …) and an `accessibilityLabel` when it has no visible text.
- Use `accessibilityState` for `disabled`, `selected`, `checked`, `expanded`, `busy`.
- Use `accessibilityHint` to describe the result of an action when the label alone isn't clear.
- Group related elements with `accessible` on the parent so they are read as one item.
- Touch targets at least 44×44 points; use `hitSlop` for small icons.
- Support Dynamic Type / font scaling: don't set `allowFontScaling={false}`; test with the largest system font.
- Mark headings with `accessibilityRole="header"`.
- Announce important changes with `AccessibilityInfo.announceForAccessibility`.
- Hide decorative elements with `accessible={false}` / `importantForAccessibility="no"`.
- Respect reduced motion (`AccessibilityInfo.isReduceMotionEnabled`, or Reanimated's `useReducedMotion`).

## Testing

- Component tests query by role and name (`getByRole('button', { name: 'Save' })`). If you can't find an element that way, neither can a screen reader user.
- Run axe-core in tests on web: `vitest-axe` (or `jest-axe`) in component tests, `@axe-core/playwright` in E2E. `@axe-core/react` can log issues in development.
- Before release, walk through key flows with a keyboard only and with a screen reader on each platform.
