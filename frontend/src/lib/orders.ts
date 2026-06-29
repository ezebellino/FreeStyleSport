import { publicApiUrl } from "./api"

export type OrderCreatePayload = {
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  payment_method: "to_confirm" | "cash" | "transfer" | "mercado_pago" | "card" | "wallet"
  fulfillment_method: "pickup" | "shipping" | "local_payment"
  notes?: string
  items: Array<{
    product_slug: string
    quantity: number
    variant_id?: string
    variant_label?: string
    variant_color?: string
    variant_size?: string
  }>
}

export type OrderRead = {
  id: string
  status: string
  payment_status: string
  customer_name?: string | null
  customer_email?: string | null
  customer_phone?: string | null
  payment_method: string
  fulfillment_method: string
  notes?: string | null
  subtotal: string | number
  total: string | number
  currency: string
  metadata?: Record<string, unknown>
  created_at?: string
  items: Array<{
    id: string
    product_slug: string
    product_name: string
    image_url?: string | null
    unit_price: string | number
    quantity: number
    line_total: string | number
    currency: string
    attributes?:
      | {
          category?: string | null
          brand?: string | null
          variant_id?: string | null
          variant_label?: string | null
          variant_color?: string | null
          variant_size?: string | null
          variant_display?: string | null
        }
      | Record<string, unknown>
  }>
}

function orderAttributeText(item: OrderRead["items"][number], key: string) {
  const attributes = item.attributes as Record<string, unknown> | undefined
  const value = attributes?.[key]
  return typeof value === "string" && value.trim() ? value.trim() : null
}

export function orderItemVariantDescription(item: OrderRead["items"][number]) {
  const display = orderAttributeText(item, "variant_display")
  if (display) {
    return display
  }

  const color = orderAttributeText(item, "variant_color")
  const size = orderAttributeText(item, "variant_size")
  const parts = [
    color ? `Color: ${color}` : null,
    size ? `Talle: ${size}` : null,
  ].filter(Boolean)

  return parts.length > 0 ? parts.join(" · ") : orderAttributeText(item, "variant_label")
}

export async function createStoreOrder(payload: OrderCreatePayload): Promise<OrderRead> {
  const response = await fetch(`${publicApiUrl}/commerce/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(error?.message ?? "No pudimos crear la reserva")
  }

  return response.json() as Promise<OrderRead>
}

export async function getStoreOrder(orderId: string): Promise<OrderRead> {
  const response = await fetch(`${publicApiUrl}/commerce/orders/${orderId}`, {
    cache: "no-store",
  })

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(error?.message ?? "No encontramos esa reserva")
  }

  return response.json() as Promise<OrderRead>
}

export async function listMyOrders(): Promise<OrderRead[]> {
  const response = await fetch(`${publicApiUrl}/commerce/my/orders`, {
    credentials: "include",
  })

  if (response.status === 401) {
    return []
  }

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(error?.message ?? "No pudimos cargar tus reservas")
  }

  return response.json() as Promise<OrderRead[]>
}

export async function listAdminOrders(): Promise<OrderRead[]> {
  const response = await fetch(`${publicApiUrl}/commerce/admin/orders`, {
    credentials: "include",
  })

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(error?.message ?? "No pudimos cargar las reservas")
  }

  return response.json() as Promise<OrderRead[]>
}

export async function updateAdminOrder(
  orderId: string,
  payload: { status?: string; payment_status?: string },
): Promise<OrderRead> {
  const response = await fetch(`${publicApiUrl}/commerce/admin/orders/${orderId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(error?.message ?? "No pudimos actualizar la reserva")
  }

  return response.json() as Promise<OrderRead>
}

export async function updateAdminOrderStatus(orderId: string, status: string): Promise<OrderRead> {
  return updateAdminOrder(orderId, { status })
}

export async function updateAdminOrderPaymentStatus(
  orderId: string,
  paymentStatus: string,
): Promise<OrderRead> {
  return updateAdminOrder(orderId, { payment_status: paymentStatus })
}
