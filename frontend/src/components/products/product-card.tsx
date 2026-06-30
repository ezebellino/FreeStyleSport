"use client"

import Link from "next/link"

import { AddToCartButton } from "@/components/cart/add-to-cart-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getProductAudienceLabel, getProductCategoryLabel, type Product } from "@/lib/products"

import { ProductImage } from "./product-image"

const formatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
})

function formatPrice(value: string | number) {
  return formatter.format(Number(value))
}

export function ProductCard({ product }: Readonly<{ product: Product }>) {
  const mainImage = product.images[0]
  const basePrice = Number(product.base_price)
  const comparePrice = product.compare_at_price ? Number(product.compare_at_price) : null
  const hasOffer = Boolean(comparePrice && comparePrice > basePrice)
  const discountPercentage = hasOffer && comparePrice ? Math.round(((comparePrice - basePrice) / comparePrice) * 100) : null
  const stock = product.variants.reduce((total, variant) => total + variant.stock_quantity, 0)
  const availableVariantCount = product.variants.filter((variant) => variant.stock_quantity > 0).length
  const isOutOfStock = stock <= 0
  const isLowStock = stock > 0 && stock <= 2
  const variantLabels = product.variants.map((variant) => variant.label).slice(0, 4)
  const categoryLabel = getProductCategoryLabel(product)
  const audienceLabel = getProductAudienceLabel(product)

  return (
    <article className="group overflow-hidden rounded-3xl border bg-card text-card-foreground shadow-sm transition hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_22px_70px_rgba(198,255,0,0.12)]">
      <div className="relative aspect-[4/5] overflow-hidden bg-white">
        {mainImage ? (
          <ProductImage
            alt={mainImage.alt_text ?? product.name}
            className="size-full object-contain p-5 transition duration-500 group-hover:scale-105"
            src={mainImage.url}
          />
        ) : (
          <div className="flex size-full items-center justify-center p-6 text-center font-display text-2xl font-black italic text-slate-500">
            FreeStyle
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {discountPercentage ? <Badge className="font-black">-{discountPercentage}%</Badge> : null}
          {hasOffer ? <Badge variant="secondary">Oferta</Badge> : null}
          {isLowStock ? <Badge variant="destructive">Últimos</Badge> : null}
          {isOutOfStock ? <Badge variant="secondary">Sin stock</Badge> : null}
        </div>
        <div className="absolute bottom-3 left-3 right-3 rounded-2xl bg-black/82 px-3 py-2 text-center text-[0.7rem] font-bold uppercase tracking-[0.16em] text-white opacity-0 shadow-lg transition group-hover:opacity-100">
          Retiro en local · Transferencia · Promos
        </div>
      </div>
      <div className="space-y-4 p-5">
        <div className="space-y-2">
          {product.brand ? (
            <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">{product.brand}</p>
          ) : null}
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-semibold leading-tight">{product.name}</h2>
            <div className="flex flex-wrap justify-end gap-1">
              {audienceLabel ? <Badge variant="secondary">{audienceLabel}</Badge> : null}
              {categoryLabel ? <Badge variant="outline">{categoryLabel}</Badge> : null}
            </div>
          </div>
          <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{product.description}</p>
        </div>

        <div className="flex items-end justify-between gap-4">
          <div>
            {hasOffer ? (
              <p className="text-sm text-muted-foreground line-through">
                {formatPrice(product.compare_at_price as string | number)}
              </p>
            ) : null}
            <p className="text-2xl font-black">{formatPrice(product.base_price)}</p>
            <p className="text-xs font-medium text-primary">Consultá cuotas y promos en el local</p>
          </div>
          {variantLabels.length > 0 ? (
            <p className="text-right text-xs text-muted-foreground">
              {availableVariantCount > 0 ? `${availableVariantCount} opciones disponibles` : "Sin combinaciones disponibles"}
              <br />
              Talles: {variantLabels.join(", ")}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Button asChild className="flex-1">
            <Link href={`/productos/${product.slug}`}>Ver talles y comprar</Link>
          </Button>
          <AddToCartButton product={product} variant="secondary" />
        </div>
      </div>
    </article>
  )
}
