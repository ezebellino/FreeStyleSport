import { publicApiUrl } from "./api"
import type { PublicUser } from "./auth"

export type StaffUserCreatePayload = {
  email: string
  password: string
  role: "admin"
  first_name?: string
  last_name?: string
  phone?: string
}

export async function createStaffUser(payload: StaffUserCreatePayload): Promise<PublicUser> {
  const response = await fetch(`${publicApiUrl}/identity/admin/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(error?.message ?? "No pudimos crear el administrador")
  }

  return response.json() as Promise<PublicUser>
}
