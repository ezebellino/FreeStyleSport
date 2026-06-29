"use client"

import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import type { Product } from "@/lib/products"

import { ProductImage } from "./product-image"

export function ProductGallery({ product }: Readonly<{ product: Product }>) {
  const images = product.images
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const selectedImage = images[selectedImageIndex]

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border bg-[radial-gradient(circle_at_center,#ffffff_0%,#f8fafc_45%,#dbeafe_100%)] shadow-sm">
        {images.length > 1 ? (
          <Badge className="absolute right-4 top-4 z-10 bg-background/90 text-foreground shadow-sm">
            {selectedImageIndex + 1} / {images.length}
          </Badge>
        ) : null}

        {selectedImage ? (
          <ProductImage
            alt={selectedImage.alt_text ?? product.name}
            className="size-full object-contain p-7 transition duration-500"
            src={selectedImage.url}
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
                onClick={() => setSelectedImageIndex(index)}
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
