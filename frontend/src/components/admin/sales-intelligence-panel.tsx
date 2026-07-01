"use client"

import {
  AlertTriangleIcon,
  BarChart3Icon,
  CalendarDaysIcon,
  CreditCardIcon,
  PackageSearchIcon,
  RefreshCwIcon,
  ShoppingBagIcon,
  TrendingUpIcon,
  WalletCardsIcon,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/ui/loading-state"
import { formatCartPrice } from "@/lib/cart"
import { listAdminOrders, type OrderRead } from "@/lib/orders"
import { listAdminProducts, type Product } from "@/lib/products"

type PeriodFilter = "today" | "7d" | "30d" | "month" | "all"
type PaymentMethodFilter = "all" | "mercado_pago" | "transfer" | "cash" | "local_payment"

type ProductSales = {
  key: string
  name: string
  quantity: number
  revenue: number
  orders: number
}

const periodOptions: Array<{ value: PeriodFilter; label: string }> = [
  { value: "today", label: "Hoy" },
  { value: "7d", label: "7 días" },
  { value: "30d", label: "30 días" },
  { value: "month", label: "Este mes" },
  { value: "all", label: "Todo" },
]

const paymentMethodOptions: Array<{ value: PaymentMethodFilter; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "mercado_pago", label: "Mercado Pago" },
  { value: "transfer", label: "Transferencia" },
  { value: "cash", label: "Efectivo" },
  { value: "local_payment", label: "Pago en local" },
]

const paymentMethodLabels: Record<string, string> = {
  to_confirm: "A confirmar",
  cash: "Efectivo",
  transfer: "Transferencia",
  mercado_pago: "Mercado Pago",
  card: "Tarjeta",
  wallet: "Billetera virtual",
}

function numberValue(value: string | number | null | undefined) {
  return Number(value ?? 0)
}

function orderDate(order: OrderRead) {
  return order.created_at ? new Date(order.created_at) : null
}

function periodStart(period: PeriodFilter) {
  const now = new Date()
  if (period === "all") return null
  if (period === "today") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }
  if (period === "month") {
    return new Date(now.getFullYear(), now.getMonth(), 1)
  }

  const days = period === "7d" ? 7 : 30
  const start = new Date(now)
  start.setDate(now.getDate() - days)
  return start
}

function isActiveSale(order: OrderRead) {
  return order.status !== "cancelled"
}

function isConfirmedSale(order: OrderRead) {
  return isActiveSale(order) && order.payment_status === "paid"
}

function isOpenUnpaid(order: OrderRead) {
  return !["cancelled", "delivered"].includes(order.status) && order.payment_status !== "paid"
}

function productStock(product: Product) {
  return product.variants.reduce((total, variant) => total + variant.stock_quantity, 0)
}

function orderMatchesPaymentMethod(order: OrderRead, filter: PaymentMethodFilter) {
  if (filter === "all") return true
  if (filter === "local_payment") return order.fulfillment_method === "local_payment"
  return order.payment_method === filter
}

function paidOrdersByProduct(orders: OrderRead[]) {
  const sales = new Map<string, ProductSales>()

  for (const order of orders.filter(isConfirmedSale)) {
    for (const item of order.items) {
      const existing = sales.get(item.product_slug) ?? {
        key: item.product_slug,
        name: item.product_name,
        orders: 0,
        quantity: 0,
        revenue: 0,
      }

      existing.quantity += item.quantity
      existing.revenue += numberValue(item.line_total)
      existing.orders += 1
      sales.set(item.product_slug, existing)
    }
  }

  return [...sales.values()].sort((left, right) => right.revenue - left.revenue)
}

function methodRevenue(orders: OrderRead[]) {
  const totals = new Map<string, { label: string; orders: number; revenue: number }>()

  for (const order of orders.filter(isConfirmedSale)) {
    const key = order.payment_method
    const existing = totals.get(key) ?? {
      label: paymentMethodLabels[key] ?? key,
      orders: 0,
      revenue: 0,
    }

    existing.orders += 1
    existing.revenue += numberValue(order.total)
    totals.set(key, existing)
  }

  return [...totals.entries()]
    .map(([key, value]) => ({ key, ...value }))
    .sort((left, right) => right.revenue - left.revenue)
}

