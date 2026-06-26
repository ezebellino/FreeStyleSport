"use client"

import Link from "next/link"
import { FormEvent, useState } from "react"

import { Button } from "@/components/ui/button"
import { showError, showSuccess } from "@/lib/alerts"
import { AuthApiError, registerCustomer } from "@/lib/auth"

function passwordStrengthLabel(password: string) {
  if (!password) return "Usa al menos 12 caracteres."
  if (password.length < 12) return "Todavia es corta: minimo 12 caracteres."
  if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return "Mejor si combina letras mayusculas y numeros."
  }
  return "Contrasena fuerte."
}

export default function RegisterPage() {
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [password, setPassword] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setMessage(null)
    setIsSubmitting(true)

    const form = new FormData(event.currentTarget)
    const firstName = String(form.get("firstName") ?? "").trim()
    const lastName = String(form.get("lastName") ?? "").trim()
    const phone = String(form.get("phone") ?? "").trim()
    const email = String(form.get("email") ?? "")
    const submittedPassword = String(form.get("password") ?? "")
    const passwordConfirm = String(form.get("passwordConfirm") ?? "")
    const acceptedTerms = form.get("acceptedTerms") === "on"

    if (submittedPassword !== passwordConfirm) {
      const message = "Las contrasenas no coinciden."
      setError(message)
      setIsSubmitting(false)
      void showError("Revisa la contrasena", message)
      return
    }

    if (!acceptedTerms) {
      const message = "Necesitamos que aceptes las condiciones para crear la cuenta."
      setError(message)
      setIsSubmitting(false)
      void showError("Falta una confirmacion", message)
      return
    }

    try {
      const response = await registerCustomer({
        email,
        password: submittedPassword,
        firstName,
        lastName,
        phone,
      })
      setMessage(response.message)
      void showSuccess("Cuenta creada", response.message)
      event.currentTarget.reset()
      setPassword("")
    } catch (caught) {
      if (caught instanceof AuthApiError) {
        setError(caught.message)
        void showError("No pudimos crear la cuenta", caught.message)
      } else {
        const message = "No pudimos crear la cuenta. Intentalo de nuevo."
        setError(message)
        void showError("No pudimos crear la cuenta", message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col justify-center gap-6 px-4 py-16 md:px-8">
      <div className="space-y-3">
        <p className="text-sm font-bold tracking-[0.2em] text-primary">NUEVA CUENTA</p>
        <h1 className="font-display text-4xl font-black italic tracking-tight sm:text-5xl">
          Crear cuenta
        </h1>
        <p className="text-muted-foreground">
          Deja tus datos listos para comprar mas rapido, seguir pedidos y recibir avisos del local.
        </p>
      </div>

      <form className="grid gap-4 rounded-3xl border bg-card p-6 md:grid-cols-2" onSubmit={handleSubmit}>
        <div className="rounded-2xl border bg-background/60 p-4 md:col-span-2">
          <p className="text-sm font-semibold">Datos de contacto</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Usamos estos datos para identificar tu pedido y contactarte si falta confirmar talle,
            pago o retiro.
          </p>
        </div>
        <label className="block space-y-2">
          <span className="text-sm font-medium">Nombre</span>
          <input
            autoComplete="given-name"
            className="h-11 w-full rounded-lg border bg-background px-3 text-sm"
            name="firstName"
            placeholder="Ezequiel"
            required
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium">Apellido</span>
          <input
            autoComplete="family-name"
            className="h-11 w-full rounded-lg border bg-background px-3 text-sm"
            name="lastName"
            placeholder="Bellino"
            required
          />
        </label>
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
          <span className="text-sm font-medium">Telefono / WhatsApp</span>
          <input
            autoComplete="tel"
            className="h-11 w-full rounded-lg border bg-background px-3 text-sm"
            name="phone"
            placeholder="2494 00-0000"
            required
            type="tel"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium">Contrasena</span>
          <input
            autoComplete="new-password"
            className="h-11 w-full rounded-lg border bg-background px-3 text-sm"
            minLength={12}
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Minimo 12 caracteres"
            required
            type="password"
            value={password}
          />
          <span className="text-xs text-muted-foreground">{passwordStrengthLabel(password)}</span>
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium">Confirmar contrasena</span>
          <input
            autoComplete="new-password"
            className="h-11 w-full rounded-lg border bg-background px-3 text-sm"
            minLength={12}
            name="passwordConfirm"
            placeholder="Repeti la contrasena"
            required
            type="password"
          />
        </label>
        <label className="flex gap-3 rounded-2xl border bg-background/60 p-4 text-sm md:col-span-2">
          <input className="mt-1" name="acceptedTerms" required type="checkbox" />
          <span>
            Acepto crear mi cuenta para gestionar compras, reservas y comunicaciones del comercio.
          </span>
        </label>
        {error ? (
          <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive md:col-span-2">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary md:col-span-2">
            {message}
          </p>
        ) : null}
        <Button className="w-full md:col-span-2" disabled={isSubmitting} type="submit">
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
