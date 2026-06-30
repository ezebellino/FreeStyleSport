"use client"

import {
  CheckCircle2Icon,
  ImageIcon,
  Layers3Icon,
  PackagePlusIcon,
  ShirtIcon,
  SparklesIcon,
} from "lucide-react"
import { type FormEvent, useMemo, useState } from "react"

import { ProductImage } from "@/components/products/product-image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { showError, showSuccess } from "@/lib/alerts"
import {
  createAdminProduct,
  getProductAudienceValue,
  getProductCategoryValue,
  productAudiences,
  productCategories,
  type Product,
  type ProductPayload,
  type ProductVariant,
  updateAdminProduct,
  uploadAdminProductImage,
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

type VariantDraftGroup = {
  key: string
  color: string
  totalStock: number
  variants: Array<{ index: number; variant: VariantDraft }>
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

function variantToDraft(variant: ProductVariant): VariantDraft {
  return {
    label: variantAttribute(variant, ["talle", "numero", "size", "medida"]) ?? variant.label,
    stock: variant.stock_quantity,
    sku: variant.sku ?? "",
    price: variant.price ? String(variant.price) : "",
    color: variantAttribute(variant, ["color", "colour", "color_nombre"]) ?? "",
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

function emptyImageList(product?: Product | null) {
  return product?.images.length ? product.images.map((image) => image.url) : [""]
}

function groupVariantDrafts(variants: VariantDraft[]): VariantDraftGroup[] {
  const groups = new Map<string, VariantDraftGroup>()

  variants.forEach((variant, index) => {
    const color = variant.color.trim() || "Sin color"
    const key = color.toLowerCase()
    const group = groups.get(key) ?? {
      key,
      color,
      totalStock: 0,
      variants: [],
    }

    group.totalStock += Math.max(0, Number(variant.stock) || 0)
    group.variants.push({ index, variant })
    groups.set(key, group)
  })

  return Array.from(groups.values())
}

function totalDraftStock(variants: VariantDraft[]) {
  return variants.reduce((total, variant) => total + Math.max(0, Number(variant.stock) || 0), 0)
}

function SectionCard({
  children,
  description,
  icon: Icon,
  title,
}: Readonly<{
  children: React.ReactNode
  description: string
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
  title: string
}>) {
  return (
    <section className="rounded-3xl border bg-background/45 p-4 md:p-5">
      <div className="mb-4 flex gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Icon className="size-5" aria-hidden />
        </div>
        <div>
          <h4 className="font-black">{title}</h4>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

function FieldHint({ children }: Readonly<{ children: React.ReactNode }>) {
  return <p className="text-xs leading-5 text-muted-foreground">{children}</p>
}

export function ProductAdminForm({ product, onCancel, onSaved }: Readonly<ProductAdminFormProps>) {
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [bulkColors, setBulkColors] = useState("")
  const [bulkSizes, setBulkSizes] = useState("")
  const [bulkStock, setBulkStock] = useState(0)
  const [bulkPrice, setBulkPrice] = useState("")
  const [bulkSkuBase, setBulkSkuBase] = useState("")
  const [imageUrls, setImageUrls] = useState<string[]>(() => emptyImageList(product))
  const [variants, setVariants] = useState<VariantDraft[]>(
    product?.variants.length ? product.variants.map(variantToDraft) : [emptyVariantDraft()],
  )
  const groupedVariants = useMemo(() => groupVariantDrafts(variants), [variants])
  const validImageUrls = useMemo(() => imageUrls.map((url) => url.trim()).filter(Boolean), [imageUrls])
  const stockTotal = useMemo(() => totalDraftStock(variants), [variants])
  const isEditing = Boolean(product)
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

  function addVariantForColor(color: string) {
    setVariants((currentVariants) => [
      ...currentVariants,
      { ...emptyVariantDraft(), label: "", color: color === "Sin color" ? "" : color },
    ])
  }

  function updateVariantGroupColor(indices: number[], color: string) {
    const indexSet = new Set(indices)
    setVariants((currentVariants) =>
      currentVariants.map((variant, variantIndex) =>
        indexSet.has(variantIndex) ? { ...variant, color } : variant,
      ),
    )
  }

  function removeVariant(index: number) {
    setVariants((currentVariants) =>
      currentVariants.length > 1
        ? currentVariants.filter((_, variantIndex) => variantIndex !== index)
        : currentVariants,
    )
  }

  function updateImageUrl(index: number, value: string) {
    setImageUrls((currentImages) =>
      currentImages.map((currentImage, imageIndex) => (imageIndex === index ? value : currentImage)),
    )
  }

  function addImageUrl(value = "") {
    setImageUrls((currentImages) => [...currentImages, value])
  }

  function removeImageUrl(index: number) {
    setImageUrls((currentImages) =>
      currentImages.length > 1
        ? currentImages.filter((_, imageIndex) => imageIndex !== index)
        : [""],
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
      setError("Agregá al menos un color y un talle para generar variantes.")
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

  function validateProductDraft({
    compareAtPrice,
    name,
    normalizedVariants,
    price,
    status,
  }: {
    compareAtPrice: number
    name: string
    normalizedVariants: ProductPayload["variants"]
    price: number
    status: ProductPayload["status"]
  }) {
    if (name.trim().length < 3) {
      return "El nombre necesita al menos 3 caracteres."
    }
    if (!price || price <= 0) {
      return "Cargá un precio mayor a cero."
    }
    if (compareAtPrice > 0 && compareAtPrice <= price) {
      return "El precio anterior debe ser mayor al precio actual para mostrarse como oferta."
    }
    if (status === "published" && validImageUrls.length === 0) {
      return "Para publicar, cargá al menos una imagen del producto."
    }
    if (status === "published" && normalizedVariants.every((variant) => variant.stock_quantity <= 0)) {
      return "Para publicar, cargá stock disponible en al menos una variante."
    }

    const variantKeys = new Set<string>()
    for (const variant of normalizedVariants) {
      const key = `${String(variant.attributes.color ?? "").toLowerCase()}|${String(variant.attributes.talle ?? "").toLowerCase()}`
      if (variantKeys.has(key)) {
        return "Hay variantes repetidas con el mismo color y talle. Unificá el stock o quitá duplicados."
      }
      variantKeys.add(key)
    }

    return null
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    setError(null)

    const form = new FormData(event.currentTarget)
    const name = String(form.get("name") ?? "")
    const category = String(form.get("category") ?? "")
    const audience = String(form.get("audience") ?? "unisex")
    const price = Number(form.get("price") ?? 0)
    const compareAtPrice = Number(form.get("compareAtPrice") ?? 0)
    const slug = slugify(String(form.get("slug") ?? "") || name)
    const status = String(form.get("status") ?? "published") as ProductPayload["status"]
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

    const validationError = validateProductDraft({
      compareAtPrice,
      name,
      normalizedVariants,
      price,
      status,
    })
    if (validationError) {
      setError(validationError)
      void showError("Revisá el producto", validationError)
      return
    }

    setIsSubmitting(true)

    try {
      const payload: ProductPayload = {
        name,
        slug,
        description: String(form.get("description") ?? ""),
        brand: String(form.get("brand") ?? "FreeStyle"),
        category_slug: slugify(category),
        status,
        base_price: price,
        compare_at_price: compareAtPrice > 0 ? compareAtPrice : undefined,
        currency: "ARS",
        attributes: { linea: audience, rubro: "generico" },
        images: validImageUrls.map((url, index) => ({
          url,
          alt_text: index === 0 ? name : `${name} ${index + 1}`,
          provider: url.includes("cloudinary") ? "cloudinary" : "url",
          sort_order: index,
        })),
        variants: normalizedVariants.length > 0
          ? normalizedVariants
          : [{ label: "Único", stock_quantity: 0, attributes: { talle: "Único" }, sort_order: 0 }],
      }
      const savedProduct = product
        ? await updateAdminProduct(product.id, payload)
        : await createAdminProduct(payload)
      const successMessage = product
        ? "Producto actualizado."
        : "Producto guardado. Ya puede aparecer en la tienda."
      setMessage(successMessage)
      void showSuccess(
        product ? "Producto actualizado" : "Producto creado",
        product
          ? "Los cambios quedaron guardados correctamente."
          : "Ya podés verlo en el panel y publicarlo en la tienda.",
      )
      onSaved?.(savedProduct)
      if (!product) {
        event.currentTarget.reset()
        setVariants([emptyVariantDraft()])
        setImageUrls([""])
      }
    } catch (caught) {
      const errorMessage = caught instanceof Error ? caught.message : "No pudimos guardar los cambios"
      setError(errorMessage)
      void showError("No pudimos guardar el producto", errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function uploadProductImage(file: File | undefined) {
    if (!file) return
    setMessage(null)
    setError(null)
    setIsUploadingImage(true)

    try {
      const uploadedImage = await uploadAdminProductImage(file)
      setImageUrls((currentImages) => {
        const emptyIndex = currentImages.findIndex((url) => !url.trim())
        if (emptyIndex === -1) {
          return [...currentImages, uploadedImage.url]
        }
        return currentImages.map((url, index) => (index === emptyIndex ? uploadedImage.url : url))
      })
      setMessage("Imagen subida. Revisá la vista previa y guardá el producto.")
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos subir la imagen")
    } finally {
      setIsUploadingImage(false)
    }
  }

  return (
    <form className="space-y-4 rounded-[2rem] border bg-card p-5 shadow-sm md:p-6" onSubmit={handleSubmit}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge className="mb-3 w-fit">{isEditing ? "Edición" : "Carga guiada"}</Badge>
          <h3 className="text-2xl font-black">{isEditing ? "Editar producto" : "Nuevo producto"}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Completá la información como la verá el cliente. Si vas a publicar, el producto necesita
            precio, imagen y al menos una variante con stock.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-2xl border bg-secondary/40 p-3">
            <p className="text-xl font-black">{validImageUrls.length}</p>
            <p className="text-muted-foreground">fotos</p>
          </div>
          <div className="rounded-2xl border bg-secondary/40 p-3">
            <p className="text-xl font-black">{variants.length}</p>
            <p className="text-muted-foreground">variantes</p>
          </div>
          <div className="rounded-2xl border bg-secondary/40 p-3">
            <p className="text-xl font-black">{stockTotal}</p>
            <p className="text-muted-foreground">stock</p>
          </div>
        </div>
      </div>

      <SectionCard
        icon={ShirtIcon}
        title="1. Datos visibles"
        description="Información básica para que el cliente entienda qué está comprando."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium">Nombre</span>
            <input
              className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary"
              defaultValue={product?.name ?? ""}
              name="name"
              placeholder="Ej: Nike SB Chron 2"
              required
            />
            <FieldHint>Debe ser claro y buscable. Marca + modelo suele funcionar mejor.</FieldHint>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Enlace</span>
            <input
              className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary"
              defaultValue={product?.slug ?? ""}
              name="slug"
              placeholder="se genera desde el nombre"
            />
            <FieldHint>Si lo dejás vacío, se genera automáticamente desde el nombre.</FieldHint>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Categoría</span>
            <select
              className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary"
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
            <span className="text-sm font-medium">Línea</span>
            <select
              className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary"
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
            <span className="text-sm font-medium">Marca</span>
            <input
              className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary"
              defaultValue={product?.brand ?? ""}
              name="brand"
              placeholder="FreeStyle"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Estado</span>
            <select
              className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary"
              defaultValue={product?.status ?? "published"}
              name="status"
              required
            >
              <option value="published">Publicado</option>
              <option value="draft">Borrador</option>
              <option value="paused">Pausado</option>
              <option value="archived">Archivado</option>
            </select>
            <FieldHint>Usá borrador si todavía faltan fotos, precio o stock real.</FieldHint>
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium">Descripción</span>
            <textarea
              className="min-h-24 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              defaultValue={product?.description ?? ""}
              name="description"
              placeholder="Material, uso recomendado, comodidad, estilo, detalles importantes..."
            />
          </label>
        </div>
      </SectionCard>

      <SectionCard
        icon={SparklesIcon}
        title="2. Precio y publicación"
        description="Definí precio actual, precio anterior si hay oferta y estado de venta."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium">Precio actual</span>
            <input
              className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary"
              defaultValue={product?.base_price ? Number(product.base_price) : ""}
              min="0"
              name="price"
              required
              type="number"
            />
            <FieldHint>Es el precio que verá el cliente como valor final del producto.</FieldHint>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Precio anterior/oferta</span>
            <input
              className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary"
              defaultValue={product?.compare_at_price ? Number(product.compare_at_price) : ""}
              min="0"
              name="compareAtPrice"
              type="number"
            />
            <FieldHint>Solo completalo si es mayor al precio actual. Así aparece como oferta.</FieldHint>
          </label>
        </div>
      </SectionCard>

      <SectionCard
        icon={ImageIcon}
        title="3. Imágenes"
        description="La primera imagen será la portada del catálogo. Conviene usar fotos claras y centradas."
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => addImageUrl()}>
              Agregar URL
            </Button>
            <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-transparent bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground transition hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]">
              {isUploadingImage ? "Subiendo..." : "Subir imagen"}
              <input
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                disabled={isUploadingImage}
                onChange={(event) => void uploadProductImage(event.target.files?.[0])}
                type="file"
              />
            </label>
          </div>

          <div className="grid gap-3">
            {imageUrls.map((imageUrl, index) => (
              <div
                key={`${index}-${imageUrl}`}
                className="grid gap-3 rounded-2xl border bg-card/70 p-3 md:grid-cols-[7rem_1fr_auto]"
              >
                <div className="aspect-square overflow-hidden rounded-xl border bg-white">
                  <ProductImage
                    alt={`Vista previa ${index + 1}`}
                    className="size-full object-contain p-2"
                    src={imageUrl}
                  />
                </div>
                <label className="space-y-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {index === 0 ? "Imagen principal" : `Imagen ${index + 1}`}
                  </span>
                  <input
                    className="h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary"
                    onChange={(event) => updateImageUrl(index, event.target.value)}
                    placeholder="https://res.cloudinary.com/..."
                    type="url"
                    value={imageUrl}
                  />
                  {index === 0 ? <FieldHint>Esta foto se usa en cards, buscador y portada del producto.</FieldHint> : null}
                </label>
                <Button
                  className="self-end"
                  disabled={imageUrls.length === 1}
                  onClick={() => removeImageUrl(index)}
                  type="button"
                  variant="ghost"
                >
                  Quitar
                </Button>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard
        icon={Layers3Icon}
        title="4. Variantes, talles y stock"
        description="Cada combinación de color y talle tiene su propio stock. El cliente elegirá color y luego talle."
      >
        <div className="space-y-4">
          <div className="rounded-2xl border bg-card/70 p-4">
            <div>
              <h5 className="font-semibold">Generar variantes rápido</h5>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Cargá colores y talles una sola vez. El sistema crea todas las combinaciones para
                que después ajustes stock, SKU o precio.
              </p>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground">Colores</span>
                <textarea
                  className="min-h-20 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  value={bulkColors}
                  onChange={(event) => setBulkColors(event.target.value)}
                  placeholder="Verde, Negro"
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground">Talles o números</span>
                <textarea
                  className="min-h-20 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  value={bulkSizes}
                  onChange={(event) => setBulkSizes(event.target.value)}
                  placeholder="39, 40, 41"
                />
              </label>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-[0.8fr_0.8fr_1fr_auto]">
              <label className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground">Stock por combinación</span>
                <input
                  className="h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary"
                  min="0"
                  type="number"
                  value={bulkStock}
                  onChange={(event) => setBulkStock(Number(event.target.value))}
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground">Precio propio</span>
                <input
                  className="h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary"
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
                  className="h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary"
                  value={bulkSkuBase}
                  onChange={(event) => setBulkSkuBase(event.target.value)}
                  placeholder="NIKE-SB"
                />
              </label>
              <Button className="self-end" type="button" variant="secondary" onClick={generateVariantCombinations}>
                Generar
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h5 className="font-semibold">Revisión por color</h5>
              <p className="text-sm text-muted-foreground">Editá cada talle antes de guardar.</p>
            </div>
            <Button type="button" variant="secondary" onClick={addVariant}>
              Agregar variante manual
            </Button>
          </div>

          <div className="grid gap-3">
            {groupedVariants.map((group) => (
              <div key={group.key} className="rounded-2xl border bg-card/70 p-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <label className="space-y-2">
                    <span className="text-xs font-medium text-muted-foreground">Color del grupo</span>
                    <input
                      className="h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary"
                      value={group.color === "Sin color" ? "" : group.color}
                      onChange={(event) =>
                        updateVariantGroupColor(
                          group.variants.map((entry) => entry.index),
                          event.target.value,
                        )
                      }
                      placeholder="Ej: Verde"
                    />
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={group.totalStock <= 0 ? "destructive" : "secondary"}>
                      Stock {group.totalStock}
                    </Badge>
                    <Button type="button" variant="ghost" onClick={() => addVariantForColor(group.color)}>
                      Agregar talle
                    </Button>
                  </div>
                </div>

                <div className="mt-3 grid gap-3">
                  {group.variants.map(({ index, variant }) => (
                    <div
                      key={`${group.key}-${index}`}
                      className="grid gap-3 rounded-2xl border bg-background/60 p-3 md:grid-cols-[1fr_0.7fr_1fr_1fr_auto]"
                    >
                      <label className="space-y-1">
                        <span className="text-xs font-medium text-muted-foreground">Talle / número</span>
                        <input
                          className="h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary"
                          onChange={(event) => updateVariant(index, { label: event.target.value })}
                          placeholder="39, M, Único"
                          value={variant.label}
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-xs font-medium text-muted-foreground">Stock</span>
                        <input
                          className="h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary"
                          min="0"
                          onChange={(event) => updateVariant(index, { stock: Number(event.target.value) })}
                          type="number"
                          value={variant.stock}
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-xs font-medium text-muted-foreground">SKU</span>
                        <input
                          className="h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary"
                          onChange={(event) => updateVariant(index, { sku: event.target.value })}
                          placeholder="opcional"
                          value={variant.sku}
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-xs font-medium text-muted-foreground">Precio propio</span>
                        <input
                          className="h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary"
                          min="0"
                          onChange={(event) => updateVariant(index, { price: event.target.value })}
                          placeholder="opcional"
                          type="number"
                          value={variant.price}
                        />
                      </label>
                      <Button
                        className="self-end"
                        disabled={variants.length === 1}
                        onClick={() => removeVariant(index)}
                        type="button"
                        variant="ghost"
                      >
                        Quitar
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard
        icon={CheckCircle2Icon}
        title="5. Revisión antes de guardar"
        description="El sistema revisa errores comunes para evitar publicar productos incompletos."
      >
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border bg-card/70 p-4">
            <p className="font-bold">Fotos</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {validImageUrls.length > 0 ? `${validImageUrls.length} imagen(es) cargada(s).` : "Sin imágenes."}
            </p>
          </div>
          <div className="rounded-2xl border bg-card/70 p-4">
            <p className="font-bold">Variantes</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {variants.length} variante{variants.length === 1 ? "" : "s"} / stock total {stockTotal}.
            </p>
          </div>
          <div className="rounded-2xl border bg-card/70 p-4">
            <p className="font-bold">Publicación</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Publicado requiere precio, imagen y stock disponible.
            </p>
          </div>
        </div>
      </SectionCard>

      {error ? (
        <p className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {message ? (
        <p className="rounded-2xl border border-primary/40 bg-primary/10 p-4 text-sm text-primary">
          {message}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button className="flex-1" disabled={isSubmitting} type="submit">
          <PackagePlusIcon data-icon="inline-start" />
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
