"use client"

import { useState } from "react"

export function ProductImage({
  alt,
  className,
  src,
}: Readonly<{ alt: string; className?: string; src?: string }>) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const hasError = Boolean(src && failedSrc === src)

  if (!src || hasError) {
    return (
      <div className="flex size-full items-center justify-center bg-[radial-gradient(circle_at_center,#ffffff_0%,#f1f5f9_48%,#dbeafe_100%)] p-6 text-center font-display text-2xl font-black italic text-slate-500">
        FreeStyle
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- product image URLs can come from Cloudinary or another CDN during catalog setup.
    <img alt={alt} className={className} loading="lazy" onError={() => setFailedSrc(src ?? null)} src={src} />
  )
}
