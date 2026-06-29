import Image from "next/image"
import Link from "next/link"

import { ProductCatalog } from "@/components/products/product-catalog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { demoProducts, fetchProducts } from "@/lib/products"

export default async function OffersPage() {
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
      <div className="grid gap-8 lg:grid-cols-[1fr_26rem] lg:items-stretch">
        <div className="overflow-hidden rounded-[2rem] border bg-card shadow-sm">
          <div className="bg-[radial-gradient(circle_at_12%_18%,rgba(249,115,22,0.32),transparent_30%),linear-gradient(135deg,#020617,#111827_58%,#1d4ed8)] p-6 text-white md:p-8">
            <Badge className="w-fit bg-white text-slate-950 hover:bg-white">Ofertas</Badge>
            <div className="mt-4 space-y-3">
              <h1 className="font-display text-4xl font-black italic tracking-tight sm:text-6xl">
                Promos FreeStyle
              </h1>
              <p className="max-w-2xl text-white/75">
                Productos con precio promocional, beneficios de pago y stock listo para reservar o
                comprar.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild variant="secondary">
                <Link href="/productos">Ver todo el catalogo</Link>
              </Button>
              <Button asChild className="bg-white text-slate-950 hover:bg-white/90">
                <Link href="/ayuda">Servicios de compra</Link>
              </Button>
            </div>
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-2">
            <div className="rounded-2xl border bg-secondary/40 p-4">
              <p className="font-bold">Cuenta DNI</p>
              <p className="text-sm leading-6 text-muted-foreground">20% de lunes a viernes.</p>
            </div>
            <div className="rounded-2xl border bg-secondary/40 p-4">
              <p className="font-bold">Banco Provincia</p>
              <p className="text-sm leading-6 text-muted-foreground">
                4 cuotas sin interes viernes y sabados.
              </p>
            </div>
            <div className="rounded-2xl border bg-secondary/40 p-4">
              <p className="font-bold">Efectivo</p>
              <p className="text-sm leading-6 text-muted-foreground">
                Promos especiales en indumentaria.
              </p>
            </div>
            <div className="rounded-2xl border bg-secondary/40 p-4">
              <p className="font-bold">Local</p>
              <p className="text-sm leading-6 text-muted-foreground">Buenos Aires 68, Dolores.</p>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] border bg-card shadow-sm">
          <Image
            src="/brand/medios-de-pago.png"
            alt="Medios de pago: efectivo, billeteras virtuales y tarjetas"
            width={910}
            height={910}
            className="size-full min-h-[24rem] object-cover"
          />
        </div>
      </div>

      {isDemo ? (
        <div className="rounded-2xl border bg-secondary/40 p-4 text-sm text-muted-foreground">
          Mostrando productos de ejemplo hasta que el equipo cargue el catalogo desde el panel.
        </div>
      ) : null}

      <ProductCatalog products={products} initialOffer="offers" />
    </section>
  )
}
