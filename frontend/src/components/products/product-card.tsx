import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Product } from "@/lib/products"

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
  const hasOffer = product.compare_at_price && Number(product.compare_at_price) > Number(product.base_price)
  const stock = product.variants.reduce((total, variant) => total + variant.stock_quantity, 0)
  const variantLabels = product.variants.map((variant) => variant.label).slice(0, 4)

  return (
    <article className="group overflow-hidden rounded-3xl border bg-card text-card-foreground shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative aspect-[4/5] overflow-hidden bg-secondary">
        {mainImage ? (
          <ProductImage
            alt={mainImage.alt_text ?? product.name}
            className="size-full object-cover transition duration-500 group-hover:scale-105"
            src={mainImage.url}
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-secondary to-background p-6 text-center font-display text-2xl font-black italic text-muted-foreground">
            FreeStyle
          </div>
        )}
        <div className="absolute left-3 top-3 flex gap-2">
          {hasOffer ? <Badge>Oferta</Badge> : null}
          {stock <= 0 ? <Badge variant="secondary">Sin stock</Badge> : null}
        </div>
      </div>
      <div className="space-y-4 p-5">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-semibold leading-tight">{product.name}</h2>
            {product.category ? <Badge variant="outline">{product.category.name}</Badge> : null}
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
          </div>
          {variantLabels.length > 0 ? (
            <p className="text-right text-xs text-muted-foreground">
              Talles: {variantLabels.join(", ")}
            </p>
          ) : null}
        </div>

        <div className="flex gap-2">
          <Button asChild className="flex-1">
            <Link href={`/productos/${product.slug}`}>Ver producto</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={`/carrito?producto=${product.slug}`}>Agregar</Link>
          </Button>
        </div>
      </div>
    </article>
  )
}
