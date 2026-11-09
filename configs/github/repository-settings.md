# GitHub repository settings

Set these on every React or React Native repo (Settings in GitHub). They can't be stored as files, so apply them by hand or with the GitHub CLI.

## Branch protection (or a ruleset) on `main`

- Require a pull request before merging, with at least 1 approval.
- Dismiss stale approvals when new commits are pushed.
- Require review from Code Owners.
- Require status checks to pass: the `quality` job from `ci.yml`.
- Require branches to be up to date before merging.
- Require conversation resolution before merging.
- Block force pushes and deletions.

## General

- Allow squash merging only, with the PR title as the commit message (keeps Conventional Commits on `main`).
- Automatically delete head branches after merge.

## Security

- Turn on Dependabot alerts and security updates.
- Turn on secret scanning and push protection.
- Turn on code scanning (CodeQL default setup) for JavaScript / TypeScript.

## With the GitHub CLI

```sh
gh repo edit --enable-squash-merge --enable-merge-commit=false --enable-rebase-merge=false --delete-branch-on-merge
```
