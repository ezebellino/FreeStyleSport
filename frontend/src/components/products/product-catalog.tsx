"use client"

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
}: Readonly<{
  products: Product[]
  initialCategory?: string
  initialAudience?: string
  initialSearch?: string
}>) {
  const [filters, setFilters] = useState<CatalogFilters>({
    query: initialSearch,
    category: initialCategory,
    audience: initialAudience,
    color: "",
    size: "",
    availability: "all",
    offer: "all",
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

  function updateFilter<Key extends keyof CatalogFilters>(key: Key, value: CatalogFilters[Key]) {
    setFilters((currentFilters) => ({ ...currentFilters, [key]: value }))
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
      <div className="rounded-3xl border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-black">Encontrar productos</h2>
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
