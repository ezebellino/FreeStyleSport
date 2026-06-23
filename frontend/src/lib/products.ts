import { publicApiUrl } from "./api"

export type ProductImage = {
  id?: string
  url: string
  alt_text?: string | null
  provider?: string | null
}

export type ProductVariant = {
  id?: string
  sku?: string | null
  label: string
  price?: string | number | null
  stock_quantity: number
  attributes: Record<string, unknown>
}

export type Product = {
  id: string
  name: string
  slug: string
  description?: string | null
  brand?: string | null
  status: string
  base_price: string | number
  compare_at_price?: string | number | null
  currency: string
  attributes: Record<string, unknown>
  category?: { id: string; name: string; slug: string } | null
  images: ProductImage[]
  variants: ProductVariant[]
}

export type ProductPayload = {
  name: string
  slug: string
  description?: string
  brand?: string
  category_slug?: string
  status: "draft" | "published" | "paused" | "archived"
  base_price: number
  compare_at_price?: number
  currency: string
  attributes: Record<string, unknown>
  images: Array<{ url: string; alt_text?: string; provider?: string; sort_order?: number }>
  variants: Array<{
    sku?: string
    label: string
    price?: number
    stock_quantity: number
    attributes: Record<string, unknown>
    sort_order?: number
  }>
}

export const demoProducts: Product[] = [
  {
    id: "demo-oversize",
    name: "Remera training oversize",
    slug: "remera-training-oversize",
    description: "Tela liviana, corte comodo y estilo urbano para entrenar o salir.",
    brand: "FreeStyle",
    status: "published",
    base_price: 28900,
    compare_at_price: 34900,
    currency: "ARS",
    attributes: { color: "Negro", material: "Dry fit" },
    category: { id: "demo-cat-1", name: "Hombre", slug: "hombre" },
    images: [
      {
        url: "https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=900&q=80",
        alt_text: "Remera deportiva negra",
        provider: "unsplash",
      },
    ],
    variants: [
      { label: "M", stock_quantity: 8, attributes: { talle: "M" } },
      { label: "L", stock_quantity: 5, attributes: { talle: "L" } },
    ],
  },
  {
    id: "demo-calzado",
    name: "Zapatilla urbana flex",
    slug: "zapatilla-urbana-flex",
    description: "Base flexible para uso diario, entrenamiento suave y looks deportivos.",
    brand: "FreeStyle",
    status: "published",
    base_price: 79900,
    currency: "ARS",
    attributes: { color: "Blanco", genero: "Unisex" },
    category: { id: "demo-cat-2", name: "Calzado", slug: "calzado" },
    images: [
      {
        url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
        alt_text: "Zapatilla deportiva",
        provider: "unsplash",
      },
    ],
    variants: [
      { label: "40", stock_quantity: 3, attributes: { talle: "40" } },
      { label: "41", stock_quantity: 4, attributes: { talle: "41" } },
    ],
  },
  {
    id: "demo-baby",
    name: "Conjunto mini sport",
    slug: "conjunto-mini-sport",
    description: "Ejemplo de producto para mostrar que el catalogo tambien sirve para ninos o bebes.",
    brand: "FreeStyle",
    status: "published",
    base_price: 39900,
    currency: "ARS",
    attributes: { edad: "12-18 meses", material: "Algodon" },
    category: { id: "demo-cat-3", name: "Kids", slug: "kids" },
    images: [
      {
        url: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=900&q=80",
        alt_text: "Ropa deportiva infantil",
        provider: "unsplash",
      },
    ],
    variants: [{ label: "12-18 meses", stock_quantity: 6, attributes: { edad: "12-18 meses" } }],
  },
]

export async function fetchProducts(category?: string): Promise<Product[]> {
  const searchParams = category ? `?category=${encodeURIComponent(category)}` : ""
  const response = await fetch(`${publicApiUrl}/commerce/products${searchParams}`, {
    cache: "no-store",
  })
  if (!response.ok) {
    throw new Error("products_fetch_failed")
  }
  return response.json() as Promise<Product[]>
}

export async function createAdminProduct(payload: ProductPayload): Promise<Product> {
  const response = await fetch(`${publicApiUrl}/commerce/admin/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(error?.message ?? "No pudimos guardar el producto")
  }
  return response.json() as Promise<Product>
}
