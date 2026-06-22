import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { StoreHeader } from "./store-header"

describe("StoreHeader", () => {
  it("exposes mobile-first navigation and icon labels", () => {
    render(<StoreHeader cartCount={2} />)

    expect(screen.getByRole("link", { name: /freestyle sport/i })).toHaveAttribute("href", "/")
    expect(screen.getByRole("button", { name: /abrir menú/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /buscar/i })).toHaveAttribute("href", "/buscar")
    expect(screen.getByRole("link", { name: /perfil/i })).toHaveAttribute("href", "/cuenta")
    expect(screen.getByRole("link", { name: /carrito, 2 productos/i })).toHaveAttribute(
      "href",
      "/carrito",
    )
  })
})
