export const getConfiguredProviderBaseUrl = () => {
  const runtimeBaseUrl = localStorage.getItem("ac_provider_base_url")?.trim();
  const baseUrl = runtimeBaseUrl || import.meta.env.VITE_PROVIDER_API_BASE_URL;
  if (!baseUrl) {
    throw new Error("Provider API is not configured. Set ac_provider_base_url or VITE_PROVIDER_API_BASE_URL.");
  }
  return baseUrl.replace(/\/$/, "");
};

export const isProviderApiConfigured = () => {
  try {
    return Boolean(getConfiguredProviderBaseUrl());
  } catch {
    return false;
  }
};

const getProviderToken = () => {
  return localStorage.getItem("ac_provider_token") ?? "";
};

const requestProvider = async <T>(path: string, init: RequestInit): Promise<T> => {
  const token = getProviderToken();
  const response = await fetch(`${getConfiguredProviderBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Provider API error (${response.status})`);
  }

  return response.json() as Promise<T>;
};

export type ProviderCompute = {
  provider_id: string;
  status: string;
  public_ip: string | null;
  private_ip: string | null;
  access?: {
    ssh_user?: string;
    ssh_port?: number;
    connectivity?: "public" | "private-mesh" | "site-local" | string;
    host?: string;
    auth_method?: "ssh-key" | "password" | string;
    ssh_key_name?: string;
  };
};

export type ProviderDatabase = {
  provider_id: string;
  status: string;
  host: string;
  port: number;
  username: string;
  database: string;
  connection_string: string;
};

export const provisionCompute = (payload: {
  name: string;
  region: string;
  machine_type: string;
  os_image: string;
  tags?: Record<string, string>;
}) => {
  return requestProvider<ProviderCompute>("/v1/resources/compute", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const getComputeStatus = (providerId: string) => {
  return requestProvider<ProviderCompute>(`/v1/resources/compute/${providerId}`, { method: "GET" });
};

export const startCompute = (providerId: string) => {
  return requestProvider<ProviderCompute>(`/v1/resources/compute/${providerId}/start`, { method: "POST" });
};

export const stopCompute = (providerId: string) => {
  return requestProvider<ProviderCompute>(`/v1/resources/compute/${providerId}/stop`, { method: "POST" });
};

export const deleteComputeFromProvider = (providerId: string) => {
  return requestProvider<{ success: boolean }>(`/v1/resources/compute/${providerId}`, { method: "DELETE" });
};

export const provisionDatabase = (payload: {
  name: string;
  engine: string;
  version: string;
  region: string;
  plan: string;
  storage_gb: number;
}) => {
  return requestProvider<ProviderDatabase>("/v1/resources/databases", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const getDatabaseStatus = (providerId: string) => {
  return requestProvider<ProviderDatabase>(`/v1/resources/databases/${providerId}`, { method: "GET" });
};

export const startDatabase = (providerId: string) => {
  return requestProvider<ProviderDatabase>(`/v1/resources/databases/${providerId}/start`, { method: "POST" });
};

export const stopDatabase = (providerId: string) => {
  return requestProvider<ProviderDatabase>(`/v1/resources/databases/${providerId}/stop`, { method: "POST" });
};

export const deleteDatabaseFromProvider = (providerId: string) => {
  return requestProvider<{ success: boolean }>(`/v1/resources/databases/${providerId}`, { method: "DELETE" });
};

export const runCliCommand = (payload: { command: string; working_directory?: string }) => {
  return requestProvider<{ stdout: string; stderr: string; exit_code: number }>("/v1/cli/execute", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};
