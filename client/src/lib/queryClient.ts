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
    credentials: 'include',
    headers: {
      ...(init?.headers || {}),
      "Content-Type": "application/json",
    },
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

const defaultQueryFn = async ({ queryKey }: { queryKey: readonly unknown[] }): Promise<any> => {
  const path = queryKey[0] as string;
  
  const res = await fetch(path, {
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
    },
  });
  
  if (!res.ok) {
    let errorText = await res.text();
    try {
      const json = JSON.parse(errorText);
      if (json.message) {
        throw new Error(json.message);
      }
    } catch (e) {
      throw new Error(res.statusText);
    }
    throw new Error(errorText);
  }
  
  return res.json();
};

export const getQueryFn = <T>(options: {
  on401: UnauthorizedBehavior;
}) => {
  return async ({ queryKey }: { queryKey: readonly unknown[] }): Promise<T> => {
    try {
      return await defaultQueryFn({ queryKey });
    } catch (e) {
      if (
        e instanceof Error &&
        (e.message === "Unauthorized" || e.message.includes("401")) &&
        options.on401 === "returnNull"
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
      queryFn: getQueryFn({ on401: "throw" }),
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});