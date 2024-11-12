"use client";

import { SWRConfig } from "swr";
import { ApiProvider } from "@/lib/api-context";

// Global fetcher function
const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("An error occurred while fetching the data.");
  }
  return response.json();
};

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        shouldRetryOnError: false,
      }}
    >
      <ApiProvider>{children}</ApiProvider>
    </SWRConfig>
  );
}
