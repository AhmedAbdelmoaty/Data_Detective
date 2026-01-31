import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import type { InsertSession } from "@shared/schema";

// NOTE: Since this prototype is largely client-side state for the game logic,
// these hooks are placeholders for when we persist state to the DB.
// They follow the correct pattern for future scalability.

export function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertSession) => {
      const res = await fetch(api.sessions.create.path, {
        method: api.sessions.create.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create session');
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate queries if we were fetching session lists
    },
  });
}
