"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AuthApiError, confirmEmail } from "@/lib/auth"

type ConfirmationState = "missing" | "loading" | "success" | "error"

export default function ConfirmAccountPage() {
  return (
    <Suspense fallback={<ConfirmationShell message="Estamos abriendo tu confirmacion." state="loading" />}>
      <ConfirmAccountContent />
    </Suspense>
  )
}

function ConfirmAccountContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [state, setState] = useState<ConfirmationState>(token ? "loading" : "missing")
  const [message, setMessage] = useState(
    token
      ? "Estamos confirmando tu cuenta FreeStyle."
      : "Abri el enlace que te enviamos por correo para terminar de crear tu cuenta."
  )

  useEffect(() => {
    let isMounted = true

    async function runConfirmation() {
      if (!token) {
        return
      }

      try {
        const response = await confirmEmail(token)
        if (!isMounted) {
          return
        }
        setState("success")
        setMessage(response.message)
      } catch (caught) {
        if (!isMounted) {
          return
        }
        setState("error")
        setMessage(
          caught instanceof AuthApiError
            ? caught.message
            : "No pudimos confirmar la cuenta. Solicita un nuevo enlace."
        )
      }
    }

    void runConfirmation()

    return () => {
      isMounted = false
    }
  }, [token])

  return <ConfirmationShell message={message} state={state} />
}

function ConfirmationShell({
  message,
  state,
}: Readonly<{ message: string; state: ConfirmationState }>) {
  const titleByState: Record<ConfirmationState, string> = {
    missing: "Necesitamos el enlace completo",
    loading: "Ya casi esta",
    success: "Cuenta confirmada",
    error: "No pudimos confirmar la cuenta",
  }
  return (
    <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl flex-col justify-center gap-6 px-4 py-16 text-center md:px-8">
      <Badge className="mx-auto w-fit" variant={state === "success" ? "default" : "secondary"}>
        Confirmacion de cuenta
      </Badge>
      <h1 className="font-display text-4xl font-black italic tracking-tight sm:text-5xl">
        {titleByState[state]}
      </h1>
      <p className="text-muted-foreground">{message}</p>
      <div className="flex justify-center gap-2">
        <Button asChild>
          <Link href="/login">{state === "success" ? "Iniciar sesion" : "Ir al login"}</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/registro">Crear cuenta</Link>
        </Button>
      </div>
    </section>
  )
}
