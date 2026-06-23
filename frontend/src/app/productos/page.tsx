import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function ProductsPage() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl flex-col justify-center gap-6 px-4 py-16 md:px-8">
      <Badge className="w-fit">Productos</Badge>
      <div className="space-y-3">
        <h1 className="font-display text-4xl font-black italic tracking-tight sm:text-6xl">
          Catalogo FreeStyle
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          La vista de productos queda lista para conectar con stock, fotos, talles y categorias.
          Pronto vas a poder filtrar por tipo de prenda y estilo.
        </p>
      </div>
      <Button asChild className="w-fit">
        <Link href="/">Volver a la tienda</Link>
      </Button>
    </section>
  )
}
