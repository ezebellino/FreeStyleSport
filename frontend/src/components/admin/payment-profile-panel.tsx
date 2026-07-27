"use client"

import { CreditCardIcon, QrCodeIcon, RefreshCwIcon, SaveIcon, UploadIcon } from "lucide-react"
import { type FormEvent, useEffect, useState } from "react"

import { ProductImage } from "@/components/products/product-image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/ui/loading-state"
import { showError, showSuccess } from "@/lib/alerts"
import {
  getAdminPaymentProfile,
  updateAdminPaymentProfile,
  type PaymentOption,
  type PaymentProfile,
} from "@/lib/payment-profile"
import { uploadAdminProductImage } from "@/lib/products"

const emptyProfile: PaymentProfile = {
  alias: "",
  account_holder: "",
  account_identifier: "",
  provider: "",
  qr_image_url: "",
  payment_options: [
    {
      code: "banco-provincia",
      label: "Banco Provincia",
      provider: "Cuenta DNI / Banco Provincia",
      qr_image_url: "",
      instructions: "ElegÃ­ esta opciÃ³n si vas a pagar con Banco Provincia o Cuenta DNI.",
      is_active: true,
    },
    {
      code: "banco-nacion",
      label: "Banco NaciÃ³n",
      provider: "Banco NaciÃ³n",
      qr_image_url: "",
      instructions: "ElegÃ­ esta opciÃ³n si vas a pagar con Banco NaciÃ³n.",
      is_active: true,
    },
  ],
  instructions: "",
  is_active: true,
}

function emptyPaymentOption(index: number): PaymentOption {
  return {
    code: `opcion-${index + 1}`,
    label: "",
    provider: "",
    qr_image_url: "",
    instructions: "",
    is_active: true,
  }
}

