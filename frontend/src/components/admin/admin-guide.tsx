"use client"

import { driver, type Driver, type DriveStep } from "driver.js"
import "driver.js/dist/driver.css"
import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"

const preference = "freestyle.admin.guide.enabled"

function step(element: string, title: string, description: string): DriveStep {
  return { element, popover: { title, description } }
}

function currentSteps(section: string): DriveStep[] {
  if (document.querySelector("#admin-product-editor")) {
    const form = "#admin-product-editor "
    return [
      step(form + '[name="name"]', "Identificá el producto", "Ejemplo: Remera deportiva. Cargá la marca, la categoría y para quién es."),
      step(form + '[name="price"]', "Indicá el precio", "Si todos los talles cuestan $25.000, ingresá 25000 una sola vez."),
      step("#product-image-actions", "Elegí la portada", "Subí una foto de la remera. La primera imagen se verá en el catálogo."),
      step("#product-bulk-variants", "Generá varios talles juntos", "Abrí este bloque. Escribí Verde en colores, S, M, L en talles y 5 en stock. Al pulsar Generar tendrás tres variantes y 15 unidades en total."),
      step(form + '[type="submit"]', "Revisá y guardá", "Podés ajustar el stock de cada talle antes de guardar. Para seguir otro día, elegí Borrador en Estado y guardá el producto."),
    ]
  }

  const navigation = step("#admin-sections", "Elegí una tarea", "En Productos cargás artículos. En Pedidos revisás las reservas y en Tesorería consultás las ventas.")
  if (section === "productos") {
    return [navigation, step("#admin-new-product", "Cargá tu primer artículo", "Al terminar la guía, elegí Nuevo producto. Dentro del formulario, pulsá Ver guía para seguir el ejemplo de una remera con tres talles.")]
  }
  const examples: Record<string, string> = {
    pedidos: "Por ejemplo, buscá una reserva por su número. Para una transferencia, revisá la acreditación antes de confirmar el pago.",
    resumen: "Revisá los pedidos pendientes y los productos con poco stock para decidir qué atender primero.",
    promociones: "Por ejemplo, revisá el porcentaje del cupón de bienvenida antes de guardar una promoción.",
    pagos: "Por ejemplo, cargá el QR de Banco Provincia en su opción y el de Banco Nación en la suya. Revisá los nombres antes de guardar.",
  }
  return [navigation, step('#admin-sections [aria-current="page"]', "En esta sección", examples[section])]
}

export function AdminGuide({ section }: { section: string }) {
  const [enabled, setEnabled] = useState(false)
  const tour = useRef<Driver | null>(null)
  const trigger = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try { setEnabled(localStorage.getItem(preference) === "1") } catch { /* Storage is optional. */ }
    })
    return () => {
      cancelAnimationFrame(frame)
      tour.current?.destroy()
    }
  }, [])

  function start() {
    tour.current?.destroy()
    const bulk = document.querySelector<HTMLDetailsElement>("#product-bulk-variants")
    const wasOpen = bulk?.open ?? false
    tour.current = driver({
      steps: currentSteps(section),
      showProgress: true,
      progressText: "{{current}} de {{total}}",
      nextBtnText: "Siguiente",
      prevBtnText: "Anterior",
      doneBtnText: "Terminar",
      closeBtnLabel: "Cerrar guía",
      animate: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      disableActiveInteraction: true,
      onHighlightStarted: (element) => {
        if (bulk) bulk.open = element === bulk || wasOpen
      },
      onDestroyed: () => {
        if (bulk) bulk.open = wasOpen
        trigger.current?.focus({ preventScroll: true })
      },
    })
    tour.current.drive()
  }

  function toggle() {
    const next = !enabled
    setEnabled(next)
    try { localStorage.setItem(preference, next ? "1" : "0") } catch { /* Keep the choice for this visit. */ }
    if (next) start()
    else tour.current?.destroy()
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button ref={trigger} type="button" variant="secondary" aria-pressed={enabled} onClick={toggle}>
        {enabled ? "Desactivar guía" : "Activar guía"}
      </Button>
      {enabled && <Button type="button" variant="outline" onClick={start}>Ver guía</Button>}
    </div>
  )
}
