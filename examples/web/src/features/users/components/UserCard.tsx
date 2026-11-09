import { useTruncate } from '@/hooks/useTruncate';

import type { User } from '../types';

const MAX_BIO_LENGTH = 150;

type UserCardProps = {
  user: User;
  onFollow: (userId: User['id']) => void;
};

export function UserCard({ user, onFollow }: UserCardProps) {
  const bio = useTruncate(user.bio, MAX_BIO_LENGTH);
  const headingId = `user-${user.id}-name`;

  return (
    <article aria-labelledby={headingId}>
      <img src={user.avatarUrl} alt="" width={48} height={48} />
      <h3 id={headingId}>{user.name}</h3>
      <p>{bio}</p>
      <button
        type="button"
        onClick={() => {
          onFollow(user.id);
        }}
      >
        Follow {user.name}
      </button>
    </article>
  );
}
