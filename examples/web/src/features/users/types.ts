import { z } from 'zod';

export const userSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  bio: z.string(),
  avatarUrl: z.url(),
  role: z.enum(['admin', 'member']),
});

export type User = z.infer<typeof userSchema>;
