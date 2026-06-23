import {
  ArrowRightIcon,
  CreditCardIcon,
  RefreshCwIcon,
  ShoppingBagIcon,
  TagIcon,
  TruckIcon,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import { Reveal } from "@/components/motion/reveal"
import { Button } from "@/components/ui/button"

const benefitItems = [
  { label: "Envíos", description: "A todo el país", icon: TruckIcon },
  { label: "Pagos", description: "Efectivo, tarjetas y billeteras", icon: CreditCardIcon },
  { label: "Cambios", description: "Coordinados con el local", icon: RefreshCwIcon },
] as const

const categoryCards = [
  { label: "Hombre", href: "/productos?linea=hombre", description: "Ver todo", icon: ShoppingBagIcon },
  { label: "Mujer", href: "/productos?linea=mujer", description: "Ver todo", icon: ShoppingBagIcon },
  { label: "Calzado", href: "/productos?categoria=calzado", description: "Ver todo", icon: ShoppingBagIcon },
  { label: "Accesorios", href: "/productos?categoria=accesorios", description: "Ver todo", icon: ShoppingBagIcon },
  { label: "Ofertas", href: "/ofertas", description: "Promos activas", icon: TagIcon },
] as const

export default function HomePage() {
  return (
    <section className="freestyle-hero overflow-hidden">
      <div className="freestyle-hero-grid mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col justify-center gap-10 px-4 py-10 md:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal className="relative z-10 flex flex-col items-start gap-6">
            <div className="flex items-center gap-3">
              <Image
                src="/brand/freestyle-logo.png"
                alt=""
                width={48}
                height={48}
                className="rounded-full border border-white/15 bg-white object-contain shadow-[0_0_28px_rgba(198,255,0,0.25)]"
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
              Indumentaria, calzado y accesorios para moverte con libertad.
            </p>

            <Button size="lg" asChild className="gap-3 shadow-[0_0_28px_rgba(198,255,0,0.25)]">
              <Link href="/productos">
                VER COLECCIÓN
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>

            <div className="grid gap-4 pt-4 sm:grid-cols-3">
              {benefitItems.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="flex items-center gap-3 border-r border-white/20 pr-4 last:border-r-0">
                    <Icon className="size-8 text-primary" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-black uppercase text-white">{item.label}</p>
                      <p className="text-xs uppercase leading-5 text-zinc-300">{item.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </Reveal>

          <Reveal delay={0.08} className="relative z-0 min-h-[26rem]">
            <div className="freestyle-athlete-stage">
              <p className="freestyle-outline-word" aria-hidden="true">
                FREE
                <br />
                STYLE
              </p>
              <div className="freestyle-neon-sash" aria-hidden="true" />
              <div className="freestyle-smoke freestyle-smoke-a" aria-hidden="true" />
              <div className="freestyle-smoke freestyle-smoke-b" aria-hidden="true" />
              <div className="freestyle-runner" aria-label="Silueta deportiva abstracta" />
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
                  <p className="font-display text-xl font-black uppercase italic text-white">{item.label}</p>
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
  )
}
