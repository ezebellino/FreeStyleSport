"use client"

import { useState } from "react"

export function ProductImage({
  alt,
  className,
  src,
}: Readonly<{ alt: string; className?: string; src?: string }>) {
  const [hasError, setHasError] = useState(false)

  if (!src || hasError) {
    return (
      <div className="flex size-full items-center justify-center bg-gradient-to-br from-secondary to-background p-6 text-center font-display text-2xl font-black italic text-muted-foreground">
        Imagen no disponible
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- product image URLs can come from Cloudinary or another CDN during catalog setup.
    <img alt={alt} className={className} loading="lazy" onError={() => setHasError(true)} src={src} />
  )
}
