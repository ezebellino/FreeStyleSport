"use client"

import { FormEvent, useState } from "react"

import { ProductImage } from "@/components/products/product-image"
import { Button } from "@/components/ui/button"
import {
  createAdminProduct,
  getProductAudienceValue,
  getProductCategoryValue,
  type Product,
  type ProductVariant,
  productAudiences,
  productCategories,
  updateAdminProduct,
} from "@/lib/products"

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

type ProductAdminFormProps = {
  product?: Product | null
  onCancel?: () => void
  onSaved?: (product: Product) => void
}

type VariantDraft = {
  label: string
  stock: number
  sku: string
  price: string
  color: string
}

function variantToDraft(variant: ProductVariant): VariantDraft {
  return {
    label: typeof variant.attributes.talle === "string" ? variant.attributes.talle : variant.label,
    stock: variant.stock_quantity,
    sku: variant.sku ?? "",
    price: variant.price ? String(variant.price) : "",
    color: typeof variant.attributes.color === "string" ? variant.attributes.color : "",
  }
}

function emptyVariantDraft(): VariantDraft {
  return {
    label: "Único",
    stock: 0,
    sku: "",
    price: "",
    color: "",
  }
}

function displayVariantLabel(variant: VariantDraft, fallback: string) {
  const size = variant.label.trim() || fallback
  const color = variant.color.trim()
  return color ? `${color} / ${size}` : size
}

function splitBulkValues(value: string) {
  return value
    .split(/[\n,;]+/)
    .map((part) => part.trim())
    .filter(Boolean)
}

function skuPart(value: string) {
  return slugify(value).toUpperCase()
}

