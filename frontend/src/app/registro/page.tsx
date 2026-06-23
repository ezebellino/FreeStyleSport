"use client"

import Link from "next/link"
import { FormEvent, useState } from "react"

import { Button } from "@/components/ui/button"
import { AuthApiError, registerCustomer } from "@/lib/auth"

export default function RegisterPage() {
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setMessage(null)
    setIsSubmitting(true)

    const form = new FormData(event.currentTarget)
    const email = String(form.get("email") ?? "")
    const password = String(form.get("password") ?? "")

    try {
      const response = await registerCustomer(email, password)
      setMessage(response.message)
      event.currentTarget.reset()
    } catch (caught) {
      if (caught instanceof AuthApiError) {
        setError(caught.message)
      } else {
        setError("No pudimos crear la cuenta. Intentalo de nuevo.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-xl flex-col justify-center gap-6 px-4 py-16 md:px-8">
      <div className="space-y-3">
        <p className="text-sm font-bold tracking-[0.2em] text-primary">NUEVA CUENTA</p>
        <h1 className="font-display text-4xl font-black italic tracking-tight sm:text-5xl">
          Crear cuenta
        </h1>
        <p className="text-muted-foreground">
          Te vamos a enviar un correo para confirmar tu cuenta antes de entrar.
        </p>
      </div>

      <form className="space-y-4 rounded-3xl border bg-card p-6" onSubmit={handleSubmit}>
        <label className="block space-y-2">
          <span className="text-sm font-medium">Email</span>
          <input
            autoComplete="email"
            className="h-11 w-full rounded-lg border bg-background px-3 text-sm"
            name="email"
            placeholder="tu@email.com"
            required
            type="email"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium">Contrasena</span>
          <input
            autoComplete="new-password"
            className="h-11 w-full rounded-lg border bg-background px-3 text-sm"
            minLength={12}
            name="password"
            placeholder="Minimo 12 caracteres"
            required
            type="password"
          />
        </label>
        {error ? (
          <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
            {message}
          </p>
        ) : null}
        <Button className="w-full" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground">
        Ya tenes cuenta?{" "}
        <Link className="font-medium text-primary" href="/login">
          Iniciar sesion
        </Link>
      </p>
    </section>
  )
}
