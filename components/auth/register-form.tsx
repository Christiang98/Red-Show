"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { PasswordStrengthIndicator } from "@/components/auth/password-strength-indicator"
import { validatePassword } from "@/lib/password-validator"
import { Eye, EyeOff } from "lucide-react"

type UserRole = "owner" | "artist" | "user"

export function RegisterForm() {
  const [step, setStep] = useState(1)
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  })
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole)
    setStep(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const passwordValidation = validatePassword(formData.password)
    if (!passwordValidation.isValid) {
      setError(
        "La contraseña no cumple los requisitos de seguridad. Debe tener al menos 8 caracteres y cumplir con al menos 4 de los 5 requisitos mostrados.",
      )
      return
    }

    if (!acceptedTerms) {
      setError("Debes aceptar los Términos y Condiciones para registrarte.")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    setLoading(true)

    try {
      console.log("[v0] Iniciando registro con email:", formData.email)

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          role: role || "artist",
        }),
      })

      console.log("[v0] Response status:", response.status)

      if (!response.ok) {
        const data = await response.json()
        console.log("[v0] Error response:", data)
        throw new Error(data.error || "Error al registrarse")
      }

      const data = await response.json()
      console.log("[v0] Registro exitoso:", data)

      setSuccessMessage("Cuenta creada exitosamente. Redirigiendo a login...")

      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (err: any) {
      const errorMessage = err.message || "Error al registrarse"
      setError(errorMessage)
      console.error("[v0] Error en registro:", errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <Link href="/" className="inline-flex items-center text-secondary hover:text-secondary/80 mb-6 transition">
            ← Volver al Inicio
          </Link>
          
          <div className="text-center mb-8">
            <img 
              src="/logo-redshow.png" 
              alt="Red Show" 
              className="h-20 w-auto mx-auto mb-4 object-contain"
            />
            <p className="text-muted-foreground">Elige tu tipo de cuenta</p>
          </div>

          <div className="space-y-4">
            {[
              { id: "owner" as UserRole, title: "Dueño de Establecimiento", desc: "Ofrece tu espacio para eventos" },
              { id: "artist" as UserRole, title: "Artista o Emprendedor", desc: "Ofrece tus servicios" },
              { id: "user" as UserRole, title: "Usuario Común", desc: "Explorá eventos y contratá artistas o locales" },
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => handleRoleSelect(option.id)}
                className="w-full p-4 border-2 border-border rounded-lg hover:border-secondary hover:bg-secondary/5 transition text-left"
              >
                <div className="font-semibold text-primary">{option.title}</div>
                <div className="text-sm text-muted-foreground">{option.desc}</div>
              </button>
            ))}
          </div>

          <p className="text-center text-muted-foreground mt-8">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-secondary hover:underline font-semibold">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl p-8">
        <div className="mb-8">
          <button onClick={() => setStep(1)} className="text-secondary hover:underline text-sm mb-4 inline-block">
            ← Volver
          </button>
          <h1 className="text-3xl font-bold text-primary">Crear tu cuenta</h1>
          <p className="text-muted-foreground mt-2">Completa los datos para comenzar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {successMessage}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Nombre</label>
              <Input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="Tu nombre"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Apellido</label>
              <Input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Tu apellido"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Email</label>
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="tu@email.com"
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Contraseña</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <PasswordStrengthIndicator password={formData.password} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Confirmar Contraseña</label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Teléfono</label>
            <Input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="+54 9 1234 56789"
            />
          </div>

          {/* Términos y Condiciones */}
          <div className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all ${acceptedTerms ? 'border-primary bg-primary/5' : 'border-border bg-muted/30'}`}>
            <input
              type="checkbox"
              id="acceptTerms"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 w-5 h-5 accent-primary flex-shrink-0 cursor-pointer"
            />
            <label htmlFor="acceptTerms" className="text-sm text-foreground cursor-pointer leading-relaxed">
              He leído y acepto los{" "}
              <Link
                href="/terms"
                target="_blank"
                className="text-secondary font-semibold hover:underline"
              >
                Términos y Condiciones
              </Link>{" "}
              de uso de Red Show. Entiendo que mi información será tratada según la política de privacidad de la plataforma.
            </label>
          </div>

          <div className="pt-4 flex gap-4">
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
              disabled={loading || !acceptedTerms}
            >
              {loading ? "Registrando..." : "Crear Cuenta"}
            </Button>
            <Button type="button" variant="outline" className="flex-1 bg-transparent" onClick={() => setStep(1)}>
              Atrás
            </Button>
          </div>
        </form>

        <p className="text-center text-muted-foreground mt-6 text-sm">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-secondary hover:underline font-semibold">
            Inicia sesión aquí
          </Link>
        </p>
      </Card>
    </div>
  )
}
