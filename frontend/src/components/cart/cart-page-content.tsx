"use client"

import { ClipboardIcon, MinusIcon, PlusIcon, Trash2Icon } from "lucide-react"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

import { useCart } from "@/components/cart/cart-provider"
import { ProductImage } from "@/components/products/product-image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/auth"
import { buildReservationMessage, formatCartPrice } from "@/lib/cart"
import { createStoreOrder, type OrderCreatePayload } from "@/lib/orders"

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
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [paymentMethod, setPaymentMethod] =
    useState<OrderCreatePayload["payment_method"]>("to_confirm")
  const [fulfillmentMethod, setFulfillmentMethod] =
    useState<OrderCreatePayload["fulfillment_method"]>("pickup")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const message = useMemo(() => buildReservationMessage(items, total), [items, total])
  const whatsappHref = buildWhatsAppHref(message)

  useEffect(() => {
    let isMounted = true

    getCurrentUser()
      .then((user) => {
        if (isMounted && user?.email) {
          setCustomerEmail((currentEmail) => currentEmail || user.email)
        }
      })
      .catch(() => undefined)

    return () => {
      isMounted = false
    }
  }, [])

  async function copyMessage() {
    await navigator.clipboard.writeText(message)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  async function submitOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setOrderId(null)
    setIsSubmitting(true)

    try {
      const order = await createStoreOrder({
        customer_name: customerName.trim() || undefined,
        customer_phone: customerPhone.trim() || undefined,
        customer_email: customerEmail.trim() || undefined,
        payment_method: paymentMethod,
        fulfillment_method: fulfillmentMethod,
        notes: notes.trim() || undefined,
        items: items.map((item) => ({
          product_slug: item.slug,
          quantity: item.quantity,
          variant_id: item.variantId,
          variant_label: item.variantLabel,
        })),
      })
      setOrderId(order.id)
      clearCart()
    } catch (orderError) {
      setError(orderError instanceof Error ? orderError.message : "No pudimos crear la reserva")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (orderId) {
    return (
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl flex-col justify-center gap-6 px-4 py-16 md:px-8">
        <Badge className="w-fit">Reserva creada</Badge>
        <div className="space-y-3">
          <h1 className="font-display text-4xl font-black italic tracking-tight sm:text-6xl">
            Consulta guardada
          </h1>
          <p className="w-fit rounded-2xl border bg-secondary/40 px-4 py-3 font-mono text-sm">
            Reserva #{orderId.slice(0, 8).toUpperCase()}
          </p>
          <p className="max-w-2xl text-muted-foreground">
            Guardamos tu consulta con el código {orderId.slice(0, 8).toUpperCase()}. El local puede revisarla desde el panel y coordinar el próximo paso.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href={`/pedido/${orderId}`}>Ver seguimiento</Link>
          </Button>
          <Button asChild>
            <Link href="/productos">Seguir viendo productos</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/ayuda">Ver servicios de compra</Link>
          </Button>
        </div>
      </section>
    )
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
              key={item.key}
              className="grid gap-4 rounded-3xl border bg-card p-4 sm:grid-cols-[7rem_1fr_auto]"
            >
              <Link
                href={`/productos/${item.slug}`}
                className="aspect-square overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_center,#ffffff_0%,#f8fafc_45%,#dbeafe_100%)]"
              >
                {item.imageUrl ? (
                  <ProductImage alt={item.name} className="size-full object-contain p-2" src={item.imageUrl} />
                ) : (
                  <div className="flex size-full items-center justify-center font-display font-black italic text-slate-500">
                    FreeStyle
                  </div>
                )}
              </Link>
              <div className="space-y-2">
                <Link href={`/productos/${item.slug}`} className="text-lg font-semibold hover:text-primary">
                  {item.name}
                </Link>
                {item.variantLabel ? (
                  <p className="text-xs font-medium text-muted-foreground">
                    {item.variantColor ? `Color: ${item.variantColor}` : null}
                    {item.variantColor && item.variantSize ? " · " : null}
                    {item.variantSize ? `Talle: ${item.variantSize}` : item.variantLabel}
                  </p>
                ) : null}
                <p className="text-sm text-muted-foreground">{formatCartPrice(item.price)} c/u</p>
                <div className="flex w-fit items-center rounded-full border">
                  <Button variant="ghost" size="icon" aria-label="Restar unidad" onClick={() => decrementItem(item.key)}>
                    <MinusIcon data-icon="inline-start" />
                  </Button>
                  <span className="min-w-8 text-center text-sm font-bold">{item.quantity}</span>
                  <Button variant="ghost" size="icon" aria-label="Sumar unidad" onClick={() => incrementItem(item.key)}>
                    <PlusIcon data-icon="inline-start" />
                  </Button>
                </div>
              </div>
              <div className="flex items-start justify-between gap-3 sm:flex-col sm:items-end">
                <p className="text-xl font-black">{formatCartPrice(item.price * item.quantity)}</p>
                <Button variant="ghost" size="icon" aria-label="Quitar producto" onClick={() => removeItem(item.key)}>
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

        <form className="space-y-3" onSubmit={submitOrder}>
          <div className="space-y-2">
            <label className="text-sm font-semibold" htmlFor="customer-name">
              Nombre
            </label>
            <input
              id="customer-name"
              className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              placeholder="Tu nombre"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold" htmlFor="customer-phone">
              Teléfono o WhatsApp
            </label>
            <input
              id="customer-phone"
              className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              value={customerPhone}
              onChange={(event) => setCustomerPhone(event.target.value)}
              placeholder="Ej: 2245..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold" htmlFor="customer-email">
              Email
            </label>
            <input
              id="customer-email"
              type="email"
              className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              value={customerEmail}
              onChange={(event) => setCustomerEmail(event.target.value)}
              placeholder="opcional"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold" htmlFor="payment-method">
                Pago
              </label>
              <select
                id="payment-method"
                className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                value={paymentMethod}
                onChange={(event) =>
                  setPaymentMethod(event.target.value as OrderCreatePayload["payment_method"])
                }
              >
                <option value="to_confirm">A confirmar</option>
                <option value="cash">Efectivo</option>
                <option value="transfer">Transferencia</option>
                <option value="mercado_pago">Mercado Pago</option>
                <option value="card">Tarjeta</option>
                <option value="wallet">Billetera virtual</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold" htmlFor="fulfillment-method">
                Entrega
              </label>
              <select
                id="fulfillment-method"
                className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                value={fulfillmentMethod}
                onChange={(event) =>
                  setFulfillmentMethod(event.target.value as OrderCreatePayload["fulfillment_method"])
                }
              >
                <option value="pickup">Retiro en local</option>
                <option value="shipping">Envío</option>
                <option value="local_payment">Pago en el local</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold" htmlFor="order-notes">
              Comentario
            </label>
            <textarea
              id="order-notes"
              className="min-h-20 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Talle, color, horario de retiro o cualquier aclaración."
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creando reserva..." : "Crear reserva"}
          </Button>
        </form>

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
        <Button asChild className="w-full" variant="outline">
          <Link href="/ayuda">Ver servicios y condiciones</Link>
        </Button>
      </aside>
    </section>
  )
}
