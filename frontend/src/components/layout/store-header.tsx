"use client"

import { LogOutIcon, MenuIcon, SearchIcon, ShoppingBagIcon, UserRoundIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { useCart } from "@/components/cart/cart-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { showError, showSuccess } from "@/lib/alerts"
import { AuthApiError, getCurrentUser, logoutUser, type PublicUser } from "@/lib/auth"

const navItems = [
  ["Hombre", "/productos?linea=hombre"],
  ["Mujer", "/productos?linea=mujer"],
  ["Calzado", "/productos?categoria=calzado"],
  ["Accesorios", "/productos?categoria=accesorios"],
  ["Ofertas", "/ofertas"],
  ["Ayuda", "/ayuda"],
] as const

function IconLink({
  href,
  label,
  children,
}: Readonly<{ href: string; label: string; children: React.ReactNode }>) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" asChild>
          <Link href={href} aria-label={label}>
            {children}
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

function userDisplayName(user: PublicUser) {
  return [user.first_name, user.last_name].filter(Boolean).join(" ").trim() || user.email
}

export function StoreHeader() {
  const router = useRouter()
  const [user, setUser] = useState<PublicUser | null>(null)
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { count: cartCount } = useCart()

  useEffect(() => {
    let isMounted = true

    async function loadUser() {
      try {
        const currentUser = await getCurrentUser()
        if (isMounted) {
          setUser(currentUser)
        }
      } catch {
        if (isMounted) {
          setUser(null)
        }
      }
    }

    void loadUser()

    return () => {
      isMounted = false
    }
  }, [])

  const isStaff = user?.role === "admin" || user?.role === "superadmin"

  async function handleLogout() {
    setIsLoggingOut(true)
    try {
      await logoutUser()
      setUser(null)
      setIsAccountOpen(false)
      void showSuccess("Sesion cerrada", "Ya podes entrar con otra cuenta cuando lo necesites.")
      router.replace("/login")
      router.refresh()
    } catch (caught) {
      const message =
        caught instanceof AuthApiError
          ? caught.message
          : "No pudimos cerrar sesion. Intentalo de nuevo."
      void showError("No pudimos cerrar sesion", message)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <TooltipProvider>
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-2 px-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button className="md:hidden" variant="ghost" size="icon" aria-label="Abrir menú">
                <MenuIcon data-icon="inline-start" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetTitle>Menú principal</SheetTitle>
              <nav className="flex flex-col gap-2 pt-6">
                {navItems.map(([label, href]) => (
                  <Button key={href} variant="ghost" asChild>
                    <Link href={href}>{label}</Link>
                  </Button>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          <Link href="/" aria-label="FreeStyle" className="flex items-center gap-2">
            <Image
              src="/FreeStyleLogo.webp"
              alt=""
              width={36}
              height={36}
              className="rounded-full bg-white object-contain"
            />
            <span className="font-display text-xl font-black italic tracking-tight">FreeStyle</span>
          </Link>

          <nav className="ml-6 hidden items-center gap-1 md:flex">
            {navItems.map(([label, href]) => (
              <Button key={href} variant="ghost" asChild>
                <Link href={href}>{label}</Link>
              </Button>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            {isStaff ? (
              <Button className="hidden sm:inline-flex" variant="secondary" asChild>
                <Link href="/admin">Panel</Link>
              </Button>
            ) : null}
            <IconLink href="/buscar" label="Buscar">
              <SearchIcon data-icon="inline-start" />
            </IconLink>
            <div className="relative">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={user ? `Cuenta, ${userDisplayName(user)}` : "Cuenta"}
                    aria-expanded={isAccountOpen}
                    aria-haspopup="menu"
                    onClick={() => setIsAccountOpen((current) => !current)}
                  >
                    <UserRoundIcon data-icon="inline-start" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{user ? "Mi cuenta" : "Entrar o crear cuenta"}</TooltipContent>
              </Tooltip>
              {user ? (
                <Badge className="pointer-events-none absolute -right-1 -top-1">
                  {user.role === "superadmin" ? "S" : user.role === "admin" ? "A" : "C"}
                </Badge>
              ) : null}
              {isAccountOpen ? (
                <div
                  className="absolute right-0 top-11 z-50 w-64 rounded-2xl border bg-card p-2 text-card-foreground shadow-xl"
                  role="menu"
                >
                  {user ? (
                    <>
                      <div className="border-b px-3 py-2">
                        <p className="text-sm font-semibold">{userDisplayName(user)}</p>
                        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      <Button className="mt-2 w-full justify-start" variant="ghost" asChild>
                        <Link href="/perfil" role="menuitem" onClick={() => setIsAccountOpen(false)}>
                          Mi perfil
                        </Link>
                      </Button>
                      <Button className="w-full justify-start" variant="ghost" asChild>
                        <Link href="/perfil#pedidos" role="menuitem" onClick={() => setIsAccountOpen(false)}>
                          Historial de compras
                        </Link>
                      </Button>
                      {isStaff ? (
                        <Button className="w-full justify-start" variant="ghost" asChild>
                          <Link href="/admin" role="menuitem" onClick={() => setIsAccountOpen(false)}>
                            Panel administrador
                          </Link>
                        </Button>
                      ) : null}
                      <Button
                        className="mt-2 w-full justify-start"
                        variant="destructive"
                        role="menuitem"
                        onClick={() => void handleLogout()}
                        disabled={isLoggingOut}
                      >
                        <LogOutIcon data-icon="inline-start" />
                        {isLoggingOut ? "Cerrando..." : "Cerrar sesion"}
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="px-3 py-2 text-sm text-muted-foreground">
                        Entra para ver tus pedidos y comprar mas rapido.
                      </p>
                      <Button className="w-full justify-start" variant="ghost" asChild>
                        <Link href="/login" role="menuitem" onClick={() => setIsAccountOpen(false)}>
                          Iniciar sesion
                        </Link>
                      </Button>
                      <Button className="w-full justify-start" variant="secondary" asChild>
                        <Link href="/registro" role="menuitem" onClick={() => setIsAccountOpen(false)}>
                          Crear cuenta
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              ) : null}
            </div>
            <div className="relative">
              <IconLink href="/carrito" label={`Carrito, ${cartCount} productos`}>
                <ShoppingBagIcon data-icon="inline-start" />
              </IconLink>
              {cartCount > 0 && (
                <Badge className="pointer-events-none absolute -right-1 -top-1">{cartCount}</Badge>
              )}
            </div>
          </div>
        </div>
      </header>
    </TooltipProvider>
  )
}
