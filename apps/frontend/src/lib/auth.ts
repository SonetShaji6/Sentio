export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// ── Token helpers ──

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

export function setTokens(accessToken: string): void {
  localStorage.setItem("accessToken", accessToken);
}

export function clearTokens(): void {
  localStorage.removeItem("accessToken");
}

export async function logout(): Promise<void> {
  clearTokens();
  try {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch (err) {
    console.error("Logout request failed", err);
  }
  window.location.href = "/login";
}

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function refreshToken(): Promise<string | null> {
  if (isRefreshing) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setTokens(data.accessToken);
        return data.accessToken;
      }
      return null;
    } catch {
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ── Authenticated fetch ──

export async function fetchWithAuth(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = getAccessToken();
  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const isFormData =
    options.body instanceof FormData ||
    (options.body && (options.body as any).constructor?.name === "FormData");

  if (!headers.has("Content-Type") && options.body && !isFormData) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  // Auto-logout on 401
  if (res.status === 401) {
    const newAccessToken = await refreshToken();

    if (newAccessToken) {
      headers.set("Authorization", `Bearer ${newAccessToken}`);
      return fetch(`${API_URL}${path}`, {
        ...options,
        headers,
        credentials: "include",
      });
    } else {
      clearTokens();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  }

  return res;
}

// ── User type ──
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  createdAt: string;
  preferences?: {
    theme: "light" | "dark" | "system";
    notifications: {
      email: boolean;
      push: boolean;
    };
  };
}

// ── Fetch current user ──
export async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    const res = await fetchWithAuth("/api/auth/me");
    if (!res.ok) return null;
    const data = await res.json();
    return data.user;
  } catch {
    return null;
  }
}

// ── Update Profile ──
export async function updateProfile(data: {
  name?: string;
  avatar?: string;
  preferences?: any;
  currentPassword?: string;
  newPassword?: string;
}): Promise<{ user?: AuthUser; error?: string }> {
  try {
    const res = await fetchWithAuth("/api/auth/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
      return { error: result.message || "Failed to update profile" };
    }
    return { user: result.user };
  } catch {
    return { error: "Network error" };
  }
}

// ── Upload Avatar ──
export async function uploadAvatar(
  file: File,
): Promise<{ user?: AuthUser; error?: string }> {
  try {
    const formData = new FormData();
    formData.append("avatar", file);

    const res = await fetchWithAuth("/api/auth/profile/avatar", {
      method: "POST",
      body: formData,
    });

    const result = await res.json();
    if (!res.ok) {
      return { error: result.message || "Failed to upload avatar" };
    }
    return { user: result.user };
  } catch {
    return { error: "Network error during upload" };
  }
}
