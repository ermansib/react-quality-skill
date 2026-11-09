import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { UserCard } from './UserCard';

import type { User } from '../types';

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: 'u1',
    name: 'Ada Lovelace',
    bio: 'Mathematician and writer.',
    avatarUrl: 'https://example.com/ada.png',
    role: 'member',
    ...overrides,
  };
}

describe('UserCard', () => {
  it('shows the user name as a heading', () => {
    render(<UserCard user={buildUser()} onFollow={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Ada Lovelace' })).toBeInTheDocument();
  });

  it('lets the user follow someone', async () => {
    const user = userEvent.setup();
    const onFollow = vi.fn();
    render(<UserCard user={buildUser({ id: 'u42' })} onFollow={onFollow} />);

    await user.click(screen.getByRole('button', { name: 'Follow Ada Lovelace' }));

    expect(onFollow).toHaveBeenCalledWith('u42');
  });

  it('truncates a long bio', () => {
    render(<UserCard user={buildUser({ bio: 'a'.repeat(400) })} onFollow={vi.fn()} />);

    expect(screen.getByText(/…$/)).toBeInTheDocument();
  });
});
