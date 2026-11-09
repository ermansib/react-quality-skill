// Vitest setup: DOM matchers and cleanup after each test. Copy to src/test/setup.ts.
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
