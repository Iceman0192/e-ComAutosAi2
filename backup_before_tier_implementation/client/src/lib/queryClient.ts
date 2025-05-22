import { QueryClient } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorText = await res.text();
    try {
      const json = JSON.parse(errorText);
      if (json.message) {
        throw new Error(json.message);
      }
    } catch (e) {
      // If we can't parse the JSON, just throw the status text
      throw new Error(res.statusText);
    }
    throw new Error(errorText);
  }
}

export async function apiRequest(
  path: string,
  init?: RequestInit
): Promise<Response> {
  const res = await fetch(path, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      "Content-Type": "application/json",
    },
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => (path: string) => Promise<T> = ({ on401 }) => {
  return async (path: string) => {
    try {
      const res = await apiRequest(path);
      return res.json();
    } catch (e) {
      if (
        e instanceof Error &&
        e.message === "Unauthorized" &&
        on401 === "returnNull"
      ) {
        return null as T;
      }
      throw e;
    }
  };
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn<unknown>({ on401: "throw" }),
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});