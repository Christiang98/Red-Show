"use client"

import { useState } from "react"
import { X, CreditCard, Smartphone, CheckCircle, Loader2, Lock, Shield, Crown, UserPlus, LogIn, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { login, register, getCurrentUser } from "@/lib/auth"
import { validatePassword } from "@/lib/password-validator"

interface Plan {
  name: string
  price: string
  gradient: string
  planType: string
}

interface SubscriptionModalProps {
  plan: Plan
  onClose: () => void
  onSuccess: () => void
}

type FlowStep = "account-check" | "login" | "register" | "payment-method" | "card-form" | "mp-confirm" | "processing" | "success"
type PaymentMethod = "debit" | "credit" | "mercadopago" | null

function InputField({
  label, placeholder, value, onChange, type = "text", maxLength
}: {
  label: string; placeholder: string; value: string; onChange: (v: string) => void
  type?: string; maxLength?: number
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">{label}</label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} maxLength={maxLength}
        className="w-full px-4 py-3 rounded-xl text-sm font-medium text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all"
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

export function SubscriptionModal({ plan, onClose, onSuccess }: SubscriptionModalProps) {
  const { toast } = useToast()
  const [step, setStep] = useState<FlowStep>("account-check")
  const [method, setMethod] = useState<PaymentMethod>(null)
  const [loggedUser, setLoggedUser] = useState<any>(null)

  // Login form
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)

  // Register form
  const [regFirstName, setRegFirstName] = useState("")
  const [regLastName, setRegLastName] = useState("")
  const [regEmail, setRegEmail] = useState("")
  const [regPassword, setRegPassword] = useState("")
  const [regConfirmPassword, setRegConfirmPassword] = useState("")
  const [regPhone, setRegPhone] = useState("")
  const [regRole, setRegRole] = useState<"artist" | "owner">("artist")
  const [regLoading, setRegLoading] = useState(false)

  // Card form
  const [cardNum, setCardNum] = useState("")
  const [cardName, setCardName] = useState("")
  const [cardExpiry, setCardExpiry] = useState("")
  const [cardCvv, setCardCvv] = useState("")
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({})

  // Determine the required role for this plan
  const planRequiredRole: "artist" | "owner" | null =
    plan.planType === "artist" ? "artist" :
    plan.planType === "owner" ? "owner" : null

  const handleHasAccount = (has: boolean) => {
    // Check if already logged in
    const currentUser = getCurrentUser()
    if (currentUser) {
      setLoggedUser(currentUser)
      setStep("payment-method")
      return
    }
    if (!has) {
      // When registering, lock role to plan's required role
      if (planRequiredRole) setRegRole(planRequiredRole)
    }
    setStep(has ? "login" : "register")
  }

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      toast({ title: "Completá todos los campos", variant: "destructive" })
      return
    }
    setLoginLoading(true)
    const result = await login(loginEmail, loginPassword)
    setLoginLoading(false)
    if (!result.success) {
      toast({ title: "Error al iniciar sesión", description: result.message, variant: "destructive" })
      return
    }
    // Check role compatibility
    if (planRequiredRole && result.user?.role !== planRequiredRole) {
      const roleLabel = planRequiredRole === "artist" ? "artista" : "dueño de establecimiento"
      toast({
        title: "Plan incompatible con tu cuenta",
        description: `Este plan es exclusivo para ${roleLabel}s. Tu cuenta tiene un rol diferente.`,
        variant: "destructive"
      })
      return
    }
    // Save to localStorage
    localStorage.setItem("authToken", result.token || "")
    localStorage.setItem("userData", JSON.stringify(result.user))
    setLoggedUser(result.user)
    setStep("payment-method")
  }

  const handleRegister = async () => {
    if (!regFirstName || !regLastName || !regEmail || !regPassword || !regConfirmPassword || !regPhone) {
      toast({ title: "Completá todos los campos", variant: "destructive" })
      return
    }
    if (regPassword !== regConfirmPassword) {
      toast({ title: "Las contraseñas no coinciden", variant: "destructive" })
      return
    }
    const passwordValidation = validatePassword(regPassword)
    if (!passwordValidation.isValid) {
      toast({
        title: "Contraseña insegura",
        description: "Debe tener al menos 8 caracteres y cumplir con al menos 4 de los 5 requisitos de seguridad.",
        variant: "destructive"
      })
      return
    }
    setRegLoading(true)
    const result = await register({ email: regEmail, password: regPassword, firstName: regFirstName, lastName: regLastName, role: regRole, phone: regPhone })
    setRegLoading(false)
    if (!result.success) {
      toast({ title: "Error al registrarse", description: result.message, variant: "destructive" })
      return
    }
    // Auto login after register
    const loginResult = await login(regEmail, regPassword)
    if (loginResult.success) {
      localStorage.setItem("authToken", loginResult.token || "")
      localStorage.setItem("userData", JSON.stringify(loginResult.user))
      setLoggedUser(loginResult.user)
    }
    setStep("payment-method")
  }

  const handleContinuePayment = () => {
    if (!method) return
    setStep(method === "mercadopago" ? "mp-confirm" : "card-form")
  }

  const validateCard = () => {
    const errs: Record<string, string> = {}
    if (cardNum.replace(/\s/g, "").length < 16) errs.cardNum = "Ingresá los 16 dígitos"
    if (!cardName.trim()) errs.cardName = "Ingresá el nombre del titular"
    if (cardExpiry.length < 5) errs.expiry = "Formato MM/AA"
    if (cardCvv.length < 3) errs.cvv = "Mínimo 3 dígitos"
    setCardErrors(errs)
    return Object.keys(errs).length === 0
  }

  const processPayment = async () => {
    setStep("processing")
    await new Promise(r => setTimeout(r, 1800))

    try {
      const user = loggedUser || getCurrentUser()
      if (!user) throw new Error("Usuario no autenticado")

      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          planName: plan.name,
          planType: plan.planType,
          price: plan.price,
          paymentMethod: method === "debit" ? "Tarjeta de débito"
            : method === "credit" ? "Tarjeta de crédito"
            : "Mercado Pago",
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al procesar")
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

  const displayPrice = plan.price.replace("/mes", "").trim()

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
                style={{ background: `linear-gradient(135deg, #B744B8, #7a1a8a)` }}>
                <Crown className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="font-black text-white text-base leading-tight">Plan {plan.name}</h2>
                <p className="text-white/35 text-xs">{plan.price}</p>
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

        <div className="px-6 pb-6">

          {/* ━━━ STEP: account-check ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {step === "account-check" && (() => {
            const currentUser = getCurrentUser()
            if (currentUser && planRequiredRole && currentUser.role !== planRequiredRole) {
              const planRoleLabel = planRequiredRole === "artist" ? "artistas" : "dueños de establecimiento"
              return (
                <div className="mt-6 space-y-4">
                  <div className="flex flex-col items-center gap-4 py-6">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center"
                      style={{ background: "rgba(239,68,68,0.15)", border: "2px solid rgba(239,68,68,0.3)" }}>
                      <AlertCircle className="h-7 w-7 text-red-400" />
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-white text-base mb-2">Plan incompatible</p>
                      <p className="text-white/60 text-sm leading-relaxed">
                        Este plan es exclusivo para <strong className="text-white">{planRoleLabel}</strong>.<br />
                        Tu cuenta actual no puede adquirirlo.
                      </p>
                    </div>
                    <button onClick={onClose}
                      className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white/60 hover:text-white border border-white/10 hover:bg-white/5 transition-all">
                      Cerrar
                    </button>
                  </div>
                </div>
              )
            }
            return (
              <div className="mt-6 space-y-4">
                <div className="text-center mb-6">
                  <p className="text-white/70 text-sm">Para suscribirte al plan <strong className="text-white">{plan.name}</strong>, necesitás tener una cuenta en Red Show.</p>
                </div>
                <p className="text-white/50 text-sm font-semibold text-center">¿Ya tenés cuenta?</p>
                <button
                  onClick={() => handleHasAccount(true)}
                  className="w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all text-left"
                  style={{ background: "rgba(183,68,184,0.1)", border: "1px solid rgba(183,68,184,0.3)" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #B744B8, #7a1a8a)" }}>
                    <LogIn className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">Sí, tengo cuenta</p>
                    <p className="text-white/40 text-xs">Iniciar sesión y continuar</p>
                  </div>
                </button>
                <button
                  onClick={() => handleHasAccount(false)}
                  className="w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all text-left"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: "rgba(255,255,255,0.06)" }}>
                    <UserPlus className="h-5 w-5 text-white/60" />
                  </div>
                  <div>
                    <p className="font-bold text-white/80 text-sm">No, quiero registrarme</p>
                    <p className="text-white/40 text-xs">Crear cuenta y suscribirme</p>
                  </div>
                </button>
              </div>
            )
          })()}

          {/* ━━━ STEP: login ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {step === "login" && (
            <div className="mt-6 space-y-4">
              <p className="text-white/60 text-sm text-center mb-4">Iniciá sesión para continuar</p>
              <InputField label="Email" placeholder="tu@email.com" value={loginEmail} onChange={setLoginEmail} type="email" />
              <InputField label="Contraseña" placeholder="••••••••" value={loginPassword} onChange={setLoginPassword} type="password" />
              <Button onClick={handleLogin} disabled={loginLoading}
                className="w-full h-12 font-bold border-0 disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #001C55, #B744B8)" }}>
                {loginLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <LogIn className="h-4 w-4 mr-2" />}
                Iniciar sesión
              </Button>
              <button onClick={() => setStep("account-check")}
                className="w-full text-center text-white/40 text-sm hover:text-white/70 transition-colors">
                ← Volver
              </button>
            </div>
          )}

          {/* ━━━ STEP: register ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {step === "register" && (() => {
            const pwCheck = validatePassword(regPassword)
            const pwStrengthColor = pwCheck.strength === "strong" ? "#22c55e" : pwCheck.strength === "medium" ? "#eab308" : "#ef4444"
            const pwStrengthWidth = pwCheck.strength === "strong" ? "100%" : pwCheck.strength === "medium" ? "66%" : regPassword ? "33%" : "0%"
            return (
              <div className="mt-6 space-y-3">
                <p className="text-white/60 text-sm text-center mb-4">Creá tu cuenta gratis</p>
                <div className="grid grid-cols-2 gap-3">
                  <InputField label="Nombre" placeholder="Juan" value={regFirstName} onChange={setRegFirstName} />
                  <InputField label="Apellido" placeholder="Pérez" value={regLastName} onChange={setRegLastName} />
                </div>
                <InputField label="Email" placeholder="tu@email.com" value={regEmail} onChange={setRegEmail} type="email" />
                <InputField label="Teléfono" placeholder="+54 9 1234 56789" value={regPhone} onChange={setRegPhone} type="tel" />
                <div>
                  <InputField label="Contraseña" placeholder="Mínimo 8 caracteres" value={regPassword} onChange={setRegPassword} type="password" />
                  {regPassword && (
                    <div className="mt-2 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/40">Seguridad</span>
                        <span className="text-xs font-medium" style={{ color: pwStrengthColor }}>{pwCheck.message}</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                        <div className="h-full rounded-full transition-all duration-300" style={{ width: pwStrengthWidth, background: pwStrengthColor }} />
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 pt-1">
                        {[
                          { ok: pwCheck.checks.minLength, text: "8+ caracteres" },
                          { ok: pwCheck.checks.hasUppercase, text: "Mayúscula" },
                          { ok: pwCheck.checks.hasLowercase, text: "Minúscula" },
                          { ok: pwCheck.checks.hasNumber, text: "Número" },
                          { ok: pwCheck.checks.hasSpecialChar, text: "Carácter especial" },
                        ].map(({ ok, text }) => (
                          <div key={text} className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: ok ? "#22c55e" : "rgba(255,255,255,0.2)" }} />
                            <span className="text-xs" style={{ color: ok ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)" }}>{text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <InputField label="Confirmar contraseña" placeholder="••••••••" value={regConfirmPassword} onChange={setRegConfirmPassword} type="password" />
                  {regConfirmPassword && regPassword !== regConfirmPassword && (
                    <p className="text-red-400 text-xs mt-1">Las contraseñas no coinciden</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Tipo de cuenta</label>
                  {planRequiredRole ? (
                    <div className="py-2.5 px-4 rounded-xl text-sm font-semibold text-center"
                      style={{ background: "rgba(183,68,184,0.15)", border: "1px solid rgba(183,68,184,0.5)", color: "white" }}>
                      {planRequiredRole === "artist" ? "🎤 Artista" : "🏢 Dueño de Establecimiento"}
                      <p className="text-white/40 text-xs font-normal mt-0.5">Requerido por este plan</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {[{ id: "artist", label: "Artista" }, { id: "owner", label: "Propietario" }].map(r => (
                        <button key={r.id} onClick={() => setRegRole(r.id as any)}
                          className="py-2.5 rounded-xl text-sm font-semibold transition-all"
                          style={{
                            background: regRole === r.id ? "rgba(183,68,184,0.15)" : "rgba(255,255,255,0.04)",
                            border: regRole === r.id ? "1px solid rgba(183,68,184,0.5)" : "1px solid rgba(255,255,255,0.08)",
                            color: regRole === r.id ? "white" : "rgba(255,255,255,0.6)"
                          }}>
                          {r.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Button onClick={handleRegister} disabled={regLoading}
                  className="w-full h-12 font-bold border-0 disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, #001C55, #B744B8)" }}>
                  {regLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                  Crear cuenta y continuar
                </Button>
                <button onClick={() => setStep("account-check")}
                  className="w-full text-center text-white/40 text-sm hover:text-white/70 transition-colors">
                  ← Volver
                </button>
              </div>
            )
          })()}

          {/* ━━━ STEP: payment-method ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {step === "payment-method" && (
            <div className="mt-5">
              {/* Summary */}
              <div className="p-4 rounded-2xl mb-5"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Resumen de suscripción</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold">Plan {plan.name}</p>
                    <p className="text-white/40 text-xs">Válido por 1 mes · Se renueva manualmente</p>
                  </div>
                  <span className="text-2xl font-black text-white">{displayPrice}</span>
                </div>
              </div>
              <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">Método de pago</p>
              <div className="space-y-2">
                {[
                  { id: "debit", label: "Tarjeta de débito", icon: <CreditCard className="h-5 w-5" /> },
                  { id: "credit", label: "Tarjeta de crédito", icon: <CreditCard className="h-5 w-5" /> },
                  { id: "mercadopago", label: "Mercado Pago", icon: <Smartphone className="h-5 w-5" /> },
                ].map(({ id, label, icon }) => (
                  <button key={id} onClick={() => setMethod(id as PaymentMethod)}
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
              <Button onClick={handleContinuePayment} disabled={!method}
                className="w-full h-12 mt-5 font-bold border-0 disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #001C55, #B744B8)" }}>
                Continuar
              </Button>
            </div>
          )}

          {/* ━━━ STEP: card-form ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
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
                  <p className="text-white font-mono text-lg tracking-widest">{cardNum || "•••• •••• •••• ••••"}</p>
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
              {cardErrors.cardNum && <p className="text-red-400 text-xs -mt-2">{cardErrors.cardNum}</p>}

              <InputField label="Nombre del titular" placeholder="Como figura en la tarjeta"
                value={cardName} onChange={setCardName} />
              {cardErrors.cardName && <p className="text-red-400 text-xs -mt-2">{cardErrors.cardName}</p>}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <InputField label="Vencimiento" placeholder="MM/AA"
                    value={cardExpiry} onChange={(v) => setCardExpiry(formatExpiry(v))} maxLength={5} />
                  {cardErrors.expiry && <p className="text-red-400 text-xs mt-1">{cardErrors.expiry}</p>}
                </div>
                <div>
                  <InputField label="Código" placeholder="•••"
                    value={cardCvv} onChange={setCardCvv} type="password" maxLength={4} />
                  {cardErrors.cvv && <p className="text-red-400 text-xs mt-1">{cardErrors.cvv}</p>}
                </div>
              </div>

              <div className="flex items-center gap-2 text-white/30 text-xs py-1">
                <Shield className="h-3.5 w-3.5 text-green-500/60 flex-shrink-0" />
                Tus datos están protegidos con encriptación SSL
              </div>

              <div className="flex gap-2 pt-1">
                <button onClick={() => { setStep("payment-method"); setCardErrors({}) }}
                  className="px-4 py-3 rounded-xl text-sm font-semibold text-white/50 hover:text-white border border-white/10 hover:bg-white/5 transition-all">
                  Volver
                </button>
                <Button onClick={handleCardPay}
                  className="flex-1 h-12 font-bold border-0"
                  style={{ background: "linear-gradient(135deg, #001C55, #B744B8)" }}>
                  <Lock className="h-4 w-4 mr-2" />
                  Pagar {displayPrice}
                </Button>
              </div>
            </div>
          )}

          {/* ━━━ STEP: mp-confirm ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {step === "mp-confirm" && (
            <div className="mt-5 space-y-4">
              <div className="p-5 rounded-2xl relative overflow-hidden"
                style={{ background: "linear-gradient(135deg, #009ee3 0%, #0066cc 100%)" }}>
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
                    <p className="text-white font-black text-2xl">{displayPrice}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/70 text-xs uppercase tracking-wider">Plan</p>
                    <p className="text-white font-semibold text-sm">{plan.name} · 1 mes</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStep("payment-method")}
                  className="px-4 py-3 rounded-xl text-sm font-semibold text-white/50 hover:text-white border border-white/10 hover:bg-white/5 transition-all">
                  Volver
                </button>
                <Button onClick={processPayment} className="flex-1 h-12 font-bold border-0"
                  style={{ background: "linear-gradient(135deg, #009ee3, #0066cc)" }}>
                  Pagar con Mercado Pago
                </Button>
              </div>
            </div>
          )}

          {/* ━━━ PROCESSING ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {step === "processing" && (
            <div className="flex flex-col items-center justify-center py-12 gap-5">
              <div className="relative">
                <div className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, rgba(183,68,184,0.2), rgba(0,28,85,0.2))", border: "2px solid rgba(183,68,184,0.3)" }}>
                  <Loader2 className="h-7 w-7 text-purple-400 animate-spin" />
                </div>
              </div>
              <div className="text-center">
                <p className="font-bold text-white text-base">Procesando pago...</p>
                <p className="text-white/40 text-sm mt-1">No cierres esta ventana</p>
              </div>
            </div>
          )}

          {/* ━━━ SUCCESS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {step === "success" && (
            <div className="flex flex-col items-center text-center px-4 py-10 gap-5">
              <div className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.2), rgba(22,163,74,0.1))", border: "2px solid rgba(34,197,94,0.3)" }}>
                <CheckCircle className="h-9 w-9 text-green-400" />
              </div>
              <div>
                <h3 className="font-black text-white text-xl mb-1">¡Suscripción activada!</h3>
                <p className="text-green-400 font-semibold text-sm mb-3">Plan {plan.name} activo por 30 días</p>
                <p className="text-white/45 text-sm leading-relaxed">
                  Tu suscripción está activa. Podés ver los días restantes en tu dashboard.
                </p>
              </div>
              <div className="w-full p-4 rounded-2xl text-left"
                style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)" }}>
                {[["Plan activado", `${plan.name}`], ["Duración", "30 días"], ["Estado", "Activo ✓"]].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between text-sm py-1">
                    <span className="text-white/50">{k}</span>
                    <span className="text-white font-semibold">{v}</span>
                  </div>
                ))}
              </div>
              <Button onClick={() => { onSuccess(); onClose() }}
                className="w-full h-12 font-bold border-0"
                style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
                Ir al dashboard
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
