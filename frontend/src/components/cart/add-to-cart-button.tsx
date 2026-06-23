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
}: Readonly<{
  product: Product
  className?: string
  variant?: React.ComponentProps<typeof Button>["variant"]
}>) {
  const { addProduct } = useCart()
  const [added, setAdded] = useState(false)

  function handleAdd() {
    addProduct(product)
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1400)
  }

  return (
    <Button className={className} variant={variant} type="button" onClick={handleAdd}>
      <ShoppingBagIcon data-icon="inline-start" />
      {added ? "Agregado" : "Agregar"}
    </Button>
  )
}
