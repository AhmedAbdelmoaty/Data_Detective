import { z } from 'zod';
import { insertSessionSchema, gameSessions } from './schema';

export const api = {
  sessions: {
    create: {
      method: 'POST' as const,
      path: '/api/sessions',
      input: insertSessionSchema.omit({ id: true }),
      responses: {
        201: z.custom<typeof gameSessions.$inferSelect>(),
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/sessions/:id',
      input: insertSessionSchema.partial(),
      responses: {
        200: z.custom<typeof gameSessions.$inferSelect>(),
      },
    },
  },
};
