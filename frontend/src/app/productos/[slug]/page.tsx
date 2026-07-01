import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  CreditCardIcon,
  MapPinIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  TruckIcon,
} from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

import { AddToCartButton } from "@/components/cart/add-to-cart-button"
import { ProductGallery } from "@/components/products/product-gallery"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { publicApiUrl } from "@/lib/api"
import {
  getProductAudienceLabel,
  getProductCategoryLabel,
  type Product,
  type ProductVariant,
} from "@/lib/products"

const formatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
})

const purchaseBenefits = [
  {
    label: "Envíos y retiro",
    description: "Coordiná envío o retiralo en Buenos Aires 68, Dolores.",
    icon: TruckIcon,
  },
  {
    label: "Medios de pago",
    description: "Efectivo, tarjetas, billeteras y promos activas del local.",
    icon: CreditCardIcon,
  },
  {
    label: "Compra segura",
    description: "El pedido queda registrado para seguimiento desde tu cuenta.",
    icon: ShieldCheckIcon,
  },
] as const

const paymentHighlights = [
  "20% con Cuenta DNI de lunes a viernes",
  "4 cuotas sin interés viernes y sábados",
  "Promos especiales abonando en efectivo",
] as const

async function fetchProduct(slug: string): Promise<Product | null> {
  try {
    const response = await fetch(`${publicApiUrl}/commerce/products/${slug}`, { cache: "no-store" })
    if (!response.ok) {
      return null
    }
    return response.json() as Promise<Product>
  } catch {
    return null
  }
}

function formatPrice(value: string | number) {
  return formatter.format(Number(value))
}

function variantAttribute(productVariant: ProductVariant, names: string[]) {
  for (const name of names) {
    const value = productVariant.attributes[name]
    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }
  }

  return null
}

function variantColor(productVariant: ProductVariant) {
  return variantAttribute(productVariant, ["color", "colour", "color_nombre"]) ?? "Color único"
}

function variantSize(productVariant: ProductVariant) {
  return variantAttribute(productVariant, ["talle", "numero", "size", "medida"]) ?? productVariant.label
}

function variantGroups(product: Product) {
  const groups = new Map<string, ProductVariant[]>()
  for (const productVariant of product.variants) {
    const color = variantColor(productVariant)
    groups.set(color, [...(groups.get(color) ?? []), productVariant])
  }

  return Array.from(groups.entries()).map(([color, variants]) => ({
    color,
    variants,
    stock: variants.reduce((total, productVariant) => total + productVariant.stock_quantity, 0),
  }))
}

function totalStock(product: Product) {
  return product.variants.reduce((total, productVariant) => total + productVariant.stock_quantity, 0)
}

function discountPercent(product: Product) {
  if (!product.compare_at_price) return null
  const compareAtPrice = Number(product.compare_at_price)
  const basePrice = Number(product.base_price)
  if (!compareAtPrice || compareAtPrice <= basePrice) return null

  return Math.round(((compareAtPrice - basePrice) / compareAtPrice) * 100)
}

