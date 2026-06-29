"use client"

import {
  AlertTriangleIcon,
  Edit3Icon,
  EyeIcon,
  PackageIcon,
  RefreshCwIcon,
  SearchIcon,
} from "lucide-react"
import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"

import { ProductAdminForm } from "@/components/products/product-admin-form"
import { ProductImage } from "@/components/products/product-image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/ui/loading-state"
import { formatCartPrice } from "@/lib/cart"
import {
  getProductAudienceLabel,
  getProductCategoryLabel,
  getProductCategoryValue,
  listAdminProducts,
  productCategories,
  type Product,
  type ProductPayload,
  updateAdminProduct,
} from "@/lib/products"

type ProductVariant = Product["variants"][number]

type ProductFilters = {
  query: string
  status: "all" | ProductPayload["status"]
  stock: "all" | "available" | "low" | "out"
  category: string
}

const statusLabels: Record<string, string> = {
  draft: "Borrador",
  published: "Publicado",
  paused: "Pausado",
  archived: "Archivado",
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

function variantAttribute(variant: ProductVariant, keys: string[]) {
  for (const key of keys) {
    const value = variant.attributes[key]
    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }
  }

  return null
}

function variantColor(variant: ProductVariant) {
  return variantAttribute(variant, ["color", "colour", "color_nombre"]) ?? "Color único"
}

function variantSize(variant: ProductVariant) {
  return variantAttribute(variant, ["talle", "numero", "size", "medida"]) ?? variant.label
}

function productStock(product: Product) {
  return product.variants.reduce((total, variant) => total + variant.stock_quantity, 0)
}

function productHasOffer(product: Product) {
  return Boolean(
    product.compare_at_price && Number(product.compare_at_price) > Number(product.base_price),
  )
}

function productSearchText(product: Product) {
  const variantText = product.variants.flatMap((variant) => [
    variant.label,
    variant.sku ?? "",
    variantColor(variant),
    variantSize(variant),
  ])

  return normalizeText(
    [
      product.name,
      product.slug,
      product.description ?? "",
      product.brand ?? "",
      product.status,
      product.category?.name ?? "",
      product.category?.slug ?? "",
      getProductAudienceLabel(product) ?? "",
      getProductCategoryLabel(product) ?? "",
      ...variantText,
    ].join(" "),
  )
}

function variantGroups(product: Product) {
  const groups = new Map<
    string,
    {
      color: string
      totalStock: number
      variants: Array<{ key: string; size: string; stock: number }>
    }
  >()

  for (const variant of product.variants) {
    const color = variantColor(variant)
    const group = groups.get(color) ?? { color, totalStock: 0, variants: [] }
    group.totalStock += variant.stock_quantity
    group.variants.push({
      key: variant.id ?? `${color}-${variant.label}`,
      size: variantSize(variant),
      stock: variant.stock_quantity,
    })
    groups.set(color, group)
  }

  return Array.from(groups.values())
}

function filterProducts(products: Product[], filters: ProductFilters) {
  const query = normalizeText(filters.query.trim())

  return products.filter((product) => {
    const stock = productStock(product)
    if (query && !productSearchText(product).includes(query)) return false
    if (filters.status !== "all" && product.status !== filters.status) return false
    if (filters.category && getProductCategoryValue(product) !== filters.category) return false
    if (filters.stock === "available" && stock <= 0) return false
    if (filters.stock === "low" && (stock <= 0 || stock > 2)) return false
    if (filters.stock === "out" && stock > 0) return false
    return true
  })
}

