import { render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { StoreHeader } from "./store-header"

afterEach(() => {
  vi.restoreAllMocks()
})

describe("StoreHeader", () => {
  it("exposes mobile-first navigation and icon labels", () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 401 }))

    render(<StoreHeader cartCount={2} />)

    expect(screen.getByRole("link", { name: /freestyle/i })).toHaveAttribute("href", "/")
    expect(screen.getByRole("button", { name: /abrir menú/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /buscar/i })).toHaveAttribute("href", "/buscar")
    expect(screen.getByRole("link", { name: /perfil/i })).toHaveAttribute("href", "/perfil")
    expect(screen.getByRole("link", { name: /carrito, 2 productos/i })).toHaveAttribute(
      "href",
      "/carrito"
    )
  })

  it("shows staff access when the session persists", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: "1", email: "admin@zeqebellino.com", role: "superadmin" }))
    )

    render(<StoreHeader />)

    expect(await screen.findByRole("link", { name: /panel/i })).toHaveAttribute("href", "/admin")
    expect(screen.getByRole("link", { name: /perfil, admin@zeqebellino.com/i })).toHaveAttribute(
      "href",
      "/perfil"
    )
  })
})
