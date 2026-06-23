import Image from "next/image"
import Link from "next/link"

import { Reveal } from "@/components/motion/reveal"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl content-center gap-6 px-4 py-16 md:grid-cols-2 md:px-8">
      <Reveal className="flex flex-col items-start gap-5">
        <p className="text-sm font-bold tracking-[0.2em] text-primary">NUEVA TEMPORADA</p>
        <h1 className="font-display text-5xl font-black italic leading-[0.9] tracking-tight sm:text-7xl">
          ENTRENÁ
          <br />
          SIN LÍMITES
        </h1>
        <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
          Indumentaria, calzado y accesorios para moverte con libertad.
        </p>
        <Button size="lg" asChild>
          <Link href="/productos">VER COLECCIÓN</Link>
        </Button>
      </Reveal>
      <Reveal delay={0.08} className="min-h-72">
        <div className="grid size-full min-h-72 place-items-center rounded-2xl bg-white p-8 ring-1 ring-border">
          <Image
            src="/brand/freestyle-logo.png"
            alt="FreeStyle Ropa Deportiva"
            width={250}
            height={250}
            className="max-h-56 object-contain"
            priority
          />
        </div>
      </Reveal>
    </section>
  )
}
