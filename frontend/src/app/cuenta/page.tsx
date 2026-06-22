import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function AccountPage() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl flex-col justify-center gap-8 px-4 py-16 md:px-8">
      <div className="space-y-4">
        <Badge variant="secondary">Identidad habilitada</Badge>
        <h1 className="font-display text-4xl font-black italic tracking-tight sm:text-6xl">
          Tu cuenta Freestyle
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
          La base de autenticación ya está conectada: bootstrap del primer administrador, login,
          sesión segura por cookie HttpOnly y protección CSRF para acciones sensibles.
        </p>
      </div>

      <div className="rounded-2xl border bg-card p-6 text-card-foreground shadow-sm">
        <h2 className="text-lg font-semibold">Próximo paso operativo</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Esta pantalla queda como punto de entrada para perfil, pedidos, direcciones y soporte.
          El flujo visual completo se implementará en el plan de operaciones de cuenta.
        </p>
      </div>

      <Button asChild className="w-fit">
        <Link href="/">Volver a la tienda</Link>
      </Button>
    </section>
  )
}
