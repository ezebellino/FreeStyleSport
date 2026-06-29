"use client"

import Link from "next/link"
import { useMemo, useState } from "react"

import { ProductCard } from "@/components/products/product-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  getProductAudienceValue,
  getProductCategoryValue,
  productAudiences,
  productCategories,
  type Product,
  type ProductVariant,
} from "@/lib/products"

type CatalogFilters = {
  query: string
  category: string
  audience: string
  color: string
  size: string
  availability: "all" | "available"
  offer: "all" | "offers"
}

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

function productSearchText(product: Product) {
  const variantTexts = product.variants.flatMap((variant) => [
    variant.label,
    variant.sku ?? "",
    variantColor(variant) ?? "",
    variantSize(variant),
  ])
  const attributeTexts = Object.values(product.attributes).flatMap((value) =>
    typeof value === "string" ? [value] : [],
  )

  return normalizeSearchText(
    [
      product.name,
      product.slug,
      product.description ?? "",
      product.brand ?? "",
      product.category?.name ?? "",
      product.category?.slug ?? "",
      ...productColors(product),
      ...productSizes(product),
      ...variantTexts,
      ...attributeTexts,
    ].join(" "),
  )
}

function variantAttribute(variant: ProductVariant, names: string[]) {
  for (const name of names) {
    const value = variant.attributes[name]
    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }
  }

  return null
}

function variantColor(variant: ProductVariant) {
  return variantAttribute(variant, ["color", "colour", "color_nombre"])
}

function variantSize(variant: ProductVariant) {
  return variantAttribute(variant, ["talle", "numero", "size", "medida"]) ?? variant.label
}

function productColors(product: Product) {
  const values = new Set<string>()
  for (const variant of product.variants) {
    const color = variantColor(variant)
    if (color) values.add(color)
  }
  if (typeof product.attributes.color === "string") {
    values.add(product.attributes.color)
  }
  return Array.from(values)
}

function productSizes(product: Product) {
  return Array.from(new Set(product.variants.map(variantSize).filter(Boolean)))
}

function productHasStock(product: Product) {
  return product.variants.some((variant) => variant.stock_quantity > 0)
}

function productHasOffer(product: Product) {
  return Boolean(
    product.compare_at_price && Number(product.compare_at_price) > Number(product.base_price),
  )
}

function filterProducts(products: Product[], filters: CatalogFilters) {
  const query = normalizeSearchText(filters.query.trim())

  return products.filter((product) => {
    if (query && !productSearchText(product).includes(query)) return false
    if (filters.category && getProductCategoryValue(product) !== filters.category) return false
    if (filters.audience && getProductAudienceValue(product) !== filters.audience) return false
    if (filters.availability === "available" && !productHasStock(product)) return false
    if (filters.offer === "offers" && !productHasOffer(product)) return false
    if (filters.color && !productColors(product).includes(filters.color)) return false
    if (filters.size && !productSizes(product).includes(filters.size)) return false
    return true
  })
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((left, right) =>
    left.localeCompare(right, "es"),
  )
}

