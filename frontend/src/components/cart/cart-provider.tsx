"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

import {
  CART_STORAGE_KEY,
  type CartItem,
  getCartItemCount,
  getCartTotal,
  parseCart,
  productToCartItem,
  serializeCart,
} from "@/lib/cart"
import type { Product } from "@/lib/products"

type CartContextValue = {
  items: CartItem[]
  count: number
  total: number
  addProduct: (product: Product, variantId?: string) => void
  incrementItem: (key: string) => void
  decrementItem: (key: string) => void
  removeItem: (key: string) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [items, setItems] = useState<CartItem[]>([])
  const [hasLoaded, setHasLoaded] = useState(false)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setItems(parseCart(window.localStorage.getItem(CART_STORAGE_KEY)).items)
      setHasLoaded(true)
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [])

  useEffect(() => {
    if (hasLoaded) {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(serializeCart(items)))
    }
  }, [hasLoaded, items])

  const addProduct = useCallback((product: Product, variantId?: string) => {
    const nextItem = productToCartItem(product, variantId)
    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.key === nextItem.key)
      if (!existingItem) {
        return [...currentItems, nextItem]
      }

      return currentItems.map((item) =>
        item.key === nextItem.key ? { ...item, quantity: item.quantity + 1 } : item,
      )
    })
  }, [])

  const incrementItem = useCallback((key: string) => {
    setItems((currentItems) =>
      currentItems.map((item) => (item.key === key ? { ...item, quantity: item.quantity + 1 } : item)),
    )
  }, [])

  const decrementItem = useCallback((key: string) => {
    setItems((currentItems) =>
      currentItems.flatMap((item) => {
        if (item.key !== key) {
          return [item]
        }

        const quantity = item.quantity - 1
        return quantity > 0 ? [{ ...item, quantity }] : []
      }),
    )
  }, [])

  const removeItem = useCallback((key: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.key !== key))
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: getCartItemCount(items),
      total: getCartTotal(items),
      addProduct,
      incrementItem,
      decrementItem,
      removeItem,
      clearCart,
    }),
    [addProduct, clearCart, decrementItem, incrementItem, items, removeItem],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used inside CartProvider")
  }
  return context
}
