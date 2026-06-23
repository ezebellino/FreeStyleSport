import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { demoProducts } from "@/lib/products"

import { ProductCard } from "./product-card"

describe("ProductCard", () => {
  it("shows image, price, category, variants and product actions", () => {
    render(<ProductCard product={demoProducts[0]} />)

    expect(screen.getByRole("img", { name: /remera deportiva negra/i })).toBeInTheDocument()
    expect(screen.getByText(/remera training oversize/i)).toBeInTheDocument()
    expect(screen.getByText(/hombre/i)).toBeInTheDocument()
    expect(screen.getByText(/\$ 28\.900/i)).toBeInTheDocument()
    expect(screen.getByText(/talles: m, l/i)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /ver producto/i })).toHaveAttribute(
      "href",
      "/productos/remera-training-oversize",
    )
  })
})
