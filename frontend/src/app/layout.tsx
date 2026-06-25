import type { Metadata } from "next"

import { StoreShell } from "@/components/layout/store-shell"
import "sweetalert2/dist/sweetalert2.min.css"
import "./globals.css"

export const metadata: Metadata = {
  title: { default: "FreeStyle", template: "%s | FreeStyle" },
  description: "Indumentaria, calzado y accesorios deportivos.",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <StoreShell>{children}</StoreShell>
      </body>
    </html>
  )
}
