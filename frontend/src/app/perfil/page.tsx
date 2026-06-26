import { ProfileSessionCard } from "@/components/auth/profile-session-card"
import { ProfileOrdersCard } from "@/components/orders/profile-orders-card"
import { Badge } from "@/components/ui/badge"

const profileSections = [
  {
    title: "Datos personales",
    description: "Nombre, email y telefono de contacto para compras y soporte.",
    status: "Activo",
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

        <ProfileSessionCard />
      </div>

      <ProfileOrdersCard />

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
