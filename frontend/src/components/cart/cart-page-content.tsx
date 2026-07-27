"use client"

import {
  CheckCircle2Icon,
  ClipboardIcon,
  CreditCardIcon,
  MapPinIcon,
  MessageCircleIcon,
  MinusIcon,
  PackageCheckIcon,
  PlusIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  StoreIcon,
  Trash2Icon,
  TruckIcon,
  UserIcon,
} from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import Link from "next/link"
import { type FormEvent, useEffect, useMemo, useState } from "react"

import { useCart } from "@/components/cart/cart-provider"
import { ProductImage } from "@/components/products/product-image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getCurrentUser, type PublicUser } from "@/lib/auth"
import { buildReservationMessage, formatCartPrice } from "@/lib/cart"
import {
  createMercadoPagoPreference,
  createStoreOrder,
  hasFreeShippingBenefit,
  listMyOrders,
  orderItemVariantDescription,
  orderGiftCouponCode,
  orderPaymentOptionLabel,
  orderPaymentOptionProvider,
  orderPaymentProofUrl,
  orderPaymentReference,
  orderShippingDetails,
  type OrderCreatePayload,
  type OrderRead,
} from "@/lib/orders"
import {
  activePaymentOptions,
  findPaymentOption,
  getPaymentProfile,
  type PaymentProfile,
} from "@/lib/payment-profile"
import {
  defaultPromotionSettings,
  getPromotionSettings,
  promotionNumber,
  promotionRatePercent,
  type PromotionSettings,
} from "@/lib/promotion-settings"

const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER

const paymentOptions: Array<{
  value: OrderCreatePayload["payment_method"]
  label: string
  description: string
}> = [
  {
    value: "to_confirm",
    label: "A confirmar",
    description: "El local te responde con la mejor opción disponible.",
  },
  {
    value: "cash",
    label: "Efectivo",
    description: "Ideal para retirar o aprovechar promos del local.",
  },
  {
    value: "transfer",
    label: "Transferencia",
    description: "Reservás y luego enviás el comprobante.",
  },
  {
    value: "mercado_pago",
    label: "Mercado Pago",
    description: "El local coordina link o medio de pago.",
  },
  {
    value: "card",
    label: "Tarjeta",
    description: "Consultá cuotas y promociones vigentes.",
  },
  {
    value: "wallet",
    label: "Billetera virtual",
    description: "Cuenta DNI u otra billetera disponible.",
  },
]

const fulfillmentOptions: Array<{
  value: OrderCreatePayload["fulfillment_method"]
  label: string
  description: string
}> = [
  {
    value: "pickup",
    label: "Retiro en local",
    description: "Buenos Aires 68, Dolores.",
  },
  {
    value: "shipping",
    label: "Envío",
    description: "Se coordina dirección, costo y horario.",
  },
  {
    value: "local_payment",
    label: "Pago en el local",
    description: "Reservás y abonás al retirar.",
  },
]

const itemMotion = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, x: -16 },
  transition: { duration: 0.22, ease: "easeOut" },
} as const

const panelMotion = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.28, ease: "easeOut" },
} as const

function buildWhatsAppHref(message: string) {
  if (!whatsappNumber) {
    return null
  }

  const normalizedNumber = whatsappNumber.replace(/\D/g, "")
  return `https://wa.me/${normalizedNumber}?text=${encodeURIComponent(message)}`
}

function userDisplayName(user: PublicUser) {
  return [user.first_name, user.last_name].filter(Boolean).join(" ").trim()
}

function orderCode(orderId: string) {
  return orderId.slice(0, 8).toUpperCase()
}

function paymentInstruction(paymentMethod: OrderCreatePayload["payment_method"]) {
  if (paymentMethod === "transfer") {
    return "Prepará el comprobante de transferencia y envialo por WhatsApp para confirmar el pedido."
  }
  if (paymentMethod === "mercado_pago") {
    return "El local va a coordinar el link o medio de Mercado Pago para cerrar la compra."
  }
  if (paymentMethod === "cash") {
    return "Podés pagar en efectivo cuando el comercio confirme disponibilidad."
  }
  if (paymentMethod === "card") {
    return "El local confirma cuotas, promociones y terminal disponible."
  }
  if (paymentMethod === "wallet") {
    return "El local confirma billetera disponible y promoción vigente."
  }
  return "El local revisa la reserva y coordina el medio de pago más conveniente."
}

function fulfillmentInstruction(fulfillmentMethod: OrderCreatePayload["fulfillment_method"]) {
  if (fulfillmentMethod === "shipping") {
    return "Coordiná dirección, costo y horario de envío con el local antes de cerrar la compra."
  }
  if (fulfillmentMethod === "local_payment") {
    return "Retirás y pagás en Buenos Aires 68, Dolores, cuando el local confirme disponibilidad."
  }
  return "Retiro en Buenos Aires 68, Dolores, una vez confirmado el pedido."
}

