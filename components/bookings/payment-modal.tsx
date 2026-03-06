"use client"

import { useState } from "react"
import { CreditCard, Smartphone, CheckCircle, Loader2, X, Lock, Shield, User, Calendar, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface PaymentModalProps {
  bookingId: string
  bookingTitle: string
  artistName: string
  bookingDate?: string
  onSuccess: () => void
  onClose: () => void
}

type PaymentMethod = "debit" | "credit" | "mercadopago" | null
type Step = "method" | "card-form" | "mp-confirm" | "processing" | "success"

function InputField({
  label, placeholder, value, onChange, type = "text", maxLength, pattern
}: {
  label: string; placeholder: string; value: string; onChange: (v: string) => void;
  type?: string; maxLength?: number; pattern?: string
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

export function PaymentModal({ bookingId, bookingTitle, artistName, bookingDate, onSuccess, onClose }: PaymentModalProps) {
  const { toast } = useToast()
  const [method, setMethod] = useState<PaymentMethod>(null)
  const [step, setStep]     = useState<Step>("method")
  const [cardNum, setCardNum]     = useState("")
  const [cardName, setCardName]   = useState("")
  const [cardExpiry, setCardExpiry] = useState("")
  const [cardCvv, setCardCvv]     = useState("")
  const [errors, setErrors]       = useState<Record<string, string>>({})

  const displayDate = bookingDate
    ? (() => {
        // Avoid UTC offset: parse YYYY-MM-DD as local date
        if (/^\d{4}-\d{2}-\d{2}$/.test(bookingDate)) {
          const [y, m, d] = bookingDate.split("-").map(Number)
          return new Date(y, m - 1, d).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })
        }
        return new Date(bookingDate).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })
      })()
    : "A definir"

  // ── Validación de tarjeta ──────────────────────────────────────────────────
  const validateCard = () => {
    const errs: Record<string, string> = {}
    if (cardNum.replace(/\s/g, "").length < 16) errs.cardNum  = "Ingresá los 16 dígitos"
    if (!cardName.trim())                        errs.cardName = "Ingresá el nombre del titular"
    if (cardExpiry.length < 5)                   errs.expiry   = "Formato MM/AA"
    if (cardCvv.length < 3)                      errs.cvv      = "Mínimo 3 dígitos"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // ── Procesar pago ──────────────────────────────────────────────────────────
  const processPayment = async () => {
    setStep("processing")
    await new Promise(r => setTimeout(r, 1600)) // simular latencia

    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          simulatePayment: true,
          paymentMethod: method === "debit" ? "Tarjeta de débito"
                       : method === "credit" ? "Tarjeta de crédito"
                       : "Mercado Pago",
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al procesar el pago")
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

  const handleMpPay = () => {
    processPayment()
  }

  const handleContinue = () => {
    if (!method) return
    setStep(method === "mercadopago" ? "mp-confirm" : "card-form")
  }

  const handleSuccessClose = () => {
    onSuccess()
    onClose()
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)" }}>

      <div className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
           style={{ background: "linear-gradient(160deg, #0d1022 0%, #080b14 100%)", border: "1px solid rgba(255,255,255,0.1)" }}>

        {/* ── Header ── */}
        {step !== "success" && (
          <div className="flex items-center justify-between px-6 py-4"
               style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                   style={{ background: "linear-gradient(135deg, #B744B8, #7a1a8a)" }}>
                <Lock className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="font-black text-white text-base leading-tight">Confirmar pago</h2>
                <p className="text-white/35 text-xs">Tarifa de gestión Red Show</p>
              </div>
            </div>
            {step !== "processing" && (
              <button onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/8 transition-all">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* ── Resumen (siempre visible excepto en success y processing full) ── */}
        {(step === "method" || step === "card-form" || step === "mp-confirm") && (
          <div className="mx-6 mt-5 p-4 rounded-2xl"
               style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="section-label mb-3">Resumen</p>
            <div className="space-y-2">
              {[
                { icon: <User className="h-3.5 w-3.5 text-purple-400" />, label: "Artista", value: artistName },
                { icon: <Calendar className="h-3.5 w-3.5 text-blue-400" />, label: "Fecha del evento", value: displayDate },
                { icon: <DollarSign className="h-3.5 w-3.5 text-green-400" />, label: "Tarifa de gestión", value: "$4.200" },
                { icon: <Shield className="h-3.5 w-3.5 text-yellow-400" />, label: "Concepto", value: "Confirmación de contratación" },
              ].map(({ icon, label, value }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-white/45">
                    {icon} {label}
                  </span>
                  <span className="font-semibold text-white">{value}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 flex items-center justify-between"
                 style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <span className="text-white/50 text-sm font-semibold">Total a pagar</span>
              <span className="text-2xl font-black" style={{ background: "linear-gradient(135deg, #fff, #B744B8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                $4.200
              </span>
            </div>
          </div>
        )}

        <div className="px-6 pb-6">

          {/* ━━━ STEP 1: Elegir método ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {step === "method" && (
            <div className="mt-5">
              <p className="section-label mb-3">Método de pago</p>
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

          {/* ━━━ STEP 2a: Formulario de tarjeta ━━━━━━━━━━━━━━━━━━━━ */}
          {step === "card-form" && (
            <div className="mt-5 space-y-4">
              {/* Vista previa de tarjeta */}
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
                  Pagar $4.200
                </Button>
              </div>
            </div>
          )}

          {/* ━━━ STEP 2b: Mercado Pago ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
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
                    <p className="text-white font-black text-2xl">$4.200</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/70 text-xs uppercase tracking-wider">Concepto</p>
                    <p className="text-white font-semibold text-sm">Confirmación Red Show</p>
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

          {/* ━━━ PROCESSING ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
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

          {/* ━━━ SUCCESS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {step === "success" && (
            <div className="flex flex-col items-center text-center px-6 py-10 gap-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-full flex items-center justify-center"
                     style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.2), rgba(22,163,74,0.1))", border: "2px solid rgba(34,197,94,0.3)" }}>
                  <CheckCircle className="h-9 w-9 text-green-400" />
                </div>
                <div className="absolute inset-0 rounded-full"
                     style={{ background: "radial-gradient(circle, rgba(34,197,94,0.1) 0%, transparent 70%)" }} />
              </div>
              <div>
                <h3 className="font-black text-white text-xl mb-1">¡Pago aprobado!</h3>
                <p className="text-green-400 font-semibold text-sm mb-3">Contratación confirmada correctamente.</p>
                <p className="text-white/45 text-sm leading-relaxed">
                  El chat completo y los datos de contacto ya están disponibles. La fecha del evento quedó bloqueada.
                </p>
              </div>
              <div className="w-full p-4 rounded-2xl text-left"
                   style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)" }}>
                <div className="space-y-2">
                  {[
                    ["Chat completo habilitado", "✓"],
                    ["Datos de contacto visibles", "✓"],
                    ["Fecha bloqueada", "✓"],
                    ["Pago registrado ($4.200)", "✓"],
                  ].map(([text, check]) => (
                    <div key={text} className="flex items-center justify-between text-sm">
                      <span className="text-white/60">{text}</span>
                      <span className="text-green-400 font-bold">{check}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Button onClick={handleSuccessClose}
                className="w-full h-12 font-bold border-0"
                style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
                Ver contratación confirmada
              </Button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
