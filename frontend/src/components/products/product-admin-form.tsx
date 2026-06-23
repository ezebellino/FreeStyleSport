"use client"

import { FormEvent, useState } from "react"

import { Button } from "@/components/ui/button"
import { createAdminProduct, productAudiences, productCategories } from "@/lib/products"

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export function ProductAdminForm() {
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    const stock = Number(form.get("stock") ?? 0)
    const size = String(form.get("size") ?? "Unico")

    try {
      await createAdminProduct({
        name,
        slug: slugify(name),
        description: String(form.get("description") ?? ""),
        brand: String(form.get("brand") ?? "FreeStyle"),
        category_slug: slugify(category),
        status: "published",
        base_price: price,
        currency: "ARS",
        attributes: { linea: audience, rubro: "generico" },
        images: imageUrl
          ? [{ url: imageUrl, alt_text: name, provider: imageUrl.includes("cloudinary") ? "cloudinary" : "url" }]
          : [],
        variants: [{ label: size, stock_quantity: stock, attributes: { talle: size } }],
      })
      setMessage("Producto guardado. Ya puede aparecer en la tienda.")
      event.currentTarget.reset()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos guardar el producto")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="grid gap-4 rounded-3xl border bg-card p-6 md:grid-cols-2" onSubmit={handleSubmit}>
      <label className="space-y-2">
        <span className="text-sm font-medium">Nombre</span>
        <input className="h-11 w-full rounded-lg border bg-background px-3 text-sm" name="name" required />
      </label>
      <label className="space-y-2">
        <span className="text-sm font-medium">Categoria</span>
        <select className="h-11 w-full rounded-lg border bg-background px-3 text-sm" name="category" required>
          {productCategories.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-2">
        <span className="text-sm font-medium">Linea</span>
        <select className="h-11 w-full rounded-lg border bg-background px-3 text-sm" name="audience" required>
          {productAudiences.map((audience) => (
            <option key={audience.value} value={audience.value}>
              {audience.label}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-2">
        <span className="text-sm font-medium">Precio</span>
        <input className="h-11 w-full rounded-lg border bg-background px-3 text-sm" min="0" name="price" required type="number" />
      </label>
      <label className="space-y-2">
        <span className="text-sm font-medium">Stock</span>
        <input className="h-11 w-full rounded-lg border bg-background px-3 text-sm" min="0" name="stock" required type="number" />
      </label>
      <label className="space-y-2">
        <span className="text-sm font-medium">Talle o variante</span>
        <input className="h-11 w-full rounded-lg border bg-background px-3 text-sm" name="size" placeholder="M, 40, 12-18 meses" />
      </label>
      <label className="space-y-2">
        <span className="text-sm font-medium">Marca</span>
        <input className="h-11 w-full rounded-lg border bg-background px-3 text-sm" name="brand" placeholder="FreeStyle" />
      </label>
      <label className="space-y-2 md:col-span-2">
        <span className="text-sm font-medium">Imagen</span>
        <input
          className="h-11 w-full rounded-lg border bg-background px-3 text-sm"
          name="imageUrl"
          placeholder="https://res.cloudinary.com/..."
          type="url"
        />
      </label>
      <label className="space-y-2 md:col-span-2">
        <span className="text-sm font-medium">Descripcion</span>
        <textarea className="min-h-24 w-full rounded-lg border bg-background px-3 py-2 text-sm" name="description" />
      </label>
      {error ? <p className="text-sm text-destructive md:col-span-2">{error}</p> : null}
      {message ? <p className="text-sm text-primary md:col-span-2">{message}</p> : null}
      <Button className="md:col-span-2" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Guardando..." : "Guardar producto"}
      </Button>
    </form>
  )
}
