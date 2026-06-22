"use client"

import { MenuIcon, SearchIcon, ShoppingBagIcon, UserRoundIcon } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const navItems = [
  ["Hombre", "/productos?categoria=hombre"],
  ["Mujer", "/productos?categoria=mujer"],
  ["Calzado", "/productos?categoria=calzado"],
  ["Accesorios", "/productos?categoria=accesorios"],
  ["Ofertas", "/ofertas"],
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

export function StoreHeader({ cartCount = 0 }: Readonly<{ cartCount?: number }>) {
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

          <Link
            href="/"
            aria-label="Freestyle Sport"
            className="font-display text-xl font-black italic tracking-tight"
          >
            FREE/SPORT
          </Link>

          <nav className="ml-6 hidden items-center gap-1 md:flex">
            {navItems.map(([label, href]) => (
              <Button key={href} variant="ghost" asChild>
                <Link href={href}>{label}</Link>
              </Button>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <IconLink href="/buscar" label="Buscar">
              <SearchIcon data-icon="inline-start" />
            </IconLink>
            <IconLink href="/cuenta" label="Perfil">
              <UserRoundIcon data-icon="inline-start" />
            </IconLink>
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
