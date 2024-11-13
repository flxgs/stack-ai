"use client";
import { createContext, useContext, ReactNode } from "react";
import { createApiClient } from "./api";

// Define the API client type based on the function's return type
type ApiClient = ReturnType<typeof createApiClient>;

// Create the context with explicit type
const ApiContext = createContext<ApiClient | null>(null);

// Add display name for better debugging
ApiContext.displayName = "ApiContext";

// Props type for the provider
interface ApiProviderProps {
  children: ReactNode;
}

/**
 * Provider component that wraps app/parts of app that need API access
 * Creates a new ApiClient instance and provides it through context
 */
export function ApiProvider({ children }: ApiProviderProps) {
  // Create a single instance of the functional ApiClient for the app
  const client = createApiClient();

  return <ApiContext.Provider value={client}>{children}</ApiContext.Provider>;
}

/**
 * Custom hook to use the API client
 * Must be used within an ApiProvider
 * @returns ApiClient instance
 * @throws Error if used outside of ApiProvider
 */
export function useApi(): ApiClient {
  const context = useContext(ApiContext);

  if (context === null) {
    throw new Error(
      "useApi must be used within an ApiProvider. " +
        "Wrap a parent component in <ApiProvider>."
    );
  }

  return context;
}

// Export the context if needed elsewhere
export { ApiContext };
