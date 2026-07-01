"use client"

import { UserPlusIcon } from "lucide-react"
import { type FormEvent, useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { showError, showSuccess } from "@/lib/alerts"
import { createStaffUser } from "@/lib/admin-users"
import { getCurrentUser } from "@/lib/auth"

export function AdminUsersPanel() {
  const [canManageAdmins, setCanManageAdmins] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [createdEmail, setCreatedEmail] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    getCurrentUser()
      .then((user) => {
        if (isMounted) {
          setCanManageAdmins(user?.role === "superadmin")
        }
      })
      .catch(() => {
        if (isMounted) {
          setCanManageAdmins(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setCreatedEmail(null)

    try {
      const user = await createStaffUser({
        email: email.trim(),
        password,
        role: "admin",
        first_name: firstName.trim() || undefined,
        last_name: lastName.trim() || undefined,
        phone: phone.trim() || undefined,
      })
      setCreatedEmail(user.email)
      setEmail("")
      setPassword("")
      setFirstName("")
      setLastName("")
      setPhone("")
      void showSuccess("Administrador creado", `${user.email} ya puede entrar al panel.`)
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "No pudimos crear el administrador"
      void showError("No pudimos crear el administrador", message)
    } finally {
      setIsSaving(false)
    }
  }

  if (!canManageAdmins) {
    return null
  }

  return (
    <section className="rounded-3xl border bg-card p-6">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-2xl font-black">Administradores</h2>
        <Badge variant="secondary">Sólo superadmin</Badge>
      </div>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
        Creá una cuenta admin para el dueño o vendedor. Va a poder cargar productos, ver pedidos,
        gestionar pagos, promociones y tesorería.
      </p>

      {createdEmail ? (
        <p className="mt-4 rounded-2xl border border-primary/30 bg-primary/10 p-3 text-sm font-semibold text-primary">
          Admin creado: {createdEmail}
        </p>
      ) : null}

      <form className="mt-5 grid gap-4 lg:grid-cols-2" onSubmit={handleSubmit}>
        <label className="space-y-2">
          <span className="text-sm font-semibold">Email</span>
          <input
            className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="dueno@freestyle.com"
            required
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold">Contraseña temporal</span>
          <input
            className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            minLength={12}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Mínimo 12 caracteres"
            required
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold">Nombre</span>
          <input
            className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold">Apellido</span>
          <input
            className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold">WhatsApp</span>
          <input
            className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </label>

        <div className="flex items-end">
          <Button type="submit" disabled={isSaving}>
            <UserPlusIcon data-icon="inline-start" />
            {isSaving ? "Creando..." : "Crear admin"}
          </Button>
        </div>
      </form>
    </section>
  )
}