export function ProductCatalog({
  products,
  initialCategory = "",
  initialAudience = "",
  initialSearch = "",
  initialOffer = "all",
}: Readonly<{
  products: Product[]
  initialCategory?: string
  initialAudience?: string
  initialSearch?: string
  initialOffer?: CatalogFilters["offer"]
}>) {
  const [filters, setFilters] = useState<CatalogFilters>({
    query: initialSearch,
    category: initialCategory,
    audience: initialAudience,
    color: "",
    size: "",
    availability: "all",
    offer: initialOffer,
  })

  const colorOptions = useMemo(
    () => uniqueSorted(products.flatMap(productColors)),
    [products],
  )
  const sizeOptions = useMemo(
    () => uniqueSorted(products.flatMap(productSizes)),
    [products],
  )
  const filteredProducts = useMemo(
    () => filterProducts(products, filters),
    [filters, products],
  )
  const offerCount = useMemo(() => products.filter(productHasOffer).length, [products])
  const availableCount = useMemo(() => products.filter(productHasStock).length, [products])
  const suggestedProduct = filters.query.trim() ? filteredProducts[0] : null

  function updateFilter<Key extends keyof CatalogFilters>(key: Key, value: CatalogFilters[Key]) {
    setFilters((currentFilters) => ({ ...currentFilters, [key]: value }))
  }

  function applyQuickSearch(query: string) {
    setFilters((currentFilters) => ({
      ...currentFilters,
      query,
    }))
  }

  function clearFilters() {
    setFilters({
      query: "",
      category: "",
      audience: "",
      color: "",
      size: "",
      availability: "all",
      offer: "all",
    })
  }

  const activeFilterCount = [
    filters.query,
    filters.category,
    filters.audience,
    filters.color,
    filters.size,
    filters.availability === "available" ? "available" : "",
    filters.offer === "offers" ? "offers" : "",
  ].filter(Boolean).length

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
        <div className="relative isolate border-b bg-[radial-gradient(circle_at_15%_20%,rgba(37,99,235,0.22),transparent_28%),linear-gradient(135deg,#020617,#111827_55%,#1d4ed8)] p-5 text-white">
          <div className="absolute inset-y-0 right-0 -z-10 w-1/2 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.32),transparent_55%)]" />
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-white/70">
                Busqueda rapida
              </p>
              <h2 className="mt-1 text-2xl font-black italic tracking-tight">
                Encontralo por marca, talle, color o promo
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">
                El cliente puede llegar al producto sin recorrer todo el catalogo. Si hay una
                oferta o stock disponible, queda visible antes de abrir la ficha.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur">
                <p className="text-2xl font-black">{products.length}</p>
                <p className="text-xs text-white/70">productos</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur">
                <p className="text-2xl font-black">{availableCount}</p>
                <p className="text-xs text-white/70">con stock</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur">
                <p className="text-2xl font-black">{offerCount}</p>
                <p className="text-xs text-white/70">ofertas</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-black">Encontrar productos</h3>
              <Badge variant={activeFilterCount > 0 ? "default" : "secondary"}>
                {filteredProducts.length} resultado{filteredProducts.length === 1 ? "" : "s"}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Busca por nombre, marca, descripcion, color, talle o categoria.
            </p>
          </div>
          {activeFilterCount > 0 ? (
            <Button type="button" variant="ghost" onClick={clearFilters}>
              Limpiar filtros
            </Button>
          ) : null}
        </div>

        <label className="mt-4 block space-y-2">
          <span className="text-xs font-medium text-muted-foreground">Buscar</span>
          <input
            className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary"
            placeholder="Ej: Nike, zapatilla, verde, 41..."
            type="search"
            value={filters.query}
            onChange={(event) => updateFilter("query", event.target.value)}
          />
        </label>

        <div className="mt-3 flex flex-wrap gap-2">
          {["Nike", "Zapatilla", "Calzado", "Remera", "41"].map((query) => (
            <Button
              key={query}
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => applyQuickSearch(query)}
            >
              {query}
            </Button>
          ))}
          <Button
            type="button"
            variant={filters.offer === "offers" ? "default" : "secondary"}
            size="sm"
            onClick={() => updateFilter("offer", filters.offer === "offers" ? "all" : "offers")}
          >
            Ver ofertas
          </Button>
          <Button
            type="button"
            variant={filters.availability === "available" ? "default" : "secondary"}
            size="sm"
            onClick={() =>
              updateFilter(
                "availability",
                filters.availability === "available" ? "all" : "available",
              )
            }
          >
            Con stock
          </Button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          <label className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground">Categoria</span>
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
          <label className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground">Linea</span>
            <select
              className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
              value={filters.audience}
              onChange={(event) => updateFilter("audience", event.target.value)}
            >
              <option value="">Todas</option>
              {productAudiences.map((audience) => (
                <option key={audience.value} value={audience.value}>
                  {audience.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground">Color</span>
            <select
              className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
              value={filters.color}
              onChange={(event) => updateFilter("color", event.target.value)}
            >
              <option value="">Todos</option>
              {colorOptions.map((color) => (
                <option key={color} value={color}>
                  {color}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground">Talle</span>
            <select
              className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
              value={filters.size}
              onChange={(event) => updateFilter("size", event.target.value)}
            >
              <option value="">Todos</option>
              {sizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground">Stock</span>
            <select
              className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
              value={filters.availability}
              onChange={(event) =>
                updateFilter("availability", event.target.value as CatalogFilters["availability"])
              }
            >
              <option value="all">Todos</option>
              <option value="available">Disponibles</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground">Ofertas</span>
            <select
              className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
              value={filters.offer}
              onChange={(event) =>
                updateFilter("offer", event.target.value as CatalogFilters["offer"])
              }
            >
              <option value="all">Todos</option>
              <option value="offers">Solo ofertas</option>
            </select>
          </label>
        </div>

        {suggestedProduct ? (
          <div className="mt-4 flex flex-col gap-3 rounded-2xl border bg-primary/5 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-bold">Mejor coincidencia: {suggestedProduct.name}</p>
              <p className="text-muted-foreground">
                Abrilo para elegir color, talle y confirmar disponibilidad.
              </p>
            </div>
            <Button asChild size="sm">
              <Link href={`/productos/${suggestedProduct.slug}`}>Ver ahora</Link>
            </Button>
          </div>
        ) : null}
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="rounded-3xl border bg-secondary/40 p-6 text-sm text-muted-foreground">
          No encontramos productos con esos filtros. Probá limpiar algún criterio.
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
