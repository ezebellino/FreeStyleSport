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
  addProduct: (product: Product) => void
  incrementItem: (slug: string) => void
  decrementItem: (slug: string) => void
  removeItem: (slug: string) => void
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

  const addProduct = useCallback((product: Product) => {
    const nextItem = productToCartItem(product)
    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.slug === nextItem.slug)
      if (!existingItem) {
        return [...currentItems, nextItem]
      }

      return currentItems.map((item) =>
        item.slug === nextItem.slug ? { ...item, quantity: item.quantity + 1 } : item,
      )
    })
  }, [])

  const incrementItem = useCallback((slug: string) => {
    setItems((currentItems) =>
      currentItems.map((item) => (item.slug === slug ? { ...item, quantity: item.quantity + 1 } : item)),
    )
  }, [])

  const decrementItem = useCallback((slug: string) => {
    setItems((currentItems) =>
      currentItems.flatMap((item) => {
        if (item.slug !== slug) {
          return [item]
        }

        const quantity = item.quantity - 1
        return quantity > 0 ? [{ ...item, quantity }] : []
      }),
    )
  }, [])

  const removeItem = useCallback((slug: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.slug !== slug))
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
