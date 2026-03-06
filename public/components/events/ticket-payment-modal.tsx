"use client"

import { useState } from "react"
import { CreditCard, Smartphone, CheckCircle, Loader2, X, Lock, Shield, Calendar, Ticket, Clock, MapPin, QrCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface TicketPaymentModalProps {
  event: {
    id: number
    title: string
    event_date?: string
    event_time?: string
    event_time_end?: string
    location?: string
    price: number
    category?: string
    creator_name?: string
  }
  userId: number
  userEmail: string
  userName: string
  onSuccess: () => void
  onClose: () => void
}

type PaymentMethod = "debit" | "credit" | "mercadopago" | null
type Step = "method" | "card-form" | "mp-confirm" | "processing" | "success"

function InputField({
  label, placeholder, value, onChange, type = "text", maxLength
}: {
  label: string; placeholder: string; value: string; onChange: (v: string) => void;
  type?: string; maxLength?: number
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">{label}</label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} maxLength={maxLength}
        className="w-full px-4 py-3 rounded-xl text-sm font-medium text-white placeholder-white/25
                   focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all"
        style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
      />
    </div>
  )
}

function formatCardNumber(v: string) {
  return v.replace(/\D/g, "").substring(0, 16).replace(/(.{4})/g, "$1 ").trim()
}
function formatExpiry(v: string) {
  const digits = v.replace(/\D/g, "").substring(0, 4)
  if (digits.length >= 3) return digits.substring(0, 2) + "/" + digits.substring(2)
  return digits
}

function QRDisplay({ qrCode, size = 120 }: { qrCode: string; size?: number }) {
  const hash = qrCode.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const cells = 21
  const grid: boolean[][] = []

  for (let r = 0; r < cells; r++) {
    grid[r] = []
    for (let c = 0; c < cells; c++) {
      const inFinderTL = r < 8 && c < 8
      const inFinderTR = r < 8 && c >= cells - 8
      const inFinderBL = r >= cells - 8 && c < 8

      if (inFinderTL || inFinderTR || inFinderBL) {
        const dr = inFinderTL ? r : inFinderTR ? r : r - (cells - 8)
        const dc = inFinderTL ? c : inFinderTR ? c - (cells - 8) : c
        const inBorder = dr === 0 || dr === 6 || dc === 0 || dc === 6
        const inInner = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4
        grid[r][c] = inBorder || inInner
      } else {
        const seed = (r * cells + c + hash) % 7
        grid[r][c] = seed < 3
      }
    }
  }

  const cellSize = size / cells

  return (
    <div style={{ width: size, height: size, background: "white", padding: 4, borderRadius: 8, display: "inline-block" }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cells}, ${cellSize}px)`, gap: 0 }}>
        {grid.flat().map((filled, i) => (
          <div key={i} style={{
            width: cellSize, height: cellSize,
            background: filled ? "#000" : "#fff"
          }} />
        ))}
      </div>
    </div>
  )
}

export function TicketPaymentModal({ event, userId, userEmail, userName, onSuccess, onClose }: TicketPaymentModalProps) {
  const { toast } = useToast()
  const [method, setMethod] = useState<PaymentMethod>(null)
  const [step, setStep] = useState<Step>("method")
  const [cardNum, setCardNum] = useState("")
  const [cardName, setCardName] = useState("")
  const [cardExpiry, setCardExpiry] = useState("")
  const [cardCvv, setCardCvv] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [ticketData, setTicketData] = useState<{ id: number; qrCode: string } | null>(null)

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Fecha a confirmar"
    try {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const [y, m, d] = dateStr.split("-").map(Number)
        return new Date(y, m - 1, d).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })
      }
      return new Date(dateStr).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })
    } catch { return dateStr }
  }

  const formatPrice = (price: number) => `$${price.toLocaleString("es-AR")}`

  const timeDisplay = event.event_time
    ? `${event.event_time.substring(0, 5)}${event.event_time_end ? ` - ${event.event_time_end.substring(0, 5)}` : ""}`
    : null

  const validateCard = () => {
    const errs: Record<string, string> = {}
    if (cardNum.replace(/\s/g, "").length < 16) errs.cardNum = "Ingresá los 16 dígitos"
    if (!cardName.trim()) errs.cardName = "Ingresá el nombre del titular"
    if (cardExpiry.length < 5) errs.expiry = "Formato MM/AA"
    if (cardCvv.length < 3) errs.cvv = "Mínimo 3 dígitos"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const processPayment = async () => {
    setStep("processing")
    await new Promise(r => setTimeout(r, 1600))

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          userId,
          userEmail,
          userName,
          quantity: 1,
          paymentMethod: method === "debit" ? "Tarjeta de débito"
            : method === "credit" ? "Tarjeta de crédito"
            : "Mercado Pago",
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al procesar el pago")
      setTicketData({ id: data.id, qrCode: data.qrCode })
      setStep("success")
    } catch (e: any) {
      setStep(method === "mercadopago" ? "mp-confirm" : "card-form")
      toast({ title: "Error de pago", description: e.message, variant: "destructive" })
    }
  }

  const handleCardPay = () => {
    if (!validateCard()) return
    processPayment()
  }

  const handleMpPay = () => processPayment()

  const handleContinue = () => {
    if (!method) return
    setStep(method === "mercadopago" ? "mp-confirm" : "card-form")
  }

  const handleSuccessClose = () => {
    onSuccess()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)" }}>
      <div className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{ background: "linear-gradient(160deg, #0d1022 0%, #080b14 100%)", border: "1px solid rgba(255,255,255,0.1)" }}>

        {/* Header */}
        {step !== "success" && (
          <div className="flex items-center justify-between px-6 py-4 sticky top-0 z-10"
            style={{ background: "linear-gradient(160deg, #0d1022 0%, #080b14 100%)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #B744B8, #7a1a8a)" }}>
                <Ticket className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="font-black text-white text-base leading-tight">Comprar entrada</h2>
                <p className="text-white/35 text-xs">Red Show · Pago seguro</p>
              </div>
            </div>
            {step !== "processing" && (
              <button onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white transition-all">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* Resumen del evento */}
        {(step === "method" || step === "card-form" || step === "mp-confirm") && (
          <div className="mx-6 mt-5 p-4 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Resumen</p>
            <div className="space-y-2">
              <div className="flex items-start gap-2 text-sm">
                <Ticket className="h-3.5 w-3.5 text-purple-400 mt-0.5 flex-shrink-0" />
                <span className="text-white font-semibold">{event.title}</span>
              </div>
              {event.event_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
                  <span className="text-white/60">{formatDate(event.event_date)}</span>
                </div>
              )}
              {timeDisplay && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
                  <span className="text-white/60">{timeDisplay}</span>
                </div>
              )}
              {event.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
                  <span className="text-white/60">{event.location}</span>
                </div>
              )}
            </div>
            <div className="mt-3 pt-3 flex items-center justify-between"
              style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <span className="text-white/50 text-sm font-semibold">Total a pagar</span>
              <span className="text-2xl font-black"
                style={{ background: "linear-gradient(135deg, #fff, #B744B8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {formatPrice(event.price)}
              </span>
            </div>
          </div>
        )}

        <div className="px-6 pb-6">

          {/* STEP 1: método */}
          {step === "method" && (
            <div className="mt-5">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Método de pago</p>
              <div className="space-y-2">
                {[
                  { id: "debit", label: "Tarjeta de débito", icon: <CreditCard className="h-5 w-5" /> },
                  { id: "credit", label: "Tarjeta de crédito", icon: <CreditCard className="h-5 w-5" /> },
                  { id: "mercadopago", label: "Mercado Pago", icon: <Smartphone className="h-5 w-5" /> },
                ].map(({ id, label, icon }) => (
                  <button key={id}
                    onClick={() => setMethod(id as PaymentMethod)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all text-left"
                    style={{
                      background: method === id ? "rgba(183,68,184,0.15)" : "rgba(255,255,255,0.04)",
                      border: method === id ? "1px solid rgba(183,68,184,0.5)" : "1px solid rgba(255,255,255,0.08)",
                    }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: method === id ? "linear-gradient(135deg,#B744B8,#7a1a8a)" : "rgba(255,255,255,0.06)" }}>
                      <span className={method === id ? "text-white" : "text-white/45"}>{icon}</span>
                    </div>
                    <span className={`font-semibold text-sm flex-1 ${method === id ? "text-white" : "text-white/60"}`}>{label}</span>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${method === id ? "border-purple-500" : "border-white/20"}`}>
                      {method === id && <div className="w-2 h-2 rounded-full bg-purple-500" />}
                    </div>
                  </button>
                ))}
              </div>
              <Button onClick={handleContinue} disabled={!method}
                className="w-full h-12 mt-5 font-bold border-0 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, #001C55, #B744B8)" }}>
                Continuar
              </Button>
            </div>
          )}

          {/* STEP 2a: formulario de tarjeta */}
          {step === "card-form" && (
            <div className="mt-5 space-y-4">
              <div className="p-4 rounded-2xl relative overflow-hidden"
                style={{ background: "linear-gradient(135deg, #001C55 0%, #0a1a3e 50%, #1a0a2e 100%)", minHeight: "100px" }}>
                <div className="absolute inset-0 opacity-20"
                  style={{ backgroundImage: "radial-gradient(circle at 80% 20%, rgba(183,68,184,0.6) 0%, transparent 50%)" }} />
                <div className="relative">
                  <p className="text-white/40 text-xs mb-3 uppercase tracking-widest">
                    {method === "debit" ? "Tarjeta de débito" : "Tarjeta de crédito"}
                  </p>
                  <p className="text-white font-mono text-lg tracking-widest">
                    {cardNum || "•••• •••• •••• ••••"}
                  </p>
                  <div className="flex items-end justify-between mt-3">
                    <div>
                      <p className="text-white/30 text-xs uppercase tracking-wider">Titular</p>
                      <p className="text-white text-sm font-semibold uppercase">{cardName || "NOMBRE APELLIDO"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/30 text-xs uppercase tracking-wider">Vence</p>
                      <p className="text-white text-sm font-semibold">{cardExpiry || "MM/AA"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <InputField label="Número de tarjeta" placeholder="1234 5678 9012 3456"
                value={cardNum} onChange={(v) => setCardNum(formatCardNumber(v))} maxLength={19} />
              {errors.cardNum && <p className="text-red-400 text-xs -mt-2">{errors.cardNum}</p>}

              <InputField label="Nombre del titular" placeholder="Como figura en la tarjeta"
                value={cardName} onChange={setCardName} />
              {errors.cardName && <p className="text-red-400 text-xs -mt-2">{errors.cardName}</p>}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <InputField label="Vencimiento" placeholder="MM/AA"
                    value={cardExpiry} onChange={(v) => setCardExpiry(formatExpiry(v))} maxLength={5} />
                  {errors.expiry && <p className="text-red-400 text-xs mt-1">{errors.expiry}</p>}
                </div>
                <div>
                  <InputField label="Código de seguridad" placeholder="•••"
                    value={cardCvv} onChange={setCardCvv} type="password" maxLength={4} />
                  {errors.cvv && <p className="text-red-400 text-xs mt-1">{errors.cvv}</p>}
                </div>
              </div>

              <div className="flex items-center gap-2 text-white/30 text-xs py-1">
                <Shield className="h-3.5 w-3.5 text-green-500/60 flex-shrink-0" />
                Tus datos están protegidos con encriptación SSL
              </div>

              <div className="flex gap-2 pt-1">
                <button onClick={() => { setStep("method"); setErrors({}) }}
                  className="px-4 py-3 rounded-xl text-sm font-semibold text-white/50 hover:text-white border border-white/10 hover:bg-white/5 transition-all">
                  Volver
                </button>
                <Button onClick={handleCardPay}
                  className="flex-1 h-12 font-bold border-0"
                  style={{ background: "linear-gradient(135deg, #001C55, #B744B8)" }}>
                  <Lock className="h-4 w-4 mr-2" />
                  Pagar {formatPrice(event.price)}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2b: Mercado Pago */}
          {step === "mp-confirm" && (
            <div className="mt-5 space-y-4">
              <div className="p-5 rounded-2xl relative overflow-hidden"
                style={{ background: "linear-gradient(135deg, #009ee3 0%, #0066cc 100%)" }}>
                <div className="absolute top-0 right-0 w-20 h-20 opacity-15"
                  style={{ backgroundImage: "radial-gradient(circle, white 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-blue-600 text-sm">MP</div>
                  <div>
                    <p className="text-white font-black text-base">Mercado Pago</p>
                    <p className="text-white/70 text-xs">Pago seguro</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/70 text-xs uppercase tracking-wider">Monto</p>
                    <p className="text-white font-black text-2xl">{formatPrice(event.price)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/70 text-xs uppercase tracking-wider">Concepto</p>
                    <p className="text-white font-semibold text-sm">Entrada Red Show</p>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl text-white/40 text-xs flex items-start gap-2"
                style={{ background: "rgba(0,158,227,0.08)", border: "1px solid rgba(0,158,227,0.2)" }}>
                <Shield className="h-3.5 w-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                Al hacer clic serás redirigido a Mercado Pago para completar el pago de forma segura.
              </div>

              <div className="flex gap-2">
                <button onClick={() => setStep("method")}
                  className="px-4 py-3 rounded-xl text-sm font-semibold text-white/50 hover:text-white border border-white/10 hover:bg-white/5 transition-all">
                  Volver
                </button>
                <Button onClick={handleMpPay} className="flex-1 h-12 font-bold border-0"
                  style={{ background: "linear-gradient(135deg, #009ee3, #0066cc)" }}>
                  Pagar con Mercado Pago
                </Button>
              </div>
            </div>
          )}

          {/* PROCESSING */}
          {step === "processing" && (
            <div className="flex flex-col items-center justify-center py-12 gap-5">
              <div className="relative">
                <div className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, rgba(183,68,184,0.2), rgba(0,28,85,0.2))", border: "2px solid rgba(183,68,184,0.3)" }}>
                  <Loader2 className="h-7 w-7 text-purple-400 animate-spin" />
                </div>
                <div className="absolute inset-0 rounded-full animate-ping"
                  style={{ border: "1px solid rgba(183,68,184,0.2)" }} />
              </div>
              <div className="text-center">
                <p className="font-bold text-white text-base">Procesando pago...</p>
                <p className="text-white/40 text-sm mt-1">No cierres esta ventana</p>
              </div>
            </div>
          )}

          {/* SUCCESS */}
          {step === "success" && ticketData && (
            <div className="flex flex-col items-center text-center px-4 py-8 gap-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.2), rgba(22,163,74,0.1))", border: "2px solid rgba(34,197,94,0.3)" }}>
                  <CheckCircle className="h-9 w-9 text-green-400" />
                </div>
              </div>
              <div>
                <h3 className="font-black text-white text-xl mb-1">¡Entrada confirmada!</h3>
                <p className="text-green-400 font-semibold text-sm mb-3">Tu pago fue procesado exitosamente</p>
                <p className="text-white/45 text-sm">
                  Tu entrada fue enviada a <span className="text-white font-semibold">{userEmail}</span>. También podés verla en "Mis Entradas".
                </p>
              </div>

              {/* QR */}
              <div className="w-full p-4 rounded-2xl flex flex-col items-center gap-3"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div className="flex items-center gap-2 text-white/60 text-sm mb-1">
                  <QrCode className="h-4 w-4 text-purple-400" />
                  <span>Código QR de tu entrada</span>
                </div>
                <div className="p-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.95)" }}>
                  <QRDisplay qrCode={ticketData.qrCode} size={140} />
                </div>
                <p className="text-white/25 text-xs font-mono">{ticketData.qrCode}</p>
                <p className="text-white/40 text-xs">Presentá este código en la entrada del evento</p>
              </div>

              <Button onClick={handleSuccessClose}
                className="w-full h-12 font-bold border-0"
                style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
                Ver mis entradas
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
