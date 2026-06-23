import { publicApiUrl } from "./api"

export type AuthMessage = { message: string }
export type PublicUser = { id: string; email: string; role: "superadmin" | "admin" | "customer" | string }

export class AuthApiError extends Error {
  code: string
  status: number

  constructor(message: string, code: string, status: number) {
    super(message)
    this.name = "AuthApiError"
    this.code = code
    this.status = status
  }
}

async function parseAuthResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as
    | { message?: string; code?: string }
    | null

  if (!response.ok) {
    throw new AuthApiError(
      payload?.message ?? "No pudimos completar la accion. Intentalo de nuevo.",
      payload?.code ?? "request_failed",
      response.status
    )
  }

  return payload as T
}

export function buildCsrfHeaders(cookieHeader: string): Record<string, string> {
  const token = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("fs_csrf="))
    ?.slice("fs_csrf=".length)

  return token ? { "x-csrf-token": decodeURIComponent(token) } : {}
}

export async function registerCustomer(email: string, password: string): Promise<AuthMessage> {
  const response = await fetch(`${publicApiUrl}/identity/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  })
  return parseAuthResponse<AuthMessage>(response)
}

export async function confirmEmail(token: string): Promise<AuthMessage> {
  const response = await fetch(`${publicApiUrl}/identity/confirm-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ token }),
  })
  return parseAuthResponse<AuthMessage>(response)
}

export async function loginUser(email: string, password: string): Promise<PublicUser> {
  const response = await fetch(`${publicApiUrl}/identity/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  })
  return parseAuthResponse<PublicUser>(response)
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  const response = await fetch(`${publicApiUrl}/identity/me`, {
    credentials: "include",
  })

  if (response.status === 401) {
    return null
  }

  return parseAuthResponse<PublicUser>(response)
}
