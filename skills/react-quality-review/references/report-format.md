---
description: The exact format of a react-quality review report - verdict, gate results, findings by severity, coverage and strengths
globs: ''
---

# Review report format

Write the report in Markdown, in this order. Leave out a severity section that has no findings. Keep it scannable: the author should know within ten seconds whether they can merge.

## Template

````markdown
## React quality review: <scope, e.g. "PR #42 feat/cart-badge" or "src/features/cart">

**Verdict:** Request changes | Approve with comments | Approve
**Platform:** Web (Vite) | Native (Expo) | Both · **React Compiler:** on | off | unknown
**Summary:** <one or two sentences: the overall state and the most important thing to fix>

| Blocker | Major | Minor | Nit |
| ------- | ----- | ----- | --- |
| 0       | 2     | 3     | 1   |

### Automated gates

| Gate               | Result                                   |
| ------------------ | ---------------------------------------- |
| Type check         | ✅ pass / ❌ 3 errors / ⚪ not run (why) |
| ESLint             | …                                        |
| Prettier           | …                                        |
| Tests              | …                                        |
| react-quality scan | 7 hits, 5 confirmed                      |

### Blockers

#### [SEC-03] Access token stored in `localStorage`

`src/features/auth/session.ts:18`

```ts
localStorage.setItem('accessToken', token);
```

**Why:** any script on the page (one XSS, one bad dependency) can read it and take over the account.
**Fix:** have the server set an httpOnly, `Secure`, `SameSite` cookie, and drop the client-side copy. If the token must live in JS, keep it in memory only.

### Major

#### [CMP-07] Array index used as `key` in a list that can be filtered

`src/features/cart/CartList.tsx:31`, also `:58`
…

### Minor

…

### Nits (optional)

…

### Checked and fine

Types · Accessibility · Security · Tests (one line listing the catalogue areas reviewed with no findings, so the author knows they were checked)

### Done well

- <one to three specific things worth keeping, e.g. "query keys come from the factory and the mutation invalidates them">
````

## Rules for each finding

- Heading: `[RULE-ID] <what is wrong, in plain words>`.
- Location: `path:line` (from the repository root). For repeats, list every location on that line instead of writing a new finding.
- Code: quote only the lines needed to see the problem.
- **Why:** the user or maintainer impact in one sentence, not "the rule says so".
- **Fix:** the concrete change. Show code when it's shorter than describing it.
- If you changed the catalogue's default severity, add `(raised from minor: <reason>)` or `(lowered from major: <reason>)` after the heading.

## When posting to a pull request

If asked to post the review on GitHub (or another code host), put each finding as an inline comment on its line, using the same heading, **Why** and **Fix**, and post the verdict, counts and gates table as the review summary. Use "Request changes" only when the verdict is "Request changes".

## When asked to fix

Only after the person asks. Fix in severity order, re-run the gates and the scanner, and finish with a short list of finding ids fixed, ids left open, and why.
