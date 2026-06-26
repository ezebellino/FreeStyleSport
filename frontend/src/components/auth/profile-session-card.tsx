"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/ui/loading-state"
import { showError, showSuccess } from "@/lib/alerts"
import { AuthApiError, getCurrentUser, logoutUser, type PublicUser } from "@/lib/auth"

function roleLabel(role: PublicUser["role"]) {
  if (role === "superadmin") return "Superadmin"
  if (role === "admin") return "Admin"
  return "Cliente"
}

function userDisplayName(user: PublicUser) {
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ").trim()
  return fullName || user.email
}

export function ProfileSessionCard() {
  const router = useRouter()
  const [user, setUser] = useState<PublicUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    getCurrentUser()
      .then((currentUser) => {
        if (isMounted) setUser(currentUser)
      })
      .catch(() => {
        if (isMounted) setUser(null)
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  async function handleLogout() {
    setError(null)
    setIsLoggingOut(true)

    try {
      await logoutUser()
      setUser(null)
      void showSuccess("Sesion cerrada", "Ya podes entrar con otra cuenta cuando lo necesites.")
      router.replace("/login")
      router.refresh()
    } catch (caught) {
      if (caught instanceof AuthApiError) {
        setError(caught.message)
        void showError("No pudimos cerrar sesion", caught.message)
      } else {
        const message = "No pudimos cerrar sesion. Intentalo de nuevo."
        setError(message)
        void showError("No pudimos cerrar sesion", message)
      }
    } finally {
      setIsLoggingOut(false)
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-3xl border bg-card p-6 text-card-foreground shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">Cuenta FreeStyle</p>
        <div className="mt-4">
          <LoadingState label="Revisando tu sesion..." />
        </div>
      </div>
    )
  }

  if (user) {
    return (
      <div className="rounded-3xl border bg-card p-6 text-card-foreground shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">Cuenta FreeStyle</p>
        <div className="mt-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xl font-semibold">{userDisplayName(user)}</p>
            <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
            {user.phone ? (
              <p className="mt-1 text-sm text-muted-foreground">WhatsApp: {user.phone}</p>
            ) : null}
            <p className="mt-1 text-sm text-muted-foreground">
              Ya estas conectado. Desde aca podes seguir compras y administrar tu cuenta.
            </p>
          </div>
          <Badge>{roleLabel(user.role)}</Badge>
        </div>
        {user.email_confirmed === false ? (
          <p className="mt-4 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
            Tu correo todavia no esta confirmado. Podes usar la cuenta igual; cuando el correo
            llegue, confirmalo para dejarla completa.
          </p>
        ) : null}
        {error ? (
          <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-2">
          {(user.role === "superadmin" || user.role === "admin") ? (
            <Button asChild variant="secondary">
              <Link href="/admin">Ir al panel</Link>
            </Button>
          ) : null}
          <Button disabled={isLoggingOut} onClick={handleLogout} variant="outline">
            {isLoggingOut ? "Cerrando..." : "Cerrar sesion"}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-3xl border bg-card p-6 text-card-foreground shadow-sm">
      <p className="text-sm font-medium text-muted-foreground">Cuenta de cliente</p>
      <div className="mt-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xl font-semibold">Acceso personal</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Entra o crea tu cuenta para guardar tus datos y preparar tus pedidos.
          </p>
        </div>
        <Badge>Seguro</Badge>
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button asChild>
          <Link href="/login">Iniciar sesion</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/registro">Crear cuenta</Link>
        </Button>
      </div>
    </div>
  )
}
