"use client"

import Link from "next/link"
import type * as React from "react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/ui/loading-state"
import { getCurrentUser, type PublicUser } from "@/lib/auth"

function isStaff(user: PublicUser | null) {
  return user?.role === "admin" || user?.role === "superadmin"
}

export function AdminAccessGate({ children }: Readonly<{ children: React.ReactNode }>) {
  const [user, setUser] = useState<PublicUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    getCurrentUser()
      .then((currentUser) => {
        if (isMounted) {
          setUser(currentUser)
        }
      })
      .catch(() => {
        if (isMounted) {
          setUser(null)
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  if (isLoading) {
    return (
      <section className="mx-auto min-h-[calc(100vh-4rem)] max-w-4xl px-4 py-16 md:px-8">
        <div className="rounded-3xl border bg-card p-6">
          <LoadingState label="Verificando permisos..." />
        </div>
      </section>
    )
  }

  if (!isStaff(user)) {
    return (
      <section className="mx-auto min-h-[calc(100vh-4rem)] max-w-4xl px-4 py-16 md:px-8">
        <div className="rounded-[2rem] border bg-card p-6 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-primary">
            Acceso restringido
          </p>
          <h1 className="mt-3 font-display text-4xl font-black italic tracking-tight">
            Panel administrativo
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Esta sección es sólo para el dueño, vendedores autorizados o superadmin. Iniciá sesión
            con una cuenta admin para gestionar productos, pagos, promociones y ventas.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/login">Iniciar sesión</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/productos">Volver al catálogo</Link>
            </Button>
          </div>
        </div>
      </section>
    )
  }

  return <>{children}</>
}

export function AdminActionLink({
  children,
  className,
  href,
  variant = "secondary",
}: Readonly<{
  children: React.ReactNode
  className?: string
  href: string
  variant?: React.ComponentProps<typeof Button>["variant"]
}>) {
  const [canShow, setCanShow] = useState(false)

  useEffect(() => {
    let isMounted = true

    getCurrentUser()
      .then((currentUser) => {
        if (isMounted) {
          setCanShow(isStaff(currentUser))
        }
      })
      .catch(() => {
        if (isMounted) {
          setCanShow(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  if (!canShow) {
    return null
  }

  return (
    <Button asChild className={className} variant={variant}>
      <Link href={href}>{children}</Link>
    </Button>
  )
}
