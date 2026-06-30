"use client"

import { GiftIcon, XIcon } from "lucide-react"
import { m } from "motion/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/auth"

const storageKey = "freestyle_welcome_discount_dismissed_v1"
const blockedPathPrefixes = ["/admin", "/login", "/registro", "/confirmar-cuenta", "/cuenta", "/perfil"]

function shouldSkipPath(pathname: string) {
  return blockedPathPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

export function WelcomeDiscountModal() {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(false)
  const [hasChecked, setHasChecked] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function checkVisibility() {
      if (shouldSkipPath(pathname)) {
        setHasChecked(true)
        return
      }

      if (window.localStorage.getItem(storageKey) === "true") {
        setHasChecked(true)
        return
      }

      const user = await getCurrentUser().catch(() => null)
      if (!isMounted) {
        return
      }

      setIsVisible(user === null)
      setHasChecked(true)
    }

    void checkVisibility()

    return () => {
      isMounted = false
    }
  }, [pathname])

  useEffect(() => {
    if (!isVisible) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        dismiss()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isVisible])

  function dismiss() {
    window.localStorage.setItem(storageKey, "true")
    setIsVisible(false)
  }

  if (!hasChecked || !isVisible) {
    return null
  }

  return (
    <div
      aria-modal="true"
      role="dialog"
      aria-labelledby="welcome-discount-title"
      className="fixed inset-0 z-50 grid place-items-center bg-black/72 px-4 py-8 backdrop-blur-sm"
    >
      <m.div
        initial={{ opacity: 0, scale: 0.96, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 8 }}
        className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border bg-card shadow-[0_24px_90px_rgba(0,0,0,0.55)]"
      >
        <div className="absolute -right-12 -top-12 size-40 rounded-full bg-primary/20 blur-2xl" />
        <div className="absolute -bottom-16 -left-12 size-44 rounded-full bg-white/10 blur-2xl" />

        <button
          type="button"
          aria-label="Cerrar promoción"
          className="absolute right-4 top-4 z-10 rounded-full border bg-background/80 p-2 text-muted-foreground transition hover:border-primary hover:text-primary"
          onClick={dismiss}
        >
          <XIcon className="size-4" aria-hidden="true" />
        </button>

        <div className="relative space-y-5 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
              <GiftIcon className="size-6" aria-hidden="true" />
            </span>
            <div>
              <Badge className="w-fit">Bienvenida FreeStyle</Badge>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-primary">
                Sólo por crear tu cuenta
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h2
              id="welcome-discount-title"
              className="font-display text-4xl font-black italic leading-none tracking-tight sm:text-5xl"
            >
              10% OFF en tu primera compra
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Creá tu cuenta, guardá tus datos y seguí tus pedidos desde el perfil. El local valida
              stock y confirma el beneficio al cerrar la compra.
            </p>
          </div>

          <div className="rounded-3xl border border-primary/30 bg-primary/10 p-4">
            <p className="text-sm font-black text-primary">Cupón de bienvenida</p>
            <p className="mt-1 font-mono text-2xl font-black tracking-[0.2em]">BIENVENIDA10</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Próximo paso: lo conectamos al checkout para aplicarlo automáticamente a clientes
              registrados.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button asChild onClick={dismiss}>
              <Link href="/registro">Crear cuenta y obtener 10%</Link>
            </Button>
            <Button type="button" variant="secondary" onClick={dismiss}>
              Seguir viendo productos
            </Button>
          </div>
        </div>
      </m.div>
    </div>
  )
}
