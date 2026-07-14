const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// ── Token helpers ──

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refreshToken");
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}

export function logout(): void {
  clearTokens();
  window.location.href = "/login";
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

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  // Auto-logout on 401
  if (res.status === 401) {
    clearTokens();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
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
