import { z } from 'zod';

const envSchema = z.object({
  VITE_API_URL: z.url().default('https://api.example.com'),
});

export const env = envSchema.parse(import.meta.env);
