import Link from "next/link"
import { notFound } from "next/navigation"

import { AddToCartButton } from "@/components/cart/add-to-cart-button"
import { ProductImage } from "@/components/products/product-image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { publicApiUrl } from "@/lib/api"
import {
  demoProducts,
  getProductAudienceLabel,
  getProductCategoryLabel,
  Product,
} from "@/lib/products"

const formatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
})

async function fetchProduct(slug: string): Promise<Product | null> {
  try {
    const response = await fetch(`${publicApiUrl}/commerce/products/${slug}`, { cache: "no-store" })
    if (!response.ok) {
      return demoProducts.find((product) => product.slug === slug) ?? null
    }
    return response.json() as Promise<Product>
  } catch {
    return demoProducts.find((product) => product.slug === slug) ?? null
  }
}

export default async function ProductDetailPage({
  params,
}: Readonly<{ params: Promise<{ slug: string }> }>) {
  const { slug } = await params
  const product = await fetchProduct(slug)
  if (!product) {
    notFound()
  }

  const images = product.images
  const mainImage = images[0]
  const categoryLabel = getProductCategoryLabel(product)
  const audienceLabel = getProductAudienceLabel(product)

  return (
    <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-2 md:px-8 md:py-16">
      <div className="space-y-3">
        <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border bg-[radial-gradient(circle_at_center,#ffffff_0%,#f8fafc_45%,#dbeafe_100%)]">
          {images.length > 1 ? (
            <Badge className="absolute right-4 top-4 z-10 bg-background/90 text-foreground shadow-sm">
              {images.length} fotos
            </Badge>
          ) : null}
          {mainImage ? (
            <ProductImage
              alt={mainImage.alt_text ?? product.name}
              className="size-full object-contain p-8"
              src={mainImage.url}
            />
          ) : (
            <div className="flex size-full items-center justify-center font-display text-4xl font-black italic text-slate-500">
              FreeStyle
            </div>
          )}
        </div>
        {images.length > 1 ? (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {images.map((image, index) => (
              <a
                key={image.id ?? `${image.url}-${index}`}
                className="aspect-square overflow-hidden rounded-2xl border bg-white transition hover:-translate-y-0.5 hover:shadow-md"
                href={image.url}
                rel="noreferrer"
                target="_blank"
                title={`Abrir imagen ${index + 1}`}
              >
                <ProductImage
                  alt={image.alt_text ?? `${product.name} ${index + 1}`}
                  className="size-full object-contain p-1.5"
                  src={image.url}
                />
              </a>
            ))}
          </div>
        ) : null}
      </div>
      <div className="flex flex-col justify-center gap-5">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {audienceLabel ? <Badge className="w-fit">{audienceLabel}</Badge> : null}
            {categoryLabel ? (
              <Badge className="w-fit" variant="outline">
                {categoryLabel}
              </Badge>
            ) : null}
          </div>
          <h1 className="font-display text-4xl font-black italic tracking-tight sm:text-6xl">
            {product.name}
          </h1>
          <p className="text-muted-foreground">{product.description}</p>
        </div>
        <div>
          {product.compare_at_price ? (
            <p className="text-muted-foreground line-through">
              {formatter.format(Number(product.compare_at_price))}
            </p>
          ) : null}
          <p className="text-4xl font-black">{formatter.format(Number(product.base_price))}</p>
        </div>
        {product.variants.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">Variantes disponibles</p>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((variant) => (
                <Badge key={variant.id ?? variant.label} variant="outline">
                  {variant.label} - stock {variant.stock_quantity}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <AddToCartButton product={product} className="min-w-72" />
          <Button asChild variant="secondary">
            <Link href="/productos">Volver al catalogo</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