export function SalesIntelligencePanel() {
  const [orders, setOrders] = useState<OrderRead[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [period, setPeriod] = useState<PeriodFilter>("30d")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodFilter>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadData(refresh = false) {
    setError(null)
    if (refresh) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }

    try {
      const [loadedOrders, loadedProducts] = await Promise.all([listAdminOrders(), listAdminProducts()])
      setOrders(loadedOrders)
      setProducts(loadedProducts)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos cargar la tesorería")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadData()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [])

  const data = useMemo(() => {
    const start = periodStart(period)
    const filteredOrders = orders.filter((order) => {
      const createdAt = orderDate(order)
      const matchesPeriod = !start || (createdAt ? createdAt >= start : true)
      return matchesPeriod && orderMatchesPaymentMethod(order, paymentMethod)
    })
    const paidOrders = filteredOrders.filter(isConfirmedSale)
    const unpaidOrders = filteredOrders.filter(isOpenUnpaid)
    const cancelledOrders = filteredOrders.filter((order) => order.status === "cancelled")
    const revenue = paidOrders.reduce((total, order) => total + numberValue(order.total), 0)
    const pendingRevenue = unpaidOrders.reduce((total, order) => total + numberValue(order.total), 0)
    const soldUnits = paidOrders.reduce(
      (total, order) => total + order.items.reduce((itemTotal, item) => itemTotal + item.quantity, 0),
      0,
    )
    const averageTicket = paidOrders.length > 0 ? revenue / paidOrders.length : 0
    const topProducts = paidOrdersByProduct(filteredOrders).slice(0, 8)
    const revenueByMethod = methodRevenue(filteredOrders)
    const lowStockProducts = products
      .filter((product) => product.status === "published")
      .map((product) => ({ product, stock: productStock(product) }))
      .filter(({ stock }) => stock <= 2)
      .sort((left, right) => left.stock - right.stock)
      .slice(0, 6)

    return {
      averageTicket,
      cancelledOrders,
      filteredOrders,
      lowStockProducts,
      paidOrders,
      pendingRevenue,
      revenue,
      revenueByMethod,
      soldUnits,
      topProducts,
      unpaidOrders,
    }
  }, [orders, paymentMethod, period, products])

  if (isLoading) {
    return (
      <section className="rounded-3xl border bg-card p-6">
        <LoadingState label="Calculando tesorería..." />
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge className="mb-3 w-fit">Venta inteligente</Badge>
            <h1 className="font-display text-4xl font-black italic tracking-tight sm:text-6xl">
              Tesorería
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
              Números diarios para decidir qué vender, qué cobrar y qué reponer. La recaudación
              toma sólo pedidos pagados y no cancelados.
            </p>
          </div>
          <Button type="button" variant="secondary" disabled={isRefreshing} onClick={() => void loadData(true)}>
            <RefreshCwIcon data-icon="inline-start" />
            {isRefreshing ? "Actualizando..." : "Actualizar"}
          </Button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-[repeat(2,minmax(0,1fr))_auto]">
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Período</span>
            <select
              className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
              value={period}
              onChange={(event) => setPeriod(event.target.value as PeriodFilter)}
            >
              {periodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Método de pago</span>
            <select
              className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value as PaymentMethodFilter)}
            >
              {paymentMethodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end">
            <Badge variant="secondary" className="h-10 rounded-xl px-4">
              {data.filteredOrders.length} pedidos analizados
            </Badge>
          </div>
        </div>

        {error ? (
          <p className="mt-4 rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-3xl border bg-card p-5">
          <WalletCardsIcon className="mb-4 size-5 text-primary" />
          <p className="text-3xl font-black">{formatCartPrice(data.revenue)}</p>
          <p className="mt-1 text-sm font-semibold">Recaudado web</p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">Pedidos pagados y activos.</p>
        </article>
        <article className="rounded-3xl border bg-card p-5">
          <CreditCardIcon className="mb-4 size-5 text-primary" />
          <p className="text-3xl font-black">{formatCartPrice(data.pendingRevenue)}</p>
          <p className="mt-1 text-sm font-semibold">Por cobrar</p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Reservas activas sin pago confirmado.
          </p>
        </article>
        <article className="rounded-3xl border bg-card p-5">
          <ShoppingBagIcon className="mb-4 size-5 text-primary" />
          <p className="text-3xl font-black">{data.paidOrders.length}</p>
          <p className="mt-1 text-sm font-semibold">Ventas pagadas</p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            {data.soldUnits} unidades vendidas.
          </p>
        </article>
        <article className="rounded-3xl border bg-card p-5">
          <TrendingUpIcon className="mb-4 size-5 text-primary" />
          <p className="text-3xl font-black">{formatCartPrice(data.averageTicket)}</p>
          <p className="mt-1 text-sm font-semibold">Ticket promedio</p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">Promedio por pedido pagado.</p>
        </article>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <article className="rounded-[2rem] border bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-2xl font-black">
                <BarChart3Icon className="size-5 text-primary" />
                Productos que más venden
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Ranking por recaudación confirmada en el período elegido.
              </p>
            </div>
            <Badge variant="secondary">{data.topProducts.length} destacados</Badge>
          </div>

          <div className="mt-5 space-y-3">
            {data.topProducts.length === 0 ? (
              <p className="rounded-2xl border bg-secondary/40 p-4 text-sm text-muted-foreground">
                Todavía no hay ventas pagadas para este filtro.
              </p>
            ) : (
              data.topProducts.map((product, index) => (
                <div key={product.key} className="grid gap-3 rounded-2xl border bg-background/50 p-4 md:grid-cols-[auto_1fr_auto]">
                  <Badge variant={index < 3 ? "default" : "secondary"}>#{index + 1}</Badge>
                  <div>
                    <p className="font-bold">{product.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {product.quantity} unidades · {product.orders} pedido{product.orders === 1 ? "" : "s"}
                    </p>
                  </div>
                  <p className="text-left font-black md:text-right">{formatCartPrice(product.revenue)}</p>
                </div>
              ))
            )}
          </div>
        </article>

        <div className="space-y-4">
          <article className="rounded-[2rem] border bg-card p-6">
            <h2 className="flex items-center gap-2 text-2xl font-black">
              <CreditCardIcon className="size-5 text-primary" />
              Cobros por método
            </h2>
            <div className="mt-5 space-y-3">
              {data.revenueByMethod.length === 0 ? (
                <p className="rounded-2xl border bg-secondary/40 p-4 text-sm text-muted-foreground">
                  No hay cobros confirmados en este período.
                </p>
              ) : (
                data.revenueByMethod.map((method) => (
                  <div key={method.key} className="rounded-2xl border bg-background/50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-bold">{method.label}</p>
                      <Badge variant="secondary">{method.orders} venta{method.orders === 1 ? "" : "s"}</Badge>
                    </div>
                    <p className="mt-2 text-2xl font-black">{formatCartPrice(method.revenue)}</p>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="rounded-[2rem] border bg-card p-6">
            <h2 className="flex items-center gap-2 text-2xl font-black">
              <AlertTriangleIcon className="size-5 text-primary" />
              Alertas de reposición
            </h2>
            <div className="mt-5 space-y-3">
              {data.lowStockProducts.length === 0 ? (
                <p className="rounded-2xl border bg-secondary/40 p-4 text-sm text-muted-foreground">
                  No hay productos publicados con stock crítico.
                </p>
              ) : (
                data.lowStockProducts.map(({ product, stock }) => (
                  <div key={product.id} className="rounded-2xl border bg-background/50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-bold">{product.name}</p>
                      <Badge variant={stock === 0 ? "destructive" : "secondary"}>
                        {stock === 0 ? "Sin stock" : `${stock} u.`}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Conviene revisar variantes, precio y reposición.
                    </p>
                  </div>
                ))
              )}
            </div>
          </article>
        </div>
      </div>

      <article className="rounded-[2rem] border bg-card p-6">
        <h2 className="flex items-center gap-2 text-2xl font-black">
          <PackageSearchIcon className="size-5 text-primary" />
          Lectura rápida del día
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border bg-background/50 p-4">
            <CalendarDaysIcon className="mb-3 size-4 text-primary" />
            <p className="text-sm font-bold">Pedidos pendientes</p>
            <p className="mt-2 text-2xl font-black">{data.unpaidOrders.length}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Prioridad: cobrar o descartar para liberar operación.
            </p>
          </div>
          <div className="rounded-2xl border bg-background/50 p-4">
            <XSmallMetric value={data.cancelledOrders.length} label="Cancelados" />
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Si sube este número, revisar stock, tiempos de respuesta o medios de pago.
            </p>
          </div>
          <div className="rounded-2xl border bg-background/50 p-4">
            <XSmallMetric
              value={data.topProducts[0]?.name ?? "Sin datos"}
              label="Producto líder"
              compact
            />
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Usalo para destacar en home, historias o promociones.
            </p>
          </div>
        </div>
      </article>
    </section>
  )
}

function XSmallMetric({
  compact = false,
  label,
  value,
}: Readonly<{ compact?: boolean; label: string; value: number | string }>) {
  return (
    <>
      <p className="text-sm font-bold">{label}</p>
      <p className={compact ? "mt-2 line-clamp-2 text-xl font-black" : "mt-2 text-2xl font-black"}>
        {value}
      </p>
    </>
  )
}
