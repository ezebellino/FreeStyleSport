import { publicApiUrl } from "./api"

export type AuthMessage = { message: string }
export type PublicUser = {
  id: string
  email: string
  role: "superadmin" | "admin" | "customer" | string
  email_confirmed?: boolean
}

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

const csrfStorageKey = "fs_csrf_token"

async function getCsrfHeaders(): Promise<Record<string, string>> {
  const cookieHeaders = buildCsrfHeaders(document.cookie)
  if (cookieHeaders["x-csrf-token"]) {
    return cookieHeaders
  }

  const storedToken = window.sessionStorage.getItem(csrfStorageKey)
  if (storedToken) {
    return { "x-csrf-token": storedToken }
  }

  const response = await fetch(`${publicApiUrl}/identity/csrf`, {
    credentials: "include",
  })
  const payload = await parseAuthResponse<{ csrf_token: string }>(response)
  window.sessionStorage.setItem(csrfStorageKey, payload.csrf_token)
  return { "x-csrf-token": payload.csrf_token }
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

export async function logoutUser(): Promise<void> {
  const response = await fetch(`${publicApiUrl}/identity/logout`, {
    method: "POST",
    headers: await getCsrfHeaders(),
    credentials: "include",
  })

  await parseAuthResponse<{ status: string }>(response)
  window.sessionStorage.removeItem(csrfStorageKey)
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
