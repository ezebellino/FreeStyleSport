"use client"

import { AlertTriangleIcon, RefreshCwIcon, ShoppingBagIcon, WalletCardsIcon } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/ui/loading-state"
import { listAdminOrders, type OrderRead } from "@/lib/orders"
import { listAdminProducts, type Product } from "@/lib/products"

type AdminOverviewData = {
  orders: OrderRead[]
  products: Product[]
}

function productStock(product: Product) {
  return product.variants.reduce((total, variant) => total + variant.stock_quantity, 0)
}

function latestOrderCode(orders: OrderRead[]) {
  return orders[0]?.id.slice(0, 8).toUpperCase() ?? "Sin pedidos"
}

export function AdminOverview() {
  const [data, setData] = useState<AdminOverviewData>({ orders: [], products: [] })
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const metrics = useMemo(() => {
    const pendingOrders = data.orders.filter((order) => order.status === "pending").length
    const unpaidOrders = data.orders.filter((order) => order.payment_status !== "paid").length
    const publishedProducts = data.products.filter((product) => product.status === "published").length
    const lowStockProducts = data.products.filter((product) => productStock(product) <= 2).length

    return {
      latestOrder: latestOrderCode(data.orders),
      lowStockProducts,
      pendingOrders,
      publishedProducts,
      unpaidOrders,
    }
  }, [data.orders, data.products])

  async function loadOverview(refresh = false) {
    setError(null)
    if (refresh) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }

    try {
      const [orders, products] = await Promise.all([listAdminOrders(), listAdminProducts()])
      setData({ orders, products })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos cargar el resumen")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadOverview()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [])

  if (isLoading) {
    return (
      <div className="rounded-3xl border bg-card p-6">
        <LoadingState label="Cargando resumen de la tienda..." />
      </div>
    )
  }

  return (
    <section className="space-y-4 rounded-3xl border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-black">Resumen operativo</h2>
            <Badge variant={metrics.pendingOrders > 0 ? "default" : "secondary"}>
              Último #{metrics.latestOrder}
            </Badge>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Vista rápida para decidir qué atender primero: cobrar, preparar pedidos o revisar stock.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => void loadOverview(true)}
          disabled={isRefreshing}
        >
          <RefreshCwIcon data-icon="inline-start" />
          {isRefreshing ? "Actualizando..." : "Actualizar resumen"}
        </Button>
      </div>

      {error ? (
        <p className="rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border bg-background/50 p-4">
          <ShoppingBagIcon className="mb-3 size-5 text-primary" />
          <p className="text-3xl font-black">{metrics.pendingOrders}</p>
          <p className="mt-1 text-sm font-semibold">Pedidos pendientes</p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Consultas nuevas que necesitan confirmación del local.
          </p>
        </article>
        <article className="rounded-2xl border bg-background/50 p-4">
          <WalletCardsIcon className="mb-3 size-5 text-primary" />
          <p className="text-3xl font-black">{metrics.unpaidOrders}</p>
          <p className="mt-1 text-sm font-semibold">Sin pago confirmado</p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            No deberían prepararse ni entregarse hasta confirmar cobro.
          </p>
        </article>
        <article className="rounded-2xl border bg-background/50 p-4">
          <ShoppingBagIcon className="mb-3 size-5 text-primary" />
          <p className="text-3xl font-black">{metrics.publishedProducts}</p>
          <p className="mt-1 text-sm font-semibold">Productos publicados</p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Artículos visibles en la tienda para los clientes.
          </p>
        </article>
        <article className="rounded-2xl border bg-background/50 p-4">
          <AlertTriangleIcon className="mb-3 size-5 text-primary" />
          <p className="text-3xl font-black">{metrics.lowStockProducts}</p>
          <p className="mt-1 text-sm font-semibold">Stock bajo</p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Productos con 2 unidades o menos sumando sus variantes.
          </p>
        </article>
      </div>
    </section>
  )
}