export function ProductAdminPanel() {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [filters, setFilters] = useState<ProductFilters>({
    query: "",
    status: "all",
    stock: "all",
    category: "",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [updatingProductId, setUpdatingProductId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLDivElement>(null)

  const metrics = useMemo(() => {
    const published = products.filter((product) => product.status === "published").length
    const lowStock = products.filter((product) => {
      const stock = productStock(product)
      return stock > 0 && stock <= 2
    }).length
    const outOfStock = products.filter((product) => productStock(product) <= 0).length
    const offers = products.filter(productHasOffer).length

    return { lowStock, offers, outOfStock, published, total: products.length }
  }, [products])

  const filteredProducts = useMemo(() => filterProducts(products, filters), [filters, products])

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
      void fetchProducts()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [])

  function updateFilter<Key extends keyof ProductFilters>(key: Key, value: ProductFilters[Key]) {
    setFilters((currentFilters) => ({ ...currentFilters, [key]: value }))
  }

  function clearFilters() {
    setFilters({
      query: "",
      status: "all",
      stock: "all",
      category: "",
    })
  }

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
      <div className="rounded-[2rem] border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-black">Productos</h2>
              <Badge variant="secondary">{metrics.total} cargados</Badge>
              <Badge>{metrics.published} publicados</Badge>
              {metrics.lowStock > 0 ? <Badge variant="destructive">{metrics.lowStock} bajo stock</Badge> : null}
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Buscá, filtrá y editá productos sin recorrer todo el listado. Prioridad operativa:
              productos sin stock, bajo stock y publicaciones pausadas.
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

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border bg-background/50 p-4">
            <PackageIcon className="mb-3 size-5 text-primary" />
            <p className="text-3xl font-black">{metrics.published}</p>
            <p className="text-sm font-semibold">Publicados</p>
            <p className="mt-1 text-xs text-muted-foreground">Visibles para clientes.</p>
          </article>
          <article className="rounded-2xl border bg-background/50 p-4">
            <AlertTriangleIcon className="mb-3 size-5 text-primary" />
            <p className="text-3xl font-black">{metrics.lowStock}</p>
            <p className="text-sm font-semibold">Bajo stock</p>
            <p className="mt-1 text-xs text-muted-foreground">Entre 1 y 2 unidades.</p>
          </article>
          <article className="rounded-2xl border bg-background/50 p-4">
            <AlertTriangleIcon className="mb-3 size-5 text-primary" />
            <p className="text-3xl font-black">{metrics.outOfStock}</p>
            <p className="text-sm font-semibold">Sin stock</p>
            <p className="mt-1 text-xs text-muted-foreground">Revisar antes de vender.</p>
          </article>
          <article className="rounded-2xl border bg-background/50 p-4">
            <PackageIcon className="mb-3 size-5 text-primary" />
            <p className="text-3xl font-black">{metrics.offers}</p>
            <p className="text-sm font-semibold">En oferta</p>
            <p className="mt-1 text-xs text-muted-foreground">Con precio anterior cargado.</p>
          </article>
        </div>

        {error ? (
          <p className="mt-4 rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <div className="mt-4 rounded-3xl border bg-background/45 p-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_12rem_12rem_12rem_auto]">
            <label className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground">Buscar</span>
              <div className="relative">
                <SearchIcon
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  className="h-10 w-full rounded-xl border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary"
                  placeholder="Nombre, marca, color, talle, SKU..."
                  type="search"
                  value={filters.query}
                  onChange={(event) => updateFilter("query", event.target.value)}
                />
              </div>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground">Estado</span>
              <select
                className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
                value={filters.status}
                onChange={(event) =>
                  updateFilter("status", event.target.value as ProductFilters["status"])
                }
              >
                <option value="all">Todos</option>
                <option value="published">Publicado</option>
                <option value="draft">Borrador</option>
                <option value="paused">Pausado</option>
                <option value="archived">Archivado</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground">Stock</span>
              <select
                className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
                value={filters.stock}
                onChange={(event) =>
                  updateFilter("stock", event.target.value as ProductFilters["stock"])
                }
              >
                <option value="all">Todos</option>
                <option value="available">Con stock</option>
                <option value="low">Bajo stock</option>
                <option value="out">Sin stock</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground">Categoría</span>
              <select
                className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
                value={filters.category}
                onChange={(event) => updateFilter("category", event.target.value)}
              >
                <option value="">Todas</option>
                {productCategories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-end">
              <Button type="button" variant="ghost" onClick={clearFilters}>
                Limpiar
              </Button>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Mostrando {filteredProducts.length} de {products.length} producto
            {products.length === 1 ? "" : "s"}.
          </p>
        </div>

        {isLoading ? (
          <div className="mt-4">
            <LoadingState label="Cargando productos..." />
          </div>
        ) : products.length === 0 ? (
          <p className="mt-4 rounded-2xl border bg-secondary/40 p-4 text-sm text-muted-foreground">
            Todavía no hay productos cargados.
          </p>
        ) : filteredProducts.length === 0 ? (
          <p className="mt-4 rounded-2xl border bg-secondary/40 p-4 text-sm text-muted-foreground">
            No encontramos productos con esos filtros.
          </p>
        ) : (
          <div className="mt-4 grid gap-3">
            {filteredProducts.map((product) => {
              const stock = productStock(product)
              const groups = variantGroups(product)
              const mainImage = product.images[0]
              const categoryLabel = getProductCategoryLabel(product)
              const audienceLabel = getProductAudienceLabel(product)
              const isUpdating = updatingProductId === product.id

              return (
                <article
                  key={product.id}
                  className="grid gap-4 rounded-3xl border bg-background/40 p-4 xl:grid-cols-[7rem_1fr_auto]"
                >
                  <Link
                    href={`/productos/${product.slug}`}
                    className="aspect-square overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_center,#ffffff_0%,#f8fafc_45%,#dbeafe_100%)]"
                    target="_blank"
                  >
                    <ProductImage
                      alt={mainImage?.alt_text ?? product.name}
                      className="size-full object-contain p-2"
                      src={mainImage?.url}
                    />
                  </Link>

                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold">{product.name}</p>
                      <Badge variant={product.status === "published" ? "default" : "secondary"}>
                        {statusLabels[product.status] ?? product.status}
                      </Badge>
                      {productHasOffer(product) ? <Badge variant="outline">Oferta</Badge> : null}
                      {stock <= 0 ? (
                        <Badge variant="destructive">Sin stock</Badge>
                      ) : stock <= 2 ? (
                        <Badge variant="destructive">Bajo stock</Badge>
                      ) : null}
                      {selectedProduct?.id === product.id ? <Badge variant="outline">Editando</Badge> : null}
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {[audienceLabel, categoryLabel].filter(Boolean).join(" · ") || "Sin clasificación"}
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

                    {groups.length > 0 ? (
                      <div className="grid gap-2 md:grid-cols-2">
                        {groups.map((group) => (
                          <div key={group.color} className="rounded-2xl border bg-card/60 p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-semibold">{group.color}</p>
                              <Badge
                                variant={
                                  group.totalStock <= 0
                                    ? "destructive"
                                    : group.totalStock <= 2
                                      ? "outline"
                                      : "secondary"
                                }
                              >
                                Stock {group.totalStock}
                              </Badge>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {group.variants.map((variant) => (
                                <span
                                  key={variant.key}
                                  className={`rounded-full border px-2 py-1 text-xs ${
                                    variant.stock <= 0
                                      ? "bg-muted text-muted-foreground line-through"
                                      : variant.stock <= 2
                                        ? "border-destructive/40 bg-destructive/10 text-destructive"
                                        : "text-muted-foreground"
                                  }`}
                                >
                                  {variant.size}: {variant.stock}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Sin variantes cargadas.</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 xl:w-44 xl:flex-col xl:items-stretch">
                    <Button type="button" onClick={() => selectProduct(product)}>
                      <Edit3Icon data-icon="inline-start" />
                      Editar
                    </Button>
                    <Button asChild variant="secondary">
                      <Link href={`/productos/${product.slug}`} target="_blank">
                        <EyeIcon data-icon="inline-start" />
                        Ver
                      </Link>
                    </Button>
                    {product.status === "published" ? (
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={isUpdating}
                        onClick={() => void changeProductStatus(product, "paused")}
                      >
                        Pausar
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={isUpdating}
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
