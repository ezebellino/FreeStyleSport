"use client"

import { ClipboardIcon, MinusIcon, PlusIcon, Trash2Icon } from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"

import { useCart } from "@/components/cart/cart-provider"
import { ProductImage } from "@/components/products/product-image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { buildReservationMessage, formatCartPrice } from "@/lib/cart"

const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER

function buildWhatsAppHref(message: string) {
  if (!whatsappNumber) {
    return null
  }

  const normalizedNumber = whatsappNumber.replace(/\D/g, "")
  return `https://wa.me/${normalizedNumber}?text=${encodeURIComponent(message)}`
}

export function CartPageContent() {
  const { items, total, incrementItem, decrementItem, removeItem, clearCart } = useCart()
  const [copied, setCopied] = useState(false)
  const message = useMemo(() => buildReservationMessage(items, total), [items, total])
  const whatsappHref = buildWhatsAppHref(message)

  async function copyMessage() {
    await navigator.clipboard.writeText(message)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  if (items.length === 0) {
    return (
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl flex-col justify-center gap-6 px-4 py-16 md:px-8">
        <Badge className="w-fit">Carrito</Badge>
        <div className="space-y-3">
          <h1 className="font-display text-4xl font-black italic tracking-tight sm:text-6xl">
            Tu carrito está vacío
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Agregá productos del catálogo para consultar disponibilidad, reservar o coordinar el pago.
          </p>
        </div>
        <Button asChild className="w-fit">
          <Link href="/productos">Ver productos</Link>
        </Button>
      </section>
    )
  }

  return (
    <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[1fr_24rem] md:px-8 md:py-16">
      <div className="space-y-5">
        <Badge className="w-fit">Carrito</Badge>
        <div className="space-y-2">
          <h1 className="font-display text-4xl font-black italic tracking-tight sm:text-6xl">
            Tu selección
          </h1>
          <p className="text-muted-foreground">
            Revisá los productos y avanzá con una consulta o reserva. La compra final se coordina con el local.
          </p>
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <article
              key={item.slug}
              className="grid gap-4 rounded-3xl border bg-card p-4 sm:grid-cols-[7rem_1fr_auto]"
            >
              <Link href={`/productos/${item.slug}`} className="aspect-square overflow-hidden rounded-2xl bg-secondary">
                {item.imageUrl ? (
                  <ProductImage alt={item.name} className="size-full object-cover" src={item.imageUrl} />
                ) : (
                  <div className="flex size-full items-center justify-center font-display font-black italic text-muted-foreground">
                    FreeStyle
                  </div>
                )}
              </Link>
              <div className="space-y-2">
                <Link href={`/productos/${item.slug}`} className="text-lg font-semibold hover:text-primary">
                  {item.name}
                </Link>
                <p className="text-sm text-muted-foreground">{formatCartPrice(item.price)} c/u</p>
                <div className="flex w-fit items-center rounded-full border">
                  <Button variant="ghost" size="icon" aria-label="Restar unidad" onClick={() => decrementItem(item.slug)}>
                    <MinusIcon data-icon="inline-start" />
                  </Button>
                  <span className="min-w-8 text-center text-sm font-bold">{item.quantity}</span>
                  <Button variant="ghost" size="icon" aria-label="Sumar unidad" onClick={() => incrementItem(item.slug)}>
                    <PlusIcon data-icon="inline-start" />
                  </Button>
                </div>
              </div>
              <div className="flex items-start justify-between gap-3 sm:flex-col sm:items-end">
                <p className="text-xl font-black">{formatCartPrice(item.price * item.quantity)}</p>
                <Button variant="ghost" size="icon" aria-label="Quitar producto" onClick={() => removeItem(item.slug)}>
                  <Trash2Icon data-icon="inline-start" />
                </Button>
              </div>
            </article>
          ))}
        </div>
      </div>

      <aside className="h-fit space-y-4 rounded-3xl border bg-card p-5">
        <div className="space-y-2">
          <h2 className="text-2xl font-black">Resumen</h2>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Productos</span>
            <span>{items.reduce((count, item) => count + item.quantity, 0)}</span>
          </div>
          <div className="flex justify-between text-lg font-black">
            <span>Total estimado</span>
            <span>{formatCartPrice(total)}</span>
          </div>
        </div>

        <div className="rounded-2xl border bg-secondary/50 p-4 text-sm leading-6 text-muted-foreground">
          <p className="font-semibold text-foreground">Medios de pago</p>
          <p>Efectivo, billeteras virtuales y tarjetas.</p>
          <p>Cuenta DNI: 20% de lunes a viernes.</p>
          <p>Banco Provincia: 4 cuotas sin interés viernes y sábados.</p>
          <p>Retiro y pago en el local: Buenos Aires 68, Dolores.</p>
        </div>

        <div className="space-y-2">
          {whatsappHref ? (
            <Button asChild className="w-full">
              <a href={whatsappHref} target="_blank" rel="noreferrer">
                Consultar por WhatsApp
              </a>
            </Button>
          ) : null}
          <Button className="w-full" variant="secondary" type="button" onClick={copyMessage}>
            <ClipboardIcon data-icon="inline-start" />
            {copied ? "Mensaje copiado" : "Copiar consulta"}
          </Button>
          <Button className="w-full" variant="ghost" type="button" onClick={clearCart}>
            Vaciar carrito
          </Button>
        </div>

        <p className="text-xs leading-5 text-muted-foreground">
          Mercado Pago y transferencia quedan preparados como próximos medios de cierre cuando definamos credenciales y operación.
        </p>
      </aside>
    </section>
  )
}
