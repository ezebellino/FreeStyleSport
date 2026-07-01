"use client"

import {
  ClipboardListIcon,
  LogOutIcon,
  MenuIcon,
  SearchIcon,
  SettingsIcon,
  ShoppingBagIcon,
  UserRoundIcon,
  WalletCardsIcon,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import { useCart } from "@/components/cart/cart-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { showError, showSuccess } from "@/lib/alerts"
import {
  AuthApiError,
  authSessionChangedEvent,
  getCurrentUser,
  logoutUser,
  type PublicUser,
} from "@/lib/auth"

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

function userInitial(user: PublicUser) {
  if (user.role === "superadmin") return "S"
  if (user.role === "admin") return "A"
  return "C"
}

export function StoreHeader() {
  const router = useRouter()
  const [user, setUser] = useState<PublicUser | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const accountMenuRef = useRef<HTMLDivElement>(null)
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
      } finally {
        if (isMounted) {
          setIsAuthLoading(false)
        }
      }
    }

    function handleSessionChanged() {
      void loadUser()
    }

    void loadUser()
    window.addEventListener(authSessionChangedEvent, handleSessionChanged)

    return () => {
      isMounted = false
      window.removeEventListener(authSessionChangedEvent, handleSessionChanged)
    }
  }, [])

  const isStaff = user?.role === "admin" || user?.role === "superadmin"

  useEffect(() => {
    if (!isAccountOpen && !isMobileMenuOpen) return undefined

    function handlePointerDown(event: PointerEvent) {
      if (isAccountOpen && !accountMenuRef.current?.contains(event.target as Node)) {
        setIsAccountOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsAccountOpen(false)
        setIsMobileMenuOpen(false)
      }
    }

    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isAccountOpen, isMobileMenuOpen])

  async function handleLogout() {
    setIsLoggingOut(true)
    try {
      await logoutUser()
      setUser(null)
      setIsAccountOpen(false)
      void showSuccess("Sesión cerrada", "Ya podés entrar con otra cuenta cuando lo necesites.")
      router.replace("/login")
      router.refresh()
    } catch (caught) {
      const message =
        caught instanceof AuthApiError
          ? caught.message
          : "No pudimos cerrar sesión. Intentalo de nuevo."
      void showError("No pudimos cerrar sesión", message)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <TooltipProvider>
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-2 px-4">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
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
                    <Link href={href} onClick={() => setIsMobileMenuOpen(false)}>
                      {label}
                    </Link>
                  </Button>
                ))}
                {isStaff ? (
                  <Button variant="secondary" asChild>
                    <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                      Panel admin
                    </Link>
                  </Button>
                ) : null}
              </nav>
            </SheetContent>
          </Sheet>

          <Link href="/" aria-label="FreeStyle" className="flex items-center gap-2">
            <Image
              src="/brand/freestyle-logo-cropped.webp"
              alt=""
              width={188}
              height={86}
              className="h-10 w-auto object-contain sm:h-11"
              priority
            />
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

            <div className="relative" ref={accountMenuRef}>
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
                <TooltipContent>
                  {user ? "Mi cuenta" : isAuthLoading ? "Cargando cuenta" : "Entrar o crear cuenta"}
                </TooltipContent>
              </Tooltip>

              {user ? (
                <Badge className="pointer-events-none absolute -right-1 -top-1">
                  {userInitial(user)}
                </Badge>
              ) : null}

              <div
                role="menu"
                aria-hidden={!isAccountOpen}
                inert={isAccountOpen ? undefined : true}
                className={`absolute right-0 top-12 z-50 w-72 origin-top-right rounded-2xl border bg-popover p-3 text-popover-foreground shadow-xl transition-all duration-200 ease-out ${
                  isAccountOpen
                    ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
                    : "pointer-events-none -translate-y-2 scale-95 opacity-0"
                }`}
              >
                  {isAuthLoading ? (
                    <div className="rounded-xl border bg-secondary/40 p-3 text-sm text-muted-foreground">
                      Cargando tu cuenta...
                    </div>
                  ) : user ? (
                    <div className="space-y-3">
                      <div className="rounded-xl border bg-secondary/40 p-3">
                        <p className="text-sm font-bold">{userDisplayName(user)}</p>
                        <p className="mt-1 truncate text-xs text-muted-foreground">{user.email}</p>
                        <Badge className="mt-2" variant="secondary">
                          {user.role === "superadmin"
                            ? "Superadmin"
                            : user.role === "admin"
                              ? "Admin"
                              : "Cliente"}
                        </Badge>
                      </div>

                      <div className="grid gap-2">
                        <Button
                          asChild
                          variant="ghost"
                          className="justify-start"
                          onClick={() => setIsAccountOpen(false)}
                        >
                          <Link href="/perfil" role="menuitem">
                            <UserRoundIcon data-icon="inline-start" />
                            Mi perfil
                          </Link>
                        </Button>
                        {!isStaff ? (
                          <Button
                            asChild
                            variant="ghost"
                            className="justify-start"
                            onClick={() => setIsAccountOpen(false)}
                          >
                            <Link href="/perfil#pedidos" role="menuitem">
                              <ClipboardListIcon data-icon="inline-start" />
                              Historial de compras
                            </Link>
                          </Button>
                        ) : null}
                        {isStaff ? (
                          <>
                            <Button
                              asChild
                              variant="ghost"
                              className="justify-start"
                              onClick={() => setIsAccountOpen(false)}
                            >
                              <Link href="/admin" role="menuitem">
                                <SettingsIcon data-icon="inline-start" />
                                Panel administrador
                              </Link>
                            </Button>
                            <Button
                              asChild
                              variant="ghost"
                              className="justify-start"
                              onClick={() => setIsAccountOpen(false)}
                            >
                              <Link href="/admin/tesoreria" role="menuitem">
                                <WalletCardsIcon data-icon="inline-start" />
                                Tesorería
                              </Link>
                            </Button>
                          </>
                        ) : null}
                        <Button
                          type="button"
                          role="menuitem"
                          variant="secondary"
                          className="justify-start"
                          disabled={isLoggingOut}
                          onClick={() => void handleLogout()}
                        >
                          <LogOutIcon data-icon="inline-start" />
                          {isLoggingOut ? "Cerrando..." : "Cerrar sesión"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="px-2 py-1 text-sm leading-6 text-muted-foreground">
                        Entrá para ver tus pedidos y comprar más rápido.
                      </p>
                      <Button
                        asChild
                        className="w-full justify-start"
                        onClick={() => setIsAccountOpen(false)}
                      >
                        <Link href="/login" role="menuitem">
                          Iniciar sesión
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="secondary"
                        className="w-full justify-start"
                        onClick={() => setIsAccountOpen(false)}
                      >
                        <Link href="/registro" role="menuitem">
                          Crear cuenta
                        </Link>
                      </Button>
                    </div>
                  )}
              </div>
            </div>

            <div className="relative">
              <IconLink href="/carrito" label={`Carrito, ${cartCount} productos`}>
                <ShoppingBagIcon data-icon="inline-start" />
              </IconLink>

              {cartCount > 0 ? (
                <Badge className="pointer-events-none absolute -right-1 -top-1">{cartCount}</Badge>
              ) : null}
            </div>
          </div>
        </div>
      </header>
    </TooltipProvider>
  )
}
