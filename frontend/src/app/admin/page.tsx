import Link from "next/link"

import { AdminOverview } from "@/components/admin/admin-overview"
import { OrderAdminPanel } from "@/components/orders/order-admin-panel"
import { ProductAdminPanel } from "@/components/products/product-admin-panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function AdminPage() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col gap-8 px-4 py-10 md:px-8 md:py-16">
      <div className="space-y-4">
        <Badge>Gestión FreeStyle</Badge>
        <h1 className="font-display text-4xl font-black italic tracking-tight sm:text-6xl">
          Panel administrativo
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
          Gestión diaria de productos, ventas, pedidos y atención del local.
        </p>
      </div>

      <AdminOverview />

      <div className="space-y-4">
        <OrderAdminPanel />
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-black">Catálogo</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            El rol admin puede cargar y editar nombre, precio, imagen, descripción, categoría y stock.
          </p>
        </div>
        <ProductAdminPanel />
      </div>

      <Button asChild variant="secondary" className="w-fit">
        <Link href="/">Volver a la tienda</Link>
      </Button>
    </section>
  )
}
