"use client"

import { ArrowRightIcon, ClockIcon, CreditCardIcon, PackageCheckIcon } from "lucide-react"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/ui/loading-state"
import { formatCartPrice } from "@/lib/cart"
import { listMyOrders, type OrderRead } from "@/lib/orders"

const statusLabels: Record<string, string> = {
  pending: "Reserva creada",
  confirmed: "Confirmada",
  preparing: "Preparando",
  ready: "Lista",
  delivered: "Entregada",
  cancelled: "Cancelada",
}

const paymentLabels: Record<string, string> = {
  unpaid: "Pago sin confirmar",
  pending: "Pago pendiente",
  paid: "Pago confirmado",
  failed: "Pago rechazado",
  refunded: "Pago devuelto",
}

const fulfillmentLabels: Record<string, string> = {
  pickup: "Retiro en local",
  shipping: "Envío",
  local_payment: "Pago y retiro en local",
}

function orderCode(orderId: string) {
  return orderId.slice(0, 8).toUpperCase()
}

function nextStepLabel(order: OrderRead) {
  if (order.status === "cancelled") return "Contactá al local si querés recuperar la reserva."
  if (order.payment_status !== "paid") return "Falta coordinar o confirmar el pago."
  if (order.status === "pending") return "El local debe confirmar stock y datos."
  if (order.status === "confirmed") return "El próximo paso es preparar el pedido."
  if (order.status === "preparing") return "Te avisarán cuando esté listo."
  if (order.status === "ready") {
    return order.fulfillment_method === "shipping"
      ? "Listo para coordinar envío."
      : "Listo para retirar en Buenos Aires 68."
  }
  if (order.status === "delivered") return "Pedido entregado."
  return "El local está revisando la reserva."
}

function formatOrderDate(value?: string) {
  if (!value) return null

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
  }).format(new Date(value))
}

export function ProfileOrdersCard() {
  const [orders, setOrders] = useState<OrderRead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    listMyOrders()
      .then((loadedOrders) => {
        if (isMounted) setOrders(loadedOrders)
      })
      .catch((caught) => {
        if (isMounted) {
          setError(caught instanceof Error ? caught.message : "No pudimos cargar tus reservas")
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const orderSummary = useMemo(() => {
    const activeOrders = orders.filter((order) => !["delivered", "cancelled"].includes(order.status))
    const pendingPayment = orders.filter((order) => order.payment_status !== "paid")
    return {
      active: activeOrders.length,
      pendingPayment: pendingPayment.length,
    }
  }, [orders])

  return (
    <article
      id="pedidos"
      className="rounded-[2rem] border bg-card p-6 text-card-foreground shadow-sm md:col-span-2"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge className="mb-3 w-fit">Historial</Badge>
          <h2 className="text-2xl font-black">Pedidos y reservas</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Seguimiento de tus compras y reservas creadas con el email de tu cuenta.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-2xl border bg-secondary/40 p-3">
            <p className="text-xl font-black">{orders.length}</p>
            <p className="text-muted-foreground">total</p>
          </div>
          <div className="rounded-2xl border bg-secondary/40 p-3">
            <p className="text-xl font-black">{orderSummary.active}</p>
            <p className="text-muted-foreground">activas</p>
          </div>
          <div className="rounded-2xl border bg-secondary/40 p-3">
            <p className="text-xl font-black">{orderSummary.pendingPayment}</p>
            <p className="text-muted-foreground">pago</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-4">
          <LoadingState label="Cargando tus reservas..." />
        </div>
      ) : error ? (
        <p className="mt-4 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </p>
      ) : orders.length === 0 ? (
        <div className="mt-4 rounded-2xl border bg-secondary/40 p-4 text-sm text-muted-foreground">
          Todavía no tenés reservas asociadas a tu cuenta. Cuando compres logueado, las vas a ver
          acá.
        </div>
      ) : (
        <div className="mt-5 grid gap-3">
          {orders.slice(0, 5).map((order) => {
            const createdAt = formatOrderDate(order.created_at)
            return (
              <div
                key={order.id}
                className="grid gap-4 rounded-3xl border bg-background/40 p-4 md:grid-cols-[1fr_auto]"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-mono text-sm font-bold">#{orderCode(order.id)}</p>
                    <Badge variant="outline">{statusLabels[order.status] ?? order.status}</Badge>
                    <Badge variant={order.payment_status === "paid" ? "default" : "secondary"}>
                      {paymentLabels[order.payment_status] ?? order.payment_status}
                    </Badge>
                    {createdAt ? (
                      <span className="text-xs text-muted-foreground">{createdAt}</span>
                    ) : null}
                  </div>

                  <div className="grid gap-2 text-sm sm:grid-cols-3">
                    <div className="rounded-2xl border bg-card p-3">
                      <PackageCheckIcon className="size-4 text-primary" aria-hidden="true" />
                      <p className="mt-2 font-semibold">
                        {order.items.length} producto{order.items.length === 1 ? "" : "s"}
                      </p>
                      <p className="text-muted-foreground">{formatCartPrice(Number(order.total))}</p>
                    </div>
                    <div className="rounded-2xl border bg-card p-3">
                      <CreditCardIcon className="size-4 text-primary" aria-hidden="true" />
                      <p className="mt-2 font-semibold">Pago</p>
                      <p className="text-muted-foreground">
                        {paymentLabels[order.payment_status] ?? order.payment_status}
                      </p>
                    </div>
                    <div className="rounded-2xl border bg-card p-3">
                      <ClockIcon className="size-4 text-primary" aria-hidden="true" />
                      <p className="mt-2 font-semibold">Entrega</p>
                      <p className="text-muted-foreground">
                        {fulfillmentLabels[order.fulfillment_method] ?? order.fulfillment_method}
                      </p>
                    </div>
                  </div>

                  <p className="rounded-2xl border bg-secondary/40 p-3 text-sm text-muted-foreground">
                    {nextStepLabel(order)}
                  </p>
                </div>

                <Button asChild variant="secondary" className="self-start">
                  <Link href={`/pedido/${order.id}`}>
                    Ver seguimiento
                    <ArrowRightIcon data-icon="inline-end" />
                  </Link>
                </Button>
              </div>
            )
          })}
        </div>
      )}
    </article>
  )
}
