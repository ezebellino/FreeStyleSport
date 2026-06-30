import {
  ArrowRightIcon,
  CreditCardIcon,
  RefreshCwIcon,
  SearchIcon,
  ShoppingBagIcon,
  TagIcon,
  TruckIcon,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import { Reveal } from "@/components/motion/reveal"
import { ProductCard } from "@/components/products/product-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { demoProducts, fetchProducts, type Product } from "@/lib/products"

const benefitItems = [
  { label: "Envíos", description: "A todo el país", icon: TruckIcon },
  { label: "Pagos", description: "Efectivo, tarjetas y billeteras", icon: CreditCardIcon },
  { label: "Cambios", description: "Coordinados con el local", icon: RefreshCwIcon },
] as const

const categoryCards = [
  { label: "Hombre", href: "/productos?linea=hombre", description: "Ver todo", icon: ShoppingBagIcon },
  { label: "Mujer", href: "/productos?linea=mujer", description: "Ver todo", icon: ShoppingBagIcon },
  { label: "Calzado", href: "/productos?categoria=calzado", description: "Zapatillas", icon: ShoppingBagIcon },
  { label: "Accesorios", href: "/productos?categoria=accesorios", description: "Complementos", icon: ShoppingBagIcon },
  { label: "Ofertas", href: "/ofertas", description: "Promos activas", icon: TagIcon },
] as const

const quickSearches = ["Nike", "Zapatilla", "Remera", "Calzado", "41"] as const

function productHasOffer(product: Product) {
  return Boolean(
    product.compare_at_price && Number(product.compare_at_price) > Number(product.base_price),
  )
}

function productHasStock(product: Product) {
  return product.variants.some((variant) => variant.stock_quantity > 0)
}

function pickFeaturedProducts(products: Product[]) {
  const withStock = products.filter(productHasStock)
  const offers = withStock.filter(productHasOffer)
  const pool = [...offers, ...withStock.filter((product) => !offers.includes(product))]

  return pool.slice(0, 3)
}

export default async function HomePage() {
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

  const featuredProducts = pickFeaturedProducts(products)
  const offerCount = products.filter(productHasOffer).length
  const stockCount = products.filter(productHasStock).length

  return (
    <main className="overflow-hidden">
      <section className="freestyle-hero">
        <div className="freestyle-hero-grid mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col justify-center gap-10 px-4 py-10 md:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <Reveal className="relative z-10 flex flex-col items-start gap-6">
              <div className="flex items-center gap-3">
                <Image
                  src="/brand/fs-mark-cropped.webp"
                  alt=""
                  width={74}
                  height={64}
                  className="h-12 w-auto object-contain drop-shadow-[0_0_18px_rgba(198,255,0,0.25)]"
                  priority
                />
                <p className="text-sm font-bold tracking-[0.3em] text-primary">NUEVA TEMPORADA</p>
              </div>

              <h1 className="font-display text-6xl font-black italic leading-[0.85] tracking-tight text-white sm:text-8xl lg:text-9xl">
                ENTRENÁ
                <br />
                SIN LÍMITES
              </h1>

              <p className="max-w-xl text-lg leading-8 text-zinc-200 sm:text-xl">
                Indumentaria, calzado y accesorios para moverte con libertad. Buscá por marca,
                talle o color y llegá directo al producto disponible.
              </p>

              <form
                action="/buscar"
                className="w-full max-w-2xl rounded-3xl border border-white/15 bg-white/10 p-2 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur"
              >
                <div className="flex flex-col gap-2 sm:flex-row">
                  <label className="relative flex-1">
                    <span className="sr-only">Buscar productos</span>
                    <SearchIcon
                      className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-zinc-400"
                      aria-hidden="true"
                    />
                    <input
                      className="h-13 w-full rounded-2xl border border-white/10 bg-black/45 pl-12 pr-4 text-sm text-white outline-none placeholder:text-zinc-400 focus:border-primary"
                      name="q"
                      placeholder="Buscar Nike, zapatilla, talle 41..."
                      type="search"
                    />
                  </label>
                  <Button type="submit" size="lg" className="gap-2">
                    Buscar
                    <ArrowRightIcon data-icon="inline-end" />
                  </Button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 px-1">
                  {quickSearches.map((query) => (
                    <Link
                      key={query}
                      className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white transition hover:border-primary hover:text-primary"
                      href={`/buscar?q=${encodeURIComponent(query)}`}
                    >
                      {query}
                    </Link>
                  ))}
                </div>
              </form>

              <div className="flex flex-wrap gap-3">
                <Button size="lg" asChild className="gap-3 shadow-[0_0_28px_rgba(198,255,0,0.25)]">
                  <Link href="/productos">
                    Ver colección
                    <ArrowRightIcon data-icon="inline-end" />
                  </Link>
                </Button>
                <Button size="lg" asChild variant="secondary">
                  <Link href="/ofertas">Ver ofertas</Link>
                </Button>
              </div>

              <div className="grid gap-4 pt-4 sm:grid-cols-3">
                {benefitItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <div
                      key={item.label}
                      className="flex items-center gap-3 border-r border-white/20 pr-4 last:border-r-0"
                    >
                      <Icon className="size-8 text-primary" aria-hidden="true" />
                      <div>
                        <p className="text-sm font-black uppercase text-white">{item.label}</p>
                        <p className="text-xs uppercase leading-5 text-zinc-300">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Reveal>

            <Reveal delay={0.08} className="relative z-0 min-h-[26rem]">
              <div className="relative min-h-[28rem] overflow-hidden rounded-[2rem] border border-white/10 bg-card shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
                <Image
                  src="/brand/home-runner.png"
                  alt="Persona corriendo al amanecer"
                  fill
                  priority
                  sizes="(min-width: 1024px) 48rem, 100vw"
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.62),rgba(0,0,0,0.18)_48%,rgba(0,0,0,0.46)),radial-gradient(circle_at_70%_20%,rgba(198,255,0,0.2),transparent_28%)]" />
                <div className="absolute right-0 top-10 hidden h-36 w-[48%] bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.96),rgba(0,0,0,0.82)_48%,transparent_78%)] sm:block" />
                <Image
                  src="/brand/freestyle-logo-cropped.webp"
                  alt=""
                  width={260}
                  height={118}
                  className="absolute right-6 top-14 hidden w-56 opacity-70 drop-shadow-[0_0_24px_rgba(0,0,0,0.9)] sm:block"
                />
                <div className="absolute left-5 top-5 max-w-xs">
                  <Badge className="bg-primary text-primary-foreground">FreeStyle</Badge>
                  <p className="mt-3 font-display text-4xl font-black italic leading-none text-white">
                    RENDÍ MÁS.
                    <br />
                    VESTÍ MEJOR.
                  </p>
                </div>
                <div className="absolute bottom-5 left-5 right-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/15 bg-black/45 p-4 backdrop-blur">
                    <p className="text-2xl font-black text-white">{products.length}</p>
                    <p className="text-xs uppercase tracking-wide text-zinc-300">productos</p>
                  </div>
                  <div className="rounded-2xl border border-white/15 bg-black/45 p-4 backdrop-blur">
                    <p className="text-2xl font-black text-white">{stockCount}</p>
                    <p className="text-xs uppercase tracking-wide text-zinc-300">con stock</p>
                  </div>
                  <div className="rounded-2xl border border-white/15 bg-black/45 p-4 backdrop-blur">
                    <p className="text-2xl font-black text-white">{offerCount}</p>
                    <p className="text-xs uppercase tracking-wide text-zinc-300">ofertas</p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.14} className="relative z-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {categoryCards.map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.href} href={item.href} className="freestyle-category-card group">
                  <Icon className="size-10 text-primary transition group-hover:scale-110" aria-hidden="true" />
                  <div>
                    <p className="font-display text-xl font-black uppercase italic text-white">
                      {item.label}
                    </p>
                    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-primary">
                      {item.description}
                      <ArrowRightIcon className="size-3" aria-hidden="true" />
                    </p>
                  </div>
                </Link>
              )
            })}
          </Reveal>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 md:px-8 md:py-14 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-[2rem] border bg-card p-6 shadow-sm md:p-8">
          <Badge className="w-fit">Compra rápida</Badge>
          <h2 className="mt-4 font-display text-4xl font-black italic tracking-tight text-white">
            Lo más listo para vender
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Esta sección prioriza productos con stock y ofertas. La idea es que el cliente vea algo
            comprable apenas entra, sin tener que navegar de más.
          </p>
          {isDemo ? (
            <p className="mt-4 rounded-2xl border bg-secondary/40 p-4 text-sm text-muted-foreground">
              Mostrando productos de ejemplo hasta que el equipo cargue el catálogo desde el panel.
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/productos">Explorar catálogo</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/ofertas">Ir a promociones</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </main>
  )
}
