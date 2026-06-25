"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCartPrice } from "@/lib/cart"
import { listMyOrders, type OrderRead } from "@/lib/orders"

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  preparing: "Preparando",
  ready: "Lista",
  delivered: "Entregada",
  cancelled: "Cancelada",
}

const paymentLabels: Record<string, string> = {
  unpaid: "Sin pago confirmado",
  pending: "Pago pendiente",
  paid: "Pago confirmado",
  failed: "Pago fallido",
  refunded: "Pago devuelto",
}

function orderCode(orderId: string) {
  return orderId.slice(0, 8).toUpperCase()
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

  return (
    <article className="rounded-2xl border bg-card p-6 text-card-foreground shadow-sm md:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Pedidos y reservas</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Seguimiento de tus consultas creadas con el email de tu cuenta.
          </p>
        </div>
        <Badge variant={orders.length > 0 ? "default" : "outline"}>
          {orders.length} reserva{orders.length === 1 ? "" : "s"}
        </Badge>
      </div>

      {isLoading ? (
        <p className="mt-4 rounded-2xl border bg-secondary/40 p-4 text-sm text-muted-foreground">
          Cargando tus reservas...
        </p>
      ) : error ? (
        <p className="mt-4 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </p>
      ) : orders.length === 0 ? (
        <div className="mt-4 rounded-2xl border bg-secondary/40 p-4 text-sm text-muted-foreground">
          Todavia no tenes reservas asociadas a tu cuenta. Cuando compres logueado, las vas a ver
          aca.
        </div>
      ) : (
        <div className="mt-4 grid gap-3">
          {orders.slice(0, 4).map((order) => (
            <div
              key={order.id}
              className="grid gap-3 rounded-2xl border bg-background/40 p-4 md:grid-cols-[1fr_auto]"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-mono text-sm font-bold">#{orderCode(order.id)}</p>
                  <Badge variant="outline">{statusLabels[order.status] ?? order.status}</Badge>
                  <Badge variant={order.payment_status === "paid" ? "secondary" : "outline"}>
                    {paymentLabels[order.payment_status] ?? order.payment_status}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {order.items.length} producto{order.items.length === 1 ? "" : "s"} ·{" "}
                  {formatCartPrice(Number(order.total))}
                </p>
              </div>
              <Button asChild variant="secondary">
                <Link href={`/pedido/${order.id}`}>Ver seguimiento</Link>
              </Button>
            </div>
          ))}
        </div>
      )}
    </article>
  )
}
