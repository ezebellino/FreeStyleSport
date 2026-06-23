import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function OffersPage() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl flex-col justify-center gap-6 px-4 py-16 md:px-8">
      <Badge className="w-fit">Ofertas</Badge>
      <div className="space-y-3">
        <h1 className="font-display text-4xl font-black italic tracking-tight sm:text-6xl">
          Promos FreeStyle
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Esta seccion va a concentrar descuentos, combos y oportunidades destacadas para vender
          mas claro desde la web.
        </p>
      </div>
      <Button asChild className="w-fit">
        <Link href="/">Volver a la tienda</Link>
      </Button>
    </section>
  )
}
