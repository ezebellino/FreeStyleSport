import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function LoginPage() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-xl flex-col justify-center gap-6 px-4 py-16 md:px-8">
      <div className="space-y-3">
        <p className="text-sm font-bold tracking-[0.2em] text-primary">CUENTA FREESTYLE</p>
        <h1 className="font-display text-4xl font-black italic tracking-tight sm:text-5xl">
          Iniciar sesion
        </h1>
        <p className="text-muted-foreground">
          Entra para ver tu perfil, preparar compras y seguir tus pedidos.
        </p>
      </div>

      <form className="space-y-4 rounded-3xl border bg-card p-6">
        <label className="block space-y-2">
          <span className="text-sm font-medium">Email</span>
          <input
            className="h-11 w-full rounded-lg border bg-background px-3 text-sm"
            name="email"
            placeholder="tu@email.com"
            type="email"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium">Contraseña</span>
          <input
            className="h-11 w-full rounded-lg border bg-background px-3 text-sm"
            name="password"
            placeholder="Tu contraseña"
            type="password"
          />
        </label>
        <Button className="w-full" type="submit">
          Iniciar sesion
        </Button>
      </form>

      <p className="text-sm text-muted-foreground">
        ¿Todavia no tenes cuenta?{" "}
        <Link className="font-medium text-primary" href="/registro">
          Crear cuenta
        </Link>
      </p>
    </section>
  )
}
