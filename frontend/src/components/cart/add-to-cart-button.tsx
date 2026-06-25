"use client"

import { ShoppingBagIcon } from "lucide-react"
import { useState } from "react"

import { useCart } from "@/components/cart/cart-provider"
import { Button } from "@/components/ui/button"
import type { Product } from "@/lib/products"

export function AddToCartButton({
  product,
  className,
  variant = "default",
  showVariantSelect = true,
}: Readonly<{
  product: Product
  className?: string
  variant?: React.ComponentProps<typeof Button>["variant"]
  showVariantSelect?: boolean
}>) {
  const { addProduct } = useCart()
  const [added, setAdded] = useState(false)
  const availableVariants = product.variants.filter((productVariant) => productVariant.stock_quantity > 0)
  const [selectedVariantId, setSelectedVariantId] = useState(
    availableVariants[0]?.id ?? availableVariants[0]?.label ?? "",
  )
  const needsVariant = showVariantSelect && availableVariants.length > 0

  function handleAdd() {
    addProduct(product, needsVariant ? selectedVariantId : undefined)
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1400)
  }

  return (
    <div className={className ? `flex gap-2 ${className}` : "flex gap-2"}>
      {needsVariant ? (
        <select
          aria-label={`Elegir talle para ${product.name}`}
          className="min-w-24 rounded-lg border bg-background px-3 py-2 text-sm"
          value={selectedVariantId}
          onChange={(event) => setSelectedVariantId(event.target.value)}
        >
          {availableVariants.map((productVariant) => (
            <option
              key={productVariant.id ?? productVariant.label}
              value={productVariant.id ?? productVariant.label}
            >
              {productVariant.label}
            </option>
          ))}
        </select>
      ) : null}
      <Button
        className={needsVariant ? "flex-1" : undefined}
        disabled={availableVariants.length === 0 && product.variants.length > 0}
        variant={variant}
        type="button"
        onClick={handleAdd}
      >
        <ShoppingBagIcon data-icon="inline-start" />
        {added ? "Agregado" : "Agregar"}
      </Button>
    </div>
  )
}
