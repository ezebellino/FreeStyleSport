"use client"

import { MegaphoneIcon, RefreshCwIcon, SaveIcon } from "lucide-react"
import { type FormEvent, useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/ui/loading-state"
import { showError, showSuccess } from "@/lib/alerts"
import {
  defaultPromotionSettings,
  getAdminPromotionSettings,
  promotionRatePercent,
  updateAdminPromotionSettings,
  type PromotionSettings,
} from "@/lib/promotion-settings"

function asNumber(value: string | number | null | undefined) {
  return Number(value ?? 0)
}

function rateToPercent(value: string | number | null | undefined) {
  return String(promotionRatePercent(value))
}

function percentToRate(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.max(0, parsed) / 100 : 0
}

export function PromotionSettingsPanel() {
  const [settings, setSettings] = useState<PromotionSettings>(defaultPromotionSettings)
  const [welcomePercent, setWelcomePercent] = useState(rateToPercent(defaultPromotionSettings.welcome_discount_rate))
  const [giftPercent, setGiftPercent] = useState(rateToPercent(defaultPromotionSettings.gift_bonus_rate))
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadSettings() {
    setError(null)
    setIsLoading(true)
    try {
      const loadedSettings = await getAdminPromotionSettings()
      setSettings(loadedSettings)
      setWelcomePercent(rateToPercent(loadedSettings.welcome_discount_rate))
      setGiftPercent(rateToPercent(loadedSettings.gift_bonus_rate))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos cargar las promociones")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadSettings()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [])

  function updateField(field: keyof PromotionSettings, value: string | number | boolean | null) {
    setSettings((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSaving(true)

    try {
      const saved = await updateAdminPromotionSettings({
        hero_badge: settings.hero_badge?.trim() || null,
        hero_title: settings.hero_title?.trim() || null,
        hero_description: settings.hero_description?.trim() || null,
        welcome_coupon_enabled: settings.welcome_coupon_enabled,
        welcome_coupon_code: settings.welcome_coupon_code.trim() || "BIENVENIDA10",
        welcome_discount_rate: percentToRate(welcomePercent),
        free_shipping_enabled: settings.free_shipping_enabled,
        free_shipping_threshold: asNumber(settings.free_shipping_threshold),
        gift_bonus_enabled: settings.gift_bonus_enabled,
        gift_bonus_threshold: asNumber(settings.gift_bonus_threshold),
        gift_bonus_code: settings.gift_bonus_code.trim() || "PROXIMA10",
        gift_bonus_rate: percentToRate(giftPercent),
        payment_promotions: settings.payment_promotions?.trim() || null,
        checkout_message: settings.checkout_message?.trim() || null,
        is_active: settings.is_active,
      })
      setSettings(saved)
      setWelcomePercent(rateToPercent(saved.welcome_discount_rate))
      setGiftPercent(rateToPercent(saved.gift_bonus_rate))
      void showSuccess("Promociones guardadas", "Los cambios ya impactan en la tienda y el checkout.")
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "No pudimos guardar las promociones"
      setError(message)
      void showError("No pudimos guardar las promociones", message)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-3xl border bg-card p-6">
        <LoadingState label="Cargando promociones..." />
      </section>
    )
  }

  return (
    <section className="rounded-3xl border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-black">Promociones comerciales</h2>
            <Badge variant={settings.is_active ? "default" : "secondary"}>
              {settings.is_active ? "Activas" : "Pausadas"}
            </Badge>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Controlá los beneficios que ve el cliente y las reglas que se aplican al crear pedidos.
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={() => void loadSettings()}>
          <RefreshCwIcon data-icon="inline-start" />
          Recargar
        </Button>
      </div>

      {error ? (
        <p className="mt-4 rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <form className="mt-5 space-y-5" onSubmit={handleSubmit}>
        <label className="flex items-center gap-3 rounded-2xl border bg-background/45 p-4">
          <input
            type="checkbox"
            checked={settings.is_active}
            onChange={(event) => updateField("is_active", event.target.checked)}
          />
          <span className="text-sm font-semibold">Promociones activas en tienda y checkout</span>
        </label>

        <div className="grid gap-4 lg:grid-cols-3">
          <label className="space-y-2">
            <span className="text-sm font-semibold">Etiqueta del banner</span>
            <input
              className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              value={settings.hero_badge ?? ""}
              onChange={(event) => updateField("hero_badge", event.target.value)}
            />
          </label>
          <label className="space-y-2 lg:col-span-2">
            <span className="text-sm font-semibold">Título comercial</span>
            <input
              className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              value={settings.hero_title ?? ""}
              onChange={(event) => updateField("hero_title", event.target.value)}
            />
          </label>
          <label className="space-y-2 lg:col-span-3">
            <span className="text-sm font-semibold">Descripción del banner</span>
            <textarea
              className="min-h-24 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              value={settings.hero_description ?? ""}
              onChange={(event) => updateField("hero_description", event.target.value)}
            />
          </label>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 rounded-2xl border bg-background/45 p-4">
            <div className="flex items-center gap-2">
              <MegaphoneIcon className="size-4 text-primary" />
              <p className="font-black">Cupón de bienvenida</p>
            </div>
            <label className="flex items-center gap-3 text-sm font-semibold">
              <input
                type="checkbox"
                checked={settings.welcome_coupon_enabled}
                onChange={(event) => updateField("welcome_coupon_enabled", event.target.checked)}
              />
              Activo
            </label>
            <input
              className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              value={settings.welcome_coupon_code}
              onChange={(event) => updateField("welcome_coupon_code", event.target.value)}
            />
            <label className="space-y-2">
              <span className="text-sm font-semibold">Descuento (%)</span>
              <input
                className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                min={0}
                type="number"
                value={welcomePercent}
                onChange={(event) => setWelcomePercent(event.target.value)}
              />
            </label>
          </div>

          <div className="space-y-4 rounded-2xl border bg-background/45 p-4">
            <p className="font-black">Envío gratis</p>
            <label className="flex items-center gap-3 text-sm font-semibold">
              <input
                type="checkbox"
                checked={settings.free_shipping_enabled}
                onChange={(event) => updateField("free_shipping_enabled", event.target.checked)}
              />
              Activo
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold">Monto mínimo</span>
              <input
                className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                min={0}
                type="number"
                value={settings.free_shipping_threshold}
                onChange={(event) => updateField("free_shipping_threshold", event.target.value)}
              />
            </label>
          </div>

          <div className="space-y-4 rounded-2xl border bg-background/45 p-4">
            <p className="font-black">Bono próxima compra</p>
            <label className="flex items-center gap-3 text-sm font-semibold">
              <input
                type="checkbox"
                checked={settings.gift_bonus_enabled}
                onChange={(event) => updateField("gift_bonus_enabled", event.target.checked)}
              />
              Activo
            </label>
            <input
              className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              value={settings.gift_bonus_code}
              onChange={(event) => updateField("gift_bonus_code", event.target.value)}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold">Mínimo</span>
                <input
                  className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  min={0}
                  type="number"
                  value={settings.gift_bonus_threshold}
                  onChange={(event) => updateField("gift_bonus_threshold", event.target.value)}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold">Bono (%)</span>
                <input
                  className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  min={0}
                  type="number"
                  value={giftPercent}
                  onChange={(event) => setGiftPercent(event.target.value)}
                />
              </label>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold">Promos por medio de pago</span>
            <textarea
              className="min-h-28 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              value={settings.payment_promotions ?? ""}
              onChange={(event) => updateField("payment_promotions", event.target.value)}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold">Mensaje para checkout</span>
            <textarea
              className="min-h-28 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              value={settings.checkout_message ?? ""}
              onChange={(event) => updateField("checkout_message", event.target.value)}
            />
          </label>
        </div>

        <Button type="submit" disabled={isSaving}>
          <SaveIcon data-icon="inline-start" />
          {isSaving ? "Guardando..." : "Guardar promociones"}
        </Button>
      </form>
    </section>
  )
}
