import type { Metadata } from "next"

import { StoreHeader } from "@/components/layout/store-header"
import { MotionProvider } from "@/components/motion/motion-provider"
import "./globals.css"

export const metadata: Metadata = {
  title: { default: "Freestyle Sport", template: "%s | Freestyle Sport" },
  description: "Indumentaria, calzado y accesorios deportivos.",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <MotionProvider>
          <StoreHeader />
          <main>{children}</main>
        </MotionProvider>
      </body>
    </html>
  )
}
