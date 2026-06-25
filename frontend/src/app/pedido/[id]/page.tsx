import Link from "next/link"
import { notFound } from "next/navigation"

import { ProductImage } from "@/components/products/product-image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCartPrice } from "@/lib/cart"
import { getStoreOrder, type OrderRead } from "@/lib/orders"

const orderStatusLabels: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  preparing: "Preparando",
  ready: "Listo para retirar o enviar",
  delivered: "Entregado",
  cancelled: "Cancelado",
}

const paymentStatusLabels: Record<string, string> = {
  unpaid: "Sin pago confirmado",
  pending: "Pago pendiente",
  paid: "Pago confirmado",
  failed: "Pago fallido",
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
  shipping: "Envio",
  local_payment: "Pago en el local",
}

function orderCode(orderId: string) {
  return orderId.slice(0, 8).toUpperCase()
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

  return (
    <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col gap-8 px-4 py-10 md:px-8 md:py-16">
      <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          <Badge className="w-fit">Seguimiento de reserva</Badge>
          <h1 className="font-display text-4xl font-black italic tracking-tight sm:text-6xl">
            Reserva #{orderCode(order.id)}
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Guarda este numero para consultar por WhatsApp o en el local. El estado se actualiza
            cuando el equipo confirma pago, stock y preparacion.
          </p>
        </div>

        <div className="space-y-3 rounded-3xl border bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">Estado</span>
            <Badge>{orderStatusLabels[order.status] ?? order.status}</Badge>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">Pago</span>
            <Badge variant={order.payment_status === "paid" ? "secondary" : "outline"}>
              {paymentStatusLabels[order.payment_status] ?? order.payment_status}
            </Badge>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-xl font-black">{formatCartPrice(Number(order.total))}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-3">
          <h2 className="text-2xl font-black">Productos</h2>
          {order.items.map((item) => (
            <article
              key={item.id}
              className="grid gap-4 rounded-3xl border bg-card p-4 sm:grid-cols-[6rem_1fr_auto]"
            >
              <div className="aspect-square overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_center,#ffffff_0%,#f8fafc_45%,#dbeafe_100%)]">
                <ProductImage
                  alt={item.product_name}
                  className="size-full object-contain p-2"
                  src={item.image_url ?? undefined}
                />
              </div>
              <div>
                <p className="text-lg font-semibold">{item.product_name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.quantity} unidad{item.quantity === 1 ? "" : "es"} x{" "}
                  {formatCartPrice(Number(item.unit_price))}
                </p>
              </div>
              <p className="text-xl font-black">{formatCartPrice(Number(item.line_total))}</p>
            </article>
          ))}
        </div>

        <aside className="h-fit space-y-4 rounded-3xl border bg-card p-5">
          <h2 className="text-2xl font-black">Datos de la consulta</h2>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Cliente:</span>{" "}
              {order.customer_name || "Sin informar"}
            </p>
            <p>
              <span className="text-muted-foreground">Telefono:</span>{" "}
              {order.customer_phone || "Sin informar"}
            </p>
            <p>
              <span className="text-muted-foreground">Email:</span>{" "}
              {order.customer_email || "Sin informar"}
            </p>
            <p>
              <span className="text-muted-foreground">Pago:</span>{" "}
              {paymentMethodLabels[order.payment_method] ?? order.payment_method}
            </p>
            <p>
              <span className="text-muted-foreground">Entrega:</span>{" "}
              {fulfillmentLabels[order.fulfillment_method] ?? order.fulfillment_method}
            </p>
          </div>
          {order.notes ? (
            <div className="rounded-2xl border bg-secondary/40 p-3 text-sm">
              <p className="font-semibold">Comentario</p>
              <p className="mt-1 text-muted-foreground">{order.notes}</p>
            </div>
          ) : null}
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
