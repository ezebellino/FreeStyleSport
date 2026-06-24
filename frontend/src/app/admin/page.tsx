import Link from "next/link"

import { OrderAdminPanel } from "@/components/orders/order-admin-panel"
import { ProductAdminForm } from "@/components/products/product-admin-form"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function AdminPage() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col gap-8 px-4 py-10 md:px-8 md:py-16">
      <div className="space-y-4">
        <Badge>Gestion FreeStyle</Badge>
        <h1 className="font-display text-4xl font-black italic tracking-tight sm:text-6xl">
          Panel administrativo
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
          Este espacio queda preparado para quienes gestionan la tienda: productos, ventas, pedidos y
          atencion diaria.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border bg-card p-6 text-card-foreground shadow-sm">
          <h2 className="text-lg font-semibold">Permisos</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            El dueño puede administrar todo y el equipo puede operar la tienda con permisos de trabajo.
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-6 text-card-foreground shadow-sm">
          <h2 className="text-lg font-semibold">Actividad</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Las acciones importantes quedan preparadas para registrarse y revisar cambios cuando haga
            falta.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <OrderAdminPanel />
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-black">Cargar producto</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            El rol admin puede cargar nombre, precio, imagen, descripcion, categoria y stock.
            La imagen puede ser una URL de Cloudinary u otro enlace publico.
          </p>
        </div>
        <ProductAdminForm />
      </div>

      <Button asChild variant="secondary" className="w-fit">
        <Link href="/">Volver a la tienda</Link>
      </Button>
    </section>
  )
}