export function PaymentProfilePanel() {
  const [profile, setProfile] = useState<PaymentProfile>(emptyProfile)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingQr, setIsUploadingQr] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadProfile() {
    setError(null)
    setIsLoading(true)
    try {
      const loadedProfile = await getAdminPaymentProfile()
      setProfile({
        ...loadedProfile,
        payment_options: loadedProfile.payment_options?.length
          ? loadedProfile.payment_options
          : emptyProfile.payment_options,
      })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos cargar los datos de pago")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadProfile()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [])

  function updateField(field: keyof PaymentProfile, value: string | boolean) {
    setProfile((current) => ({ ...current, [field]: value }))
  }

  function updatePaymentOption(index: number, patch: Partial<PaymentOption>) {
    setProfile((current) => ({
      ...current,
      payment_options: (current.payment_options ?? []).map((option, optionIndex) =>
        optionIndex === index ? { ...option, ...patch } : option,
      ),
    }))
  }

  function addPaymentOption() {
    setProfile((current) => ({
      ...current,
      payment_options: [
        ...(current.payment_options ?? []),
        emptyPaymentOption(current.payment_options?.length ?? 0),
      ],
    }))
  }

  function removePaymentOption(index: number) {
    setProfile((current) => ({
      ...current,
      payment_options: (current.payment_options ?? []).filter(
        (_, optionIndex) => optionIndex !== index,
      ),
    }))
  }

  async function handleQrUpload(file: File | null) {
    if (!file) {
      return
    }

    if (!file.type.startsWith("image/")) {
      const message = "El QR tiene que ser una imagen."
      setError(message)
      void showError("No pudimos subir el QR", message)
      return
    }

    setError(null)
    setIsUploadingQr(true)
    try {
      const uploaded = await uploadAdminProductImage(file)
      updateField("qr_image_url", uploaded.url)
      void showSuccess("QR subido", "La URL del QR quedó cargada en los datos de pago.")
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "No pudimos subir el QR"
      setError(message)
      void showError("No pudimos subir el QR", message)
    } finally {
      setIsUploadingQr(false)
    }
  }

  async function handlePaymentOptionQrUpload(index: number, file: File | null) {
    if (!file) {
      return
    }

    if (!file.type.startsWith("image/")) {
      const message = "El QR tiene que ser una imagen."
      setError(message)
      void showError("No pudimos subir el QR", message)
      return
    }

    setError(null)
    setIsUploadingQr(true)
    try {
      const uploaded = await uploadAdminProductImage(file)
      updatePaymentOption(index, { qr_image_url: uploaded.url })
      void showSuccess("QR subido", "La opciÃ³n de pago quedÃ³ lista para guardar.")
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "No pudimos subir el QR"
      setError(message)
      void showError("No pudimos subir el QR", message)
    } finally {
      setIsUploadingQr(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSaving(true)
    try {
      const saved = await updateAdminPaymentProfile({
        alias: profile.alias?.trim() || null,
        account_holder: profile.account_holder?.trim() || null,
        account_identifier: profile.account_identifier?.trim() || null,
        provider: profile.provider?.trim() || null,
        qr_image_url: profile.qr_image_url?.trim() || null,
        payment_options: (profile.payment_options ?? [])
          .map((option) => ({
            code: option.code.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/(^-|-$)/g, ""),
            label: option.label.trim(),
            provider: option.provider?.trim() || null,
            qr_image_url: option.qr_image_url?.trim() || null,
            instructions: option.instructions?.trim() || null,
            is_active: option.is_active,
          }))
          .filter((option) => option.code && option.label),
        instructions: profile.instructions?.trim() || null,
        is_active: profile.is_active,
      })
      setProfile(saved)
      void showSuccess("Datos de pago guardados", "Ya pueden mostrarse durante la compra.")
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "No pudimos guardar los datos de pago"
      setError(message)
      void showError("No pudimos guardar los datos de pago", message)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-3xl border bg-card p-6">
        <LoadingState label="Cargando datos de pago..." />
      </section>
    )
  }

  return (
    <section className="rounded-3xl border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-black">Datos de pago del local</h2>
            <Badge variant={profile.is_active ? "default" : "secondary"}>
              {profile.is_active ? "Visible" : "Oculto"}
            </Badge>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Cargá alias, titular, CVU/CBU, QR e instrucciones para que el cliente pueda pagar sin
            fricción cuando el local confirme la reserva.
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={() => void loadProfile()}>
          <RefreshCwIcon data-icon="inline-start" />
          Recargar
        </Button>
      </div>

      {error ? (
        <p className="mt-4 rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <form className="mt-5 grid gap-5 lg:grid-cols-[1fr_18rem]" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold">Alias</span>
            <input
              className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="freestyle.mp"
              value={profile.alias ?? ""}
              onChange={(event) => updateField("alias", event.target.value)}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold">Titular</span>
            <input
              className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="FreeStyle Dolores"
              value={profile.account_holder ?? ""}
              onChange={(event) => updateField("account_holder", event.target.value)}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold">CBU / CVU</span>
            <input
              className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="00000031000..."
              value={profile.account_identifier ?? ""}
              onChange={(event) => updateField("account_identifier", event.target.value)}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold">Billetera o proveedor</span>
            <input
              className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="Mercado Pago, Cuenta DNI..."
              value={profile.provider ?? ""}
              onChange={(event) => updateField("provider", event.target.value)}
            />
          </label>

          <label className="space-y-2 sm:col-span-2">
            <span className="text-sm font-semibold">URL del QR</span>
            <input
              className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="https://res.cloudinary.com/.../qr-pago.png"
              value={profile.qr_image_url ?? ""}
              onChange={(event) => updateField("qr_image_url", event.target.value)}
            />
          </label>

          <div className="space-y-2 rounded-2xl border bg-background/45 p-4 sm:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Subir QR desde la PC</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Seleccioná una imagen y la subimos a Cloudinary automáticamente.
                </p>
              </div>
              <Button asChild type="button" variant="secondary" disabled={isUploadingQr}>
                <label className="cursor-pointer">
                  <UploadIcon data-icon="inline-start" />
                  {isUploadingQr ? "Subiendo..." : "Elegir imagen"}
                  <input
                    className="sr-only"
                    type="file"
                    accept="image/*"
                    disabled={isUploadingQr}
                    onChange={(event) => {
                      void handleQrUpload(event.target.files?.[0] ?? null)
                      event.target.value = ""
                    }}
                  />
                </label>
              </Button>
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border bg-background/45 p-4 sm:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black">QR por banco o promociÃ³n</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  CargÃ¡ un QR por Banco Provincia, Banco NaciÃ³n u otra opciÃ³n. El cliente elige
                  una y ve el QR correspondiente.
                </p>
              </div>
              <Button type="button" variant="secondary" onClick={addPaymentOption}>
                Agregar opciÃ³n
              </Button>
            </div>

            <div className="grid gap-4">
              {(profile.payment_options ?? []).map((option, index) => (
                <div key={`${option.code}-${index}`} className="rounded-2xl border bg-card p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-black">OpciÃ³n {index + 1}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="flex items-center gap-2 text-xs font-semibold">
                        <input
                          type="checkbox"
                          className="size-4 accent-primary"
                          checked={option.is_active}
                          onChange={(event) =>
                            updatePaymentOption(index, { is_active: event.target.checked })
                          }
                        />
                        Visible
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removePaymentOption(index)}
                      >
                        Quitar
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-xs font-semibold">Nombre visible</span>
                      <input
                        className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                        placeholder="Banco Provincia"
                        value={option.label}
                        onChange={(event) =>
                          updatePaymentOption(index, { label: event.target.value })
                        }
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-semibold">CÃ³digo interno</span>
                      <input
                        className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                        placeholder="banco-provincia"
                        value={option.code}
                        onChange={(event) =>
                          updatePaymentOption(index, { code: event.target.value })
                        }
                      />
                    </label>
                    <label className="space-y-2 sm:col-span-2">
                      <span className="text-xs font-semibold">Proveedor o promo</span>
                      <input
                        className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                        placeholder="Cuenta DNI / Banco Provincia"
                        value={option.provider ?? ""}
                        onChange={(event) =>
                          updatePaymentOption(index, { provider: event.target.value })
                        }
                      />
                    </label>
                    <label className="space-y-2 sm:col-span-2">
                      <span className="text-xs font-semibold">URL del QR de esta opciÃ³n</span>
                      <input
                        className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                        placeholder="https://res.cloudinary.com/.../qr-banco.png"
                        value={option.qr_image_url ?? ""}
                        onChange={(event) =>
                          updatePaymentOption(index, { qr_image_url: event.target.value })
                        }
                      />
                    </label>
                    <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
                      <Button asChild type="button" variant="secondary" disabled={isUploadingQr}>
                        <label className="cursor-pointer">
                          <UploadIcon data-icon="inline-start" />
                          {isUploadingQr ? "Subiendo..." : "Subir QR"}
                          <input
                            className="sr-only"
                            type="file"
                            accept="image/*"
                            disabled={isUploadingQr}
                            onChange={(event) => {
                              void handlePaymentOptionQrUpload(index, event.target.files?.[0] ?? null)
                              event.target.value = ""
                            }}
                          />
                        </label>
                      </Button>
                      {option.qr_image_url ? (
                        <span className="text-xs font-semibold text-primary">QR cargado</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sin QR propio</span>
                      )}
                    </div>
                    <label className="space-y-2 sm:col-span-2">
                      <span className="text-xs font-semibold">InstrucciÃ³n especÃ­fica</span>
                      <textarea
                        className="min-h-20 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                        placeholder="UsÃ¡ esta opciÃ³n si tenÃ©s promo activa con este banco."
                        value={option.instructions ?? ""}
                        onChange={(event) =>
                          updatePaymentOption(index, { instructions: event.target.value })
                        }
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <label className="space-y-2 sm:col-span-2">
            <span className="text-sm font-semibold">Instrucciones para el cliente</span>
            <textarea
              className="min-h-28 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="Transferí el total, enviá el comprobante por WhatsApp y esperá la confirmación del local."
              value={profile.instructions ?? ""}
              onChange={(event) => updateField("instructions", event.target.value)}
            />
          </label>

          <label className="flex items-center gap-3 rounded-2xl border bg-background/45 p-4 sm:col-span-2">
            <input
              type="checkbox"
              className="size-4 accent-primary"
              checked={profile.is_active}
              onChange={(event) => updateField("is_active", event.target.checked)}
            />
            <span>
              <span className="block text-sm font-semibold">Mostrar estos datos al cliente</span>
              <span className="text-xs text-muted-foreground">
                Si lo desactivás, el checkout no muestra alias ni QR.
              </span>
            </span>
          </label>
        </div>

        <aside className="space-y-3 rounded-3xl border bg-background/45 p-4">
          <div className="flex items-center gap-2">
            <CreditCardIcon className="size-5 text-primary" aria-hidden="true" />
            <p className="font-black">Vista previa</p>
          </div>
          <div className="space-y-2 rounded-2xl border bg-card p-4 text-sm">
            <p className="font-bold">{profile.provider || "Billetera / banco"}</p>
            <p className="text-muted-foreground">Alias: {profile.alias || "Sin alias"}</p>
            <p className="text-muted-foreground">Titular: {profile.account_holder || "Sin titular"}</p>
            <p className="text-muted-foreground">
              CBU/CVU: {profile.account_identifier || "No cargado"}
            </p>
          </div>
          <div className="aspect-square overflow-hidden rounded-2xl border bg-white">
            {profile.qr_image_url ? (
              <ProductImage
                alt="QR de pago del local"
                className="size-full object-contain p-3"
                src={profile.qr_image_url}
              />
            ) : (
              <div className="flex size-full flex-col items-center justify-center gap-2 text-slate-500">
                <QrCodeIcon className="size-10" aria-hidden="true" />
                <p className="text-sm font-bold">Sin QR cargado</p>
              </div>
            )}
          </div>
          <p className="text-xs leading-5 text-muted-foreground">
            {profile.instructions ||
              "Acá se verá la instrucción que recibirá el cliente para completar el pago."}
          </p>
          <Button className="w-full" type="submit" disabled={isSaving || isUploadingQr}>
            <SaveIcon data-icon="inline-start" />
            {isSaving ? "Guardando..." : "Guardar datos de pago"}
          </Button>
        </aside>
      </form>
    </section>
  )
}
