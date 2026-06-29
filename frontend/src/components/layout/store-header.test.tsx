import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { CartProvider } from "@/components/cart/cart-provider"

import { StoreHeader } from "./store-header"

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
    replace: vi.fn(),
  }),
}))

afterEach(() => {
  window.localStorage.clear()
  vi.restoreAllMocks()
})

function renderStoreHeader() {
  return render(
    <CartProvider>
      <StoreHeader />
    </CartProvider>,
  )
}

describe("StoreHeader", () => {
  it("exposes mobile-first navigation, account actions and icon labels", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 401 }))
    window.localStorage.setItem(
      "freestyle.cart.v1",
      JSON.stringify({
        version: 1,
        items: [
          { productId: "1", slug: "test", name: "Test", price: 100, currency: "ARS", quantity: 2 },
        ],
      }),
    )

    renderStoreHeader()

    expect(screen.getByRole("link", { name: /freestyle/i })).toHaveAttribute("href", "/")
    expect(screen.getByRole("button", { name: /abrir menú/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /buscar/i })).toHaveAttribute("href", "/buscar")

    fireEvent.click(screen.getByRole("button", { name: /cuenta/i }))
    expect(await screen.findByRole("menuitem", { name: /iniciar sesión/i })).toHaveAttribute(
      "href",
      "/login",
    )
    expect(screen.getByRole("menuitem", { name: /crear cuenta/i })).toHaveAttribute(
      "href",
      "/registro",
    )

    expect(await screen.findByRole("link", { name: /carrito, 2 productos/i })).toHaveAttribute(
      "href",
      "/carrito",
    )
  })

  it("shows staff account menu when the session persists", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: "1", email: "admin@zeqebellino.com", role: "superadmin" })),
    )

    renderStoreHeader()

    expect(await screen.findByRole("link", { name: /panel/i })).toHaveAttribute("href", "/admin")
    fireEvent.click(screen.getByRole("button", { name: /cuenta, admin@zeqebellino.com/i }))

    expect(screen.getByRole("menuitem", { name: /mi perfil/i })).toHaveAttribute("href", "/perfil")
    expect(screen.getByRole("menuitem", { name: /historial de compras/i })).toHaveAttribute(
      "href",
      "/perfil#pedidos",
    )
    expect(screen.getByRole("menuitem", { name: /panel administrador/i })).toHaveAttribute(
      "href",
      "/admin",
    )
    expect(screen.getByRole("menuitem", { name: /cerrar sesión/i })).toBeInTheDocument()
    expect(screen.queryByRole("menuitem", { name: /iniciar sesión/i })).not.toBeInTheDocument()
    expect(screen.queryByRole("menuitem", { name: /crear cuenta/i })).not.toBeInTheDocument()
  })
})