function buildOrderConfirmationMessage(order: OrderRead) {
  const giftCouponCode = orderGiftCouponCode(order)
  const paymentOptionLabel = orderPaymentOptionLabel(order)
  const paymentOptionProvider = orderPaymentOptionProvider(order)
  const paymentReference = orderPaymentReference(order)
  const paymentProofUrl = orderPaymentProofUrl(order)
  const shippingDetails = orderShippingDetails(order)
  const itemLines = order.items
    .map((item) => {
      const variantDescription = orderItemVariantDescription(item)
      return `- ${item.quantity} x ${item.product_name}${variantDescription ? ` / ${variantDescription}` : ""}`
    })
    .join("\n")

  return [
    `Hola, hice una reserva en FreeStyle. Pedido #${orderCode(order.id)}.`,
    "",
    itemLines,
    "",
    `Total: ${formatCartPrice(Number(order.total))}`,
    paymentOptionLabel ? `Opción de pago: ${paymentOptionLabel}.` : null,
    paymentOptionProvider ? `Proveedor: ${paymentOptionProvider}.` : null,
    hasFreeShippingBenefit(order) ? "Beneficio: envío gratis incluido." : null,
    giftCouponCode ? `Bono para próxima compra: ${giftCouponCode} (10%).` : null,
    shippingDetails.address ? `Envío: ${shippingDetails.address}` : null,
    shippingDetails.city || shippingDetails.postalCode
      ? `Localidad/CP: ${[shippingDetails.city, shippingDetails.postalCode].filter(Boolean).join(" - ")}`
      : null,
    paymentReference ? `Referencia de pago: ${paymentReference}.` : null,
    paymentProofUrl ? `Comprobante: ${paymentProofUrl}` : null,
    "Quedo atento/a para confirmar pago y disponibilidad.",
  ].filter(Boolean).join("\n")
}

