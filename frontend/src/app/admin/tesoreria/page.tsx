import Link from "next/link"

import { SalesIntelligencePanel } from "@/components/admin/sales-intelligence-panel"
import { AdminAccessGate } from "@/components/auth/admin-access-gate"
import { Button } from "@/components/ui/button"

export default function AdminTreasuryPage() {
  return (
    <AdminAccessGate>
      <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-7xl px-4 py-10 md:px-8 md:py-16">
        <SalesIntelligencePanel />

        <div className="mt-8 flex flex-wrap gap-2">
          <Button asChild variant="secondary">
            <Link href="/admin">Volver al panel</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Volver a la tienda</Link>
          </Button>
        </div>
      </main>
    </AdminAccessGate>
  )
}
