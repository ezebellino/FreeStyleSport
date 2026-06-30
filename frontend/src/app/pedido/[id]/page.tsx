import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  ClockIcon,
  CreditCardIcon,
  MapPinIcon,
  MessageCircleIcon,
  PackageCheckIcon,
  ShoppingBagIcon,
  TruckIcon,
  UserIcon,
  XCircleIcon,
} from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

import { ProductImage } from "@/components/products/product-image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCartPrice } from "@/lib/cart"
import { getStoreOrder, orderItemVariantDescription, type OrderRead } from "@/lib/orders"

const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER

const orderStatusLabels: Record<string, string> = {
  pending: "Reserva creada",
  confirmed: "Confirmada",
  preparing: "Preparando",
  ready: "Lista",
  delivered: "Entregada",
  cancelled: "Cancelada",
}

const paymentStatusLabels: Record<string, string> = {
  unpaid: "Pago sin confirmar",
  pending: "Pago pendiente",
  paid: "Pago confirmado",
  failed: "Pago rechazado",
  refunded: "Pago devuelto",
}

const paymentMethodLabels: Record<string, string> = {
  to_confirm: "A confirmar",
  cash: "Efectivo",
  transfer: "Transferencia",
  mercado_pago: "Mercado Pago",
  card: "Tarjeta",
  wallet: "Billetera virtual",
}

const fulfillmentLabels: Record<string, string> = {
  pickup: "Retiro en local",
  shipping: "Envío",
  local_payment: "Pago y retiro en el local",
}

const orderSteps = [
  {
    value: "pending",
    label: "Reserva",
    description: "El pedido ingresó al sistema.",
  },
  {
    value: "confirmed",
    label: "Confirmación",
    description: "El local valida stock y datos.",
  },
  {
    value: "preparing",
    label: "Preparación",
    description: "El equipo arma el pedido.",
  },
  {
    value: "ready",
    label: "Listo",
    description: "Queda listo para enviar o retirar.",
  },
  {
    value: "delivered",
    label: "Entregado",
    description: "Compra finalizada.",
  },
] as const

function orderCode(orderId: string) {
  return orderId.slice(0, 8).toUpperCase()
}

function buildWhatsAppHref(order: OrderRead) {
  if (!whatsappNumber) {
    return null
  }

  const normalizedNumber = whatsappNumber.replace(/\D/g, "")
  const message = [
    `Hola FreeStyle, quiero consultar por mi reserva #${orderCode(order.id)}.`,
    `Estado: ${orderStatusLabels[order.status] ?? order.status}.`,
    `Total: ${formatCartPrice(Number(order.total))}.`,
  ].join("\n")

  return `https://wa.me/${normalizedNumber}?text=${encodeURIComponent(message)}`
}

function statusStepIndex(status: string) {
  return orderSteps.findIndex((step) => step.value === status)
}

function nextCustomerStep(order: OrderRead) {
  if (order.status === "cancelled") {
    return {
      title: "Reserva cancelada",
      description:
        "Si necesitás recuperarla o hacer una compra nueva, contactá al local con el código del pedido.",
      icon: XCircleIcon,
    }
  }

  if (order.payment_status !== "paid") {
    return {
      title: "Falta confirmar el pago",
      description:
        "Coordiná transferencia, Mercado Pago o pago en el local para que el pedido avance.",
      icon: CreditCardIcon,
    }
  }

  if (order.status === "pending") {
    return {
      title: "El local debe confirmar stock",
      description: "Tu reserva ya ingresó. El equipo revisa productos, variantes y datos.",
      icon: ClockIcon,
    }
  }

  if (order.status === "confirmed") {
    return {
      title: "Pedido confirmado",
      description: "El próximo paso es que el local prepare los productos.",
      icon: CheckCircle2Icon,
    }
  }

  if (order.status === "preparing") {
    return {
      title: "Pedido en preparación",
      description: "El local está armando el pedido. Te avisarán cuando esté listo.",
      icon: PackageCheckIcon,
    }
  }

  if (order.status === "ready") {
    return {
      title: order.fulfillment_method === "shipping" ? "Listo para enviar" : "Listo para retirar",
      description:
        order.fulfillment_method === "shipping"
          ? "Falta coordinar o completar el envío."
          : "Podés retirar en Buenos Aires 68, Dolores.",
      icon: TruckIcon,
    }
  }

  if (order.status === "delivered") {
    return {
      title: "Pedido entregado",
      description: "Compra finalizada. Gracias por comprar en FreeStyle.",
      icon: CheckCircle2Icon,
    }
  }

  return {
    title: "Pedido en revisión",
    description: "El local está revisando la reserva.",
    icon: ClockIcon,
  }
}

