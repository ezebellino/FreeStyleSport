import Link from "next/link"

import { ProductCatalog } from "@/components/products/product-catalog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { fetchProducts, type Product } from "@/lib/products"

export default async function SearchPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ q?: string }> }>) {
  const { q } = await searchParams
  let products: Product[] = []

  try {
    products = await fetchProducts({ search: q })
  } catch {
    products = []
  }

  return (
    <section className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 md:px-8 md:py-16">
      <div className="overflow-hidden rounded-[2rem] border bg-card shadow-sm">
        <div className="grid gap-6 bg-[radial-gradient(circle_at_15%_20%,rgba(59,130,246,0.22),transparent_28%),linear-gradient(135deg,#020617,#111827_60%,#ea580c)] p-6 text-white md:grid-cols-[1fr_auto] md:items-end md:p-8">
          <div className="space-y-3">
            <Badge className="w-fit bg-white text-slate-950 hover:bg-white">Buscar</Badge>
            <h1 className="font-display text-4xl font-black italic tracking-tight sm:text-6xl">
              Encontra tu proximo look
            </h1>
            <p className="max-w-2xl text-white/75">
              Busca por marca, categoria, color o talle. El resultado te lleva directo al producto
              para elegir variante y comprar sin friccion.
            </p>
          </div>
          <Button asChild variant="secondary">
            <Link href="/productos">Ver catalogo completo</Link>
          </Button>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-3">
          <Link
            className="rounded-2xl border bg-secondary/40 p-4 text-sm transition hover:border-primary hover:bg-primary/5"
            href="/productos?categoria=calzado"
          >
            <span className="block font-bold">Calzado</span>
            <span className="text-muted-foreground">Zapatillas y talles disponibles.</span>
          </Link>
          <Link
            className="rounded-2xl border bg-secondary/40 p-4 text-sm transition hover:border-primary hover:bg-primary/5"
            href="/ofertas"
          >
            <span className="block font-bold">Ofertas activas</span>
            <span className="text-muted-foreground">Productos con precio promocional.</span>
          </Link>
          <Link
            className="rounded-2xl border bg-secondary/40 p-4 text-sm transition hover:border-primary hover:bg-primary/5"
            href="/productos?linea=hombre"
          >
            <span className="block font-bold">Linea hombre</span>
            <span className="text-muted-foreground">Filtra en un toque.</span>
          </Link>
        </div>
      </div>

      <ProductCatalog products={products} initialSearch={q ?? ""} />
    </section>
  )
}
