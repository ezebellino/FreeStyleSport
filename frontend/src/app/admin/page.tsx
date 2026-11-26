import Link from "next/link"

import { AdminOverview } from "@/components/admin/admin-overview"
import { AdminGuide } from "@/components/admin/admin-guide"
import { AdminUsersPanel } from "@/components/admin/admin-users-panel"
import { PaymentProfilePanel } from "@/components/admin/payment-profile-panel"
import { PromotionSettingsPanel } from "@/components/admin/promotion-settings-panel"
import { AdminAccessGate } from "@/components/auth/admin-access-gate"
import { OrderAdminPanel } from "@/components/orders/order-admin-panel"
import { ProductAdminPanel } from "@/components/products/product-admin-panel"
import { Button } from "@/components/ui/button"

const sections = [
  ["productos", "Productos"],
  ["pedidos", "Pedidos"],
  ["resumen", "Resumen"],
  ["promociones", "Promociones"],
  ["pagos", "Datos de pago"],
] as const

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ seccion?: string }>
}) {
  const { seccion } = await searchParams
  const active = sections.find(([key]) => key === seccion)?.[0] ?? "productos"
  return (
    <AdminAccessGate>
      <section className="mx-auto grid max-w-6xl gap-5 px-4 py-8 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-4xl font-black italic">Panel administrativo</h1>
          <AdminGuide key={active} section={active} />
        </div>
        <nav id="admin-sections" aria-label="Secciones del panel" className="flex flex-wrap gap-2">
          {sections.map(([key, label]) => (
            <Button key={key} asChild variant={active === key ? "default" : "secondary"}>
              <Link href={`/admin?seccion=${key}`} aria-current={active === key ? "page" : undefined}>
                {label}
              </Link>
            </Button>
          ))}
          <Button asChild variant="secondary"><Link href="/admin/tesoreria">Tesorería</Link></Button>
        </nav>
        {active === "productos" && <ProductAdminPanel />}
        {active === "pedidos" && <OrderAdminPanel />}
        {active === "resumen" && <><AdminOverview /><AdminUsersPanel /></>}
        {active === "promociones" && <PromotionSettingsPanel />}
        {active === "pagos" && <PaymentProfilePanel />}
        <Link href="/" className="w-fit text-sm underline">Volver a la tienda</Link>
      </section>
    </AdminAccessGate>
  )
}