function formatOrderDate(value?: string) {
  if (!value) return null

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

async function loadOrder(orderId: string): Promise<OrderRead | null> {
  try {
    return await getStoreOrder(orderId)
  } catch {
    return null
  }
}

export default async function OrderTrackingPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params
  const order = await loadOrder(id)
  if (!order) {
    notFound()
  }

  const currentStepIndex = statusStepIndex(order.status)
  const nextStep = nextCustomerStep(order)
  const NextStepIcon = nextStep.icon
  const whatsappHref = buildWhatsAppHref(order)
  const createdAt = formatOrderDate(order.created_at)

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
      <Button asChild variant="ghost" className="mb-6 w-fit">
        <Link href="/perfil#pedidos">
          <ArrowLeftIcon data-icon="inline-start" />
          Volver a mis pedidos
        </Link>
      </Button>

      <div className="overflow-hidden rounded-[2rem] border bg-card shadow-sm">
        <div className="grid gap-6 bg-[radial-gradient(circle_at_12%_18%,rgba(198,255,0,0.18),transparent_30%),linear-gradient(135deg,#020617,#18181b_62%,#1d4ed8)] p-6 text-white lg:grid-cols-[1fr_24rem] lg:items-end lg:p-8">
          <div>
            <Badge className="w-fit bg-white text-slate-950 hover:bg-white">
              Seguimiento de reserva
            </Badge>
            <h1 className="mt-4 font-display text-4xl font-black italic tracking-tight sm:text-6xl">
              Pedido #{orderCode(order.id)}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">
              Este es el estado actualizado del pedido. Guardá el código para consultar por
              WhatsApp o en el local.
            </p>
            {createdAt ? <p className="mt-2 text-xs text-white/60">Creado el {createdAt}</p> : null}
          </div>

          <div className="grid gap-3 rounded-3xl border border-white/15 bg-black/35 p-4 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-white/70">Estado</span>
              <Badge>{orderStatusLabels[order.status] ?? order.status}</Badge>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-white/70">Pago</span>
              <Badge variant={order.payment_status === "paid" ? "default" : "secondary"}>
                {paymentStatusLabels[order.payment_status] ?? order.payment_status}
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-white/70">Total</span>
              <span className="text-2xl font-black">{formatCartPrice(Number(order.total))}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-3">
          <div className="rounded-2xl border bg-secondary/40 p-4">
            <CreditCardIcon className="size-5 text-primary" aria-hidden="true" />
            <p className="mt-2 font-bold">{paymentMethodLabels[order.payment_method] ?? order.payment_method}</p>
            <p className="text-xs text-muted-foreground">
              {paymentStatusLabels[order.payment_status] ?? order.payment_status}
            </p>
          </div>
          <div className="rounded-2xl border bg-secondary/40 p-4">
            <TruckIcon className="size-5 text-primary" aria-hidden="true" />
            <p className="mt-2 font-bold">
              {fulfillmentLabels[order.fulfillment_method] ?? order.fulfillment_method}
            </p>
            <p className="text-xs text-muted-foreground">Buenos Aires 68, Dolores.</p>
          </div>
          <div className="rounded-2xl border bg-secondary/40 p-4">
            <ShoppingBagIcon className="size-5 text-primary" aria-hidden="true" />
            <p className="mt-2 font-bold">
              {order.items.length} producto{order.items.length === 1 ? "" : "s"}
            </p>
            <p className="text-xs text-muted-foreground">Variantes incluidas en el detalle.</p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-5">
          <div className="rounded-[2rem] border bg-card p-5 shadow-sm md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <NextStepIcon className="size-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-2xl font-black">{nextStep.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {nextStep.description}
                  </p>
                </div>
              </div>
              {whatsappHref ? (
                <Button asChild variant="secondary">
                  <a href={whatsappHref} target="_blank" rel="noreferrer">
                    <MessageCircleIcon data-icon="inline-start" />
                    Consultar
                  </a>
                </Button>
              ) : null}
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-5">
              {orderSteps.map((step, index) => {
                const isDone = currentStepIndex >= index && order.status !== "cancelled"
                const isCurrent = currentStepIndex === index && order.status !== "cancelled"
                return (
                  <div
                    key={step.value}
                    className={`rounded-2xl border p-3 ${
                      isDone ? "border-primary/50 bg-primary/10" : "bg-background/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex size-6 items-center justify-center rounded-full text-xs font-black ${
                          isDone ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <p className="text-sm font-semibold">{step.label}</p>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {isCurrent ? "Estado actual" : isDone ? "Completado" : step.description}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-black">Productos del pedido</h2>
            {order.items.map((item) => {
              const variantDescription = orderItemVariantDescription(item)
              return (
                <article
                  key={item.id}
                  className="grid gap-4 rounded-3xl border bg-card p-4 shadow-sm sm:grid-cols-[6rem_1fr_auto]"
                >
                  <div className="aspect-square overflow-hidden rounded-2xl bg-white">
                    <ProductImage
                      alt={item.product_name}
                      className="size-full object-contain p-2"
                      src={item.image_url ?? undefined}
                    />
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{item.product_name}</p>
                    {variantDescription ? (
                      <Badge className="mt-2" variant="secondary">
                        {variantDescription}
                      </Badge>
                    ) : null}
                    <p className="mt-2 text-sm text-muted-foreground">
                      {item.quantity} unidad{item.quantity === 1 ? "" : "es"} x{" "}
                      {formatCartPrice(Number(item.unit_price))}
                    </p>
                  </div>
                  <p className="text-xl font-black">{formatCartPrice(Number(item.line_total))}</p>
                </article>
              )
            })}
          </div>
        </div>

        <aside className="h-fit space-y-4 rounded-[2rem] border bg-card p-5 shadow-sm lg:sticky lg:top-24">
          <h2 className="text-2xl font-black">Datos de la reserva</h2>
          <div className="space-y-3 text-sm">
            <div className="flex gap-3 rounded-2xl border bg-secondary/35 p-3">
              <UserIcon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="font-semibold">Cliente</p>
                <p className="text-muted-foreground">{order.customer_name || "Sin informar"}</p>
                <p className="text-muted-foreground">{order.customer_phone || "Sin WhatsApp"}</p>
                <p className="text-muted-foreground">{order.customer_email || "Sin email"}</p>
              </div>
            </div>
            <div className="flex gap-3 rounded-2xl border bg-secondary/35 p-3">
              <CreditCardIcon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="font-semibold">Pago</p>
                <p className="text-muted-foreground">
                  {paymentMethodLabels[order.payment_method] ?? order.payment_method}
                </p>
                <p className="text-muted-foreground">
                  {paymentStatusLabels[order.payment_status] ?? order.payment_status}
                </p>
              </div>
            </div>
            <div className="flex gap-3 rounded-2xl border bg-secondary/35 p-3">
              <MapPinIcon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="font-semibold">Entrega</p>
                <p className="text-muted-foreground">
                  {fulfillmentLabels[order.fulfillment_method] ?? order.fulfillment_method}
                </p>
                <p className="text-muted-foreground">Buenos Aires 68, Dolores</p>
              </div>
            </div>
          </div>

          {order.notes ? (
            <div className="rounded-2xl border bg-secondary/40 p-3 text-sm">
              <p className="font-semibold">Comentario</p>
              <p className="mt-1 text-muted-foreground">{order.notes}</p>
            </div>
          ) : null}

          <div className="rounded-2xl border bg-secondary/40 p-4">
            <p className="text-sm font-semibold">Total estimado</p>
            <p className="mt-1 text-3xl font-black">{formatCartPrice(Number(order.total))}</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              El envío, si corresponde, se coordina con el local antes de cerrar la compra.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button asChild>
              <Link href="/productos">Seguir comprando</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/ayuda">Ver medios de pago</Link>
            </Button>
          </div>
        </aside>
      </div>
    </section>
  )
}
