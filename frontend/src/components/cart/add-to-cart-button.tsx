"use client"

import { ShoppingBagIcon } from "lucide-react"
import { useMemo, useState } from "react"

import { useCart } from "@/components/cart/cart-provider"
import { Button } from "@/components/ui/button"
import type { Product, ProductVariant } from "@/lib/products"

function variantKey(productVariant: ProductVariant) {
  return productVariant.id ?? productVariant.label
}

function variantColor(productVariant: ProductVariant) {
  return typeof productVariant.attributes.color === "string"
    ? productVariant.attributes.color
    : "Sin color"
}

function variantSize(productVariant: ProductVariant) {
  return typeof productVariant.attributes.talle === "string"
    ? productVariant.attributes.talle
    : productVariant.label
}

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
  const variantOptions = product.variants
  const availableVariants = variantOptions.filter(
    (productVariant) => productVariant.stock_quantity > 0,
  )
  const colorOptions = useMemo(
    () =>
      Array.from(new Set(variantOptions.map(variantColor))).map((color) => ({
        color,
        hasStock: variantOptions.some(
          (productVariant) =>
            variantColor(productVariant) === color && productVariant.stock_quantity > 0,
        ),
      })),
    [variantOptions],
  )
  const [selectedColor, setSelectedColor] = useState(
    colorOptions.find((colorOption) => colorOption.hasStock)?.color ?? colorOptions[0]?.color ?? "",
  )
  const variantsForSelectedColor = useMemo(
    () =>
      variantOptions.filter((productVariant) => variantColor(productVariant) === selectedColor),
    [selectedColor, variantOptions],
  )
  const firstAvailableVariant =
    variantsForSelectedColor.find((productVariant) => productVariant.stock_quantity > 0) ??
    variantsForSelectedColor[0] ??
    availableVariants[0] ??
    variantOptions[0]
  const [selectedVariantId, setSelectedVariantId] = useState(
    firstAvailableVariant ? variantKey(firstAvailableVariant) : "",
  )
  const needsVariant = showVariantSelect && variantOptions.length > 0
  const selectedVariant = variantOptions.find(
    (productVariant) => variantKey(productVariant) === selectedVariantId,
  )
  const canAdd = !needsVariant || Boolean(selectedVariant && selectedVariant.stock_quantity > 0)

  function selectColor(color: string) {
    setSelectedColor(color)
    const nextVariants = variantOptions.filter(
      (productVariant) => variantColor(productVariant) === color,
    )
    const nextVariant =
      nextVariants.find((productVariant) => productVariant.stock_quantity > 0) ?? nextVariants[0]
    if (nextVariant) {
      setSelectedVariantId(variantKey(nextVariant))
    }
  }

  function handleAdd() {
    if (!canAdd) {
      return
    }
    addProduct(product, needsVariant ? selectedVariantId : undefined)
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1400)
  }

  return (
    <div className={className ? `flex flex-wrap gap-2 ${className}` : "flex flex-wrap gap-2"}>
      {needsVariant ? (
        <>
          <select
            aria-label={`Elegir color para ${product.name}`}
            className="min-w-28 rounded-lg border bg-background px-3 py-2 text-sm"
            value={selectedColor}
            onChange={(event) => selectColor(event.target.value)}
          >
            {colorOptions.map((colorOption) => (
              <option
                key={colorOption.color}
                disabled={!colorOption.hasStock}
                value={colorOption.color}
              >
                {colorOption.color}
                {colorOption.hasStock ? "" : " - agotado"}
              </option>
            ))}
          </select>
          <select
            aria-label={`Elegir talle para ${product.name}`}
            className="min-w-24 rounded-lg border bg-background px-3 py-2 text-sm"
            value={selectedVariantId}
            onChange={(event) => setSelectedVariantId(event.target.value)}
          >
            {variantsForSelectedColor.map((productVariant) => (
              <option
                key={variantKey(productVariant)}
                disabled={productVariant.stock_quantity <= 0}
                value={variantKey(productVariant)}
              >
                {variantSize(productVariant)}
                {productVariant.stock_quantity > 0 ? "" : " - agotado"}
              </option>
            ))}
          </select>
        </>
      ) : null}
      <Button
        className={needsVariant ? "flex-1" : undefined}
        disabled={!canAdd}
        variant={variant}
        type="button"
        onClick={handleAdd}
      >
        <ShoppingBagIcon data-icon="inline-start" />
        {added ? "Agregado" : canAdd ? "Agregar" : "Sin stock"}
      </Button>
    </div>
  )
}
