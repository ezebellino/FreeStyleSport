import Image from "next/image"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function OffersPage() {
  return (
    <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[1fr_28rem] md:px-8 md:py-16">
      <div className="flex flex-col justify-center gap-6">
        <Badge className="w-fit">Ofertas</Badge>
        <div className="space-y-3">
          <h1 className="font-display text-4xl font-black italic tracking-tight sm:text-6xl">
            Promos FreeStyle
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Medios de pago y beneficios activos para comprar indumentaria, calzado y accesorios deportivos.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border bg-card p-4">
            <p className="font-bold">Cuenta DNI</p>
            <p className="text-sm leading-6 text-muted-foreground">20% de lunes a viernes.</p>
          </div>
          <div className="rounded-2xl border bg-card p-4">
            <p className="font-bold">Banco Provincia</p>
            <p className="text-sm leading-6 text-muted-foreground">4 cuotas sin interés viernes y sábados.</p>
          </div>
          <div className="rounded-2xl border bg-card p-4">
            <p className="font-bold">Efectivo</p>
            <p className="text-sm leading-6 text-muted-foreground">Promos especiales en indumentaria.</p>
          </div>
          <div className="rounded-2xl border bg-card p-4">
            <p className="font-bold">Local</p>
            <p className="text-sm leading-6 text-muted-foreground">Buenos Aires 68, Dolores.</p>
          </div>
        </div>
        <Button asChild className="w-fit">
          <Link href="/productos">Ver productos</Link>
        </Button>
      </div>
      <div className="overflow-hidden rounded-3xl border bg-card">
        <Image
          src="/brand/medios-de-pago.png"
          alt="Medios de pago: efectivo, billeteras virtuales y tarjetas"
          width={910}
          height={910}
          className="size-full object-cover"
        />
      </div>
    </section>
  )
}
