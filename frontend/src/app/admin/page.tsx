import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function AdminPage() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl flex-col justify-center gap-8 px-4 py-16 md:px-8">
      <div className="space-y-4">
        <Badge>RBAC preparado</Badge>
        <h1 className="font-display text-4xl font-black italic tracking-tight sm:text-6xl">
          Panel administrativo
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
          El backend ya expone sesiones, usuario actual, logout protegido por CSRF y helpers de
          autorización por rol. Esta ruta reserva el espacio para conectar las herramientas internas.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border bg-card p-6 text-card-foreground shadow-sm">
          <h2 className="text-lg font-semibold">Acceso</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Las acciones administrativas deberán revalidar sesión y rol en el backend, no sólo desde
            navegación o middleware.
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-6 text-card-foreground shadow-sm">
          <h2 className="text-lg font-semibold">Auditoría</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Cada acción sensible puede registrar actor, request id, IP y user-agent con la base de
            auditoría agregada en identidad.
          </p>
        </div>
      </div>

      <Button asChild variant="secondary" className="w-fit">
        <Link href="/">Volver a la tienda</Link>
      </Button>
    </section>
  )
}
