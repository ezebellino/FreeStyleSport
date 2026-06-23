"use client"

import { CartProvider } from "@/components/cart/cart-provider"
import { StoreHeader } from "@/components/layout/store-header"
import { MotionProvider } from "@/components/motion/motion-provider"

export function StoreShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <MotionProvider>
      <CartProvider>
        <StoreHeader />
        <main>{children}</main>
      </CartProvider>
    </MotionProvider>
  )
}
