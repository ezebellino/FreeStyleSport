"use client"

import { useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import {
  productVariantImageSelectedEvent,
  type Product,
  type ProductVariantImageSelectedDetail,
} from "@/lib/products"

import { ProductImage } from "./product-image"

export function ProductGallery({ product }: Readonly<{ product: Product }>) {
  const images = product.images
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [selectedVariantImageUrl, setSelectedVariantImageUrl] = useState<string | null>(null)
  const selectedImage = images[selectedImageIndex]
  const visibleImageUrl = selectedVariantImageUrl ?? selectedImage?.url

  useEffect(() => {
    function handleVariantImageSelected(event: Event) {
      const detail = (event as CustomEvent<ProductVariantImageSelectedDetail>).detail
      if (detail?.productSlug !== product.slug) {
        return
      }
      setSelectedVariantImageUrl(detail.imageUrl || null)
    }

    window.addEventListener(productVariantImageSelectedEvent, handleVariantImageSelected)
    return () => {
      window.removeEventListener(productVariantImageSelectedEvent, handleVariantImageSelected)
    }
  }, [product.slug])

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border bg-white shadow-sm">
        {selectedVariantImageUrl ? (
          <Badge className="absolute right-4 top-4 z-10 bg-background/90 text-foreground shadow-sm">
            Foto del color
          </Badge>
        ) : images.length > 1 ? (
          <Badge className="absolute right-4 top-4 z-10 bg-background/90 text-foreground shadow-sm">
            {selectedImageIndex + 1} / {images.length}
          </Badge>
        ) : null}

        {visibleImageUrl ? (
          <ProductImage
            alt={selectedImage?.alt_text ?? product.name}
            className="size-full object-contain p-7 transition duration-500"
            src={visibleImageUrl}
          />
        ) : (
          <div className="flex size-full items-center justify-center font-display text-4xl font-black italic text-slate-500">
            FreeStyle
          </div>
        )}
      </div>

      {images.length > 1 ? (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {images.map((image, index) => {
            const isSelected = selectedImageIndex === index
            return (
              <button
                key={image.id ?? `${image.url}-${index}`}
                aria-label={`Ver imagen ${index + 1} de ${product.name}`}
                className={`aspect-square overflow-hidden rounded-2xl border bg-white transition hover:-translate-y-0.5 hover:shadow-md ${
                  isSelected ? "border-primary ring-2 ring-primary/45" : "border-border"
                }`}
                type="button"
                onClick={() => {
                  setSelectedVariantImageUrl(null)
                  setSelectedImageIndex(index)
                }}
              >
                <ProductImage
                  alt={image.alt_text ?? `${product.name} ${index + 1}`}
                  className="size-full object-contain p-1.5"
                  src={image.url}
                />
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
