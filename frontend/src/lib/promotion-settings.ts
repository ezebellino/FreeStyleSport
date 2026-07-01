import { publicApiUrl } from "./api"

export type PromotionSettings = {
  id?: string | null
  hero_badge?: string | null
  hero_title?: string | null
  hero_description?: string | null
  welcome_coupon_enabled: boolean
  welcome_coupon_code: string
  welcome_discount_rate: string | number
  free_shipping_enabled: boolean
  free_shipping_threshold: string | number
  gift_bonus_enabled: boolean
  gift_bonus_threshold: string | number
  gift_bonus_code: string
  gift_bonus_rate: string | number
  payment_promotions?: string | null
  checkout_message?: string | null
  is_active: boolean
}

export type PromotionSettingsPayload = Omit<PromotionSettings, "id">

export const defaultPromotionSettings: PromotionSettings = {
  hero_badge: "Nueva temporada",
  hero_title: "Promos FreeStyle",
  hero_description: "Beneficios activos para comprar más fácil en la tienda.",
  welcome_coupon_enabled: true,
  welcome_coupon_code: "BIENVENIDA10",
  welcome_discount_rate: 0.1,
  free_shipping_enabled: true,
  free_shipping_threshold: 100000,
  gift_bonus_enabled: true,
  gift_bonus_threshold: 200000,
  gift_bonus_code: "PROXIMA10",
  gift_bonus_rate: 0.1,
  payment_promotions:
    "De lunes a viernes 20% con Cuenta DNI. Viernes y sábados 4 cuotas sin interés con tarjetas de crédito del Banco Provincia.",
  checkout_message: "El local confirma stock y pago antes de preparar el pedido.",
  is_active: true,
}

async function parsePromotionSettingsResponse(response: Response, fallbackMessage: string) {
  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(error?.message ?? fallbackMessage)
  }

  return response.json() as Promise<PromotionSettings>
}

export function promotionNumber(value: string | number | null | undefined, fallback = 0) {
  const parsed = Number(value ?? fallback)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function promotionRatePercent(value: string | number | null | undefined) {
  return Math.round(promotionNumber(value) * 100)
}

export async function getPromotionSettings(): Promise<PromotionSettings> {
  const response = await fetch(`${publicApiUrl}/commerce/promotion-settings`, {
    cache: "no-store",
  })
  return parsePromotionSettingsResponse(response, "No pudimos cargar las promociones")
}

export async function getAdminPromotionSettings(): Promise<PromotionSettings> {
  const response = await fetch(`${publicApiUrl}/commerce/admin/promotion-settings`, {
    credentials: "include",
  })
  return parsePromotionSettingsResponse(response, "No pudimos cargar las promociones")
}

export async function updateAdminPromotionSettings(
  payload: PromotionSettingsPayload,
): Promise<PromotionSettings> {
  const response = await fetch(`${publicApiUrl}/commerce/admin/promotion-settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  })
  return parsePromotionSettingsResponse(response, "No pudimos guardar las promociones")
}
