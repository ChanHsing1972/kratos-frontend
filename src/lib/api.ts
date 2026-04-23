import type {
  TokenResponse,
  UserProfile,
  UserRegisterPayload,
  UserUpdatePayload,
} from "@/types/kratos"

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1"
export const AUTH_TOKEN_KEY = "kratos-auth-token"

export async function registerUser(payload: UserRegisterPayload) {
  return requestJson<UserProfile>("/auth/register", {
    body: JSON.stringify(payload),
    method: "POST",
  })
}

export async function loginUser(username: string, password: string) {
  return requestJson<TokenResponse>("/auth/login", {
    body: JSON.stringify({ username, password }),
    method: "POST",
  })
}

export async function getCurrentUser(token: string) {
  return requestJson<UserProfile>("/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function updateCurrentUser(token: string, payload: UserUpdatePayload) {
  return requestJson<UserProfile>("/auth/me", {
    body: JSON.stringify(payload),
    headers: {
      Authorization: `Bearer ${token}`,
    },
    method: "PUT",
  })
}

async function requestJson<T>(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers)
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  const payload = await response.json().catch(() => null as unknown)

  if (!response.ok) {
    throw new Error(extractApiError(payload) ?? `请求失败：${response.status}`)
  }

  return payload as T
}

function extractApiError(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null
  }

  if ("detail" in payload) {
    const detail = payload.detail
    if (typeof detail === "string") {
      return detail
    }

    if (Array.isArray(detail)) {
      return detail
        .map((item) => {
          if (item && typeof item === "object" && "msg" in item) {
            return String(item.msg)
          }
          return String(item)
        })
        .join("；")
    }
  }

  return null
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return "请求失败，请稍后再试"
}
