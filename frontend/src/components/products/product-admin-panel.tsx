"use client"

import { Edit3Icon, RefreshCwIcon } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"

import { ProductAdminForm } from "@/components/products/product-admin-form"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/ui/loading-state"
import { formatCartPrice } from "@/lib/cart"
import {
  getProductAudienceLabel,
  getProductCategoryLabel,
  listAdminProducts,
  type Product,
  type ProductPayload,
  updateAdminProduct,
} from "@/lib/products"

export function ProductAdminPanel() {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [updatingProductId, setUpdatingProductId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLDivElement>(null)

  const publishedCount = useMemo(
    () => products.filter((product) => product.status === "published").length,
    [products],
  )

  async function fetchProducts(refresh = false) {
    setError(null)
    if (refresh) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }

    try {
      const loadedProducts = await listAdminProducts()
      setProducts(loadedProducts)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos cargar los productos")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      async function loadInitialProducts() {
        setError(null)
        setIsLoading(true)
        try {
          setProducts(await listAdminProducts())
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "No pudimos cargar los productos")
        } finally {
          setIsLoading(false)
        }
      }

      void loadInitialProducts()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [])

  function handleSaved(savedProduct: Product) {
    setProducts((currentProducts) => {
      const exists = currentProducts.some((product) => product.id === savedProduct.id)
      if (!exists) {
        return [savedProduct, ...currentProducts]
      }
      return currentProducts.map((product) =>
        product.id === savedProduct.id ? savedProduct : product,
      )
    })
    setSelectedProduct(savedProduct)
  }

  function selectProduct(product: Product | null) {
    setSelectedProduct(product)
    window.setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 0)
  }

  async function changeProductStatus(product: Product, status: ProductPayload["status"]) {
    setUpdatingProductId(product.id)
    setError(null)
    try {
      const updatedProduct = await updateAdminProduct(product.id, { status })
      setProducts((currentProducts) =>
        currentProducts.map((currentProduct) =>
          currentProduct.id === updatedProduct.id ? updatedProduct : currentProduct,
        ),
      )
      setSelectedProduct((currentProduct) =>
        currentProduct?.id === updatedProduct.id ? updatedProduct : currentProduct,
      )
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos actualizar el producto")
    } finally {
      setUpdatingProductId(null)
    }
  }

  return (
    <section className="space-y-4">
      <div className="rounded-3xl border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-black">Productos</h2>
              <Badge variant="secondary">{products.length} cargados</Badge>
              <Badge>{publishedCount} publicados</Badge>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Editá precio, stock, imagen, descripción, categoría, línea y estado de publicación.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => selectProduct(null)}>
              Nuevo producto
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void fetchProducts(true)}
              disabled={isRefreshing}
            >
              <RefreshCwIcon data-icon="inline-start" />
              {isRefreshing ? "Actualizando..." : "Actualizar"}
            </Button>
          </div>
        </div>

        {error ? (
          <p className="mt-4 rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {isLoading ? (
          <div className="mt-4">
            <LoadingState label="Cargando productos..." />
          </div>
        ) : products.length === 0 ? (
          <p className="mt-4 rounded-2xl border bg-secondary/40 p-4 text-sm text-muted-foreground">
            Todavía no hay productos cargados.
          </p>
        ) : (
          <div className="mt-4 grid gap-3">
            {products.map((product) => {
              const stock = product.variants.reduce(
                (total, variant) => total + variant.stock_quantity,
                0,
              )
              const variantLabels = product.variants.map((variant) => variant.label).slice(0, 5)
              return (
                <article
                  key={product.id}
                  className="grid gap-3 rounded-2xl border bg-background/40 p-4 md:grid-cols-[1fr_auto]"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold">{product.name}</p>
                      <Badge variant={product.status === "published" ? "default" : "secondary"}>
                        {product.status}
                      </Badge>
                      {selectedProduct?.id === product.id ? <Badge variant="outline">Editando</Badge> : null}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {[getProductAudienceLabel(product), getProductCategoryLabel(product)]
                        .filter(Boolean)
                        .join(" · ") || "Sin clasificación"}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full border px-2 py-1">
                        {formatCartPrice(Number(product.base_price))}
                      </span>
                      <span className="rounded-full border px-2 py-1">Stock {stock}</span>
                      <span className="rounded-full border px-2 py-1">
                        {product.variants.length} variantes
                      </span>
                      <span className="rounded-full border px-2 py-1">/{product.slug}</span>
                    </div>
                    {variantLabels.length > 0 ? (
                      <p className="text-xs text-muted-foreground">
                        Variantes: {variantLabels.join(", ")}
                        {product.variants.length > variantLabels.length ? "..." : ""}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2 md:justify-end">
                    <Button type="button" onClick={() => selectProduct(product)}>
                      <Edit3Icon data-icon="inline-start" />
                      Editar
                    </Button>
                    {product.status === "published" ? (
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={updatingProductId === product.id}
                        onClick={() => void changeProductStatus(product, "paused")}
                      >
                        Pausar
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={updatingProductId === product.id}
                        onClick={() => void changeProductStatus(product, "published")}
                      >
                        Publicar
                      </Button>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>

      <div ref={formRef}>
        <ProductAdminForm
          key={selectedProduct?.id ?? "new"}
          product={selectedProduct}
          onCancel={selectedProduct ? () => setSelectedProduct(null) : undefined}
          onSaved={handleSaved}
        />
      </div>
    </section>
  )
}
