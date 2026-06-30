"use client"

import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ClockIcon,
  CreditCardIcon,
  MessageCircleIcon,
  PackageCheckIcon,
  RefreshCwIcon,
  TruckIcon,
  UserIcon,
  XCircleIcon,
} from "lucide-react"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

import { ProductImage } from "@/components/products/product-image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/ui/loading-state"
import { formatCartPrice } from "@/lib/cart"
import {
  listAdminOrders,
  orderItemVariantDescription,
  type OrderRead,
  updateAdminOrderPaymentStatus,
  updateAdminOrderStatus,
} from "@/lib/orders"

const statusOptions = [
  { value: "pending", label: "Pendiente", requiresPaid: false },
  { value: "confirmed", label: "Confirmado", requiresPaid: false },
  { value: "preparing", label: "Preparando", requiresPaid: true },
  { value: "ready", label: "Listo", requiresPaid: true },
  { value: "delivered", label: "Entregado", requiresPaid: true },
  { value: "cancelled", label: "Cancelado", requiresPaid: false },
] as const

const paymentStatusOptions = [
  { value: "unpaid", label: "Sin pagar" },
  { value: "pending", label: "Pago pendiente" },
  { value: "paid", label: "Pagado" },
  { value: "failed", label: "Pago fallido" },
  { value: "refunded", label: "Devuelto" },
] as const

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
  local_payment: "Pago en el local",
}

function statusLabel(value: string) {
  return statusOptions.find((option) => option.value === value)?.label ?? value
}

function paymentStatusLabel(value: string) {
  return paymentStatusOptions.find((option) => option.value === value)?.label ?? value
}

function orderCode(orderId: string) {
  return orderId.slice(0, 8).toUpperCase()
}

function orderDateLabel(createdAt?: string) {
  if (!createdAt) return "Fecha no disponible"
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(createdAt))
}

function normalizePhoneForWhatsApp(phone: string) {
  const digits = phone.replace(/\D/g, "").replace(/^0+/, "")
  if (!digits) return null
  if (digits.startsWith("54")) return digits
  return `54${digits}`
}

