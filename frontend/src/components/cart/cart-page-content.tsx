"use client"

import {
  CheckCircle2Icon,
  ClipboardIcon,
  CreditCardIcon,
  MapPinIcon,
  MessageCircleIcon,
  MinusIcon,
  PackageCheckIcon,
  PlusIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  StoreIcon,
  Trash2Icon,
  TruckIcon,
  UserIcon,
} from "lucide-react"
import Link from "next/link"
import { type FormEvent, useEffect, useMemo, useState } from "react"

import { useCart } from "@/components/cart/cart-provider"
import { ProductImage } from "@/components/products/product-image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getCurrentUser, type PublicUser } from "@/lib/auth"
import { buildReservationMessage, formatCartPrice } from "@/lib/cart"
import {
  createStoreOrder,
  orderItemVariantDescription,
  type OrderCreatePayload,
  type OrderRead,
} from "@/lib/orders"

const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER

const paymentOptions: Array<{
  value: OrderCreatePayload["payment_method"]
  label: string
  description: string
}> = [
  {
    value: "to_confirm",
    label: "A confirmar",
    description: "El local te responde con la mejor opción disponible.",
  },
  {
    value: "cash",
    label: "Efectivo",
    description: "Ideal para retirar o aprovechar promos del local.",
  },
  {
    value: "transfer",
    label: "Transferencia",
    description: "Reservás y luego enviás el comprobante.",
  },
  {
    value: "mercado_pago",
    label: "Mercado Pago",
    description: "El local coordina link o medio de pago.",
  },
  {
    value: "card",
    label: "Tarjeta",
    description: "Consultá cuotas y promociones vigentes.",
  },
  {
    value: "wallet",
    label: "Billetera virtual",
    description: "Cuenta DNI u otra billetera disponible.",
  },
]

const fulfillmentOptions: Array<{
  value: OrderCreatePayload["fulfillment_method"]
  label: string
  description: string
}> = [
  {
    value: "pickup",
    label: "Retiro en local",
    description: "Buenos Aires 68, Dolores.",
  },
  {
    value: "shipping",
    label: "Envío",
    description: "Se coordina dirección, costo y horario.",
  },
  {
    value: "local_payment",
    label: "Pago en el local",
    description: "Reservás y abonás al retirar.",
  },
]

function buildWhatsAppHref(message: string) {
  if (!whatsappNumber) {
    return null
  }

  const normalizedNumber = whatsappNumber.replace(/\D/g, "")
  return `https://wa.me/${normalizedNumber}?text=${encodeURIComponent(message)}`
}

function userDisplayName(user: PublicUser) {
  return [user.first_name, user.last_name].filter(Boolean).join(" ").trim()
}

function orderCode(orderId: string) {
  return orderId.slice(0, 8).toUpperCase()
}

function paymentInstruction(paymentMethod: OrderCreatePayload["payment_method"]) {
  if (paymentMethod === "transfer") {
    return "Prepará el comprobante de transferencia y envialo por WhatsApp para confirmar el pedido."
  }
  if (paymentMethod === "mercado_pago") {
    return "El local va a coordinar el link o medio de Mercado Pago para cerrar la compra."
  }
  if (paymentMethod === "cash") {
    return "Podés pagar en efectivo cuando el comercio confirme disponibilidad."
  }
  if (paymentMethod === "card") {
    return "El local confirma cuotas, promociones y terminal disponible."
  }
  if (paymentMethod === "wallet") {
    return "El local confirma billetera disponible y promoción vigente."
  }
  return "El local revisa la reserva y coordina el medio de pago más conveniente."
}

function fulfillmentInstruction(fulfillmentMethod: OrderCreatePayload["fulfillment_method"]) {
  if (fulfillmentMethod === "shipping") {
    return "Coordiná dirección, costo y horario de envío con el local antes de cerrar la compra."
  }
  if (fulfillmentMethod === "local_payment") {
    return "Retirás y pagás en Buenos Aires 68, Dolores, cuando el local confirme disponibilidad."
  }
  return "Retiro en Buenos Aires 68, Dolores, una vez confirmado el pedido."
}

