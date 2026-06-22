import { publicApiUrl } from "./api"

export type AuthMessage = { message: string }

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
    body: JSON.stringify({ email, password }),
  })
  return response.json() as Promise<AuthMessage>
}

export async function confirmEmail(token: string): Promise<AuthMessage> {
  const response = await fetch(`${publicApiUrl}/identity/confirm-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  })
  return response.json() as Promise<AuthMessage>
}
