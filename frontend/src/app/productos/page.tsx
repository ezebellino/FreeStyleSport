import { AdminActionLink } from "@/components/auth/admin-access-gate"
import { ProductCatalog } from "@/components/products/product-catalog"
import { Badge } from "@/components/ui/badge"
import { demoProducts, fetchProducts } from "@/lib/products"

export default async function ProductsPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ categoria?: string; linea?: string; q?: string }> }>) {
  const { categoria, linea, q } = await searchParams
  let products = demoProducts
  let isDemo = true

  try {
    const apiProducts = await fetchProducts({ category: categoria, audience: linea })
    if (apiProducts.length > 0) {
      products = apiProducts
      isDemo = false
    }
  } catch {
    products = demoProducts
  }

  const activeFilter = [linea, categoria].filter(Boolean).join(" / ")

  return (
    <section className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 md:px-8 md:py-16">
      <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
        <div className="space-y-3">
          <Badge className="w-fit">
            {activeFilter ? activeFilter.replace("-", " ") : "Productos"}
          </Badge>
          <h1 className="font-display text-4xl font-black italic tracking-tight sm:text-6xl">
            Catalogo FreeStyle
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Productos con imagen, precio, categoria, descripcion y variantes. La estructura sirve
            para ropa deportiva, ninos, bebes u otros rubros.
          </p>
        </div>
        <AdminActionLink href="/admin">Cargar producto</AdminActionLink>
      </div>

      {isDemo ? (
        <div className="rounded-2xl border bg-secondary/40 p-4 text-sm text-muted-foreground">
          Mostrando productos de ejemplo hasta que el equipo cargue el catalogo desde el panel.
        </div>
      ) : null}

      <ProductCatalog
        key={`${categoria ?? ""}:${linea ?? ""}:${q ?? ""}`}
        products={products}
        initialCategory={categoria ?? ""}
        initialAudience={linea ?? ""}
        initialSearch={q ?? ""}
      />
    </section>
  )
}