export default async function ProductDetailPage({
  params,
}: Readonly<{ params: Promise<{ slug: string }> }>) {
  const { slug } = await params
  const product = await fetchProduct(slug)
  if (!product) {
    notFound()
  }

  const categoryLabel = getProductCategoryLabel(product)
  const audienceLabel = getProductAudienceLabel(product)
  const stock = totalStock(product)
  const discount = discountPercent(product)
  const groupedVariants = variantGroups(product)
  const availableVariantCount = product.variants.filter(
    (productVariant) => productVariant.stock_quantity > 0,
  ).length
  const isLowStock = stock > 0 && stock <= 2

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
      <Button asChild variant="ghost" className="mb-6 w-fit">
        <Link href="/productos">
          <ArrowLeftIcon data-icon="inline-start" />
          Volver al catálogo
        </Link>
      </Button>

      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <ProductGallery product={product} />

        <div className="space-y-5 lg:sticky lg:top-24">
          <div className="rounded-[2rem] border bg-card p-5 shadow-sm md:p-6">
            <div className="flex flex-wrap gap-2">
              {audienceLabel ? <Badge className="w-fit">{audienceLabel}</Badge> : null}
              {categoryLabel ? (
                <Badge className="w-fit" variant="outline">
                  {categoryLabel}
                </Badge>
              ) : null}
              {discount ? <Badge className="font-black">-{discount}%</Badge> : null}
              {isLowStock ? <Badge variant="destructive">Últimos disponibles</Badge> : null}
              <Badge variant={stock > 0 ? "secondary" : "destructive"}>
                {stock > 0 ? `${stock} unidades disponibles` : "Sin stock"}
              </Badge>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-primary">
                {product.brand ?? "FreeStyle"}
              </p>
              <h1 className="font-display text-4xl font-black italic tracking-tight sm:text-6xl">
                {product.name}
              </h1>
              {product.description ? (
                <p className="text-sm leading-6 text-muted-foreground sm:text-base">
                  {product.description}
                </p>
              ) : null}
            </div>

            <div className="mt-5 rounded-3xl border bg-secondary/35 p-4">
              {product.compare_at_price ? (
                <p className="text-sm text-muted-foreground line-through">
                  {formatPrice(product.compare_at_price)}
                </p>
              ) : null}
              <div className="flex flex-wrap items-end justify-between gap-3">
                <p className="text-4xl font-black">{formatPrice(product.base_price)}</p>
                {discount ? (
                  <p className="rounded-full bg-primary px-3 py-1 text-xs font-black uppercase text-primary-foreground">
                    Ahorrás {discount}%
                  </p>
                ) : null}
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {paymentHighlights.map((highlight) => (
                  <div key={highlight} className="rounded-2xl border bg-background/50 p-3">
                    <p className="text-xs font-bold leading-5 text-primary">{highlight}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Elegí color y talle antes de agregarlo al carrito. El pedido queda registrado para
                coordinar pago, retiro o envío.
              </p>
            </div>

            <div className="mt-5">
              <div className="mb-3 rounded-3xl border border-primary/30 bg-primary/10 p-4">
                <p className="text-sm font-black text-primary">
                  {stock > 0
                    ? `${availableVariantCount} combinaciones listas para reservar o comprar.`
                    : "Este producto está sin stock por ahora."}
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Seleccioná una variante disponible y agregala al carrito para avanzar con la
                  reserva.
                </p>
              </div>
              <AddToCartButton product={product} className="rounded-3xl border bg-background/55 p-4" />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {purchaseBenefits.map((benefit) => {
              const Icon = benefit.icon
              return (
                <div key={benefit.label} className="flex gap-3 rounded-3xl border bg-card p-4">
                  <Icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                  <div>
                    <p className="font-bold">{benefit.label}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {groupedVariants.length > 0 ? (
        <div className="mt-8 rounded-[2rem] border bg-card p-5 shadow-sm md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-3xl font-black italic tracking-tight">
                Disponibilidad por color y talle
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Los talles agotados quedan visibles para que el cliente entienda qué opciones puede
                elegir.
              </p>
            </div>
            <Badge variant="secondary">{stock} unidades</Badge>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {groupedVariants.map((group) => (
              <div key={group.color} className="rounded-3xl border bg-secondary/35 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black">{group.color}</p>
                  <Badge variant={group.stock > 0 ? "secondary" : "outline"}>
                    {group.stock > 0 ? `${group.stock} en stock` : "Agotado"}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {group.variants.map((productVariant) => {
                    const isAvailable = productVariant.stock_quantity > 0
                    return (
                      <span
                        key={productVariant.id ?? productVariant.label}
                        className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold ${
                          isAvailable
                            ? "border-primary/45 bg-primary/10 text-primary"
                            : "border-border bg-background/45 text-muted-foreground line-through"
                        }`}
                      >
                        {isAvailable ? <CheckCircle2Icon className="size-3" aria-hidden="true" /> : null}
                        Talle {variantSize(productVariant)}
                        <span className="font-medium opacity-75">({productVariant.stock_quantity})</span>
                      </span>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 rounded-[2rem] border bg-[radial-gradient(circle_at_15%_20%,rgba(198,255,0,0.12),transparent_25%),linear-gradient(135deg,#18181b,#0d0d0f)] p-5 md:grid-cols-[1fr_auto] md:items-center md:p-6">
        <div className="flex gap-3">
          <MapPinIcon className="mt-1 size-6 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <h2 className="font-display text-2xl font-black italic">¿Querés verlo en el local?</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Podés reservarlo, consultar disponibilidad y coordinar retiro en Buenos Aires 68,
              Dolores.
            </p>
          </div>
        </div>
        <Button asChild variant="secondary">
          <Link href="/carrito">
            <ShoppingBagIcon data-icon="inline-start" />
            Ir al carrito
          </Link>
        </Button>
      </div>
    </section>
  )
}
