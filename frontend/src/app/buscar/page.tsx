import Link from "next/link"

import { ProductCatalog } from "@/components/products/product-catalog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { demoProducts, fetchProducts } from "@/lib/products"

export default async function SearchPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ q?: string }> }>) {
  const { q } = await searchParams
  let products = demoProducts
  let isDemo = true

  try {
    const apiProducts = await fetchProducts()
    if (apiProducts.length > 0) {
      products = apiProducts
      isDemo = false
    }
  } catch {
    products = demoProducts
  }

  return (
    <section className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 md:px-8 md:py-16">
      <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
        <div className="space-y-3">
          <Badge className="w-fit">Buscar</Badge>
          <h1 className="font-display text-4xl font-black italic tracking-tight sm:text-6xl">
            Encontra tu proximo look
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Busca por nombre, marca, categoria, color o talle. Si el producto tiene stock, podes
            agregarlo al carrito desde el resultado.
          </p>
        </div>
        <Button asChild variant="secondary">
          <Link href="/productos">Ver catalogo completo</Link>
        </Button>
      </div>

      {isDemo ? (
        <div className="rounded-2xl border bg-secondary/40 p-4 text-sm text-muted-foreground">
          Mostrando productos de ejemplo hasta que el equipo cargue el catalogo desde el panel.
        </div>
      ) : null}

      <ProductCatalog products={products} initialSearch={q ?? ""} />
    </section>
  )
}
