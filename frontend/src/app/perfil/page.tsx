import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const profileSections = [
  {
    title: "Datos personales",
    description: "Nombre, email y telefono de contacto para compras y soporte.",
    status: "Listo para conectar",
  },
  {
    title: "Pedidos",
    description: "Historial de compras, preparacion y seguimiento.",
    status: "Proximamente",
  },
  {
    title: "Direcciones",
    description: "Direcciones frecuentes para acelerar tus compras.",
    status: "Proximamente",
  },
  {
    title: "Seguridad",
    description: "Cuenta protegida y seguridad adicional para acciones importantes.",
    status: "Base activa",
  },
] as const

export default function ProfilePage() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col gap-8 px-4 py-10 md:px-8 md:py-16">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
        <div className="space-y-4">
          <Badge variant="secondary">Perfil FreeStyle</Badge>
          <h1 className="font-display text-4xl font-black italic tracking-tight sm:text-6xl">
            Tu espacio FreeStyle
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
            Este es tu centro de cuenta: datos personales, pedidos, direcciones y seguridad. Desde
            aca vas a poder entrar, crear cuenta y seguir tus compras.
          </p>
        </div>

        <div className="rounded-3xl border bg-card p-6 text-card-foreground shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Cuenta de cliente</p>
          <div className="mt-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xl font-semibold">Acceso personal</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Entra o crea tu cuenta para guardar tus datos y preparar tus pedidos.
              </p>
            </div>
            <Badge>Seguro</Badge>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/login">Iniciar sesion</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/registro">Crear cuenta</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {profileSections.map((section) => (
          <article
            key={section.title}
            className="rounded-2xl border bg-card p-6 text-card-foreground shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-lg font-semibold">{section.title}</h2>
              <Badge variant="outline">{section.status}</Badge>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{section.description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
