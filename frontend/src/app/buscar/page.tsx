import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function SearchPage() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl flex-col justify-center gap-6 px-4 py-16 md:px-8">
      <Badge className="w-fit">Buscar</Badge>
      <div className="space-y-3">
        <h1 className="font-display text-4xl font-black italic tracking-tight sm:text-6xl">
          Encontra tu proximo look
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Estamos preparando una busqueda rapida para productos, categorias y ofertas. Mientras
          tanto, podes volver a la tienda y navegar las secciones destacadas.
        </p>
      </div>
      <Button asChild className="w-fit">
        <Link href="/">Volver a la tienda</Link>
      </Button>
    </section>
  )
}