function buildOrderConfirmationMessage(order: OrderRead) {
  const itemLines = order.items
    .map((item) => {
      const variantDescription = orderItemVariantDescription(item)
      return `- ${item.quantity} x ${item.product_name}${variantDescription ? ` / ${variantDescription}` : ""}`
    })
    .join("\n")

  return [
    `Hola, hice una reserva en FreeStyle. Pedido #${orderCode(order.id)}.`,
    "",
    itemLines,
    "",
    `Total: ${formatCartPrice(Number(order.total))}`,
    "Quedo atento/a para confirmar pago y disponibilidad.",
  ].join("\n")
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
  const [createdOrder, setCreatedOrder] = useState<OrderRead | null>(null)
  const [error, setError] = useState<string | null>(null)
  const message = useMemo(() => buildReservationMessage(items, total), [items, total])
  const whatsappHref = buildWhatsAppHref(message)
  const createdOrderWhatsappHref = createdOrder
    ? buildWhatsAppHref(buildOrderConfirmationMessage(createdOrder))
    : null
  const itemCount = items.reduce((count, item) => count + item.quantity, 0)
  const selectedPayment = paymentOptions.find((option) => option.value === paymentMethod)
  const selectedFulfillment = fulfillmentOptions.find((option) => option.value === fulfillmentMethod)
  const canSubmit = itemCount > 0 && customerName.trim().length > 1 && customerPhone.trim().length > 5

  useEffect(() => {
    let isMounted = true

    getCurrentUser()
      .then((user) => {
        if (isMounted && user) {
          const displayName = userDisplayName(user)
          setCustomerName((currentName) => currentName || displayName)
          setCustomerPhone((currentPhone) => currentPhone || user.phone || "")
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

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) {
      setError("Necesitamos tu nombre y un WhatsApp válido para coordinar la reserva.")
      return
    }

    setError(null)
    setCreatedOrder(null)
    setIsSubmitting(true)

    try {
      const order = await createStoreOrder({
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim() || undefined,
        payment_method: paymentMethod,
        fulfillment_method: fulfillmentMethod,
        notes: notes.trim() || undefined,
        items: items.map((item) => ({
          product_slug: item.slug,
          quantity: item.quantity,
          variant_id: item.variantId,
          variant_label: item.variantLabel,
          variant_color: item.variantColor,
          variant_size: item.variantSize,
        })),
      })
      setCreatedOrder(order)
      clearCart()
    } catch (orderError) {
      setError(orderError instanceof Error ? orderError.message : "No pudimos crear la reserva")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (createdOrder) {
    const code = orderCode(createdOrder.id)

    return (
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col justify-center gap-6 px-4 py-16 md:px-8">
        <Badge className="w-fit">Reserva creada</Badge>
        <div className="space-y-3">
          <h1 className="font-display text-4xl font-black italic tracking-tight sm:text-6xl">
            Pedido reservado
          </h1>
          <p className="w-fit rounded-2xl border bg-secondary/40 px-4 py-3 font-mono text-sm">
            Reserva #{code}
          </p>
          <p className="max-w-2xl text-muted-foreground">
            Guardamos tu pedido con el código {code}. El local puede verlo desde el panel y coordinar
            el próximo paso sin que tengas que cargar todo de nuevo.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <article className="rounded-2xl border bg-card p-4">
            <CheckCircle2Icon className="size-5 text-primary" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold">1. Pago</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {paymentInstruction(paymentMethod)}
            </p>
          </article>
          <article className="rounded-2xl border bg-card p-4">
            <PackageCheckIcon className="size-5 text-primary" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold">2. Entrega o retiro</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {fulfillmentInstruction(fulfillmentMethod)}
            </p>
          </article>
          <article className="rounded-2xl border bg-card p-4">
            <ShieldCheckIcon className="size-5 text-primary" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold">3. Seguimiento</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Podés volver a esta reserva desde tu perfil o abrir el seguimiento con el código del pedido.
            </p>
          </article>
        </div>

        <div className="rounded-2xl border bg-secondary/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Total estimado</p>
              <p className="text-2xl font-black">{formatCartPrice(Number(createdOrder.total))}</p>
            </div>
            <Badge variant={createdOrder.payment_status === "paid" ? "default" : "secondary"}>
              Pago pendiente de confirmación
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href={`/pedido/${createdOrder.id}`}>Ver seguimiento</Link>
          </Button>
          {createdOrderWhatsappHref ? (
            <Button asChild variant="secondary">
              <a href={createdOrderWhatsappHref} target="_blank" rel="noreferrer">
                Confirmar por WhatsApp
              </a>
            </Button>
          ) : null}
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
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/productos">Ver productos</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/ofertas">Ver ofertas</Link>
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:px-8 md:py-16 lg:grid-cols-[1fr_28rem]">
      <div className="space-y-6">
        <div className="overflow-hidden rounded-[2rem] border bg-card shadow-sm">
          <div className="bg-[radial-gradient(circle_at_12%_18%,rgba(198,255,0,0.18),transparent_30%),linear-gradient(135deg,#020617,#18181b_62%,#1d4ed8)] p-6">
            <Badge className="w-fit bg-white text-slate-950 hover:bg-white">Carrito</Badge>
            <h1 className="mt-4 font-display text-4xl font-black italic tracking-tight text-white sm:text-6xl">
              Revisá y reservá
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">
              Confirmá producto, color, talle, entrega y medio de pago. El pedido queda registrado
              para que el local pueda gestionarlo desde el panel.
            </p>
          </div>

          <div className="grid gap-3 p-4 sm:grid-cols-3">
            <div className="rounded-2xl border bg-secondary/40 p-4">
              <ShoppingBagIcon className="size-5 text-primary" aria-hidden="true" />
              <p className="mt-2 font-bold">1. Productos</p>
              <p className="text-xs text-muted-foreground">Revisá cantidad, color y talle.</p>
            </div>
            <div className="rounded-2xl border bg-secondary/40 p-4">
              <UserIcon className="size-5 text-primary" aria-hidden="true" />
              <p className="mt-2 font-bold">2. Contacto</p>
              <p className="text-xs text-muted-foreground">Nombre y WhatsApp para coordinar.</p>
            </div>
            <div className="rounded-2xl border bg-secondary/40 p-4">
              <CheckCircle2Icon className="size-5 text-primary" aria-hidden="true" />
              <p className="mt-2 font-bold">3. Reserva</p>
              <p className="text-xs text-muted-foreground">Se descuenta stock al crear pedido.</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {items.map((item) => {
            const variantText = [
              item.variantColor ? `Color: ${item.variantColor}` : null,
              item.variantSize ? `Talle: ${item.variantSize}` : null,
            ]
              .filter(Boolean)
              .join(" · ")

            return (
              <article
                key={item.key}
                className="grid gap-4 rounded-3xl border bg-card p-4 shadow-sm sm:grid-cols-[7rem_1fr_auto]"
              >
                <Link
                  href={`/productos/${item.slug}`}
                  className="aspect-square overflow-hidden rounded-2xl bg-white"
                >
                  {item.imageUrl ? (
                    <ProductImage
                      alt={item.name}
                      className="size-full object-contain p-2"
                      src={item.imageUrl}
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center font-display font-black italic text-slate-500">
                      FreeStyle
                    </div>
                  )}
                </Link>
                <div className="space-y-3">
                  <div>
                    <Link
                      href={`/productos/${item.slug}`}
                      className="text-lg font-semibold hover:text-primary"
                    >
                      {item.name}
                    </Link>
                    {variantText || item.variantLabel ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {variantText ? <Badge variant="secondary">{variantText}</Badge> : null}
                        {!variantText && item.variantLabel ? (
                          <Badge variant="secondary">{item.variantLabel}</Badge>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  <p className="text-sm text-muted-foreground">{formatCartPrice(item.price)} c/u</p>
                  <div className="flex w-fit items-center rounded-full border">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Restar unidad"
                      onClick={() => decrementItem(item.key)}
                    >
                      <MinusIcon data-icon="inline-start" />
                    </Button>
                    <span className="min-w-8 text-center text-sm font-bold">{item.quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Sumar unidad"
                      onClick={() => incrementItem(item.key)}
                    >
                      <PlusIcon data-icon="inline-start" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-start justify-between gap-3 sm:flex-col sm:items-end">
                  <p className="text-xl font-black">{formatCartPrice(item.price * item.quantity)}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Quitar producto"
                    onClick={() => removeItem(item.key)}
                  >
                    <Trash2Icon data-icon="inline-start" />
                  </Button>
                </div>
              </article>
            )
          })}
        </div>
      </div>

      <aside className="h-fit space-y-4 rounded-[2rem] border bg-card p-5 shadow-sm lg:sticky lg:top-24">
        <div className="space-y-3">
          <h2 className="text-2xl font-black">Resumen del pedido</h2>
          <div className="rounded-2xl border bg-secondary/40 p-4">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Unidades</span>
              <span>{itemCount}</span>
            </div>
            <div className="mt-2 flex justify-between text-lg font-black">
              <span>Total estimado</span>
              <span>{formatCartPrice(total)}</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              El total no incluye envío. Si elegís envío, el local lo confirma antes de cerrar.
            </p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={submitOrder}>
          <div className="rounded-2xl border bg-background/45 p-4">
            <div className="mb-3 flex items-center gap-2">
              <UserIcon className="size-4 text-primary" aria-hidden="true" />
              <p className="font-bold">Tus datos</p>
            </div>
            <div className="space-y-3">
              <label className="space-y-2" htmlFor="customer-name">
                <span className="text-sm font-semibold">Nombre</span>
                <input
                  id="customer-name"
                  className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="Tu nombre"
                  required
                />
              </label>
              <label className="space-y-2" htmlFor="customer-phone">
                <span className="text-sm font-semibold">WhatsApp</span>
                <input
                  id="customer-phone"
                  className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  value={customerPhone}
                  onChange={(event) => setCustomerPhone(event.target.value)}
                  placeholder="Ej: 2245..."
                  required
                />
              </label>
              <label className="space-y-2" htmlFor="customer-email">
                <span className="text-sm font-semibold">Email opcional</span>
                <input
                  id="customer-email"
                  type="email"
                  className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  value={customerEmail}
                  onChange={(event) => setCustomerEmail(event.target.value)}
                  placeholder="tu@email.com"
                />
              </label>
            </div>
          </div>

          <div className="rounded-2xl border bg-background/45 p-4">
            <div className="mb-3 flex items-center gap-2">
              <CreditCardIcon className="size-4 text-primary" aria-hidden="true" />
              <p className="font-bold">Forma de pago</p>
            </div>
            <div className="grid gap-2">
              {paymentOptions.map((option) => (
                <label
                  key={option.value}
                  className={`cursor-pointer rounded-2xl border p-3 transition ${
                    paymentMethod === option.value
                      ? "border-primary bg-primary/10"
                      : "bg-card hover:border-primary/60"
                  }`}
                >
                  <input
                    className="sr-only"
                    type="radio"
                    name="payment-method"
                    value={option.value}
                    checked={paymentMethod === option.value}
                    onChange={() => setPaymentMethod(option.value)}
                  />
                  <span className="block text-sm font-bold">{option.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                    {option.description}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border bg-background/45 p-4">
            <div className="mb-3 flex items-center gap-2">
              <TruckIcon className="size-4 text-primary" aria-hidden="true" />
              <p className="font-bold">Entrega</p>
            </div>
            <div className="grid gap-2">
              {fulfillmentOptions.map((option) => (
                <label
                  key={option.value}
                  className={`cursor-pointer rounded-2xl border p-3 transition ${
                    fulfillmentMethod === option.value
                      ? "border-primary bg-primary/10"
                      : "bg-card hover:border-primary/60"
                  }`}
                >
                  <input
                    className="sr-only"
                    type="radio"
                    name="fulfillment-method"
                    value={option.value}
                    checked={fulfillmentMethod === option.value}
                    onChange={() => setFulfillmentMethod(option.value)}
                  />
                  <span className="block text-sm font-bold">{option.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                    {option.description}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <label className="block space-y-2" htmlFor="order-notes">
            <span className="text-sm font-semibold">Comentario opcional</span>
            <textarea
              id="order-notes"
              className="min-h-20 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Horario de retiro, dirección aproximada o cualquier aclaración."
            />
          </label>

          <div className="rounded-2xl border bg-secondary/40 p-4 text-sm leading-6 text-muted-foreground">
            <div className="flex items-start gap-3">
              {fulfillmentMethod === "pickup" || fulfillmentMethod === "local_payment" ? (
                <StoreIcon className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" />
              ) : (
                <MapPinIcon className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" />
              )}
              <div>
                <p className="font-semibold text-foreground">{selectedFulfillment?.label}</p>
                <p>{fulfillmentInstruction(fulfillmentMethod)}</p>
                <p className="mt-2 font-semibold text-foreground">{selectedPayment?.label}</p>
                <p>{paymentInstruction(paymentMethod)}</p>
              </div>
            </div>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button className="w-full" type="submit" disabled={isSubmitting || !canSubmit}>
            <PackageCheckIcon data-icon="inline-start" />
            {isSubmitting ? "Creando reserva..." : "Crear reserva"}
          </Button>
        </form>

        <div className="rounded-2xl border bg-secondary/50 p-4 text-sm leading-6 text-muted-foreground">
          <p className="font-semibold text-foreground">Promos vigentes</p>
          <p>Cuenta DNI: 20% de lunes a viernes.</p>
          <p>Banco Provincia: 4 cuotas sin interés viernes y sábados.</p>
          <p>Retiro y pago en el local: Buenos Aires 68, Dolores.</p>
        </div>

        <div className="space-y-2">
          {whatsappHref ? (
            <Button asChild className="w-full" variant="secondary">
              <a href={whatsappHref} target="_blank" rel="noreferrer">
                <MessageCircleIcon data-icon="inline-start" />
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

        <Button asChild className="w-full" variant="outline">
          <Link href="/ayuda">Ver servicios y condiciones</Link>
        </Button>
      </aside>
    </section>
  )
}
