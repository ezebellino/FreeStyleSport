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
  image_url?: string | null
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

export const productVariantImageSelectedEvent = "freestyle:product-variant-image-selected"

export type ProductVariantImageSelectedDetail = {
  productSlug: string
  imageUrl?: string | null
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
    image_url?: string
    attributes: Record<string, unknown>
    sort_order?: number
  }>
}

type CloudinarySignature = {
  cloud_name: string
  api_key: string
  folder: string
  timestamp: number
  signature: string
  upload_url: string
}

export const productCategories = [
  { label: "Ropa", value: "ropa" },
  { label: "Calzado", value: "calzado" },
  { label: "Accesorios", value: "accesorios" },
  { label: "Bebes", value: "bebes" },
  { label: "Ninos", value: "ninos" },
] as const

export const productAudiences = [
  { label: "Hombre", value: "hombre" },
  { label: "Mujer", value: "mujer" },
  { label: "Unisex", value: "unisex" },
  { label: "Ninos", value: "ninos" },
  { label: "Bebes", value: "bebes" },
] as const

const categoryLabels = new Map<string, string>(
  productCategories.map((category) => [category.value, category.label])
)
const audienceLabels = new Map<string, string>(
  productAudiences.map((audience) => [audience.value, audience.label])
)

function slugTokens(value?: string | null) {
  return new Set((value ?? "").split("-").filter(Boolean))
}

export function getProductCategoryLabel(product: Product): string | null {
  const normalized = getProductCategoryValue(product)

  return (normalized && categoryLabels.get(normalized)) ?? product.category?.name ?? null
}

export function getProductCategoryValue(product: Product): string | null {
  const categorySlug = product.category?.slug ?? null
  const tokens = slugTokens(categorySlug)
  return (
    tokens.has("calzado") || tokens.has("calzados")
      ? "calzado"
      : tokens.has("accesorios")
        ? "accesorios"
        : tokens.has("bebes")
          ? "bebes"
          : tokens.has("ninos") || tokens.has("kids")
            ? "ninos"
            : categorySlug
  )
}

export function getProductAudienceLabel(product: Product): string | null {
  const normalized = getProductAudienceValue(product)

  return normalized ? (audienceLabels.get(normalized) ?? normalized) : null
}

export function getProductAudienceValue(product: Product): string | null {
  const rawAudience =
    typeof product.attributes.linea === "string"
      ? product.attributes.linea.toLowerCase()
      : typeof product.attributes.genero === "string"
        ? product.attributes.genero.toLowerCase()
        : null
  const tokens = slugTokens(product.category?.slug)
  return (
    rawAudience ??
    (tokens.has("hombre")
      ? "hombre"
      : tokens.has("mujer")
        ? "mujer"
        : tokens.has("unisex")
          ? "unisex"
          : null)
  )
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
    attributes: { color: "Negro", linea: "hombre", material: "Dry fit" },
    category: { id: "demo-cat-1", name: "Ropa", slug: "ropa" },
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

export async function fetchProducts(filters?: { category?: string; audience?: string }): Promise<Product[]> {
  const searchParams = new URLSearchParams()
  if (filters?.category) {
    searchParams.set("category", filters.category)
  }
  if (filters?.audience) {
    searchParams.set("linea", filters.audience)
  }
  const query = searchParams.size > 0 ? `?${searchParams.toString()}` : ""
  const response = await fetch(`${publicApiUrl}/commerce/products${query}`, {
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

export async function listAdminProducts(): Promise<Product[]> {
  const response = await fetch(`${publicApiUrl}/commerce/admin/products`, {
    credentials: "include",
  })
  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(error?.message ?? "No pudimos cargar los productos")
  }
  return response.json() as Promise<Product[]>
}

export async function updateAdminProduct(productId: string, payload: Partial<ProductPayload>): Promise<Product> {
  const response = await fetch(`${publicApiUrl}/commerce/admin/products/${productId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(error?.message ?? "No pudimos actualizar el producto")
  }
  return response.json() as Promise<Product>
}

export async function uploadAdminProductImage(file: File): Promise<{ url: string; publicId?: string }> {
  const signatureResponse = await fetch(`${publicApiUrl}/commerce/admin/uploads/cloudinary-signature`, {
    credentials: "include",
  })

  if (!signatureResponse.ok) {
    const error = (await signatureResponse.json().catch(() => null)) as { message?: string } | null
    throw new Error(error?.message ?? "No pudimos preparar la subida de imagen")
  }

  const signature = (await signatureResponse.json()) as CloudinarySignature
  const formData = new FormData()
  formData.set("file", file)
  formData.set("api_key", signature.api_key)
  formData.set("timestamp", String(signature.timestamp))
  formData.set("folder", signature.folder)
  formData.set("signature", signature.signature)

  const uploadResponse = await fetch(signature.upload_url, {
    method: "POST",
    body: formData,
  })

  if (!uploadResponse.ok) {
    throw new Error("No pudimos subir la imagen a Cloudinary")
  }

  const payload = (await uploadResponse.json()) as { secure_url?: string; public_id?: string }
  if (!payload.secure_url) {
    throw new Error("Cloudinary no devolvio una URL valida")
  }

  return { url: payload.secure_url, publicId: payload.public_id }
}
