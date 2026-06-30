import { publicApiUrl } from "./api"

export type PaymentProfile = {
  id?: string | null
  alias?: string | null
  account_holder?: string | null
  account_identifier?: string | null
  provider?: string | null
  qr_image_url?: string | null
  instructions?: string | null
  is_active: boolean
}

export type PaymentProfilePayload = Omit<PaymentProfile, "id">

async function parsePaymentProfileResponse(response: Response, fallbackMessage: string) {
  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(error?.message ?? fallbackMessage)
  }

  return response.json() as Promise<PaymentProfile>
}

export async function getPaymentProfile(): Promise<PaymentProfile> {
  const response = await fetch(`${publicApiUrl}/commerce/payment-profile`, {
    cache: "no-store",
  })
  return parsePaymentProfileResponse(response, "No pudimos cargar los datos de pago")
}

export async function getAdminPaymentProfile(): Promise<PaymentProfile> {
  const response = await fetch(`${publicApiUrl}/commerce/admin/payment-profile`, {
    credentials: "include",
  })
  return parsePaymentProfileResponse(response, "No pudimos cargar los datos de pago")
}

export async function updateAdminPaymentProfile(
  payload: PaymentProfilePayload,
): Promise<PaymentProfile> {
  const response = await fetch(`${publicApiUrl}/commerce/admin/payment-profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  })
  return parsePaymentProfileResponse(response, "No pudimos guardar los datos de pago")
}
