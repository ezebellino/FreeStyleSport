import type { Product } from "./products"

export const CART_STORAGE_KEY = "freestyle.cart.v1"

export type CartItem = {
  productId: string
  slug: string
  name: string
  price: number
  currency: string
  imageUrl?: string
  quantity: number
}

export type CartState = {
  version: 1
  items: CartItem[]
}

export const emptyCartState: CartState = {
  version: 1,
  items: [],
}

export function productToCartItem(product: Product): CartItem {
  return {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    price: Number(product.base_price),
    currency: product.currency,
    imageUrl: product.images[0]?.url,
    quantity: 1,
  }
}

export function getCartItemCount(items: CartItem[]) {
  return items.reduce((total, item) => total + item.quantity, 0)
}

export function getCartTotal(items: CartItem[]) {
  return items.reduce((total, item) => total + item.price * item.quantity, 0)
}

export function serializeCart(items: CartItem[]): CartState {
  return {
    version: 1,
    items,
  }
}

export function parseCart(raw: string | null): CartState {
  if (!raw) {
    return emptyCartState
  }

  try {
    const parsed = JSON.parse(raw) as Partial<CartState>
    if (parsed.version !== 1 || !Array.isArray(parsed.items)) {
      return emptyCartState
    }

    return {
      version: 1,
      items: parsed.items
        .filter((item) => item && typeof item.slug === "string" && typeof item.name === "string")
        .map((item) => ({
          productId: String(item.productId ?? item.slug),
          slug: item.slug,
          name: item.name,
          price: Number(item.price) || 0,
          currency: item.currency || "ARS",
          imageUrl: item.imageUrl,
          quantity: Math.max(1, Number(item.quantity) || 1),
        })),
    }
  } catch {
    return emptyCartState
  }
}

export function formatCartPrice(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value)
}

export function buildReservationMessage(items: CartItem[], total: number) {
  const lines = items.map(
    (item) => `- ${item.name} x${item.quantity} (${formatCartPrice(item.price * item.quantity)})`,
  )

  return [
    "Hola FreeStyle, quiero consultar o reservar estos productos:",
    ...lines,
    `Total estimado: ${formatCartPrice(total)}`,
    "Forma de pago a coordinar: efectivo, billetera virtual, tarjeta o retiro/pago en local.",
  ].join("\n")
}
