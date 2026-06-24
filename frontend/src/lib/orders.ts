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
  }>
}

export type OrderRead = {
  id: string
  status: string
  subtotal: string | number
  total: string | number
  currency: string
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
