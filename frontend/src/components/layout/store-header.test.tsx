import { render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { CartProvider } from "@/components/cart/cart-provider"

import { StoreHeader } from "./store-header"

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
  it("exposes mobile-first navigation and icon labels", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 401 }))
    window.localStorage.setItem(
      "freestyle.cart.v1",
      JSON.stringify({
        version: 1,
        items: [{ productId: "1", slug: "test", name: "Test", price: 100, currency: "ARS", quantity: 2 }],
      }),
    )

    renderStoreHeader()

    expect(screen.getByRole("link", { name: /freestyle/i })).toHaveAttribute("href", "/")
    expect(screen.getByRole("button", { name: /abrir menú/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /buscar/i })).toHaveAttribute("href", "/buscar")
    expect(screen.getByRole("link", { name: /perfil/i })).toHaveAttribute("href", "/perfil")
    expect(await screen.findByRole("link", { name: /carrito, 2 productos/i })).toHaveAttribute(
      "href",
      "/carrito"
    )
  })

  it("shows staff access when the session persists", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: "1", email: "admin@zeqebellino.com", role: "superadmin" }))
    )

    renderStoreHeader()

    expect(await screen.findByRole("link", { name: /panel/i })).toHaveAttribute("href", "/admin")
    expect(screen.getByRole("link", { name: /perfil, admin@zeqebellino.com/i })).toHaveAttribute(
      "href",
      "/perfil"
    )
  })
})
