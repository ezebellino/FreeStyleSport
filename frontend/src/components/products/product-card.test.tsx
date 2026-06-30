import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { CartProvider } from "@/components/cart/cart-provider"
import { demoProducts, type Product } from "@/lib/products"

import { ProductCard } from "./product-card"

function renderProductCard(product: Product) {
  return render(
    <CartProvider>
      <ProductCard product={product} />
    </CartProvider>,
  )
}

describe("ProductCard", () => {
  it("shows image, price, category, variants and product actions", () => {
    renderProductCard(demoProducts[0])

    expect(screen.getByRole("img", { name: /remera deportiva negra/i })).toBeInTheDocument()
    expect(screen.getByText(/remera training oversize/i)).toBeInTheDocument()
    expect(screen.getByText(/hombre/i)).toBeInTheDocument()
    expect(screen.getByText(/ropa/i)).toBeInTheDocument()
    expect(screen.getByText(/\$ 28\.900/i)).toBeInTheDocument()
    expect(screen.getByText(/-17%/i)).toBeInTheDocument()
    expect(screen.getByText(/2 opciones disponibles/i)).toBeInTheDocument()
    expect(screen.getByText(/talles: m, l/i)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /ver talles y comprar/i })).toHaveAttribute(
      "href",
      "/productos/remera-training-oversize",
    )
  })

  it("normalizes legacy combined category labels", () => {
    const product: Product = {
      ...demoProducts[1],
      category: { id: "legacy", name: "Hombre Calzados", slug: "hombre-calzados" },
      attributes: {},
    }

    renderProductCard(product)

    expect(screen.getByText(/hombre/i)).toBeInTheDocument()
    expect(screen.getByText(/calzado/i)).toBeInTheDocument()
  })
})
