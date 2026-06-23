import Link from "next/link"

import { ProductCard } from "@/components/products/product-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { demoProducts, fetchProducts } from "@/lib/products"

export default async function ProductsPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ categoria?: string }> }>) {
  const { categoria } = await searchParams
  let products = demoProducts
  let isDemo = true

  try {
    const apiProducts = await fetchProducts(categoria)
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
          <Badge className="w-fit">{categoria ? categoria.replace("-", " ") : "Productos"}</Badge>
          <h1 className="font-display text-4xl font-black italic tracking-tight sm:text-6xl">
            Catalogo FreeStyle
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Productos con imagen, precio, categoria, descripcion y variantes. La estructura sirve
            para ropa deportiva, ninos, bebes u otros rubros.
          </p>
        </div>
        <Button asChild variant="secondary">
          <Link href="/admin">Cargar producto</Link>
        </Button>
      </div>

      {isDemo ? (
        <div className="rounded-2xl border bg-secondary/40 p-4 text-sm text-muted-foreground">
          Mostrando productos de ejemplo hasta que el equipo cargue el catalogo desde el panel.
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
