import { QueryClient } from "@tanstack/react-query";

// Shared TanStack Query client. Own module so AuthContext can clear it on logout
// without importing Routes.tsx (which imports every page).
export const queryClient = new QueryClient();
