"use client"

import { RefreshCwIcon } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCartPrice } from "@/lib/cart"
import { listAdminOrders, type OrderRead, updateAdminOrderStatus } from "@/lib/orders"

const statusOptions = [
  { value: "pending", label: "Pendiente" },
  { value: "confirmed", label: "Confirmado" },
  { value: "preparing", label: "Preparando" },
  { value: "ready", label: "Listo" },
  { value: "delivered", label: "Entregado" },
  { value: "cancelled", label: "Cancelado" },
] as const

const paymentLabels: Record<string, string> = {
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

function orderCode(orderId: string) {
  return orderId.slice(0, 8).toUpperCase()
}

export function OrderAdminPanel() {
  const [orders, setOrders] = useState<OrderRead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const pendingCount = useMemo(
    () => orders.filter((order) => order.status === "pending").length,
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

  async function changeStatus(orderId: string, status: string) {
    setUpdatingOrderId(orderId)
    setError(null)
    try {
      const updatedOrder = await updateAdminOrderStatus(orderId, status)
      setOrders((currentOrders) =>
        currentOrders.map((order) => (order.id === updatedOrder.id ? updatedOrder : order)),
      )
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos actualizar la reserva")
    } finally {
      setUpdatingOrderId(null)
    }
  }

  return (
    <section className="space-y-4 rounded-3xl border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-black">Reservas y consultas</h2>
            <Badge variant={pendingCount > 0 ? "default" : "secondary"}>
              {pendingCount} pendientes
            </Badge>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Acá el equipo puede revisar las consultas creadas desde el carrito y marcar el avance.
          </p>
        </div>
        <Button variant="secondary" type="button" onClick={() => void loadOrders(true)} disabled={isRefreshing}>
          <RefreshCwIcon data-icon="inline-start" />
          {isRefreshing ? "Actualizando..." : "Actualizar"}
        </Button>
      </div>

      {error ? <p className="rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}

      {isLoading ? (
        <p className="rounded-2xl border bg-secondary/40 p-4 text-sm text-muted-foreground">
          Cargando reservas...
        </p>
      ) : orders.length === 0 ? (
        <p className="rounded-2xl border bg-secondary/40 p-4 text-sm text-muted-foreground">
          Todavía no hay reservas. Cuando un cliente cree una desde el carrito, va a aparecer acá.
        </p>
      ) : (
        <div className="grid gap-3">
          {orders.map((order) => (
            <article key={order.id} className="rounded-2xl border bg-background/40 p-4">
              <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{orderCode(order.id)}</Badge>
                    <Badge variant="secondary">{statusLabel(order.status)}</Badge>
                    <span className="text-sm font-semibold">{formatCartPrice(Number(order.total))}</span>
                  </div>
                  <div>
                    <p className="font-semibold">{order.customer_name || "Cliente sin nombre"}</p>
                    <p className="text-sm text-muted-foreground">
                      {[order.customer_phone, order.customer_email].filter(Boolean).join(" · ") || "Sin contacto informado"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full border px-2 py-1">
                      Pago: {paymentLabels[order.payment_method] ?? order.payment_method}
                    </span>
                    <span className="rounded-full border px-2 py-1">
                      Entrega: {fulfillmentLabels[order.fulfillment_method] ?? order.fulfillment_method}
                    </span>
                  </div>
                  {order.notes ? (
                    <p className="rounded-xl bg-secondary/50 p-3 text-sm leading-6 text-muted-foreground">
                      {order.notes}
                    </p>
                  ) : null}
                </div>

                <label className="space-y-2">
                  <span className="text-sm font-semibold">Estado</span>
                  <select
                    className="h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary lg:w-44"
                    value={order.status}
                    disabled={updatingOrderId === order.id}
                    onChange={(event) => void changeStatus(order.id, event.target.value)}
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-4 grid gap-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-secondary/40 p-3 text-sm">
                    <div>
                      <p className="font-semibold">{item.product_name}</p>
                      <p className="text-muted-foreground">
                        {item.quantity} x {formatCartPrice(Number(item.unit_price))}
                      </p>
                    </div>
                    <p className="font-black">{formatCartPrice(Number(item.line_total))}</p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
