import {
  CreditCardIcon,
  HelpCircleIcon,
  MapPinIcon,
  MessageCircleIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  TruckIcon,
} from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const serviceCards = [
  {
    title: "Medios de pago",
    description: "Efectivo, tarjetas, billeteras virtuales y beneficios activos del local.",
    detail: "Cuenta DNI de lunes a viernes y cuotas Banco Provincia viernes y sábados.",
    icon: CreditCardIcon,
  },
  {
    title: "Consulta y reserva",
    description: "El cliente puede armar su carrito y enviar una consulta clara al negocio.",
    detail: "Sirve para confirmar stock, talle, color y forma de entrega antes de cerrar la compra.",
    icon: MessageCircleIcon,
  },
  {
    title: "Retiro en local",
    description: "Compra o reserva online y coordinación de retiro presencial.",
    detail: "Local: Buenos Aires 68, Dolores.",
    icon: MapPinIcon,
  },
  {
    title: "Envíos",
    description: "Base preparada para coordinar envíos a domicilio o por transporte.",
    detail: "La integración con operadores logísticos puede sumarse en una etapa posterior.",
    icon: TruckIcon,
  },
  {
    title: "Cambios",
    description: "Información visible para que el cliente compre con más tranquilidad.",
    detail: "Los cambios se coordinan con el local según stock disponible y estado del producto.",
    icon: RefreshCwIcon,
  },
  {
    title: "Compra segura",
    description: "La web muestra productos, precios, imágenes y condiciones antes de consultar.",
    detail: "El próximo paso será sumar órdenes persistidas y seguimiento de estado.",
    icon: ShieldCheckIcon,
  },
] as const

const roadmapItems = [
  "Pago online con Mercado Pago",
  "Transferencia bancaria con comprobante",
  "Seguimiento de pedidos",
  "Historial de compras del cliente",
  "Preguntas frecuentes por producto",
  "Reseñas y calificaciones",
  "Cupones y promociones configurables",
  "Notificaciones por email o WhatsApp",
] as const

const faqItems = [
  {
    question: "¿Puedo reservar un producto?",
    answer:
      "Sí. Agregás productos al carrito, copiás la consulta o la enviás por WhatsApp cuando configuremos el número del local.",
  },
  {
    question: "¿Puedo pagar en el local?",
    answer: "Sí. La web permite preparar la compra y coordinar pago o retiro en Buenos Aires 68, Dolores.",
  },
  {
    question: "¿Qué medios de pago acepta FreeStyle?",
    answer: "Efectivo, billeteras virtuales y tarjetas. También se muestran las promociones vigentes del negocio.",
  },
  {
    question: "¿La web ya cobra automáticamente?",
    answer:
      "Todavía no. El flujo actual prioriza consulta/reserva. Mercado Pago y transferencia quedan como próximos módulos.",
  },
] as const

export default function HelpPage() {
  return (
    <section className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-10 md:px-8 md:py-16">
      <div className="grid gap-8 lg:grid-cols-[1fr_24rem] lg:items-end">
        <div className="space-y-4">
          <Badge className="w-fit">Servicios</Badge>
          <h1 className="font-display text-4xl font-black italic tracking-tight sm:text-6xl">
            Comprá con claridad
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
            Reunimos la información que un cliente necesita antes de comprar: medios de pago,
            consulta, reserva, retiro, envíos y cambios. La idea es que la tienda no sea solo un
            catálogo, sino una experiencia de compra confiable.
          </p>
        </div>
        <div className="rounded-3xl border bg-card p-5">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Próximo nivel</p>
          <p className="mt-2 text-2xl font-black">Ecommerce completo</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Esta base permite sumar pagos online, seguimiento de pedidos, reseñas y automatizaciones
            sin reconstruir la tienda desde cero.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {serviceCards.map((item) => {
          const Icon = item.icon
          return (
            <article key={item.title} className="rounded-3xl border bg-card p-5 shadow-sm">
              <Icon className="size-9 text-primary" aria-hidden="true" />
              <h2 className="mt-4 text-xl font-black">{item.title}</h2>
              <p className="mt-2 leading-7 text-muted-foreground">{item.description}</p>
              <p className="mt-3 rounded-2xl bg-secondary/60 p-3 text-sm leading-6 text-muted-foreground">
                {item.detail}
              </p>
            </article>
          )
        })}
      </div>

      <div className="grid gap-5 rounded-3xl border bg-secondary/30 p-5 md:grid-cols-[1fr_1fr] md:p-8">
        <div className="space-y-3">
          <ShoppingBagIcon className="size-10 text-primary" aria-hidden="true" />
          <h2 className="font-display text-3xl font-black italic">Servicios a incorporar</h2>
          <p className="leading-7 text-muted-foreground">
            Para competir con plataformas ecommerce más completas, estos son los módulos que conviene
            construir de forma ordenada.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button asChild>
              <Link href="/productos">Ver productos</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/carrito">Ir al carrito</Link>
            </Button>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {roadmapItems.map((item) => (
            <div key={item} className="rounded-2xl border bg-card p-3 text-sm font-semibold">
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
        <div>
          <HelpCircleIcon className="size-10 text-primary" aria-hidden="true" />
          <h2 className="mt-3 font-display text-3xl font-black italic">Preguntas frecuentes</h2>
        </div>
        <div className="grid gap-3">
          {faqItems.map((item) => (
            <article key={item.question} className="rounded-2xl border bg-card p-4">
              <h3 className="font-bold">{item.question}</h3>
              <p className="mt-2 leading-7 text-muted-foreground">{item.answer}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
