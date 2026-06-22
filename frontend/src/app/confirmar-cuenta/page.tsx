import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default async function ConfirmAccountPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ token?: string }> }>) {
  const { token } = await searchParams

  return (
    <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl flex-col justify-center gap-6 px-4 py-16 text-center md:px-8">
      <Badge className="mx-auto w-fit" variant={token ? "default" : "secondary"}>
        Confirmacion de cuenta
      </Badge>
      <h1 className="font-display text-4xl font-black italic tracking-tight sm:text-5xl">
        {token ? "Ya casi esta" : "Necesitamos el enlace completo"}
      </h1>
      <p className="text-muted-foreground">
        {token
          ? "Estamos listos para confirmar tu cuenta FreeStyle y habilitar tu acceso."
          : "Abri el enlace que te enviamos por correo para terminar de crear tu cuenta."}
      </p>
      <div className="flex justify-center gap-2">
        <Button asChild>
          <Link href="/login">Ir a iniciar sesion</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/registro">Crear cuenta</Link>
        </Button>
      </div>
    </section>
  )
}