export function CartPageContent() {
  const { items, total, incrementItem, decrementItem, removeItem, clearCart } = useCart()
  const [copied, setCopied] = useState(false)
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [paymentMethod, setPaymentMethod] =
    useState<OrderCreatePayload["payment_method"]>("to_confirm")
  const [paymentOptionCode, setPaymentOptionCode] = useState("")
  const [fulfillmentMethod, setFulfillmentMethod] =
    useState<OrderCreatePayload["fulfillment_method"]>("pickup")
  const [shippingAddress, setShippingAddress] = useState("")
  const [shippingCity, setShippingCity] = useState("")
  const [shippingPostalCode, setShippingPostalCode] = useState("")
  const [paymentReference, setPaymentReference] = useState("")
  const [paymentProofUrl, setPaymentProofUrl] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCreatingMercadoPagoPayment, setIsCreatingMercadoPagoPayment] = useState(false)
  const [createdOrder, setCreatedOrder] = useState<OrderRead | null>(null)
  const [paymentProfile, setPaymentProfile] = useState<PaymentProfile | null>(null)
  const [promotionSettings, setPromotionSettings] =
    useState<PromotionSettings>(defaultPromotionSettings)
  const [currentUser, setCurrentUser] = useState<PublicUser | null>(null)
  const [isWelcomeDiscountEligible, setIsWelcomeDiscountEligible] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const message = useMemo(() => buildReservationMessage(items, total), [items, total])
  const whatsappHref = buildWhatsAppHref(message)
  const createdOrderWhatsappHref = createdOrder
    ? buildWhatsAppHref(buildOrderConfirmationMessage(createdOrder))
    : null
  const itemCount = items.reduce((count, item) => count + item.quantity, 0)
  const selectedPayment = paymentOptions.find((option) => option.value === paymentMethod)
  const selectedFulfillment = fulfillmentOptions.find((option) => option.value === fulfillmentMethod)
  const isShippingSelected = fulfillmentMethod === "shipping"
  const hasShippingDetails =
    shippingAddress.trim().length > 4 &&
    shippingCity.trim().length > 1 &&
    shippingPostalCode.trim().length > 2
  const canSubmit =
    itemCount > 0 &&
    customerName.trim().length > 1 &&
    customerPhone.trim().length > 5 &&
    (!isShippingSelected || hasShippingDetails)
  const shouldShowPaymentProfile =
    Boolean(paymentProfile?.is_active) &&
    ["transfer", "wallet", "card"].includes(paymentMethod)
  const shouldShowPaymentSubmission =
    ["transfer", "mercado_pago", "wallet", "card"].includes(paymentMethod)
  const availablePaymentOptions = activePaymentOptions(paymentProfile)
  const shouldShowPaymentOptions = shouldShowPaymentProfile && availablePaymentOptions.length > 0
  const selectedPaymentOption =
    findPaymentOption(paymentProfile, paymentOptionCode) ?? availablePaymentOptions[0] ?? null
  const displayedPaymentProvider = selectedPaymentOption?.provider || paymentProfile?.provider
  const displayedPaymentAlias = paymentProfile?.alias
  const displayedPaymentHolder = paymentProfile?.account_holder
  const displayedPaymentIdentifier = paymentProfile?.account_identifier
  const displayedPaymentQr = selectedPaymentOption?.qr_image_url || paymentProfile?.qr_image_url
  const displayedPaymentInstructions =
    selectedPaymentOption?.instructions || paymentProfile?.instructions
  const promotionsActive = promotionSettings.is_active
  const welcomeRate = promotionNumber(promotionSettings.welcome_discount_rate, 0.1)
  const welcomeDiscount =
    promotionsActive && promotionSettings.welcome_coupon_enabled && isWelcomeDiscountEligible
      ? Math.round(total * welcomeRate)
      : 0
  const checkoutTotal = Math.max(0, total - welcomeDiscount)
  const freeShippingThreshold = promotionNumber(promotionSettings.free_shipping_threshold, 100000)
  const giftBonusThreshold = promotionNumber(promotionSettings.gift_bonus_threshold, 200000)
  const hasFreeShippingPreview =
    promotionsActive && promotionSettings.free_shipping_enabled && checkoutTotal > freeShippingThreshold
  const hasGiftBonusPreview =
    promotionsActive && promotionSettings.gift_bonus_enabled && checkoutTotal > giftBonusThreshold
  const freeShippingRemaining = Math.max(0, freeShippingThreshold - checkoutTotal + 1)
  const giftBonusRemaining = Math.max(0, giftBonusThreshold - checkoutTotal + 1)
  const welcomePercent = promotionRatePercent(promotionSettings.welcome_discount_rate)
  const giftBonusPercent = promotionRatePercent(promotionSettings.gift_bonus_rate)

  useEffect(() => {
    let isMounted = true

    getCurrentUser()
      .then((user) => {
        if (isMounted && user) {
          setCurrentUser(user)
          const displayName = userDisplayName(user)
          setCustomerName((currentName) => currentName || displayName)
          setCustomerPhone((currentPhone) => currentPhone || user.phone || "")
          setCustomerEmail((currentEmail) => currentEmail || user.email)
        }
        if (isMounted && !user) {
          setCurrentUser(null)
          setIsWelcomeDiscountEligible(false)
        }
        return user
      })
      .then((user) => {
        if (!user || user.role !== "customer") {
          return undefined
        }
        return listMyOrders().then((orders) => {
          if (isMounted) {
            setIsWelcomeDiscountEligible(orders.length === 0)
          }
        })
      })
      .catch(() => undefined)

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    Promise.allSettled([getPaymentProfile(), getPromotionSettings()])
      .then(([profileResult, promotionResult]) => {
        if (isMounted) {
          if (profileResult.status === "fulfilled") {
            setPaymentProfile(profileResult.value)
          }
          if (promotionResult.status === "fulfilled") {
            setPromotionSettings(promotionResult.value)
          }
        }
      })
      .catch(() => undefined)

    return () => {
      isMounted = false
    }
  }, [])

  async function copyMessage() {
    await navigator.clipboard.writeText(message)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) {
      setError(
        isShippingSelected && !hasShippingDetails
          ? "Para enviar el pedido necesitamos dirección, localidad y código postal."
          : "Necesitamos tu nombre y un WhatsApp válido para coordinar la reserva.",
      )
      return
    }

    setError(null)
    setCreatedOrder(null)
    setIsSubmitting(true)

    try {
      const order = await createStoreOrder({
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim() || undefined,
        payment_method: paymentMethod,
        fulfillment_method: fulfillmentMethod,
        shipping_address: isShippingSelected ? shippingAddress.trim() : undefined,
        shipping_city: isShippingSelected ? shippingCity.trim() : undefined,
        shipping_postal_code: isShippingSelected ? shippingPostalCode.trim() : undefined,
        payment_option_code: shouldShowPaymentOptions ? selectedPaymentOption?.code : undefined,
        payment_reference: paymentReference.trim() || undefined,
        payment_proof_url: paymentProofUrl.trim() || undefined,
        notes: notes.trim() || undefined,
        items: items.map((item) => ({
          product_slug: item.slug,
          quantity: item.quantity,
          variant_id: item.variantId,
          variant_label: item.variantLabel,
          variant_color: item.variantColor,
          variant_size: item.variantSize,
        })),
      })
      setCreatedOrder(order)
      setIsWelcomeDiscountEligible(false)
      clearCart()
    } catch (orderError) {
      setError(orderError instanceof Error ? orderError.message : "No pudimos crear la reserva")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function startMercadoPagoPayment(orderId: string) {
    setIsCreatingMercadoPagoPayment(true)
    setError(null)
    try {
      const preference = await createMercadoPagoPreference(orderId)
      window.location.href = preference.init_point
    } catch (paymentError) {
      setError(
        paymentError instanceof Error
          ? paymentError.message
          : "No pudimos abrir Mercado Pago",
      )
    } finally {
      setIsCreatingMercadoPagoPayment(false)
    }
  }

  if (createdOrder) {
    const code = orderCode(createdOrder.id)
    const giftCouponCode = orderGiftCouponCode(createdOrder)
    const createdPaymentReference = orderPaymentReference(createdOrder)
    const createdPaymentProofUrl = orderPaymentProofUrl(createdOrder)

    return (
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col justify-center gap-6 px-4 py-16 md:px-8">
        <Badge className="w-fit">Reserva creada</Badge>
        <div className="space-y-3">
          <h1 className="font-display text-4xl font-black italic tracking-tight sm:text-6xl">
            Pedido reservado
          </h1>
          <p className="w-fit rounded-2xl border bg-secondary/40 px-4 py-3 font-mono text-sm">
            Reserva #{code}
          </p>
          <p className="max-w-2xl text-muted-foreground">
            Guardamos tu pedido con el código {code}. El local puede verlo desde el panel y coordinar
            el próximo paso sin que tengas que cargar todo de nuevo.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <article className="rounded-2xl border bg-card p-4">
            <CheckCircle2Icon className="size-5 text-primary" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold">1. Pago</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {paymentInstruction(paymentMethod)}
            </p>
          </article>
          <article className="rounded-2xl border bg-card p-4">
            <PackageCheckIcon className="size-5 text-primary" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold">2. Entrega o retiro</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {fulfillmentInstruction(fulfillmentMethod)}
            </p>
          </article>
          <article className="rounded-2xl border bg-card p-4">
            <ShieldCheckIcon className="size-5 text-primary" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold">3. Seguimiento</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Podés volver a esta reserva desde tu perfil o abrir el seguimiento con el código del pedido.
            </p>
          </article>
        </div>

        <div className="rounded-2xl border bg-secondary/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Total estimado</p>
              <p className="text-2xl font-black">{formatCartPrice(Number(createdOrder.total))}</p>
              {createdOrder.metadata?.coupon_code ? (
                <p className="mt-1 text-xs font-bold text-primary">
                  Incluye cupón {String(createdOrder.metadata.coupon_code)} aplicado.
                </p>
              ) : null}
              {hasFreeShippingBenefit(createdOrder) ? (
                <p className="mt-1 text-xs font-bold text-primary">
                  Incluye envío gratis.
                </p>
              ) : null}
              {giftCouponCode ? (
                <p className="mt-1 text-xs font-bold text-primary">
                  Ganaste un bono para tu próxima compra: {giftCouponCode}.
                </p>
              ) : null}
              {createdPaymentReference || createdPaymentProofUrl ? (
                <p className="mt-1 text-xs font-bold text-primary">
                  Comprobante o referencia recibida. El local revisa el pago antes de preparar.
                </p>
              ) : null}
            </div>
            <Badge variant={createdOrder.payment_status === "paid" ? "default" : "secondary"}>
              Pago pendiente de confirmación
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href={`/pedido/${createdOrder.id}`}>Ver seguimiento</Link>
          </Button>
          {createdOrderWhatsappHref ? (
            <Button asChild variant="secondary">
              <a href={createdOrderWhatsappHref} target="_blank" rel="noreferrer">
                Confirmar por WhatsApp
              </a>
            </Button>
          ) : null}
          {createdOrder.payment_method === "mercado_pago" ? (
            <Button
              type="button"
              variant="secondary"
              disabled={isCreatingMercadoPagoPayment}
              onClick={() => void startMercadoPagoPayment(createdOrder.id)}
            >
              <CreditCardIcon data-icon="inline-start" />
              {isCreatingMercadoPagoPayment ? "Abriendo Mercado Pago..." : "Pagar con Mercado Pago"}
            </Button>
          ) : null}
          {error ? <p className="basis-full text-sm text-destructive">{error}</p> : null}
          <Button asChild>
            <Link href="/productos">Seguir viendo productos</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/ayuda">Ver servicios de compra</Link>
          </Button>
        </div>
      </section>
    )
  }

  if (items.length === 0) {
    return (
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl flex-col justify-center gap-6 px-4 py-16 md:px-8">
        <Badge className="w-fit">Carrito</Badge>
        <div className="space-y-3">
          <h1 className="font-display text-4xl font-black italic tracking-tight sm:text-6xl">
            Tu carrito está vacío
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Agregá productos del catálogo para consultar disponibilidad, reservar o coordinar el pago.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/productos">Ver productos</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/ofertas">Ver ofertas</Link>
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:px-8 md:py-16 lg:grid-cols-[1fr_28rem]">
      <div className="space-y-6">
        <div className="overflow-hidden rounded-[2rem] border bg-card shadow-sm">
          <div className="bg-[radial-gradient(circle_at_12%_18%,rgba(198,255,0,0.18),transparent_30%),linear-gradient(135deg,#020617,#18181b_62%,#1d4ed8)] p-6">
            <Badge className="w-fit bg-white text-slate-950 hover:bg-white">Carrito</Badge>
            <h1 className="mt-4 font-display text-4xl font-black italic tracking-tight text-white sm:text-6xl">
              Revisá y reservá
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">
              Confirmá producto, color, talle, entrega y medio de pago. El pedido queda registrado
              para que el local pueda gestionarlo desde el panel.
            </p>
          </div>

          <div className="grid gap-3 p-4 sm:grid-cols-3">
            <div className="rounded-2xl border bg-secondary/40 p-4">
              <ShoppingBagIcon className="size-5 text-primary" aria-hidden="true" />
              <p className="mt-2 font-bold">1. Productos</p>
              <p className="text-xs text-muted-foreground">Revisá cantidad, color y talle.</p>
            </div>
            <div className="rounded-2xl border bg-secondary/40 p-4">
              <UserIcon className="size-5 text-primary" aria-hidden="true" />
              <p className="mt-2 font-bold">2. Contacto</p>
              <p className="text-xs text-muted-foreground">Nombre y WhatsApp para coordinar.</p>
            </div>
            <div className="rounded-2xl border bg-secondary/40 p-4">
              <CheckCircle2Icon className="size-5 text-primary" aria-hidden="true" />
              <p className="mt-2 font-bold">3. Reserva</p>
              <p className="text-xs text-muted-foreground">Se descuenta stock al crear pedido.</p>
            </div>
          </div>
        </div>

        <motion.div className="space-y-3" {...panelMotion}>
          <AnimatePresence initial={false}>
            {items.map((item) => {
            const variantText = [
              item.variantColor ? `Color: ${item.variantColor}` : null,
              item.variantSize ? `Talle: ${item.variantSize}` : null,
            ]
              .filter(Boolean)
              .join(" · ")

            return (
              <motion.article
                key={item.key}
                layout
                {...itemMotion}
                className="grid gap-4 rounded-3xl border bg-card p-4 shadow-sm sm:grid-cols-[7rem_1fr_auto]"
              >
                <Link
                  href={`/productos/${item.slug}`}
                  className="aspect-square overflow-hidden rounded-2xl bg-white"
                >
                  {item.imageUrl ? (
                    <ProductImage
                      alt={item.name}
                      className="size-full object-contain p-2"
                      src={item.imageUrl}
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center font-display font-black italic text-slate-500">
                      FreeStyle
                    </div>
                  )}
                </Link>
                <div className="space-y-3">
                  <div>
                    <Link
                      href={`/productos/${item.slug}`}
                      className="text-lg font-semibold hover:text-primary"
                    >
                      {item.name}
                    </Link>
                    {variantText || item.variantLabel ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {variantText ? <Badge variant="secondary">{variantText}</Badge> : null}
                        {!variantText && item.variantLabel ? (
                          <Badge variant="secondary">{item.variantLabel}</Badge>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  <p className="text-sm text-muted-foreground">{formatCartPrice(item.price)} c/u</p>
                  <div className="flex w-fit items-center rounded-full border">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Restar unidad"
                      onClick={() => decrementItem(item.key)}
                    >
                      <MinusIcon data-icon="inline-start" />
                    </Button>
                    <span className="min-w-8 text-center text-sm font-bold">{item.quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Sumar unidad"
                      onClick={() => incrementItem(item.key)}
                    >
                      <PlusIcon data-icon="inline-start" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-start justify-between gap-3 sm:flex-col sm:items-end">
                  <p className="text-xl font-black">{formatCartPrice(item.price * item.quantity)}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Quitar producto"
                    onClick={() => removeItem(item.key)}
                  >
                    <Trash2Icon data-icon="inline-start" />
                  </Button>
                </div>
              </motion.article>
            )
            })}
          </AnimatePresence>
        </motion.div>
      </div>

      <motion.aside
        className="h-fit space-y-4 rounded-[2rem] border bg-card p-5 shadow-sm lg:sticky lg:top-24"
        {...panelMotion}
      >
        <div className="space-y-3">
          <h2 className="text-2xl font-black">Resumen del pedido</h2>
          <div className="rounded-2xl border bg-secondary/40 p-4">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Unidades</span>
              <span>{itemCount}</span>
            </div>
            <div className="mt-2 flex justify-between text-lg font-black">
              <span>Total estimado</span>
              <span>{formatCartPrice(checkoutTotal)}</span>
            </div>
            {isWelcomeDiscountEligible ? (
              <div className="mt-3 rounded-2xl border border-primary/30 bg-primary/10 p-3">
                <div className="mb-2 flex justify-between gap-3 text-xs text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatCartPrice(total)}</span>
                </div>
                <div className="flex justify-between gap-3 text-sm font-black text-primary">
                  <span>Bienvenida {welcomePercent}%</span>
                  <span>-{formatCartPrice(welcomeDiscount)}</span>
                </div>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Cupón {promotionSettings.welcome_coupon_code} aplicado automáticamente por ser tu
                  primera compra con cuenta.
                </p>
              </div>
            ) : currentUser ? (
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                El cupón de bienvenida se usa una sola vez por cuenta.
              </p>
            ) : (
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Creá una cuenta para activar el {welcomePercent}% de bienvenida en tu primera compra.
              </p>
            )}
            <div className="mt-3 grid gap-2">
              <div
                className={`rounded-2xl border p-3 ${
                  hasFreeShippingPreview
                    ? "border-primary/35 bg-primary/10"
                    : "bg-background/55"
                }`}
              >
                <div className="flex items-center justify-between gap-3 text-sm font-black">
                  <span>Envío gratis</span>
                  <Badge variant={hasFreeShippingPreview ? "default" : "secondary"}>
                    {hasFreeShippingPreview ? "Activado" : `Superá ${formatCartPrice(freeShippingThreshold)}`}
                  </Badge>
                </div>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {hasFreeShippingPreview
                    ? "Tu compra supera el mínimo y el local coordina el envío sin costo."
                    : `Te faltan ${formatCartPrice(freeShippingRemaining)} para activar envío gratis.`}
                </p>
              </div>
              <div
                className={`rounded-2xl border p-3 ${
                  hasGiftBonusPreview
                    ? "border-primary/35 bg-primary/10"
                    : "bg-background/55"
                }`}
              >
                <div className="flex items-center justify-between gap-3 text-sm font-black">
                  <span>Bono de regalo {giftBonusPercent}%</span>
                  <Badge variant={hasGiftBonusPreview ? "default" : "secondary"}>
                    {hasGiftBonusPreview ? "Ganado" : `Superá ${formatCartPrice(giftBonusThreshold)}`}
                  </Badge>
                </div>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {hasGiftBonusPreview
                    ? `Al crear la reserva queda registrado el bono ${promotionSettings.gift_bonus_code} para tu próxima compra.`
                    : `Te faltan ${formatCartPrice(giftBonusRemaining)} para recibir un bono ${giftBonusPercent}%.`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {promotionsActive && (promotionSettings.payment_promotions || promotionSettings.checkout_message) ? (
          <div className="grid gap-2 rounded-2xl border bg-background/45 p-4 text-xs leading-5">
            {promotionSettings.payment_promotions ? (
              <p className="font-semibold text-foreground">{promotionSettings.payment_promotions}</p>
            ) : null}
            {promotionSettings.checkout_message ? (
              <p className="text-muted-foreground">{promotionSettings.checkout_message}</p>
            ) : null}
          </div>
        ) : null}

        <div className="grid gap-2 rounded-2xl border border-primary/30 bg-primary/10 p-4 text-xs leading-5">
          <p className="font-black text-primary">Antes de preparar el pedido</p>
          <p className="text-muted-foreground">
            El local valida stock, confirma el medio de pago y recién después avanza con entrega o
            retiro.
          </p>
        </div>

        <form className="space-y-4" onSubmit={submitOrder}>
          <div className="rounded-2xl border bg-background/45 p-4">
            <div className="mb-3 flex items-center gap-2">
              <UserIcon className="size-4 text-primary" aria-hidden="true" />
              <p className="font-bold">Tus datos</p>
            </div>
            <div className="space-y-3">
              <label className="space-y-2" htmlFor="customer-name">
                <span className="text-sm font-semibold">Nombre</span>
                <input
                  id="customer-name"
                  className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="Tu nombre"
                  required
                />
              </label>
              <label className="space-y-2" htmlFor="customer-phone">
                <span className="text-sm font-semibold">WhatsApp</span>
                <input
                  id="customer-phone"
                  className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  value={customerPhone}
                  onChange={(event) => setCustomerPhone(event.target.value)}
                  placeholder="Ej: 2245..."
                  required
                />
              </label>
              <label className="space-y-2" htmlFor="customer-email">
                <span className="text-sm font-semibold">Email opcional</span>
                <input
                  id="customer-email"
                  type="email"
                  className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  value={customerEmail}
                  onChange={(event) => setCustomerEmail(event.target.value)}
                  placeholder="tu@email.com"
                />
              </label>
            </div>
          </div>

          <div className="rounded-2xl border bg-background/45 p-4">
            <div className="mb-3 flex items-center gap-2">
              <CreditCardIcon className="size-4 text-primary" aria-hidden="true" />
              <p className="font-bold">Forma de pago</p>
            </div>
            <div className="grid gap-2">
              {paymentOptions.map((option) => (
                <label
                  key={option.value}
                  className={`cursor-pointer rounded-2xl border p-3 transition ${
                    paymentMethod === option.value
                      ? "border-primary bg-primary/10"
                      : "bg-card hover:border-primary/60"
                  }`}
                >
                  <input
                    className="sr-only"
                    type="radio"
                    name="payment-method"
                    value={option.value}
                    checked={paymentMethod === option.value}
                    onChange={() => {
                      setPaymentMethod(option.value)
                      setPaymentOptionCode("")
                    }}
                  />
                  <span className="block text-sm font-bold">{option.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                    {option.description}
                  </span>
                </label>
              ))}
            </div>

            {shouldShowPaymentOptions ? (
              <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/10 p-4">
                <p className="text-sm font-black text-primary">Elegí banco o promoción</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  El descuento lo aplica el banco o billetera al pagar. Seleccioná la opción que vas
                  a usar para ver el QR correcto.
                </p>
                <div className="mt-3 grid gap-2">
                  {availablePaymentOptions.map((option) => (
                    <label
                      key={option.code}
                      className={`cursor-pointer rounded-2xl border p-3 transition ${
                        selectedPaymentOption?.code === option.code
                          ? "border-primary bg-background"
                          : "bg-card hover:border-primary/60"
                      }`}
                    >
                      <input
                        className="sr-only"
                        type="radio"
                        name="payment-option"
                        value={option.code}
                        checked={selectedPaymentOption?.code === option.code}
                        onChange={() => setPaymentOptionCode(option.code)}
                      />
                      <span className="block text-sm font-bold">{option.label}</span>
                      {option.provider ? (
                        <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                          {option.provider}
                        </span>
                      ) : null}
                    </label>
                  ))}
                </div>
              </div>
            ) : null}

            {shouldShowPaymentSubmission ? (
              <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/10 p-4">
                <p className="text-sm font-black text-primary">¿Ya pagaste o tenés comprobante?</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Cargá una referencia o link del comprobante para que el local pueda revisar el pago
                  más rápido. Si todavía no pagaste, dejalo vacío.
                </p>
                <div className="mt-3 grid gap-3">
                  <label className="space-y-2" htmlFor="payment-reference">
                    <span className="text-sm font-semibold">Referencia de pago opcional</span>
                    <input
                      id="payment-reference"
                      className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                      value={paymentReference}
                      onChange={(event) => setPaymentReference(event.target.value)}
                      placeholder="Ej: alias usado, operación, últimos 4 dígitos"
                    />
                  </label>
                  <label className="space-y-2" htmlFor="payment-proof-url">
                    <span className="text-sm font-semibold">Link del comprobante opcional</span>
                    <input
                      id="payment-proof-url"
                      className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                      value={paymentProofUrl}
                      onChange={(event) => setPaymentProofUrl(event.target.value)}
                      placeholder="Pegá un link de imagen o archivo si ya lo tenés"
                      type="url"
                    />
                  </label>
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border bg-background/45 p-4">
            <div className="mb-3 flex items-center gap-2">
              <TruckIcon className="size-4 text-primary" aria-hidden="true" />
              <p className="font-bold">Entrega</p>
            </div>
            <div className="grid gap-2">
              {fulfillmentOptions.map((option) => (
                <label
                  key={option.value}
                  className={`cursor-pointer rounded-2xl border p-3 transition ${
                    fulfillmentMethod === option.value
                      ? "border-primary bg-primary/10"
                      : "bg-card hover:border-primary/60"
                  }`}
                >
                  <input
                    className="sr-only"
                    type="radio"
                    name="fulfillment-method"
                    value={option.value}
                    checked={fulfillmentMethod === option.value}
                    onChange={() => setFulfillmentMethod(option.value)}
                  />
                  <span className="block text-sm font-bold">{option.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                    {option.description}
                  </span>
                </label>
              ))}
            </div>
            {isShippingSelected ? (
              <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/10 p-4">
                <div className="mb-3 flex items-start gap-2">
                  <MapPinIcon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-black text-primary">Datos para el envío</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Estos datos le quedan al vendedor para cotizar o despachar por correo.
                    </p>
                  </div>
                </div>
                <div className="grid gap-3">
                  <label className="space-y-2" htmlFor="shipping-address">
                    <span className="text-sm font-semibold">Dirección</span>
                    <input
                      id="shipping-address"
                      className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                      value={shippingAddress}
                      onChange={(event) => setShippingAddress(event.target.value)}
                      placeholder="Calle, número, piso/depto"
                      required={isShippingSelected}
                    />
                  </label>
                  <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
                    <label className="space-y-2" htmlFor="shipping-city">
                      <span className="text-sm font-semibold">Localidad</span>
                      <input
                        id="shipping-city"
                        className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                        value={shippingCity}
                        onChange={(event) => setShippingCity(event.target.value)}
                        placeholder="Ej: Dolores"
                        required={isShippingSelected}
                      />
                    </label>
                    <label className="space-y-2" htmlFor="shipping-postal-code">
                      <span className="text-sm font-semibold">Código postal</span>
                      <input
                        id="shipping-postal-code"
                        className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                        value={shippingPostalCode}
                        onChange={(event) => setShippingPostalCode(event.target.value)}
                        placeholder="7100"
                        required={isShippingSelected}
                      />
                    </label>
                  </div>
                </div>
                {!hasShippingDetails ? (
                  <p className="mt-3 text-xs font-semibold text-primary">
                    Completá dirección, localidad y código postal para crear la reserva con envío.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <label className="block space-y-2" htmlFor="order-notes">
            <span className="text-sm font-semibold">Comentario opcional</span>
            <textarea
              id="order-notes"
              className="min-h-20 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Horario de retiro, referencia de la dirección o cualquier aclaración."
            />
          </label>

          <div className="rounded-2xl border bg-secondary/40 p-4 text-sm leading-6 text-muted-foreground">
            <div className="flex items-start gap-3">
              {fulfillmentMethod === "pickup" || fulfillmentMethod === "local_payment" ? (
                <StoreIcon className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" />
              ) : (
                <MapPinIcon className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" />
              )}
              <div>
                <p className="font-semibold text-foreground">{selectedFulfillment?.label}</p>
                <p>{fulfillmentInstruction(fulfillmentMethod)}</p>
                <p className="mt-2 font-semibold text-foreground">{selectedPayment?.label}</p>
                <p>{paymentInstruction(paymentMethod)}</p>
              </div>
            </div>
          </div>

          {shouldShowPaymentProfile && paymentProfile ? (
            <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4 text-sm leading-6">
              <p className="font-black text-primary">
                {selectedPaymentOption ? `QR para ${selectedPaymentOption.label}` : "Datos de pago del local"}
              </p>
              <div className="mt-2 grid gap-1 text-muted-foreground">
                {displayedPaymentProvider ? <p>Medio: {displayedPaymentProvider}</p> : null}
                {displayedPaymentAlias ? <p>Alias: {displayedPaymentAlias}</p> : null}
                {displayedPaymentHolder ? <p>Titular: {displayedPaymentHolder}</p> : null}
                {displayedPaymentIdentifier ? (
                  <p>CBU/CVU: {displayedPaymentIdentifier}</p>
                ) : null}
              </div>
              {displayedPaymentQr ? (
                <div className="mt-3 aspect-square overflow-hidden rounded-2xl border bg-white">
                  <ProductImage
                    alt="QR de pago del local"
                    className="size-full object-contain p-3"
                    src={displayedPaymentQr}
                  />
                </div>
              ) : null}
              {displayedPaymentInstructions ? (
                <p className="mt-3 text-xs leading-5 text-muted-foreground">
                  {displayedPaymentInstructions}
                </p>
              ) : null}
            </div>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button className="w-full" type="submit" disabled={isSubmitting || !canSubmit}>
            <PackageCheckIcon data-icon="inline-start" />
            {isSubmitting ? "Creando reserva..." : "Crear reserva"}
          </Button>
        </form>

        <div className="rounded-2xl border bg-secondary/50 p-4 text-sm leading-6 text-muted-foreground">
          <p className="font-semibold text-foreground">Promos vigentes</p>
          <p>Cuenta DNI: 20% de lunes a viernes.</p>
          <p>Banco Provincia: 4 cuotas sin interés viernes y sábados.</p>
          <p>Retiro y pago en el local: Buenos Aires 68, Dolores.</p>
        </div>

        <div className="space-y-2">
          {whatsappHref ? (
            <Button asChild className="w-full" variant="secondary">
              <a href={whatsappHref} target="_blank" rel="noreferrer">
                <MessageCircleIcon data-icon="inline-start" />
                Consultar por WhatsApp
              </a>
            </Button>
          ) : null}
          <Button className="w-full" variant="secondary" type="button" onClick={copyMessage}>
            <ClipboardIcon data-icon="inline-start" />
            {copied ? "Mensaje copiado" : "Copiar consulta"}
          </Button>
          <Button className="w-full" variant="ghost" type="button" onClick={clearCart}>
            Vaciar carrito
          </Button>
        </div>

        <Button asChild className="w-full" variant="outline">
          <Link href="/ayuda">Ver servicios y condiciones</Link>
        </Button>
      </motion.aside>
    </section>
  )
}