function buildWhatsAppHref(order: OrderRead) {
  if (!order.customer_phone) return null
  const phone = normalizePhoneForWhatsApp(order.customer_phone)
  if (!phone) return null

  const itemLines = order.items
    .map((item) => {
      const variant = orderItemVariantDescription(item)
      return `- ${item.quantity} x ${item.product_name}${variant ? ` (${variant})` : ""}`
    })
    .join("\n")
  const message = [
    `Hola ${order.customer_name || ""}, te escribimos por tu pedido #${orderCode(order.id)} de FreeStyle.`,
    "",
    itemLines,
    "",
    `Total: ${formatCartPrice(Number(order.total))}`,
    `Estado: ${statusLabel(order.status)} / ${paymentStatusLabel(order.payment_status)}`,
  ].join("\n")

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

function orderStockReserved(order: OrderRead) {
  return Boolean(order.metadata?.stock_reserved)
}

function canAdvanceToStatus(order: OrderRead, status: string) {
  const option = statusOptions.find((statusOption) => statusOption.value === status)
  return !option?.requiresPaid || order.payment_status === "paid"
}

function nextStatusAction(order: OrderRead): { status: string; label: string } | null {
  if (order.status === "cancelled" || order.status === "delivered") return null
  if (order.status === "pending") return { status: "confirmed", label: "Confirmar reserva" }
  if (order.payment_status !== "paid") return null
  if (order.status === "confirmed") return { status: "preparing", label: "Preparar pedido" }
  if (order.status === "preparing") return { status: "ready", label: "Marcar listo" }
  if (order.status === "ready") return { status: "delivered", label: "Entregar" }
  return null
}

function priorityLabel(order: OrderRead) {
  if (order.status === "cancelled" || order.status === "delivered") {
    return { label: "Cerrado", variant: "secondary" as const, icon: CheckCircle2Icon }
  }
  if (order.payment_status !== "paid") {
    return { label: "Cobrar", variant: "destructive" as const, icon: CreditCardIcon }
  }
  if (order.status === "pending") {
    return { label: "Confirmar", variant: "default" as const, icon: ClockIcon }
  }
  if (order.status === "confirmed" || order.status === "preparing") {
    return { label: "Preparar", variant: "default" as const, icon: PackageCheckIcon }
  }
  if (order.status === "ready") {
    return { label: "Entregar", variant: "default" as const, icon: TruckIcon }
  }
  return { label: "Revisar", variant: "secondary" as const, icon: AlertTriangleIcon }
}

function operationalNote(order: OrderRead) {
  if (order.status === "cancelled") return "Reserva cancelada. Si tenía stock reservado, ya debería estar liberado."
  if (order.status === "delivered") return "Venta entregada. No requiere acción operativa."
  if (order.payment_status !== "paid") return "No preparar ni entregar hasta confirmar cobro."
  if (order.status === "pending") return "Validar stock, datos del cliente y confirmar reserva."
  if (order.status === "confirmed") return "Pedido cobrado o aprobado. Preparar productos."
  if (order.status === "preparing") return "Marcar como listo cuando esté armado."
  if (order.status === "ready") return "Coordinar retiro o envío y marcar entregado."
  return "Revisar datos del pedido."
}

function orderItemCount(order: OrderRead) {
  return order.items.reduce((total, item) => total + item.quantity, 0)
}

export function OrderAdminPanel() {
  const [orders, setOrders] = useState<OrderRead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)
  const [cancelCandidate, setCancelCandidate] = useState<OrderRead | null>(null)
  const [error, setError] = useState<string | null>(null)

  const metrics = useMemo(() => {
    const openOrders = orders.filter((order) => !["cancelled", "delivered"].includes(order.status))
    const pendingCount = orders.filter((order) => order.status === "pending").length
    const unpaidCount = openOrders.filter((order) => order.payment_status !== "paid").length
    const readyCount = orders.filter((order) => order.status === "ready").length

    return {
      open: openOrders.length,
      pending: pendingCount,
      ready: readyCount,
      unpaid: unpaidCount,
    }
  }, [orders])

  const sortedOrders = useMemo(
    () =>
      [...orders].sort((left, right) => {
        const leftPriority = left.status === "cancelled" || left.status === "delivered" ? 1 : 0
        const rightPriority = right.status === "cancelled" || right.status === "delivered" ? 1 : 0
        if (leftPriority !== rightPriority) return leftPriority - rightPriority
        return new Date(right.created_at ?? 0).getTime() - new Date(left.created_at ?? 0).getTime()
      }),
    [orders],
  )

  async function loadOrders(refresh = false) {
    setError(null)
    if (refresh) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }

    try {
      setOrders(await listAdminOrders())
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos cargar las reservas")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadOrders()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [])

  function replaceOrder(updatedOrder: OrderRead) {
    setOrders((currentOrders) =>
      currentOrders.map((order) => (order.id === updatedOrder.id ? updatedOrder : order)),
    )
  }

  async function changeStatus(order: OrderRead, status: string) {
    if (!canAdvanceToStatus(order, status)) {
      setError("Primero confirmá el pago antes de preparar, marcar listo o entregar.")
      return
    }

    setUpdatingOrderId(order.id)
    setError(null)
    try {
      replaceOrder(await updateAdminOrderStatus(order.id, status))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos actualizar la reserva")
    } finally {
      setUpdatingOrderId(null)
    }
  }

  async function changePaymentStatus(orderId: string, paymentStatus: string) {
    setUpdatingOrderId(orderId)
    setError(null)
    try {
      replaceOrder(await updateAdminOrderPaymentStatus(orderId, paymentStatus))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos actualizar el pago")
    } finally {
      setUpdatingOrderId(null)
    }
  }

  async function confirmCancelOrder() {
    if (!cancelCandidate) return

    const orderToCancel = cancelCandidate
    setCancelCandidate(null)
    await changeStatus(orderToCancel, "cancelled")
  }

  if (isLoading) {
    return (
      <section className="rounded-3xl border bg-card p-6">
        <LoadingState label="Cargando reservas..." />
      </section>
    )
  }

  return (
    <section className="space-y-5 rounded-[2rem] border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-black">Reservas y consultas</h2>
            <Badge variant={metrics.unpaid > 0 ? "destructive" : "secondary"}>
              {metrics.unpaid} por cobrar
            </Badge>
            <Badge variant={metrics.pending > 0 ? "default" : "secondary"}>
              {metrics.pending} por confirmar
            </Badge>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Atendé primero los pedidos por cobrar y por confirmar. No prepares ni entregues pedidos
            sin pago confirmado, salvo que sean pago/retiro en local autorizado.
          </p>
        </div>
        <Button
          variant="secondary"
          type="button"
          onClick={() => void loadOrders(true)}
          disabled={isRefreshing}
        >
          <RefreshCwIcon data-icon="inline-start" />
          {isRefreshing ? "Actualizando..." : "Actualizar"}
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <article className="rounded-2xl border bg-background/50 p-4">
          <p className="text-3xl font-black">{metrics.open}</p>
          <p className="text-sm font-semibold">Activas</p>
          <p className="mt-1 text-xs text-muted-foreground">Sin entregar ni cancelar.</p>
        </article>
        <article className="rounded-2xl border bg-background/50 p-4">
          <p className="text-3xl font-black">{metrics.unpaid}</p>
          <p className="text-sm font-semibold">Por cobrar</p>
          <p className="mt-1 text-xs text-muted-foreground">Requieren confirmación de pago.</p>
        </article>
        <article className="rounded-2xl border bg-background/50 p-4">
          <p className="text-3xl font-black">{metrics.pending}</p>
          <p className="text-sm font-semibold">Por confirmar</p>
          <p className="mt-1 text-xs text-muted-foreground">Validar stock y datos.</p>
        </article>
        <article className="rounded-2xl border bg-background/50 p-4">
          <p className="text-3xl font-black">{metrics.ready}</p>
          <p className="text-sm font-semibold">Listas</p>
          <p className="mt-1 text-xs text-muted-foreground">Esperan retiro o envío.</p>
        </article>
      </div>

      {error ? (
        <p className="rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {orders.length === 0 ? (
        <div className="rounded-2xl border bg-secondary/40 p-4 text-sm text-muted-foreground">
          Todavía no hay reservas cargadas.
        </div>
      ) : (
        <div className="space-y-4">
          {sortedOrders.map((order) => {
            const isUpdating = updatingOrderId === order.id
            const nextAction = nextStatusAction(order)
            const whatsappHref = buildWhatsAppHref(order)
            const priority = priorityLabel(order)
            const PriorityIcon = priority.icon

            return (
              <article key={order.id} className="overflow-hidden rounded-[2rem] border bg-background/35">
                <div className="grid gap-4 border-b bg-card p-4 lg:grid-cols-[1fr_auto]">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={priority.variant}>
                        <PriorityIcon data-icon="inline-start" />
                        {priority.label}
                      </Badge>
                      <p className="font-mono text-sm font-bold">#{orderCode(order.id)}</p>
                      <span className="text-xs text-muted-foreground">{orderDateLabel(order.created_at)}</span>
                      <Badge variant="outline">{statusLabel(order.status)}</Badge>
                      <Badge variant={order.payment_status === "paid" ? "default" : "destructive"}>
                        {paymentStatusLabel(order.payment_status)}
                      </Badge>
                      <Badge variant={orderStockReserved(order) ? "secondary" : "outline"}>
                        {orderStockReserved(order) ? "Stock reservado" : "Stock liberado"}
                      </Badge>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">{operationalNote(order)}</p>
                  </div>

                  <div className="text-left lg:text-right">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-2xl font-black">{formatCartPrice(Number(order.total))}</p>
                    <p className="text-xs text-muted-foreground">
                      {orderItemCount(order)} unidad{orderItemCount(order) === 1 ? "" : "es"}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 p-4 xl:grid-cols-[1fr_20rem]">
                  <div className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="rounded-2xl border bg-card p-3">
                        <UserIcon className="size-4 text-primary" aria-hidden="true" />
                        <p className="mt-2 text-sm font-bold">{order.customer_name || "Cliente sin nombre"}</p>
                        <p className="text-xs text-muted-foreground">{order.customer_phone || "Sin WhatsApp"}</p>
                        <p className="text-xs text-muted-foreground">{order.customer_email || "Sin email"}</p>
                      </div>
                      <div className="rounded-2xl border bg-card p-3">
                        <CreditCardIcon className="size-4 text-primary" aria-hidden="true" />
                        <p className="mt-2 text-sm font-bold">
                          {paymentMethodLabels[order.payment_method] ?? order.payment_method}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {paymentStatusLabel(order.payment_status)}
                        </p>
                      </div>
                      <div className="rounded-2xl border bg-card p-3">
                        <TruckIcon className="size-4 text-primary" aria-hidden="true" />
                        <p className="mt-2 text-sm font-bold">
                          {fulfillmentLabels[order.fulfillment_method] ?? order.fulfillment_method}
                        </p>
                        <p className="text-xs text-muted-foreground">Buenos Aires 68, Dolores</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {order.items.map((item) => {
                        const variantDescription = orderItemVariantDescription(item)
                        return (
                          <div
                            key={item.id}
                            className="grid gap-3 rounded-2xl border bg-card p-3 sm:grid-cols-[4.5rem_1fr_auto]"
                          >
                            <div className="aspect-square overflow-hidden rounded-xl bg-white">
                              <ProductImage
                                alt={item.product_name}
                                className="size-full object-contain p-1"
                                src={item.image_url ?? undefined}
                              />
                            </div>
                            <div>
                              <p className="font-semibold">{item.product_name}</p>
                              {variantDescription ? (
                                <Badge className="mt-2" variant="secondary">
                                  {variantDescription}
                                </Badge>
                              ) : null}
                              <p className="mt-2 text-xs text-muted-foreground">
                                {item.quantity} x {formatCartPrice(Number(item.unit_price))}
                              </p>
                            </div>
                            <p className="font-black">{formatCartPrice(Number(item.line_total))}</p>
                          </div>
                        )
                      })}
                    </div>

                    {order.notes ? (
                      <div className="rounded-2xl border bg-card p-3 text-sm">
                        <p className="font-semibold">Comentario del cliente</p>
                        <p className="mt-1 text-muted-foreground">{order.notes}</p>
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-3 rounded-2xl border bg-card p-4">
                    <p className="font-black">Acciones</p>

                    <div className="grid gap-2">
                      <label className="space-y-1">
                        <span className="text-xs font-medium text-muted-foreground">Estado del pedido</span>
                        <select
                          className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
                          value={order.status}
                          disabled={isUpdating}
                          onChange={(event) => void changeStatus(order, event.target.value)}
                        >
                          {statusOptions.map((option) => (
                            <option
                              key={option.value}
                              value={option.value}
                              disabled={option.requiresPaid && order.payment_status !== "paid"}
                            >
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="space-y-1">
                        <span className="text-xs font-medium text-muted-foreground">Estado del pago</span>
                        <select
                          className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
                          value={order.payment_status}
                          disabled={isUpdating}
                          onChange={(event) => void changePaymentStatus(order.id, event.target.value)}
                        >
                          {paymentStatusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="grid gap-2">
                      {order.payment_status !== "paid" ? (
                        <Button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => void changePaymentStatus(order.id, "paid")}
                        >
                          <CreditCardIcon data-icon="inline-start" />
                          Confirmar pago
                        </Button>
                      ) : null}

                      {nextAction ? (
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={isUpdating}
                          onClick={() => void changeStatus(order, nextAction.status)}
                        >
                          <PackageCheckIcon data-icon="inline-start" />
                          {nextAction.label}
                        </Button>
                      ) : null}

                      {whatsappHref ? (
                        <Button asChild variant="secondary">
                          <a href={whatsappHref} target="_blank" rel="noreferrer">
                            <MessageCircleIcon data-icon="inline-start" />
                            WhatsApp
                          </a>
                        </Button>
                      ) : null}

                      <Button asChild variant="outline">
                        <Link href={`/pedido/${order.id}`}>Ver seguimiento</Link>
                      </Button>

                      {!["cancelled", "delivered"].includes(order.status) ? (
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={isUpdating}
                          onClick={() => setCancelCandidate(order)}
                        >
                          <XCircleIcon data-icon="inline-start" />
                          Cancelar
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {cancelCandidate ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-[2rem] border bg-card shadow-2xl">
            <div className="bg-[radial-gradient(circle_at_12%_18%,rgba(239,68,68,0.22),transparent_30%),linear-gradient(135deg,#18181b,#0d0d0f)] p-6">
              <Badge variant="destructive">Cancelar reserva</Badge>
              <h3 className="mt-4 font-display text-3xl font-black italic tracking-tight text-white">
                Pedido #{orderCode(cancelCandidate.id)}
              </h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {orderStockReserved(cancelCandidate)
                  ? "Al cancelar esta reserva, el stock reservado vuelve a quedar disponible."
                  : "Esta reserva no tiene stock reservado para devolver."}
              </p>
            </div>

            <div className="space-y-4 p-6">
              <div className="rounded-2xl border bg-secondary/40 p-4">
                <p className="text-sm font-semibold">Confirmación necesaria</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Esta acción cambia el estado del pedido a cancelado y lo deja cerrado para el
                  vendedor. Usala solo si el cliente desistió o si no se puede cumplir la reserva.
                </p>
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="secondary" onClick={() => setCancelCandidate(null)}>
                  Volver
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={updatingOrderId === cancelCandidate.id}
                  onClick={() => void confirmCancelOrder()}
                >
                  <XCircleIcon data-icon="inline-start" />
                  Confirmar cancelación
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
