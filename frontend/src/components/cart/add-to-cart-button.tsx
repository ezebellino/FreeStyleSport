"use client"

import { ShoppingBagIcon } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { useCart } from "@/components/cart/cart-provider"
import { Button } from "@/components/ui/button"
import {
  productVariantImageSelectedEvent,
  type Product,
  type ProductVariant,
  type ProductVariantImageSelectedDetail,
} from "@/lib/products"

function variantKey(productVariant: ProductVariant) {
  return productVariant.id ?? productVariant.label
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

function variantLabel(productVariant: ProductVariant) {
  const color = variantColor(productVariant)
  const size = variantSize(productVariant)
  return color === "Color único" ? size : `${color} / ${size}`
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
  const selectedMatchesColor = selectedVariant && variantColor(selectedVariant) === selectedColor
  const selectedCanBeUsed = selectedMatchesColor && selectedVariant.stock_quantity > 0
  const effectiveSelectedVariant = selectedCanBeUsed ? selectedVariant : firstAvailableVariant
  const canAdd =
    !needsVariant || Boolean(effectiveSelectedVariant && effectiveSelectedVariant.stock_quantity > 0)
  const selectedStock = effectiveSelectedVariant?.stock_quantity ?? 0

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent<ProductVariantImageSelectedDetail>(productVariantImageSelectedEvent, {
        detail: {
          productSlug: product.slug,
          imageUrl: effectiveSelectedVariant?.image_url ?? null,
        },
      }),
    )
  }, [effectiveSelectedVariant?.image_url, product.slug])

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
    addProduct(
      product,
      needsVariant && effectiveSelectedVariant ? variantKey(effectiveSelectedVariant) : undefined,
    )
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1400)
  }

  return (
    <div className={className ? `grid gap-2 ${className}` : "grid gap-2"}>
      {needsVariant ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Color</span>
            <select
              aria-label={`Elegir color para ${product.name}`}
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
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
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Talle</span>
            <select
              aria-label={`Elegir talle para ${product.name}`}
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              value={effectiveSelectedVariant ? variantKey(effectiveSelectedVariant) : ""}
              onChange={(event) => setSelectedVariantId(event.target.value)}
            >
              {variantsForSelectedColor.map((productVariant) => (
                <option
                  key={variantKey(productVariant)}
                  disabled={productVariant.stock_quantity <= 0}
                  value={variantKey(productVariant)}
                >
                  {variantSize(productVariant)}
                  {productVariant.stock_quantity > 0
                    ? ` - ${productVariant.stock_quantity} disponibles`
                    : " - agotado"}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}
      {needsVariant ? (
        <p className={canAdd ? "text-xs text-muted-foreground" : "text-xs text-destructive"}>
          {canAdd && effectiveSelectedVariant
            ? `${variantLabel(effectiveSelectedVariant)} - ${selectedStock} en stock`
            : "Elegí una combinación disponible para agregar al carrito."}
        </p>
      ) : null}
      <div className="flex">
        <Button
          className="flex-1"
          disabled={!canAdd}
          variant={variant}
          type="button"
          onClick={handleAdd}
        >
          <ShoppingBagIcon data-icon="inline-start" />
          {added ? "Agregado" : canAdd ? "Agregar" : "Sin stock"}
        </Button>
      </div>
    </div>
  )
}