export function ProductAdminForm({ product, onCancel, onSaved }: Readonly<ProductAdminFormProps>) {
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bulkColors, setBulkColors] = useState("")
  const [bulkSizes, setBulkSizes] = useState("")
  const [bulkStock, setBulkStock] = useState(0)
  const [bulkPrice, setBulkPrice] = useState("")
  const [bulkSkuBase, setBulkSkuBase] = useState("")
  const [imagePreviewUrl, setImagePreviewUrl] = useState(product?.images[0]?.url ?? "")
  const [variants, setVariants] = useState<VariantDraft[]>(
    product?.variants.length ? product.variants.map(variantToDraft) : [emptyVariantDraft()],
  )
  const isEditing = Boolean(product)
  const mainImage = product?.images[0]
  const categoryValue = product ? getProductCategoryValue(product) : "ropa"
  const audienceValue = product ? getProductAudienceValue(product) : "unisex"

  function updateVariant(index: number, patch: Partial<VariantDraft>) {
    setVariants((currentVariants) =>
      currentVariants.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, ...patch } : variant,
      ),
    )
  }

  function addVariant() {
    setVariants((currentVariants) => [...currentVariants, emptyVariantDraft()])
  }

  function removeVariant(index: number) {
    setVariants((currentVariants) =>
      currentVariants.length > 1
        ? currentVariants.filter((_, variantIndex) => variantIndex !== index)
        : currentVariants,
    )
  }

  function generateVariantCombinations() {
    setMessage(null)
    setError(null)

    const colors = splitBulkValues(bulkColors)
    const sizes = splitBulkValues(bulkSizes)
    const stock = Math.max(0, Number(bulkStock) || 0)
    const skuBase = bulkSkuBase.trim()

    if (!colors.length || !sizes.length) {
      setError("Agrega al menos un color y un talle para generar variantes.")
      return
    }

    const generatedVariants = colors.flatMap((color) =>
      sizes.map((size) => ({
        label: size,
        color,
        stock,
        price: bulkPrice,
        sku: skuBase ? `${skuBase}-${skuPart(color)}-${skuPart(size)}` : "",
      })),
    )

    setVariants((currentVariants) => {
      const shouldReplaceDefault =
        currentVariants.length === 1 &&
        !currentVariants[0].color.trim() &&
        currentVariants[0].stock === 0 &&
        !currentVariants[0].sku.trim() &&
        !currentVariants[0].price.trim()

      const baseVariants = shouldReplaceDefault ? [] : currentVariants
      const existingKeys = new Set(
        baseVariants.map((variant) => `${variant.color.trim().toLowerCase()}|${variant.label.trim().toLowerCase()}`),
      )
      const uniqueGeneratedVariants = generatedVariants.filter((variant) => {
        const key = `${variant.color.trim().toLowerCase()}|${variant.label.trim().toLowerCase()}`
        if (existingKeys.has(key)) {
          return false
        }
        existingKeys.add(key)
        return true
      })

      if (!uniqueGeneratedVariants.length) {
        setMessage("Esas combinaciones ya estaban cargadas.")
        return currentVariants
      }

      setMessage(`${uniqueGeneratedVariants.length} variantes agregadas. Revisalas y guardá el producto.`)
      return [...baseVariants, ...uniqueGeneratedVariants]
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    setError(null)
    setIsSubmitting(true)

    const form = new FormData(event.currentTarget)
    const name = String(form.get("name") ?? "")
    const category = String(form.get("category") ?? "")
    const audience = String(form.get("audience") ?? "unisex")
    const imageUrl = String(form.get("imageUrl") ?? "")
    const price = Number(form.get("price") ?? 0)
    const compareAtPrice = Number(form.get("compareAtPrice") ?? 0)
    const slug = slugify(String(form.get("slug") ?? "") || name)
    const status = String(form.get("status") ?? "published") as Product["status"]
    const normalizedVariants = variants
      .map((variant, index) => ({
        sku: variant.sku.trim() || undefined,
        label: displayVariantLabel(variant, `Variante ${index + 1}`),
        price: variant.price ? Number(variant.price) : undefined,
        stock_quantity: Math.max(0, Number(variant.stock) || 0),
        attributes: {
          talle: variant.label.trim() || `Variante ${index + 1}`,
          ...(variant.color.trim() ? { color: variant.color.trim() } : {}),
        },
        sort_order: index,
      }))
      .filter((variant) => variant.label)

    try {
      const payload = {
        name,
        slug,
        description: String(form.get("description") ?? ""),
        brand: String(form.get("brand") ?? "FreeStyle"),
        category_slug: slugify(category),
        status: status as "draft" | "published" | "paused" | "archived",
        base_price: price,
        compare_at_price: compareAtPrice > 0 ? compareAtPrice : undefined,
        currency: "ARS",
        attributes: { linea: audience, rubro: "generico" },
        images: imageUrl
          ? [{ url: imageUrl, alt_text: name, provider: imageUrl.includes("cloudinary") ? "cloudinary" : "url" }]
          : [],
        variants: normalizedVariants.length > 0 ? normalizedVariants : [
          { label: "Único", stock_quantity: 0, attributes: { talle: "Único" }, sort_order: 0 },
        ],
      }
      const savedProduct = product
        ? await updateAdminProduct(product.id, payload)
        : await createAdminProduct(payload)
      setMessage(product ? "Producto actualizado." : "Producto guardado. Ya puede aparecer en la tienda.")
      onSaved?.(savedProduct)
      if (!product) {
        event.currentTarget.reset()
        setVariants([emptyVariantDraft()])
        setImagePreviewUrl("")
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos guardar los cambios")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="grid gap-4 rounded-3xl border bg-card p-6 md:grid-cols-2" onSubmit={handleSubmit}>
      <div className="md:col-span-2">
        <h3 className="text-xl font-black">{isEditing ? "Editar producto" : "Nuevo producto"}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {isEditing
            ? "Modificá los datos visibles del producto y guardá los cambios."
            : "Cargá un producto nuevo para publicarlo en la tienda."}
        </p>
      </div>
      <label className="space-y-2">
        <span className="text-sm font-medium">Nombre</span>
        <input
          className="h-11 w-full rounded-lg border bg-background px-3 text-sm"
          defaultValue={product?.name ?? ""}
          name="name"
          required
        />
      </label>
      <label className="space-y-2">
        <span className="text-sm font-medium">Enlace</span>
        <input
          className="h-11 w-full rounded-lg border bg-background px-3 text-sm"
          defaultValue={product?.slug ?? ""}
          name="slug"
          placeholder="se genera desde el nombre"
        />
      </label>
      <label className="space-y-2">
        <span className="text-sm font-medium">Categoria</span>
        <select
          className="h-11 w-full rounded-lg border bg-background px-3 text-sm"
          defaultValue={categoryValue ?? "ropa"}
          name="category"
          required
        >
          {productCategories.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-2">
        <span className="text-sm font-medium">Linea</span>
        <select
          className="h-11 w-full rounded-lg border bg-background px-3 text-sm"
          defaultValue={audienceValue ?? "unisex"}
          name="audience"
          required
        >
          {productAudiences.map((audience) => (
            <option key={audience.value} value={audience.value}>
              {audience.label}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-2">
        <span className="text-sm font-medium">Estado</span>
        <select
          className="h-11 w-full rounded-lg border bg-background px-3 text-sm"
          defaultValue={product?.status ?? "published"}
          name="status"
          required
        >
          <option value="published">Publicado</option>
          <option value="draft">Borrador</option>
          <option value="paused">Pausado</option>
          <option value="archived">Archivado</option>
        </select>
      </label>
      <label className="space-y-2">
        <span className="text-sm font-medium">Precio</span>
        <input
          className="h-11 w-full rounded-lg border bg-background px-3 text-sm"
          defaultValue={product?.base_price ? Number(product.base_price) : ""}
          min="0"
          name="price"
          required
          type="number"
        />
      </label>
      <label className="space-y-2">
        <span className="text-sm font-medium">Precio anterior/oferta</span>
        <input
          className="h-11 w-full rounded-lg border bg-background px-3 text-sm"
          defaultValue={product?.compare_at_price ? Number(product.compare_at_price) : ""}
          min="0"
          name="compareAtPrice"
          type="number"
        />
      </label>
      <label className="space-y-2">
        <span className="text-sm font-medium">Marca</span>
        <input
          className="h-11 w-full rounded-lg border bg-background px-3 text-sm"
          defaultValue={product?.brand ?? ""}
          name="brand"
          placeholder="FreeStyle"
        />
      </label>
      <label className="space-y-2 md:col-span-2">
        <span className="text-sm font-medium">Imagen</span>
        <input
          className="h-11 w-full rounded-lg border bg-background px-3 text-sm"
          defaultValue={mainImage?.url ?? ""}
          name="imageUrl"
          onChange={(event) => setImagePreviewUrl(event.target.value)}
          placeholder="https://res.cloudinary.com/..."
          type="url"
        />
      </label>
      <div className="grid gap-3 rounded-2xl border bg-background/50 p-4 md:col-span-2 md:grid-cols-[12rem_1fr]">
        <div className="aspect-square overflow-hidden rounded-2xl border bg-white">
          <ProductImage
            alt={product?.name ?? "Vista previa del producto"}
            className="size-full object-contain p-2"
            src={imagePreviewUrl}
          />
        </div>
        <div className="self-center">
          <p className="text-sm font-semibold">Vista previa</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Si la imagen no carga, la tienda muestra un fondo FreeStyle para evitar una card rota.
            Cuando integremos subida directa, este espacio va a servir para revisar el archivo antes
            de publicarlo.
          </p>
        </div>
      </div>
      <label className="space-y-2 md:col-span-2">
        <span className="text-sm font-medium">Descripcion</span>
        <textarea
          className="min-h-24 w-full rounded-lg border bg-background px-3 py-2 text-sm"
          defaultValue={product?.description ?? ""}
          name="description"
        />
      </label>
      <div className="space-y-3 md:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="font-semibold">Talles, colores y stock</h4>
            <p className="text-sm text-muted-foreground">
              Agregá una fila por talle, número, color o presentación disponible.
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={addVariant}>
            Agregar variante
          </Button>
        </div>
        <div className="grid gap-3 rounded-2xl border bg-background/50 p-4">
          <div>
            <h5 className="font-semibold">Generar variantes rápido</h5>
            <p className="text-sm text-muted-foreground">
              Cargá colores y talles una sola vez. El sistema crea todas las combinaciones para que puedas ajustar stock,
              SKU o precio antes de guardar.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground">Colores</span>
              <textarea
                className="min-h-20 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                value={bulkColors}
                onChange={(event) => setBulkColors(event.target.value)}
                placeholder="Verde, Negro"
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground">Talles o números</span>
              <textarea
                className="min-h-20 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                value={bulkSizes}
                onChange={(event) => setBulkSizes(event.target.value)}
                placeholder="39, 40, 41"
              />
            </label>
          </div>
          <div className="grid gap-3 md:grid-cols-[0.8fr_0.8fr_1fr_auto]">
            <label className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground">Stock por combinación</span>
              <input
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                min="0"
                type="number"
                value={bulkStock}
                onChange={(event) => setBulkStock(Number(event.target.value))}
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground">Precio propio</span>
              <input
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                min="0"
                type="number"
                value={bulkPrice}
                onChange={(event) => setBulkPrice(event.target.value)}
                placeholder="opcional"
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground">SKU base</span>
              <input
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                value={bulkSkuBase}
                onChange={(event) => setBulkSkuBase(event.target.value)}
                placeholder="NIKE-SB"
              />
            </label>
            <Button className="self-end" type="button" variant="secondary" onClick={generateVariantCombinations}>
              Generar combinaciones
            </Button>
          </div>
        </div>
        <div className="grid gap-3">
          {variants.map((variant, index) => (
            <div
              key={`${index}-${variant.sku}`}
              className="grid gap-3 rounded-2xl border bg-background/40 p-3 md:grid-cols-[1fr_1fr_0.7fr_0.8fr_0.8fr_auto]"
            >
              <label className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground">Talle o variante</span>
                <input
                  className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                  value={variant.label}
                  onChange={(event) => updateVariant(index, { label: event.target.value })}
                  placeholder="M, 40, Único"
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground">Color</span>
                <input
                  className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                  value={variant.color}
                  onChange={(event) => updateVariant(index, { color: event.target.value })}
                  placeholder="Negro"
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground">Stock</span>
                <input
                  className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                  min="0"
                  type="number"
                  value={variant.stock}
                  onChange={(event) => updateVariant(index, { stock: Number(event.target.value) })}
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground">SKU</span>
                <input
                  className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                  value={variant.sku}
                  onChange={(event) => updateVariant(index, { sku: event.target.value })}
                  placeholder="opcional"
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground">Precio propio</span>
                <input
                  className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                  min="0"
                  type="number"
                  value={variant.price}
                  onChange={(event) => updateVariant(index, { price: event.target.value })}
                  placeholder="opcional"
                />
              </label>
              <Button
                className="self-end"
                type="button"
                variant="ghost"
                onClick={() => removeVariant(index)}
                disabled={variants.length === 1}
              >
                Quitar
              </Button>
            </div>
          ))}
        </div>
      </div>
      {error ? <p className="text-sm text-destructive md:col-span-2">{error}</p> : null}
      {message ? <p className="text-sm text-primary md:col-span-2">{message}</p> : null}
      <div className="flex flex-wrap gap-2 md:col-span-2">
        <Button className="flex-1" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Guardando..." : isEditing ? "Actualizar producto" : "Guardar producto"}
        </Button>
        {onCancel ? (
          <Button variant="secondary" type="button" onClick={onCancel}>
            Cancelar
          </Button>
        ) : null}
      </div>
    </form>
  )
}
